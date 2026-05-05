import { Schema, model, Document, Types } from 'mongoose';

// ─────────────────────────────────────────────
// Sub-document interfaces
// ─────────────────────────────────────────────

export interface INotificationPrefs {
  enabled: boolean;
  defaultLeadTime: number; // minutes before due date
}

export interface IOAuthIntegration {
  isLinked: boolean;
  accessToken: string | null; // stored encrypted
  refreshToken: string | null; // stored encrypted
  expiryDate: number | null; // Unix ms timestamp
}

export interface IUserIntegrations {
  google: IOAuthIntegration;
  microsoft: IOAuthIntegration;
}

export interface IUserPreferences {
  defaultView: 'board' | 'calendar' | 'list';
  defaultBoardId: Types.ObjectId | null; // nullable — no default board set
  theme: 'dark' | 'light';
}

/** Lightweight board reference stored on the user document.
 *  Contains only boardId + name so the board list renders without
 *  loading any card data. Name is duplicated from boards.name —
 *  keep in sync on rename. */
export interface IBoardRef {
  boardId: Types.ObjectId;
  name: string;
}

// ─────────────────────────────────────────────
// Root user interface
// ─────────────────────────────────────────────

export interface IUser extends Document {
  cognitoSub: string; // AWS Cognito owns the password — not stored here
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  preferences: IUserPreferences;
  notifications: INotificationPrefs;
  integrations: IUserIntegrations;
  boards: IBoardRef[];
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// Sub-schemas
// ─────────────────────────────────────────────

const OAuthIntegrationSchema = new Schema<IOAuthIntegration>(
  {
    isLinked: { type: Boolean, required: true, default: false },
    accessToken: { type: String, default: null }, // encrypted before save
    refreshToken: { type: String, default: null }, // encrypted before save
    expiryDate: { type: Number, default: null },
  },
  { _id: false },
);

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    defaultView: {
      type: String,
      enum: ['board', 'calendar', 'list'],
      default: 'list',
    },
    defaultBoardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      default: null,
    },
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  },
  { _id: false },
);

const NotificationPrefsSchema = new Schema<INotificationPrefs>(
  {
    enabled: { type: Boolean, default: true },
    defaultLeadTime: { type: Number, default: 30 }, // 30 minutes
  },
  { _id: false },
);

const BoardRefSchema = new Schema<IBoardRef>(
  {
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    name: { type: String, required: true, trim: true },
  },
  { _id: false },
);

// ─────────────────────────────────────────────
// Root schema
// ─────────────────────────────────────────────

const UserSchema = new Schema<IUser>(
  {
    // Cognito owns authentication — no password field here
    cognitoSub: { type: String, required: true, unique: true },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    preferences: { type: UserPreferencesSchema, default: () => ({}) },
    notifications: { type: NotificationPrefsSchema, default: () => ({}) },

    integrations: {
      type: {
        google: { type: OAuthIntegrationSchema, default: () => ({}) },
        microsoft: { type: OAuthIntegrationSchema, default: () => ({}) },
      },
      default: () => ({}),
      _id: false,
    },

    boards: { type: [BoardRefSchema], default: [] },
  },
  {
    timestamps: true, // auto-manages createdAt + updatedAt
  },
);

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────

export const User = model<IUser>('User', UserSchema);
