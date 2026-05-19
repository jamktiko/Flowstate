import { Schema, model, Document, Types } from 'mongoose';

// ─────────────────────────────────────────────
// Root calendar event interface
// ─────────────────────────────────────────────

export interface ICalendarEvent extends Document {
  userId: Types.ObjectId;
  provider: 'google' | 'microsoft' | 'local';
  externalEventId: string; // ID from Google / Microsoft API
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';

  /** Bidirectional link to an embedded card.
   *  When set, linkedBoardId MUST also be set — cards have no
   *  standalone collection, so boardId is required to locate the card. */
  linkedCardId?: Types.ObjectId;
  linkedBoardId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['google', 'microsoft', 'local'],
      required: true,
    },
    externalEventId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isAllDay: { type: Boolean, required: true, default: false },
    status: {
      type: String,
      enum: ['confirmed', 'tentative', 'cancelled'],
      default: 'confirmed',
    },

    // Optional card link — both fields must be set together (enforced in service layer)
    linkedCardId: { type: Schema.Types.ObjectId, default: null },
    linkedBoardId: { type: Schema.Types.ObjectId, ref: 'Board', default: null },
  },
  {
    timestamps: true,
  },
);

// ─────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────

// Primary calendar range query: "show all events for user between date X and Y"
CalendarEventSchema.index({ userId: 1, startTime: 1 });

// Prevent duplicate syncs of the same external event
CalendarEventSchema.index(
  { externalEventId: 1, provider: 1 },
  { unique: true },
);

// Reverse lookup: given a cardId, find its linked event
CalendarEventSchema.index({ linkedCardId: 1 });

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────

export const CalendarEvent = model<ICalendarEvent>(
  'CalendarEvent',
  CalendarEventSchema,
);
