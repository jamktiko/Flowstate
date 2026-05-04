import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Amplify } from 'aws-amplify'; // Import Amplify for AWS Cognito integration

// Configure Amplify with your AWS Cognito details
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'eu-north-1_SfWo3EkIs',
      userPoolClientId: '4obh8krimbm973e83gte5sfgh1',
    },
  },
});

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
