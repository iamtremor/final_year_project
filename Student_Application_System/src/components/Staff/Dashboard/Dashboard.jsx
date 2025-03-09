import React from "react";

const Dashboard = () => {
  return (
    <div className="staff-dashboard ml-[15rem]">
      {/* Header Section */}
      <div className="dashboard-header">
        <h1>Welcome, Jane Smith</h1>
        <p>Your Role: Staff</p>
      </div>

      {/* Task Overview Section */}
      <div className="dashboard-overview">
        <div className="overview-card">
          <h3>Pending Approvals</h3>
          <p>20</p>
        </div>
        <div className="overview-card">
          <h3>Approved Documents</h3>
          <p>180</p>
        </div>
      </div>

      {/* Pending Approvals Section */}
      <div className="pending-approvals">
        <h2>Pending Approvals</h2>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Document</th>
              <th>Submission Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Doe</td>
              <td>Transcript</td>
              <td>Jan 5, 2025</td>
              <td>
                <button>Approve</button>
                <button>Reject</button>
              </td>
            </tr>
            <tr>
              <td>Jane Roe</td>
              <td>Admission Letter</td>
              <td>Jan 4, 2025</td>
              <td>
                <button>Approve</button>
                <button>Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
