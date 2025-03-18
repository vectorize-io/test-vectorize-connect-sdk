'use client';

import { useState } from 'react';
import { redirectToVectorizeGoogleDriveConnect, startGDriveOAuth } from 'vectorize-connect';

export default function Home() {
  // NON WHITE LABEL states
  const [nonWhiteLabelconnectorId, setnonWhiteLabelconnectorId] = useState<string | null>(null);
  const [nonWhiteLabelInputConnectorId, setNonWhiteLabelInputConnectorId] = useState<string>("");

  // WHITE LABEL states 
  const [whiteLabelConnectorId, setWhiteLabelConnectorId] = useState<string | null>(null);
  const [whiteLabelInputConnectorId, setWhiteLabelInputConnectorId] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateGDriveMultiConnector = async () => {
    // NON WHITE LABEL: Set the parameters for the request
    const whiteLabel = false;
    const connectorName = "My NON WHITE LABEL GDrive Connector";
  
    try {
      const response = await fetch("/api/createGDriveConnector", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whiteLabel,
          connectorName,
          platformUrl: "http://localhost:3000/api",
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
      setnonWhiteLabelconnectorId(data);
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // Placeholder function for creating a white label multi custom connector
  const handleCreateGDriveMultiCustomConnector = async () => {
    const whiteLabel = true;
    const connectorName = "My WHITE LABEL GDrive Connector";

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET;

    try {
        const response = await fetch("/api/createGDriveConnector", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            whiteLabel,
            connectorName,
            platformUrl: "http://localhost:3000/api",
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
      console.error("Error creating white label multi custom connector:", error);
    }
  };

  // Handle the redirect to Google Drive connect for non white label
  const handleNonWhiteLabelConnectGoogleDrive = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a callback URL for the server API
      const callbackUrl = `${window.location.origin}/api/add-google-drive-user/${nonWhiteLabelconnectorId}`;
      
      // Call the redirect function (opens in a new tab)
      await redirectToVectorizeGoogleDriveConnect(
        callbackUrl, 
        'http://localhost:3000' // Or your environment-specific platform URL
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Google Drive';
      setError(errorMessage);
      console.error('Google Drive connection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle the redirect to Google Drive connect for white label
  const handleWhiteLabelConnectGoogleDrive = async () => {
    setIsLoading(true);
    setError(null);
    
    const config = {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET!,
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
      redirectUri: `${window.location.origin}/api/google-callback`
    };

    const popup = startGDriveOAuth({
      ...config,
      scopes : [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
      ],
      onSuccess: async (selection) => {
        console.log('Google Drive connection successful:', selection);

        const { fileIds, refreshToken } = selection;
        const connectorId = whiteLabelConnectorId;

        const url = `/api/add-google-drive-user/${connectorId}`;
        const body = JSON.stringify({ status: 'success', selection: { fileIds, refreshToken } });

        const response = await fetch(url, {
          method: 'POST',
          body
        });

        console.log('Response:', response);

        if (!response.ok) {
          setError('Failed to add Google Drive user');
          return;
        }

        console.log('Google Drive user added successfully');
        setIsLoading(false);
      },
      onError: (error) => {
       setError(error.message);
      }
    });
    
    if (!popup) {
      setError('Failed to open Google Drive connection popup');
    }

  };

  const handleClearConnectorId = () => {
    setnonWhiteLabelconnectorId(null);
  };

  // Clear white label connector state
  const handleClearWhiteLabelConnectorId = () => {
    setWhiteLabelConnectorId(null);
  };

  // Handle input for non-white-label connector ID
  const handleNonWhiteLabelConnectorIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNonWhiteLabelInputConnectorId(e.target.value);
  };

  // Handle using the input connector ID for non-white-label
  const handleUseNonWhiteLabelConnectorId = () => {
    if (nonWhiteLabelInputConnectorId.trim()) {
      setnonWhiteLabelconnectorId(nonWhiteLabelInputConnectorId.trim());
    }
  };

  // Handle input for white-label connector ID
  const handleWhiteLabelConnectorIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhiteLabelInputConnectorId(e.target.value);
  };

  // Handle using the input connector ID for white-label
  const handleUseWhiteLabelConnectorId = () => {
    if (whiteLabelInputConnectorId.trim()) {
      setWhiteLabelConnectorId(whiteLabelInputConnectorId.trim());
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* WHITE LABEL SECTION */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">WHITE LABEL</h2>

        {/* Add input field for connector ID */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={whiteLabelInputConnectorId}
            onChange={handleWhiteLabelConnectorIdInput}
            placeholder="Enter existing connector ID"
            className="px-3 py-2 border border-gray-300 rounded-lg flex-grow text-black"
            disabled={!!whiteLabelConnectorId}
          />
          <button
            onClick={handleUseWhiteLabelConnectorId}
            disabled={!whiteLabelInputConnectorId.trim()}
            className={`bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${
              !whiteLabelInputConnectorId.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            Use Connector ID
          </button>
        </div>

        <button
          onClick={handleCreateGDriveMultiCustomConnector}
          disabled={!!whiteLabelConnectorId}
          className={`bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${
            whiteLabelConnectorId ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
          }`}
        >
          Create a new GDrive_MULTI_CUSTOM connector
        </button>
        
        <button
          onClick={handleWhiteLabelConnectGoogleDrive}
          disabled={!whiteLabelConnectorId || isLoading}
          className={`px-4 py-2 rounded-lg transition-colors ${
            !whiteLabelConnectorId || isLoading ? "bg-gray-400 text-white opacity-50 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isLoading ? "Connecting..." : "Connect with Google Drive using White label"}
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
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Add input field for connector ID */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={nonWhiteLabelInputConnectorId}
            onChange={handleNonWhiteLabelConnectorIdInput}
            placeholder="Enter existing connector ID"
            className="px-3 py-2 border border-gray-300 rounded-lg flex-grow text-black"
            disabled={!!nonWhiteLabelconnectorId}
          />
          <button
            onClick={handleUseNonWhiteLabelConnectorId}
            disabled={!nonWhiteLabelInputConnectorId.trim()}
            className={`bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${
              !nonWhiteLabelInputConnectorId.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            Use Connector ID
          </button>
        </div>

        <button
          onClick={handleCreateGDriveMultiConnector}
          disabled={!!nonWhiteLabelconnectorId}
          className={`bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${
            nonWhiteLabelconnectorId ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
          }`}
        >
          Create a new GDrive_MULTI connector
        </button>

        <div className="space-y-4">
          <button 
            onClick={handleNonWhiteLabelConnectGoogleDrive}
            disabled={!nonWhiteLabelconnectorId || isLoading}
            className={`
              bg-green-600 text-white px-4 py-2 rounded-lg
              ${(!nonWhiteLabelconnectorId || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}
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
              {nonWhiteLabelconnectorId ? (
                <span className="text-black">{nonWhiteLabelconnectorId}</span>
              ) : (
                <span className="text-gray-400 italic">undefined</span>
              )}
            </p>
          </div>
          {nonWhiteLabelconnectorId && (
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
