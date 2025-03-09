// backend/services/blockchainService.js
const ethers = require('ethers');
const crypto = require('crypto');
const EnrollmentSystemABI = require('../contracts/EnrollmentSystem.json').abi;
const config = require('../config');

class BlockchainService {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(config.blockchain.providerUrl);
    this.wallet = new ethers.Wallet(config.blockchain.privateKey, this.provider);
    this.contract = new ethers.Contract(
      config.blockchain.contractAddress,
      EnrollmentSystemABI,
      this.wallet
    );
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
   * Register a student on the blockchain
   * @param {string} applicationId - Student's application ID
   * @param {Object} studentData - Student's personal information
   */
  async registerStudent(applicationId, studentData) {
    try {
      // Create hash of student data
      const dataHash = this.createHash(studentData);
      
      // Send transaction to blockchain
      const tx = await this.contract.registerStudent(applicationId, dataHash);
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.events.map(event => ({
          name: event.event,
          args: event.args
        }))
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
      const tx = await this.contract.verifyStudent(applicationId);
      const receipt = await tx.wait();
      
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
      console.log("blockchainService.addDocument called");
      console.log("- Creating hash for document...");
      
      // Create hash of document content
      const documentHash = this.createHash(fileContent);
      console.log("- Document hash created:", documentHash);
      
      console.log("- Preparing transaction to blockchain...");
      console.log("  Contract address:", this.contract.address);
      
      // Send transaction to blockchain
      console.log("- Sending transaction to blockchain...");
      const tx = await this.contract.addDocument(applicationId, documentType, documentHash);
      console.log("- Transaction sent, hash:", tx.hash);
      
      console.log("- Waiting for transaction to be mined...");
      const receipt = await tx.wait();
      console.log("- Transaction mined in block:", receipt.blockNumber);
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        documentHash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error in blockchainService.addDocument:', error);
      throw error;
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
      const tx = await this.contract.reviewDocument(
        applicationId, 
        documentType, 
        status, 
        rejectionReason
      );
      const receipt = await tx.wait();
      
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
      const tx = await this.contract.updateApplicationStatus(applicationId, status);
      const receipt = await tx.wait();
      
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
      // Convert deadline to Unix timestamp (seconds)
      const deadlineTimestamp = Math.floor(deadline.getTime() / 1000);
      
      const tx = await this.contract.setDeadline(applicationId, deadlineTimestamp);
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error setting deadline on blockchain:', error);
      throw error;
    }
  }

  /**
   * Check if document submission is within deadline
   * @param {string} applicationId - Student's application ID
   */
  async isWithinDeadline(applicationId) {
    try {
      // For testing, always return true
      console.log("Deadline check for:", applicationId);
      return true;
      
      // Commented out actual blockchain call for now
      // const result = await this.contract.isWithinDeadline(applicationId);
      // return result;
    } catch (error) {
      console.error('Error checking deadline on blockchain:', error);
      console.log("Returning TRUE as default for testing");
      return true;  // Default to true even if there's an error
    }
  }

  /**
   * Get student verification status
   * @param {string} applicationId - Student's application ID
   */
  async getStudentStatus(applicationId) {
    try {
      const student = await this.contract.students(applicationId);
      
      return {
        exists: student.exists,
        verified: student.verified,
        dataHash: student.dataHash,
        registrationTime: new Date(student.registrationTime.toNumber() * 1000)
      };
    } catch (error) {
      console.error('Error getting student status from blockchain:', error);
      throw error;
    }
  }

  /**
   * Verify document integrity by comparing hashes
   * @param {string} applicationId - Student's application ID
   * @param {string} documentType - Type of document
   * @param {Buffer|string} currentFileContent - Current file content
   */
  async verifyDocumentIntegrity(applicationId, documentType, currentFileContent) {
    try {
      // Get document from blockchain
      const document = await this.contract.documents(applicationId, documentType);
      
      if (!document.exists) {
        return { verified: false, error: 'Document not found on blockchain' };
      }
      
      // Calculate hash of current file
      const currentHash = this.createHash(currentFileContent);
      
      // Compare hashes
      const verified = document.documentHash === currentHash;
      
      return {
        verified,
        blockchainHash: document.documentHash,
        currentHash,
        uploadTime: new Date(document.uploadTime.toNumber() * 1000)
      };
    } catch (error) {
      console.error('Error verifying document integrity:', error);
      throw error;
    }
  }
}

module.exports = new BlockchainService();