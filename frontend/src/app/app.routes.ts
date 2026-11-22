import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { EmployeesListComponent } from './features/employees/employees-list.component';
import { ReportsComponent } from './features/reports/reports.component';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'employees', component: EmployeesListComponent },
      {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [roleGuard('ROLE_ADMIN', 'ROLE_USER')]
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];

