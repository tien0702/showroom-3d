import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FurnishLevel, PlacedItem, Room, Vec2 } from '@/types';
import { catalog } from '@/features/catalog/api';
import { furnish, showroomApi } from '@/features/showroom/api';
import { uid as makeUid } from '@/shared/lib/id';
import { createContext, findFreeSpot, resolvePlacement, type PlacementIssue } from '../lib/placement';

export type PlannerView = '2d' | 'split' | '3d';
export type CameraMode = 'orbit' | 'top' | 'eye';

export interface Toast {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

interface SavedDesign {
  items: PlacedItem[];
  updatedAt: number;
}

interface PlannerState {
  showroomId: string | null;
  room: Room | null;
  items: PlacedItem[];
  selected: string | null;
  hovered: string | null;
  dragging: string | null;
  issues: Record<string, PlacementIssue | null>;
  /** Items playing their exit animation. */
  removing: string[];
  view: PlannerView;
  camera: CameraMode;
  showDimensions: boolean;
  past: PlacedItem[][];
  future: PlacedItem[][];
  toast: Toast | null;
  saved: Record<string, SavedDesign>;

  load: (showroomId: string, opts?: { level?: FurnishLevel; addSku?: string; variant?: string }) => boolean;
  select: (uid: string | null) => void;
  hover: (uid: string | null) => void;
  setView: (view: PlannerView) => void;
  setCamera: (mode: CameraMode) => void;
  toggleDimensions: () => void;
  addProduct: (sku: string, variant?: string) => void;
  beginDrag: (uid: string) => void;
  dragTo: (uid: string, position: Vec2, free?: boolean) => void;
  endDrag: () => void;
  rotate: (uid: string, delta?: number) => void;
  setVariant: (uid: string, variant: string) => void;
  remove: (uid: string) => void;
  duplicate: (uid: string) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  showToast: (message: string, action?: Toast['action']) => void;
  dismissToast: () => void;
}

const HISTORY_LIMIT = 50;
const EXIT_MS = 380;

let dragOrigin: PlacedItem | null = null;
let toastSeq = 0;

export const usePlanner = create<PlannerState>()(
  persist(
    (set, get) => {
      const ctx = (items = get().items) => createContext(get().room!, items, catalog.map());

      /** Record the current items in history, then apply `next`. */
      const commit = (next: PlacedItem[]) => {
        const { items, past, showroomId, saved } = get();
        set({
          items: next,
          past: [...past, items].slice(-HISTORY_LIMIT),
          future: [],
          saved: showroomId ? { ...saved, [showroomId]: { items: next, updatedAt: Date.now() } } : saved,
        });
      };

      const persistCurrent = () => {
        const { showroomId, items, saved } = get();
        if (showroomId) set({ saved: { ...saved, [showroomId]: { items, updatedAt: Date.now() } } });
      };

      return {
        showroomId: null,
        room: null,
        items: [],
        selected: null,
        hovered: null,
        dragging: null,
        issues: {},
        removing: [],
        view: 'split',
        camera: 'orbit',
        showDimensions: true,
        past: [],
        future: [],
        toast: null,
        saved: {},

        load: (showroomId, opts = {}) => {
          const showroom = showroomApi.get(showroomId);
          if (!showroom) return false;
          const saved = get().saved[showroomId];
          const items = opts.level || !saved ? furnish(showroom, opts.level ?? 'full') : saved.items;
          set({
            showroomId,
            room: showroom.room,
            items,
            selected: null,
            hovered: null,
            dragging: null,
            issues: {},
            removing: [],
            past: [],
            future: [],
          });
          persistCurrent();
          if (opts.addSku) get().addProduct(opts.addSku, opts.variant);
          return true;
        },

        select: (uid) => set({ selected: uid }),
        hover: (uid) => set({ hovered: uid }),
        setView: (view) => set({ view }),
        setCamera: (camera) => set({ camera }),
        toggleDimensions: () => set((s) => ({ showDimensions: !s.showDimensions })),

        addProduct: (sku, variant) => {
          const product = catalog.bySku(sku);
          if (!product || !get().room) return;
          const c = ctx();
          let hint: Vec2 | undefined;
          if (product.rules.placement === 'onTop') {
            const surface = get().items.find((it) => {
              const p = catalog.bySku(it.sku);
              return p?.rules.surfaceHeight != null && !get().items.some((o) => o.position[0] === it.position[0] && o.position[1] === it.position[1] && o.uid !== it.uid);
            });
            hint = surface?.position;
          }
          const spot = findFreeSpot(c, product, hint);
          const item: PlacedItem = {
            uid: makeUid(),
            sku,
            variant: variant ?? product.variants[0].id,
            position: spot.position,
            elevation: spot.elevation,
            rotationY: spot.rotationY,
          };
          commit([...get().items, item]);
          set({ selected: item.uid, issues: { ...get().issues, [item.uid]: spot.issue } });
          if (!spot.valid) get().showToast('Phòng hơi chật, hãy kéo món này tới chỗ trống');
        },

        beginDrag: (uid) => {
          dragOrigin = get().items.find((i) => i.uid === uid) ?? null;
          set({ dragging: uid, selected: uid });
        },

        dragTo: (uid, position, free) => {
          const item = get().items.find((i) => i.uid === uid);
          const product = item && catalog.bySku(item.sku);
          if (!item || !product) return;
          const r = resolvePlacement(ctx(), { uid, product, position, rotationY: item.rotationY, free });
          set({
            items: get().items.map((i) =>
              i.uid === uid ? { ...i, position: r.position, rotationY: r.rotationY, elevation: r.elevation } : i,
            ),
            issues: { ...get().issues, [uid]: r.issue },
          });
        },

        endDrag: () => {
          const { dragging, items, issues } = get();
          if (!dragging || !dragOrigin) return set({ dragging: null });
          const origin = dragOrigin;
          dragOrigin = null;
          const moved = items.find((i) => i.uid === dragging);
          if (issues[dragging] === 'collision' || issues[dragging] === 'outside' || issues[dragging] === 'door') {
            // Snap back to the last valid spot.
            set({ items: items.map((i) => (i.uid === dragging ? origin : i)), issues: { ...issues, [dragging]: null }, dragging: null });
            get().showToast(issues[dragging] === 'door' ? 'Không chặn lối mở cửa' : 'Chỗ này bị vướng, đã trả về vị trí cũ');
            return;
          }
          if (moved && (moved.position[0] !== origin.position[0] || moved.position[1] !== origin.position[1] || moved.rotationY !== origin.rotationY)) {
            const before = items.map((i) => (i.uid === dragging ? origin : i));
            set({ items: before });
            commit(items);
          }
          set({ dragging: null });
        },

        rotate: (uid, delta) => {
          const item = get().items.find((i) => i.uid === uid);
          const product = item && catalog.bySku(item.sku);
          if (!item || !product || product.rules.placement === 'wall') return;
          const step = delta ?? Math.max(product.rules.rotationStep, 45);
          const r = resolvePlacement(ctx(), {
            uid,
            product,
            position: item.position,
            rotationY: item.rotationY + step,
            keepRotation: true,
            free: true,
          });
          commit(get().items.map((i) => (i.uid === uid ? { ...i, position: r.position, rotationY: item.rotationY + step, elevation: r.elevation } : i)));
          set({ issues: { ...get().issues, [uid]: r.issue } });
        },

        setVariant: (uid, variant) => commit(get().items.map((i) => (i.uid === uid ? { ...i, variant } : i))),

        remove: (uid) => {
          if (get().removing.includes(uid)) return;
          set({ removing: [...get().removing, uid], selected: get().selected === uid ? null : get().selected });
          window.setTimeout(() => {
            commit(get().items.filter((i) => i.uid !== uid));
            set({ removing: get().removing.filter((r) => r !== uid) });
            get().showToast('Đã xóa khỏi phòng', { label: 'Hoàn tác', run: () => get().undo() });
          }, EXIT_MS);
        },

        duplicate: (uid) => {
          const item = get().items.find((i) => i.uid === uid);
          const product = item && catalog.bySku(item.sku);
          if (!item || !product) return;
          const spot = findFreeSpot(ctx(), product, [item.position[0] + 0.4, item.position[1] + 0.4]);
          const copy: PlacedItem = { ...item, uid: makeUid(), position: spot.position, rotationY: spot.rotationY, elevation: spot.elevation };
          commit([...get().items, copy]);
          set({ selected: copy.uid });
        },

        undo: () => {
          const { past, items, future } = get();
          if (!past.length) return;
          set({ items: past[past.length - 1], past: past.slice(0, -1), future: [items, ...future], issues: {}, toast: null });
          persistCurrent();
        },

        redo: () => {
          const { past, items, future } = get();
          if (!future.length) return;
          set({ items: future[0], future: future.slice(1), past: [...past, items], issues: {} });
          persistCurrent();
        },

        reset: () => {
          const { showroomId } = get();
          const showroom = showroomId && showroomApi.get(showroomId);
          if (!showroom) return;
          commit(furnish(showroom, 'full'));
          set({ selected: null, issues: {} });
        },

        showToast: (message, action) => set({ toast: { id: ++toastSeq, message, action } }),
        dismissToast: () => set({ toast: null }),
      };
    },
    {
      name: 'hearth.designs.v1',
      partialize: (s) => ({ saved: s.saved, view: s.view, showDimensions: s.showDimensions }),
    },
  ),
);

/** Look up the product and variant for a placed item. */
export function useSelectedItem() {
  return usePlanner((s) => s.items.find((i) => i.uid === s.selected) ?? null);
}
