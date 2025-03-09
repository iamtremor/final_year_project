import React, { useState, useEffect } from "react";
import Draganddrop from "./Draganddrop";
import { AiOutlineCloudUpload } from "react-icons/ai";
import { useAuth } from "../../../../context/AuthContext"; 
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const UploadForm = () => {
  const [formData, setFormData] = useState({
    documentName: "",
    documentType: "",
    description: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWithinDeadline, setIsWithinDeadline] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Check if submission is within deadline when component mounts
    const checkDeadline = async () => {
      try {
        if (user?.applicationId) {
          const response = await axios.get(
            `/api/blockchain/applications/within-deadline/${user.applicationId}`
          );
          setIsWithinDeadline(response.data.isWithinDeadline);
          
          if (!response.data.isWithinDeadline) {
            toast.error('Submission deadline has passed');
          }
        }
      } catch (error) {
        console.error('Error checking deadline:', error);
      }
    };
    
    checkDeadline();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelected = (files) => {
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isWithinDeadline) {
      toast.error('Submission deadline has passed. Cannot upload document.');
      return;
    }
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    if (!formData.documentName || !formData.documentType) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create form data for API call
      const apiFormData = new FormData();
      apiFormData.append('file', selectedFile);
      apiFormData.append('applicationId', user.applicationId);
      apiFormData.append('documentType', formData.documentType);
      apiFormData.append('title', formData.documentName);
      apiFormData.append('description', formData.description || '');
      
      console.log("Auth token being sent:", localStorage.getItem('token'));
    const config = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    };
    console.log("Request config:", config);
      // Upload file to backend and blockchain
      const response = await axios.post('/api/blockchain/documents/upload', apiFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Document uploaded successfully and recorded on blockchain!');
      
      // Reset form
      setFormData({
        documentName: "",
        documentType: "",
        description: ""
      });
      setSelectedFile(null);
      
      // Optional: If your Draganddrop component has a reset method, call it here
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsLoading(false);
    }
    
  };

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <div className="text-2xl font-bold text-[#1E3A8A] flex items-center">
        <AiOutlineCloudUpload />
        <h2 className="mx-2">Upload Document</h2>
      </div>
      
      {!isWithinDeadline && (
        <div className="max-w-2xl mx-auto my-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong className="font-bold">Deadline passed!</strong>
          <span className="block sm:inline"> You can no longer submit documents as the deadline has passed.</span>
        </div>
      )}
      
      <div className="max-w-2xl bg-white p-6 lg:mx-auto mx-[2rem] my-[5rem] rounded-sm shadow-md">
        <form onSubmit={handleSubmit}>
          {/* Document Name Input */}
          <div className="mb-4">
            <label
              htmlFor="documentName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Document Name
            </label>
            <input
              type="text"
              id="documentName"
              name="documentName"
              value={formData.documentName}
              onChange={handleInputChange}
              placeholder="Enter Document Name"
              className="block w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Document Type Dropdown */}
          <div className="mb-4">
            <label
              htmlFor="documentType"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Document Type
            </label>
            <select
              id="documentType"
              name="documentType"
              value={formData.documentType}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Document Type</option>
              <option value="SSCE">SSCE Result</option>
              <option value="JAMB">JAMB Result</option>
              <option value="Transcript">Transcript</option>
              <option value="Admission Letter">Admission Letter</option>
              <option value="Medical Report">Medical Report</option>
              <option value="Passport">Passport Photograph</option>
              <option value="NIN">National ID (NIN)</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* Description Field */}
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter document description"
              className="block w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            ></textarea>
          </div>

          {/* Drag and Drop Component */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Files
            </label>
            <Draganddrop onFilesSelected={handleFileSelected} />
            {selectedFile && (
              <div className="mt-2 text-sm text-green-600">
                Selected file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading || !isWithinDeadline}
              className={`w-full py-2 px-4 border border-transparent rounded-sm shadow-sm text-sm font-medium text-white 
                ${isLoading || !isWithinDeadline ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1E3A8A] hover:bg-[#152a63]'} 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </div>
              ) : "Upload Document"}
            </button>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>* Your document will be securely hashed and recorded on the blockchain to ensure its integrity.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadForm;