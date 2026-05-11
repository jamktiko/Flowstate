// Callback component for handling social login redirects
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/auth/auth-service';

@Component({
  template: '<div class="loading-spinner">Finalizing login...</div>',
})
export class AuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private router = inject(Router);

  async ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('code');

    if (code) {
      try {
        await this.authService.handleGoogleLogin(code);
        this.router.navigate(['/dashboard']);
      } catch (error) {
        console.error('Social login failed', error);
        this.router.navigate(['/auth/login']);
      }
    }
  }
}
