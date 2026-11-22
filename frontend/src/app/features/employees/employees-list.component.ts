import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Employee } from '../../core/employees/employee.models';
import { EmployeeService } from '../../core/employees/employee.service';
import { EmployeeFormDialogComponent } from './employee-form-dialog.component';
import { EmployeeDetailDialogComponent } from './employee-detail-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './employees-list.component.html',
  styleUrl: './employees-list.component.scss'
})
export class EmployeesListComponent implements OnInit, OnDestroy {
  private readonly employeeService = inject(EmployeeService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly auth = inject(AuthService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  readonly displayedColumns = [
    'employee',
    'employeeCode',
    'department',
    'employmentType',
    'status',
    'hireDate',
    'endDate',
    'actions'
  ];

  readonly searchControl = new FormControl('', { nonNullable: true });

  data: Employee[] = [];
  totalElements = 0;
  pageIndex = 0;
  pageSize = 10;
  sortActive = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';
  loading = false;

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.load();
      });

    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  onSort(sort: Sort): void {
    this.sortActive = sort.active || 'id';
    this.sortDirection = (sort.direction as 'asc' | 'desc') || 'asc';
    this.load();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  openView(employee: Employee): void {
    const ref = this.dialog.open(EmployeeDetailDialogComponent, {
      width: '620px',
      maxWidth: '94vw',
      data: { employee, canEdit: this.auth.canMutateEmployees() }
    });

    ref.afterClosed().subscribe((result) => {
      if (result === 'edit' && this.auth.canMutateEmployees()) {
        this.openEdit(employee);
      }
    });
  }

  formatLabel(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  /** Single end-date value for the list: contract/intern term, or full-time exit date. */
  endDateFor(row: Employee): string | null {
    const type = row.employmentType || 'FULL_TIME';
    if (type === 'CONTRACT' || type === 'INTERN') {
      return row.contractEndDate || row.employmentEndDate || null;
    }
    if (row.status === 'INACTIVE') {
      return row.employmentEndDate || null;
    }
    return null;
  }

  openCreate(): void {
    if (!this.auth.canMutateEmployees()) {
      return;
    }
    const ref = this.dialog.open(EmployeeFormDialogComponent, {
      width: '740px',
      maxWidth: '94vw',
      panelClass: 'employee-dialog-panel',
      data: {}
    });

    ref.afterClosed().subscribe((payload) => {
      if (!payload) {
        return;
      }
      this.employeeService.create(payload).subscribe({
        next: () => {
          this.snackBar.open('Employee created', 'Close', { duration: 2500 });
          this.load();
        },
        error: (err) => this.showError(err, 'Failed to create employee')
      });
    });
  }

  openEdit(employee: Employee): void {
    if (!this.auth.canMutateEmployees()) {
      return;
    }
    const ref = this.dialog.open(EmployeeFormDialogComponent, {
      width: '740px',
      maxWidth: '94vw',
      panelClass: 'employee-dialog-panel',
      data: { employee }
    });

    ref.afterClosed().subscribe((payload) => {
      if (!payload) {
        return;
      }
      this.employeeService.update(employee.id, payload).subscribe({
        next: () => {
          this.snackBar.open('Employee updated', 'Close', { duration: 2500 });
          this.load();
        },
        error: (err) => this.showError(err, 'Failed to update employee')
      });
    });
  }

  confirmDelete(employee: Employee): void {
    if (!this.auth.canMutateEmployees()) {
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      maxWidth: '94vw',
      data: {
        title: 'Delete employee?',
        message: `This will remove ${employee.firstName} ${employee.lastName} (${employee.employeeCode}). You can cancel if this was a mistake.`,
        confirmText: 'Delete',
        cancelText: 'Keep employee'
      }
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.employeeService.delete(employee.id).subscribe({
        next: () => {
          this.snackBar.open('Employee deleted', 'Close', { duration: 2500 });
          this.load();
        },
        error: (err) => this.showError(err, 'Failed to delete employee')
      });
    });
  }

  private load(): void {
    this.loading = true;
    this.employeeService
      .list({
        page: this.pageIndex,
        size: this.pageSize,
        sort: this.sortActive,
        direction: this.sortDirection,
        search: this.searchControl.value
      })
      .subscribe({
        next: (page) => {
          this.data = page.content;
          this.totalElements = page.totalElements;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.showError(err, 'Failed to load employees');
        }
      });
  }

  private showError(err: any, fallback: string): void {
    const message = err?.error?.message || fallback;
    this.snackBar.open(message, 'Close', { duration: 3500 });
  }
}
