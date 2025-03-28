'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SeatMap from '@/components/booking/SeatMap';
import BusList from '@/app/components/booking/BusList';
import TicketQRCode from '@/app/components/booking/TicketQRCode';

interface Machine {
  id: string;
  name: string;
  routeId: string;
  route: {
    id: string;
    name: string;
    source: string;
    destination: string;
    basePrice: number;
  };
}

interface Seat {
  id: string;
  seatNumber: number;
  status: 'AVAILABLE' | 'BOOKED' | 'RESERVED' | 'UNAVAILABLE';
  ticketId?: string | null;
}

interface Trip {
  id: string;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  bus: {
    id: string;
    busNumber: string;
    busType: string;
    totalSeats: number;
    vendor: {
      name: string;
    };
  };
}

interface Ticket {
  id: string;
  qrCode: string;
  seatNumber: number;
  price: number;
  passengerName: string;
  passengerPhone: string;
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

enum BookingStep {
  SELECT_BUS = 'SELECT_BUS',
  SELECT_SEAT = 'SELECT_SEAT',
  PASSENGER_DETAILS = 'PASSENGER_DETAILS',
  PAYMENT = 'PAYMENT',
  TICKET_GENERATED = 'TICKET_GENERATED',
}

const SelfPOSPage = () => {
  const params = useParams();
  const router = useRouter();
  const machineId = params.machineId as string;
  
  const [machine, setMachine] = useState<Machine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  
  const [timeSlot, setTimeSlot] = useState<'MORNING' | 'AFTERNOON' | 'EVENING' | null>(null);
  const [busType, setBusType] = useState<string | null>(null);
  
  const [bookingStep, setBookingStep] = useState<BookingStep>(BookingStep.SELECT_BUS);
  
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'QR' | 'CASH'>('QR');
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  
  // Fetch machine data
  useEffect(() => {
    const fetchMachine = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/machines?id=${machineId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch machine data');
        }
        
        const machineData = await response.json();
        setMachine(machineData);
        
        // Fetch initial trips for this route
        fetchTrips(machineData.routeId);
      } catch (err) {
        setError('Error loading machine data. Please try again.');
        console.error('Error fetching machine:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (machineId) {
      fetchMachine();
    }
  }, [machineId]);
  
  // Fetch trips based on route and filters
  const fetchTrips = async (routeId: string) => {
    setTripsLoading(true);
    
    try {
      let url = `/api/trips?routeId=${routeId}`;
      
      if (timeSlot) {
        url += `&timeSlot=${timeSlot}`;
      }
      
      if (busType) {
        url += `&busType=${busType}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      
      const tripsData = await response.json();
      setTrips(tripsData);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Error loading trips. Please try again.');
    } finally {
      setTripsLoading(false);
    }
  };
  
  // Fetch seats for a selected trip
  const fetchSeats = async (tripId: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/seats?tripId=${tripId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch seats');
      }
      
      const seatsData = await response.json();
      setSeats(seatsData);
    } catch (err) {
      console.error('Error fetching seats:', err);
      setError('Error loading seat map. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter trips when filters change
  useEffect(() => {
    if (machine?.routeId) {
      fetchTrips(machine.routeId);
    }
  }, [timeSlot, busType]);
  
  // Handle trip selection
  const handleSelectTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    fetchSeats(trip.id);
    setBookingStep(BookingStep.SELECT_SEAT);
  };
  
  // Handle seat selection
  const handleSelectSeat = (seat: Seat) => {
    setSelectedSeat(seat);
  };
  
  // Go to passenger details step
  const handleContinueToPassengerDetails = () => {
    if (selectedSeat) {
      setBookingStep(BookingStep.PASSENGER_DETAILS);
    }
  };
  
  // Go to payment step
  const handleContinueToPayment = () => {
    if (passengerName && passengerPhone) {
      setBookingStep(BookingStep.PAYMENT);
    }
  };
  
  // Process payment and book ticket
  const handleBookTicket = async () => {
    if (!selectedTrip || !selectedSeat || !passengerName || !passengerPhone) {
      setBookingError('Missing required information');
      return;
    }
    
    setIsLoading(true);
    setBookingError(null);
    
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: selectedTrip.id,
          seatNumber: selectedSeat.seatNumber,
          passengerName,
          passengerPhone,
          paymentType: paymentMethod,
          price: calculatePrice(),
          machineId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book ticket');
      }
      
      const ticketData = await response.json();
      setTicket(ticketData);
      setBookingStep(BookingStep.TICKET_GENERATED);
    } catch (err: any) {
      console.error('Error booking ticket:', err);
      setBookingError(err.message || 'Failed to book ticket. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate ticket price
  const calculatePrice = () => {
    if (!machine || !selectedSeat) return 0;
    
    // Simple price calculation (base price + seat number adjustment)
    const basePrice = machine.route.basePrice;
    const seatPremium = selectedSeat.seatNumber <= 10 ? 50 : 0; // Premium for first 10 seats
    
    return basePrice + seatPremium;
  };
  
  // Handle going back to route selection
  const handleStartNewBooking = () => {
    setSelectedTrip(null);
    setSelectedSeat(null);
    setPassengerName('');
    setPassengerPhone('');
    setTicket(null);
    setBookingError(null);
    setBookingStep(BookingStep.SELECT_BUS);
  };
  
  // Print ticket
  const handlePrintTicket = () => {
    window.print();
  };
  
  if (isLoading && !machine) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !machine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Machine Error</h2>
            <p className="text-gray-600 mb-6">{error || 'Machine not found or is inactive'}</p>
            <Button onClick={() => router.push('/')}>
              Return Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Self-Ticket Vending Machine</h1>
              <p className="text-blue-100">Terminal ID: {machine.name}</p>
            </div>
            <div className="mt-4 md:mt-0 text-center md:text-right">
              <p className="text-xl font-semibold">{machine.route.source} → {machine.route.destination}</p>
              <p className="text-sm text-blue-100">Route: {machine.route.name}</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {bookingStep === BookingStep.SELECT_BUS && (
          <>
            <Card className="mb-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Filter Buses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Time of Day</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={`px-4 py-2 rounded-md text-sm ${timeSlot === 'MORNING' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => setTimeSlot(timeSlot === 'MORNING' ? null : 'MORNING')}
                      >
                        Morning
                      </button>
                      <button
                        className={`px-4 py-2 rounded-md text-sm ${timeSlot === 'AFTERNOON' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => setTimeSlot(timeSlot === 'AFTERNOON' ? null : 'AFTERNOON')}
                      >
                        Afternoon
                      </button>
                      <button
                        className={`px-4 py-2 rounded-md text-sm ${timeSlot === 'EVENING' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => setTimeSlot(timeSlot === 'EVENING' ? null : 'EVENING')}
                      >
                        Evening
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Bus Type</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={`px-4 py-2 rounded-md text-sm ${busType === 'AC' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => setBusType(busType === 'AC' ? null : 'AC')}
                      >
                        AC
                      </button>
                      <button
                        className={`px-4 py-2 rounded-md text-sm ${busType === 'NON_AC' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => setBusType(busType === 'NON_AC' ? null : 'NON_AC')}
                      >
                        Non-AC
                      </button>
                      <button
                        className={`px-4 py-2 rounded-md text-sm ${busType === 'SLEEPER' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => setBusType(busType === 'SLEEPER' ? null : 'SLEEPER')}
                      >
                        Sleeper
                      </button>
                      <button
                        className={`px-4 py-2 rounded-md text-sm ${busType === 'SEATER' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => setBusType(busType === 'SEATER' ? null : 'SEATER')}
                      >
                        Seater
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            <h2 className="text-xl font-semibold mb-4">Available Buses</h2>
            <BusList 
              trips={trips} 
              onSelectTrip={handleSelectTrip} 
              isLoading={tripsLoading} 
            />
          </>
        )}
        
        {bookingStep === BookingStep.SELECT_SEAT && selectedTrip && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setBookingStep(BookingStep.SELECT_BUS)}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Bus Selection
              </button>
            </div>
            
            <Card>
              <h2 className="text-xl font-semibold mb-2">Select Your Seat</h2>
              <p className="text-gray-600 mb-6">
                {selectedTrip.bus.busNumber} • {selectedTrip.bus.vendor.name} • {new Date(selectedTrip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <SeatMap
                  seats={seats}
                  totalSeats={selectedTrip.bus.totalSeats}
                  onSelectSeat={handleSelectSeat}
                  selectedSeat={selectedSeat}
                  seatPrice={calculatePrice()}
                />
              )}
              
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleContinueToPassengerDetails}
                  disabled={!selectedSeat}
                >
                  Continue
                </Button>
              </div>
            </Card>
          </div>
        )}
        
        {bookingStep === BookingStep.PASSENGER_DETAILS && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setBookingStep(BookingStep.SELECT_SEAT)}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Seat Selection
              </button>
            </div>
            
            <Card>
              <h2 className="text-xl font-semibold mb-6">Passenger Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="passengerName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="passengerName"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter passenger's full name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="passengerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="passengerPhone"
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter passenger's phone number"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleContinueToPayment}
                  disabled={!passengerName || !passengerPhone}
                >
                  Continue to Payment
                </Button>
              </div>
            </Card>
          </div>
        )}
        
