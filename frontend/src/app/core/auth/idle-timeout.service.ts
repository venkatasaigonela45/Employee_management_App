import { Injectable, inject, NgZone, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from './auth.service';

const IDLE_LIMIT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 60 * 1000;

@Injectable({ providedIn: 'root' })
export class IdleTimeoutService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly zone = inject(NgZone);

  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private warningShown = false;
  private started = false;
  private readonly activityHandler = () => this.onActivity();

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.zone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.activityHandler);
      window.addEventListener('mousedown', this.activityHandler);
      window.addEventListener('keydown', this.activityHandler);
      window.addEventListener('touchstart', this.activityHandler);
      window.addEventListener('scroll', this.activityHandler);
    });
    this.resetTimers();
  }

  stop(): void {
    if (!this.started) {
      return;
    }
    this.started = false;
    window.removeEventListener('mousemove', this.activityHandler);
    window.removeEventListener('mousedown', this.activityHandler);
    window.removeEventListener('keydown', this.activityHandler);
    window.removeEventListener('touchstart', this.activityHandler);
    window.removeEventListener('scroll', this.activityHandler);
    this.clearTimers();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private onActivity(): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }
    this.zone.run(() => this.resetTimers());
  }

  private resetTimers(): void {
    this.clearTimers();
    this.warningShown = false;

    this.warningTimer = setTimeout(() => {
      this.zone.run(() => {
        if (!this.auth.isAuthenticated() || this.warningShown) {
          return;
        }
        this.warningShown = true;
        this.snackBar.open(
          'You will be logged out in 1 minute due to inactivity.',
          'Stay signed in',
          { duration: WARNING_BEFORE_MS }
        ).onAction().subscribe(() => this.resetTimers());
      });
    }, IDLE_LIMIT_MS - WARNING_BEFORE_MS);

    this.idleTimer = setTimeout(() => {
      this.zone.run(() => {
        if (!this.auth.isAuthenticated()) {
          return;
        }
        this.snackBar.open('Logged out due to 30 minutes of inactivity.', 'Close', {
          duration: 4000
        });
        this.auth.logout();
      });
    }, IDLE_LIMIT_MS);
  }

  private clearTimers(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }
}
