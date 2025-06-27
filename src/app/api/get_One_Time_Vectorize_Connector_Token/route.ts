import { getOneTimeConnectorToken, VectorizeAPIConfig } from "@vectorize-io/vectorize-connect";
import { NextRequest, NextResponse } from "next/server";

/**
 * API route handler for generating a Vectorize connector token
 * 
 * This endpoint:
 * - Extracts user and connector IDs from session or request body
 * - Calls the Vectorize API to get a one-time token
 * - Returns the token response to the client
 */
export async function GET(request: NextRequest) {
    try {
      // Get authentication details from environment variables or secure storage
      const apiKey = process.env.VECTORIZE_API_KEY;
      const organizationId = process.env.VECTORIZE_ORGANIZATION_ID;
      
      if (!apiKey || !organizationId) {
        return NextResponse.json({ 
          error: 'Missing Vectorize API configuration' 
        }, { status: 500 });
      }

      const Base_URL = process.env.VECTORIZE_API_URL
      const API_Path = process.env.VECTORIZE_API_PATH
      
      // Configure the Vectorize API client
      const config: VectorizeAPIConfig = {
        authorization: apiKey,
        organizationId: organizationId
      };
      
    // get userId and connectorId from request url
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const connectorId = searchParams.get('connectorId');
    
    // Validate userId and connectorId
    if (!userId || !connectorId) {
        return NextResponse.json({ 
        error: 'Missing userId or connectorId' 
        }, { status: 400 });
    }



    console.log("getting one time connector token for userId:", userId, "and connectorId:", connectorId, "with URL" , `${Base_URL}${API_Path}`);

      // Determine platformUrl - pass undefined if BASE_URL is not set
      const platformUrl = Base_URL ? `${Base_URL}${API_Path}` : undefined;
      
      // Call Vectorize API to get the token
      const tokenResponse = await getOneTimeConnectorToken(
        config,
        userId,
        connectorId,
        platformUrl,
      );
      
      console.log("Token response:", tokenResponse);

      // Return the token to the client
      return NextResponse.json(tokenResponse, { status: 200 });
      
    } catch (error) {
      console.error('Error generating token:', error);
      return NextResponse.json({ 
        error: 'Failed to generate token', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }, { status: 500 });
    }
  }
