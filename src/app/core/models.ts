export type Role = 'admin' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'refunded';

export const ORDER_STATUSES: readonly OrderStatus[] = ['pending', 'paid', 'shipped', 'refunded'];

export type Plan = 'Starter' | 'Growth' | 'Enterprise';

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  country: string;
  plan: Plan;
  joinedAt: string; // ISO date
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  createdAt: string; // ISO date
  total: number;
  status: OrderStatus;
  items: number;
}

export interface OrderFilter {
  search: string;
  status: OrderStatus | 'all';
  from: Date | null;
  to: Date | null;
}
