import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee, EmployeeRequest, PageResponse } from './employee.models';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/employees';

  list(options: {
    page: number;
    size: number;
    sort: string;
    direction: 'asc' | 'desc';
    search: string;
  }): Observable<PageResponse<Employee>> {
    let params = new HttpParams()
      .set('page', options.page)
      .set('size', options.size)
      .set('sort', `${options.sort},${options.direction}`);

    if (options.search?.trim()) {
      params = params.set('search', options.search.trim());
    }

    return this.http.get<PageResponse<Employee>>(this.apiUrl, { params });
  }

  create(payload: EmployeeRequest): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, payload);
  }

  update(id: number, payload: EmployeeRequest): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
