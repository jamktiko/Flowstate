import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-calendar-link-result-page',
  templateUrl: './calendar-link-result-page.html',
  styleUrl: './calendar-link-result-page.css',
})
export class CalendarLinkResultPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly isSuccess = signal(true);
  readonly title = signal('');
  readonly message = signal('');
  readonly details = signal<string | null>(null);

  ngOnInit(): void {
    const variant = this.route.snapshot.data['variant'] as 'success' | 'error' | undefined;

    if (variant === 'error') {
      this.isSuccess.set(false);
      this.title.set('Google Calendar link failed');
      this.message.set('The OAuth flow did not complete successfully.');
      this.details.set(this.route.snapshot.queryParamMap.get('error'));
      return;
    }

    this.isSuccess.set(true);
    this.title.set('Google Calendar linked');
    this.message.set('Your Google account is now connected to Flowstate.');
    this.details.set(this.route.snapshot.queryParamMap.get('userId'));
  }

  goToCalendar(): void {
    void this.router.navigate(['/dashboard/calendar']);
  }

  goToDashboard(): void {
    void this.router.navigate(['/dashboard']);
  }
}