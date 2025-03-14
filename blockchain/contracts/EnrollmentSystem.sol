// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EnrollmentSystem {
    address public admin;
    
    // Generic user struct - can be used for any role
    struct User {
        bool exists;
        bool verified;
        string dataHash; // Hash of user's personal data
        uint256 registrationTime;
        string role; // "student", "staff", or "admin"
    }
    
    // Student verification status (kept for backward compatibility)
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
    mapping(string => Student) public students; // applicationId -> Student (kept for backward compatibility)
    mapping(string => User) public users; // userId -> User (new generic mapping for all user types)
    mapping(string => mapping(string => Document)) public documents; // applicationId -> documentType -> Document
    mapping(string => Application) public applications; // applicationId -> Application
    mapping(string => AuditLog[]) public auditLogs; // applicationId -> AuditLog[]
    
    // Events
    event StudentRegistered(string applicationId, string dataHash, uint256 timestamp);
    event UserRegistered(string userId, string role, string dataHash, uint256 timestamp);
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
    
    // Function to register a new student (kept for backward compatibility)
    function registerStudent(string memory applicationId, string memory dataHash) public onlyAdmin {
        require(!students[applicationId].exists, "Student already exists");
        
        // Register in the students mapping (for backward compatibility)
        students[applicationId] = Student({
            exists: true,
            verified: false,
            dataHash: dataHash,
            registrationTime: block.timestamp
        });
        
        // Also register in the generic users mapping
        users[applicationId] = User({
            exists: true,
            verified: false,
            dataHash: dataHash,
            registrationTime: block.timestamp,
            role: "student"
        });
        
        // Initialize application
        Application storage newApplication = applications[applicationId];
        newApplication.exists = true;
        newApplication.status = "submitted";
        newApplication.submissionTime = block.timestamp;
        
        // Record audit log
        recordLog(applicationId, msg.sender, "STUDENT_REGISTERED", "Student registration");
        
        emit StudentRegistered(applicationId, dataHash, block.timestamp);
        emit UserRegistered(applicationId, "student", dataHash, block.timestamp);
    }
    
    // Function to register a new user (staff or admin)
    function registerUser(string memory userId, string memory role, string memory dataHash) public onlyAdmin {
        require(!users[userId].exists, "User already exists");
        
        // Register in the generic users mapping
        users[userId] = User({
            exists: true,
            verified: false,
            dataHash: dataHash,
            registrationTime: block.timestamp,
            role: role
        });
        
        // Record audit log
        recordLog(userId, msg.sender, "USER_REGISTERED", string(abi.encodePacked(role, " registration")));
        
        emit UserRegistered(userId, role, dataHash, block.timestamp);
    }
    
    // Function to verify a student (kept for backward compatibility)
    function verifyStudent(string memory applicationId) public onlyStaff {
        require(students[applicationId].exists, "Student does not exist");
        require(!students[applicationId].verified, "Student already verified");
        
        students[applicationId].verified = true;
        
        // Also update in generic users mapping
        if (users[applicationId].exists) {
            users[applicationId].verified = true;
        }
        
        recordLog(applicationId, msg.sender, "STUDENT_VERIFIED", "Student verification");
    }
    
    // Function to verify any user
    function verifyUser(string memory userId) public onlyAdmin {
        require(users[userId].exists, "User does not exist");
        require(!users[userId].verified, "User already verified");
        
        users[userId].verified = true;
        
        // If this is a student, also update the students mapping
        if (keccak256(abi.encodePacked(users[userId].role)) == keccak256(abi.encodePacked("student"))) {
            if (students[userId].exists) {
                students[userId].verified = true;
            }
        }
        
        recordLog(userId, msg.sender, "USER_VERIFIED", string(abi.encodePacked(users[userId].role, " verification")));
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
    
    // Function to record audit log (internal)
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

    // Function to record external audit log
    function recordAuditLog(string memory applicationId, string memory action, string memory details) public {
        recordLog(applicationId, msg.sender, action, details);
    }
    // Add to blockchain/contracts/EnrollmentSystem.sol

// Function to record a student's clearance status
function recordClearanceStatus(
    string memory applicationId, 
    string memory status, 
    string memory detailsHash
) public onlyAdmin {
    require(students[applicationId].exists, "Student does not exist");
    
    // Record clearance status in a mapping
    clearanceStatus[applicationId] = ClearanceStatus({
        status: status,
        detailsHash: detailsHash,
        timestamp: block.timestamp,
        verified: true
    });
    
    // Log action
    recordLog(applicationId, msg.sender, "CLEARANCE_STATUS_UPDATED", status);
    
    emit ClearanceStatusUpdated(applicationId, status, block.timestamp);
}

// Event for clearance status updates
event ClearanceStatusUpdated(
    string applicationId, 
    string status, 
    uint256 timestamp
);

// Structure for clearance status
struct ClearanceStatus {
    string status;
    string detailsHash;
    uint256 timestamp;
    bool verified;
}

// Mapping to store clearance status
mapping(string => ClearanceStatus) public clearanceStatus;
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