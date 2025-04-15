// /api/dropbox/getDropboxOAuthConfig/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get credentials from environment variables
    const appKey = process.env.DROPBOX_APP_KEY;
    const appSecret = process.env.DROPBOX_APP_SECRET;
    
    // Validate that credentials exist
    if (!appKey || !appSecret) {
      console.error('Missing Dropbox OAuth credentials:', {
        hasAppKey: !!appKey,
        hasAppSecret: !!appSecret
      });
      
      return NextResponse.json(
        { error: 'Missing Dropbox OAuth credentials' },
        { status: 500 }
      );
    }
    
    // Return the configuration
    return NextResponse.json({
      appKey,
      appSecret
    });
  } catch (error) {
    console.error('Error retrieving Dropbox OAuth config:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve Dropbox OAuth configuration' },
      { status: 500 }
    );
  }
}