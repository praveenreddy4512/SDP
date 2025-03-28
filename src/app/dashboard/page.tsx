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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
} 