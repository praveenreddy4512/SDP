"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { useToast } from "@/components/ui/toast";
import { QRCodeSVG } from 'qrcode.react';
import BusList from '@/components/booking/BusList';
import SeatMap from '@/components/booking/SeatMap';
import SeatMapModern from '../components/booking/SeatMapModern';

interface Machine {
  id: string;
  name: string;
  location: string;
  routeId: string;
  route: {
    id: string;
    name: string;
    source: string;
    destination: string;
    basePrice: number;
  };
}

interface Bus {
  id: string;
  busNumber: string;
  busType: string;
  totalSeats: number;
  vendor: {
    name: string;
  };
  route: {
    source: string;
    destination: string;
  };
}

interface Trip {
  id: string;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  bus: Bus;
  fare?: number;
}

interface Seat {
  id: string;
  seatNumber: number;
  status: 'AVAILABLE' | 'BOOKED' | 'RESERVED' | 'UNAVAILABLE';
  ticketId?: string | null;
}

interface Ticket {
  id: string;
  passengerName: string;
  passengerPhone: string;
  seat?: {
    seatNumber: number;
  };
  trip?: {
    departureTime: string;
    route?: {
      source: string;
      destination: string;
    };
    bus?: {
      name: string;
      busNumber: string;
    };
    fare: number;
  };
}

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: Seat[];
  onSelectSeat: (seat: Seat) => void;
  totalSeats: number;
  seatPrice: number;
}

