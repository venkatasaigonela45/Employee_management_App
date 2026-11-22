import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Employee, EmployeeStatus } from '../../core/employees/employee.models';
import { ReportService } from '../../core/reports/report.service';
import { ReportSummary } from '../../core/reports/report.models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly reportService = inject(ReportService);
  private readonly snackBar = inject(MatSnackBar);

  readonly statuses: Array<EmployeeStatus | ''> = ['', 'ACTIVE', 'INACTIVE', 'ON_LEAVE'];
  readonly displayedColumns = [
    'employee',
    'employeeCode',
    'department',
    'employmentType',
    'status',
    'hireDate'
  ];

  departments: string[] = [];
  data: Employee[] = [];
  summary: ReportSummary | null = null;
  totalElements = 0;
  pageIndex = 0;
  pageSize = 10;
  sortActive = 'hireDate';
  sortDirection: 'asc' | 'desc' = 'desc';
  loading = false;

  readonly filterForm = this.fb.nonNullable.group({
    status: ['' as EmployeeStatus | ''],
    department: [''],
    fromDate: [this.startOfMonth()],
    toDate: [this.endOfMonth()]
  });

  ngOnInit(): void {
    this.reportService.getDepartments().subscribe({
      next: (deps) => (this.departments = deps),
      error: () => (this.departments = [])
    });
    this.load();
  }

  applyFilters(): void {
    if (!this.validateDates()) {
      return;
    }
    this.pageIndex = 0;
    this.load();
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  onSort(sort: Sort): void {
    this.sortActive = sort.active || 'hireDate';
    this.sortDirection = (sort.direction as 'asc' | 'desc') || 'asc';
    this.load();
  }

  exportExcel(): void {
    if (!this.validateDates()) {
      return;
    }
    this.reportService.exportExcel(this.query()).subscribe({
      next: (blob) => this.download(blob, this.exportFilename('xlsx')),
      error: () => this.snackBar.open('Excel export failed', 'Close', { duration: 3000 })
    });
  }

  exportPdf(): void {
    if (!this.validateDates()) {
      return;
    }
    this.reportService.exportPdf(this.query()).subscribe({
      next: (blob) => this.download(blob, this.exportFilename('pdf')),
      error: () => this.snackBar.open('PDF export failed', 'Close', { duration: 3000 })
    });
  }

  formatStatus(status: string): string {
    return status
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  statusEntries(): Array<{ key: string; value: number }> {
    if (!this.summary) {
      return [];
    }
    return Object.entries(this.summary.byStatus).map(([key, value]) => ({ key, value }));
  }

  departmentEntries(): Array<{ key: string; value: number }> {
    if (!this.summary) {
      return [];
    }
    return Object.entries(this.summary.byDepartment).map(([key, value]) => ({ key, value }));
  }

  private load(): void {
    this.loading = true;
    const query = this.query();

    this.reportService.getSummary(query).subscribe({
      next: (summary) => (this.summary = summary),
      error: () => this.snackBar.open('Failed to load summary', 'Close', { duration: 3000 })
    });

    this.reportService
      .getEmployees({
        ...query,
        page: this.pageIndex,
        size: this.pageSize,
        sort: this.sortActive,
        direction: this.sortDirection
      })
      .subscribe({
        next: (page) => {
          this.data = page.content;
          this.totalElements = page.totalElements;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(err?.error?.message || 'Failed to load report', 'Close', { duration: 3000 });
        }
      });
  }

  private query() {
    const raw = this.filterForm.getRawValue();
    return {
      status: raw.status || undefined,
      department: raw.department || undefined,
      fromDate: this.toIsoDate(raw.fromDate),
      toDate: this.toIsoDate(raw.toDate)
    };
  }

  private validateDates(): boolean {
    const { fromDate, toDate } = this.filterForm.getRawValue();
    if (fromDate && toDate && fromDate > toDate) {
      this.snackBar.open('From date must be less than or equal to To date', 'Close', { duration: 3000 });
      return false;
    }
    return true;
  }

  private toIsoDate(value: Date | null): string | undefined {
    if (!value) {
      return undefined;
    }
    const date = value instanceof Date ? value : new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private exportFilename(extension: 'pdf' | 'xlsx'): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `employee-report-${stamp}.${extension}`;
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private startOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private endOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
}
