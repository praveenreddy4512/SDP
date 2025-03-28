'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import { useReactToPrint } from 'react-to-print';
import printJS from 'print-js';
import Logo from '@/components/Logo';

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
        const response = await fetch('/api/trips');
        
        if (!response.ok) {
          throw new Error('Failed to fetch trips');
        }
        
        const data = await response.json();
        // Only show active trips
        const activeTrips = data.filter((trip: Trip) => 
          trip.status === 'ACTIVE' || trip.status === 'SCHEDULED'
        );
        
        // Sort by departure time (most recent first)
        activeTrips.sort((a: Trip, b: Trip) => 
          new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
        );
        
        setTrips(activeTrips);
        
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-green-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
            <div className="flex items-center">
              <Logo size="medium" color="light" className="mr-4" customLogo={customLogo} />
              <h1 className="text-xl md:text-2xl font-bold">APSRTC Vendor POS - Ticket Booking</h1>
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <Card className="w-full max-w-4xl mx-auto">
            <CardContent>
              <div className="mb-4 md:mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Ticket Booking</h1>
                <p className="text-gray-800">Book tickets for passengers</p>
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 md:p-4 rounded-md mb-4 md:mb-6">
                  {error}
                </div>
              )}
              
              {successMessage && !showTicketModal && (
                <div className="bg-green-50 text-green-600 p-3 md:p-4 rounded-md mb-4 md:mb-6">
                  {successMessage}
                </div>
              )}
              
              <form onSubmit={handleBookTicket} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="trip" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Trip
                    </label>
                    <select
                      id="trip"
                      value={selectedTrip}
                      onChange={handleTripChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select a trip</option>
                      {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.bus.route.source} to {trip.bus.route.destination} - {trip.bus.busNumber} ({formatDate(trip.departureTime)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Payment Method
                      </label>
                      {selectedTrip && (
                        <span className="text-sm text-green-600 font-medium">
                          Available: {tripDetails?.availableSeats || 0} seats
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="paymentType"
                          value="CASH"
                          checked={paymentType === 'CASH'}
                          onChange={() => setPaymentType('CASH')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500"
                        />
                        <span>Cash</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="paymentType"
                          value="QR"
                          checked={paymentType === 'QR'}
                          onChange={() => setPaymentType('QR')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500"
                        />
                        <span>QR Payment</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                {tripDetails && (
                  <div className="mt-2 p-3 bg-green-50 rounded-md">
                    <h3 className="font-semibold text-green-700 mb-1">Trip Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Route:</span> {tripDetails.bus.route.source} to {tripDetails.bus.route.destination}
                      </div>
                      <div>
                        <span className="font-medium">Bus:</span> {tripDetails.bus.busNumber} ({tripDetails.bus.busType})
                      </div>
                      <div>
                        <span className="font-medium">Departure:</span> {formatDate(tripDetails.departureTime)}
                      </div>
                      <div>
                        <span className="font-medium">Arrival:</span> {formatDate(tripDetails.arrivalTime)}
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedTrip && seats.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Seats ({selectedSeats.length} selected)
                    </label>
                    <div className="grid grid-cols-5 md:grid-cols-8 gap-2 mb-4">
                      {seats.map((seat) => (
                        <button
                          key={seat.id}
                          type="button"
                          onClick={() => seat.status === 'AVAILABLE' && handleSeatToggle(seat.id)}
                          disabled={seat.status !== 'AVAILABLE'}
                          className={`
                            p-2 rounded-md font-semibold text-center 
                            ${seat.status === 'AVAILABLE' 
                              ? selectedSeats.includes(seat.id)
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-white text-green-600 border border-green-300 hover:bg-green-50'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }
                          `}
                        >
                          {seat.seatNumber}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-xs md:text-sm justify-center mb-4">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-white border border-green-300 rounded"></div>
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-green-600 rounded"></div>
                        <span>Selected</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-gray-100 rounded"></div>
                        <span>Booked</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="passengerName" className="block text-sm font-medium text-gray-700 mb-1">
                      Passenger Name
                    </label>
                    <input
                      id="passengerName"
                      type="text"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="passengerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      Passenger Phone
                    </label>
                    <input
                      id="passengerPhone"
                      type="tel"
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isLoading || selectedSeats.length === 0}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin h-5 w-5 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      `Book ${selectedSeats.length} ${selectedSeats.length === 1 ? 'Ticket' : 'Tickets'} ${
                        selectedSeats.length > 0 && tripDetails?.bus.busType
                          ? `(₹${
                              (tripDetails.bus.busType.includes('AC') ? 250 : 150) * selectedSeats.length
                            })`
                          : ''
                      }`
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* Ticket Print Modal (Hidden visually but available for printing) */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-green-700">Tickets Booked Successfully!</h2>
            <p>Your tickets are being printed automatically.</p>
            <p className="text-sm text-gray-600 mt-2">If printing doesn't start automatically, click the button below:</p>
            
            <div className="mt-4 flex justify-end space-x-3">
              <Button 
                variant="secondary"
                onClick={() => {
                  setShowTicketModal(false);
                  setSelectedSeats([]);
                  setPassengerName('');
                  setPassengerPhone('');
                  setBookedTickets([]);
                  setSuccessMessage(null);
                }}
              >
                Close
              </Button>
              <Button onClick={handleManualPrint}>
                Print Tickets
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Printable Ticket Template (hidden) */}
      <div className="hidden">
        <div ref={printRef} className="p-8">
          {bookedTickets && bookedTickets.length > 0 ? (
            bookedTickets.map((ticket, index) => (
              <div key={ticket.id} className="mb-8 border-b pb-8" style={{ pageBreakAfter: index < bookedTickets.length - 1 ? 'always' : 'auto' }}>
                <div className="text-center mb-4">
                  <div className="flex justify-center mb-2">
                    <Logo size="small" customLogo={customLogo} />
                  </div>
                  <h1 className="text-xl font-bold">{companyName}</h1>
                  <p className="text-sm">Ticket #{ticket.id.substring(0, 8)}</p>
                </div>
                
                <div className="mb-4">
                  <h2 className="font-bold text-lg mb-2 border-b pb-1">Route Details</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-semibold">From:</span> {ticket.trip?.bus?.route?.source || 'N/A'}</div>
                    <div><span className="font-semibold">To:</span> {ticket.trip?.bus?.route?.destination || 'N/A'}</div>
                    <div><span className="font-semibold">Bus:</span> {ticket.trip?.bus?.busNumber || 'N/A'}</div>
                    <div><span className="font-semibold">Type:</span> {ticket.trip?.bus?.busType || 'N/A'}</div>
                    <div><span className="font-semibold">Departure:</span> {ticket.trip?.departureTime ? formatDate(ticket.trip.departureTime) : 'N/A'}</div>
                    <div><span className="font-semibold">Arrival:</span> {ticket.trip?.arrivalTime ? formatDate(ticket.trip.arrivalTime) : 'N/A'}</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h2 className="font-bold text-lg mb-2 border-b pb-1">Passenger Details</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-semibold">Name:</span> {ticket.passengerName || 'N/A'}</div>
                    <div><span className="font-semibold">Phone:</span> {ticket.passengerPhone || 'N/A'}</div>
                    <div><span className="font-semibold">Seat Number:</span> {ticket.seat?.seatNumber || 'N/A'}</div>
                    <div><span className="font-semibold">Amount:</span> ₹{ticket.price || '0'}</div>
                    <div><span className="font-semibold">Payment:</span> {ticket.paymentType || 'CASH'}</div>
                    <div><span className="font-semibold">Date:</span> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <p className="font-bold">QR Code: {ticket.qrCode || 'N/A'}</p>
                  <p className="text-xs mt-4">This is a computer generated ticket and does not require a signature.</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p>No ticket data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 