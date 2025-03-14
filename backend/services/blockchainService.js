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
        gasLimit: 1000000
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
  // In backend/services/blockchainService.js, update the registerStudent function:

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
    
    // Send transaction to blockchain with higher gas limit
    const tx = await this.contract.registerStudent(applicationId, dataHash, {
      gasLimit: 1500000 // Increase gas limit from 500000 to 1000000
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
// Extending the existing blockchainService.js with staff and admin registration

// Add these functions to your existing blockchainService.js file

/**
 * Register a staff member on the blockchain
 * @param {string} staffId - Staff ID
 * @param {Object} staffData - Staff member's information
 */
/**
 * Register a staff member on the blockchain
 * @param {string} staffId - Staff ID
 * @param {Object} staffData - Staff member's information including new fields
 */
async registerStaff(staffId, staffData) {
  try {
    console.log(`Registering staff ${staffId} on blockchain...`);
    
    // Check if user already exists on blockchain using the same structure as students
    try {
      const userStatus = await this.getUserStatus(staffId, 'staff');
      if (userStatus.exists) {
        console.log(`Staff ${staffId} already exists on blockchain`);
        return {
          alreadyRegistered: true,
          staffId
        };
      }
    } catch (checkError) {
      console.error('Error checking if staff exists:', checkError);
      // Continue with registration attempt
    }
    
    // Create hash of staff data
    const dataHash = this.createHash(staffData);
    
    // Register on blockchain with higher gas limit
    const tx = await this.contract.registerUser(
      `staff:${staffId}`, 
      "staff",
      dataHash, 
      {
        gasLimit: 1000000 // Increased gas limit to prevent out of gas errors
      }
    );
    
    console.log(`Staff registration transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`Staff registration transaction confirmed: ${receipt.transactionHash}`);
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  } catch (error) {
    console.error('Error registering staff on blockchain:', error);
    throw error;
  }
}

/**
 * Register an admin on the blockchain
 * @param {string} adminId - Admin ID
 * @param {Object} adminData - Admin's information
 */
async registerAdmin(adminId, adminData) {
  try {
    console.log(`Registering admin ${adminId} on blockchain...`);
    
    // Check if user already exists on blockchain
    try {
      const userStatus = await this.getUserStatus(adminId, 'admin');
      if (userStatus.exists) {
        console.log(`Admin ${adminId} already exists on blockchain`);
        return {
          alreadyRegistered: true,
          adminId
        };
      }
    } catch (checkError) {
      console.error('Error checking if admin exists:', checkError);
      // Continue with registration attempt
    }
    
    // Create hash of admin data
    const dataHash = this.createHash(adminData);
    
    // Register on blockchain - using same function but with a different prefix
    const tx = await this.contract.registerUser(
      `admin:${adminId}`, 
      dataHash, 
      {
        gasLimit: 1000000
      }
    );
    
    console.log(`Admin registration transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`Admin registration transaction confirmed: ${receipt.transactionHash}`);
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  } catch (error) {
    console.error('Error registering admin on blockchain:', error);
    throw error;
  }
}

/**
 * Get user status from blockchain
 * @param {string} userId - User ID (staffId or adminId)
 * @param {string} role - User role ('staff' or 'admin')
 * @returns {Object} User status details
 */
/**
 * Get user status from blockchain
 * @param {string} userId - User ID (staffId, adminId, or applicationId)
 * @param {string} role - User role ('student', 'staff', or 'admin')
 * @returns {Object} User status details
 */
async getUserStatus(userId, role) {
  try {
    console.log(`Getting ${role} status for ${userId}...`);
    
    if (!this.contract) {
      console.error('Contract not initialized');
      return {
        exists: false,
        verified: false,
        dataHash: null,
        registrationTime: null,
        error: 'Blockchain contract not initialized'
      };
    }
    
    // Determine the correct key
    let key;
    let userResult;
    
    // Special handling for students to maintain backward compatibility
    if (role === 'student') {
      // Try both students and users mappings
      try {
        userResult = await this.contract.students(userId);
        
        // If students mapping doesn't work, fall back to users mapping
        if (!userResult.exists) {
          userResult = await this.contract.users(userId);
        }
      } catch (err) {
        // If students mapping fails, try users mapping
        userResult = await this.contract.users(userId);
      }
    } else {
      // For staff and admin, use the prefixed key in users mapping
      key = `${role}:${userId}`;
      userResult = await this.contract.users(key);
    }
    
    // If no result found
    if (!userResult || !userResult.exists) {
      return {
        exists: false,
        verified: false,
        dataHash: null,
        registrationTime: null
      };
    }
    
    return {
      exists: userResult.exists,
      verified: userResult.verified,
      dataHash: userResult.dataHash,
      registrationTime: userResult.registrationTime ? 
        new Date(userResult.registrationTime.toNumber() * 1000) : null,
      role: userResult.role || role
    };
  } catch (error) {
    console.error(`Error getting ${role} status from blockchain:`, error);
    return {
      exists: false,
      verified: false,
      dataHash: null,
      registrationTime: null,
      error: error.message
    };
  }
}
// Note: This implementation assumes your smart contract has a generic "registerUser" function
// that can be used for different types of users. If not, you may need to extend the smart contract
// or use the existing registerStudent function with a different naming convention.
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
        gasLimit: 1500000 // Use an appropriate gas limit
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
          gasLimit: 1000000 // Add explicit gas limit
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
          gasLimit: 1000000 // Add explicit gas limit
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
          gasLimit: 1000000 // Add explicit gas limit
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
          gasLimit: 1000000 // Add explicit gas limit
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
 /**
 * Check if document submission is within deadline
 * @param {string} applicationId - Student's application ID
 * @returns {boolean} - True if within deadline, false otherwise
 */
async isWithinDeadline(applicationId) {
  try {
    console.log(`Checking deadline for ${applicationId}...`);
    
    // First check if application exists on blockchain
    try {
      const application = await this.contract.applications(applicationId, {
        gasLimit: 1000000 // Add explicit gas limit for read operations
      });
      
      // If application doesn't exist, return true (being permissive)
      if (!application.exists) {
        console.log(`Application ${applicationId} does not exist on blockchain, defaulting to within deadline`);
        return true;
      }
      
      // If deadline is not set (is 0), also return true
      if (application.deadlineTimestamp.toNumber() === 0) {
        console.log(`No deadline set for ${applicationId}, allowing submission`);
        return true;
      }
      
      // Check if current time is before deadline
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const deadline = application.deadlineTimestamp.toNumber();
      const isWithin = now <= deadline;
      
      console.log(`Deadline check result for ${applicationId}: ${isWithin} (now: ${now}, deadline: ${deadline})`);
      return isWithin;
    } catch (error) {
      // If we get an error specifically saying "Application does not exist"
      if (error.message.includes("Application does not exist")) {
        console.log(`Application ${applicationId} confirmed not to exist on blockchain, defaulting to within deadline`);
        return true;
      }
      
      // For other types of errors, log and default to true (being permissive)
      console.error('Error checking application existence:', error);
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
      
      if (!this.contract) {
        console.error('Contract not initialized');
        return {
          exists: false,
          verified: false,
          dataHash: null,
          registrationTime: null,
          error: 'Blockchain contract not initialized'
        };
      }
      
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
  async isConnected() {
    try {
      if (!this.provider) {
        console.log("No provider configured");
        return false;
      }
      
      try {
        const network = await this.provider.getNetwork();
        console.log("Connected to network:", network.name, "chainId:", network.chainId);
        
        // Also check if contract is initialized and accessible
        if (!this.contract) {
          console.log("Contract not initialized");
          return false;
        }
        
        // Try a simple view call to verify contract access
        try {
          const admin = await this.contract.admin();
          console.log("Contract connectivity verified, admin:", admin);
          return true;
        } catch (contractError) {
          console.error("Contract connectivity test failed:", contractError.message);
          return false;
        }
      } catch (networkError) {
        console.error("Failed to get network:", networkError.message);
        return false;
      }
    } catch (error) {
      console.error("Error in isConnected:", error.message);
      return false;
    }
  }
  // Add these methods to backend/services/blockchainService.js

/**
 * Record a student's clearance form submission on the blockchain
 * @param {string} applicationId - Student's application ID
 * @param {string} formType - Type of form (newClearance, provAdmission, etc.)
 * @param {Object} formData - Form data to hash and store
 * @returns {Object} Transaction details
 */
async recordClearanceForm(applicationId, formType, formData) {
  try {
    console.log(`Recording ${formType} form for student ${applicationId} on blockchain...`);
    
    // Create hash of form data
    const dataHash = this.createHash(formData);
    
    // Add document to blockchain using the existing addDocument method with a special format
    const blockchainResult = await this.addDocument(
      applicationId, 
      `FORM:${formType}`, 
      dataHash,
      { 
        gasLimit: 1000000
      }
    );
    
    // Log this action
    await this.logAction(
      applicationId,
      "FORM_SUBMITTED",
      `Student submitted ${formType} form`
    );
    
    return {
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      formType,
      dataHash
    };
  } catch (error) {
    console.error(`Error recording ${formType} form on blockchain:`, error);
    throw error;
  }
}

/**
 * Record approval of a clearance form on blockchain
 * @param {string} applicationId - Student's application ID
 * @param {string} formType - Type of form being approved
 * @param {string} approverRole - Role of the approver (schoolOfficer, deputyRegistrar, etc.)
 * @returns {Object} Transaction details
 */
async recordFormApproval(applicationId, formType, approverRole) {
  try {
    console.log(`Recording approval of ${formType} form by ${approverRole} for ${applicationId}...`);
    
    // Log this action on the blockchain
    const blockchainResult = await this.logAction(
      applicationId,
      "FORM_APPROVED",
      `${formType} form approved by ${approverRole}`
    );
    
    return {
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      formType,
      approverRole
    };
  } catch (error) {
    console.error(`Error recording form approval on blockchain:`, error);
    throw error;
  }
}

/**
 * Verify the completion of entire clearance process
 * @param {string} applicationId - Student's application ID
 * @returns {Object} Transaction details
 */
async completeClearanceProcess(applicationId) {
  try {
    console.log(`Completing clearance process for student ${applicationId}...`);
    
    // Update application status to 'CLEARED'
    const blockchainResult = await this.updateApplicationStatus(
      applicationId, 
      "CLEARED",
      {
        gasLimit: 1000000
      }
    );
    
    // Log completion action
    await this.logAction(
      applicationId,
      "CLEARANCE_COMPLETED",
      `Student clearance process fully completed and verified`
    );
    
    return {
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      status: "CLEARED"
    };
  } catch (error) {
    console.error('Error completing clearance process on blockchain:', error);
    throw error;
  }
}
  
  // async diagnoseContract() {
  //   try {
  //     if (!this.contract) {
  //       return { error: "Contract not initialized" };
  //     }
      
  //     console.log("Contract address:", this.contract.address);
      
  //     // Try to get interface functions
  //     const functions = Object.keys(this.contract.interface.functions);
  //     console.log("Contract has", functions.length, "functions");
      
  //     // Try calling a simple view function
  //     try {
  //       const admin = await this.contract.admin();
  //       console.log("Contract admin address:", admin);
  //     } catch (callError) {
  //       console.error("Error calling contract.admin():", callError);
  //     }
      
  //     return {
  //       address: this.contract.address,
  //       functions: functions
  //     };
  //   } catch (error) {
  //     console.error("Contract diagnosis error:", error);
  //     throw error;
  //   }
  // }
}

module.exports = new BlockchainService();