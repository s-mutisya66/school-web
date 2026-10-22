/** Compact amounts for big totals: KES 1.2M, KES 46K. */
export const money = (n: number) => `KES ${n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}K` : n}`;

/** Exact amounts, for payments and balances: KES 46,000. */
export const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
