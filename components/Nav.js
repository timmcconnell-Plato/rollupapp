'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './Auth';

export function Header({ ctx }) {
  const { user, signOut } = useAuth();
  return (
    <div className="hd">
      <span className="wm">RollUp</span>
      <span className="ctx" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {ctx || ''}
        {user && (
          <a onClick={signOut} style={{ cursor: 'pointer', textDecoration: 'underline' }}>sign out</a>
        )}
      </span>
    </div>
  );
}

const svg = { width: 23, height: 23, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };

function HomeIcon() {
  return (
    <svg {...svg}>
      <path d="M4 11.3 12 5l8 6.3" />
      <path d="M6 10.6V19h12v-8.4" />
      <path d="M10 19v-4.2h4V19" />
    </svg>
  );
}
function SessionsIcon() {
  return (
    <svg {...svg}>
      <circle cx="5" cy="7" r="1.5" fill="currentColor" stroke="none" />
      <line x1="9" y1="7" x2="20" y2="7" />
      <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <circle cx="5" cy="17" r="1.5" fill="currentColor" stroke="none" />
      <line x1="9" y1="17" x2="16" y2="17" />
    </svg>
  );
}
function ReportsIcon() {
  return (
    <svg {...svg}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function DashboardIcon() {
  return (
    <svg {...svg}>
      <rect x="4" y="4" width="7" height="7" rx="1.6" />
      <rect x="13" y="4" width="7" height="7" rx="1.6" />
      <rect x="4" y="13" width="7" height="7" rx="1.6" />
      <rect x="13" y="13" width="7" height="7" rx="1.6" />
    </svg>
  );
}

export function BottomNav() {
  const path = usePathname();
  const on = (p) => (p === '/' ? path === '/' : path.startsWith(p));
  const items = [
    { href: '/', label: 'Home', Icon: HomeIcon },
    { href: '/sessions', label: 'Sessions', Icon: SessionsIcon },
    { href: '/reports', label: 'Reports', Icon: ReportsIcon },
    { href: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  ];
  return (
    <nav className="nav">
      {items.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className={on(href) ? 'on' : ''}>
          <Icon />
          {label}
        </Link>
      ))}
    </nav>
  );
}
