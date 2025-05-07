'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Button from './ui/Button';
import Image from 'next/image';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const userRole = session?.user?.role;

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/">
              <div className="text-xl font-bold text-green-600 flex items-center">
                <Image 
                  src="https://play-lh.googleusercontent.com/lN7A23bINlQu9l8ab9QrlJJpAMs3FtOqj7Z5qlz4YCrTvDc2_4pIg4fg2f89hJUZ0Rw=w600-h300-pc0xffffff-pd" 
                  alt="APSRTC Logo" 
                  width={50} 
                  height={50} 
                  className="mr-2 rounded-sm"
                />
                APSRTC
              </div>
            </Link>
            
            <div className="ml-10 hidden md:flex space-x-6">
              <Link href="/" className={`text-gray-700 hover:text-green-600 ${pathname === '/' ? 'text-green-600 font-medium' : ''}`}>
                Home
              </Link>
              <Link href="/search" className={`text-gray-700 hover:text-green-600 ${pathname === '/search' ? 'text-green-600 font-medium' : ''}`}>
                Search Tickets
              </Link>
              <Link href="/my-bookings" className={`text-gray-700 hover:text-green-600 ${pathname === '/my-bookings' ? 'text-green-600 font-medium' : ''}`}>
                My Bookings
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {userRole === 'ADMIN' && (
              <Link href="/admin" className={`text-gray-700 hover:text-green-600 ${pathname.startsWith('/admin') ? 'text-green-600 font-medium' : ''}`}>
                Admin Panel
              </Link>
            )}
            
            {userRole === 'VENDOR' && (
              <Link href="/vendor-pos" className={`text-gray-700 hover:text-green-600 ${pathname.startsWith('/vendor-pos') ? 'text-green-600 font-medium' : ''}`}>
                Vendor POS
              </Link>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{session.user?.name}</span>
                <Link href="/auth/logout">
                  <Button variant="secondary" size="sm">Logout</Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login">
                  <Button variant="secondary" size="sm">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 