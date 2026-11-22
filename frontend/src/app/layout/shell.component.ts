import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/auth/auth.service';
import { IdleTimeoutService } from '../core/auth/idle-timeout.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly idleTimeout = inject(IdleTimeoutService);

  ngOnInit(): void {
    this.idleTimeout.start();
  }

  ngOnDestroy(): void {
    this.idleTimeout.stop();
  }

  logout(): void {
    this.idleTimeout.stop();
    this.auth.logout();
  }
}
