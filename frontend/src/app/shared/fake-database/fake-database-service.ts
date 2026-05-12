import { Injectable } from '@angular/core';
import { Board } from '@core/models/board-model';

@Injectable({
  providedIn: 'root',
})
export class FakeDatabaseService {
  boards: Board[] = [
    {
      _id: '60d5ec49f1b2c8b1f8e4e1a1',
      userId: '60d5ec49f1b2c8b1f8e4e000',
      name: 'Project Alpha',
      createdAt: new Date('2026-05-01T10:00:00Z'),
      updatedAt: new Date('2026-05-10T14:30:00Z'),
      columns: [
        {
          id: 'col_1',
          name: 'To Do',
          order: 0,
          cards: [
            {
              _id: '60d5ec49f1b2c8b1f8e4e2b1',
              title: 'Design database schema',
              description: 'Create the MongoDB schema for boards and cards.',
              priority: 'high',
              order: 0,
              tags: [
                { name: 'backend', visible: true },
                { name: 'frontend', visible: false },
              ],
              dueDate: new Date('2026-05-15T12:00:00Z'),
              createdAt: new Date('2026-05-01T10:05:00Z'),
              updatedAt: new Date('2026-05-01T10:05:00Z'),
            },
            {
              _id: '60d5ec49f1b2c8b1f8e4e2b2',
              title: 'Setup Angular workspace',
              priority: 'medium',
              order: 1,
              tags: [{ name: 'frontend', visible: true }],
              createdAt: new Date('2026-05-02T11:00:00Z'),
              updatedAt: new Date('2026-05-02T11:00:00Z'),
            },
          ],
        },
        {
          id: 'col_2',
          name: 'In Progress',
          order: 1,
          cards: [
            {
              _id: '60d5ec49f1b2c8b1f8e4e2b3',
              title: 'Implement Auth Guard',
              description: 'Ensure unauthenticated users are redirected.',
              priority: 'urgent',
              order: 0,
              tags: [
                { name: 'security', visible: true },
                { name: 'frontend', visible: true },
              ],
              createdAt: new Date('2026-05-05T09:00:00Z'),
              updatedAt: new Date('2026-05-10T14:30:00Z'),
            },
          ],
        },
        {
          id: 'col_3',
          name: 'Done',
          order: 2,
          cards: [],
        },
      ],
    },
    {
      _id: '60d5ec49f1b2c8b1f8e4e1a2',
      userId: '60d5ec49f1b2c8b1f8e4e000',
      name: 'Personal Tasks',
      createdAt: new Date('2026-05-08T08:00:00Z'),
      updatedAt: new Date('2026-05-11T09:00:00Z'),
      columns: [
        {
          id: 'col_1',
          name: 'To Do',
          order: 0,
          cards: [
            {
              _id: '60d5ec49f1b2c8b1f8e4e3c1',
              title: 'Buy groceries',
              priority: 'low',
              order: 0,
              tags: [],
              createdAt: new Date('2026-05-11T08:30:00Z'),
              updatedAt: new Date('2026-05-11T08:30:00Z'),
            },
          ],
        },
      ],
    },
  ];
}
