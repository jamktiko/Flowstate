/**
 * Validates required environment variables at startup.
 * Throws immediately if any are missing — prevents cryptic runtime errors later.
 */
export const validateEnv = (): void => {
  const required = [
    'MONGO_URI',
    'COGNITO_USER_POOL_ID',
    'COGNITO_CLIENT_ID',
    'COGNITO_REGION',
    'TOKEN_ENCRYPTION_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  console.log('✅ Environment variables validated');
};
