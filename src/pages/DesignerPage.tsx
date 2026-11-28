import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { showroomApi } from '@/features/showroom/api';
import { usePlanner } from '@/features/planner/store/plannerStore';
import { usePlannerShortcuts } from '@/features/planner/hooks/useShortcuts';
import { Plan2D } from '@/features/planner/components/Plan2D';
import { PlannerToolbar } from '@/features/planner/components/PlannerToolbar';
import { CatalogPanel } from '@/features/planner/components/CatalogPanel';
import { ItemInspector } from '@/features/planner/components/ItemInspector';
import { CameraBar } from '@/features/planner/components/CameraBar';
import { SummaryPill } from '@/features/planner/components/SummaryPill';
import { RoomEditor } from '@/features/planner/components/RoomEditor';
import { Button, Icons, ToastHost } from '@/shared/ui';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import type { FurnishLevel } from '@/types';
import s from '@/features/planner/components/Planner.module.css';

const Scene3D = lazy(() => import('@/features/planner/components/scene/Scene3D').then((m) => ({ default: m.Scene3D })));

const LEVELS: FurnishLevel[] = ['full', 'partial', 'empty'];

export default function DesignerPage() {
  const { showroomId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const showroom = showroomApi.get(showroomId);
  const loadedId = usePlanner((st) => st.showroomId);
  const view = usePlanner((st) => st.view);
  const toast = usePlanner((st) => st.toast);
  const dismissToast = usePlanner((st) => st.dismissToast);
  const editing = usePlanner((st) => st.roomEditor);
  const narrow = useMediaQuery('(max-width: 900px)');
  const [sheet, setSheet] = useState(false);
  const handled = useRef<string | null>(null);
  usePlannerShortcuts();
  useDocumentTitle(showroom ? `Thiết kế · ${showroom.name}` : 'Thiết kế');

  // Close the room editor when leaving the page.
  useEffect(() => () => usePlanner.getState().setRoomEditor(false), []);
  useEffect(() => {
    if (editing) setSheet(false);
  }, [editing]);

  useEffect(() => {
    if (!showroom) return;
    const key = `${showroom.id}?${params.toString()}`;
    if (handled.current === key || (handled.current?.startsWith(`${showroom.id}?`) && !params.toString())) return;
    handled.current = key;
    const level = params.get('level') as FurnishLevel | null;
    const add = params.get('add') ?? undefined;
    const variant = params.get('variant') ?? undefined;
    usePlanner.getState().load(showroom.id, { level: level && LEVELS.includes(level) ? level : undefined, addSku: add, variant });
    if (level || add) setParams({}, { replace: true });
    // Only re-run when the showroom changes; query params are consumed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showroom?.id]);

  if (!showroom) return <Navigate to="/" replace />;

  const effective = narrow && view === 'split' ? '3d' : view;
  const show2d = effective !== '3d';
  const show3d = effective !== '2d';

  return (
    <div className={s.shell} data-editing={editing || undefined}>
      <PlannerToolbar title={showroom.name} />
      <div className={s.body}>
        <aside className={s.side} aria-label="Danh mục sản phẩm">
          {editing ? <RoomEditor /> : <CatalogPanel />}
        </aside>
        <main className={s.stage}>
          <section className={`${s.pane} ${s.pane2d}`} style={{ flexGrow: show2d ? 1 : 0.0001, marginRight: show2d ? 0 : -12 }} data-hidden={!show2d} aria-hidden={!show2d}>
            <span className={s.paneTag}>2D</span>
            {loadedId === showroom.id && <Plan2D />}
          </section>
          <section className={`${s.pane} ${s.pane3d}`} style={{ flexGrow: show3d ? 1 : 0.0001, marginLeft: show3d ? 0 : -12 }} data-hidden={!show3d} aria-hidden={!show3d}>
            <span className={s.paneTag}>3D</span>
            <Suspense fallback={<div className={s.loading}>Đang dựng phòng 3D…</div>}>
              {loadedId === showroom.id && <Scene3D />}
            </Suspense>
            <CameraBar />
          </section>
          <ItemInspector />
          <Button variant="primary" icon={<Icons.IconPlus size={18} />} className={s.fab} onClick={() => setSheet(true)}>
            Thêm đồ
          </Button>
          <SummaryPill showroomId={showroom.id} />
        </main>
      </div>

      <AnimatePresence>
        {narrow && editing && (
          <motion.div
            key="room-sheet"
            className={`${s.sheet} ${s.sheetRoom}`}
            role="dialog"
            aria-label="Chỉnh phòng"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
          >
            <span className={s.sheetHandle} />
            <RoomEditor />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {narrow && sheet && (
          <>
            <motion.div className={s.sheetScrim} onClick={() => setSheet(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div
              className={s.sheet}
              role="dialog"
              aria-label="Thêm đồ vào phòng"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 40 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => info.offset.y > 120 && setSheet(false)}
            >
              <span className={s.sheetHandle} />
              <CatalogPanel onAdded={() => setSheet(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <ToastHost toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
