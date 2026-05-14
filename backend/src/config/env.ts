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
    'FRONTEND_URL',
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
    'VAPID_SUBJECT',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALENDAR_REDIRECT_URI',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  console.log('✅ Environment variables validated');
};
