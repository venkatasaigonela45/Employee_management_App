import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee, PageResponse } from '../employees/employee.models';
import { ReportQuery, ReportSummary } from './report.models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/reports';

  getEmployees(query: ReportQuery): Observable<PageResponse<Employee>> {
    return this.http.get<PageResponse<Employee>>(`${this.apiUrl}/employees`, {
      params: this.toParams(query)
    });
  }

  getSummary(query: ReportQuery): Observable<ReportSummary> {
    return this.http.get<ReportSummary>(`${this.apiUrl}/employees/summary`, {
      params: this.toParams(query)
    });
  }

  getDepartments(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/departments`);
  }

  exportExcel(query: ReportQuery): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/employees/export/excel`, {
      params: this.toParams(query),
      responseType: 'blob'
    });
  }

  exportPdf(query: ReportQuery): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/employees/export/pdf`, {
      params: this.toParams(query),
      responseType: 'blob'
    });
  }

  private toParams(query: ReportQuery): HttpParams {
    let params = new HttpParams();
    if (query.status) params = params.set('status', query.status);
    if (query.department) params = params.set('department', query.department);
    if (query.fromDate) params = params.set('fromDate', query.fromDate);
    if (query.toDate) params = params.set('toDate', query.toDate);
    if (query.page != null) params = params.set('page', query.page);
    if (query.size != null) params = params.set('size', query.size);
    if (query.sort && query.direction) {
      params = params.set('sort', `${query.sort},${query.direction}`);
    }
    return params;
  }
}
