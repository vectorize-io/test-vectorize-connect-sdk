// /api/google-callback/route.ts
import { createGDrivePickerCallbackResponse } from '@vectorize-io/vectorize-connect';
import { type NextRequest } from 'next/server';

// Base URL for API endpoints
const CALLBACK_PATH = '/api/google-callback';

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
  const config = {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    apiKey: process.env.GOOGLE_API_KEY!,
    redirectUri: "http://localhost:3001" + CALLBACK_PATH,
  };

  try {
    // New API: createCallbackResponse takes code, config, and optional error
    return createGDrivePickerCallbackResponse(
      code || '',  // code is required, pass empty string if null
      config,
      error || undefined  // pass the error if it exists
    );
  } catch (err) {
    // In case of any unexpected errors
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    return createGDrivePickerCallbackResponse(
      '',
      config,
      errorMessage
    );
  }
}
