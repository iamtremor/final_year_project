import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BlockchainTest = () => {
  const [testResult, setTestResult] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    const testBlockchainConnection = async () => {
      try {
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        console.log("Token found:", !!token);
        
        if (!token) {
          setTestResult({ 
            loading: false, 
            error: "No authentication token found. Please log in first." 
          });
          return;
        }

        // Make a test call to your blockchain endpoint
        const response = await axios.get('/api/blockchain/applications/within-deadline/TEST001', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log("Blockchain test response:", response.data);
        setTestResult({ loading: false, data: response.data, error: null });
      } catch (error) {
        console.error("Blockchain test error:", error);
        setTestResult({ 
          loading: false, 
          data: null, 
          error: error.response?.data?.message || error.message 
        });
      }
    };

    testBlockchainConnection();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Blockchain Connection Test</h1>
      
      {testResult.loading ? (
        <p>Testing blockchain connection...</p>
      ) : testResult.error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error:</p>
          <p>{testResult.error}</p>
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-bold">Success!</p>
          <p>Blockchain connection working properly.</p>
          <pre className="mt-2 bg-gray-100 p-2 rounded">
            {JSON.stringify(testResult.data, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4">
        <p className="font-semibold">To debug further:</p>
        <ol className="list-decimal ml-6 mt-2">
          <li>Check your browser console for logs</li>
          <li>Verify Ganache is running</li>
          <li>Check your backend console for errors</li>
          <li>Verify your contract deployment</li>
        </ol>
      </div>
    </div>
  );
};

export default BlockchainTest;