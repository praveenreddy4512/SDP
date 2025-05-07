'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      // Redirect based on user role
      if (session.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (session.user.role === 'VENDOR') {
        router.push('/vendor-pos');
      } else {
        router.push('/search');
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, session, router]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
} 