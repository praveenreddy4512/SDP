'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import { useReactToPrint } from 'react-to-print';
import printJS from 'print-js';
import Logo from '@/components/Logo';
import { QRCodeSVG } from 'qrcode.react';

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

interface Seat {
  id: string;
  seatNumber: number;
  status: 'AVAILABLE' | 'BOOKED' | 'RESERVED' | 'UNAVAILABLE';
}

interface TicketResponse {
  id: string;
  tripId: string;
  price: number;
  status: string;
  qrCode: string;
  passengerName: string;
  passengerPhone: string;
  createdAt: string;
  paymentType: 'CASH' | 'QR';
  trip: Trip;
  seat: {
    id: string;
    seatNumber: number;
  };
}

export default function TicketBookingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string>('');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [paymentType, setPaymentType] = useState<'CASH' | 'QR'>('CASH');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripDetails, setTripDetails] = useState<Trip | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bookedTickets, setBookedTickets] = useState<TicketResponse[]>([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [customLogo, setCustomLogo] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('APSRTC');
  const [ticketIssued, setTicketIssued] = useState<TicketResponse | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Check if user is logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
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
  }, [status, router]);
  
  // Setup print functionality
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => {
      setShowTicketModal(false);
      // Reset form after printing
      setSelectedSeats([]);
      setPassengerName('');
      setPassengerPhone('');
      setBookedTickets([]);
      setSuccessMessage(null);
    },
    onBeforePrint: () => {
      return new Promise<void>((resolve) => {
        // Give time for content to be fully rendered
        setTimeout(() => {
          resolve();
        }, 250);
      });
    },
    onPrintError: (errorLocation, error) => {
      console.error('Print error:', errorLocation, error);
      alert('There was an error printing. Please try the manual print button.');
    }
  });
  
  // Auto print when tickets are booked
  useEffect(() => {
    if (bookedTickets.length > 0 && showTicketModal && printRef.current) {
      // Make sure the print content is ready before printing
      // Use a longer delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        handlePrint();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [bookedTickets, showTicketModal, handlePrint]);
  
  // Fetch trips
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/trips', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.user?.id}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch trips');
        }
        
        const data = await response.json();
        // Show all trips
        const allTrips = data;
        
        // Sort by departure time (most recent first)
        allTrips.sort((a: Trip, b: Trip) => 
          new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
        );
        
        setTrips(allTrips);
        
        // If there's a tripId in the URL, select it automatically
        const params = new URLSearchParams(window.location.search);
        const tripId = params.get('tripId');
        if (tripId) {
          setSelectedTrip(tripId);
        }
      } catch (err) {
        console.error('Error fetching trips:', err);
        setError('Failed to load trips. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session?.user) {
      fetchTrips();
    }
  }, [session]);
  
  // Fetch seats when trip is selected
  useEffect(() => {
    const fetchSeats = async () => {
      if (!selectedTrip) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/trips?id=${selectedTrip}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch trip details');
        }
        
        const data = await response.json();
        setSeats(data.seats);
        setTripDetails(data);
      } catch (err) {
        console.error('Error fetching seats:', err);
        setError('Failed to load seats. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSeats();
  }, [selectedTrip]);
  
  // Handle trip selection
  const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTrip(e.target.value);
    setSelectedSeats([]);
  };
  
  // Handle seat selection
  const handleSeatToggle = (seatId: string) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };
  
  // Book tickets
  const handleBookTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTrip || selectedSeats.length === 0 || !passengerName || !passengerPhone) {
      setError('Please fill in all required fields and select at least one seat');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Calculate price (just a placeholder - real implementation would get this from the backend)
      const ticketPrice = tripDetails?.bus.busType.includes('AC') ? 250 : 150;
      
      // Create tickets for each selected seat
      const bookingPromises = selectedSeats.map(seatId => {
        const seat = seats.find(s => s.id === seatId);
        
        return fetch('/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tripId: selectedTrip,
            seatId: seatId,
            price: ticketPrice,
            paymentType: paymentType,
            passengerName,
            passengerPhone,
            qrCode: `TICKET-${Date.now()}-${seat?.seatNumber}`,
          }),
        });
      });
      
      const responses = await Promise.all(bookingPromises);
      
      // Check if any booking failed
      const failedBookings = responses.filter(response => !response.ok);
      
      if (failedBookings.length > 0) {
        throw new Error(`Failed to book ${failedBookings.length} tickets`);
      }
      
      // Get ticket data for all created tickets
      const ticketDataPromises = responses.map(response => response.json());
      const ticketData = await Promise.all(ticketDataPromises);
      
      // Set booked tickets for printing
      setBookedTickets(ticketData);
      setSuccessMessage(`Successfully booked ${ticketData.length} ticket(s)`);
      setShowTicketModal(true);
      
      // Refresh seats data
      const response = await fetch(`/api/trips?id=${selectedTrip}`);
      const data = await response.json();
      setSeats(data.seats);
      
    } catch (err) {
      console.error('Error booking tickets:', err);
      setError('Failed to book tickets. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
  
  // Go back to vendor dashboard
  const handleBackToVendorDashboard = () => {
    router.push('/vendor-pos');
  };
  
  // Manually print tickets
  const handleManualPrint = () => {
    if (!printRef.current) {
      alert('The ticket content is not ready. Please try again in a moment.');
      return;
    }
    handlePrint();
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <header className="bg-success text-white shadow-sm">
        <div className="container py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
            <div className="d-flex align-items-center gap-3">
              <Logo size="medium" color="light" className="me-3" customLogo={customLogo} />
              <h1 className="h4 fw-bold mb-0">APSRTC Vendor POS - Ticket Booking</h1>
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
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="card shadow-sm mx-auto" style={{ maxWidth: 700 }}>
            <div className="card-body">
              <h2 className="h5 fw-bold mb-3">Ticket Booking</h2>
              <p className="text-muted mb-4">Book tickets for passengers</p>
              {error && (
                <div className="alert alert-danger text-center mb-4">{error}</div>
              )}
              {successMessage && !showTicketModal && (
                <div className="alert alert-success text-center mb-4">{successMessage}</div>
              )}
              <form onSubmit={handleBookTicket}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="trip" className="form-label">Select Trip</label>
                    <select
                      id="trip"
                      value={selectedTrip}
                      onChange={handleTripChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select a trip</option>
                      {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.bus.route.source} to {trip.bus.route.destination} - {trip.bus.busNumber} ({formatDate(trip.departureTime)}) - {trip.status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Payment Method</label>
                    <div className="d-flex gap-3 align-items-center">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="paymentType"
                          id="payCash"
                          value="CASH"
                          checked={paymentType === 'CASH'}
                          onChange={() => setPaymentType('CASH')}
                        />
                        <label className="form-check-label" htmlFor="payCash">Cash</label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="paymentType"
                          id="payQR"
                          value="QR"
                          checked={paymentType === 'QR'}
                          onChange={() => setPaymentType('QR')}
                        />
                        <label className="form-check-label" htmlFor="payQR">QR Payment</label>
                      </div>
                      {selectedTrip && (
                        <span className="badge bg-success ms-auto">
                          {tripDetails?.availableSeats || 0} seats available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {tripDetails && (
                  <div className="alert alert-info mb-3">
                    <div className="row g-2">
                      <div className="col-6 col-md-3"><strong>Route:</strong> {tripDetails.bus.route.source} to {tripDetails.bus.route.destination}</div>
                      <div className="col-6 col-md-3"><strong>Bus:</strong> {tripDetails.bus.busNumber} ({tripDetails.bus.busType})</div>
                      <div className="col-6 col-md-3"><strong>Departure:</strong> {formatDate(tripDetails.departureTime)}</div>
                      <div className="col-6 col-md-3"><strong>Arrival:</strong> {formatDate(tripDetails.arrivalTime)}</div>
                    </div>
                  </div>
                )}
                {selectedTrip && seats.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label">Select Seats <span className="badge bg-primary">{selectedSeats.length} selected</span></label>
                    <div className="row g-2">
                      {seats.map((seat) => (
                        <div className="col-2 col-md-1" key={seat.id}>
                          <button
                            type="button"
                            className={`btn btn-sm w-100 mb-1 fw-bold ${seat.status === 'AVAILABLE' ? (selectedSeats.includes(seat.id) ? 'btn-success' : 'btn-outline-success') : 'btn-secondary disabled'}`}
                            onClick={() => seat.status === 'AVAILABLE' && handleSeatToggle(seat.id)}
                            disabled={seat.status !== 'AVAILABLE'}
                          >
                            {seat.seatNumber}
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="d-flex flex-wrap gap-3 justify-content-center mt-2">
                      <span className="badge bg-outline-success border border-success text-success">Available</span>
                      <span className="badge bg-success">Selected</span>
                      <span className="badge bg-secondary">Booked</span>
                    </div>
                  </div>
                )}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="passengerName" className="form-label">Passenger Name</label>
                    <input
                      id="passengerName"
                      type="text"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="passengerPhone" className="form-label">Passenger Phone</label>
                    <input
                      id="passengerPhone"
                      type="tel"
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      className="form-control"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                </div>
                <div className="d-grid mt-3">
                  <Button
                    type="submit"
                    variant="primary"
                    className="btn btn-success btn-lg"
                    disabled={isLoading || selectedSeats.length === 0}
                  >
                    {isLoading ? (
                      <span><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...</span>
                    ) : (
                      `Book ${selectedSeats.length} ${selectedSeats.length === 1 ? 'Ticket' : 'Tickets'} ${selectedSeats.length > 0 && tripDetails?.bus.busType ? `(₹${(tripDetails.bus.busType.includes('AC') ? 250 : 150) * selectedSeats.length})` : ''}`
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      {/* Ticket Print Modal */}
      {showTicketModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-success">Tickets Booked Successfully!</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => {
                  setShowTicketModal(false);
                  setSelectedSeats([]);
                  setPassengerName('');
                  setPassengerPhone('');
                  setBookedTickets([]);
                  setSuccessMessage(null);
                }}></button>
              </div>
              <div className="modal-body">
                <p>Your tickets are being printed automatically.</p>
                <p className="text-muted small">If printing doesn't start automatically, click the button below:</p>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setShowTicketModal(false)}>
                  Close
                </Button>
                <Button onClick={handleManualPrint}>
                  Print Tickets
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Printable Ticket Template (hidden) */}
      <div className="d-none">
        <div ref={printRef} className="p-4">
          {bookedTickets && bookedTickets.length > 0 ? (
            bookedTickets.map((ticket, index) => (
              <div key={ticket.id} className="mb-4 border-bottom pb-4" style={{ pageBreakAfter: index < bookedTickets.length - 1 ? 'always' : 'auto' }}>
                <div className="text-center mb-3">
                  <div className="d-flex justify-content-center mb-2">
                    <Logo size="small" customLogo={customLogo} />
                  </div>
                  <h1 className="h5 fw-bold mb-1">{companyName}</h1>
                  <p className="text-muted small mb-0">Ticket #{ticket.id.substring(0, 8)}</p>
                </div>
                <div className="mb-3">
                  <h6 className="fw-bold border-bottom pb-1 mb-2">Route Details</h6>
                  <div className="row g-2">
                    <div className="col-6"><strong>From:</strong> {ticket.trip?.bus?.route?.source || 'N/A'}</div>
                    <div className="col-6"><strong>To:</strong> {ticket.trip?.bus?.route?.destination || 'N/A'}</div>
                    <div className="col-6"><strong>Bus:</strong> {ticket.trip?.bus?.busNumber || 'N/A'}</div>
                    <div className="col-6"><strong>Type:</strong> {ticket.trip?.bus?.busType || 'N/A'}</div>
                    <div className="col-6"><strong>Departure:</strong> {ticket.trip?.departureTime ? formatDate(ticket.trip.departureTime) : 'N/A'}</div>
                    <div className="col-6"><strong>Arrival:</strong> {ticket.trip?.arrivalTime ? formatDate(ticket.trip.arrivalTime) : 'N/A'}</div>
                  </div>
                </div>
                <div className="mb-3">
                  <h6 className="fw-bold border-bottom pb-1 mb-2">Passenger Details</h6>
                  <div className="row g-2">
                    <div className="col-6"><strong>Name:</strong> {ticket.passengerName || 'N/A'}</div>
                    <div className="col-6"><strong>Phone:</strong> {ticket.passengerPhone || 'N/A'}</div>
                    <div className="col-6"><strong>Seat Number:</strong> {ticket.seat?.seatNumber || 'N/A'}</div>
                    <div className="col-6"><strong>Amount:</strong> ₹{ticket.price || '0'}</div>
                    <div className="col-6"><strong>Payment:</strong> {ticket.paymentType || 'CASH'}</div>
                    <div className="col-6"><strong>Date:</strong> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="fw-bold mb-2">QR Code: {ticket.qrCode || 'N/A'}</p>
                  <div className="d-flex justify-content-center">
                    <QRCodeSVG
                      value={`${window.location.origin}/reviews/${ticket.id}`}
                      size={120}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-muted small mt-3">This is a computer generated ticket and does not require a signature.</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center">
              <p>No ticket data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 