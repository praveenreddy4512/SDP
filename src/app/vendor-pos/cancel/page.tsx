'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import Logo from '@/components/Logo';

interface Ticket {
  id: string;
  price: number;
  status: 'BOOKED' | 'CANCELLED' | 'REFUNDED';
  paymentType: 'CASH' | 'QR';
  passengerName: string;
  passengerPhone: string;
  createdAt: string;
  seat?: {
    seatNumber: number;
  };
  trip: {
    departureTime: string;
    bus: {
      busNumber: string;
      route: {
        source: string;
        destination: string;
      };
    };
  };
}

export default function TicketCancellationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'phone' | 'id'>('phone');
  const [customLogo, setCustomLogo] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('APSRTC');
  
  // Check if user is logged in and load branding
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
    
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
  }, [status, router]);
  
  // Search tickets by phone or ticket ID
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchMode === 'phone' && !phoneNumber) {
      setError('Please enter a phone number');
      return;
    }
    
    if (searchMode === 'id' && !ticketId) {
      setError('Please enter a ticket ID');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      setSelectedTicket(null);
      
      const endpoint = searchMode === 'phone'
        ? `/api/tickets?phone=${encodeURIComponent(phoneNumber)}`
        : `/api/tickets?id=${encodeURIComponent(ticketId)}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      
      const data = await response.json();
      
      if (searchMode === 'phone') {
        // Handle array of tickets for phone search
        setTickets(Array.isArray(data) ? data : []);
        
        if (Array.isArray(data) && data.length === 0) {
          setError('No tickets found for this phone number');
        }
      } else {
        // Handle single ticket for ID search
        setTickets(data ? [data] : []);
        
        if (!data) {
          setError('Ticket not found');
        }
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to fetch tickets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel ticket
  const handleCancelTicket = async () => {
    if (!selectedTicket) {
      setError('Please select a ticket to cancel');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/tickets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: selectedTicket,
          status: 'CANCELLED',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel ticket');
      }
      
      // Update the ticket status in the local state
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === selectedTicket 
            ? { ...ticket, status: 'CANCELLED' as const } 
            : ticket
        )
      );
      
      setSuccess('Ticket cancelled successfully!');
      setSelectedTicket(null);
    } catch (err) {
      console.error('Error cancelling ticket:', err);
      setError('Failed to cancel ticket. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date
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
  
  // Go back to vendor dashboard
  const handleBackToVendorDashboard = () => {
    router.push('/vendor-pos');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-red-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
            <div className="flex items-center">
              <Logo size="medium" color="light" className="mr-4" customLogo={customLogo} />
              <h1 className="text-xl md:text-2xl font-bold">APSRTC Vendor POS - Ticket Cancellation</h1>
            </div>
            {session?.user && (
              <div className="flex items-center">
                <span className="mr-4 text-sm md:text-base">Welcome, {session.user.name}</span>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleBackToVendorDashboard}
                >
                  Back to Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        {status === 'loading' ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <Card className="w-full max-w-4xl mx-auto shadow-md">
            <CardContent>
              <div className="mb-4 md:mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Ticket Cancellation</h1>
                <p className="text-gray-800">Search and cancel tickets</p>
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 md:p-4 rounded-md mb-4 md:mb-6">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 text-green-600 p-3 md:p-4 rounded-md mb-4 md:mb-6">
                  {success}
                </div>
              )}
              
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setSearchMode('phone')}
                    className={`px-4 py-2 rounded-md ${
                      searchMode === 'phone' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      Search by Phone
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode('id')}
                    className={`px-4 py-2 rounded-md ${
                      searchMode === 'id' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                      </svg>
                      Search by Ticket ID
                    </span>
                  </button>
                </div>
                
                <form onSubmit={handleSearch} className="space-y-4">
                  {searchMode === 'phone' ? (
                    <div>
                      <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <div className="flex flex-col md:flex-row gap-3">
                        <input
                          id="phoneNumber"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                          placeholder="Enter passenger phone number"
                          required
                        />
                        <Button
                          type="submit"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <div className="animate-spin h-5 w-5 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                              <span>Searching...</span>
                            </div>
                          ) : (
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                              </svg>
                              Search
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="ticketId" className="block text-sm font-medium text-gray-700 mb-1">
                        Ticket ID
                      </label>
                      <div className="flex flex-col md:flex-row gap-3">
                        <input
                          id="ticketId"
                          type="text"
                          value={ticketId}
                          onChange={(e) => setTicketId(e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                          placeholder="Enter ticket ID"
                          required
                        />
                        <Button
                          type="submit"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <div className="animate-spin h-5 w-5 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                              <span>Searching...</span>
                            </div>
                          ) : (
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                              </svg>
                              Search
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
              
              {tickets.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-3 text-gray-900">Search Results</h2>
                  <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Passenger
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trip Details
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tickets.map((ticket) => (
                          <tr 
                            key={ticket.id} 
                            className={`${selectedTicket === ticket.id ? 'bg-red-50' : 'hover:bg-gray-50'} cursor-pointer`}
                            onClick={() => ticket.status === 'BOOKED' && setSelectedTicket(ticket.id)}
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <div className="text-sm font-medium text-gray-900">{ticket.passengerName}</div>
                                <div className="text-sm text-gray-500">{ticket.passengerPhone}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">{ticket.trip.bus.route.source} to {ticket.trip.bus.route.destination}</div>
                              <div className="text-sm text-gray-500">
                                Bus: {ticket.trip.bus.busNumber}, Seat: {ticket.seat?.seatNumber || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">{formatDate(ticket.trip.departureTime)}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${ticket.status === 'BOOKED' ? 'bg-green-100 text-green-800' : 
                                  ticket.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                                  'bg-yellow-100 text-yellow-800'}`}
                              >
                                {ticket.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              {ticket.status === 'BOOKED' ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTicket(ticket.id);
                                    handleCancelTicket();
                                  }}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isLoading}
                                >
                                  Cancel
                                </button>
                              ) : (
                                <span className="text-gray-400">No Actions</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {selectedTicket && (
                    <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-100">
                      <h3 className="font-semibold text-red-800 mb-2">Confirm Cancellation</h3>
                      <p className="text-sm text-red-600 mb-4">
                        Are you sure you want to cancel the selected ticket? This action cannot be undone.
                      </p>
                      <div className="flex justify-end space-x-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedTicket(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                          onClick={handleCancelTicket}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                              <span>Processing...</span>
                            </div>
                          ) : (
                            'Confirm Cancellation'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
} 