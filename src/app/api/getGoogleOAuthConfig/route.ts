import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {

    const config = {
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        apiKey : process.env.GOOGLE_API_KEY!,
    }

    if (!config.clientId || !config.clientSecret || !config.apiKey) {
        return NextResponse.json({ error: "Google OAuth configuration is missing." }, { status: 500 });
    }

    return NextResponse.json(config, { status: 200 });
    
}