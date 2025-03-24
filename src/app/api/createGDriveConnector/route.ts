// /api/createGDriveConnector/route.ts

import { NextResponse } from "next/server";
import { createGDriveSourceConnector, VectorizeAPIConfig } from "@vectorize-io/vectorize-connect";

/**
 * Creates a new Google Drive connector with the provided configuration
 * @param request - The incoming HTTP request containing connector configuration
 * @returns JSON response with the created connector ID or error message
 */
export async function POST(request: Request) {
  try {
    // 1. Parse the incoming request
    const { whiteLabel, connectorName, platformUrl, clientId, clientSecret } = await request.json();

    // 2. Gather environment variables for your Vectorize config
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

    console.log("Received request to create GDrive connector:", {
      whiteLabel,
      connectorName,
      platformUrl,
      clientId,
      clientSecret,
    });

    // Use provided platformUrl or pass undefined to use the default from vectorize-connect
    const apiPlatformUrl = platformUrl;
    
    // 3. Call the utility function to create the connector
    const connectorId = await createGDriveSourceConnector(
      config,
      whiteLabel,
      connectorName,
      apiPlatformUrl,
      clientId,
      clientSecret
    );

    console.log("Connector created successfully:", connectorId);

    return NextResponse.json(connectorId, { status: 200 });
  } catch (error: any) {
    // 6. Error handling
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
