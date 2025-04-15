'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  GoogleDriveOAuth, 
  GoogleDriveOAuthConfig,
  GoogleDriveSelection
} from '@vectorize-io/vectorize-connect';

// Base URL for API endpoints
const BASE_URL = process.env.NEXT_PUBLIC_VECTORIZE_API_URL;
const API_PATH = process.env.NEXT_PUBLIC_VECTORIZE_API_PATH;
const redirect_URI = process.env.NEXT_PUBLIC_VECTORIZE_PLATFORM;
const CALLBACK_PATH = '/api/googleDrive/google-callback/';

export default function Home() {
  const router = useRouter();
  
  // Vectorize states
  const [vectorizeConnectorId, setVectorizeConnectorId] = useState<string | null>(null);
  const [vectorizeInputConnectorId, setVectorizeInputConnectorId] = useState<string>("");
  const [vectorizeUserId, setVectorizeUserId] = useState<string | null>(null);
  const [isVectorizeConnected, setIsVectorizeConnected] = useState<boolean>(false);

  // White Label states 
  const [whiteLabelConnectorId, setWhiteLabelConnectorId] = useState<string | null>(null);
  const [whiteLabelInputConnectorId, setWhiteLabelInputConnectorId] = useState<string>("");

  // State for refresh token and selected files
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, { name: string; mimeType: string }> | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isVectorizeEditing, setIsVectorizeEditing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add state for success message and userId
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [addedUserId, setAddedUserId] = useState<string | null>(null);

  // Handle back button click
  const handleBackClick = () => {
    router.push('/');
  };

  const handleCreateVectorizeConnector = async () => {
    // Create a Vectorize Google Drive connector
    const connectorName = "My Vectorize Google Drive Connector";
    // Only set platformUrl if BASE_URL exists
    const platformUrl = BASE_URL ? `${BASE_URL}${API_PATH}` : undefined;
  
    try {
      const response = await fetch("/api/createSourceConnector", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectorType: "GDriveVectorize",
          connectorName,
          platformUrl
        }),
      });
      
      const data = await response.json();
  
      if (!response.ok) {
        console.error("Error creating connector:", data.error);
        return;
      }

      // Set the vectorize connector state
      setVectorizeConnectorId(data);
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // Function for creating a White Label connector
  const handleCreateWhiteLabelConnector = async () => {
    const connectorName = "My White Label Google Drive Connector";
    // Only set platformUrl if BASE_URL exists
    const platformUrl = BASE_URL ? `${BASE_URL}${API_PATH}` : undefined;

    // Get the Google OAuth config
    const {clientId, clientSecret} = await fetch("/api/googleDrive/getGoogleOAuthConfig")
    .then(response => response.json())
    .then(data => {
      return {
        clientId: data.clientId,
        clientSecret: data.clientSecret
      }
    });

    try {
        const response = await fetch("/api/createSourceConnector", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            connectorType: "GDriveWhiteLabel",
            connectorName,
            platformUrl,
            clientId,
            clientSecret,
          }),
        });
        
        const data = await response.json();
    
        if (!response.ok) {
          console.error("Error creating connector:", data.error);
          return;
        }
        // Set the white-label connector state
        setWhiteLabelConnectorId(data);
    } catch (error) {
      console.error("Error creating White Label connector:", error);
    }
  };


