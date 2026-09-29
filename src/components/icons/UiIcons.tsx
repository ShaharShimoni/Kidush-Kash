import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
}

export function BellIcon(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M18 9.4a6 6 0 1 0-12 0c0 4.4-1.6 5.9-1.6 5.9h15.2S18 13.8 18 9.4Z" />
      <path d="M13.8 18.6a2.1 2.1 0 0 1-3.6 0" />
    </svg>
  )
}

export function MenuIcon(p: P) {
  return (
    <svg {...base} {...p} strokeWidth={2.1}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function HeartIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...p}>
      <path d="M12 20.4s-7.6-4.7-7.6-10a4.4 4.4 0 0 1 7.6-3 4.4 4.4 0 0 1 7.6 3c0 5.3-7.6 10-7.6 10Z" />
    </svg>
  )
}

/** צ׳בון פתיחה — בכיוון RTL הוא מצביע שמאלה */
export function ChevronForwardIcon(p: P) {
  return (
    <svg {...base} {...p} strokeWidth={2}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  )
}

export function CheckIcon(p: P) {
  return (
    <svg {...base} {...p} strokeWidth={2.4}>
      <path d="m5.5 12.6 4.2 4.2 8.8-9.6" />
    </svg>
  )
}

export function PlusIcon(p: P) {
  return (
    <svg {...base} {...p} strokeWidth={2}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  )
}

export function CloseIcon(p: P) {
  return (
    <svg {...base} {...p} strokeWidth={2}>
      <path d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6" />
    </svg>
  )
}

export function CupcakeIcon(p: P) {
  return (
    <svg {...base} {...p} strokeWidth={1.5}>
      <path d="M6.4 12.2h11.2l-1.1 7.2a1 1 0 0 1-1 .8H8.5a1 1 0 0 1-1-.8l-1.1-7.2Z" />
      <path d="M5.6 12.2c-1-1.6-.2-3.5 1.6-3.9.1-1.8 1.7-3.1 3.5-2.8.5-1.4 2.2-2 3.5-1.2 1.2.7 1.7 2.2 1.2 3.5 1.9.4 2.9 2.4 1.8 4.1" />
      <path d="M9.2 15.4v3.6M12 15.4v3.6M14.8 15.4v3.6" />
    </svg>
  )
}

export function UsersIcon(p: P) {
  return (
    <svg {...base} {...p} strokeWidth={1.6}>
      <circle cx="9" cy="8.2" r="3.2" />
      <path d="M3.4 19.2c0-3.1 2.5-5.2 5.6-5.2s5.6 2.1 5.6 5.2" />
      <path d="M16.2 5.4a3.2 3.2 0 0 1 0 6" />
      <path d="M17.4 14.3c2 .6 3.2 2.3 3.2 4.4" />
    </svg>
  )
}

export function CalendarIcon(p: P) {
  return (
    <svg {...base} {...p} strokeWidth={1.6}>
      <rect x="3.6" y="5.2" width="16.8" height="15.2" rx="3" />
      <path d="M3.6 10h16.8M8.4 3.6v3.2M15.6 3.6v3.2" />
    </svg>
  )
}

export function InfoIcon(p: P) {
  return (
    <svg {...base} {...p} strokeWidth={1.6}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11.2v5M12 7.9v.1" />
    </svg>
  )
}

export function CandleIcon(p: P) {
  return (
    <svg {...base} {...p} strokeWidth={1.7}>
      <path d="M12 3.4c0 1.4-1.7 2-1.7 3.6a1.7 1.7 0 0 0 3.4 0c0-1.6-1.7-2.2-1.7-3.6Z" />
      <path d="M9.2 8.6h5.6l-.9 10.6a1.4 1.4 0 0 1-1.4 1.3h-1a1.4 1.4 0 0 1-1.4-1.3L9.2 8.6Z" />
      <path d="M7.4 20.5h9.2" />
    </svg>
  )
}

export function TrashIcon(p: P) {
  return (
    <svg {...base} {...p} strokeWidth={1.8}>
      <path d="M4.6 7.2h14.8" />
      <path d="M9.4 7.2V5.4a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v1.8" />
      <path d="M6.6 7.2 7.3 19a1.2 1.2 0 0 0 1.2 1.1h6.9a1.2 1.2 0 0 0 1.2-1.1l.8-11.8" />
      <path d="M10.3 10.6v6.4M13.7 10.6v6.4" />
    </svg>
  )
}

export function ListIcon(p: P) {
  return (
    <svg {...base} {...p} strokeWidth={1.6}>
      <path d="M9 6.6h11M9 12h11M9 17.4h11" />
      <circle cx="4.8" cy="6.6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4.8" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4.8" cy="17.4" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}
