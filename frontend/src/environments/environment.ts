//To export Amazon Cognito configuration for use in main.ts
export const environment = {
  production: true,
  cognito: {
    userPoolId: 'eu-north-1_SfWo3EkIs',
    userPoolClientId: '4obh8krimbm973e83gte5sfgh1',
  },
  apiUrl: '/api/auth',
  redirectUri: 'https://dn2cjed8iqpd7.cloudfront.net/auth/callback',
};
