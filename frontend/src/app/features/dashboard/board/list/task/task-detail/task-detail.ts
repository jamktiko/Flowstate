import { Component, input, output, inject, signal } from '@angular/core';
import { Card } from '@core/models/board-model';
import { BasicModal } from '@shared/modals/basic-modal/basic-modal';
import { CardService } from '@core/services/card-service';

@Component({
  selector: 'app-task-detail',
  imports: [BasicModal],
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.css',
})
export class TaskDetail {
  isOpen = input<boolean>(false);
  card = input<Card | null>(null);
  boardId = input<string>('');
  colId = input<string>('');

  closeModal = output<void>();
  calendarEventCreated = output<void>();

  private cardService = inject(CardService);

  isAddingToCalendar = signal(false);
  calendarError = signal<string | null>(null);
  calendarSuccess = signal(false);

  get canAddToCalendar(): boolean {
    const c = this.card();
    return !!c?.dueDate && !c?.linkedEventId;
  }

  get isAlreadyLinked(): boolean {
    return !!this.card()?.linkedEventId;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  async addToCalendar() {
    const c = this.card();
    if (!c?._id || !this.boardId() || !this.colId()) return;

    this.isAddingToCalendar.set(true);
    this.calendarError.set(null);

    try {
      await this.cardService.createCalendarEventFromCard(this.boardId(), this.colId(), c._id);
      this.calendarSuccess.set(true);
      this.calendarEventCreated.emit();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add to calendar';
      this.calendarError.set(message);
    } finally {
      this.isAddingToCalendar.set(false);
    }
  }
}
