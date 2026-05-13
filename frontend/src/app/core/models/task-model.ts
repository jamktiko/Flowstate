export interface Task {
  id?: string | number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string[];
}
