import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-indicator',
  template: `
    <div class="status-indicator" [ngClass]="getStatusClass()">
      <div class="status-dot"></div>
    </div>
  `,
  styleUrls: ['./status-indicator.scss'],
  standalone: true,
  imports: [NgClass]
})
export class StatusIndicator {
  @Input() status: string = '';

  getStatusClass(): string {
    const normalizedStatus = this.status.toUpperCase().trim();

    if (normalizedStatus.includes('RECRUITING')) {
      return 'status-recruiting';
    }
    if (normalizedStatus.includes('COMPLETED')) {
      return 'status-completed';
    }
    if (normalizedStatus.includes('TERMINATED') || normalizedStatus.includes('WITHDRAWN')) {
      return 'status-terminated';
    }
    if (normalizedStatus.includes('SUSPENDED')) {
      return 'status-suspended';
    }
    if (normalizedStatus.includes('ACTIVE')) {
      return 'status-active';
    }

    return 'status-unknown';
  }
}
