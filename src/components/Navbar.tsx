'use client';

import Logo from '@/components/Logo';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Navbar() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-2 sticky-top">
      <div className="container">
        <Link href="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold">
          <Logo size="small" />
          <span className="d-none d-md-inline">APSRTC</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-lg-2">
            <li className="nav-item">
              <Link href="/search" className="nav-link">Search</Link>
            </li>
            <li className="nav-item">
              <Link href="/admin" className="nav-link">Admin</Link>
            </li>
            <li className="nav-item">
              <Link href="/vendor-pos" className="nav-link">Vendor POS</Link>
            </li>
            {!isAuthenticated && (
              <li className="nav-item">
                <Link href="/auth/login" className="nav-link">Login</Link>
              </li>
            )}
            {isAuthenticated && (
              <li className="nav-item">
                <Link href="/auth/logout" className="btn btn-outline-success ms-lg-2 px-3 py-1">Logout</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
} 