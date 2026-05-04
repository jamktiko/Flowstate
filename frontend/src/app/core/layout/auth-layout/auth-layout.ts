import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayout {
  // Define 'title' as a required signal input
  // OR define it with a default value:
  // title = input<string>('Welcome');
}
