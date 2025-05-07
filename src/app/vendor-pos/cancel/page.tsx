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
    <div className="min-vh-100 bg-light d-flex flex-column">
      <header className="bg-danger text-white shadow-sm">
        <div className="container py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
            <div className="d-flex align-items-center gap-3">
              <Logo size="medium" color="light" className="me-3" customLogo={customLogo} />
              <h1 className="h4 fw-bold mb-0">APSRTC Vendor POS - Ticket Cancellation</h1>
            </div>
            {session?.user && (
              <div className="d-flex align-items-center gap-3">
                <span className="small">Welcome, {session.user.name}</span>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleBackToVendorDashboard}
                  className="btn btn-outline-light btn-sm"
                >
                  Back to Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="container flex-grow-1 py-4 py-md-5">
        {status === 'loading' ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="card shadow-sm mx-auto" style={{ maxWidth: 700 }}>
            <div className="card-body">
              <h2 className="h5 fw-bold mb-3">Ticket Cancellation</h2>
              <p className="text-muted mb-4">Search and cancel tickets</p>
              {error && (
                <div className="alert alert-danger text-center mb-4">{error}</div>
              )}
              {success && (
                <div className="alert alert-success text-center mb-4">{success}</div>
              )}
              <div className="mb-4">
                <div className="btn-group w-100 mb-3" role="group">
                  <button
                    type="button"
                    onClick={() => setSearchMode('phone')}
                    className={`btn ${searchMode === 'phone' ? 'btn-danger' : 'btn-outline-secondary'}`}
                  >
                    <i className="bi bi-telephone me-1"></i>Search by Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode('id')}
                    className={`btn ${searchMode === 'id' ? 'btn-danger' : 'btn-outline-secondary'}`}
                  >
                    <i className="bi bi-upc-scan me-1"></i>Search by Ticket ID
                  </button>
                </div>
                <form onSubmit={handleSearch}>
                  <div className="row g-3 align-items-end">
                    {searchMode === 'phone' ? (
                      <div className="col-12 col-md-8">
                        <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                        <input
                          id="phoneNumber"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="form-control"
                          placeholder="Enter passenger phone number"
                          required
                        />
                      </div>
                    ) : (
                      <div className="col-12 col-md-8">
                        <label htmlFor="ticketId" className="form-label">Ticket ID</label>
                        <input
                          id="ticketId"
                          type="text"
                          value={ticketId}
                          onChange={(e) => setTicketId(e.target.value)}
                          className="form-control"
                          placeholder="Enter ticket ID"
                          required
                        />
                      </div>
                    )}
                    <div className="col-12 col-md-4 d-grid">
                      <Button
                        type="submit"
                        className="btn btn-danger btn-lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Searching...</span>
                        ) : (
                          <span><i className="bi bi-search me-1"></i>Search</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
              {tickets.length > 0 && (
                <div className="mt-4">
                  <h2 className="h6 fw-bold mb-3 text-dark">Search Results</h2>
                  <div className="table-responsive rounded border">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Passenger</th>
                          <th>Trip Details</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((ticket) => (
                          <tr
                            key={ticket.id}
                            className={selectedTicket === ticket.id ? 'table-danger' : ''}
                            onClick={() => ticket.status === 'BOOKED' && setSelectedTicket(ticket.id)}
                            style={{ cursor: ticket.status === 'BOOKED' ? 'pointer' : 'default' }}
                          >
                            <td>
                              <div className="fw-semibold">{ticket.passengerName}</div>
                              <div className="text-muted small">{ticket.passengerPhone}</div>
                            </td>
                            <td>
                              <div>{ticket.trip.bus.route.source} to {ticket.trip.bus.route.destination}</div>
                              <div className="text-muted small">Bus: {ticket.trip.bus.busNumber}, Seat: {ticket.seat?.seatNumber || 'N/A'}</div>
                              <div className="text-muted small">{formatDate(ticket.trip.departureTime)}</div>
                            </td>
                            <td>
                              <span className={`badge rounded-pill px-3 py-2 fw-normal ${ticket.status === 'BOOKED' ? 'bg-success-subtle text-success' : ticket.status === 'CANCELLED' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'}`}>{ticket.status}</span>
                            </td>
                            <td>
                              {ticket.status === 'BOOKED' ? (
                                <Button
                                  onClick={e => { e.stopPropagation(); setSelectedTicket(ticket.id); handleCancelTicket(); }}
                                  className="btn btn-link text-danger p-0"
                                  disabled={isLoading}
                                >
                                  Cancel
                                </Button>
                              ) : (
                                <span className="text-muted small">No Actions</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedTicket && (
                    <div className="mt-4 alert alert-danger d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                      <div>
                        <h6 className="fw-bold mb-1">Confirm Cancellation</h6>
                        <p className="mb-0">Are you sure you want to cancel the selected ticket? This action cannot be undone.</p>
                      </div>
                      <div className="d-flex gap-2 mt-3 mt-md-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedTicket(null)}
                          className="btn btn-outline-secondary btn-sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          className="btn btn-danger btn-sm"
                          size="sm"
                          onClick={handleCancelTicket}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...</span>
                          ) : (
                            'Confirm Cancellation'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 