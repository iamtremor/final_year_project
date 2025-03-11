// backend/services/blockchainService.js
const ethers = require('ethers');
const crypto = require('crypto');
const EnrollmentSystemABI = require('../contracts/EnrollmentSystem.json').abi;
const config = require('../config');

class BlockchainService {
  constructor() {
    try {
      this.provider = new ethers.providers.JsonRpcProvider(config.blockchain.providerUrl);
      
      // Check if private key is available
      if (!config.blockchain.privateKey) {
        console.error('Blockchain private key is missing');
        return;
      }
      
      this.wallet = new ethers.Wallet(config.blockchain.privateKey, this.provider);
      
      // Check if contract address is available
      if (!config.blockchain.contractAddress) {
        console.error('Blockchain contract address is missing');
        return;
      }
      
      this.contract = new ethers.Contract(
        config.blockchain.contractAddress,
        EnrollmentSystemABI,
        this.wallet
      );
      
      console.log('BlockchainService initialized successfully');
    } catch (error) {
      console.error('BlockchainService initialization error:', error);
    }
  }

  /**
   * Create a SHA-256 hash of data
   * @param {Object|string|Buffer} data - Data to hash
   * @returns {string} - Hex string of the hash
   */
  createHash(data) {
    let dataToHash;
    
    if (typeof data === 'object' && !(data instanceof Buffer)) {
      dataToHash = JSON.stringify(data);
    } else {
      dataToHash = data;
    }
    
    return '0x' + crypto.createHash('sha256')
      .update(dataToHash)
      .digest('hex');
  }
/**
 * Log an action on the blockchain
 * @param {string} applicationId - The ID of the user/application (applicationId, staffId, or adminId)
 * @param {string} action - The action being performed
 * @param {string} details - Additional details about the action
 * @returns {Object} Transaction details
 */
async logAction(applicationId, action, details) {
  try {
    console.log(`Logging action for ${applicationId}: ${action} - ${details}`);
    
    // Call our new public recordAuditLog function
    const tx = await this.contract.recordAuditLog(
      applicationId,
      action,
      details,
      {
        gasLimit: 300000
      }
    );
    
    console.log(`Log action transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`Log action transaction confirmed: ${receipt.transactionHash}`);
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      action,
      details
    };
  } catch (error) {
    console.error('Error logging action on blockchain:', error);
    throw error;
  }
}
  /**
   * Register a student on the blockchain
   * @param {string} applicationId - Student's application ID
   * @param {Object} studentData - Student's personal information
   */
  async registerStudent(applicationId, studentData) {
    try {
      console.log(`Registering student ${applicationId} on blockchain...`);
      
      // Check if student already exists to avoid duplicate registration
      try {
        const student = await this.contract.students(applicationId);
        if (student.exists) {
          console.log(`Student ${applicationId} already exists on blockchain`);
          return {
            alreadyRegistered: true,
            applicationId
          };
        }
      } catch (checkError) {
        console.error('Error checking if student exists:', checkError);
        // Continue with registration attempt
      }
      
      // Create hash of student data
      const dataHash = this.createHash(studentData);
      
      // Send transaction to blockchain with gas limit
      const tx = await this.contract.registerStudent(applicationId, dataHash, {
        gasLimit: 500000 // Use an appropriate gas limit
      });
      
      console.log(`Registration transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Registration transaction confirmed: ${receipt.transactionHash}`);
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.events ? receipt.events.map(event => ({
          name: event.event,
          args: event.args
        })) : []
      };
    } catch (error) {
      console.error('Error registering student on blockchain:', error);
      throw error;
    }
  }

  /**
   * Verify a student's identity on the blockchain
   * @param {string} applicationId - Student's application ID
   */
  async verifyStudent(applicationId) {
    try {
      console.log(`Verifying student ${applicationId} on blockchain...`);
      
      // Check if student exists before verifying
      try {
        const student = await this.contract.students(applicationId);
        if (!student.exists) {
          throw new Error(`Student ${applicationId} does not exist on blockchain`);
        }
        
        if (student.verified) {
          console.log(`Student ${applicationId} is already verified`);
          return {
            alreadyVerified: true,
            applicationId
          };
        }
      } catch (checkError) {
        console.error('Error checking student status:', checkError);
        // Continue with verification attempt
      }
      
      const tx = await this.contract.verifyStudent(applicationId, {
        gasLimit: 300000 // Use an appropriate gas limit
      });
      
      console.log(`Verification transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Verification transaction confirmed: ${receipt.transactionHash}`);
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error verifying student on blockchain:', error);
      throw error;
    }
  }

  /**
   * Add a document hash to the blockchain
   * @param {string} applicationId - Student's application ID
   * @param {string} documentType - Type of document
   * @param {Buffer|string} fileContent - Document content
   */
  async addDocument(applicationId, documentType, fileContent) {
    try {
      console.log(`Adding document for ${applicationId} of type ${documentType} to blockchain...`);
      
      // First check if student exists
      try {
        const student = await this.contract.students(applicationId);
        if (!student.exists) {
          throw new Error(`Student ${applicationId} does not exist on blockchain. Documents cannot be added.`);
        }
      } catch (checkError) {
        console.error('Error checking student existence:', checkError);
        // Handle situation, maybe auto-register the student?
      }
      
      // Create hash of document content
      const documentHash = this.createHash(fileContent);
      
      // Send transaction to blockchain with gas limit
      const tx = await this.contract.addDocument(
        applicationId, 
        documentType, 
        documentHash,
        { 
          gasLimit: 500000 // Add explicit gas limit
        }
      );
      
      console.log(`Document upload transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Document upload transaction confirmed: ${receipt.transactionHash}`);
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        documentHash
      };
    } catch (error) {
      console.error('Blockchain add document error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        method: error.method,
        stack: error.stack ? error.stack.split('\n')[0] : 'No stack'
      });
      throw error;
    }
  }

  /**
   * Get document status from the blockchain
   * @param {string} applicationId - Student's application ID
   * @param {string} documentType - Type of document
   * @returns {Object} Document status and details
   */
  async getDocumentStatus(applicationId, documentType) {
    try {
      console.log(`Getting document status from blockchain:`, {
        applicationId,
        documentType
      });
      
      // Get document from blockchain
      const document = await this.contract.documents(applicationId, documentType);
      
      // Check if document exists
      if (!document.exists) {
        return {
          exists: false,
          documentHash: null,
          status: null,
          uploadTime: null,
          reviewTime: null
        };
      }
      
      // Return document status
      return {
        exists: true,
        documentHash: document.documentHash,
        documentType: document.documentType,
        status: document.status,
        reviewedBy: document.reviewedBy,
        uploadTime: document.uploadTime,
        reviewTime: document.reviewTime,
        rejectionReason: document.rejectionReason
      };
    } catch (error) {
      console.error(`Error getting document status from blockchain:`, error);
      // Return a default object with exists=false
      return {
        exists: false,
        documentHash: null,
        status: null,
        error: error.message
      };
    }
  }

  /**
   * Review a document on the blockchain
   * @param {string} applicationId - Student's application ID
   * @param {string} documentType - Type of document
   * @param {string} status - Document status (approved/rejected)
   * @param {string} rejectionReason - Reason for rejection if applicable
   */
  async reviewDocument(applicationId, documentType, status, rejectionReason = "") {
    try {
      console.log(`Reviewing document for ${applicationId} of type ${documentType} with status ${status}...`);
      
      // First check if document exists
      try {
        const doc = await this.contract.documents(applicationId, documentType);
        if (!doc.exists) {
          throw new Error(`Document of type ${documentType} for student ${applicationId} does not exist on blockchain.`);
        }
      } catch (checkError) {
        console.error('Error checking document existence:', checkError);
        throw checkError;
      }
      
      // Send transaction to blockchain with gas limit
      const tx = await this.contract.reviewDocument(
        applicationId, 
        documentType, 
        status, 
        rejectionReason,
        {
          gasLimit: 500000 // Add explicit gas limit
        }
      );
      
      console.log(`Document review transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Document review transaction confirmed: ${receipt.transactionHash}`);
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error reviewing document on blockchain:', error);
      throw error;
    }
  }

  /**
   * Update application status on the blockchain
   * @param {string} applicationId - Student's application ID
   * @param {string} status - Application status
   */
  async updateApplicationStatus(applicationId, status) {
    try {
      console.log(`Updating application status for ${applicationId} to ${status}...`);
      
      // First check if application exists
      try {
        const application = await this.contract.applications(applicationId);
        if (!application.exists) {
          throw new Error(`Application ${applicationId} does not exist on blockchain.`);
        }
      } catch (checkError) {
        console.error('Error checking application existence:', checkError);
        // Continue with update attempt
      }
      
      const tx = await this.contract.updateApplicationStatus(
        applicationId, 
        status,
        {
          gasLimit: 300000 // Add explicit gas limit
        }
      );
      
      console.log(`Status update transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Status update transaction confirmed: ${receipt.transactionHash}`);
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error updating application status on blockchain:', error);
      throw error;
    }
  }

  /**
   * Set a deadline for document submission
   * @param {string} applicationId - Student's application ID
   * @param {Date} deadline - Deadline date and time
   */
  async setDeadline(applicationId, deadline) {
    try {
      console.log(`Setting deadline for ${applicationId} to ${deadline}...`);
      
      // Convert deadline to Unix timestamp (seconds)
      const deadlineTimestamp = Math.floor(deadline.getTime() / 1000);
      
      const tx = await this.contract.setDeadline(
        applicationId, 
        deadlineTimestamp,
        {
          gasLimit: 300000 // Add explicit gas limit
        }
      );
      
      console.log(`Deadline set transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Deadline set transaction confirmed: ${receipt.transactionHash}`);
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        deadline: new Date(deadlineTimestamp * 1000).toISOString()
      };
    } catch (error) {
      console.error('Error setting deadline on blockchain:', error);
      throw error;
    }
  }

  /**
   * Check if document submission is within deadline
   * @param {string} applicationId - Student's application ID
   * @returns {boolean} - True if within deadline, false otherwise
   */
  async isWithinDeadline(applicationId) {
    try {
      console.log(`Checking deadline for ${applicationId}...`);
      
      // Try to get the actual deadline from the blockchain
      try {
        const result = await this.contract.isWithinDeadline(applicationId, {
          gasLimit: 200000 // Add explicit gas limit for read operations
        });
        console.log(`Deadline check result: ${result}`);
        return result;
      } catch (blockchainError) {
        console.error('Error checking deadline on blockchain:', blockchainError);
        // Fall back to true if there's an error (being permissive)
        return true;
      }
    } catch (error) {
      console.error('Error in isWithinDeadline function:', error);
      // Default to true to allow submissions in case of errors
      return true;
    }
  }

  /**
   * Get student verification status
   * @param {string} applicationId - Student's application ID
   * @returns {Object} Student status details
   */
  async getStudentStatus(applicationId) {
    try {
      console.log(`Getting student status for ${applicationId}...`);
      
      // Get student from blockchain
      const student = await this.contract.students(applicationId);
      
      return {
        exists: student.exists,
        verified: student.verified,
        dataHash: student.dataHash,
        registrationTime: student.registrationTime ? 
          new Date(student.registrationTime.toNumber() * 1000) : null
      };
    } catch (error) {
      console.error('Error getting student status from blockchain:', error);
      // Return a default object with exists=false
      return {
        exists: false,
        verified: false,
        dataHash: null,
        registrationTime: null,
        error: error.message
      };
    }
  }
  async diagnoseContract() {
    try {
      console.log("Contract address:", this.contract.address);
      console.log("Contract interface functions:", Object.keys(this.contract.interface.functions));
      console.log("Contract methods:", Object.keys(this.contract).filter(k => typeof this.contract[k] === 'function'));
      
      // Try calling a known function to test contract connectivity
      const admin = await this.contract.admin();
      console.log("Contract admin address:", admin);
      
      return {
        address: this.contract.address,
        functions: Object.keys(this.contract.interface.functions),
        methods: Object.keys(this.contract).filter(k => typeof this.contract[k] === 'function')
      };
    } catch (error) {
      console.error("Contract diagnosis error:", error);
      throw error;
    }
  }
  /**
   * Verify document integrity by comparing hashes
   * @param {string} applicationId - Student's application ID
   * @param {string} documentType - Type of document
   * @param {Buffer|string} currentFileContent - Current file content
   * @returns {Object} Verification result
   */
  async verifyDocumentIntegrity(applicationId, documentType, currentFileContent) {
    try {
      console.log(`Verifying document integrity for ${applicationId} of type ${documentType}...`);
      
      // Get document from blockchain
      const document = await this.contract.documents(applicationId, documentType);
      
      if (!document.exists) {
        return { 
          verified: false, 
          error: 'Document not found on blockchain' 
        };
      }
      
      // Calculate hash of current file
      const currentHash = this.createHash(currentFileContent);
      
      // Compare hashes
      const verified = document.documentHash === currentHash;
      
      return {
        verified,
        blockchainHash: document.documentHash,
        currentHash,
        uploadTime: document.uploadTime ? 
          new Date(document.uploadTime.toNumber() * 1000) : null
      };
    } catch (error) {
      console.error('Error verifying document integrity:', error);
      throw error;
    }
  }
}

module.exports = new BlockchainService();