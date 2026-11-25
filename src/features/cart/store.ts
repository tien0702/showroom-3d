import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { catalog, priceOf } from '@/features/catalog/api';

export interface CartLine {
  sku: string;
  variant: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  open: boolean;
  /** Bumped on every add so the header badge can animate. */
  pulse: number;
  add: (sku: string, variant: string, qty?: number) => void;
  addMany: (items: Array<{ sku: string; variant: string }>) => void;
  setQty: (sku: string, variant: string, qty: number) => void;
  remove: (sku: string, variant: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

const same = (l: CartLine, sku: string, variant: string) => l.sku === sku && l.variant === variant;

function merge(lines: CartLine[], sku: string, variant: string, qty: number): CartLine[] {
  return lines.some((l) => same(l, sku, variant))
    ? lines.map((l) => (same(l, sku, variant) ? { ...l, qty: l.qty + qty } : l))
    : [...lines, { sku, variant, qty }];
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      pulse: 0,
      add: (sku, variant, qty = 1) => set((s) => ({ lines: merge(s.lines, sku, variant, qty), pulse: s.pulse + 1 })),
      addMany: (items) =>
        set((s) => ({
          lines: items.reduce((acc, it) => merge(acc, it.sku, it.variant, 1), s.lines),
          pulse: s.pulse + 1,
        })),
      setQty: (sku, variant, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => !same(l, sku, variant)) : s.lines.map((l) => (same(l, sku, variant) ? { ...l, qty } : l)),
        })),
      remove: (sku, variant) => set((s) => ({ lines: s.lines.filter((l) => !same(l, sku, variant)) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    { name: 'hearth.cart.v1', partialize: (s) => ({ lines: s.lines }) },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((a, l) => a + l.qty, 0);

export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((a, l) => {
    const p = catalog.bySku(l.sku);
    return p ? a + priceOf(p, l.variant) * l.qty : a;
  }, 0);
