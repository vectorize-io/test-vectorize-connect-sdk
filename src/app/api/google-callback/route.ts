// /api/google-callback/route.ts
import { createGDrivePickerCallbackResponse } from '@vectorize-io/vectorize-connect';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Create config object with all required fields
  const config = {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    apiKey: process.env.GOOGLE_API_KEY!,
    redirectUri: 'http://localhost:3001/api/google-callback'
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