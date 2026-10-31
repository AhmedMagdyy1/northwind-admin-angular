import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
import { AuthService } from '../../core/auth.service';
import { ChartComponent, ChartFactory, withAlpha } from '../../shared/chart';

const STATUS_COLORS = {
  pending: '#f2a900',
  paid: '#2f7fd8',
  shipped: '#2e9e5b',
  refunded: '#d64545',
};

@Component({
  selector: 'app-dashboard',
  imports: [
    ChartComponent,
    CurrencyPipe,
    DecimalPipe,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Welcome back, {{ firstName() }}</h1>
          <p>Here's how the business is doing over the last 30 days.</p>
        </div>
      </header>

      <section class="kpis">
        <div class="card kpi">
          <span class="kpi-label"><mat-icon>payments</mat-icon> Revenue</span>
          <strong>{{ kpis().revenue | currency: 'USD' : 'symbol' : '1.0-0' }}</strong>
          <span class="trend" [class.down]="kpis().revenueChange < 0">
            <mat-icon>{{ kpis().revenueChange < 0 ? 'trending_down' : 'trending_up' }}</mat-icon>
            {{ kpis().revenueChange | number: '1.0-1' }}% vs last 30 days
          </span>
        </div>
        <div class="card kpi">
          <span class="kpi-label"><mat-icon>receipt_long</mat-icon> Orders</span>
          <strong>{{ kpis().orders | number }}</strong>
          <span class="trend" [class.down]="kpis().ordersChange < 0">
            <mat-icon>{{ kpis().ordersChange < 0 ? 'trending_down' : 'trending_up' }}</mat-icon>
            {{ kpis().ordersChange | number: '1.0-1' }}% vs last 30 days
          </span>
        </div>
        <div class="card kpi">
          <span class="kpi-label"><mat-icon>shopping_cart</mat-icon> Avg. order</span>
          <strong>{{ kpis().avgOrder | currency: 'USD' : 'symbol' : '1.0-0' }}</strong>
          <span class="muted">per paid order</span>
        </div>
        <div class="card kpi">
          <span class="kpi-label"><mat-icon>hourglass_top</mat-icon> Pending</span>
          <strong>{{ kpis().pending | number }}</strong>
          <a class="link" routerLink="/orders" [queryParams]="{ status: 'pending' }"
            >Review pending orders →</a
          >
        </div>
      </section>

      <section class="charts">
        <div class="card chart-card wide">
          <h2>Revenue, last 12 months</h2>
          <div class="chart-box">
            <app-chart [config]="revenueChart" label="Monthly revenue line chart" />
          </div>
        </div>
        <div class="card chart-card">
          <h2>Orders by status</h2>
          <div class="chart-box">
            <app-chart [config]="statusChart" label="Orders by status doughnut chart" />
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-head">
          <h2>Recent orders</h2>
          <a mat-button routerLink="/orders">View all</a>
        </div>
        <div class="table-wrap">
          <table class="simple">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th class="num">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (o of recent(); track o.id) {
                <tr>
                  <td>{{ o.id }}</td>
                  <td>{{ o.customerName }}</td>
                  <td>{{ o.createdAt | date: 'MMM d, y' }}</td>
                  <td>
                    <span class="status-chip" [class]="o.status">{{ o.status }}</span>
                  </td>
                  <td class="num">{{ o.total | currency: 'USD' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: `
    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .kpi {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .kpi-label {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
    }
    .kpi-label mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .kpi strong {
      font: var(--mat-sys-headline-medium);
    }
    .trend {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #2e9e5b;
      font: var(--mat-sys-body-small);
    }
    .trend.down {
      color: var(--mat-sys-error);
    }
    .trend mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .link {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-body-small);
      text-decoration: none;
    }
    .charts {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    /* Let grid items shrink below the canvas's last rendered width. */
    .charts > *,
    .kpis > * {
      min-width: 0;
    }
    @media (max-width: 1100px) {
      .charts {
        grid-template-columns: 1fr;
      }
    }
    h2 {
      font: var(--mat-sys-title-medium);
      margin: 0 0 12px;
    }
    .chart-box {
      height: 280px;
    }
    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    table.simple {
      width: 100%;
      border-collapse: collapse;
      font: var(--mat-sys-body-medium);
    }
    .simple th {
      text-align: left;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
      padding: 10px 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .simple td {
      padding: 12px 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      white-space: nowrap;
    }
    .simple tr:last-child td {
      border-bottom: 0;
    }
    .num {
      text-align: right !important;
    }
  `,
})
export class Dashboard {
  private readonly data = inject(DataService);
  private readonly auth = inject(AuthService);

  protected readonly kpis = this.data.kpis;
  protected readonly recent = computed(() => this.data.allOrders().slice(0, 6));
  protected readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');

  protected readonly revenueChart: ChartFactory = (c) => {
    const points = this.data.monthlyRevenue();
    return {
      type: 'line',
      data: {
        labels: points.map((p) => p.label),
        datasets: [
          {
            label: 'Revenue',
            data: points.map((p) => p.value),
            borderColor: c.primary,
            backgroundColor: withAlpha(c.primary, 0.15),
            fill: true,
            tension: 0.35,
            pointRadius: 3,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: c.text }, grid: { display: false } },
          y: {
            ticks: { color: c.text, callback: (v) => '$' + Number(v) / 1000 + 'k' },
            grid: { color: c.grid },
          },
        },
      },
    };
  };

  protected readonly statusChart: ChartFactory = (c) => {
    const counts = this.data.ordersByStatus();
    const keys = Object.keys(counts) as (keyof typeof counts)[];
    return {
      type: 'doughnut',
      data: {
        labels: keys.map((k) => k[0].toUpperCase() + k.slice(1)),
        datasets: [
          {
            data: keys.map((k) => counts[k]),
            backgroundColor: keys.map((k) => STATUS_COLORS[k]),
            borderColor: c.surface,
            borderWidth: 2,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { color: c.text, usePointStyle: true } } },
      },
    };
  };
}
