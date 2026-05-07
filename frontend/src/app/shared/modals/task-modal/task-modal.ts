import { Component, input, output, inject, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task } from '@core/models/task.model';
import { BasicModal } from '../basic-modal/basic-modal';

@Component({
  selector: 'app-task-modal',
  imports: [ReactiveFormsModule, BasicModal],
  templateUrl: './task-modal.html',
  styleUrl: './task-modal.css',
})
export class TaskModal {
  isOpen = input<boolean>(false);
  initialData = input<Partial<Task> | null>(null);

  private mapTagsToFormGroup(tags: string[]) {
    return {
      bug: tags.includes('bug'),
      feature: tags.includes('feature'),
      enhancement: tags.includes('enhancement'),
    };
  }

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const data = this.initialData();
        if (data) {
          this.taskForm.patchValue({
            title: data.title || '',
            description: data.description || '',
            priority: data.priority || 'medium',
            dueDate: data.dueDate || '',
            tags: this.mapTagsToFormGroup(data.tags || []),
          });
        } else {
          this.taskForm.reset({
            priority: 'medium',
            tags: { bug: false, feature: false, enhancement: false },
          });
        }
      }
    });
  }

  closeModal = output<void>();
  saveTask = output<Task>();

  private fb = inject(FormBuilder);

  taskForm = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    priority: ['medium'],
    dueDate: [''],
    tags: this.fb.group({
      bug: [false],
      feature: [false],
      enhancement: [false],
    }),
  });

  onClose() {
    this.taskForm.reset({
      priority: 'medium',
      tags: { bug: false, feature: false, enhancement: false },
    });
    this.closeModal.emit();
  }

  onSubmit() {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      const tagsGroup = formValue.tags || {};
      const selectedTags = Object.keys(tagsGroup).filter(
        (key) => tagsGroup[key as keyof typeof tagsGroup],
      );

      const payload = {
        ...formValue,
        tags: selectedTags,
      };

      this.saveTask.emit(payload as any);
      this.onClose();
    }
  }
}
