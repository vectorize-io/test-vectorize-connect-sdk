// /api/createGDriveConnector/route.ts

import { NextResponse } from "next/server";
import { createGDriveSourceConnector } from "vectorize-connect";

// Provide the structure for your config object
interface VectorizeAPIConfig {
  organizationId: string;
  authorization: string;
}

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

    console.log("Received request to create GDrive connector:", {
      whiteLabel,
      connectorName,
      platformUrl,
      clientId,
      clientSecret,
    });

    // 3. Call the utility function to create the connector
    const connectorId = await createGDriveSourceConnector(
      config,
      whiteLabel,
      connectorName,
      platformUrl,
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
