import { VectorizeAPIConfig } from "@vectorize-io/vectorize-connect";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {

    const config: VectorizeAPIConfig = {
        organizationId: process.env.VECTORIZE_ORG ?? "",
        authorization: process.env.VECTORIZE_API_KEY ?? "",
    };

    if (!config.organizationId || !config.authorization) {
        return NextResponse.json({ error: "Vectorize API configuration is missing." }, { status: 500 });
    }

    return NextResponse.json(config, { status: 200 });
    
}