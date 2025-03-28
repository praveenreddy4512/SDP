import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Logo from '@/components/Logo';
import AdminSidebar from '@/components/AdminSidebar';

export const metadata: Metadata = {
  title: 'APSRTC Admin',
  description: 'Administration portal for APSRTC bus ticketing system',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  // Redirect if user is not authenticated or not an admin
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/login?callbackUrl=/admin');
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 flex w-72 flex-col">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200 bg-white">
          <Link href="/admin" className="flex items-center">
            <Logo size="small" />
            <span className="ml-2 text-xl font-bold">APSRTC Admin</span>
          </Link>
        </div>
        <AdminSidebar />
      </div>
      
      {/* Main content */}
      <div className="flex flex-1 flex-col pl-72">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 