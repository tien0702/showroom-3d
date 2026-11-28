import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Opening, OpeningType } from '@/types';
import { Button, IconButton, Icons } from '@/shared/ui';
import { formatArea } from '@/shared/lib/format';
import { usePlanner } from '../store/plannerStore';
import { outlineOf, polygonArea, wallSegments } from '../lib/geometry';
import { ROOM_LIMITS, roomSize, wallLabels } from '../lib/roomEdit';
import s from './Planner.module.css';

const TYPE_LABEL: Record<OpeningType, string> = { door: 'Cửa chính', window: 'Cửa sổ' };

interface NumFieldProps {
  label: string;
  /** Metres. Shown and typed in centimetres. */
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (m: number) => void;
}

/** Centimetre stepper with big tap targets; typing commits on blur / Enter. */
function NumField({ label, value, min, max, step = 0.1, onChange }: NumFieldProps) {
  const cm = Math.round(value * 100);
  const [text, setText] = useState(String(cm));
  useEffect(() => setText(String(cm)), [cm]);

  const commit = (raw: string) => {
    const n = parseFloat(raw.replace(',', '.'));
    if (!Number.isFinite(n)) return setText(String(cm));
    const m = Math.min(max, Math.max(min, n / 100));
    if (Math.round(m * 100) !== cm) onChange(m);
    else setText(String(cm));
  };
  const bump = (dir: 1 | -1) => onChange(Math.min(max, Math.max(min, Math.round((value + dir * step) * 100) / 100)));

  return (
    <div className={s.num}>
      <span className={s.numLabel}>{label}</span>
      <div className={s.numCtrl}>
        <button type="button" className={s.numBtn} onClick={() => bump(-1)} disabled={value <= min + 1e-6} aria-label={`Giảm ${label}`}>
          <Icons.IconMinus size={16} />
        </button>
        <label className={s.numInput}>
          <input
            inputMode="numeric"
            enterKeyHint="done"
            value={text}
            aria-label={`${label} (cm)`}
            onChange={(e) => setText(e.target.value.replace(/[^\d.,]/g, ''))}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
            onFocus={(e) => e.currentTarget.select()}
          />
          <span>cm</span>
        </label>
        <button type="button" className={s.numBtn} onClick={() => bump(1)} disabled={value >= max - 1e-6} aria-label={`Tăng ${label}`}>
          <Icons.IconPlus size={16} />
        </button>
      </div>
    </div>
  );
}

function OpeningCard({ wallId, wallLen, o, roomHeight }: { wallId: string; wallLen: number; o: Opening; roomHeight: number }) {
  const { updateOpening, removeOpening } = usePlanner.getState();
  const set = (patch: Partial<Opening>) => updateOpening(wallId, o.id, patch);
  const m = ROOM_LIMITS.margin;
  return (
    <motion.li
      layout
      className={s.opening}
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
    >
      <div className={s.openingHead}>
        <span className={s.openingType} data-type={o.type}>
          {o.type === 'door' ? <Icons.IconDoor size={16} /> : <Icons.IconWindow size={16} />}
          {TYPE_LABEL[o.type]}
        </span>
        <IconButton label={`Xóa ${TYPE_LABEL[o.type].toLowerCase()}`} size="sm" icon={<Icons.IconTrash size={16} />} onClick={() => removeOpening(wallId, o.id)} tooltipSide="left" />
      </div>
      <div className={s.numGrid}>
        <NumField label="Rộng" value={o.width} min={ROOM_LIMITS.minOpening} max={wallLen - 2 * m} onChange={(width) => set({ width })} />
        <NumField label="Cao" value={o.height} min={ROOM_LIMITS.minOpening} max={roomHeight - o.sill - m} onChange={(height) => set({ height })} />
        <NumField label="Cách góc tường" value={o.offset} min={m} max={wallLen - o.width - m} onChange={(offset) => set({ offset })} />
        {o.type === 'window' && <NumField label="Cách sàn" value={o.sill} min={0} max={roomHeight - o.height - m} step={0.05} onChange={(sill) => set({ sill })} />}
      </div>
    </motion.li>
  );
}

