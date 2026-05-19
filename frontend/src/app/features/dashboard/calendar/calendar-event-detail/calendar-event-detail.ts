import { Component, input, output, inject, signal } from '@angular/core';
import { CalendarApiService, CalendarEventRecord } from '@core/services/calendar-api-service';
import { BasicModal } from '@shared/modals/basic-modal/basic-modal';

@Component({
  selector: 'app-calendar-event-detail',
  imports: [BasicModal],
  templateUrl: './calendar-event-detail.html',
  styleUrl: './calendar-event-detail.css',
})
export class CalendarEventDetail {
  isOpen = input<boolean>(false);
  event = input<CalendarEventRecord | null>(null);

  closeModal = output<void>();
  eventDeleted = output<string>(); // emits eventId
  eventUnlinked = output<string>(); // emits eventId

  private calendarApi = inject(CalendarApiService);

  isUnlinking = signal(false);
  isDeleting = signal(false);
  error = signal<string | null>(null);

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatStatus(status: CalendarEventRecord['status']): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  async unlinkFromCard() {
    const e = this.event();
    if (!e?._id) return;

    this.isUnlinking.set(true);
    this.error.set(null);

    try {
      if (e.provider === 'local') {
        // Local events were created by Flowstate — delete entirely
        await this.calendarApi.deleteCalendarEvent(e._id);
        this.eventDeleted.emit(e._id);
      } else {
        // External events (Google/Microsoft) — just unlink, keep in calendar
        await this.calendarApi.unlinkEventFromCard(e._id);
        this.eventUnlinked.emit(e._id);
      }
      this.closeModal.emit();
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Failed to unlink event');
    } finally {
      this.isUnlinking.set(false);
    }
  }

  async deleteEvent() {
    const e = this.event();
    if (!e?._id) return;

    this.isDeleting.set(true);
    this.error.set(null);

    try {
      await this.calendarApi.deleteCalendarEvent(e._id);
      this.eventDeleted.emit(e._id);
      this.closeModal.emit();
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      this.isDeleting.set(false);
    }
  }
}
