import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

// Declare the verifier with the necessary configuration
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || '',
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID || '',
  region: process.env.COGNITO_REGION || '',
});

export const checkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if the Authorization header is present and properly formatted
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message:
          'Missing or invalid Authorization header. Format should be: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];

    // Token verification
    const payload = await verifier.verify(token);

    // Save user information in the request object for later use in route handlers
    (req as any).user = payload;

    next();
    // If verification fails, an error will be thrown and caught in the catch block
  } catch (err) {
    console.error('Auth failure:', err);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token is invalid or expired',
    });
  }
};
