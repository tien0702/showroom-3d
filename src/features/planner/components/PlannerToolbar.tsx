import { Link } from 'react-router-dom';
import { brand } from '@/app/config';
import { CartButton } from '@/features/cart/CartButton';
import { IconButton, Icons, Segmented } from '@/shared/ui';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { usePlanner, type PlannerView } from '../store/plannerStore';
import s from './Planner.module.css';

export function PlannerToolbar({ title }: { title: string }) {
  const view = usePlanner((st) => st.view);
  const canUndo = usePlanner((st) => st.past.length > 0);
  const canRedo = usePlanner((st) => st.future.length > 0);
  const showDims = usePlanner((st) => st.showDimensions);
  const editing = usePlanner((st) => st.roomEditor);
  const { setView, undo, redo, toggleDimensions, reset, showToast, setRoomEditor } = usePlanner.getState();
  const narrow = useMediaQuery('(max-width: 900px)');

  const options: { value: PlannerView; label: string }[] = narrow
    ? [
        { value: '2d', label: '2D' },
        { value: '3d', label: '3D' },
      ]
    : [
        { value: '2d', label: '2D' },
        { value: 'split', label: 'Chia đôi' },
        { value: '3d', label: '3D' },
      ];

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Đã sao chép liên kết thiết kế');
    } catch {
      showToast('Không sao chép được, hãy dùng thanh địa chỉ');
    }
  };

  return (
    <header className={s.toolbar}>
      <div className={s.toolbarStart}>
        <IconButton label="Về danh sách showroom" icon={<Icons.IconArrowLeft />} onClick={() => history.back()} tooltipSide="bottom" />
        <Link to="/" className={s.brandMark} aria-label={brand.name}>
          <img src={brand.mark} alt="" />
        </Link>
        <h1 className={`${s.title} truncate`} title={title}>{title}</h1>
        <div className={s.toolGroup}>
          <IconButton label="Hoàn tác" shortcut="⌘Z" icon={<Icons.IconUndo size={18} />} onClick={undo} disabled={!canUndo} tooltipSide="bottom" />
          <IconButton label="Làm lại" shortcut="⇧⌘Z" icon={<Icons.IconRedo size={18} />} onClick={redo} disabled={!canRedo} tooltipSide="bottom" />
        </div>
      </div>
      <Segmented label="Chế độ xem" value={narrow && view === 'split' ? '3d' : view} options={options} onChange={setView} className={s.viewSwitch} />
      <div className={s.toolbarEnd}>
        <IconButton label="Chỉnh kích thước phòng, cửa" icon={<Icons.IconRoom size={18} />} active={editing} onClick={() => setRoomEditor(!editing)} tooltipSide="bottom" />
        <IconButton label={showDims ? 'Ẩn kích thước' : 'Hiện kích thước'} icon={<Icons.IconRuler size={18} />} active={showDims} onClick={toggleDimensions} tooltipSide="bottom" />
        <IconButton label="Khôi phục mẫu showroom" icon={<Icons.IconReset size={18} />} onClick={reset} tooltipSide="bottom" className={s.hideSm} />
        <IconButton label="Sao chép liên kết" icon={<Icons.IconShare size={18} />} onClick={share} tooltipSide="bottom" className={s.hideSm} />
        <CartButton />
      </div>
    </header>
  );
}
