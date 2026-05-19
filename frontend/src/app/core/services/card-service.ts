import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly http = inject(HttpClient);

  /**
   * Creates a calendar event from a card and links them bidirectionally.
   * Requires the card to have a due date set.
   */
  async createCalendarEventFromCard(boardId: string, colId: string, cardId: string): Promise<void> {
    await firstValueFrom(
      this.http.post(
        `${environment.apiBaseUrl}/boards/${boardId}/columns/${colId}/cards/${cardId}/calendar`,
        {},
      ),
    );
  }
}
