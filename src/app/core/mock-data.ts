import { Customer, Order, OrderStatus, Plan } from './models';

/** Small seeded PRNG so the demo data is the same on every load. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  'Ava',
  'Liam',
  'Noah',
  'Mia',
  'Omar',
  'Sara',
  'Lucas',
  'Emma',
  'Yusuf',
  'Chloe',
  'Ethan',
  'Layla',
  'Mason',
  'Zara',
  'Leo',
  'Nora',
];
const LAST = [
  'Johnson',
  'Smith',
  'Garcia',
  'Hassan',
  'Brown',
  'Nguyen',
  'Miller',
  'Ali',
  'Davis',
  'Lopez',
  'Wilson',
  'Khan',
  'Moore',
  'Clark',
];
const COMPANY = [
  'Brightline',
  'Cobalt Labs',
  'Harbor & Co',
  'Lumen Health',
  'Northstar',
  'Pinecrest',
  'Quantum Retail',
  'Redwood Logistics',
  'Silverleaf',
  'Tidewater',
  'Vertex Media',
  'Willow Foods',
];
const COUNTRY = [
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'UAE',
  'Australia',
  'Netherlands',
  'Saudi Arabia',
];
const PLANS: Plan[] = ['Starter', 'Growth', 'Enterprise'];
const PLAN_PRICE: Record<Plan, [number, number]> = {
  Starter: [29, 149],
  Growth: [150, 900],
  Enterprise: [900, 2400],
};

const DAY = 24 * 60 * 60 * 1000;

export function generateMockData(
  now = new Date(),
  seed = 42,
): { customers: Customer[]; orders: Order[] } {
  const rand = mulberry32(seed);
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)];

  const customers: Customer[] = Array.from({ length: 64 }, (_, i) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    const company = pick(COMPANY);
    return {
      id: `C-${1001 + i}`,
      name: `${first} ${last}`,
      company,
      email:
        `${first}.${last}@${company.toLowerCase().replace(/[^a-z]/g, '')}.example`.toLowerCase(),
      country: pick(COUNTRY),
      plan: rand() < 0.5 ? 'Starter' : rand() < 0.75 ? 'Growth' : 'Enterprise',
      joinedAt: new Date(now.getTime() - Math.floor(rand() * 540) * DAY).toISOString(),
    };
  });

  const orders: Order[] = Array.from({ length: 900 }, (_, i) => {
    const customer = pick(customers);
    // Skew toward recent days so the revenue trend grows over the year.
    const daysAgo = Math.floor(Math.pow(rand(), 1.25) * 365);
    const [min, max] = PLAN_PRICE[customer.plan];
    const roll = rand();
    const status: OrderStatus =
      daysAgo < 3 && roll < 0.6
        ? 'pending'
        : roll < 0.06
          ? 'refunded'
          : daysAgo < 10
            ? 'paid'
            : 'shipped';
    return {
      id: `ORD-${(20500 + i).toString()}`,
      customerId: customer.id,
      customerName: customer.name,
      createdAt: new Date(now.getTime() - daysAgo * DAY - Math.floor(rand() * DAY)).toISOString(),
      total: Math.round((min + rand() * (max - min)) * 100) / 100,
      status,
      items: 1 + Math.floor(rand() * 6),
    };
  });

  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { customers, orders };
}

export { PLANS };
