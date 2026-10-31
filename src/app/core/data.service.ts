import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { generateMockData } from './mock-data';
import { Customer, Order, OrderFilter, OrderStatus } from './models';

const LATENCY_MS = 250;

/**
 * In-memory stand-in for a REST API. Components talk to it the same way
 * they would talk to an HttpClient-based service, so swapping in a real
 * backend only touches this file.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly orders = signal<Order[]>([]);
  private readonly customers = signal<Customer[]>([]);

  readonly allOrders = this.orders.asReadonly();
  readonly allCustomers = this.customers.asReadonly();

  readonly kpis = computed(() => {
    const orders = this.orders();
    const now = Date.now();
    const in30 = (o: Order) => now - Date.parse(o.createdAt) <= 30 * 86_400_000;
    const prev30 = (o: Order) => {
      const age = now - Date.parse(o.createdAt);
      return age > 30 * 86_400_000 && age <= 60 * 86_400_000;
    };
    const revenue = (list: Order[]) =>
      list.filter((o) => o.status !== 'refunded').reduce((sum, o) => sum + o.total, 0);

    const current = orders.filter(in30);
    const previous = orders.filter(prev30);
    const change = (a: number, b: number) => (b === 0 ? 0 : ((a - b) / b) * 100);

    const revenueNow = revenue(current);
    const revenuePrev = revenue(previous);
    return {
      revenue: revenueNow,
      revenueChange: change(revenueNow, revenuePrev),
      orders: current.length,
      ordersChange: change(current.length, previous.length),
      avgOrder: current.length ? revenueNow / current.length : 0,
      pending: orders.filter((o) => o.status === 'pending').length,
    };
  });

  constructor() {
    const { customers, orders } = generateMockData();
    this.customers.set(customers);
    this.orders.set(orders);
  }

  getOrders(filter: OrderFilter): Observable<Order[]> {
    return of(filterOrders(this.orders(), filter)).pipe(delay(LATENCY_MS));
  }

  getCustomers(): Observable<Customer[]> {
    return of(this.customers()).pipe(delay(LATENCY_MS));
  }

  updateOrderStatus(id: string, status: OrderStatus): Observable<Order | undefined> {
    this.orders.update((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
    return of(this.orders().find((o) => o.id === id)).pipe(delay(LATENCY_MS));
  }

  /** Revenue per month for the last 12 months, oldest first. */
  monthlyRevenue(): { label: string; value: number }[] {
    const now = new Date();
    const buckets = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleString('en-US', { month: 'short' }),
        value: 0,
      };
    });
    const index = new Map(buckets.map((b, i) => [b.key, i]));
    for (const o of this.orders()) {
      if (o.status === 'refunded') continue;
      const d = new Date(o.createdAt);
      const i = index.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (i !== undefined) buckets[i].value += o.total;
    }
    return buckets.map(({ label, value }) => ({ label, value: Math.round(value) }));
  }

  ordersByStatus(): Record<OrderStatus, number> {
    const counts: Record<OrderStatus, number> = { pending: 0, paid: 0, shipped: 0, refunded: 0 };
    for (const o of this.orders()) counts[o.status]++;
    return counts;
  }
}

export function filterOrders(orders: Order[], filter: OrderFilter): Order[] {
  const term = filter.search.trim().toLowerCase();
  const from = filter.from ? new Date(filter.from).setHours(0, 0, 0, 0) : null;
  const to = filter.to ? new Date(filter.to).setHours(23, 59, 59, 999) : null;
  return orders.filter((o) => {
    if (filter.status !== 'all' && o.status !== filter.status) return false;
    const t = Date.parse(o.createdAt);
    if (from !== null && t < from) return false;
    if (to !== null && t > to) return false;
    if (term && !o.id.toLowerCase().includes(term) && !o.customerName.toLowerCase().includes(term))
      return false;
    return true;
  });
}
