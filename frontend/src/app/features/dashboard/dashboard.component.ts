import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';
import { EmployeeService } from '../../core/employees/employee.service';
import { ReportService } from '../../core/reports/report.service';
import { Employee } from '../../core/employees/employee.models';
import { ReportSummary } from '../../core/reports/report.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly employeeService = inject(EmployeeService);
  private readonly reportService = inject(ReportService);

  loading = true;
  summary: ReportSummary | null = null;
  recentEmployees: Employee[] = [];

  ngOnInit(): void {
    const range = {
      fromDate: '2000-01-01',
      toDate: new Date().toISOString().slice(0, 10)
    };

    this.reportService.getSummary(range).subscribe({
      next: (summary) => {
        this.summary = summary;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this.employeeService
      .list({ page: 0, size: 5, sort: 'updatedAt', direction: 'desc', search: '' })
      .subscribe({
        next: (page) => (this.recentEmployees = page.content),
        error: () => (this.recentEmployees = [])
      });
  }

  statusCount(status: string): number {
    return this.summary?.byStatus?.[status] ?? 0;
  }

  departmentEntries(): Array<{ name: string; count: number }> {
    if (!this.summary) {
      return [];
    }
    return Object.entries(this.summary.byDepartment)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}
