import { NgOptimizedImage } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.html',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayout {
  // Define 'title' as a required signal input
  title = input.required<string>();

  // OR define it with a default value:
  // title = input<string>('Welcome');
}
