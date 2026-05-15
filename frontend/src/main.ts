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

bootstrapApplication(App, appConfig)
  .then(() => {
    // Register custom push service worker separately from ngsw-worker.js.
    // ngsw-worker.js handles caching — sw-push.js handles push notification events.
    // Runs in all environments so push works in development too.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw-push.js')
        .catch((err) => console.error('Push service worker registration failed:', err));
    }
  })
  .catch((err) => console.error(err));
