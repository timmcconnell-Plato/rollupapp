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

export function BottomNav() {
  const path = usePathname();
  const on = (p) => (p === '/' ? path === '/' : path.startsWith(p));
  const items = [
    { href: '/', label: 'Home' },
    { href: '/capture', label: 'Capture' },
    { href: '/reports', label: 'Reports' },
  ];
  return (
    <nav className="nav">
      {items.map((it) => (
        <Link key={it.href} href={it.href} className={on(it.href) ? 'on' : ''}>
          <span className="dot" />
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
