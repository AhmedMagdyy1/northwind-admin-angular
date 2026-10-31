import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authGuard, roleGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(AuthService);
  });

  it('signs in a demo admin and persists the session', async () => {
    const user = await firstValueFrom(auth.login('ADMIN@northwind.dev ', 'demo1234'));
    expect(user.role).toBe('admin');
    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.isAdmin()).toBe(true);
    expect(JSON.parse(localStorage.getItem('nw.session')!).email).toBe('admin@northwind.dev');
  });

  it('rejects a wrong password', async () => {
    await expect(firstValueFrom(auth.login('admin@northwind.dev', 'nope'))).rejects.toThrow(
      'Wrong email or password.',
    );
    expect(auth.isLoggedIn()).toBe(false);
  });

  it('never exposes the password on the user object', async () => {
    const user = await firstValueFrom(auth.login('viewer@northwind.dev', 'demo1234'));
    expect('password' in user).toBe(false);
  });

  it('clears the session on logout', async () => {
    await firstValueFrom(auth.login('viewer@northwind.dev', 'demo1234'));
    auth.logout();
    expect(auth.user()).toBeNull();
    expect(localStorage.getItem('nw.session')).toBeNull();
  });
});

describe('guards', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/orders' } as RouterStateSnapshot;
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  const run = (guard: typeof authGuard) => TestBed.runInInjectionContext(() => guard(route, state));

  it('authGuard redirects anonymous users to /login with a returnUrl', () => {
    const result = run(authGuard) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Forders');
  });

  it('authGuard lets signed-in users through', async () => {
    await firstValueFrom(auth.login('viewer@northwind.dev', 'demo1234'));
    expect(run(authGuard)).toBe(true);
  });

  it('roleGuard sends viewers back to the dashboard', async () => {
    await firstValueFrom(auth.login('viewer@northwind.dev', 'demo1234'));
    const result = run(roleGuard('admin')) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/dashboard');
  });

  it('roleGuard allows admins', async () => {
    await firstValueFrom(auth.login('admin@northwind.dev', 'demo1234'));
    expect(run(roleGuard('admin'))).toBe(true);
  });
});
