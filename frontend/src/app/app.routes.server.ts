import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // 1. The Welcome page (path: '')
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  // 2. The Signin page (path: 'signin')
  {
    path: 'signin',
    renderMode: RenderMode.Prerender,
  },
  // 3. Register page (assuming it's 'register' under the 'auth' lazy loaded route)
  {
    path: 'auth/register', // Make sure this matches whatever is in auth.routes.ts!
    renderMode: RenderMode.Prerender,
  },
  // 4. The Dashboard (Pure SPA)
  {
    path: 'dashboard/**',
    renderMode: RenderMode.Client,
  },
  // 5. Global Fallback
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
