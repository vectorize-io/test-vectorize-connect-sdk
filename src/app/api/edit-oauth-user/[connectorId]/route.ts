// /api/edit-oauth-user/[connectorId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { manageGDriveUser, VectorizeAPIConfig } from '@vectorize-io/vectorize-connect';

// Base URL for API endpoints
const BASE_URL = process.env.VECTORIZE_API_URL;
const API_PATH = process.env.VECTORIZE_API_PATH;

const ALLOWED_ORIGINS = [BASE_URL, 'https://api.vectorize.io/v1'].filter(Boolean);

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
 */
export async function OPTIONS(request: NextRequest) {
  const originHeader = request.headers.get('origin') || '';
  const origin = ALLOWED_ORIGINS.includes(originHeader) ? originHeader : 'null';
  return buildCorsResponse(null, 200, origin);
}

/**
 * Handle POST requests for editing a user's file selections
 */
export async function POST(request: NextRequest) {
  try {
    // Extract the connector ID from the URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const connectorId = segments[segments.length - 1];

    // Set up the Vectorize API config
    const config: VectorizeAPIConfig = {
      organizationId: process.env.VECTORIZE_ORG ?? "",
      authorization: process.env.VECTORIZE_TOKEN ?? "",
    };

    // Validate the config
    if (!config.organizationId) {
      return NextResponse.json({ error: "Missing VECTORIZE_ORG in environment" }, { status: 500 });
    }
    if (!config.authorization) {
      return NextResponse.json({ error: "Missing VECTORIZE_TOKEN in environment" }, { status: 500 });
    }

    // Parse the request body
    const body = await request.json();

    if (!body) {
      throw new Error('Request body is required');
    }

    // Extract the necessary data from the request
    const { connectorType, userId, selectedFiles, refreshToken } = body;

    // Validate the required fields
    if (!connectorType) {
      return NextResponse.json({ error: "Missing connectorType in request" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "Missing userId in request" }, { status: 400 });
    }
    if (!refreshToken) {
      return NextResponse.json({ error: "Missing refreshToken in request" }, { status: 400 });
    }
    if (!selectedFiles) {
      return NextResponse.json({ error: "Missing selectedFiles in request" }, { status: 400 });
    }

    // Determine platformUrl - pass undefined if BASE_URL is not set
    const platformUrl = BASE_URL ? `${BASE_URL}${API_PATH}` : undefined;

    console.log("Received request to edit user files:", {
      connectorType,
      connectorId,
      userId,
      filesCount: Object.keys(selectedFiles).length,
      platformUrl
    });

    let response;

    // Handle different connector types
    switch (connectorType) {
      case 'googleDrive':
        // Call the manageGDriveUser function with the 'edit' action
        response = await manageGDriveUser(
          config,
          connectorId,
          selectedFiles,
          refreshToken,
          userId,
          "edit", // Use "edit" action for updating files
          platformUrl
        );
        break;

      // Add cases for other connector types here
      
      default:
        throw new Error(`Unsupported connector type: ${connectorType}`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error editing ${connectorType} user files:`, errorData);
      return buildCorsResponse({ 
        error: `Failed to edit ${connectorType} file selections`,
        details: errorData 
      }, 500);
    }

    const responseData = await response.json().catch(() => ({}));

    // Determine the origin
    const originHeader = request.headers.get('origin') || '';
    const origin = ALLOWED_ORIGINS.includes(originHeader) ? originHeader : 'null';

    // Return success response
    return buildCorsResponse({ 
      success: true, 
      message: 'File selections updated successfully',
      userId: userId,
      connectorType: connectorType,
      data: responseData
    }, 200, origin);
  } catch (error) {
    console.error('Error in edit OAuth user route:', error);

    // Return error JSON with CORS headers
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return buildCorsResponse({ 
      error: 'Failed to process edit request',
      message: errorMessage 
    }, 500);
  }
}