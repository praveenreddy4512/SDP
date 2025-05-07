'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SeatMapModern from '../../components/booking/SeatMapModern';
import BusList from '@/app/components/booking/BusList';
import TicketQRCode from '@/app/components/booking/TicketQRCode';
import { QRCodeSVG } from 'qrcode.react';

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
  seatNumber: number | string;
  status: 'AVAILABLE' | 'BOOKED' | 'RESERVED' | 'UNAVAILABLE';
  ticketId?: string | null;
}

interface Trip {
  id: string;
  departureTime: string | Date;
  arrivalTime: string | Date;
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
  trip: {
    id: string;
    bus: {
      id: string;
      busNumber: string;
      route: {
        source: string;
        destination: string;
      };
    };
    departureTime: string;
  };
  passengerName: string;
  passengerPhone: string;
  price: number;
  seat: {
    id: string;
    seatNumber: number;
  };
}

enum BookingStep {
  SELECT_BUS = 'SELECT_BUS',
  SELECT_SEAT = 'SELECT_SEAT',
  PASSENGER_DETAILS = 'PASSENGER_DETAILS',
  PAYMENT = 'PAYMENT',
  TICKET_GENERATED = 'TICKET_GENERATED',
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
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
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  
  const [timeSlot, setTimeSlot] = useState<'MORNING' | 'AFTERNOON' | 'EVENING' | null>(null);
  const [busType, setBusType] = useState<string | null>(null);
  
