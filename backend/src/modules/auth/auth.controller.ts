import { Request, Response } from 'express';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createUser } from '../users/user.service'; //
import { sendSuccess, sendError } from '../../utils/responseHelpers'; //

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION,
});

/**
 * POST /api/auth/register
 * Handles Cognito signup and creates the MongoDB user document.
 */
export const registerController = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    // Step 1: Create user in Cognito
    const cognitoResult = await cognitoClient.send(
      new SignUpCommand({
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'given_name', Value: firstName },
          { Name: 'family_name', Value: lastName },
        ],
      }),
    );

    const cognitoSub = cognitoResult.UserSub;

    if (!cognitoSub) {
      return sendError(res, 'Registration failed at Cognito', 500); //
    }

    // Step 2: Create MongoDB user document. THIS IS CRITICAL
    const user = await createUser({
      cognitoSub,
      email,
      firstName,
      lastName,
      role: 'user',
    });

    return sendSuccess(res, user, 201); //[cite: 1]
  } catch (error: any) {
    console.error('Registration Error:', error);
    return sendError(res, error.message || 'Registration failed', 400); //[cite: 1]
  }
};

/**
 * POST /api/auth/login
 * Authenticates with Cognito and returns JWT tokens.
 */
export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Authenticate with Cognito to get JWT tokens back[cite: 1]
    const result = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: process.env.COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      }),
    );

    // Return the AccessToken. Client uses this for all API calls[cite: 1]
    const tokens = {
      accessToken: result.AuthenticationResult?.AccessToken,
      refreshToken: result.AuthenticationResult?.RefreshToken,
      expiresIn: result.AuthenticationResult?.ExpiresIn,
    };

    return sendSuccess(res, tokens); //[cite: 1]
  } catch (error: any) {
    console.error('Login Error:', error);
    return sendError(res, 'Invalid credentials', 401); //[cite: 1]
  }
};
