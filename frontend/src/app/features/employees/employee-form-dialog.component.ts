import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import {
  Employee,
  EmployeeRequest,
  EmployeeStatus,
  EmploymentType
} from '../../core/employees/employee.models';

export interface EmployeeFormDialogData {
  employee?: Employee;
}

@Component({
  selector: 'app-employee-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './employee-form-dialog.component.html',
  styleUrl: './employee-form-dialog.component.scss'
})
export class EmployeeFormDialogComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EmployeeFormDialogComponent, EmployeeRequest | undefined>);
  private readonly destroy$ = new Subject<void>();
  readonly data = inject<EmployeeFormDialogData>(MAT_DIALOG_DATA);

  readonly statuses: EmployeeStatus[] = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'];
  readonly employmentTypes: EmploymentType[] = ['FULL_TIME', 'CONTRACT', 'INTERN'];
  readonly isEdit = !!this.data.employee;
  readonly departments = this.buildDepartments();

  readonly form = this.fb.nonNullable.group({
    employeeCode: [this.data.employee?.employeeCode ?? '', [Validators.required, Validators.maxLength(20)]],
    firstName: [this.data.employee?.firstName ?? '', [Validators.required, Validators.maxLength(50)]],
    lastName: [this.data.employee?.lastName ?? '', [Validators.required, Validators.maxLength(50)]],
    email: [this.data.employee?.email ?? '', [Validators.required, Validators.email, Validators.maxLength(100)]],
    phone: [
      this.data.employee?.phone ?? '',
      Validators.pattern(/^$|^[+0-9\-\s()]{7,20}$/)
    ],
    department: [this.data.employee?.department ?? '', [Validators.required, Validators.maxLength(50)]],
    status: [this.data.employee?.status ?? ('ACTIVE' as EmployeeStatus), Validators.required],
    employmentType: [
      this.data.employee?.employmentType ?? ('FULL_TIME' as EmploymentType),
      Validators.required
    ],
    hireDate: [
      this.data.employee ? this.parseLocalDate(this.data.employee.hireDate) : new Date(),
      Validators.required
    ],
    contractEndDate: [
      this.data.employee?.contractEndDate
        ? this.parseLocalDate(this.data.employee.contractEndDate)
        : this.data.employee?.employmentEndDate && this.data.employee.employmentType !== 'FULL_TIME'
          ? this.parseLocalDate(this.data.employee.employmentEndDate)
          : (null as Date | null)
    ],
    employmentEndDate: [
      this.data.employee?.employmentEndDate
        ? this.parseLocalDate(this.data.employee.employmentEndDate)
        : (null as Date | null)
    ],
    notes: [this.data.employee?.notes ?? '', Validators.maxLength(500)]
  });

  constructor() {
    this.refreshDateValidators();

    this.form.controls.employmentType.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshDateValidators());

    this.form.controls.status.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshDateValidators());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get showContractEndDate(): boolean {
    const type = this.form.controls.employmentType.value;
    return type === 'CONTRACT' || type === 'INTERN';
  }

  /** Full-time inactive: dedicated employment end date field */
  get showEmploymentEndDate(): boolean {
    return (
      this.form.controls.status.value === 'INACTIVE' &&
      this.form.controls.employmentType.value === 'FULL_TIME'
    );
  }

  get showInactiveReason(): boolean {
    return this.form.controls.status.value === 'INACTIVE';
  }

  get contractEndLabel(): string {
    return this.form.controls.employmentType.value === 'INTERN'
      ? 'Internship End Date'
      : 'Contract End Date';
  }

  get contractEndRequired(): boolean {
    const type = this.form.controls.employmentType.value;
    const status = this.form.controls.status.value;
    // Contract always needs an end date; inactive interns do too
    if (type === 'CONTRACT') {
      return true;
    }
    return status === 'INACTIVE' && type === 'INTERN';
  }

  formatLabel(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const isFullTime = raw.employmentType === 'FULL_TIME';
    const isInactive = raw.status === 'INACTIVE';
    const contractEnd =
      isFullTime || !raw.contractEndDate ? null : this.toLocalIsoDate(raw.contractEndDate);

    this.dialogRef.close({
      employeeCode: raw.employeeCode.trim(),
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      email: raw.email.trim(),
      phone: raw.phone?.trim() || null,
      department: raw.department.trim(),
      status: raw.status,
      employmentType: raw.employmentType,
      hireDate: this.toLocalIsoDate(raw.hireDate),
      contractEndDate: contractEnd,
      // Full-time inactive uses employment end; contract/intern inactive uses contract end as end date
      employmentEndDate:
        isInactive && isFullTime && raw.employmentEndDate
          ? this.toLocalIsoDate(raw.employmentEndDate)
          : isInactive && !isFullTime && contractEnd
            ? contractEnd
            : null,
      notes: raw.notes?.trim() || null
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  private refreshDateValidators(): void {
    const type = this.form.controls.employmentType.value;
    const status = this.form.controls.status.value;
    const contract = this.form.controls.contractEndDate;
    const employmentEnd = this.form.controls.employmentEndDate;
    const notes = this.form.controls.notes;
    const termBased = type === 'CONTRACT' || type === 'INTERN';
    const fullTimeInactive = status === 'INACTIVE' && type === 'FULL_TIME';

    if (type === 'CONTRACT' || (status === 'INACTIVE' && termBased)) {
      contract.setValidators([Validators.required]);
    } else {
      contract.clearValidators();
      if (type === 'FULL_TIME') {
        contract.setValue(null);
      }
    }

    if (fullTimeInactive) {
      employmentEnd.setValidators([Validators.required]);
    } else {
      employmentEnd.clearValidators();
      employmentEnd.setValue(null);
    }

    if (status === 'INACTIVE') {
      notes.setValidators([Validators.required, Validators.maxLength(500)]);
    } else {
      notes.setValidators([Validators.maxLength(500)]);
    }

    contract.updateValueAndValidity({ emitEvent: false });
    employmentEnd.updateValueAndValidity({ emitEvent: false });
    notes.updateValueAndValidity({ emitEvent: false });
  }

  private buildDepartments(): string[] {
    const base = ['Engineering', 'HR', 'Finance', 'Sales', 'Marketing', 'QA', 'Operations'];
    const current = this.data.employee?.department?.trim();
    if (current && !base.includes(current)) {
      return [current, ...base];
    }
    return base;
  }

  private parseLocalDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toLocalIsoDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
