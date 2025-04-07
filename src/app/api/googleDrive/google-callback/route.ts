// /api/google-callback/route.ts
import { GoogleDriveOAuth, GoogleDriveOAuthConfig } from '@vectorize-io/vectorize-connect';
import { type NextRequest } from 'next/server';

// Base URL for API endpoints
const CALLBACK_PATH = '/api/googleDrive/google-callback/';

/**
 * Handles Google OAuth callback requests
 * @param request - The incoming Next.js request with OAuth code and error parameters
 * @returns Response from the Google Drive picker callback handler
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Create config object with all required fields
  const config: GoogleDriveOAuthConfig = {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    apiKey: process.env.GOOGLE_API_KEY!,
    redirectUri: "http://localhost:3001" + CALLBACK_PATH,
    // These callbacks won't be used in this context, but are required by the type
    onSuccess: () => {},
    onError: () => {}
  };

  try {
    // Use the GoogleDriveOAuth class to create the callback response
    return await GoogleDriveOAuth.createCallbackResponse(
      code || '',  // code is required, pass empty string if null
      config,
      error || undefined  // pass the error if it exists
    );
  } catch (err) {
    // In case of any unexpected errors
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    return await GoogleDriveOAuth.createCallbackResponse(
      '',
      config,
      errorMessage
    );
  }
}