// Handle the redirect to Google Drive connect for Vectorize
const handleVectorizeConnectGoogleDrive = async () => {
  setIsLoading(true);
  setError(null);
  setSuccessMessage(null);
  setAddedUserId(null);
  
  try {
    // Get Vectorize configuration
    const config = await fetch("/api/getVectorizeConfig")
      .then(response => response.json())
      .then(data => {
        return {
          organizationId: data.organizationId,
          authorization: data.authorization
        }
      });
    
    // Generate random user ID for demo purposes
    const randomUserId = "newVectorizeUser" + Math.floor(Math.random() * 1000);
    setVectorizeUserId(randomUserId);
    
    // Get one-time token from API
    const tokenResponse = await fetch(`/api/get_One_Time_Vectorize_Connector_Token?userId=${randomUserId}&connectorId=${vectorizeConnectorId!}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to generate one-time token. Status: ${response.status}`);
        }
        return response.json();
      });
    
    if (!tokenResponse || !tokenResponse.token) {
      throw new Error('Failed to generate one-time token');
    }
    
    // Only set platformUrl if redirect_URI exists
    const platformUrl = redirect_URI ? redirect_URI : undefined;
    
    // Call the redirect function with the obtained token
    await GoogleDriveOAuth.redirectToVectorizeConnect(
      tokenResponse.token,
      config.organizationId,
      platformUrl
    );
    
    // Mark as connected for demo purposes
    setIsVectorizeConnected(true);
    setSuccessMessage("Successfully connected to Google Drive!");
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Google Drive';
    setError(errorMessage);
    console.error('Google Drive connection error:', err);
  } finally {
    setIsLoading(false);
  }
};

// Handle editing Google Drive files for Vectorize connector
const handleVectorizeEditGoogleDrive = async () => {
  setIsVectorizeEditing(true);
  setError(null);
  setSuccessMessage(null);
  
  try {
    // Get Vectorize configuration
    const config = await fetch("/api/getVectorizeConfig")
      .then(response => response.json())
      .then(data => {
        return {
          organizationId: data.organizationId,
          authorization: data.authorization
        }
      });
    
    if (!vectorizeUserId) {
      throw new Error('No user ID found. Please connect to Google Drive first.');
    }
    
    // Get one-time token from API for edit operation
    const tokenResponse = await fetch(`/api/get_One_Time_Vectorize_Connector_Token?userId=${vectorizeUserId}&connectorId=${vectorizeConnectorId!}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to generate one-time token. Status: ${response.status}`);
        }
        return response.json();
      });
    
    if (!tokenResponse || !tokenResponse.token) {
      throw new Error('Failed to generate one-time token for edit operation');
    }
    
    // Only set platformUrl if redirect_URI exists
    const platformUrl = redirect_URI ? redirect_URI : undefined;
    
    // Call the redirect function with the obtained token
    await GoogleDriveOAuth.redirectToVectorizeEdit(
      tokenResponse.token,
      config.organizationId,
      platformUrl
    );
    
    setSuccessMessage("Successfully updated Google Drive file selections!");
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to edit Google Drive files';
    setError(errorMessage);
    console.error('Google Drive edit error:', err);
  } finally {
    setIsVectorizeEditing(false);
  }
};

