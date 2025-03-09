// test/EnrollmentSystem.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnrollmentSystem", function () {
  let enrollmentSystem;
  let owner;
  let staff;
  let addr1;
  let addr2;
  
  // Test data
  const applicationId = "STU001";
  const dataHash = "0x123456789abcdef";
  const documentType = "SSCE";
  const documentHash = "0xabcdef123456789";
  
  beforeEach(async function () {
    // Get signers
    [owner, staff, addr1, addr2] = await ethers.getSigners();
    
    // Deploy the contract
    const EnrollmentSystem = await ethers.getContractFactory("EnrollmentSystem");
    enrollmentSystem = await EnrollmentSystem.deploy();
    await enrollmentSystem.deployed();
  });
  
  describe("Student Registration", function () {
    it("Should register a new student", async function () {
      // Register a student
      await enrollmentSystem.registerStudent(applicationId, dataHash);
      
      // Check if student exists
      const student = await enrollmentSystem.students(applicationId);
      expect(student.exists).to.equal(true);
      expect(student.dataHash).to.equal(dataHash);
      expect(student.verified).to.equal(false);
    });
    
    it("Should not allow registering the same student twice", async function () {
      // Register a student
      await enrollmentSystem.registerStudent(applicationId, dataHash);
      
      // Try to register the same student again
      await expect(
        enrollmentSystem.registerStudent(applicationId, dataHash)
      ).to.be.revertedWith("Student already exists");
    });
  });
  
  describe("Document Management", function () {
    beforeEach(async function () {
      // Register a student
      await enrollmentSystem.registerStudent(applicationId, dataHash);
    });
    
    it("Should add a document", async function () {
      // Add a document
      await enrollmentSystem.addDocument(applicationId, documentType, documentHash);
      
      // Check if document exists
      const document = await enrollmentSystem.documents(applicationId, documentType);
      expect(document.exists).to.equal(true);
      expect(document.documentHash).to.equal(documentHash);
      expect(document.status).to.equal("pending");
    });
    
    it("Should review a document", async function () {
      // Add a document
      await enrollmentSystem.addDocument(applicationId, documentType, documentHash);
      
      // Review the document
      await enrollmentSystem.reviewDocument(applicationId, documentType, "approved", "");
      
      // Check if document status updated
      const document = await enrollmentSystem.documents(applicationId, documentType);
      expect(document.status).to.equal("approved");
      expect(document.reviewedBy).to.equal(owner.address);
    });
    
    it("Should reject a document with feedback", async function () {
      // Add a document
      await enrollmentSystem.addDocument(applicationId, documentType, documentHash);
      
      // Reject the document
      const feedback = "Document is not valid";
      await enrollmentSystem.reviewDocument(applicationId, documentType, "rejected", feedback);
      
      // Check if document status updated
      const document = await enrollmentSystem.documents(applicationId, documentType);
      expect(document.status).to.equal("rejected");
      expect(document.rejectionReason).to.equal(feedback);
    });
  });
  
  describe("Application Status", function () {
    beforeEach(async function () {
      // Register a student
      await enrollmentSystem.registerStudent(applicationId, dataHash);
    });
    
    it("Should update application status", async function () {
      // Update application status
      await enrollmentSystem.updateApplicationStatus(applicationId, "in-review");
      
      // Check if status is updated
      const application = await enrollmentSystem.applications(applicationId);
      expect(application.status).to.equal("in-review");
    });
    
    it("Should set a deadline", async function () {
      // Get current time
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const timestamp = blockBefore.timestamp;
      
      // Set deadline to 1 week from now
      const deadline = timestamp + 7 * 24 * 60 * 60;
      await enrollmentSystem.setDeadline(applicationId, deadline);
      
      // Check if deadline is set
      const application = await enrollmentSystem.applications(applicationId);
      expect(application.deadlineTimestamp).to.equal(deadline);
    });
    
    it("Should check if submission is within deadline", async function () {
      // Set deadline to 1 day from now
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const timestamp = blockBefore.timestamp;
      const deadline = timestamp + 24 * 60 * 60;
      
      await enrollmentSystem.setDeadline(applicationId, deadline);
      
      // Check if within deadline
      const isWithin = await enrollmentSystem.isWithinDeadline(applicationId);
      expect(isWithin).to.equal(true);
    });
  });
});