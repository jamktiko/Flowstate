import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface CalendarEventRecord {
  _id: string;
  provider: 'google' | 'microsoft';
  externalEventId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  linkedCardId?: string | null;
  linkedBoardId?: string | null;
}

export interface GoogleCalendarLinkStatus {
  provider: 'google';
  isLinked: boolean;
}

export interface DeleteCalendarEventResult {
  message?: string;
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CalendarApiService {
  private http = inject(HttpClient);
  private calendarApiUrl = `${environment.apiBaseUrl}/calendar`;
  private calendarAuthApiUrl = `${environment.apiBaseUrl}/calendar/auth`;
  private calendarSyncApiUrl = `${environment.apiBaseUrl}/calendar/sync`;

  async getGoogleLinkStatus(): Promise<GoogleCalendarLinkStatus> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<GoogleCalendarLinkStatus>>(
        `${this.calendarAuthApiUrl}/status/google`,
      ),
    );

    return response.data ?? { provider: 'google', isLinked: false };
  }

  async startGoogleLink(): Promise<{ authUrl: string; message?: string }> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<{ authUrl: string; message?: string }>>(
        `${this.calendarAuthApiUrl}/link/google`,
        {},
      ),
    );

    if (!response.data?.authUrl) {
      throw new Error('Google Calendar auth URL was not returned by the backend');
    }

    return response.data;
  }

  async unlinkGoogleCalendar(): Promise<void> {
    await firstValueFrom(this.http.post(`${this.calendarAuthApiUrl}/unlink/google`, {}));
  }

  async getEvents(from: Date, to: Date): Promise<CalendarEventRecord[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<CalendarEventRecord[]>>(`${this.calendarApiUrl}`, {
        params: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
      }),
    );

    return response.data ?? [];
  }

  async importGoogleEvents(from: Date, to: Date): Promise<{ count: number; message?: string }> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<{ count: number; message?: string }>>(
        `${this.calendarSyncApiUrl}/import`,
        null,
        {
          params: {
            from: from.toISOString(),
            to: to.toISOString(),
          },
        },
      ),
    );

    return response.data ?? { count: 0 };
  }

  async deleteCalendarEvent(eventId: string): Promise<DeleteCalendarEventResult> {
    const response = await firstValueFrom(
      this.http.delete<ApiResponse<DeleteCalendarEventResult>>(`${this.calendarApiUrl}/${eventId}`),
    );

    return response.data ?? { message: 'Event deleted successfully' };
  }
}
