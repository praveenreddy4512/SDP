'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Show success message and redirect to login page
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
      
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="w-100" style={{maxWidth: 400}}>
        <div className="text-center mb-4">
          <h2 className="h3 fw-bold">Create an Account</h2>
          <p className="text-muted">Register to start using our bus ticketing system</p>
        </div>
        
        <div className="card p-4 shadow-sm">
          {error && (
            <div className="alert alert-danger py-2 text-center mb-3">{error}</div>
          )}
          
          {success && (
            <div className="alert alert-success py-2 text-center mb-3">
              Registration successful! Redirecting to login page...
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-control"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-control"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Registering...
                  </>
                ) : (
                  'Register'
                )}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-4">
            <p className="text-muted mb-0">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary text-decoration-none">
                Login here
              </Link>
            </p>
          </div>
          
          <div className="text-center mt-3">
            <Link href="/" className="text-primary text-decoration-none">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 