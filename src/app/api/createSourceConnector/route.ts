// /api/createSourceConnector/route.ts

import { NextResponse } from "next/server";
import { 
  createVectorizeGDriveConnector, 
  createWhiteLabelGDriveConnector,
  createVectorizeDropboxConnector,
  createWhiteLabelDropboxConnector,
  VectorizeAPIConfig 
} from "@vectorize-io/vectorize-connect";

/**
 * Creates a new connector with the provided configuration based on connectorType
 * @param request - The incoming HTTP request containing connector configuration
 * @returns JSON response with the created connector ID or error message
 */
export async function POST(request: Request) {
  try {
    // 1. Parse the incoming request
    const { 
      connectorType, 
      connectorName, 
      platformUrl, 
      clientId, 
      clientSecret,
      appKey,
      appSecret
    } = await request.json();

    // 2. Gather environment variables for your Vectorize config
    const config: VectorizeAPIConfig = {
      organizationId: process.env.VECTORIZE_ORGANIZATION_ID ?? "",
      authorization: process.env.VECTORIZE_API_KEY ?? "",
    };

    // Optionally, validate environment variables before proceeding
    if (!config.organizationId) {
      return NextResponse.json(
        { error: "Missing VECTORIZE_ORGANIZATION_ID in environment" },
        { status: 500 }
      );
    }
    if (!config.authorization) {
      return NextResponse.json(
        { error: "Missing VECTORIZE_API_KEY in environment" },
        { status: 500 }
      );
    }

    console.log("Received request to create connector:", {
      connectorType,
      connectorName,
      platformUrl,
    });

    // Use provided platformUrl or pass undefined to use the default from vectorize-connect
    const apiPlatformUrl = platformUrl;
    
    // 3. Call the appropriate function based on connector type
    let connectorId: string;
    
    if (connectorType === "GDriveWhiteLabel") {
      // Validate required parameters for white label connector
      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { error: "Client ID and Client Secret are required for white label connectors" },
          { status: 400 }
        );
      }
      
      connectorId = await createWhiteLabelGDriveConnector(
        config,
        connectorName,
        clientId,
        clientSecret,
        apiPlatformUrl
      );
    } else if (connectorType === "GDriveVectorize") {
      connectorId = await createVectorizeGDriveConnector(
        config,
        connectorName,
        apiPlatformUrl
      );
    } else if (connectorType === "DropboxWhiteLabel") {
      // Validate required parameters for white label Dropbox connector
      if (!appKey || !appSecret) {
        return NextResponse.json(
          { error: "App Key and App Secret are required for white label Dropbox connectors" },
          { status: 400 }
        );
      }
      
      connectorId = await createWhiteLabelDropboxConnector(
        config,
        connectorName,
        appKey,
        appSecret,
        apiPlatformUrl
      );
    } else if (connectorType === "DropboxVectorize") {
      connectorId = await createVectorizeDropboxConnector(
        config,
        connectorName,
        apiPlatformUrl
      );
    } else {
      return NextResponse.json(
        { error: "Invalid connector type. Must be one of: 'GDriveWhiteLabel', 'GDriveVectorize', 'DropboxWhiteLabel', 'DropboxVectorize'" },
        { status: 400 }
      );
    }

    console.log("Connector created successfully:", connectorId);

    return NextResponse.json(connectorId, { status: 200 });
  } catch (error: any) {
    // 4. Error handling
    console.error("Error creating connector:", error);
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
