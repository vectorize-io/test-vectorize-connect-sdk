// app/api/add-oauth-user/[connectorId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { manageGDriveUser, manageDropboxUser, VectorizeAPIConfig } from '@vectorize-io/vectorize-connect';

// Base URL for API endpoints
const BASE_URL = process.env.VECTORIZE_API_URL;
const API_PATH = process.env.VECTORIZE_API_PATH;

const ALLOWED_ORIGINS = [BASE_URL, 'https://api.vectorize.io/v1'].filter(Boolean); 
// Adjust this array for all the origins you want to allow

/**
 * Helper function to build a response with CORS headers.
 */
function buildCorsResponse(body: any, status = 200, origin = BASE_URL || 'https://api.vectorize.io/v1') {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });

  return new NextResponse(JSON.stringify(body), { status, headers });
}

/**
 * Preflight handler for OPTIONS requests.
 * Browser sends this before POST if it's a cross-origin request.
 */
export async function OPTIONS(request: NextRequest) {
  // Check if the Origin of this request is allowed
  const originHeader = request.headers.get('origin') || '';
  const origin = ALLOWED_ORIGINS.includes(originHeader) ? originHeader : 'null';

  // Return CORS headers
  return buildCorsResponse(null, 200, origin);
}

/**
 * Handle POST requests
 */
export async function POST(request: NextRequest) {
  try {
    // Create a URL object from the incoming request URL
    const url = new URL(request.url);

    // Split the pathname into segments
    const segments = url.pathname.split('/');
    
    // Assuming the URL is of the format:
    // /api/add-oauth-user/{connectorId}
    // the connectorId will be the last segment of the pathname.
    const connectorId = segments[segments.length - 1];

    const config: VectorizeAPIConfig = {
      organizationId: process.env.VECTORIZE_ORG ?? "",
      authorization: process.env.VECTORIZE_TOKEN ?? "",
    };

    // Optionally, validate environment variables before proceeding
    if (!config.organizationId) {
      return NextResponse.json(
        { error: "Missing VECTORIZE_ORG in environment" },
        { status: 500 }
      );
    }
    if (!config.authorization) {
      return NextResponse.json(
        { error: "Missing VECTORIZE_TOKEN in environment" },
        { status: 500 }
      );
    }

    // Get the request body
    const body = await request.json();

    if (!body) {
      throw new Error('Request body is required');
    }

    // Extract connector type from the request body
    const connectorType = body.connectorType;
    
    // Extract action from the request body, default to "add" if not provided
    const action = body.action
    
    const selectionData = body.selection;

    const userId = body.userId;

    // Determine platformUrl - pass undefined if BASE_URL is not set
    const platformUrl = BASE_URL ? `${BASE_URL}${API_PATH}` : undefined;

    console.log("Received request to manage user:", {
      connectorType,
      action,
      selectionData,
      connectorId,
      userId,
      platformUrl,
      config
    });

    let response;

    // Handle different connector types
    switch (connectorType) {
      case 'googleDrive':
        // Call the manageGDriveUser function for Google Drive connectors
        if (action !== "remove" && (!selectionData || !selectionData.selectedFiles || !selectionData.refreshToken)) {
          throw new Error('Selected files and refresh token are required for Google Drive connectors (except for remove action)');
        }

        response = await manageGDriveUser(
          config,
          connectorId,
          selectionData?.selectedFiles || null,
          selectionData?.refreshToken || "",
          userId,
          action, // Use the action from the request body
          platformUrl
        );
        break;
      
      case 'dropbox':
        // Call the manageDropboxUser function for Dropbox connectors
        if (action !== "remove" && (!selectionData || !selectionData.selectedFiles || !selectionData.refreshToken)) {
          throw new Error('Selected files and refresh token are required for Dropbox connectors (except for remove action)');
        }

        response = await manageDropboxUser(
          config,
          connectorId,
          selectionData?.selectedFiles || null,
          selectionData?.refreshToken || "",
          userId,
          action, // Use the action from the request body
          platformUrl
        );
        break;

      default:
        throw new Error(`Unsupported connector type: ${connectorType}`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error managing ${connectorType} user:`, errorData);
      return buildCorsResponse({ 
        error: `Failed to process ${connectorType} ${action} operation`,
        details: errorData 
      }, 500);
    }

    const responseData = await response.json().catch(() => ({}));

    // Return success response with CORS headers and include the userId
    // Determine the origin
    const originHeader = request.headers.get('origin') || '';
    const origin = ALLOWED_ORIGINS.includes(originHeader) ? originHeader : 'null';
    return buildCorsResponse({ 
      success: true, 
      userId: userId,
      connectorType: connectorType,
      action: action,
      data: responseData
    }, 200, origin);
  } catch (error) {
    console.error('Error in OAuth callback route:', error);

    // Return error JSON with CORS headers
    // Choose the appropriate origin, or set as 'null'
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return buildCorsResponse({ 
      error: 'Failed to process callback',
      message: errorMessage 
    }, 500);
  }
}

/**
 * Handle GET requests
 */
export async function GET(request: NextRequest) {
  // Determine the origin
  const originHeader = request.headers.get('origin') || '';
  const origin = ALLOWED_ORIGINS.includes(originHeader) ? originHeader : 'null';

  console.log('Received GET request to OAuth callback:', request.url);

  // Return simple response for GET requests, with CORS headers
  return buildCorsResponse({
    message: 'OAuth callback endpoint is working. This endpoint expects POST requests with JSON data.'
  }, 200, origin);
}