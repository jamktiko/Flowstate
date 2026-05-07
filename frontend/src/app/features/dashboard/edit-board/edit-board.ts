import { Component, input, output, inject, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BasicModal } from '@shared/modals/basic-modal/basic-modal';

@Component({
  selector: 'app-edit-board',
  imports: [ReactiveFormsModule, BasicModal],
  templateUrl: './edit-board.html',
  styleUrl: './edit-board.css',
})
export class EditBoardModal {
  isOpen = input<boolean>(false);
  initialData = input<{ title: string; description?: string } | null>(null);

  closeModal = output<void>();
  saveBoard = output<{ title: string; description: string }>();

  private fb = inject(FormBuilder);

  boardForm = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const data = this.initialData();
        if (data) {
          this.boardForm.patchValue({
            title: data.title,
            description: data.description || '',
          });
        } else {
          this.boardForm.reset();
        }
      }
    });
  }

  onClose() {
    this.boardForm.reset();
    this.closeModal.emit();
  }

  onSubmit() {
    if (this.boardForm.valid) {
      this.saveBoard.emit(this.boardForm.value as { title: string; description: string });
      this.onClose();
    }
  }
}
