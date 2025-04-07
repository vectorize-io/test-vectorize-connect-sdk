// app/api/google-drive-callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {manageGDriveUser, VectorizeAPIConfig} from '@vectorize-io/vectorize-connect';

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
    // /api/add-google-drive-user/{connectorId}
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

    let selectionData = null;
    if (body.status === 'success') {
         selectionData = body.selection;
    }

    // Generate a random user ID for testing
    const userId = "newTestUser" + Math.floor(Math.random() * 1000);

    // Determine platformUrl - pass undefined if BASE_URL is not set
    const platformUrl = BASE_URL ? `${BASE_URL}${API_PATH}` : undefined;

    console.log("Received request to add Google Drive user:", {
        selectionData,
        connectorId,
        userId,
        platformUrl,
        config
    });

    // Call the manageGDriveUser function from @vectorize-io/vectorize-connect
    const response = await manageGDriveUser(
        config,
        connectorId,
        selectionData.selectedFiles,
        selectionData.refreshToken,
        userId,
        "add", // "edit" , "remove" are other options
        platformUrl // Use undefined if BASE_URL is not set
    );


    const data = await response.json();

    if (!response.ok) {
        console.error("Error managing Google Drive user:", data.error);
        return buildCorsResponse({ error: 'Failed to process callback' }, 500);
    }

    // Return success response with CORS headers and include the userId
    // Determine the origin
    const originHeader = request.headers.get('origin') || '';
    const origin = ALLOWED_ORIGINS.includes(originHeader) ? originHeader : 'null';
    return buildCorsResponse({ success: true, userId: userId }, 200, origin);
  } catch (error) {
    console.error('Error in Google Drive callback route:', error);

    // Return error JSON with CORS headers
    // Choose the appropriate origin, or set as 'null'
    return buildCorsResponse({ error: 'Failed to process callback' }, 500);
  }
}

/**
 * Handle GET requests
 */
export async function GET(request: NextRequest) {
  // Determine the origin
  const originHeader = request.headers.get('origin') || '';
  const origin = ALLOWED_ORIGINS.includes(originHeader) ? originHeader : 'null';

  console.log('Received GET request to Google Drive callback:', request.url);

  // Return simple response for GET requests, with CORS headers
  return buildCorsResponse({
    message: 'Google Drive callback endpoint is working. This endpoint expects POST requests with JSON data.'
  }, 200, origin);
}