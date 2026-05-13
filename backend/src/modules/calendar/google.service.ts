import axios, { AxiosInstance } from 'axios';
import { Types } from 'mongoose';
import { User, IUser } from '../users/user.model';
import { encrypt, decrypt } from '../../utils/tokenEncryption';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface IGoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start:
    | {
        dateTime: string;
        timeZone?: string;
      }
    | {
        date: string;
      };
  end:
    | {
        dateTime: string;
        timeZone?: string;
      }
    | {
        date: string;
      };
  status: 'confirmed' | 'tentative' | 'cancelled';
}

export interface IGoogleOAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface IGoogleCalendarServiceConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

/**
 * GoogleCalendarService — adapter for Google Calendar API
 * Manages OAuth tokens, creates/updates/deletes events, handles token refresh
 */
class GoogleCalendarService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
  ];
  private readonly GOOGLE_AUTH_URL = 'https://oauth2.googleapis.com/token';
  private readonly GOOGLE_CALENDAR_API =
    'https://www.googleapis.com/calendar/v3';

  constructor(config: IGoogleCalendarServiceConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error(
        'GoogleCalendarService requires clientId, clientSecret, and redirectUri',
      );
    }
  }

  // ─────────────────────────────────────────────
  // OAuth flows
  // ─────────────────────────────────────────────

  /**
   * Generates the Google OAuth consent URL.
   * User navigates to this URL and grants permission.
   * @param state - CSRF protection token (random string, verified on callback)
   * @returns Full consent URL
   */
  public getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.SCOPES.join(' '),
      state,
      access_type: 'offline', // Request refresh token
      prompt: 'consent', // Force user to grant consent (even if previously granted)
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchanges an OAuth authorization code for access and refresh tokens.
   * Called after user grants permission on Google consent screen.
   * @param code - Authorization code from OAuth callback
   * @returns Token response with access_token, refresh_token, expiry, etc.
   */
  public async exchangeCodeForTokens(
    code: string,
  ): Promise<IGoogleOAuthTokenResponse> {
    try {
      const response = await axios.post<IGoogleOAuthTokenResponse>(
        this.GOOGLE_AUTH_URL,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        },
      );

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to exchange code for tokens: ${message}`);
    }
  }

  /**
   * Refreshes an expired access token using the refresh token.
   * Access tokens expire after ~1 hour; refresh tokens last much longer.
   * @param refreshToken - The stored refresh token (encrypted in DB)
   * @returns New access token and updated expiry
   */
  public async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await axios.post<{
        access_token: string;
        expires_in: number;
        scope: string;
        token_type: string;
      }>(this.GOOGLE_AUTH_URL, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to refresh access token: ${message}`);
    }
  }

  /**
   * Revokes a refresh token (and any associated access tokens).
   * Called when user unlinks their calendar account.
   * @param refreshToken - The refresh token to revoke
   */
  public async revokeToken(refreshToken: string): Promise<void> {
    try {
      await axios.post('https://oauth2.googleapis.com/revoke', null, {
        params: { token: refreshToken },
      });
    } catch (error) {
      // Silently fail — revocation may already have happened
      // Still log for debugging purposes
      console.warn(
        'Failed to revoke Google Calendar token:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  // ─────────────────────────────────────────────
  // Calendar event operations
  // ─────────────────────────────────────────────

  /**
   * Creates an Axios instance with Authorization header for Google Calendar API calls.
   * Automatically handles token refresh if needed.
   * @param userId - MongoDB user ID (for loading encrypted tokens from DB)
   * @returns Configured Axios instance ready for Calendar API calls
   */
  private async getAuthorizedClient(
    userId: Types.ObjectId,
  ): Promise<AxiosInstance> {
    // Load user and decrypt tokens
    const user = await User.findById(userId);
    if (!user || !user.integrations.google.isLinked) {
      throw new Error('User has not linked their Google Calendar account');
    }

    let accessToken = user.integrations.google.accessToken
      ? decrypt(user.integrations.google.accessToken)
      : null;
    const refreshToken = user.integrations.google.refreshToken;
    const expiryDate = user.integrations.google.expiryDate;

    // Check if token is expired and refresh if needed
    if (expiryDate && Date.now() >= expiryDate - 60_000 && refreshToken) {
      try {
        const decryptedRefreshToken = decrypt(refreshToken);
        const { accessToken: refreshedAccessToken, expiresIn } =
          await this.refreshAccessToken(decryptedRefreshToken);

        // Update user with new tokens
        const newExpiryDate = Date.now() + expiresIn * 1000;
        user.integrations.google.accessToken = encrypt(refreshedAccessToken);
        user.integrations.google.expiryDate = newExpiryDate;
        await user.save();

        accessToken = refreshedAccessToken;
      } catch (error) {
        throw new Error(
          `Failed to refresh expired token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // Use the decrypted access token for API call
    if (!accessToken) {
      throw new Error('No valid access token found');
    }

    // Return configured Axios instance
    return axios.create({
      baseURL: this.GOOGLE_CALENDAR_API,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Creates an event in Google Calendar.
   * @param userId - MongoDB user ID
   * @param event - Event data (summary, description, start, end, etc.)
   * @returns Created event data from Google Calendar API
   */
  public async createEvent(
    userId: Types.ObjectId,
    event: Partial<IGoogleCalendarEvent>,
  ): Promise<IGoogleCalendarEvent> {
    const client = await this.getAuthorizedClient(userId);

    try {
      const response = await client.post<IGoogleCalendarEvent>(
        '/calendars/primary/events',
        event,
      );

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create Google Calendar event: ${message}`);
    }
  }

  /**
   * Updates an existing event in Google Calendar.
   * @param userId - MongoDB user ID
   * @param eventId - Google Calendar event ID
   * @param event - Updated event data (partial update)
   * @returns Updated event data from Google Calendar API
   */
  public async updateEvent(
    userId: Types.ObjectId,
    eventId: string,
    event: Partial<IGoogleCalendarEvent>,
  ): Promise<IGoogleCalendarEvent> {
    const client = await this.getAuthorizedClient(userId);

    try {
      const response = await client.patch<IGoogleCalendarEvent>(
        `/calendars/primary/events/${eventId}`,
        event,
      );

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update Google Calendar event: ${message}`);
    }
  }

  /**
   * Deletes an event from Google Calendar.
   * @param userId - MongoDB user ID
   * @param eventId - Google Calendar event ID
   */
  public async deleteEvent(
    userId: Types.ObjectId,
    eventId: string,
  ): Promise<void> {
    const client = await this.getAuthorizedClient(userId);

    try {
      await client.delete(`/calendars/primary/events/${eventId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete Google Calendar event: ${message}`);
    }
  }

  /**
   * Retrieves events from Google Calendar within a date range.
   * @param userId - MongoDB user ID
   * @param from - Range start (ISO string)
   * @param to - Range end (ISO string)
   * @returns Array of events
   */
  public async getEvents(
    userId: Types.ObjectId,
    from: Date,
    to: Date,
  ): Promise<IGoogleCalendarEvent[]> {
    const client = await this.getAuthorizedClient(userId);

    try {
      const response = await client.get<{ items: IGoogleCalendarEvent[] }>(
        '/calendars/primary/events',
        {
          params: {
            timeMin: from.toISOString(),
            timeMax: to.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            showDeleted: false,
          },
        },
      );

      return response.data.items || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch Google Calendar events: ${message}`);
    }
  }

  /**
   * Retrieves a single event by ID from Google Calendar.
   * @param userId - MongoDB user ID
   * @param eventId - Google Calendar event ID
   * @returns Event data
   */
  public async getEventById(
    userId: Types.ObjectId,
    eventId: string,
  ): Promise<IGoogleCalendarEvent> {
    const client = await this.getAuthorizedClient(userId);

    try {
      const response = await client.get<IGoogleCalendarEvent>(
        `/calendars/primary/events/${eventId}`,
      );

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to fetch Google Calendar event ${eventId}: ${message}`,
      );
    }
  }
}

// ─────────────────────────────────────────────
// Factory and exports
// ─────────────────────────────────────────────

let googleCalendarService: GoogleCalendarService | null = null;

/**
 * Initializes the Google Calendar service with config from environment.
 * Must be called during app startup before any calendar operations.
 */
export function initGoogleCalendarService(): GoogleCalendarService {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Google Calendar requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALENDAR_REDIRECT_URI',
    );
  }

  googleCalendarService = new GoogleCalendarService({
    clientId,
    clientSecret,
    redirectUri,
  });

  return googleCalendarService;
}

/**
 * Returns the initialized Google Calendar service.
 * Throws if service has not been initialized.
 */
export function getGoogleCalendarService(): GoogleCalendarService {
  if (!googleCalendarService) {
    throw new Error(
      'GoogleCalendarService not initialized. Call initGoogleCalendarService() during app startup.',
    );
  }

  return googleCalendarService;
}

export default GoogleCalendarService;
