import type { ReactElement } from 'react'

const P: Record<string, ReactElement> = {
  hammer: <><path d="M12.5 4.5l7 7-3.2 3.2-7-7z" /><path d="M5 20l7.5-7.5" /></>,
  wheat: <><path d="M12 21V9" /><path d="M12 9C9 8 8 6 8 3c3 0 4 2 4 6zM12 9c3-1 4-3 4-6-3 0-4 2-4 6zM12 15c-3-1-4-3-4-6M12 15c3-1 4-3 4-6" /></>,
  coin: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5v9M9.6 10.2c0-1 1-1.6 2.4-1.6s2.4.7 2.4 1.7-1 1.4-2.4 1.7-2.4.7-2.4 1.8 1 1.7 2.4 1.7 2.4-.6 2.4-1.5" /></>,
  house: <><path d="M3.5 11.5L12 4l8.5 7.5" /><path d="M6 10.5V20h12v-9.5M10 20v-6h4v6" /></>,
  book: <><path d="M5 5.5A2 2 0 017 4h11v14H7a2 2 0 00-2 2z" /><path d="M5 5.5V20M9 8h6" /></>,
  boat: <><path d="M3 15h18l-3 5H6z" /><path d="M12 4v11M12 5l6 8h-6" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10.3A4.2 4.2 0 0112 7.2a4.2 4.2 0 017.5 2.5C19.5 15.4 12 20 12 20z" />,
  flame: <path d="M12 3c1.2 4.2 5.2 5.4 5.2 10.2a5.2 5.2 0 01-10.4 0c0-2.2 1-3.4 2.2-4.4.1 2 1 3 2.2 3.2-.4-3-.2-5.6.8-9z" />,
  water: <path d="M12 3.5s6 5.8 6 10.5a6 6 0 01-12 0c0-4.7 6-10.5 6-10.5z" />,
  scroll: <><path d="M7 4h11v14a2 2 0 002 2H9a2 2 0 01-2-2z" /><path d="M7 4a2 2 0 00-2 2v2h2M10.5 9h5.5M10.5 13h5.5" /></>,
  key: <><circle cx="8" cy="12" r="3.6" /><path d="M11.6 12H21M17.5 12v3M20.5 12v2" /></>,
  bell: <><path d="M6 17h12l-2-3v-4a4 4 0 00-8 0v4z" /><path d="M10 20a2 2 0 004 0" /></>,
  candle: <><path d="M10 10h4v10h-4z" /><path d="M12 3c1.8 2.2 1.8 3.6 0 4.6-1.8-1-1.8-2.400 0-4.6z" /></>,
  health: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v8M8 12h8" /></>,
  knowledge: <><path d="M3 9.5L12 5l9 4.5-9 4.5z" /><path d="M7 12v4.5c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5V12" /></>,
  bonds: <><circle cx="9" cy="12" r="5" /><circle cx="15" cy="12" r="5" /></>,
  debt: <><path d="M4 7h16M4 12h16M4 17h10" /></>,
  thread: <><circle cx="5" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="M7 6c8 0 2 12 10 12" /></>,
  echo: <><path d="M4 12a8 8 0 0113.6-5.700L20 4v6h-6l2.400-2.400A5.5 5.5 0 106 12" /></>,
  tree: <><path d="M12 21V9M12 13l-5-4M12 13l5-4M12 17l-3-2M12 17l3-2" /><circle cx="12" cy="6" r="3" /></>,
  history: <><path d="M4 12a8 8 0 108-8 8 8 0 00-6 2.700" /><path d="M4 4v4h4M12 8v4l3 2" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  download: <><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" /><path d="M5 19h14" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  lock: <><rect x="6" y="11" width="12" height="9" rx="1.5" /><path d="M9 11V8a3 3 0 016 0v3" /></>,
  dice: <><rect x="4.5" y="4.5" width="15" height="15" rx="2.5" /><circle cx="9" cy="9" r="1" /><circle cx="15" cy="15" r="1" /><circle cx="12" cy="12" r="1" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
}

export function Icon({ name, size = 20, title }: { name: string; size?: number; title?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
      strokeLinecap="round" strokeLinejoin="round" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}
      className="icon"
    >
      {title ? <title>{title}</title> : null}
      {P[name] ?? P.scroll}
    </svg>
  )
}
