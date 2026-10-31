import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { Role, User } from './models';

const STORAGE_KEY = 'nw.session';

/** Demo accounts. A real app would call an auth endpoint and get a JWT back. */
export const DEMO_USERS: (User & { password: string })[] = [
  {
    id: 'u1',
    name: 'Alex Admin',
    email: 'admin@northwind.dev',
    role: 'admin',
    password: 'demo1234',
  },
  {
    id: 'u2',
    name: 'Victor Viewer',
    email: 'viewer@northwind.dev',
    role: 'viewer',
    password: 'demo1234',
  },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<User | null>(readSession());

  readonly user = this.session.asReadonly();
  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.session()?.role === 'admin');

  login(email: string, password: string): Observable<User> {
    const match = DEMO_USERS.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password,
    );
    if (!match) {
      return throwError(() => new Error('Wrong email or password.'));
    }
    const { password: _, ...user } = match;
    this.session.set(user);
    writeSession(user);
    return of(user).pipe(delay(300));
  }

  logout(): void {
    this.session.set(null);
    writeSession(null);
  }

  hasRole(role: Role): boolean {
    return this.session()?.role === role;
  }
}

function readSession(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeSession(user: User | null): void {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode); the session just won't persist.
  }
}
