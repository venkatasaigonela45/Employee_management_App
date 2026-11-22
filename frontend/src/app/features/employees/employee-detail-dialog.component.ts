import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Employee } from '../../core/employees/employee.models';

export interface EmployeeDetailDialogData {
  employee: Employee;
  canEdit?: boolean;
}

@Component({
  selector: 'app-employee-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './employee-detail-dialog.component.html',
  styleUrl: './employee-detail-dialog.component.scss'
})
export class EmployeeDetailDialogComponent {
  readonly data = inject<EmployeeDetailDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EmployeeDetailDialogComponent, 'edit' | undefined>);

  get employee(): Employee {
    return this.data.employee;
  }

  get canEdit(): boolean {
    return this.data.canEdit !== false;
  }

  get isTermBased(): boolean {
    const type = this.employee.employmentType;
    return type === 'CONTRACT' || type === 'INTERN';
  }

  get termEndLabel(): string {
    return this.employee.employmentType === 'INTERN' ? 'Internship end date' : 'Contract end date';
  }

  formatLabel(value?: string | null): string {
    if (!value) {
      return '—';
    }
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  statusHint(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Currently employed and working.';
      case 'ON_LEAVE':
        return 'Employed, but temporarily away from work.';
      case 'INACTIVE':
        return 'Not currently active in the workforce. Kept for records.';
      default:
        return '';
    }
  }

  close(): void {
    this.dialogRef.close(undefined);
  }

  edit(): void {
    this.dialogRef.close('edit');
  }
}
