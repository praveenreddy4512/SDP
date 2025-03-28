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
  const renderLoginScreen = () => {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardContent>
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Logo size="large" customLogo={customLogo} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">APSRTC Vendor POS Login</h1>
            <p className="text-gray-700">Login to access vendor features</p>
          </div>
          
          {loginError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
              {loginError}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                'Login to Vendor Portal'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  };
  
  // Render bus arrival screen
  const renderBusArrivalScreen = () => {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="bg-green-600 text-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <h1 className="text-xl md:text-2xl font-bold">
              Welcome, {session?.user?.name || 'Vendor'}!
            </h1>
            <div className="mt-3 md:mt-0 flex flex-wrap gap-2">
              <button 
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                onClick={handleTicketBookingClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Book Tickets
              </button>
              <button 
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                onClick={handleTicketCancellationClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel Tickets
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardContent>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Log Bus Arrival
              </h2>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleLogBusArrival} className="space-y-4">
                <div>
                  <label htmlFor="route" className="block text-sm font-medium text-gray-700 mb-1">
                    Route
                  </label>
                  <select
                    id="route"
                    value={selectedRoute}
                    onChange={handleRouteChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select a route</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.source} to {route.destination} - {route.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="bus" className="block text-sm font-medium text-gray-700 mb-1">
                    Bus
                  </label>
                  <select
                    id="bus"
                    value={selectedBus}
                    onChange={(e) => setSelectedBus(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    disabled={!selectedRoute || buses.length === 0}
                    required
                  >
                    <option value="">Select a bus</option>
                    {buses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.busNumber} - {bus.busType}
                      </option>
                    ))}
                  </select>
                  {selectedRoute && buses.length === 0 && !isLoading && (
                    <p className="text-sm text-amber-600 mt-1">No buses available for this route</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-700 mb-1">
                      Arrival Time
                    </label>
                    <input
                      id="arrivalTime"
                      type="datetime-local"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="departureTime" className="block text-sm font-medium text-gray-700 mb-1">
                      Departure Time
                    </label>
                    <input
                      id="departureTime"
                      type="datetime-local"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin h-5 w-5 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      'Log Bus Arrival'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardContent>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Quick Actions
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="text-md font-semibold text-blue-800 mb-2">Active Trips Today</h3>
                  
                  {isLoading ? (
                    <div className="animate-pulse flex space-x-4">
                      <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-blue-200 rounded w-3/4"></div>
                        <div className="h-4 bg-blue-200 rounded"></div>
                        <div className="h-4 bg-blue-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  ) : trips.length > 0 ? (
                    <div className="space-y-3">
                      {trips.slice(0, 3).map(trip => (
                        <div key={trip.id} className="bg-white p-3 rounded border border-blue-100 shadow-sm">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{trip.bus.route.source} to {trip.bus.route.destination}</p>
                              <p className="text-sm text-gray-600">Bus: {trip.bus.busNumber} ({trip.bus.busType})</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">{formatDate(trip.departureTime)}</p>
                              <p className="text-xs text-gray-600">{trip.availableSeats} seats available</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="text-center mt-4">
                        <a href="/vendor-pos/tickets" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View All Trips
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">No active trips found.</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex items-center cursor-pointer hover:shadow-md transition"
                    onClick={handleTicketBookingClick}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-orange-800">Book Tickets</h3>
                      <p className="text-xs text-orange-600">Issue tickets for passengers</p>
                    </div>
                  </div>
                  
                  <div
                    className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center cursor-pointer hover:shadow-md transition"
                    onClick={handleTicketCancellationClick}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-red-800">Cancel Tickets</h3>
                      <p className="text-xs text-red-600">Process ticket cancellations</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
            <div className="flex items-center">
              <Logo size="medium" color="light" className="mr-4" customLogo={customLogo} />
              <h1 className="text-xl md:text-2xl font-bold">Vendor POS System</h1>
            </div>
            {session?.user && (
              <div className="flex items-center gap-3">
                <span className="text-sm md:text-base">Logged in as: {session.user.name}</span>
                <a
                  href="/vendor-pos/settings"
                  className="bg-green-700 text-white hover:bg-green-800 px-3 py-1 rounded-md text-sm font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  Settings
                </a>
                <a
                  href="/api/auth/signout"
                  className="bg-white text-green-700 hover:bg-gray-100 px-3 py-1 rounded-md text-sm font-medium"
                >
                  Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:py-8">
        <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
          {status === 'loading' ? (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : status === 'unauthenticated' || (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') ? (
            renderLoginScreen()
          ) : (
            renderBusArrivalScreen()
          )}
        </div>
      </main>
    </div>
  );
} 