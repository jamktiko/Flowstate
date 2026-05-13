import { Component, input, output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BasicModal } from '@shared/modals/basic-modal/basic-modal';

@Component({
  selector: 'app-view-selector',
  imports: [BasicModal],
  templateUrl: './view-selector.html',
  styleUrl: './view-selector.css',
})
export class ViewSelector {
  private router = inject(Router);
  isOpen = input.required<boolean>();
  closeModal = output<void>();

  goToCalendar() {
    this.closeModal.emit();
    this.router.navigate(['/dashboard/calendar']);
  }
}
