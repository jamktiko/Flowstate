export interface Tag {
  name: string;
  visible: boolean;
}

export interface NotificationOverride {
  enabled?: boolean | null;
  leadTime?: number | null;
}

export interface Card {
  _id: string; // ObjectId
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  order: number;
  tags: Tag[];
  dueDate?: Date;
  linkedEventId?: string; // ObjectId
  notifications?: NotificationOverride;
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  name: string;
  order: number;
  cards: Card[];
}

export interface Board {
  _id: string; // ObjectId
  userId: string; // ObjectId
  name: string;
  columns: Column[];
  createdAt: Date;
  updatedAt: Date;
}
