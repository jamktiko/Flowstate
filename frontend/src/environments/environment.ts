//To export Amazon Cognito configuration for use in main.ts
export const environment = {
  production: true,
  cognito: {
    userPoolId: 'eu-north-1_SfWo3EkIs',
    userPoolClientId: '4obh8krimbm973e83gte5sfgh1',
  },
  apiBaseUrl: '/api',
  redirectUri: window.location.origin + '/auth/callback',
  vapidPublicKey:
    'BHshBtnpEdhfb2QbI23sqWqf8fosKNkOpkBo99XTeTQOT1xBsaLydDhAMiGdCo3tHpOxZgB4zlZe8bRBjGzsV6o',
};
