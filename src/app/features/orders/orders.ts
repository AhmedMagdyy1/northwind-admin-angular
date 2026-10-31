import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { ORDER_STATUSES, Order, OrderFilter, OrderStatus } from '../../core/models';

const EMPTY_FILTER: OrderFilter = { search: '', status: 'all', from: null, to: null };

@Component({
  selector: 'app-orders',
  imports: [
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Orders</h1>
          <p>{{ dataSource.filteredData.length }} orders match your filters.</p>
        </div>
        <button
          mat-stroked-button
          (click)="exportCsv()"
          [disabled]="!dataSource.filteredData.length"
        >
          <mat-icon>download</mat-icon> Export CSV
        </button>
      </header>

      <div class="card">
        <div class="filters">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
            <mat-label>Search order or customer</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input
              matInput
              [ngModel]="filter().search"
              (ngModelChange)="patch({ search: $event })"
            />
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Status</mat-label>
            <mat-select [ngModel]="filter().status" (ngModelChange)="patch({ status: $event })">
              <mat-option value="all">All statuses</mat-option>
              @for (s of statuses; track s) {
                <mat-option [value]="s">{{ s | titlecase }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Date range</mat-label>
            <mat-date-range-input [rangePicker]="picker">
              <input
                matStartDate
                placeholder="From"
                [ngModel]="filter().from"
                (ngModelChange)="patch({ from: $event })"
              />
              <input
                matEndDate
                placeholder="To"
                [ngModel]="filter().to"
                (ngModelChange)="patch({ to: $event })"
              />
            </mat-date-range-input>
            <mat-datepicker-toggle matIconSuffix [for]="picker" />
            <mat-date-range-picker #picker />
          </mat-form-field>

          <button mat-button (click)="reset()" [disabled]="isDefault()">Clear filters</button>
        </div>

        @if (loading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        <div class="table-wrap">
          <table
            mat-table
            [dataSource]="dataSource"
            matSort
            matSortActive="createdAt"
            matSortDirection="desc"
          >
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Order</th>
              <td mat-cell *matCellDef="let o">{{ o.id }}</td>
            </ng-container>
            <ng-container matColumnDef="customerName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Customer</th>
              <td mat-cell *matCellDef="let o">{{ o.customerName }}</td>
            </ng-container>
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
              <td mat-cell *matCellDef="let o">{{ o.createdAt | date: 'MMM d, y' }}</td>
            </ng-container>
            <ng-container matColumnDef="items">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Items</th>
              <td mat-cell *matCellDef="let o">{{ o.items }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
              <td mat-cell *matCellDef="let o">
                <span class="status-chip" [class]="o.status">{{ o.status }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="total">
              <th
                mat-header-cell
                *matHeaderCellDef
                mat-sort-header
                arrowPosition="before"
                class="num"
              >
                Total
              </th>
              <td mat-cell *matCellDef="let o" class="num">{{ o.total | currency: 'USD' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>
                <span class="cdk-visually-hidden">Actions</span>
              </th>
              <td mat-cell *matCellDef="let o">
                @if (auth.isAdmin()) {
                  <button
                    mat-icon-button
                    [matMenuTriggerFor]="statusMenu"
                    [matMenuTriggerData]="{ order: o }"
                    aria-label="Change status"
                  >
                    <mat-icon>more_vert</mat-icon>
                  </button>
                } @else {
                  <mat-icon class="locked" matTooltip="Only admins can change orders"
                    >lock</mat-icon
                  >
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="empty" [attr.colspan]="columns.length">No orders match these filters.</td>
            </tr>
          </table>
        </div>

        <mat-paginator
          [pageSizeOptions]="[10, 25, 50]"
          pageSize="10"
          showFirstLastButtons
          aria-label="Select page of orders"
        />
      </div>
    </div>

    <mat-menu #statusMenu="matMenu">
      <ng-template matMenuContent let-order="order">
        <span class="menu-title">Set status</span>
        @for (s of statuses; track s) {
          <button mat-menu-item [disabled]="order.status === s" (click)="setStatus(order, s)">
            {{ s | titlecase }}
          </button>
        }
      </ng-template>
    </mat-menu>
  `,
  styles: `
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;
    }
    .search {
      flex: 1 1 260px;
    }
    table {
      width: 100%;
      background: transparent;
    }
    .num {
      text-align: right;
    }
    td.mat-mdc-cell,
    th.mat-mdc-header-cell {
      white-space: nowrap;
    }
    .empty {
      padding: 32px;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }
    .locked {
      color: var(--mat-sys-outline);
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .menu-title {
      display: block;
      padding: 8px 16px;
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class Orders {
  private readonly data = inject(DataService);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly auth = inject(AuthService);

  /** Lets the dashboard link straight to e.g. /orders?status=pending. */
  readonly status = input<OrderStatus | undefined>();

  protected readonly statuses = ORDER_STATUSES;
  protected readonly columns = [
    'id',
    'customerName',
    'createdAt',
    'items',
    'status',
    'total',
    'actions',
  ];
  protected readonly dataSource = new MatTableDataSource<Order>([]);
  protected readonly filter = signal<OrderFilter>(EMPTY_FILTER);
  protected readonly loading = signal(true);

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

  constructor() {
    effect(() => {
      const status = this.status();
      if (status && ORDER_STATUSES.includes(status)) this.patch({ status });
    });

    effect(() => {
      this.dataSource.sort = this.sort();
      this.dataSource.paginator = this.paginator();
    });

    toObservable(this.filter)
      .pipe(
        debounceTime(200),
        tap(() => this.loading.set(true)),
        switchMap((f) => this.data.getOrders(f)),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((orders) => {
        this.dataSource.data = orders;
        this.paginator().firstPage();
        this.loading.set(false);
      });
  }

  protected patch(change: Partial<OrderFilter>): void {
    this.filter.update((f) => ({ ...f, ...change }));
  }

  protected reset(): void {
    this.filter.set(EMPTY_FILTER);
  }

  protected isDefault(): boolean {
    const f = this.filter();
    return !f.search && f.status === 'all' && !f.from && !f.to;
  }

  protected setStatus(order: Order, status: OrderStatus): void {
    this.data.updateOrderStatus(order.id, status).subscribe(() => {
      this.dataSource.data = this.dataSource.data.map((o) =>
        o.id === order.id ? { ...o, status } : o,
      );
      this.snackBar.open(`${order.id} marked as ${status}`, 'OK', { duration: 3000 });
    });
  }

  protected exportCsv(): void {
    const rows = this.dataSource.filteredData;
    const header = ['Order', 'Customer', 'Date', 'Items', 'Status', 'Total'];
    const lines = rows.map((o) =>
      [o.id, o.customerName, o.createdAt.slice(0, 10), o.items, o.status, o.total.toFixed(2)]
        .map(csvCell)
        .join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
