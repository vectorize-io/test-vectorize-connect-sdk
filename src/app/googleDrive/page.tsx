'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { redirectToVectorizeGoogleDriveConnect, startGDriveOAuth } from '@vectorize-io/vectorize-connect';

// Base URL for API endpoints for development
const BASE_URL = 'http://localhost:3000';
const API_PATH = '/api';
const CALLBACK_PATH = '/api/google-callback';

export default function Home() {
  const router = useRouter();
  
  // Non-White Label states
  const [nonWhiteLabelConnectorId, setNonWhiteLabelConnectorId] = useState<string | null>(null);
  const [nonWhiteLabelInputConnectorId, setNonWhiteLabelInputConnectorId] = useState<string>("");

  // White Label states 
  const [whiteLabelConnectorId, setWhiteLabelConnectorId] = useState<string | null>(null);
  const [whiteLabelInputConnectorId, setWhiteLabelInputConnectorId] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add state for success message and userId
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [addedUserId, setAddedUserId] = useState<string | null>(null);

  // Handle back button click
  const handleBackClick = () => {
    router.push('/');
  };

  const handleCreateNonWhiteLabelConnector = async () => {
    // Non-White Label: Set the parameters for the request
    const whiteLabel = false;
    const connectorName = "My Non-White Label Google Drive Connector";
  
    try {
      const response = await fetch("/api/createGDriveConnector", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whiteLabel,
          connectorName,
          // platformUrl: `${BASE_URL}${API_PATH}`,
          platformUrl: undefined, // use default platformUrl
          clientId: null,
          clientSecret: null,
        }),
      });
      
      console.log("response", response);
      
      const data = await response.json();
      console.log("data", data);
  
      if (!response.ok) {
        console.error("Error creating connector:", data.error);
        return;
      }
  
      console.log("Connector created successfully:", data);
      // Set the non-white-label connector state
      setNonWhiteLabelConnectorId(data);
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // Placeholder function for creating a White Label connector
  const handleCreateWhiteLabelConnector = async () => {
    const whiteLabel = true;
    const connectorName = "My White Label Google Drive Connector";

    // Get the Google OAuth config
    const {clientId, clientSecret} = await fetch("/api/getGoogleOAuthConfig")
    .then(response => response.json())
    .then(data => {
      return {
        clientId: data.clientId,
        clientSecret: data.clientSecret
      }
    });

    try {
        const response = await fetch("/api/createGDriveConnector", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            whiteLabel,
            connectorName,
            // platformUrl: `${BASE_URL}${API_PATH}`,
            platformUrl: undefined, // use default platformUrl
            clientId: clientId,
            clientSecret: clientSecret,
          }),
        });
        
        console.log("response", response);
        
        const data = await response.json();
        console.log("data", data);
    
        if (!response.ok) {
          console.error("Error creating connector:", data.error);
          return;
        }
    
        console.log("Connector created successfully:", data);
        // Set the non-white-label connector state
        setWhiteLabelConnectorId(data);
    } catch (error) {
      console.error("Error creating White Label multi custom connector:", error);
    }
  };

  // Handle the redirect to Google Drive connect for Non-White Label
  const handleNonWhiteLabelConnectGoogleDrive = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setAddedUserId(null);
    
    try {

      const config = await fetch ("/api/getVectorizeConfig")
      .then(response => response.json())
      .then(data => {
        return {
          organizationId: data.organizationId,
          authorization: data.authorization
        }
      });
      // Call the redirect function (opens in a new tab)
      await redirectToVectorizeGoogleDriveConnect(
        config,
        "newNonWhiteLabelUser" + Math.floor(Math.random() * 1000), // Random username for demo purposes
        nonWhiteLabelConnectorId!,
        // BASE_URL
        undefined // use default platformUrl
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Google Drive';
      setError(errorMessage);
      console.error('Google Drive connection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle the redirect to Google Drive connect for White Label
  const handleWhiteLabelConnectGoogleDrive = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setAddedUserId(null);

    // fetch the Google OAuth config
    const {clientId, clientSecret, apiKey} = await fetch("/api/getGoogleOAuthConfig")
    .then(response => response.json())
    .then(data => {
      return {
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        apiKey: data.apiKey
      }
    }
    );
    
    const config = {
      clientId: clientId,
      clientSecret: clientSecret,
      apiKey: apiKey,
      // redirectUri: `${BASE_URL}${CALLBACK_PATH}`
      redirectUri: `test${CALLBACK_PATH}` // ensure the redirectUri matches the one set in the Google Cloud Console
    };

    const popup = startGDriveOAuth({
      ...config,
      scopes : [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
      ],
      onSuccess: async (selection) => {
        console.log('Google Drive connection successful:', selection);

        const { selectedFiles, refreshToken } = selection;
        const connectorId = whiteLabelConnectorId;

        // after user finishes selection, send the data to vectorize
        const url = `/api/add-google-drive-user/${connectorId}`;
        const body = JSON.stringify({ status: 'success', selection: { selectedFiles, refreshToken } });

        const response = await fetch(url, {
          method: 'POST',
          body
        });

        const responseData = await response.json();
        
        if (!response.ok) {
          setError('Failed to add Google Drive user');
          setIsLoading(false);
          return;
        }

        console.log('Google Drive user added successfully', responseData);
        
        // Display success message with the userId from the response
        if (responseData.userId) {
          setAddedUserId(responseData.userId);
          setSuccessMessage(`User ${responseData.userId} successfully added!`);
        } else {
          setSuccessMessage('Google Drive user added successfully!');
        }
        
        setIsLoading(false);
      },
      onError: (error) => {
        setError(error.message);
        setIsLoading(false);
      }
    });
    
    if (!popup) {
      setError('Failed to open Google Drive connection popup');
      setIsLoading(false);
    }
  };

  const handleClearConnectorId = () => {
    setNonWhiteLabelConnectorId(null);
  };

  // Clear White Label connector state
  const handleClearWhiteLabelConnectorId = () => {
    setWhiteLabelConnectorId(null);
  };

  // Handle input for non-white-label connector ID
  const handleNonWhiteLabelConnectorIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNonWhiteLabelInputConnectorId(value);
  };

  // Handle using the input connector ID for non-white-label
  const handleUseNonWhiteLabelConnectorId = () => {
    if (nonWhiteLabelInputConnectorId.trim()) {
      setNonWhiteLabelConnectorId(nonWhiteLabelInputConnectorId.trim());
      // Clear the input after setting the connector ID
      setNonWhiteLabelInputConnectorId("");
    }
  };

  // Handle input for white-label connector ID
  const handleWhiteLabelConnectorIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWhiteLabelInputConnectorId(value);
  };

  // Handle using the input connector ID for white-label
  const handleUseWhiteLabelConnectorId = () => {
    if (whiteLabelInputConnectorId.trim()) {
      setWhiteLabelConnectorId(whiteLabelInputConnectorId.trim());
      // Clear the input after setting the connector ID
      setWhiteLabelInputConnectorId("");
    }
  };

  // Function to dismiss the success message banner
  const dismissSuccessBanner = () => {
    setSuccessMessage(null);
    setAddedUserId(null);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Back Button */}
      <div className="flex justify-start mb-4">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </button>
      </div>

      {/* Success Message Banner */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg flex justify-between items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{successMessage}</span>
          </div>
          <button 
            onClick={dismissSuccessBanner} 
            className="text-green-700 hover:text-green-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {/* Error Message Banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex justify-between items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="text-red-700 hover:text-red-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {/* White Label Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">White Label</h2>

        {/* Add input field for connector ID */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={whiteLabelInputConnectorId}
            onChange={handleWhiteLabelConnectorIdInput}
            placeholder="Enter existing connector ID"
            className="px-3 py-2 border border-gray-300 rounded-lg flex-grow text-black"
            disabled={false}
          />
          <button
            onClick={handleUseWhiteLabelConnectorId}
            disabled={whiteLabelInputConnectorId.trim() === ""}
            className={`bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${
              whiteLabelInputConnectorId.trim() === "" ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            Use Connector ID
          </button>
        </div>

        <button
          onClick={handleCreateWhiteLabelConnector}
          disabled={!!whiteLabelConnectorId}
          className={`bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${
            whiteLabelConnectorId ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
          }`}
        >
          Create a new White Label Google Drive connector
        </button>
        
        <button
          onClick={handleWhiteLabelConnectGoogleDrive}
          disabled={!whiteLabelConnectorId || isLoading}
          className={`px-4 py-2 rounded-lg transition-colors ${
            !whiteLabelConnectorId || isLoading ? "bg-gray-400 text-white opacity-50 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isLoading ? "Connecting..." : "Connect with Google Drive using White Label"}
        </button>

        <div className="flex items-center gap-3 w-fit bg-gray-50 rounded-lg p-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">White label Connector ID:</h3>
            <p className="mt-1 text-sm font-mono">
              {whiteLabelConnectorId ? (
                <span className="text-black">{whiteLabelConnectorId}</span>
              ) : (
                <span className="text-gray-400 italic">undefined</span>
              )}
            </p>
          </div>
          {whiteLabelConnectorId && (
            <button
              onClick={handleClearWhiteLabelConnectorId}
              className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* NON WHITE LABEL SECTION */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">NON WHITE LABEL</h2>

        {/* Add input field for connector ID */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={nonWhiteLabelInputConnectorId}
            onChange={handleNonWhiteLabelConnectorIdInput}
            placeholder="Enter existing connector ID"
            className="px-3 py-2 border border-gray-300 rounded-lg flex-grow text-black"
            disabled={false}
          />
          <button
            onClick={handleUseNonWhiteLabelConnectorId}
            disabled={nonWhiteLabelInputConnectorId.trim() === ""}
            className={`bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${
              nonWhiteLabelInputConnectorId.trim() === "" ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            Use Connector ID
          </button>
        </div>

        <button
          onClick={handleCreateNonWhiteLabelConnector}
          disabled={!!nonWhiteLabelConnectorId}
          className={`bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${
            nonWhiteLabelConnectorId ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
          }`}
        >
          Create a new non white label Google Drive connector
        </button>

        <div className="space-y-4">
          <button 
            onClick={handleNonWhiteLabelConnectGoogleDrive}
            disabled={!nonWhiteLabelConnectorId || isLoading}
            className={`
              bg-green-600 text-white px-4 py-2 rounded-lg
              ${(!nonWhiteLabelConnectorId || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}
              flex items-center gap-2
            `}
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⚪</span>
                Connecting...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 48 48"
                  fill="none"
                >
                  <path d="M24 14L16 26L8 14H24Z" fill="#0F9D58" />
                  <path d="M24 14H40L32 26H16L24 14Z" fill="#4285F4" />
                  <path d="M16 26V38L8 26H16Z" fill="#188038" />
                  <path d="M24 38L16 26H32L24 38Z" fill="#FBBC04" />
                  <path d="M32 26V38L24 38L32 26Z" fill="#EA4335" />
                </svg>
                Connect with Google Drive using Non-White-Label
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 w-fit bg-gray-50 rounded-lg p-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Non white label Connector:</h3>
            <p className="mt-1 text-sm font-mono">
              {nonWhiteLabelConnectorId ? (
                <span className="text-black">{nonWhiteLabelConnectorId}</span>
              ) : (
                <span className="text-gray-400 italic">undefined</span>
              )}
            </p>
          </div>
          {nonWhiteLabelConnectorId && (
            <button
              onClick={handleClearConnectorId}
              className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
