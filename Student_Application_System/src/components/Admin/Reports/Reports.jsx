import React from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
} from "chart.js";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import { FiCheckCircle } from "react-icons/fi";
import { FaRegTimesCircle, FaUsers } from "react-icons/fa";

// Register chart elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement
);

const Reports = () => {
  // Sample Data for Graphs
  const submissionData = {
    labels: ["January", "February", "March", "April", "May"],
    datasets: [
      {
        label: "Documents Submitted",
        data: [50, 75, 100, 60, 90],
        backgroundColor: "#C3A135",
      },
    ],
  };

  const approvalData = {
    labels: ["Approved", "Rejected"],
    datasets: [
      {
        data: [200, 50],
        backgroundColor: ["#4CAF50", "#F44336"],
      },
    ],
  };

  const processingTimeData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Avg Processing Time (hrs)",
        data: [12, 9, 7, 10],
        borderColor: "#0D0637",
        backgroundColor: "rgba(13, 6, 55, 0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#0D0637] mb-4">
        Reports & Analytics
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-lg rounded-lg p-4 flex items-center">
          <HiOutlineDocumentSearch size={30} className="text-[#C3A135] mr-4" />
          <div>
            <h3 className="text-lg font-bold">Total Submissions</h3>
            <p className="text-gray-600">350</p>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-4 flex items-center">
          <FiCheckCircle size={30} className="text-[#4CAF50] mr-4" />
          <div>
            <h3 className="text-lg font-bold">Approved Documents</h3>
            <p className="text-gray-600">200</p>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-4 flex items-center">
          <FaRegTimesCircle size={30} className="text-[#F44336] mr-4" />
          <div>
            <h3 className="text-lg font-bold">Rejected Documents</h3>
            <p className="text-gray-600">50</p>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-4 flex items-center">
          <FaUsers size={30} className="text-[#0D0637] mr-4" />
          <div>
            <h3 className="text-lg font-bold">Active Users</h3>
            <p className="text-gray-600">500</p>
          </div>
        </div>
      </div>

      {/* Bar Chart for Submissions */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#0D0637] mb-2">
          Monthly Submissions
        </h3>
        <Bar data={submissionData} />
      </div>

      {/* Pie Chart for Approval vs. Rejection */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#0D0637] mb-2">
          Approval vs. Rejection
        </h3>
        <Pie data={approvalData} className="w-100" />
      </div>

      {/* Line Chart for Processing Time */}
      <div>
        <h3 className="text-xl font-bold text-[#0D0637] mb-2">
          Average Document Processing Time
        </h3>
        <Line data={processingTimeData} />
      </div>
    </div>
  );
};

export default Reports;
