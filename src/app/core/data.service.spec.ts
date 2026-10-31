import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DataService, filterOrders } from './data.service';
import { generateMockData } from './mock-data';
import { Order } from './models';

const order = (over: Partial<Order>): Order => ({
  id: 'ORD-1',
  customerId: 'C-1',
  customerName: 'Ava Smith',
  createdAt: '2026-10-15T10:00:00.000Z',
  total: 100,
  status: 'paid',
  items: 1,
  ...over,
});

describe('filterOrders', () => {
  const orders = [
    order({
      id: 'ORD-1',
      customerName: 'Ava Smith',
      status: 'paid',
      createdAt: '2026-10-01T12:00:00.000Z',
    }),
    order({
      id: 'ORD-2',
      customerName: 'Omar Ali',
      status: 'pending',
      createdAt: '2026-10-10T12:00:00.000Z',
    }),
    order({
      id: 'ORD-3',
      customerName: 'Mia Lopez',
      status: 'refunded',
      createdAt: '2026-10-20T12:00:00.000Z',
    }),
  ];
  const none = { search: '', status: 'all' as const, from: null, to: null };

  it('returns everything with an empty filter', () => {
    expect(filterOrders(orders, none)).toHaveLength(3);
  });

  it('filters by status', () => {
    expect(filterOrders(orders, { ...none, status: 'pending' }).map((o) => o.id)).toEqual([
      'ORD-2',
    ]);
  });

  it('searches order id and customer name, case-insensitive', () => {
    expect(filterOrders(orders, { ...none, search: 'omar' }).map((o) => o.id)).toEqual(['ORD-2']);
    expect(filterOrders(orders, { ...none, search: 'ord-3' }).map((o) => o.id)).toEqual(['ORD-3']);
  });

  it('filters by an inclusive date range', () => {
    // Local dates, like the datepicker produces.
    const result = filterOrders(orders, {
      ...none,
      from: new Date(2026, 9, 5),
      to: new Date(2026, 9, 20),
    });
    expect(result.map((o) => o.id)).toEqual(['ORD-2', 'ORD-3']);
  });

  it('combines filters', () => {
    expect(filterOrders(orders, { ...none, status: 'paid', search: 'omar' })).toHaveLength(0);
  });
});

describe('generateMockData', () => {
  it('is deterministic for the same seed and date', () => {
    const now = new Date('2026-10-30T00:00:00Z');
    expect(generateMockData(now, 7)).toEqual(generateMockData(now, 7));
  });

  it('only references existing customers and sorts orders newest first', () => {
    const { customers, orders } = generateMockData(new Date('2026-10-30T00:00:00Z'));
    const ids = new Set(customers.map((c) => c.id));
    expect(orders.every((o) => ids.has(o.customerId))).toBe(true);
    for (let i = 1; i < orders.length; i++) {
      expect(orders[i - 1].createdAt >= orders[i].createdAt).toBe(true);
    }
  });
});

describe('DataService', () => {
  let service: DataService;

  beforeEach(() => {
    service = TestBed.inject(DataService);
  });

  it('updates an order status', async () => {
    const target = service.allOrders()[0];
    const next = target.status === 'refunded' ? 'paid' : 'refunded';
    const updated = await firstValueFrom(service.updateOrderStatus(target.id, next));
    expect(updated?.status).toBe(next);
    expect(service.allOrders()[0].status).toBe(next);
  });

  it('returns 12 months of revenue, oldest first', () => {
    const months = service.monthlyRevenue();
    expect(months).toHaveLength(12);
    expect(months.at(-1)?.label).toBe(new Date().toLocaleString('en-US', { month: 'short' }));
  });

  it('counts orders by status', () => {
    const counts = service.ordersByStatus();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(service.allOrders().length);
  });
});
