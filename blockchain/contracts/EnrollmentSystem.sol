// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EnrollmentSystem {
    address public admin;
    
    // Student verification status
    struct Student {
        bool exists;
        bool verified;
        string dataHash; // Hash of student personal data
        uint256 registrationTime;
    }
    
    // Document status
    struct Document {
        bool exists;
        string documentHash; // Hash of the document content
        string documentType; // Type of document (e.g., "SSCE", "JAMB", "Medical")
        string status; // "pending", "approved", "rejected"
        address reviewedBy; // Staff address who reviewed
        uint256 uploadTime;
        uint256 reviewTime;
        string rejectionReason;
    }
    
    // Application status
    struct Application {
        bool exists;
        string status; // "submitted", "in-review", "approved", "rejected"
        uint256 submissionTime;
        mapping(string => bool) requiredDocuments; // Document types required
        mapping(string => bool) submittedDocuments; // Document types submitted
        uint256 deadlineTimestamp;
    }
    
    // Audit log entry
    struct AuditLog {
        address actor;
        string action;
        string details;
        uint256 timestamp;
    }
    
    // Mappings
    mapping(string => Student) public students; // applicationId -> Student
    mapping(string => mapping(string => Document)) public documents; // applicationId -> documentType -> Document
    mapping(string => Application) public applications; // applicationId -> Application
    mapping(string => AuditLog[]) public auditLogs; // applicationId -> AuditLog[]
    
    // Events
    event StudentRegistered(string applicationId, string dataHash, uint256 timestamp);
    event DocumentUploaded(string applicationId, string documentType, string documentHash, uint256 timestamp);
    event DocumentReviewed(string applicationId, string documentType, string status, address reviewer, uint256 timestamp);
    event ApplicationStatusChanged(string applicationId, string status, uint256 timestamp);
    event DeadlineSet(string applicationId, uint256 deadlineTimestamp);
    event LogRecorded(string applicationId, address actor, string action, uint256 timestamp);
    
    constructor() {
        admin = msg.sender;
    }
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    modifier onlyStaff() {
        // In a real implementation, you would check if the address is in a staff mapping
        // For now, only admin can act as staff
        require(msg.sender == admin, "Only staff can call this function");
        _;
    }
    
    // Function to register a new student
    function registerStudent(string memory applicationId, string memory dataHash) public onlyAdmin {
        require(!students[applicationId].exists, "Student already exists");
        
        students[applicationId] = Student({
            exists: true,
            verified: false,
            dataHash: dataHash,
            registrationTime: block.timestamp
        });
        
        // Initialize application
        Application storage newApplication = applications[applicationId];
        newApplication.exists = true;
        newApplication.status = "submitted";
        newApplication.submissionTime = block.timestamp;
        
        // Record audit log
        recordLog(applicationId, msg.sender, "STUDENT_REGISTERED", "Student registration");
        
        emit StudentRegistered(applicationId, dataHash, block.timestamp);
    }
    
    // Function to verify a student
    function verifyStudent(string memory applicationId) public onlyStaff {
        require(students[applicationId].exists, "Student does not exist");
        require(!students[applicationId].verified, "Student already verified");
        
        students[applicationId].verified = true;
        
        recordLog(applicationId, msg.sender, "STUDENT_VERIFIED", "Student verification");
    }
    
    // Function to add a document hash
    function addDocument(string memory applicationId, string memory documentType, string memory documentHash) public {
        require(students[applicationId].exists, "Student does not exist");
        require(!documents[applicationId][documentType].exists, "Document already exists");
        
        documents[applicationId][documentType] = Document({
            exists: true,
            documentHash: documentHash,
            documentType: documentType,
            status: "pending",
            reviewedBy: address(0),
            uploadTime: block.timestamp,
            reviewTime: 0,
            rejectionReason: ""
        });
        
        // Update application's submitted documents
        applications[applicationId].submittedDocuments[documentType] = true;
        
        recordLog(applicationId, msg.sender, "DOCUMENT_UPLOADED", string(abi.encodePacked("Document uploaded: ", documentType)));
        
        emit DocumentUploaded(applicationId, documentType, documentHash, block.timestamp);
    }
    
    // Function to review a document
    function reviewDocument(string memory applicationId, string memory documentType, string memory status, string memory rejectionReason) public onlyStaff {
        require(students[applicationId].exists, "Student does not exist");
        require(documents[applicationId][documentType].exists, "Document does not exist");
        require(
            keccak256(abi.encodePacked(status)) == keccak256(abi.encodePacked("approved")) || 
            keccak256(abi.encodePacked(status)) == keccak256(abi.encodePacked("rejected")),
            "Status must be 'approved' or 'rejected'"
        );
        
        Document storage doc = documents[applicationId][documentType];
        doc.status = status;
        doc.reviewedBy = msg.sender;
        doc.reviewTime = block.timestamp;
        
        if (keccak256(abi.encodePacked(status)) == keccak256(abi.encodePacked("rejected"))) {
            doc.rejectionReason = rejectionReason;
        }
        
        recordLog(
            applicationId, 
            msg.sender, 
            "DOCUMENT_REVIEWED", 
            string(abi.encodePacked("Document reviewed: ", documentType, " - ", status))
        );
        
        emit DocumentReviewed(applicationId, documentType, status, msg.sender, block.timestamp);
    }
    
    // Function to update application status
    function updateApplicationStatus(string memory applicationId, string memory status) public onlyStaff {
        require(applications[applicationId].exists, "Application does not exist");
        
        applications[applicationId].status = status;
        
        recordLog(
            applicationId, 
            msg.sender, 
            "APPLICATION_STATUS_UPDATED", 
            string(abi.encodePacked("Application status updated to: ", status))
        );
        
        emit ApplicationStatusChanged(applicationId, status, block.timestamp);
    }
    
    // Function to set a deadline for an application
    function setDeadline(string memory applicationId, uint256 deadlineTimestamp) public onlyAdmin {
        require(applications[applicationId].exists, "Application does not exist");
        require(deadlineTimestamp > block.timestamp, "Deadline must be in the future");
        
        applications[applicationId].deadlineTimestamp = deadlineTimestamp;
        
        recordLog(
            applicationId, 
            msg.sender, 
            "DEADLINE_SET", 
            string(abi.encodePacked("Deadline set for: ", uint2str(deadlineTimestamp)))
        );
        
        emit DeadlineSet(applicationId, deadlineTimestamp);
    }
    
    // Function to check if document submission is within deadline
    function isWithinDeadline(string memory applicationId) public view returns (bool) {
        require(applications[applicationId].exists, "Application does not exist");
        
        uint256 deadline = applications[applicationId].deadlineTimestamp;
        
        // If deadline is 0, it means there's no deadline set
        if (deadline == 0) {
            return true;
        }
        
        return block.timestamp <= deadline;
    }
    
    // Function to record audit log
    function recordLog(string memory applicationId, address actor, string memory action, string memory details) internal {
        AuditLog memory log = AuditLog({
            actor: actor,
            action: action,
            details: details,
            timestamp: block.timestamp
        });
        
        auditLogs[applicationId].push(log);
        
        emit LogRecorded(applicationId, actor, action, block.timestamp);
    }
    
    // Helper function to convert uint to string
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        return string(bstr);
    }
}