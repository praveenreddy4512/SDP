'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function HomePage() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const userRole = session?.user?.role;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to APSRTC</h1>
            <p className="text-xl text-gray-600">Your one-stop solution for comfortable and reliable bus travel</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Customers</h2>
              <p className="text-gray-600 mb-6">
                Browse routes, book tickets, and manage your journeys with ease.
              </p>
              <Link href="/search">
                <Button fullWidth>Search & Book Tickets</Button>
              </Link>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Bus Operators</h2>
              <p className="text-gray-600 mb-6">
                Manage bus arrivals, ticket sales, and check trip statistics.
              </p>
              {isAuthenticated && userRole === 'VENDOR' ? (
                <Link href="/vendor-pos">
                  <Button fullWidth>Access Vendor POS</Button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <Button fullWidth>Vendor Login</Button>
                </Link>
              )}
            </Card>
          </div>

          {isAuthenticated && userRole === 'ADMIN' && (
            <div className="my-8">
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Administration</h2>
                <p className="text-gray-600 mb-6">
                  Manage routes, buses, vendors, and system configuration.
                </p>
                <Link href="/admin">
                  <Button fullWidth>Access Admin Panel</Button>
                </Link>
              </Card>
            </div>
          )}

          <div className="my-8">
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Self-Service Machines</h2>
              <p className="text-gray-600 mb-6">
                Book tickets directly from our self-service kiosks at bus stations without needing to create an account.
              </p>
              <Link href="/machine">
                <Button fullWidth variant="success">Try Self-Service Experience</Button>
              </Link>
            </Card>
          </div>

          <div className="mt-12 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Search</h3>
                <p className="text-gray-600">Find the perfect bus for your journey</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎫</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Book</h3>
                <p className="text-gray-600">Select seats and securely pay online</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚌</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Travel</h3>
                <p className="text-gray-600">Show your ticket and enjoy your journey</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
