import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 20): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
});

const make = (paths: React.ReactNode) =>
  function Icon({ size, ...p }: IconProps) {
    return (
      <svg {...base(size)} {...p}>
        {paths}
      </svg>
    );
  };

export const IconBag = make(<><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" /><path d="M9 8V7a3 3 0 0 1 6 0v1" /></>);
export const IconSearch = make(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const IconClose = make(<path d="M6 6l12 12M18 6 6 18" />);
export const IconUndo = make(<><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>);
export const IconRedo = make(<><path d="m15 14 5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h3" /></>);
export const IconRotate = make(<><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 4v5h-5" /></>);
export const IconTrash = make(<><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" /><path d="M9 7V4h6v3" /></>);
export const IconCopy = make(<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>);
export const IconCube = make(<><path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9z" /><path d="m3.5 7.5 8.5 4.5 8.5-4.5M12 12v9" /></>);
export const IconPhone = make(<><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></>);
export const IconPlus = make(<path d="M12 5v14M5 12h14" />);
export const IconMinus = make(<path d="M5 12h14" />);
export const IconArrowLeft = make(<path d="M19 12H5m6-6-6 6 6 6" />);
export const IconArrowRight = make(<path d="M5 12h14m-6-6 6 6-6 6" />);
export const IconRuler = make(<><path d="M3 15 15 3l6 6L9 21z" /><path d="m7 11 2 2M10 8l2 2M13 5l2 2" /></>);
export const IconCamera = make(<><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>);
export const IconOrbit = make(<><circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="12" rx="9.5" ry="4.5" /></>);
export const IconTopView = make(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M10 10v10" /></>);
export const IconEye = make(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>);
export const IconShare = make(<><path d="M12 15V3m0 0-4 4m4-4 4 4" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></>);
export const IconReset = make(<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>);
export const IconCheck = make(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const IconTruck = make(<><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>);
export const IconShield = make(<><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" /><path d="m9 12 2 2 4-4" /></>);
export const IconReturn = make(<><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10H8" /></>);
export const IconGrid = make(<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>);
export const IconPanel = make(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>);
export const IconInfo = make(<><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>);
export const IconChevronDown = make(<path d="m6 9 6 6 6-6" />);
export const IconFullscreen = make(<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />);
export const IconMenu = make(<path d="M4 7h16M4 12h16M4 17h16" />);
export const IconChevronLeft = make(<path d="m15 6-6 6 6 6" />);
export const IconChevronRight = make(<path d="m9 6 6 6-6 6" />);
export const IconMail = make(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></>);
export const IconDoor = make(<><path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17" /><path d="M3 21h18" /><circle cx="15" cy="12" r="0.9" fill="currentColor" /></>);
export const IconWindow = make(<><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M12 3v18M4 12h16" /></>);
export const IconRoom = make(<><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18" /><path d="M9 21v-7h6v7" /></>);
