import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  DateAdapter,
  provideCalendar,
  CalendarEvent,
  CalendarEventAction,
  CalendarView,
  CalendarWeekViewComponent,
} from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { NavBarService } from '@core/layout/nav-bar/nav-bar-service';
import {
  CalendarApiService,
  CalendarEventRecord,
  GoogleCalendarLinkStatus,
} from '@core/services/calendar-api-service';

function startOfWeek(date: Date): Date {
  const value = new Date(date);
  const day = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - day);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfWeek(date: Date): Date {
  const value = startOfWeek(date);
  value.setDate(value.getDate() + 6);
  value.setHours(23, 59, 59, 999);
  return value;
}

@Component({
  selector: 'app-calendar',
  imports: [CalendarWeekViewComponent],
  providers: [
    provideCalendar({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
  ],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.css',
})
export class CalendarPage implements OnInit {
  readonly CalendarView = CalendarView;
  view = CalendarView.Week;
  viewDate = new Date();
  events = signal<CalendarEvent[]>([]);
  linkedStatus = signal<GoogleCalendarLinkStatus>({ provider: 'google', isLinked: false });
  isLoading = signal(false);
  isSyncing = signal(false);
  infoMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  visibleRangeLabel = signal('');

  private calendarApi = inject(CalendarApiService);
  private navBarService = inject(NavBarService);
  private router = inject(Router);

  constructor() {
    this.navBarService.showBackButton.set(true);
    this.navBarService.customBackAction.set(() => {
      void this.router.navigate(['/dashboard']);
    });
    this.navBarService.showSettingsButton.set(true);
    this.navBarService.customSettingsAction.set(() => {
      void this.refreshCalendar();
    });
    this.navBarService.showLogoutButton.set(false);

    inject(DestroyRef).onDestroy(() => {
      this.navBarService.reset();
    });
  }

  async ngOnInit() {
    await this.refreshConnectionStatus();
    await this.refreshCalendar();
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  goToPreviousPeriod() {
    const nextDate = new Date(this.viewDate);
    nextDate.setDate(nextDate.getDate() - 7);
    this.viewDate = nextDate;
    void this.refreshCalendar();
  }

  goToNextPeriod() {
    const nextDate = new Date(this.viewDate);
    nextDate.setDate(nextDate.getDate() + 7);
    this.viewDate = nextDate;
    void this.refreshCalendar();
  }

  goToToday() {
    this.viewDate = new Date();
    void this.refreshCalendar();
  }

  async refreshConnectionStatus() {
    try {
      this.errorMessage.set(null);
      const status = await this.calendarApi.getGoogleLinkStatus();
      this.linkedStatus.set(status);
    } catch (error) {
      this.errorMessage.set(this.formatError(error));
    }
  }

  async linkGoogleCalendar() {
    try {
      this.errorMessage.set(null);
      const { authUrl } = await this.calendarApi.startGoogleLink();
      window.location.assign(authUrl);
    } catch (error) {
      this.errorMessage.set(this.formatError(error));
    }
  }

  async unlinkGoogleCalendar() {
    try {
      this.isSyncing.set(true);
      this.errorMessage.set(null);
      await this.calendarApi.unlinkGoogleCalendar();
      await this.refreshConnectionStatus();
      await this.refreshCalendar();
      this.infoMessage.set('Google Calendar has been unlinked.');
    } catch (error) {
      this.errorMessage.set(this.formatError(error));
    } finally {
      this.isSyncing.set(false);
    }
  }

  async deleteCalendarEvent(event: CalendarEvent) {
    const eventId = event.meta?._id;
    if (!eventId) {
      this.errorMessage.set('This calendar event cannot be deleted because it has no saved ID.');
      return;
    }

    const confirmed = window.confirm(`Delete "${event.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      this.isSyncing.set(true);
      this.errorMessage.set(null);

      const result = await this.calendarApi.deleteCalendarEvent(eventId);
      await this.refreshCalendar();
      this.infoMessage.set(result.message ?? 'Event deleted successfully.');
    } catch (error) {
      this.errorMessage.set(this.formatError(error));
    } finally {
      this.isSyncing.set(false);
    }
  }

  async importGoogleEvents() {
    try {
      this.isSyncing.set(true);
      this.errorMessage.set(null);
      const { from, to } = this.currentRange();
      const result = await this.calendarApi.importGoogleEvents(from, to);
      await this.refreshCalendar();
      this.infoMessage.set(result.message ?? `Imported ${result.count} Google events.`);
    } catch (error) {
      this.errorMessage.set(this.formatError(error));
    } finally {
      this.isSyncing.set(false);
    }
  }

  async refreshCalendar() {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const { from, to } = this.currentRange();
      const events = await this.calendarApi.getEvents(from, to);

      this.events.set(events.map((event) => this.toCalendarEvent(event)));
      this.visibleRangeLabel.set(this.formatRangeLabel(from, to));
      this.infoMessage.set(null);
    } catch (error) {
      this.errorMessage.set(this.formatError(error));
      this.events.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private currentRange() {
    const from = startOfWeek(this.viewDate);
    const to = endOfWeek(this.viewDate);
    return { from, to };
  }

  private toCalendarEvent(event: CalendarEventRecord): CalendarEvent {
    const actions: CalendarEventAction[] = [
      {
        label: 'Delete',
        a11yLabel: `Delete ${event.title}`,
        cssClass: 'delete-event-action',
        onClick: ({ event: calendarEvent }) => {
          void this.deleteCalendarEvent(calendarEvent);
        },
      },
    ];

    return {
      start: new Date(event.startTime),
      end: new Date(event.endTime),
      title: event.title,
      allDay: event.isAllDay,
      color: this.getColor(event),
      actions,
      meta: event,
    };
  }

  private getColor(event: CalendarEventRecord) {
    if (event.provider === 'google') {
      return { primary: '#1a73e8', secondary: '#dcebff' };
    }

    return { primary: '#0f766e', secondary: '#d7f5f2' };
  }

  private formatRangeLabel(from: Date, to: Date) {
    return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
  }

  formatEventWindow(event: CalendarEventRecord) {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    if (event.isAllDay) {
      return 'All day';
    }

    return `${start.toLocaleString()} - ${end.toLocaleTimeString()}`;
  }

  formatStatus(status: CalendarEventRecord['status']) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  private formatError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Something went wrong while loading the calendar.';
  }
}
