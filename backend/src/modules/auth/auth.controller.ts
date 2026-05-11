import { Request, Response } from 'express';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand, // LISÄTTY: Tarvitaan vahvistukseen
} from '@aws-sdk/client-cognito-identity-provider';
import { createUser } from '../users/user.service';
import { sendSuccess, sendError } from '../../utils/responseHelpers';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION,
});

//comment to launch backend tests in CI/CD pipeline to check if tests go through!!

/**
 * POST /api/auth/register
 * Handles user registration by signing up with AWS Cognito
 * and creating a user record in our database.
 */
export const registerController = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  try {
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
      return sendError(res, 'Registration failed at Cognito', 500);
    }

    // Saves the user in our database with the Cognito sub as a reference
    const user = await createUser({
      cognitoSub,
      email,
      firstName,
      lastName,
      role: 'user',
    });

    return sendSuccess(res, user, 201);
  } catch (error: any) {
    console.error('Registration Error:', error);
    return sendError(res, error.message || 'Registration failed', 400);
  }
};

/**
 * POST /api/auth/confirm
 * Handles the confirmation of user registration using the code sent by Cognito.
 */
export const confirmRegistrationController = async (
  req: Request,
  res: Response,
) => {
  const { email, code } = req.body;

  try {
    await cognitoClient.send(
      new ConfirmSignUpCommand({
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
      }),
    );

    return sendSuccess(res, { message: 'Account confirmed successfully' });
  } catch (error: any) {
    console.error('Confirmation Error:', error);
    return sendError(res, error.message || 'Confirmation failed', 400);
  }
};

/**
 * POST /api/auth/login
 * Handles user login by authenticating with AWS Cognito and returning tokens.
 */
export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
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

    const tokens = {
      accessToken: result.AuthenticationResult?.AccessToken,
      refreshToken: result.AuthenticationResult?.RefreshToken,
      expiresIn: result.AuthenticationResult?.ExpiresIn,
    };

    return sendSuccess(res, tokens);
  } catch (error: any) {
    console.error('Login Error:', error);
    return sendError(res, 'Invalid credentials', 401);
  }
};
