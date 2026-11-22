import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { LoginRequest, LoginResponse } from './auth.models';

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';
const REMEMBER_KEY = 'remember_username';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080/api/auth';

  private readonly tokenSignal = signal<string | null>(this.readToken());
  private readonly usernameSignal = signal<string | null>(this.readUsername());
  private readonly roleSignal = signal<string | null>(this.readRole());
  private readonly employeeIdSignal = signal<number | null>(this.readEmployeeId());

  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly username = computed(() => this.usernameSignal());
  readonly role = computed(() => this.roleSignal());
  readonly employeeId = computed(() => this.employeeIdSignal());
  /** Full CRUD + reports */
  readonly isAdmin = computed(() => this.roleSignal() === 'ROLE_ADMIN');
  /** Company-wide read-only viewer (sees all + reports, no CUD) */
  readonly isViewer = computed(() => this.roleSignal() === 'ROLE_USER');
  /** Self-service employee (own profile only) */
  readonly isSelfService = computed(() => this.roleSignal() === 'ROLE_EMPLOYEE');
  readonly canViewReports = computed(() => this.isAdmin() || this.isViewer());
  readonly canMutateEmployees = computed(() => this.isAdmin());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  login(payload: LoginRequest, rememberMe: boolean): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap((res) => {
        this.persistSession(res);
        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, payload.username);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
      })
    );
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    return this.http
      .post<LoginResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        tap((res) => this.persistSession(res)),
        catchError((err) => {
          this.clearSession(false);
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({ error: () => undefined });
    }
    this.clearSession(true);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  getRememberedUsername(): string {
    return localStorage.getItem(REMEMBER_KEY) ?? '';
  }

  hasRole(role: string): boolean {
    return this.roleSignal() === role;
  }

  private persistSession(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        username: res.username,
        role: res.role,
        employeeId: res.employeeId ?? null
      })
    );
    this.tokenSignal.set(res.token);
    this.usernameSignal.set(res.username);
    this.roleSignal.set(res.role);
    this.employeeIdSignal.set(res.employeeId ?? null);
  }

  private clearSession(navigateToLogin: boolean): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.usernameSignal.set(null);
    this.roleSignal.set(null);
    this.employeeIdSignal.set(null);
    if (navigateToLogin) {
      this.router.navigate(['/login']);
    }
  }

  private readToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private readUsername(): string | null {
    return this.readUserField('username') as string | null;
  }

  private readRole(): string | null {
    return this.readUserField('role') as string | null;
  }

  private readEmployeeId(): number | null {
    const value = this.readUserField('employeeId');
    return typeof value === 'number' ? value : null;
  }

  private readUserField(field: 'username' | 'role' | 'employeeId'): string | number | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw)[field] ?? null;
    } catch {
      return null;
    }
  }
}
