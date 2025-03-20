import { VectorizeAPIConfig } from "@vectorize-io/vectorize-connect";
import { NextRequest, NextResponse } from "next/server";

/**
 * Retrieves Vectorize API configuration from environment variables
 * @param request - The incoming Next.js request
 * @returns JSON response with Vectorize API configuration
 */
export async function GET(request: NextRequest) {

    const config: VectorizeAPIConfig = {
        organizationId: process.env.VECTORIZE_ORG ?? "",
        authorization: process.env.VECTORIZE_TOKEN ?? "",
    };

    if (!config.organizationId || !config.authorization) {
        return NextResponse.json({ error: "Vectorize API configuration is missing." }, { status: 500 });
    }

    return NextResponse.json(config, { status: 200 });
    
}
