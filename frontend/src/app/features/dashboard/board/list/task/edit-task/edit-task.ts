import { Component, input, output, inject, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Card } from '@core/models/board-model';
import { BasicModal } from '@shared/modals/basic-modal/basic-modal';

@Component({
  selector: 'app-edit-task',
  imports: [ReactiveFormsModule, BasicModal],
  templateUrl: './edit-task.html',
  styleUrl: './edit-task.css', // You can copy task-modal.css styles here
})
export class EditTask {
  isOpen = input<boolean>(false);
  initialData = input<Partial<Card> | null>(null);

  closeModal = output<void>();
  saveTask = output<Card>();

  private fb = inject(FormBuilder);

  taskForm = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    priority: ['medium'],
    dueDate: [''],
    tags: this.fb.group({
      backend: [false],
      security: [false],
      frontend: [false],
      urgent: [false],
    }),
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const data = this.initialData();
        if (data) {
          const formattedDate =
            data.dueDate instanceof Date
              ? data.dueDate.toISOString().split('T')[0]
              : data.dueDate || '';

          const existingTagNames = (data.tags || []).map((t) => t.name);

          this.taskForm.patchValue({
            title: data.title || '',
            description: data.description || '',
            priority: data.priority || 'medium',
            dueDate: formattedDate,
            tags: {
              backend: existingTagNames.includes('backend'),
              security: existingTagNames.includes('security'),
              frontend: existingTagNames.includes('frontend'),
              urgent: existingTagNames.includes('urgent'),
            },
          });
        }
      }
    });
  }

  onClose() {
    this.closeModal.emit();
  }

  onSubmit() {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      const tagsGroup = formValue.tags || {};
      
      const mappedTags = Object.keys(tagsGroup)
        .filter((key) => tagsGroup[key as keyof typeof tagsGroup])
        .map((key) => ({ name: key, visible: true }));

      const payload = {
        ...this.initialData(),
        ...formValue,
        tags: mappedTags,
      };

      this.saveTask.emit(payload as Card);
      this.onClose();
    }
  }
}
