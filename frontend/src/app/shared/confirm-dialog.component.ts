import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm">
      <div class="icon-wrap">
        <mat-icon>warning_amber</mat-icon>
      </div>
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-stroked-button type="button" (click)="close(false)">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-flat-button color="warn" type="button" (click)="close(true)">
          {{ data.confirmText || 'Delete' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: `
    .confirm {
      padding: 0.35rem 0.15rem 0.15rem;
      font-family: var(--brand-font-ui);
      min-width: min(420px, 86vw);
    }
    .icon-wrap {
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      margin: 0.35rem 0 0.5rem 0.85rem;
      border-radius: 50%;
      background: var(--brand-danger-soft);
      color: var(--brand-danger);
    }
    h2[mat-dialog-title] {
      margin: 0;
      padding: 0 1rem;
      color: var(--brand-ink);
      font-size: 1.2rem;
      font-weight: 700;
    }
    mat-dialog-content p {
      margin: 0.35rem 0 0.5rem;
      color: var(--brand-ink-soft);
      line-height: 1.45;
    }
    mat-dialog-actions {
      gap: 0.5rem;
      padding: 0.5rem 1rem 0.85rem !important;
    }
  `
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent, boolean>);

  close(result: boolean): void {
    this.dialogRef.close(result);
  }
}