        {bookingStep === BookingStep.PAYMENT && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setBookingStep(BookingStep.PASSENGER_DETAILS)}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Passenger Details
              </button>
            </div>
            
            <Card>
              <h2 className="text-xl font-semibold mb-4">Payment</h2>
              
              {bookingError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
                  {bookingError}
                </div>
              )}
              
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h3 className="font-medium text-gray-800 mb-2">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Route:</span>
                    <span className="font-medium">{machine.route.source} → {machine.route.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bus:</span>
                    <span className="font-medium">{selectedTrip?.bus.busNumber} ({selectedTrip?.bus.vendor.name})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Departure:</span>
                    <span className="font-medium">{selectedTrip && new Date(selectedTrip.departureTime).toLocaleString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seat Number:</span>
                    <span className="font-medium">{selectedSeat?.seatNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Passenger:</span>
                    <span className="font-medium">{passengerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span className="font-medium">{passengerPhone}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total Amount:</span>
                      <span>₹{calculatePrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 className="font-medium text-gray-800 mb-3">Select Payment Method</h3>
              <div className="space-y-3 mb-6">
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      className="form-radio h-5 w-5 text-blue-600"
                      checked={paymentMethod === 'QR'}
                      onChange={() => setPaymentMethod('QR')}
                    />
                    <span className="ml-2">QR Code Payment</span>
                  </label>
                </div>
                
                {paymentMethod === 'QR' && (
                  <div className="bg-gray-50 p-4 rounded-md mt-2">
                    <div className="flex justify-center mb-3">
                      <div className="bg-white p-2 rounded-md border">
                        <img
                          src="/payment-qr-placeholder.png" // Replace with an actual QR image
                          alt="Payment QR Code"
                          className="h-48 w-48"
                        />
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-600">
                      Scan this QR code with your payment app to pay ₹{calculatePrice().toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handleBookTicket}
                  isLoading={isLoading}
                >
                  Complete Payment & Book Ticket
                </Button>
              </div>
            </Card>
          </div>
        )}
        
        {bookingStep === BookingStep.TICKET_GENERATED && ticket && (
          <div className="space-y-6">
            <Card>
              <div className="text-center mb-4">
                <div className="mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Ticket Confirmed!</h2>
                <p className="text-gray-600">Your booking has been confirmed and your ticket is ready.</p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                {/* Ticket Details */}
                <div className="flex flex-col items-center justify-center mb-6">
                  <h3 className="text-xl font-bold mb-1">
                    {ticket.trip.bus.route.source} → {ticket.trip.bus.route.destination}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {new Date(ticket.trip.departureTime).toLocaleString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-6">
                    <div>
                      <span className="text-gray-600">Bus Number:</span>
                      <span className="ml-1 font-medium">{ticket.trip.bus.busNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Seat Number:</span>
                      <span className="ml-1 font-medium">{ticket.seatNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Passenger:</span>
                      <span className="ml-1 font-medium">{ticket.passengerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-1 font-medium">{ticket.passengerPhone}</span>
                    </div>
                  </div>
                  
                  {/* QR Code */}
                  <TicketQRCode 
                    ticketId={ticket.id} 
                    qrCodeData={ticket.qrCode} 
                    size={150} 
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button onClick={handlePrintTicket}>
                  Print Ticket
                </Button>
                <Button variant="secondary" onClick={handleStartNewBooking}>
                  Book Another Ticket
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default SelfPOSPage; 