// Handle removing a Vectorize user
const handleVectorizeRemoveUser = async () => {
  if (!vectorizeUserId || !vectorizeConnectorId) {
    setError('No user ID or connector ID available for Vectorize');
    return;
  }

  setIsRemoving(true);
  setError(null);
  setSuccessMessage(null);

  try {
    // Call the manage-oauth-user endpoint with 'remove' action
    const response = await fetch(`/api/manage-oauth-user/${vectorizeConnectorId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connectorType: 'googleDrive',
        action: 'remove',
        userId: vectorizeUserId
      })
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to remove Vectorize Google Drive user');
    }

    console.log('Vectorize Google Drive user removed successfully', responseData);
    setSuccessMessage(`Vectorize user ${vectorizeUserId} successfully removed!`);
    
    // Clear the Vectorize user data
    setVectorizeUserId(null);
    setIsVectorizeConnected(false);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Failed to remove Vectorize user');
    console.error('Vectorize user removal error:', error);
  } finally {
    setIsRemoving(false);
  }
};

  // Handle the redirect to Google Drive connect for White Label
  const handleWhiteLabelConnectGoogleDrive = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setAddedUserId(null);

    // fetch the Google OAuth config
    const {clientId, clientSecret, apiKey} = await fetch("/api/googleDrive/getGoogleOAuthConfig")
    .then(response => response.json())
    .then(data => {
      return {
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        apiKey: data.apiKey
      }
    });
    
    // Set to your redirectUri
    const redirectUri = "http://localhost:3001" + CALLBACK_PATH;
    
    const config: GoogleDriveOAuthConfig = {
      clientId,
      clientSecret,
      apiKey,
      redirectUri,
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
      ],
      onSuccess: async (selection) => {
        console.log('Google Drive connection successful:', selection);

        const { selectedFiles, refreshToken } = selection;
        const connectorId = whiteLabelConnectorId;

        // Save the selection data in state for potential editing later
        setSelectedFiles(selectedFiles);
        setRefreshToken(refreshToken);

        // Generate random user ID for demo purposes if none exists
        const newUserId = userId || "newWhiteLabelUser" + Math.floor(Math.random() * 1000);
        setUserId(newUserId);

        // Use the manage-oauth-user endpoint instead of add-oauth-user
        const url = `/api/manage-oauth-user/${connectorId}`;
        
        // Create the payload with connector type and action included
        const payload = {
          status: 'success', 
          connectorType: 'googleDrive',
          action: 'add', // Specify the action
          userId: newUserId,
          selection: { 
            selectedFiles, 
            refreshToken 
          }
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
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
          setUserId(responseData.userId);
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
    };

    const popup = GoogleDriveOAuth.startOAuth(config);
    
    if (!popup) {
      setError('Failed to open Google Drive connection popup');
      setIsLoading(false);
    }
  };

  // Handle editing file selections for existing user
  const handleEditFileSelections = async () => {
    setIsEditing(true);
    setError(null);
  
    try {
      // fetch the Google OAuth config
      const {clientId, clientSecret, apiKey} = await fetch("/api/googleDrive/getGoogleOAuthConfig")
        .then(response => response.json())
        .then(data => {
          return {
            clientId: data.clientId,
            clientSecret: data.clientSecret,
            apiKey: data.apiKey
          }
        });
      
      // Set to your redirectUri
      const redirectUri = "http://localhost:3001" + CALLBACK_PATH;
      
      const config: GoogleDriveOAuthConfig = {
        clientId,
        clientSecret,
        apiKey,
        redirectUri,
        scopes: [
          'https://www.googleapis.com/auth/drive.file',
        ],
        onSuccess: async (selection) => {
          console.log('Google Drive selection updated:', selection);
        
          const { selectedFiles, refreshToken: newRefreshToken } = selection;
          const connectorId = whiteLabelConnectorId;
        
          // Update the selection data in state
          setSelectedFiles(selectedFiles);
          setRefreshToken(newRefreshToken);
        
          // Call the API to update the user's selections with the manage-oauth-user endpoint
          try {
            const response = await fetch(`/api/manage-oauth-user/${connectorId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                connectorType: 'googleDrive',
                action: 'edit', // Specify the edit action
                userId: userId,
                selection: {
                  selectedFiles,
                  refreshToken: newRefreshToken
                }
              })
            });
        
            const responseData = await response.json();
            
            if (!response.ok) {
              throw new Error(responseData.error || 'Failed to update Google Drive files');
            }
        
            console.log('Google Drive files updated successfully', responseData);
            setSuccessMessage('File selections updated successfully!');
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to update selections');
            console.error('Update error:', error);
          } finally {
            setIsEditing(false);
          }
        },
        onError: (error) => {
          setError(error.message);
          setIsEditing(false);
        }
      };
      
      // Check if we have a refresh token to use
      if (!refreshToken) {
        throw new Error('No refresh token available. Please connect to Google Drive first.');
      }
  
      // Create an instance of GoogleDriveSelection and call the method
      const selectionHelper = new GoogleDriveSelection();
      const popup = await selectionHelper.startFileSelection(
        config,
        refreshToken,
        selectedFiles || undefined
      );
      
      if (!popup) {
        throw new Error('Failed to open file selection window');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit file selections';
      setError(errorMessage);
      console.error('Edit selections error:', err);
      setIsEditing(false);
    }
  };

  // Handle removing a White Label user
  const handleRemoveUser = async () => {
    if (!userId || !whiteLabelConnectorId) {
      setError('No user ID or connector ID available');
      return;
    }

    setIsRemoving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Call the manage-oauth-user endpoint with 'remove' action
      const response = await fetch(`/api/manage-oauth-user/${whiteLabelConnectorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectorType: 'googleDrive',
          action: 'remove', // Specify the remove action
          userId: userId
        })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to remove Google Drive user');
      }

      console.log('Google Drive user removed successfully', responseData);
      setSuccessMessage(`User ${userId} successfully removed!`);
      
      // Clear the user data
      setSelectedFiles(null);
      setRefreshToken(null);
      setUserId(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove user');
      console.error('Remove user error:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleClearVectorizeConnectorId = () => {
    setVectorizeConnectorId(null);
    setVectorizeUserId(null);
    setIsVectorizeConnected(false);
  };

  // Clear White Label connector state
  const handleClearWhiteLabelConnectorId = () => {
    setWhiteLabelConnectorId(null);
    setSelectedFiles(null);
    setRefreshToken(null);
    setUserId(null);
  };

  // Handle input for vectorize connector ID
  const handleVectorizeConnectorIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVectorizeInputConnectorId(value);
  };

  // Handle using the input connector ID for vectorize
  const handleUseVectorizeConnectorId = () => {
    if (vectorizeInputConnectorId.trim()) {
      setVectorizeConnectorId(vectorizeInputConnectorId.trim());
      // Clear the input after setting the connector ID
      setVectorizeInputConnectorId("");
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
            disabled={isRemoving}
          />
          <button
            onClick={handleUseWhiteLabelConnectorId}
            disabled={whiteLabelInputConnectorId.trim() === "" || isRemoving}
            className={`bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${
              whiteLabelInputConnectorId.trim() === "" || isRemoving ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            Use Connector ID
          </button>
        </div>

        <button
          onClick={handleCreateWhiteLabelConnector}
          disabled={!!whiteLabelConnectorId || isRemoving}
          className={`bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${
            whiteLabelConnectorId || isRemoving ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
          }`}
        >
          Create a new White Label Google Drive connector
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={handleWhiteLabelConnectGoogleDrive}
            disabled={!whiteLabelConnectorId || isLoading || isEditing || isRemoving}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !whiteLabelConnectorId || isLoading || isEditing || isRemoving ? 
                "bg-gray-400 text-white opacity-50 cursor-not-allowed" : 
                "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Connecting..." : "Connect with Google Drive using White Label"}
          </button>
          
          {/* Edit Selections Button */}
          <button
            onClick={handleEditFileSelections}
            disabled={!whiteLabelConnectorId || !refreshToken || isLoading || isEditing || isRemoving}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !whiteLabelConnectorId || !refreshToken || isLoading || isEditing || isRemoving ? 
                "bg-gray-400 text-white opacity-50 cursor-not-allowed" : 
                "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {isEditing ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⚪</span>
                Editing...
              </span>
            ) : (
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Selections
              </span>
            )}
          </button>
          
          {/* Remove User Button */}
          <button
            onClick={handleRemoveUser}
            disabled={!whiteLabelConnectorId || !userId || isLoading || isEditing || isRemoving}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !whiteLabelConnectorId || !userId || isLoading || isEditing || isRemoving ? 
                "bg-gray-400 text-white opacity-50 cursor-not-allowed" : 
                "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            <span className="flex items-center">
              {isRemoving ? (
                <span className="animate-spin mr-2">⚪</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path>
                  <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                </svg>
              )}
              {isRemoving ? "Removing..." : "Remove User"}
            </span>
          </button>
        </div>

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
            {selectedFiles && (
              <p className="mt-1 text-xs text-gray-500">
                {Object.keys(selectedFiles).length} files selected
              </p>
            )}
            {userId && (
              <p className="mt-1 text-xs text-gray-500">
                User ID: {userId}
              </p>
            )}
          </div>
          {whiteLabelConnectorId && (
            <button
              onClick={handleClearWhiteLabelConnectorId}
              disabled={isRemoving}
              className={`ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors ${
                isRemoving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Vectorize Connector Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Vectorize Connector</h2>

        {/* Add input field for connector ID */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={vectorizeInputConnectorId}
            onChange={handleVectorizeConnectorIdInput}
            placeholder="Enter existing connector ID"
            className="px-3 py-2 border border-gray-300 rounded-lg flex-grow text-black"
            disabled={isRemoving}
          />
          <button
            onClick={handleUseVectorizeConnectorId}
            disabled={vectorizeInputConnectorId.trim() === "" || isRemoving}
            className={`bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${
              vectorizeInputConnectorId.trim() === "" || isRemoving ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            Use Connector ID
          </button>
        </div>

        <button
          onClick={handleCreateVectorizeConnector}
          disabled={!!vectorizeConnectorId || isRemoving}
          className={`bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${
            vectorizeConnectorId || isRemoving ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
          }`}
        >
          Create a new Vectorize Google Drive connector
        </button>

        <div className="flex gap-3">
        <button 
          onClick={handleVectorizeConnectGoogleDrive}
          disabled={!vectorizeConnectorId || isLoading || isVectorizeEditing || isRemoving}
          className={`
            bg-green-600 text-white px-4 py-2 rounded-lg
            ${(!vectorizeConnectorId || isLoading || isVectorizeEditing || isRemoving) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}
            flex items-center gap-2
          `}
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⚪</span>
              Connecting...
            </>
          ) : (
            <>
              <Image 
                src="/GDrive.png" 
                alt="Google Drive Logo" 
                width={20} 
                height={20} 
                className="mr-2"
              />
              Connect with Google Drive using Vectorize
            </>
          )}
        </button>
          
          {/* Edit Button for Vectorize */}
          <button
            onClick={handleVectorizeEditGoogleDrive}
            disabled={!vectorizeConnectorId || !isVectorizeConnected || isLoading || isVectorizeEditing || isRemoving}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !vectorizeConnectorId || !isVectorizeConnected || isLoading || isVectorizeEditing || isRemoving ? 
                "bg-gray-400 text-white opacity-50 cursor-not-allowed" : 
                "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {isVectorizeEditing ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⚪</span>
                Editing...
              </span>
            ) : (
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Vectorize Files
              </span>
            )}
          </button>
          
          {/* Remove User Button for Vectorize */}
          <button
            onClick={handleVectorizeRemoveUser}
            disabled={!vectorizeConnectorId || !vectorizeUserId || !isVectorizeConnected || isLoading || isVectorizeEditing || isRemoving}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !vectorizeConnectorId || !vectorizeUserId || !isVectorizeConnected || isLoading || isVectorizeEditing || isRemoving ? 
                "bg-gray-400 text-white opacity-50 cursor-not-allowed" : 
                "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            <span className="flex items-center">
              {isRemoving ? (
                <span className="animate-spin mr-2">⚪</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path>
                  <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                </svg>
              )}
              {isRemoving ? "Removing..." : "Remove User"}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-fit bg-gray-50 rounded-lg p-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Vectorize Connector ID:</h3>
            <p className="mt-1 text-sm font-mono">
              {vectorizeConnectorId ? (
                <span className="text-black">{vectorizeConnectorId}</span>
              ) : (
                <span className="text-gray-400 italic">undefined</span>
              )}
            </p>
            {vectorizeUserId && isVectorizeConnected && (
              <p className="mt-1 text-xs text-gray-500">
                Connected as user: {vectorizeUserId}
              </p>
            )}
          </div>
          {vectorizeConnectorId && (
            <button
              onClick={handleClearVectorizeConnectorId}
              disabled={isRemoving}
              className={`ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors ${
                isRemoving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Clear
            </button>
          )}
        </div>
      </section>
    </div>
  );
}