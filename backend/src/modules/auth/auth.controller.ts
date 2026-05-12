import { Request, Response } from 'express';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { createUser, getUserByCognitoSub } from '../users/user.service';
import { sendSuccess, sendError } from '../../utils/responseHelpers';
import { User } from '../users/user.model';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION,
});

//comment to launch backend tests in CI/CD pipeline to check if tests go through!!!!

/**
 * POST /api/auth/register
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

/**
 * POST /api/auth/social-callback
 * Handles the callback from Google/Microsoft OAuth, exchanges code for tokens, and syncs user to MongoDB
 */
export const socialCallbackController = async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    return sendError(res, 'Authorization code is missing', 400);
  }

  try {
    const domain = process.env.COGNITO_DOMAIN;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    const tokenResponse = await axios.post(
      `https://${domain}/oauth2/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId!,
        code: code,
        redirect_uri: redirectUri!,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const { id_token, access_token, refresh_token, expires_in } =
      tokenResponse.data;

    const decodedToken: any = jwt.decode(id_token);

    const { sub, email, nickname, given_name, family_name, middle_name } =
      decodedToken;

    // Find user by Cognito sub
    let user = await getUserByCognitoSub(sub);

    // If not found, try to find by email and link accounts, or create new user
    if (!user) {
      const existingUserByEmail = await User.findOne({ email: email });

      // Link existing user to new social login if email matches
      if (existingUserByEmail) {
        existingUserByEmail.cognitoSub = sub;
        await existingUserByEmail.save();
        user = existingUserByEmail;
        console.log(
          'Linkitetty sosiaalinen kirjautuminen olemassa olevaan sähköpostiin:',
          email,
        );
      } else {
        // Create new user if no existing email match
        // Name parsing logic to handle different providers and missing fields
        let finalFirstName = given_name || nickname || email.split('@')[0];

        let finalLastName = family_name || 'User';

        if (!family_name && middle_name) {
          const nameParts = middle_name.trim().split(/\s+/);
          if (nameParts.length > 1) {
            finalLastName = nameParts.pop();
          } else {
            finalLastName = middle_name;
          }
        }

        user = await createUser({
          cognitoSub: sub,
          email: email,
          firstName: finalFirstName,
          lastName: finalLastName,
          role: 'user',
        });

        console.log('New user created through social login:', email);
      }
    }

    return sendSuccess(res, {
      accessToken: access_token,
      refreshToken: refresh_token,
      expires_in,
      user,
    });
  } catch (error: any) {
    console.error('Social Auth Error:', error.response?.data || error.message);
    return sendError(res, 'Social authentication failed', 400);
  }
};
