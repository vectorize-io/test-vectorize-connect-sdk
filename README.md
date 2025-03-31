# test-vectorize-connect-sdk

A Next.js demonstration project showcasing the functionality of the [@vectorize-io/vectorize-connect](https://www.npmjs.com/package/@vectorize-io/vectorize-connect) package.

## Overview

This repository provides a practical implementation of the Vectorize Connect SDK, allowing developers to quickly understand how to integrate and utilize the package's features in a Next.js environment.

## Features

- Integration examples with the Vectorize Connect SDK
- Google Drive connectivity demonstration
- White label connector implementation
- Interactive UI components for testing SDK functionality

## Prerequisites

- Node.js (v16+)
- npm or yarn
- A Vectorize account and API token

## Environment Setup

To fully test the features of this demonstration, you'll need to set up the following environment variables:

```
VECTORIZE_TOKEN=your_vectorize_token
VECTORIZE_ORG=your_vectorize_org_id
```

### Google Drive Features

To test the Google Drive integration features, the above environment variables are required. 

Additionally, if you wish to try the white label connector functionality, you'll need to set these Google-specific variables:

```
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_API_KEY=your_google_api_key
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/test-vectorize-connect-sdk.git
cd test-vectorize-connect-sdk
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your environment variables.

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

The demo application provides a user interface to test various features of the Vectorize Connect SDK. You can:

- Connect to your Vectorize account
- Test Google Drive integrations
- Try out white label connector functionality
- Explore SDK methods and responses

## Example Code

Here's a simple example of how the SDK is implemented in this demo:

```jsx
import { VectorizeConnectClient } from '@vectorize-io/vectorize-connect';

// Initialize the client
const client = new VectorizeConnectClient({
  token: process.env.VECTORIZE_TOKEN,
  orgId: process.env.VECTORIZE_ORG
});

// Example function to connect to Google Drive
async function connectGoogleDrive() {
  const response = await client.connectors.google.authorize();
  // Handle the response
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)

## Support

For questions or support with the Vectorize Connect SDK, please refer to the [official documentation](https://docs.vectorize.io) or reach out to the Vectorize support team.