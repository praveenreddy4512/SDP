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
    <div className="bg-light min-vh-100">
      <main className="container py-5">
        <div className="mx-auto" style={{maxWidth: 900}}>
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3">Welcome to APSRTC</h1>
            <p className="lead text-secondary">Your one-stop solution for comfortable and reliable bus travel</p>
          </div>

          <div className="row g-4 mb-5">
            <div className="col-md-6">
              <div className="card p-4 h-100">
                <h2 className="h4 fw-bold mb-3">Customers</h2>
                <p className="text-secondary mb-4">
                  Browse routes, book tickets, and manage your journeys with ease.
                </p>
                <Link href="/search" className="d-block">
                  <button className="btn btn-primary w-100">Search & Book Tickets</button>
                </Link>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card p-4 h-100">
                <h2 className="h4 fw-bold mb-3">Bus Operators</h2>
                <p className="text-secondary mb-4">
                  Manage bus arrivals, ticket sales, and check trip statistics.
                </p>
                {isAuthenticated && userRole === 'VENDOR' ? (
                  <Link href="/vendor-pos" className="d-block">
                    <button className="btn btn-primary w-100">Access Vendor POS</button>
                  </Link>
                ) : (
                  <Link href="/auth/login" className="d-block">
                    <button className="btn btn-outline-primary w-100">Vendor Login</button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {isAuthenticated && userRole === 'ADMIN' && (
            <div className="mb-4">
              <div className="card p-4">
                <h2 className="h4 fw-bold mb-3">Administration</h2>
                <p className="text-secondary mb-4">
                  Manage routes, buses, vendors, and system configuration.
                </p>
                <Link href="/admin" className="d-block">
                  <button className="btn btn-danger w-100">Access Admin Panel</button>
                </Link>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="card p-4">
              <h2 className="h4 fw-bold mb-3">Self-Service Machines</h2>
              <p className="text-secondary mb-4">
                Book tickets directly from our self-service kiosks at bus stations without needing to create an account.
              </p>
              <Link href="/machine" className="d-block">
                <button className="btn btn-success w-100">Try Self-Service Experience</button>
              </Link>
            </div>
          </div>

          <div className="mt-5 card p-4">
            <h2 className="h4 fw-bold text-center mb-4">How It Works</h2>
            <div className="row g-4">
              <div className="col-md-4 text-center">
                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: 64, height: 64}}>
                  <span style={{fontSize: 32}}>🔍</span>
                </div>
                <h3 className="fw-bold h6 mb-2">Search</h3>
                <p className="text-secondary">Find the perfect bus for your journey</p>
              </div>
              <div className="col-md-4 text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: 64, height: 64}}>
                  <span style={{fontSize: 32}}>🎫</span>
                </div>
                <h3 className="fw-bold h6 mb-2">Book</h3>
                <p className="text-secondary">Select seats and securely pay online</p>
              </div>
              <div className="col-md-4 text-center">
                <div className="bg-purple bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: 64, height: 64, background: '#f3e8ff'}}>
                  <span style={{fontSize: 32}}>🚌</span>
                </div>
                <h3 className="fw-bold h6 mb-2">Travel</h3>
                <p className="text-secondary">Show your ticket and enjoy your journey</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
