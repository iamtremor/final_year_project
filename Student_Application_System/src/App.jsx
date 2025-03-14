import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth components
import StudentLogin from "./components/Students/Authentication/Login/Login";
import StudentSignup from "./components/Students/Authentication/Signup/Signup";
import StaffLogin from "./components/Staff/Authentication/Login/Login";
import StaffSignup from "./components/Staff/Authentication/Signup/Signup";
import AdminLogin from "./components/Admin/Authentication/Login/Login";
import AdminSignup from "./components/Admin/Authentication/Signup/Signup";

// Other components
import Landingpage from "./components/LandingPage/Landingpage";
import Notfound from "./components/Notfound";
import Unauthorized from "./components/Unauthorized";

// Student components
import StudentDashboard from "./components/Students/Dashboard/Home/Dashboard";
import Approved from "./components/Students/Dashboard/Approved/Approved";
import Documents from "./components/Students/Dashboard/MyDocuments/Documentss";
import Notification from "./components/Students/Dashboard/Notification/Notification";
import Pending from "./components/Students/Dashboard/Pending/Pending";
import Profile from "./components/Students/Dashboard/Profile/Profile";
import Upload from "./components/Students/Dashboard/Upload/Upload";
import Track from "./components/Students/Dashboard/Track/Track";
import BlockchainTest from "./components/testcomponent";
import BlockchainVerified from "./components/Students/Dashboard/Verified/BlockChainVerified";
import DocumentManagement from "./components/Students/Dashboard/Upload/DocumentManagement";
import FormsStatus from "./components/Students/Dashboard/Forms/FormsStatus";
import NewClearanceForm from "./components/Students/Dashboard/Forms/NewClearanceForm";

// Staff components
import StaffDashboard from "./components/Staff/Dashboard/Dashboard";
import StaffApproved from "./components/Staff/StaffApproved";
import StaffRejected from "./components/Staff/StaffRejected";
import StaffPending from "./components/Staff/StaffPending";
import StaffNotification from "./components/Staff/Notification/Notifications";
import StaffProfile from "./components/Staff/StaffProfile";


// Admin components
import AdminDashboard from "./components/Admin/Dashboard/Dashboard";
import ManageUsers from "./components/Admin/ManageUsers/ManageUsers";
import UserList from "./components/Admin/ManageUsers/UserList";
import RolesandPermission from "./components/Admin/RolesandPermission/RolesandPermission";
import AllDocuments from "./components/Admin/MyDocuments/MyDocuments";
import ApprovedDocs from "./components/Admin/Approved/Approved";
import RejectedDocs from "./components/Admin/Rejected/Rejected";
import Announcements from "./components/Admin/Announcement/Announcements";
import AdminNotification from "./components/Admin/Notification/Notifications";
import SetDeadlines from "./components/Admin/SetDeadlines/Deadlines";
import TrackApp from "./components/Admin/Track/Track";
import Reportsa from "./components/Admin/Reports/Reports";
import Settings from "./components/Admin/Settings/Settings";
import NewDeadlineForm from "./components/Admin/SetDeadlines/NewDeadlineForm";
import NewAnnouncementForm from "./components/Admin/Announcement/NewAnnouncement";

// Layout component
import Layout from "./components/Layout/Layout";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landingpage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Authentication Routes */}
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/signup" element={<StudentSignup />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff/signup" element={<StaffSignup />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/signup" element={<AdminSignup />} />

          {/* Protected Student Routes */}
          <Route 
            element={
              <ProtectedRoute 
                allowedRoles={['student']} 
                redirectPath="/unauthorized" 
              />
            }
          >
            <Route
              path="/student"
              element={<Layout role="Student" />}
            >
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="approved" element={<Approved />} />
              <Route path="forms" element={<FormsStatus />} />
              <Route path="forms/new-clearance" element={<NewClearanceForm />} />
              <Route path="my-documents" element={<Documents />} />
              <Route path="notifications" element={<Notification />} />
              <Route path="pending" element={<Pending />} />
              <Route path="manage-documents" element={<DocumentManagement />} />
              <Route path="profile" element={<Profile />} />
              <Route path="track" element={<Track />} />
              <Route path="upload" element={<Upload />} />
              <Route path="test" element={<BlockchainTest />} />
              <Route path="blockchain-verified" element={<BlockchainVerified />} />
            </Route>
          </Route>

          {/* Protected Staff Routes */}
          <Route 
            element={
              <ProtectedRoute 
                allowedRoles={['staff']} 
                redirectPath="/unauthorized" 
              />
            }
          >
            <Route
              path="/staff"
              element={<Layout role="Staff" />}
            >
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="approved" element={<StaffApproved />} />
              <Route path="rejected" element={<StaffRejected />} />
              <Route path="pending-approvals" element={<StaffPending />} />
              <Route path="notifications" element={<StaffNotification />} />
              <Route path="profile" element={<StaffProfile />} />
            </Route>
          </Route>

          {/* Protected Admin Routes */}
          <Route 
            element={
              <ProtectedRoute 
                allowedRoles={['admin']} 
                redirectPath="/unauthorized" 
              />
            }
          >
            <Route
              path="/admin"
              element={<Layout role="Admin" />}
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="manage-users" element={<ManageUsers />} />
              <Route path="manage-user-user-list" element={<UserList />} />
              <Route path="manage-user-roles-permission" element={<RolesandPermission />} />
              <Route path="roles-permission" element={<RolesandPermission />} />
              <Route path="my-documents" element={<AllDocuments />} />
              <Route path="my-documents/approved" element={<ApprovedDocs />} />
              <Route path="approved" element={<ApprovedDocs />} />
              <Route path="rejected" element={<RejectedDocs />} />
              <Route path="my-documents/rejected" element={<RejectedDocs />} />
              <Route path="announcement" element={<Announcements />} />
              <Route path="new-announcement" element={<NewAnnouncementForm />} />
              <Route path="notifications" element={<AdminNotification />} />
              <Route path="deadlines" element={<SetDeadlines />} />
              <Route path="new-deadlines" element={<NewDeadlineForm />} />
              <Route path="track-application" element={<TrackApp />} />
              <Route path="reports-analytics" element={<Reportsa />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Notfound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;