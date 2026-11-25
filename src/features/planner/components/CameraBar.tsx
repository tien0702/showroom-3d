import { IconButton, Icons } from '@/shared/ui';
import { usePlanner, type CameraMode } from '../store/plannerStore';
import s from './Planner.module.css';

const MODES: { id: CameraMode; label: string; icon: React.ReactNode }[] = [
  { id: 'orbit', label: 'Góc nhìn tổng thể', icon: <Icons.IconOrbit size={18} /> },
  { id: 'top', label: 'Nhìn từ trên xuống', icon: <Icons.IconTopView size={18} /> },
  { id: 'eye', label: 'Tầm mắt người', icon: <Icons.IconEye size={18} /> },
];

export function CameraBar() {
  const camera = usePlanner((st) => st.camera);
  const setCamera = usePlanner((st) => st.setCamera);
  return (
    <div className={s.cameraBar} role="toolbar" aria-label="Góc camera">
      {MODES.map((m) => (
        <IconButton key={m.id} label={m.label} icon={m.icon} active={camera === m.id} onClick={() => setCamera(m.id)} size="sm" />
      ))}
    </div>
  );
}
