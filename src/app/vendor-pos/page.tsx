'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import Logo from '@/components/Logo';

interface Route {
  id: string;
  name: string;
  source: string;
  destination: string;
}

interface Bus {
  id: string;
  busNumber: string;
  routeId: string;
  busType: string;
  totalSeats: number;
  isActive: boolean;
}

interface Trip {
  id: string;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  status: string;
  bus: {
    busNumber: string;
    busType: string;
    route: {
      name: string;
      source: string;
      destination: string;
    };
  };
}

// Define screen types as a string union
type ScreenType = 'LOGIN' | 'BUS_ARRIVAL' | 'TICKET_BOOKING' | 'TICKET_CANCELLATION';

export default function VendorPOSPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('LOGIN');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedBus, setSelectedBus] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [departureTime, setDepartureTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [customLogo, setCustomLogo] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('APSRTC');
  
  // Check if user is logged in and load custom logo
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'VENDOR') {
      setCurrentScreen('BUS_ARRIVAL');
      fetchRoutes();
      
      // Load custom logo and company name if available
      if (typeof window !== 'undefined') {
        const savedLogo = localStorage.getItem('vendorLogo');
        const savedCompanyName = localStorage.getItem('companyName');
        
        if (savedLogo) {
          setCustomLogo(savedLogo);
        }
        
        if (savedCompanyName) {
          setCompanyName(savedCompanyName);
        } else {
          // Set default company name to APSRTC and save it
          localStorage.setItem('companyName', 'APSRTC');
        }
      }
    }
  }, [status, session]);
  
  // Fetch routes for dropdown
  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/routes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }
      
      const data = await response.json();
      setRoutes(data);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError('Failed to load routes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch buses for selected route
  const fetchBuses = async (routeId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/buses?routeId=${routeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch buses');
      }
      
      const data = await response.json();
      setBuses(data);
    } catch (err) {
      console.error('Error fetching buses:', err);
      setError('Failed to load buses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle route selection
  const handleRouteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const routeId = e.target.value;
    setSelectedRoute(routeId);
    
    if (routeId) {
      fetchBuses(routeId);
    } else {
      setBuses([]);
    }
    
    setSelectedBus('');
  };
  
  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      setLoginError(null);
      
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        setLoginError('Invalid email or password');
        return;
      }
      
      // Redirect will happen based on useSession above
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle bus arrival logging
  const handleLogBusArrival = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoute || !selectedBus || !arrivalTime || !departureTime) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create a new trip for the bus
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          busId: selectedBus,
          departureTime: new Date(departureTime).toISOString(),
          arrivalTime: new Date(departureTime).toISOString(), // This would typically be different in a real app
          status: 'SCHEDULED',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to log bus arrival');
      }
      
      // Reset form
      setSelectedBus('');
      setArrivalTime('');
      setDepartureTime('');
      
      // Show success message
      alert('Bus arrival logged successfully!');
    } catch (err) {
      console.error('Error logging bus arrival:', err);
      setError('Failed to log bus arrival. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTripSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tripId = e.target.value;
    router.push(`/vendor-pos/tickets?tripId=${tripId}`);
  };
  
  // Handle ticket booking button click
  const handleTicketBookingClick = () => {
    router.push('/vendor-pos/tickets');
  };
  
  // Handle ticket cancellation button click
  const handleTicketCancellationClick = () => {
    router.push('/vendor-pos/cancel');
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Render login screen
  const renderLoginScreen = () => (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="w-100" style={{ maxWidth: 400 }}>
        <div className="text-center mb-4">
          {customLogo ? (
            <img src={customLogo} alt="Company Logo" className="img-fluid mb-3" style={{ maxHeight: '80px' }} />
          ) : (
            <Logo className="mb-3" />
          )}
          <h2 className="h4 fw-bold mb-2">{companyName} Vendor Portal</h2>
          <p className="text-muted mb-0">Sign in to manage bus arrivals and tickets</p>
        </div>
        <div className="card p-4 shadow-sm">
          <form onSubmit={handleLogin}>
            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                id="loginEmail"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label htmlFor="loginEmail">Email</label>
            </div>
            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control"
                id="loginPassword"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label htmlFor="loginPassword">Password</label>
            </div>
            {loginError && (
              <div className="alert alert-danger py-2 text-center mb-3">{loginError}</div>
            )}
            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-success btn-lg"
                disabled={isLoading}
              >
                {isLoading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : null}
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
  
  // Render bus arrival screen
  const renderBusArrivalScreen = () => (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-success">
            <div className="card-body">
              <h2 className="h5 fw-bold mb-3 text-success"><i className="bi bi-bus-front me-2"></i>Log Bus Arrival</h2>
              <form onSubmit={handleLogBusArrival}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="route" className="form-label">Route</label>
                    <select
                      id="route"
                      className="form-select"
                      value={selectedRoute}
                      onChange={handleRouteChange}
                      required
                    >
                      <option value="">Select Route</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.name} ({route.source} - {route.destination})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="bus" className="form-label">Bus</label>
                    <select
                      id="bus"
                      className="form-select"
                      value={selectedBus}
                      onChange={(e) => setSelectedBus(e.target.value)}
                      required
                      disabled={!selectedRoute}
                    >
                      <option value="">Select Bus</option>
                      {buses.map((bus) => (
                        <option key={bus.id} value={bus.id}>
                          {bus.busNumber} ({bus.busType})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <label htmlFor="departureTime" className="form-label">Departure Time</label>
                    <input
                      type="datetime-local"
                      id="departureTime"
                      className="form-control"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="arrivalTime" className="form-label">Arrival Time</label>
                    <input
                      type="datetime-local"
                      id="arrivalTime"
                      className="form-control"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="alert alert-danger text-center mt-3">{error}</div>
                )}
                <div className="d-grid mt-4">
                  <button
                    type="submit"
                    className="btn btn-success btn-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : null}
                    Log Bus Arrival
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card h-100 shadow-sm border-0 border-start border-4 border-success">
            <div className="card-body d-flex flex-column align-items-center justify-content-center text-center">
              <div className="mb-3"><i className="bi bi-ticket-perforated fs-1 text-success"></i></div>
              <h3 className="h5 fw-bold mb-2">Ticket Booking</h3>
              <p className="text-muted mb-3">Book new tickets for passengers</p>
              <button
                className="btn btn-success w-100"
                onClick={handleTicketBookingClick}
              >
                <i className="bi bi-plus-circle me-2"></i>Book Tickets
              </button>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100 shadow-sm border-0 border-start border-4 border-danger">
            <div className="card-body d-flex flex-column align-items-center justify-content-center text-center">
              <div className="mb-3"><i className="bi bi-x-circle fs-1 text-danger"></i></div>
              <h3 className="h5 fw-bold mb-2">Ticket Cancellation</h3>
              <p className="text-muted mb-3">Cancel existing tickets</p>
              <button
                className="btn btn-danger w-100"
                onClick={handleTicketCancellationClick}
              >
                <i className="bi bi-x-octagon me-2"></i>Cancel Tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <header className="bg-success text-white shadow-sm">
        <div className="container py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
            <div className="d-flex align-items-center gap-3">
              <Logo size="medium" color="light" className="me-3" customLogo={customLogo} />
              <h1 className="h4 fw-bold mb-0">Vendor POS System</h1>
            </div>
            {session?.user && (
              <div className="d-flex align-items-center gap-3">
                <span className="small">Logged in as: {session.user.name}</span>
                <a
                  href="/vendor-pos/settings"
                  className="btn btn-outline-light btn-sm"
                >
                  <i className="bi bi-gear me-1"></i>Settings
                </a>
                <a
                  href="/auth/logout"
                  className="btn btn-light btn-sm text-success border-success"
                >
                  <i className="bi bi-box-arrow-right me-1"></i>Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-grow-1 d-flex align-items-center justify-content-center">
        {status === 'loading' ? (
          <div className="d-flex flex-column align-items-center justify-content-center w-100" style={{ minHeight: 300 }}>
            <div className="spinner-border text-success mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading...</p>
          </div>
        ) : status === 'unauthenticated' || (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') ? (
          renderLoginScreen()
        ) : (
          renderBusArrivalScreen()
        )}
      </main>
    </div>
  );
} 