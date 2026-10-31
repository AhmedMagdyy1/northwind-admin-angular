import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService, DEMO_USERS } from '../../core/auth.service';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="wrap">
      <button class="theme" mat-icon-button aria-label="Toggle dark mode" (click)="theme.toggle()">
        <mat-icon>{{ theme.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>

      <form class="card login" [formGroup]="form" (ngSubmit)="submit()">
        <div class="brand"><mat-icon>insights</mat-icon> Northwind Ops</div>
        <h1>Sign in</h1>
        <p class="muted">Admin dashboard demo built with Angular 22 and Angular Material.</p>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="username" />
          @if (form.controls.email.hasError('required')) {
            <mat-error>Email is required</mat-error>
          } @else if (form.controls.email.hasError('email')) {
            <mat-error>Enter a valid email</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input
            matInput
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="password"
            autocomplete="current-password"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
            (click)="showPassword.set(!showPassword())"
          >
            <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.controls.password.hasError('required')) {
            <mat-error>Password is required</mat-error>
          }
        </mat-form-field>

        @if (error()) {
          <div class="error" role="alert">{{ error() }}</div>
        }

        <button mat-flat-button type="submit" [disabled]="loading()">
          @if (loading()) {
            <mat-spinner diameter="20" />
          } @else {
            Sign in
          }
        </button>

        <div class="demo">
          <span class="muted">Demo accounts (password: demo1234)</span>
          <div class="demo-buttons">
            @for (u of demoUsers; track u.email) {
              <button mat-stroked-button type="button" (click)="fill(u.email)">{{ u.role }}</button>
            }
          </div>
        </div>
      </form>
    </div>
  `,
  styles: `
    .wrap {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 16px;
      box-sizing: border-box;
      background:
        radial-gradient(1200px 600px at 10% -10%, var(--mat-sys-primary-container), transparent),
        var(--mat-sys-surface-container-low);
    }
    .theme {
      position: fixed;
      top: 12px;
      right: 12px;
    }
    .login {
      width: 100%;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 32px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--mat-sys-primary);
      font: var(--mat-sys-title-medium);
      font-weight: 600;
    }
    h1 {
      font: var(--mat-sys-headline-small);
      margin: 16px 0 4px;
    }
    p {
      margin: 0 0 20px;
      font: var(--mat-sys-body-medium);
    }
    .error {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      font: var(--mat-sys-body-medium);
    }
    button[type='submit'] {
      height: 44px;
    }
    mat-spinner {
      margin: 0 auto;
    }
    .demo {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font: var(--mat-sys-body-small);
    }
    .demo-buttons {
      display: flex;
      gap: 8px;
    }
    .demo-buttons button {
      flex: 1;
      text-transform: capitalize;
    }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);

  /** Bound from the ?returnUrl= query param by withComponentInputBinding. */
  readonly returnUrl = input<string>('/dashboard');

  protected readonly demoUsers = DEMO_USERS;
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected fill(email: string): void {
    this.form.setValue({ email, password: 'demo1234' });
    this.error.set(null);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl() || '/dashboard'),
      error: (e: Error) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }
}