/** Edit the room's size and its doors / windows. Changes show live in 2D and 3D. */
export function RoomEditor({ onClose }: { onClose?: () => void }) {
  const room = usePlanner((st) => st.room);
  const showroomId = usePlanner((st) => st.showroomId);
  const custom = usePlanner((st) => !!(st.showroomId && st.saved[st.showroomId]?.room));
  const focusWall = usePlanner((st) => st.focusWall);
  const { resizeRoom, addOpening, resetRoom, setFocusWall, setRoomEditor } = usePlanner.getState();
  const segs = useMemo(() => (room ? wallSegments(room) : []), [room]);
  const labels = useMemo(() => (room ? wallLabels(room) : {}), [room]);

  if (!room || !showroomId) return null;
  const size = roomSize(room);
  const area = polygonArea(outlineOf(room));
  const close = () => {
    setRoomEditor(false);
    onClose?.();
  };

  return (
    <div className={s.roomEditor}>
      <div className={s.roomEditorHead}>
        <div>
          <h2>Chỉnh phòng</h2>
          <span className={s.muted}>
            {formatArea(area)} · thay đổi hiện ngay trên mô hình
          </span>
        </div>
        <IconButton label="Xong" icon={<Icons.IconCheck size={20} />} variant="secondary" onClick={close} tooltipSide="left" />
      </div>

      <div className={s.roomEditorBody}>
        <section className={s.editSection}>
          <h3>Kích thước phòng</h3>
          <div className={s.numGrid}>
            <NumField label="Chiều ngang" value={size.width} min={ROOM_LIMITS.minSide} max={ROOM_LIMITS.maxSide} onChange={(width) => resizeRoom({ width })} />
            <NumField label="Chiều sâu" value={size.depth} min={ROOM_LIMITS.minSide} max={ROOM_LIMITS.maxSide} onChange={(depth) => resizeRoom({ depth })} />
            <NumField label="Trần cao" value={size.height} min={ROOM_LIMITS.minHeight} max={ROOM_LIMITS.maxHeight} step={0.05} onChange={(height) => resizeRoom({ height })} />
          </div>
        </section>

        <section className={s.editSection}>
          <h3>Cửa chính & cửa sổ</h3>
          <p className={s.muted}>Chạm vào một bức tường để xem vị trí trên bản vẽ.</p>
          <ul className={s.wallList}>
            {segs.map((seg) => (
              <li
                key={seg.wall.id}
                className={s.wallItem}
                data-focus={focusWall === seg.wall.id || undefined}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setFocusWall(seg.wall.id)}
                onClick={() => setFocusWall(seg.wall.id)}
              >
                <div className={s.wallHead}>
                  <span className={s.wallName}>
                    {labels[seg.wall.id]} <em>{Math.round(seg.length * 100)} cm</em>
                  </span>
                  <div className={s.wallAdd}>
                    <button type="button" className={s.addChip} onClick={() => addOpening(seg.wall.id, 'window')} aria-label={`Thêm cửa sổ vào ${labels[seg.wall.id]}`}>
                      <Icons.IconPlus size={14} /> Cửa sổ
                    </button>
                    <button type="button" className={s.addChip} onClick={() => addOpening(seg.wall.id, 'door')} aria-label={`Thêm cửa chính vào ${labels[seg.wall.id]}`}>
                      <Icons.IconPlus size={14} /> Cửa
                    </button>
                  </div>
                </div>
                <ul className={s.openingList}>
                  <AnimatePresence initial={false}>
                    {seg.wall.openings.map((o) => (
                      <OpeningCard key={o.id} wallId={seg.wall.id} wallLen={seg.length} o={o} roomHeight={room.height} />
                    ))}
                  </AnimatePresence>
                </ul>
              </li>
            ))}
          </ul>
        </section>

        {custom && (
          <Button variant="ghost" block icon={<Icons.IconReset size={18} />} onClick={resetRoom}>
            Khôi phục phòng gốc
          </Button>
        )}
      </div>
    </div>
  );
}
