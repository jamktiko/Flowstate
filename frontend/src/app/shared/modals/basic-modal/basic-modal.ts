import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-basic-modal',
  imports: [],
  templateUrl: './basic-modal.html',
  styleUrl: './basic-modal.css',
})
export class BasicModal {
  isOpen = input<boolean>(false);
  closeModal = output<void>();

  onClose() {
    this.closeModal.emit();
  }
}
