import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DEMO_USERS } from '../../core/auth.service';

/** Admin-only page: shows how the role guard protects a route. */
@Component({
  selector: 'app-team',
  imports: [MatIconModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Team &amp; roles</h1>
          <p>Only admins can see this page. Viewers are redirected by a route guard.</p>
        </div>
      </header>

      <div class="grid">
        @for (u of users; track u.id) {
          <div class="card member">
            <span class="avatar">{{ u.name[0] }}</span>
            <div>
              <strong>{{ u.name }}</strong>
              <div class="muted">{{ u.email }}</div>
            </div>
            <span class="role">{{ u.role }}</span>
          </div>
        }
      </div>

      <div class="card perms">
        <h2>What each role can do</h2>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Admin</th>
              <th>Viewer</th>
            </tr>
          </thead>
          <tbody>
            @for (p of permissions; track p.action) {
              <tr>
                <td>{{ p.action }}</td>
                <td>
                  <mat-icon [class.yes]="p.admin">{{
                    p.admin ? 'check_circle' : 'block'
                  }}</mat-icon>
                </td>
                <td>
                  <mat-icon [class.yes]="p.viewer">{{
                    p.viewer ? 'check_circle' : 'block'
                  }}</mat-icon>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .member {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .member > div {
      flex: 1;
    }
    .avatar {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font-weight: 600;
    }
    .role {
      padding: 2px 10px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
      font: var(--mat-sys-label-small);
    }
    h2 {
      font: var(--mat-sys-title-medium);
      margin: 0 0 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font: var(--mat-sys-body-medium);
    }
    th,
    td {
      text-align: left;
      padding: 10px 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    th {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
    }
    mat-icon {
      color: var(--mat-sys-outline);
    }
    mat-icon.yes {
      color: #2e9e5b;
    }
  `,
})
export class Team {
  protected readonly users = DEMO_USERS.map(({ password: _, ...u }) => u);
  protected readonly permissions = [
    { action: 'View dashboard, orders, customers', admin: true, viewer: true },
    { action: 'Export orders to CSV', admin: true, viewer: true },
    { action: 'Change order status', admin: true, viewer: false },
    { action: 'Open Team & roles page', admin: true, viewer: false },
  ];
}
