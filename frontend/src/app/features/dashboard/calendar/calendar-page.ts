import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DateAdapter,
  provideCalendar,
  CalendarEvent,
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
import { BasicModal } from '@shared/modals/basic-modal/basic-modal';

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
  imports: [BasicModal, CalendarWeekViewComponent],
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
  pendingDeleteEvent = signal<CalendarEvent | null>(null);
  isDatePickerOpen = signal(false);
  pickerYear = signal(new Date().getFullYear());
  pickerMonth = signal(new Date().getMonth());

  private calendarApi = inject(CalendarApiService);
  private navBarService = inject(NavBarService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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

    // Auto-import Google events if user just linked their account
    const justLinked = this.route.snapshot.queryParamMap.get('justLinked') === 'true';
    if (justLinked && this.linkedStatus().isLinked) {
      await this.importGoogleEvents();
    } else {
      await this.refreshCalendar();
    }
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  goToPreviousPeriod() {
    this.viewDate = this.shiftViewDate(-1);
    void this.refreshCalendar();
  }

  goToNextPeriod() {
    this.viewDate = this.shiftViewDate(1);
    void this.refreshCalendar();
  }

  openDatePicker() {
    this.pickerYear.set(this.viewDate.getFullYear());
    this.pickerMonth.set(this.viewDate.getMonth());
    this.isDatePickerOpen.set(true);
  }

  closeDatePicker() {
    this.isDatePickerOpen.set(false);
  }

  confirmDatePicker(week?: number) {
    if (week !== undefined) {
      const newDate = new Date(this.pickerYear(), this.pickerMonth(), 1);
      const startOfMonth = startOfWeek(newDate);
      const targetDate = new Date(startOfMonth);
      targetDate.setDate(targetDate.getDate() + week * 7);
      this.viewDate = targetDate;
      this.isDatePickerOpen.set(false);
      void this.refreshCalendar();
    }
  }

  previousPickerMonth() {
    let month = this.pickerMonth() - 1;
    let year = this.pickerYear();
    if (month < 0) {
      month = 11;
      year--;
    }
    this.pickerYear.set(year);
    this.pickerMonth.set(month);
  }

  nextPickerMonth() {
    let month = this.pickerMonth() + 1;
    let year = this.pickerYear();
    if (month > 11) {
      month = 0;
      year++;
    }
    this.pickerYear.set(year);
    this.pickerMonth.set(month);
  }

  getWeeksInMonth(year: number, month: number): { week: number; date: Date }[] {
    const firstDay = new Date(year, month, 1);
    const firstWeekStart = startOfWeek(firstDay);
    const lastDay = new Date(year, month + 1, 0);
    const lastWeekEnd = endOfWeek(lastDay);

    const weeks: { week: number; date: Date }[] = [];
    const current = new Date(firstWeekStart);
    let weekNumber = 0;

    while (current <= lastWeekEnd) {
      const monthCheck = new Date(current);
      monthCheck.setDate(monthCheck.getDate() + 3); // Mid-week to check month
      if (monthCheck.getMonth() === month) {
        weeks.push({
          week: weekNumber,
          date: new Date(current),
        });
      }
      current.setDate(current.getDate() + 7);
      weekNumber++;
    }

    return weeks;
  }

  getMonthName(month: number): string {
    return new Date(2000, month, 1).toLocaleDateString('en-US', { month: 'long' });
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
      this.showErrorMessage(this.formatError(error));
    }
  }

  async linkGoogleCalendar() {
    try {
      this.errorMessage.set(null);
      const { authUrl } = await this.calendarApi.startGoogleLink();
      window.location.assign(authUrl);
    } catch (error) {
      this.showErrorMessage(this.formatError(error));
    }
  }

  async unlinkGoogleCalendar() {
    try {
      this.isSyncing.set(true);
      this.errorMessage.set(null);
      await this.calendarApi.unlinkGoogleCalendar();
      await this.refreshConnectionStatus();
      await this.loadCalendarEvents();
      this.showSuccessMessage('Google Calendar has been unlinked.');
    } catch (error) {
      this.showErrorMessage(this.formatError(error));
    } finally {
      this.isSyncing.set(false);
    }
  }

  deleteCalendarEvent(event: CalendarEvent) {
    const eventId = event.meta?._id;
    if (!eventId) {
      this.showErrorMessage('This calendar event cannot be deleted because it has no saved ID.');
      return;
    }

    this.pendingDeleteEvent.set(event);
  }

  cancelDeleteCalendarEvent() {
    this.pendingDeleteEvent.set(null);
  }

  async confirmDeleteCalendarEvent() {
    const event = this.pendingDeleteEvent();
    const eventId = event?.meta?._id;

    if (!event || !eventId) {
      this.pendingDeleteEvent.set(null);
      this.showErrorMessage('This calendar event cannot be deleted because it has no saved ID.');
      return;
    }

    this.pendingDeleteEvent.set(null);

    try {
      this.isSyncing.set(true);
      this.errorMessage.set(null);

      const result = await this.calendarApi.deleteCalendarEvent(eventId);
      await this.loadCalendarEvents();
      this.showSuccessMessage(result.message ?? 'Event deleted successfully.');
    } catch (error) {
      this.showErrorMessage(this.formatError(error));
    } finally {
      this.isSyncing.set(false);
    }
  }

  async importGoogleEvents() {
    try {
      await this.syncGoogleEvents(true);
      await this.loadCalendarEvents(false);
    } catch (error) {
      this.showErrorMessage(this.formatError(error));
    }
  }

  async refreshCalendar() {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      if (this.linkedStatus().isLinked) {
        await this.syncGoogleEvents(false);
      }

      await this.loadCalendarEvents();
    } catch (error) {
      this.errorMessage.set(this.formatError(error));
      this.events.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadCalendarEvents(clearInfoMessage = true) {
    const { from, to } = this.currentRange();
    const events = await this.calendarApi.getEvents(from, to);

    this.events.set(events.map((event) => this.toCalendarEvent(event)));
    this.visibleRangeLabel.set(this.formatRangeLabel(from, to));

    if (clearInfoMessage) {
      this.infoMessage.set(null);
    }
  }

  private async syncGoogleEvents(showSuccessMessage: boolean) {
    this.isSyncing.set(true);
    this.errorMessage.set(null);

    try {
      const { from, to } = this.currentRange();
      const result = await this.calendarApi.importGoogleEvents(from, to);
      if (showSuccessMessage) {
        const message = result.message ?? `Imported ${result.count} Google events.`;
        this.showSuccessMessage(message);
      }
    } finally {
      this.isSyncing.set(false);
    }
  }

  private currentRange() {
    const from = startOfWeek(this.viewDate);
    const to = endOfWeek(this.viewDate);
    return { from, to };
  }

  private shiftViewDate(direction: -1 | 1) {
    const nextDate = new Date(this.viewDate);
    nextDate.setDate(nextDate.getDate() + direction * 7);
    return nextDate;
  }

  private toCalendarEvent(event: CalendarEventRecord): CalendarEvent {
    return {
      start: new Date(event.startTime),
      end: new Date(event.endTime),
      title: event.title,
      allDay: event.isAllDay,
      color: this.getColor(event),
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

  private showSuccessMessage(message: string) {
    this.infoMessage.set(message);
    setTimeout(() => {
      this.infoMessage.set(null);
    }, 3000);
  }

  private showErrorMessage(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => {
      this.errorMessage.set(null);
    }, 5000);
  }

  private formatError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Something went wrong while loading the calendar.';
  }
}
