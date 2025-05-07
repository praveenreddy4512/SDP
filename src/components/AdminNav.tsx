'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, UsersIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface AdminNavProps {
  userEmail: string;
}

export default function AdminNav({ userEmail }: AdminNavProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Events', href: '/admin/events', icon: CalendarIcon },
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/admin" className="text-xl font-bold text-gray-800">
                Admin Panel
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === item.href
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <item.icon
                    className={`mr-2 h-5 w-5 ${
                      pathname === item.href ? 'text-blue-500' : 'text-gray-400'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="ml-3 relative">
              <div className="text-sm text-gray-500">{userEmail}</div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 