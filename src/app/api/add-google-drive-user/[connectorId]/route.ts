// app/api/google-drive-callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {manageGDriveUser} from 'vectorize-connect';


interface VectorizeAPIConfig {
    organizationId: string;
    authorization: string;
  }

const ALLOWED_ORIGINS = ['http://localhost:3000']; 
// Adjust this array for all the origins you want to allow

/**
 * Helper function to build a response with CORS headers.
 */
function buildCorsResponse(body: any, status = 200, origin = 'http://localhost:3000') {
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
 * Browser sends this before POST if it’s a cross-origin request.
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
        { error: "Missing VECTORIZE_ORG_ID in environment" },
        { status: 500 }
        );
    }
    if (!config.authorization) {
        return NextResponse.json(
        { error: "Missing VECTORIZE_AUTH_TOKEN in environment" },
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

    // Call the manageGDriveUser function from vectorize-connect
    const response = await manageGDriveUser(
        config,
        connectorId,
        selectionData.fileIds,
        selectionData.refreshToken,
        "newTestUser",
        "add",
        "http://localhost:3000/api"
    );

    console.log("reponse", response);

    const data = await response.json();

    console.log("data", data);

    if (!response.ok) {
        console.error("Error managing Google Drive user:", data.error);
        return;
    }

    // Return success response with CORS headers
    // Determine the origin
    const originHeader = request.headers.get('origin') || '';
    const origin = ALLOWED_ORIGINS.includes(originHeader) ? originHeader : 'null';
    return buildCorsResponse({ success: true }, 200, origin);

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
