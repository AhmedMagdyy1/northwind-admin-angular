import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DataService } from '../../core/data.service';
import { Customer, Plan } from '../../core/models';

@Component({
  selector: 'app-customers',
  imports: [
    DatePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonToggleModule,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Customers</h1>
          <p>{{ total() }} accounts · {{ enterpriseCount() }} on Enterprise</p>
        </div>
      </header>

      <div class="card">
        <div class="filters">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
            <mat-label>Search name, company or email</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput (input)="search.set($any($event.target).value)" />
          </mat-form-field>
          <mat-button-toggle-group
            [value]="plan()"
            (change)="plan.set($event.value)"
            aria-label="Filter by plan"
            hideSingleSelectionIndicator
          >
            <mat-button-toggle value="all">All</mat-button-toggle>
            @for (p of plans; track p) {
              <mat-button-toggle [value]="p">{{ p }}</mat-button-toggle>
            }
          </mat-button-toggle-group>
        </div>

        <div class="table-wrap">
          <table
            mat-table
            [dataSource]="dataSource"
            matSort
            matSortActive="joinedAt"
            matSortDirection="desc"
          >
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
              <td mat-cell *matCellDef="let c">
                <div class="who">
                  <span class="avatar">{{ c.name[0] }}</span>
                  <div>
                    <strong>{{ c.name }}</strong
                    ><br /><span class="muted">{{ c.email }}</span>
                  </div>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="company">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Company</th>
              <td mat-cell *matCellDef="let c">{{ c.company }}</td>
            </ng-container>
            <ng-container matColumnDef="country">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Country</th>
              <td mat-cell *matCellDef="let c">{{ c.country }}</td>
            </ng-container>
            <ng-container matColumnDef="plan">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Plan</th>
              <td mat-cell *matCellDef="let c">
                <span class="plan" [class]="c.plan">{{ c.plan }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="joinedAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Joined</th>
              <td mat-cell *matCellDef="let c">{{ c.joinedAt | date: 'MMM y' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="empty" [attr.colspan]="columns.length">No customers found.</td>
            </tr>
          </table>
        </div>
        <mat-paginator
          [pageSizeOptions]="[10, 25]"
          pageSize="10"
          aria-label="Select page of customers"
        />
      </div>
    </div>
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
    td.mat-mdc-cell {
      white-space: nowrap;
    }
    .who {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 0;
    }
    .avatar {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      font-weight: 600;
    }
    .plan {
      padding: 2px 10px;
      border-radius: 999px;
      font: var(--mat-sys-label-medium);
      background: var(--mat-sys-surface-container-high);
    }
    .plan.Enterprise {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .plan.Growth {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    .empty {
      padding: 32px;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class Customers {
  private readonly data = inject(DataService);

  protected readonly plans: Plan[] = ['Starter', 'Growth', 'Enterprise'];
  protected readonly columns = ['name', 'company', 'country', 'plan', 'joinedAt'];
  protected readonly dataSource = new MatTableDataSource<Customer>([]);
  protected readonly search = signal('');
  protected readonly plan = signal<Plan | 'all'>('all');

  private readonly customers = toSignal(this.data.getCustomers(), { initialValue: [] });
  protected readonly total = computed(() => this.customers().length);
  protected readonly enterpriseCount = computed(
    () => this.customers().filter((c) => c.plan === 'Enterprise').length,
  );

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

  constructor() {
    this.dataSource.filterPredicate = (c, raw) => {
      const { term, plan } = JSON.parse(raw) as { term: string; plan: string };
      const matchesPlan = plan === 'all' || c.plan === plan;
      const haystack = `${c.name} ${c.company} ${c.email}`.toLowerCase();
      return matchesPlan && haystack.includes(term);
    };

    effect(() => {
      this.dataSource.data = this.customers();
    });

    effect(() => {
      this.dataSource.filter = JSON.stringify({
        term: this.search().trim().toLowerCase(),
        plan: this.plan(),
      });
      this.dataSource.paginator?.firstPage();
    });

    effect(() => {
      this.dataSource.sort = this.sort();
      this.dataSource.paginator = this.paginator();
    });
  }
}