  const [bookingStep, setBookingStep] = useState<BookingStep>(BookingStep.SELECT_BUS);
  
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'QR' | 'CASH'>('QR');
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  
  // Fetch machine details
  useEffect(() => {
    const fetchMachine = async () => {
      try {
        const response = await fetch(`/api/machines/${machineId}`);
        if (!response.ok) {
          throw new Error('Machine not found or inactive');
        }
        const data = await response.json();
        setMachine(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMachine();
  }, [machineId]);

  // Fetch trips
  const fetchTrips = async () => {
    setTripsLoading(true);
    try {
      const response = await fetch(`/api/trips?machineId=${machineId}&timeSlot=${timeSlot || ''}&busType=${busType || ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      setTrips(data);
    } catch (err: any) {
      setError(err.message);
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
      setSeats(Array.isArray(seatsData) ? seatsData : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter trips when filters change
  useEffect(() => {
    if (machineId) {
      fetchTrips();
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
    const isSeatSelected = selectedSeats.some(s => s.id === seat.id);
    if (isSeatSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  // Calculate ticket price
  const calculatePrice = () => {
    if (!machine || selectedSeats.length === 0) return 0;
    return selectedSeats.reduce((total, seat) => {
      const basePrice = machine.route.basePrice;
      const seatPremium = Number(seat.seatNumber) <= 10 ? 50 : 0;
      return total + basePrice + seatPremium;
    }, 0);
  };

  // Process payment and book ticket
  const handleBookTicket = async () => {
    if (!selectedTrip || selectedSeats.length === 0 || !passengerName || !passengerPhone) {
      setBookingError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setBookingError(null);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: selectedTrip.id,
          seatIds: selectedSeats.map(seat => seat.id),
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
      setBookingError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle going back to route selection
  const handleStartNewBooking = () => {
    setSelectedTrip(null);
    setSelectedSeats([]);
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Self Service POS</h1>
              <p className="text-sm text-gray-600">{machine.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{machine.route.source} → {machine.route.destination}</p>
              <p className="text-xs text-gray-600">Base Price: ₹{machine.route.basePrice}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {bookingStep === BookingStep.SELECT_BUS && (
          <div className="space-y-6">
            <Card className="mb-6">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Filter Buses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time of Day</label>
                    <div className="flex flex-wrap gap-2">
                      {['MORNING', 'AFTERNOON', 'EVENING'].map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setTimeSlot(timeSlot === slot ? null : slot as any)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            timeSlot === slot
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {slot.charAt(0) + slot.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type</label>
                    <div className="flex flex-wrap gap-2">
                      {['AC', 'NON_AC', 'SLEEPER', 'SEATER'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setBusType(busType === type ? null : type)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            busType === type
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {type.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Available Buses</h2>
              {tripsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : trips.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-gray-600">No buses found matching your criteria</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {trips.map((trip) => (
                    <Card
                      key={trip.id}
                      className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleSelectTrip(trip)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-lg">{trip.bus.busNumber}</h3>
                          <p className="text-sm text-gray-600">{trip.bus.vendor.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{trip.bus.busType.includes('AC') ? 250 : 150}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(trip.departureTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
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

            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-4">
                <h2 className="text-xl font-semibold text-blue-800">Select Your Seats</h2>
                <p className="text-blue-600 text-sm mt-1">
                  {selectedTrip.bus.busNumber} • {selectedTrip.bus.vendor.name} • {selectedTrip.bus.busType}
                </p>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <SeatMapModern
                    seats={seats}
                    totalSeats={selectedTrip.bus.totalSeats}
                    onSelectSeat={handleSelectSeat}
                    selectedSeats={selectedSeats}
                    seatPrice={machine.route.basePrice}
                  />
                )}
              </div>

              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Selected {selectedSeats.length} {selectedSeats.length === 1 ? 'seat' : 'seats'}
                    </p>
                    <p className="font-medium text-gray-900">₹{calculatePrice()}</p>
                  </div>
                  <Button
                    onClick={() => setBookingStep(BookingStep.PASSENGER_DETAILS)}
                    disabled={selectedSeats.length === 0}
                    className="min-w-32"
                  >
                    Continue
                  </Button>
                </div>
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

            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200 px-6 py-4">
                <h2 className="text-xl font-semibold text-indigo-800">Passenger Details</h2>
                <p className="text-indigo-600 text-sm mt-1">Please enter passenger information</p>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="passengerName" className="block text-sm font-medium text-gray-700">
                      Passenger Name
                    </label>
                    <input
                      type="text"
                      id="passengerName"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="passengerPhone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="passengerPhone"
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={() => setBookingStep(BookingStep.PAYMENT)}
                      disabled={!passengerName || !passengerPhone}
                      className="w-full"
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </div>
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

            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 px-6 py-4">
                <h2 className="text-xl font-semibold text-green-800">Payment</h2>
                <p className="text-green-600 text-sm mt-1">Complete your payment to finish booking</p>
              </div>

              <div className="p-6">
                {bookingError && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm">{bookingError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-4">Booking Summary</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Route:</dt>
                        <dd className="font-medium text-gray-900">{machine.route.source} → {machine.route.destination}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Bus:</dt>
                        <dd className="font-medium text-gray-900">{selectedTrip?.bus.busNumber}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Seats:</dt>
                        <dd className="font-medium text-gray-900">{selectedSeats.map(seat => seat.seatNumber).join(', ')}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Passenger:</dt>
                        <dd className="font-medium text-gray-900">{passengerName}</dd>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <dt className="text-gray-900 font-medium">Total Amount:</dt>
                        <dd className="font-bold text-green-600">₹{calculatePrice()}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">Payment Method</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setPaymentMethod('QR')}
                        className={`p-4 rounded-lg border-2 ${
                          paymentMethod === 'QR'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v4m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 20h4M4 16h4m12 0h.01M4 8h4m12 0h.01M8 4h.01M8 20h.01" />
                          </svg>
                          <span>QR Code</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('CASH')}
                        className={`p-4 rounded-lg border-2 ${
                          paymentMethod === 'CASH'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>Cash</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'QR' && (
                    <div className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200">
                      <div className="bg-gradient-to-br from-blue-50 to-green-50 p-3 rounded-lg mb-4">
                        <img
                          src="/payment-qr-placeholder.png"
                          alt="Payment QR Code"
                          className="h-48 w-48"
                        />
                      </div>
                      <p className="text-center text-sm text-gray-600 max-w-sm">
                        Scan this QR code with any UPI payment app to pay ₹{calculatePrice()}
                      </p>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      onClick={handleBookTicket}
                      isLoading={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Complete Payment & Book Ticket
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {bookingStep === BookingStep.TICKET_GENERATED && ticket && (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 px-6 py-4 text-center">
                <div className="bg-white rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-3 shadow-md border border-green-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-800">Ticket Confirmed!</h2>
                <p className="text-green-600 mt-1">Your booking has been confirmed</p>
              </div>

              <div className="p-6">
                <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-blue-600 text-white px-4 py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs uppercase tracking-wider opacity-80">Bus Ticket</div>
                        <div className="font-bold text-lg">{ticket.trip.bus.route.source} → {ticket.trip.bus.route.destination}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₹{ticket.price}</div>
                        <div className="text-xs">Ticket #: {ticket.id.substring(0, 8)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Passenger:</dt>
                        <dd className="font-medium text-gray-900">{ticket.passengerName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Phone:</dt>
                        <dd className="font-medium text-gray-900">{ticket.passengerPhone}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Bus:</dt>
                        <dd className="font-medium text-gray-900">{ticket.trip.bus.busNumber}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Seat:</dt>
                        <dd className="font-medium text-gray-900">{ticket.seat.seatNumber}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Departure:</dt>
                        <dd className="font-medium text-gray-900">
                          {new Date(ticket.trip.departureTime).toLocaleString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                  <Button
                    onClick={handlePrintTicket}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                      </svg>
                      Print Ticket
                    </div>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleStartNewBooking}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Book Another Ticket
                    </div>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default SelfPOSPage; 