export default function MachinePage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [ticketDetails, setTicketDetails] = useState<Ticket | null>(null);
  const [timeSlot, setTimeSlot] = useState<'MORNING' | 'AFTERNOON' | 'EVENING' | null>(null);
  const [busType, setBusType] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Load machines on initial render
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/machines?public=true');
        if (!response.ok) {
          throw new Error('Failed to fetch machines');
        }
        const data = await response.json();
        setMachines(data);
        
        // If there's only one machine, select it automatically
        if (data.length === 1) {
          setSelectedMachine(data[0]);
          await loadTripsForMachine(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching machines:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load machines. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMachines();
  }, []);
  
  const handleMachineSelect = (machine: Machine) => {
    setSelectedMachine(machine);
    setSelectedTrip(null);
    setSelectedSeats([]);
    setBookingStep(2);
    loadTripsForMachine(machine.id);
  };
  
  const loadTripsForMachine = async (machineId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/machines/${machineId}/trips`);
      const data = await response.json();
      setTrips(data);
    } catch (error) {
      console.error('Error loading trips:', error);
      setError('Failed to load trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load seats for selected trip
  const loadSeatsForTrip = async (tripId: string) => {
    if (!tripId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/seats?tripId=${tripId}`);
      
      if (!response.ok) {
        console.error('Error response from seats API:', await response.text());
        throw new Error(`Failed to fetch seats: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Seats data received:', data);
      
      if (!Array.isArray(data) || data.length === 0) {
        console.log('No seats found, attempting to create seats for trip');
        
        // Try to create seats for this trip
        const createResponse = await fetch('/api/seats/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tripId,
            totalSeats: selectedTrip?.bus.totalSeats || 40
          }),
        });
        
        if (createResponse.ok) {
          const createdSeats = await createResponse.json();
          console.log('Created seats:', createdSeats);
          setSeats(createdSeats);
        } else {
          console.error('Failed to create seats:', await createResponse.text());
          // Generate placeholder seats as fallback
          generatePlaceholderSeats();
        }
      } else {
        setSeats(data);
      }
    } catch (error) {
      console.error('Error loading seats:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load seats. Using placeholder seats instead.",
      });
      
      // Generate placeholder seats as fallback
      generatePlaceholderSeats();
    } finally {
      setLoading(false);
    }
  };
  
  // Add a helper function to generate placeholder seats
  const generatePlaceholderSeats = () => {
    if (!selectedTrip) return;
    
    const placeholderSeats: Seat[] = Array.from(
      { length: selectedTrip.bus.totalSeats || 40 }, 
      (_, i) => ({
        id: `placeholder-${i + 1}`,
        seatNumber: i + 1,
        status: 'AVAILABLE' as const
      })
    );
    setSeats(placeholderSeats);
  };
  
  const handleTripSelect = (trip: Trip) => {
    setSelectedTrip(trip);
    setSelectedSeats([]);
    setBookingStep(3);
    loadSeatsForTrip(trip.id);
  };
  
  const handleSeatSelect = (seat: Seat) => {
    if (seat.status !== 'AVAILABLE') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "This seat is not available for booking.",
      });
      return;
    }
    setSelectedSeats([seat]);
  };
  
  const handleBookTicket = async () => {
    if (!selectedMachine || !selectedTrip || selectedSeats.length === 0 || !passengerName || !passengerPhone) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields.",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Calculate the correct fare including premium seat surcharge if applicable
      const seatPrice = selectedTrip.fare || 0;
      const isPremiumSeat = selectedSeats[0].seatNumber <= 10;
      const finalPrice = isPremiumSeat ? seatPrice + 50 : seatPrice;
      
      // Log the request payload for debugging
      console.log('Booking ticket with data:', {
        tripId: selectedTrip.id,
        seatIds: selectedSeats.map(seat => seat.id),
        passengerName,
        passengerPhone,
        paymentType: 'CASH',
        machineId: selectedMachine.id,
        price: finalPrice
      });
      
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: selectedTrip.id,
          seatIds: selectedSeats.map(seat => seat.id),
          passengerName,
          passengerPhone,
          paymentType: 'CASH',
          machineId: selectedMachine.id,
          price: finalPrice,
        }),
      });
      
      // For better debugging, log the entire response
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error: ${response.status}` }));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to book ticket');
      }
      
      const data = await response.json();
      console.log('Ticket booked successfully:', data);

      // Create a more complete ticket details object with fallbacks
      const ticketData: Ticket = {
        id: data.id || `ticket-${Date.now()}`,
        passengerName: data.passengerName || passengerName,
        passengerPhone: data.passengerPhone || passengerPhone,
        seat: {
          seatNumber: data.seat?.seatNumber || selectedSeats[0].seatNumber
        },
        trip: {
          departureTime: data.trip?.departureTime || selectedTrip.departureTime,
          route: {
            source: data.trip?.route?.source || selectedTrip.bus.route?.source || '',
            destination: data.trip?.route?.destination || selectedTrip.bus.route?.destination || ''
          },
          bus: {
            name: data.trip?.bus?.name || selectedTrip.bus.vendor?.name || '',
            busNumber: data.trip?.bus?.busNumber || selectedTrip.bus.busNumber || ''
          },
          fare: data.trip?.fare || calculateSeatPrice(selectedSeats[0].seatNumber, selectedTrip.fare || 0)
        }
      };

      setTicketDetails(ticketData);
      setBookingStep(5);
      
      toast({
        title: "Success",
        description: "Ticket booked successfully!",
      });
    } catch (error) {
      console.error('Error booking ticket:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not book ticket. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const resetBooking = () => {
    setSelectedTrip(null);
    setSelectedSeats([]);
    setPassengerName("");
    setPassengerPhone("");
    setTicketDetails(null);
    setBookingStep(1);
  };
  
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const filteredTrips = trips.filter(trip => {
    let matchesTimeSlot = true;
    let matchesBusType = true;
    
    if (timeSlot) {
      const departureHour = new Date(trip.departureTime).getHours();
      
      if (timeSlot === 'MORNING' && (departureHour < 5 || departureHour >= 12)) {
        matchesTimeSlot = false;
      } else if (timeSlot === 'AFTERNOON' && (departureHour < 12 || departureHour >= 17)) {
        matchesTimeSlot = false;
      } else if (timeSlot === 'EVENING' && (departureHour < 17 || departureHour >= 22)) {
        matchesTimeSlot = false;
      }
    }
    
    if (busType && trip.bus.busType !== busType) {
      matchesBusType = false;
    }
    
    return matchesTimeSlot && matchesBusType;
  });

  const handleSelectTrip = (trip: Trip) => {
    setSelectedTrip(trip);
  };

  const handleSelectSeat = (seat: Seat) => {
    if (seat.status !== 'AVAILABLE') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "This seat is not available for booking.",
      });
      return;
    }
    setSelectedSeats([seat]);
  };
  
  // Machine selection screen
  const renderMachineSelection = () => (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 fw-bold mb-3">Select a Machine</h2>
              {error && (
                <div className="alert alert-danger text-center mb-3">{error}</div>
              )}
              <div className="row g-3">
                {machines.map((machine) => (
                  <div key={machine.id} className="col-md-6">
                    <div
                      className={`card h-100 border-2 ${selectedMachine?.id === machine.id ? 'border-primary shadow' : 'border-light'}`}
                      onClick={() => handleMachineSelect(machine)}
                      style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                    >
                      <div className="card-body">
                        <h5 className="card-title fw-bold mb-2"><i className="bi bi-pc-display-horizontal me-2 text-primary"></i>{machine.name}</h5>
                        <p className="mb-1 text-muted small"><i className="bi bi-geo-alt me-1"></i>Location: {machine.location}</p>
                        <p className="mb-0 text-muted small">
                          <i className="bi bi-signpost-2 me-1"></i>Route: {machine.route.name}<br />
                          {machine.route.source} → {machine.route.destination}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Trip selection screen
  const renderTripSelection = () => {
    return (
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-md-10">
            <div className="card shadow">
              <div className="card-header bg-primary bg-opacity-10 border-bottom py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h2 className="h5 fw-bold m-0">Select a Bus</h2>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setBookingStep(1)}
                  >
                    &larr; Change Terminal
                  </button>
                </div>
              </div>
              <div className="card-body">
                {selectedMachine && (
                  <div className="alert alert-primary bg-primary bg-opacity-10 border-primary border-opacity-25 d-flex">
                    <div className="me-3">
                      <i className="bi bi-geo-alt-fill fs-4 text-primary"></i>
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">
                        {selectedMachine.route.source} → {selectedMachine.route.destination}
                      </h6>
                      <p className="mb-0 small text-muted">
                        Terminal: {selectedMachine.name} | Base Fare: ₹{selectedMachine.route.basePrice}
                      </p>
                    </div>
                  </div>
                )}

                <div className="card mb-4 border shadow-sm">
                  <div className="card-header bg-light">
                    <h5 className="h6 fw-semibold m-0">
                      <i className="bi bi-funnel me-2"></i>
                      Filter Options
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-medium">Time of Day</label>
                        <div className="d-flex flex-wrap gap-2">
                          <button
                            className={`btn btn-sm ${timeSlot === 'MORNING' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setTimeSlot(timeSlot === 'MORNING' ? null : 'MORNING')}
                          >
                            <i className="bi bi-sunrise me-1"></i>
                            Morning
                          </button>
                          <button
                            className={`btn btn-sm ${timeSlot === 'AFTERNOON' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setTimeSlot(timeSlot === 'AFTERNOON' ? null : 'AFTERNOON')}
                          >
                            <i className="bi bi-sun me-1"></i>
                            Afternoon
                          </button>
                          <button
                            className={`btn btn-sm ${timeSlot === 'EVENING' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setTimeSlot(timeSlot === 'EVENING' ? null : 'EVENING')}
                          >
                            <i className="bi bi-moon me-1"></i>
                            Evening
                          </button>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">Bus Type</label>
                        <div className="d-flex flex-wrap gap-2">
                          <button
                            className={`btn btn-sm ${busType === 'AC' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setBusType(busType === 'AC' ? null : 'AC')}
                          >
                            <i className="bi bi-snow me-1"></i>
                            AC
                          </button>
                          <button
                            className={`btn btn-sm ${busType === 'NON_AC' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setBusType(busType === 'NON_AC' ? null : 'NON_AC')}
                          >
                            <i className="bi bi-fan me-1"></i>
                            Non-AC
                          </button>
                          <button
                            className={`btn btn-sm ${busType === 'SLEEPER' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setBusType(busType === 'SLEEPER' ? null : 'SLEEPER')}
                          >
                            <i className="bi bi-lamp me-1"></i>
                            Sleeper
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <h5 className="h6 fw-semibold mb-3">
                  <i className="bi bi-bus-front me-2"></i>
                  Available Buses ({filteredTrips.length})
                </h5>
                
                {filteredTrips.length === 0 ? (
                  <div className="alert alert-warning">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                      <div>
                        <h6 className="fw-bold mb-1">No trips found</h6>
                        <p className="mb-0">Please try a different filter or check back later.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="list-group shadow-sm">
                    {filteredTrips.map(trip => (
                      <div
                        key={trip.id}
                        className={`list-group-item list-group-item-action p-0 overflow-hidden ${selectedTrip?.id === trip.id ? 'active' : ''}`}
                        role="button"
                        onClick={() => handleTripSelect(trip)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="row g-0">
                          <div className="col-md-8">
                            <div className="p-3">
                              <div className="d-flex justify-content-between">
                                <h6 className="mb-1 fw-bold">{formatDateTime(trip.departureTime)}</h6>
                                <span className={`badge ${trip.availableSeats > 10 ? 'bg-success' : trip.availableSeats > 5 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                  {trip.availableSeats} seats
                                </span>
                              </div>
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-bus-front me-2 text-primary"></i>
                                <span className="fw-medium">{trip.bus.busNumber}</span>
                                <span className="mx-2 text-muted">|</span>
                                <span className="small">{trip.bus.vendor.name}</span>
                                <span className="mx-2 text-muted">|</span>
                                <span className="badge bg-light text-dark border">{trip.bus.busType}</span>
                              </div>
                              <div className="small text-muted">
                                <i className="bi bi-geo-alt me-1"></i>
                                {trip.bus.route?.source || 'Unknown'} → {trip.bus.route?.destination || 'Unknown'}
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4 d-none d-md-block border-start">
                            <div className="h-100 d-flex flex-column justify-content-center align-items-center p-3 bg-light">
                              <div className="text-center">
                                <div className="fs-5 fw-bold text-success mb-1">₹{trip.fare}</div>
                                <div className="small text-muted">per seat</div>
                              </div>
                              <div className="mt-2">
                                <a 
                                  href="#"
                                  className="btn btn-sm btn-primary" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleTripSelect(trip);
                                  }}
                                >
                                  Select Trip
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Seat selection screen
  const renderSeatSelection = () => {
    // Helper function to handle seat selection with type conversion
    const handleSeatSelection = (seat: any) => {
      // Ensure the seat has the right shape before passing it to handleSelectSeat
      const normalizedSeat: Seat = {
        id: seat.id,
        seatNumber: Number(seat.seatNumber),
        status: seat.status,
        ticketId: seat.ticketId
      };
      handleSelectSeat(normalizedSeat);
    };
    
    return (
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-md-10">
            <div className="card shadow">
              <div className="card-header bg-primary bg-opacity-10 border-bottom py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h2 className="h5 fw-bold m-0">Select a Seat</h2>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setBookingStep(2)}
                  >
                    &larr; Back to Trips
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="alert alert-info rounded-0 mb-0 p-3 d-flex gap-3 align-items-center">
                  <i className="bi bi-info-circle fs-4"></i>
                  <div>
                    <div className="fw-semibold">{selectedTrip?.bus.route?.source || 'Unknown'} → {selectedTrip?.bus.route?.destination || 'Unknown'}</div>
                    <div className="small text-muted">
                      <span className="me-3"><i className="bi bi-calendar-event me-1"></i>{formatDateTime(selectedTrip?.departureTime || '')}</span>
                      <span><i className="bi bi-bus-front me-1"></i>{selectedTrip?.bus.busNumber} ({selectedTrip?.bus.busType})</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  {/* Use our new component with the type-safe handler */}
                  <SeatMapModern
                    seats={seats}
                    selectedSeats={selectedSeats}
                    onSelectSeat={(seat) => handleSeatSelection({ ...seat, seatNumber: Number(seat.seatNumber) })}
                    totalSeats={selectedTrip?.bus.totalSeats || 0}
                    seatPrice={selectedTrip?.fare || 0}
                  />
                </div>
                
                {selectedSeats.length > 0 && (
                  <div className="p-4 border-top d-flex justify-content-between align-items-center bg-light">
                    <div>
                      <div className="fw-bold">Selected Seats: {selectedSeats.map(seat => seat.seatNumber).join(', ')}</div>
                      <div className="small text-muted">
                        {selectedSeats.length > 1 ? 'Multiple seats selected' : '1 seat selected'}
                      </div>
                    </div>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setBookingStep(4)}
                      disabled={selectedSeats.length === 0}
                    >
                      {selectedSeats.length > 0 ? 'Continue to Passenger Details' : 'Select a seat to continue'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Add a helper function to calculate seat price
  const calculateSeatPrice = (seatNumber: number | undefined, baseFare: number = 0) => {
    if (!seatNumber) return baseFare;
    
    const isPremiumSeat = Number(seatNumber) <= 10;
    return isPremiumSeat ? baseFare + 50 : baseFare;
  };
  
  // Passenger details screen
  const renderPassengerDetails = () => (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary bg-opacity-10 border-bottom py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="h5 fw-bold m-0">Passenger Details</h2>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setBookingStep(3)}
                >
                  &larr; Back to Seat Selection
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Booking summary */}
              <div className="alert alert-light border mb-4">
                <div className="row">
                  <div className="col-md-6 mb-3 mb-md-0">
                    <h6 className="mb-2 text-primary">Trip Details</h6>
                    <div className="small">
                      <div className="d-flex mb-1">
                        <div className="text-muted" style={{ width: '90px' }}>Route:</div>
                        <div className="fw-medium">{selectedTrip?.bus.route?.source || 'Unknown'} → {selectedTrip?.bus.route?.destination || 'Unknown'}</div>
                      </div>
                      <div className="d-flex mb-1">
                        <div className="text-muted" style={{ width: '90px' }}>Departure:</div>
                        <div className="fw-medium">{formatDateTime(selectedTrip?.departureTime || '')}</div>
                      </div>
                      <div className="d-flex">
                        <div className="text-muted" style={{ width: '90px' }}>Bus:</div>
                        <div className="fw-medium">{selectedTrip?.bus.busNumber} ({selectedTrip?.bus.busType})</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="mb-2 text-primary">Seat Information</h6>
                    <div className="small">
                      <div className="d-flex mb-1">
                        <div className="text-muted" style={{ width: '90px' }}>Seat Numbers:</div>
                        <div className="fw-medium">{selectedSeats.map(seat => seat.seatNumber).join(', ')}</div>
                      </div>
                      <div className="d-flex mb-1">
                        <div className="text-muted" style={{ width: '90px' }}>Prices:</div>
                        <div className="fw-medium">
                          {selectedSeats.map(seat => calculateSeatPrice(seat.seatNumber, selectedTrip?.fare || 0)).join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleBookTicket(); }}>
                <div className="mb-4">
                  <label htmlFor="passengerName" className="form-label">Full Name <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      id="passengerName"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      placeholder="Enter passenger's full name"
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="passengerPhone" className="form-label">Phone Number <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-telephone"></i>
                    </span>
                    <input
                      type="tel"
                      className="form-control"
                      id="passengerPhone"
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      placeholder="Enter passenger's mobile number"
                      required
                    />
                  </div>
                  <div className="form-text">We'll send ticket confirmation to this number.</div>
                </div>
                <hr className="mb-4" />
                <div className="d-flex justify-content-between align-items-center">
                  <div className="fw-bold">
                    Total Amount: 
                    <span className="text-success">
                      {selectedSeats.map(seat => calculateSeatPrice(seat.seatNumber, selectedTrip?.fare || 0)).reduce((total, price) => total + price, 0)}
                    </span>
                  </div>
                  <button type="submit" className="btn btn-success btn-lg" disabled={loading}>
                    {loading ? (
                      <span><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Book Ticket</span>
                    ) : (
                      'Book Ticket'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Ticket confirmation screen
  const renderTicketConfirmation = () => (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow overflow-hidden">
            <div className="card-header bg-success bg-opacity-10 border-bottom py-4 text-center position-relative">
              <div className="position-absolute top-0 start-0 w-100 opacity-10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                  <path fill="#198754" d="M0,160L48,149.3C96,139,192,117,288,138.7C384,160,480,224,576,218.7C672,213,768,139,864,117.3C960,96,1056,128,1152,138.7C1248,149,1344,139,1392,133.3L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
                </svg>
              </div>
              <div className="position-relative">
                <div className="d-inline-flex justify-content-center align-items-center bg-white rounded-circle p-3 mb-3 shadow-sm">
                  <i className="bi bi-check-circle-fill text-success fs-2"></i>
                </div>
                <h2 className="h4 fw-bold text-success mb-1">Ticket Booked Successfully!</h2>
                <p className="text-muted mb-0">Your journey is now confirmed. Safe travels!</p>
              </div>
            </div>
            <div className="card-body p-0">
              {/* Ticket design */}
              <div className="p-4 border-bottom">
                <div className="ticket-container bg-white border rounded-3 shadow-sm overflow-hidden">
                  {/* Ticket header */}
                  <div className="bg-primary text-white px-4 py-3 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="small text-uppercase opacity-75">Bus Ticket</div>
                      <div className="fw-bold fs-5">{ticketDetails?.trip?.route?.source || 'Unknown'} → {ticketDetails?.trip?.route?.destination || 'Unknown'}</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">₹{ticketDetails?.trip?.fare}</div>
                      <div className="opacity-75 small">{ticketDetails?.id?.substring(0, 8)}</div>
                    </div>
                  </div>
                  
                  {/* Departure info */}
                  <div className="px-4 py-3 bg-light border-bottom">
                    <div className="row align-items-center">
                      <div className="col-md-6 mb-2 mb-md-0">
                        <div className="small text-uppercase text-muted">Departure</div>
                        <div className="fw-bold">{formatDateTime(ticketDetails?.trip?.departureTime || '')}</div>
                      </div>
                      <div className="col-md-6 text-md-end">
                        <div className="small text-uppercase text-muted">Bus Details</div>
                        <div className="fw-bold">{ticketDetails?.trip?.bus?.busNumber}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Passenger details */}
                  <div className="px-4 py-3 border-bottom">
                    <div className="row">
                      <div className="col-md-6 mb-3 mb-md-0">
                        <div className="small text-uppercase text-muted">Passenger</div>
                        <div className="fw-bold">{ticketDetails?.passengerName}</div>
                        <div className="small text-muted">{ticketDetails?.passengerPhone}</div>
                      </div>
                      <div className="col-md-6">
                        <div className="small text-uppercase text-muted">Seats</div>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-2 fw-bold me-2">
                            {selectedSeats.map(seat => seat.seatNumber).join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* QR Code */}
                  <div className="p-4 text-center">
                    <div className="small text-muted mb-2">Scan for verification</div>
                    <div className="bg-white d-inline-block p-2 border rounded shadow-sm">
                      <QRCodeSVG value={ticketDetails?.id || ''} size={150} />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Important notice */}
              <div className="alert alert-light border-0 rounded-0 mb-0">
                <div className="d-flex">
                  <div className="flex-shrink-0">
                    <i className="bi bi-info-circle-fill text-primary fs-5"></i>
                  </div>
                  <div className="ms-3">
                    <p className="mb-1">Please arrive at the bus station at least 15 minutes before the scheduled departure time.</p>
                    <p className="mb-0">Your ticket has been sent to your phone number. Show this QR code to the conductor.</p>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="p-4 border-top bg-light d-flex flex-column flex-md-row justify-content-center gap-3">
                <button 
                  className="btn btn-primary"
                  onClick={resetBooking}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Book Another Ticket
                </button>
                <Link 
                  href="/" 
                  className="btn btn-outline-secondary"
                >
                  <i className="bi bi-house me-2"></i>
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render the appropriate step
  const renderStep = () => {
    switch (bookingStep) {
      case 1:
        return renderMachineSelection();
      case 2:
        return renderTripSelection();
      case 3:
        return renderSeatSelection();
      case 4:
        return renderPassengerDetails();
      case 5:
        return renderTicketConfirmation();
      default:
        return null;
    }
  };
  
  return (
    <div className="min-vh-100 bg-light py-4">
      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-75">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      {renderStep()}
    </div>
  );
} 