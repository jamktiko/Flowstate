import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';
import { Amplify } from 'aws-amplify'; // Import Amplify for AWS Cognito integration

// Configure Amplify with your AWS Cognito details

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.cognito.userPoolId,
      userPoolClientId: environment.cognito.userPoolClientId,
    },
  },
});

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
