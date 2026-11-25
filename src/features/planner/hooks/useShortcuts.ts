import { useEffect } from 'react';
import { usePlanner } from '../store/plannerStore';

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/** Keyboard shortcuts for the planner. */
export function usePlannerShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const st = usePlanner.getState();
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        return e.shiftKey ? st.redo() : st.undo();
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        return st.redo();
      }
      const sel = st.selected;
      if (e.key === 'Escape') return st.select(null);
      if (!sel) return;
      if (e.key === 'r' || e.key === 'R') st.rotate(sel, e.shiftKey ? -90 : undefined);
      else if (e.key === 'Delete' || e.key === 'Backspace') st.remove(sel);
      else if (e.key === 'd' || e.key === 'D') st.duplicate(sel);
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const item = st.items.find((i) => i.uid === sel);
        if (!item) return;
        const step = e.shiftKey ? 0.25 : 0.05;
        const [dx, dz] = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key] ?? [0, 0];
        st.beginDrag(sel);
        st.dragTo(sel, [item.position[0] + dx, item.position[1] + dz], true);
        st.endDrag();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
