"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { useToast } from "@/components/ui/toast";

interface Machine {
  id: string;
  name: string;
  location: string;
  routeId: string;
  isActive: boolean;
}

interface Route {
  id: string;
  name: string;
  source: string;
  destination: string;
}

interface Trip {
  id: string;
  departureTime: string;
  availableSeats: number;
  fare: number;
  bus: {
    name: string;
    busNumber: string;
  };
  route: {
    name: string;
    source: string;
    destination: string;
  };
}

interface Seat {
  id: string;
  seatNumber: string;
  status: string;
}

export default function MachinePage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<string>("");
  const [passengerName, setPassengerName] = useState<string>("");
  const [passengerPhone, setPassengerPhone] = useState<string>("");
  const [bookingStep, setBookingStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  
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
          setSelectedMachine(data[0].id);
          await loadRoutesForMachine(data[0].id);
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
  
  // Load routes for selected machine
  const loadRoutesForMachine = async (machineId: string) => {
    if (!machineId) return;
    
    try {
      setLoading(true);
      // First get the machine details to get the routeId
      const response = await fetch(`/api/machines?id=${machineId}&public=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch machine details');
      }
      const machineData = await response.json();
      
      // Then fetch all routes
      const routesResponse = await fetch('/api/routes/public');
      if (!routesResponse.ok) {
        throw new Error('Failed to fetch routes');
      }
      const routesData = await routesResponse.json();
      setRoutes(routesData);
      
      // Auto-select the route assigned to this machine
      if (machineData.routeId) {
        setSelectedRouteId(machineData.routeId);
        try {
          await loadTripsForRoute(machineData.routeId);
        } catch (error) {
          console.error('Error loading trips:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load trips. Please try again later.",
          });
        }
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load routes. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load trips for selected route
  const loadTripsForRoute = async (routeId: string) => {
    if (!routeId) return;
    
    try {
      setLoading(true);
      
      // Add a delay to prevent too many rapid requests
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = await fetch(`/api/trips/public?routeId=${routeId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch trips');
      }
      const data = await response.json();
      
      // Ensure we have valid data
      if (Array.isArray(data)) {
        setTrips(data);
        if (data.length > 0) {
          setSelectedTripId(data[0].id);
          setSelectedTrip(data[0]);
        } else {
          setSelectedTripId("");
          setSelectedTrip(null);
        }
      } else {
        setTrips([]);
        setSelectedTripId("");
        setSelectedTrip(null);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load trips. Please try again later.",
      });
      // Reset trips data on error to prevent stale data
      setTrips([]);
      setSelectedTripId("");
      setSelectedTrip(null);
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
        throw new Error('Failed to fetch seats');
      }
      const data = await response.json();
      setSeats(data);
      setSelectedSeatId("");
    } catch (error) {
      console.error('Error loading seats:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load seats. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleMachineSelect = (machineId: string) => {
    setSelectedMachine(machineId);
    setSelectedRouteId("");
    setSelectedTripId("");
    setSelectedTrip(null);
    setSelectedSeatId("");
    setBookingStep(1);
    loadRoutesForMachine(machineId);
  };
  
  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
    setSelectedTripId("");
    setSelectedTrip(null);
    setSelectedSeatId("");
    setBookingStep(2);
    loadTripsForRoute(routeId);
  };
  
  const handleTripSelect = (trip: Trip) => {
    setSelectedTripId(trip.id);
    setSelectedTrip(trip);
    setSelectedSeatId("");
    setBookingStep(3);
    loadSeatsForTrip(trip.id);
  };
  
  const handleSeatSelect = (seatId: string) => {
    setSelectedSeatId(seatId);
    setBookingStep(4);
  };
  
  const handleBookTicket = async () => {
    if (!selectedMachine || !selectedTripId || !selectedSeatId || !passengerName || !passengerPhone) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields.",
      });
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: selectedTripId,
          seatId: selectedSeatId,
          passengerName,
          passengerPhone,
          paymentType: 'CASH',
          machineId: selectedMachine,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to book ticket');
      }
      
      const data = await response.json();
      setTicketDetails(data);
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
    setSelectedRouteId("");
    setSelectedTripId("");
    setSelectedTrip(null);
    setSelectedSeatId("");
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
  
  // Machine selection screen
  const renderMachineSelection = () => (
    <Card title="Welcome to Self-Service Ticket Booking" className="max-w-4xl mx-auto">
      {loading ? (
        <div className="text-center py-8">Loading machines...</div>
      ) : machines.length === 0 ? (
        <div className="text-center py-8">
          <p>No machines available. Please try again later.</p>
        </div>
      ) : machines.length === 1 ? (
        <div className="text-center py-4">
          <h3 className="text-lg font-medium">Using machine: {machines[0].name}</h3>
          <p className="text-gray-500">Location: {machines[0].location}</p>
        </div>
      ) : (
        <div>
          <Label>Select a Machine</Label>
          <select
            className="w-full p-2 border border-gray-300 rounded mt-1"
            value={selectedMachine}
            onChange={(e) => handleMachineSelect(e.target.value)}
          >
            <option value="">Select a machine</option>
            {machines.map((machine) => (
              <option key={machine.id} value={machine.id}>
                {machine.name} ({machine.location})
              </option>
            ))}
          </select>
        </div>
      )}
      
      {selectedMachine && (
        <Button
          className="w-full mt-6"
          onClick={() => setBookingStep(2)}
          disabled={!selectedMachine || loading}
        >
          {loading ? "Loading Routes..." : "Continue to Select Route"}
        </Button>
      )}
    </Card>
  );
  
  // Trip selection screen
  const renderTripSelection = () => (
    <Card title="Select Your Trip" className="max-w-4xl mx-auto">
      <div>
        <Label>Select a Route</Label>
        <select
          className="w-full p-2 border border-gray-300 rounded mt-1"
          value={selectedRouteId}
          onChange={(e) => handleRouteSelect(e.target.value)}
        >
          <option value="">Select a route</option>
          {routes.map((route) => (
            <option key={route.id} value={route.id}>
              {route.name} ({route.source} - {route.destination})
            </option>
          ))}
        </select>
      </div>
      
      {selectedRouteId && (
        <div className="mt-6">
          <Label>Available Trips</Label>
          {loading ? (
            <div className="text-center py-4">Loading trips...</div>
          ) : trips.length === 0 ? (
            <div className="text-center py-4">
              <p>No trips available for this route. Please select another route.</p>
            </div>
          ) : (
            <div className="grid gap-4 mt-2">
              {trips.map((trip) => (
                <div 
                  key={trip.id} 
                  className={`p-4 bg-white border rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors ${selectedTripId === trip.id ? 'border-blue-500 border-2' : ''}`}
                  onClick={() => handleTripSelect(trip)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{trip.bus?.name || 'Unknown'} ({trip.bus?.busNumber || 'N/A'})</h3>
                      <p className="text-sm text-gray-500">
                        {trip.route?.source || 'Unknown'} to {trip.route?.destination || 'Unknown'}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {formatDateTime(trip.departureTime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">₹{trip.fare || 0}</p>
                      <p className="text-sm text-gray-500">
                        {trip.availableSeats} seats available
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-between mt-6">
        <Button 
          variant="secondary"
          onClick={() => setBookingStep(1)}
        >
          Back
        </Button>
        <Button
          onClick={() => setBookingStep(3)}
          disabled={!selectedTripId || loading}
        >
          {loading ? "Loading..." : "Continue to Select Seat"}
        </Button>
      </div>
    </Card>
  );
  
  // Seat selection screen
  const renderSeatSelection = () => (
    <Card title="Select Your Seat" className="max-w-4xl mx-auto">
      {loading ? (
        <div className="text-center py-8">Loading seats...</div>
      ) : seats.length === 0 ? (
        <div className="text-center py-8">
          <p>No seats available for this trip. Please select another trip.</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            {/* Seat status legend */}
            <div className="flex justify-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-500 rounded"></div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-500 rounded"></div>
                <span className="text-sm">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded"></div>
                <span className="text-sm">Selected</span>
              </div>
            </div>
            
            {/* Bus layout representation */}
            <div className="grid grid-cols-5 gap-2">
              {seats.map((seat) => (
                <button
                  key={seat.id}
                  className={`
                    p-2 rounded text-center
                    ${seat.status === 'AVAILABLE' 
                      ? selectedSeatId === seat.id
                        ? 'bg-blue-100 border border-blue-500' 
                        : 'bg-green-100 border border-green-500 hover:bg-green-200'
                      : 'bg-red-100 border border-red-500 cursor-not-allowed'
                    }
                  `}
                  disabled={seat.status !== 'AVAILABLE'}
                  onClick={() => handleSeatSelect(seat.id)}
                >
                  {seat.seatNumber}
                </button>
              ))}
            </div>
          </div>
          
          {selectedSeatId && (
            <div className="bg-blue-50 p-4 rounded mt-4 mb-6">
              <p className="font-medium">Selected Seat: {seats.find(s => s.id === selectedSeatId)?.seatNumber}</p>
            </div>
          )}
        </>
      )}
      
      <div className="flex justify-between mt-4">
        <Button 
          variant="secondary"
          onClick={() => setBookingStep(2)}
        >
          Back
        </Button>
        <Button
          onClick={() => setBookingStep(4)}
          disabled={!selectedSeatId || loading}
        >
          {loading ? "Loading..." : "Continue to Passenger Details"}
        </Button>
      </div>
    </Card>
  );
  
  // Passenger details screen
  const renderPassengerDetails = () => (
    <Card title="Enter Passenger Details" className="max-w-4xl mx-auto">
      <div className="space-y-4">
        <div>
          <Label htmlFor="passenger-name">Passenger Name</Label>
          <Input
            id="passenger-name"
            placeholder="Enter passenger's full name"
            value={passengerName}
            onChange={(e) => setPassengerName(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="passenger-phone">Passenger Phone</Label>
          <Input
            id="passenger-phone"
            placeholder="Enter 10-digit phone number"
            value={passengerPhone}
            onChange={(e) => setPassengerPhone(e.target.value)}
          />
        </div>
        
        <div className="bg-yellow-50 p-4 rounded mt-6">
          <h3 className="font-medium">Trip Summary</h3>
          {selectedTrip && (
            <div className="mt-2 space-y-1 text-sm">
              <p><span className="font-medium">Route:</span> {selectedTrip.route?.source || 'Unknown'} to {selectedTrip.route?.destination || 'Unknown'}</p>
              <p><span className="font-medium">Departure:</span> {formatDateTime(selectedTrip.departureTime)}</p>
              <p><span className="font-medium">Bus:</span> {selectedTrip.bus?.name || 'Unknown'} ({selectedTrip.bus?.busNumber || 'N/A'})</p>
              <p><span className="font-medium">Seat:</span> {seats.find(s => s.id === selectedSeatId)?.seatNumber || 'Not selected'}</p>
              <p><span className="font-medium">Fare:</span> ₹{selectedTrip.fare || 0}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button 
          variant="secondary"
          onClick={() => setBookingStep(3)}
        >
          Back
        </Button>
        <Button
          onClick={handleBookTicket}
          disabled={!passengerName || !passengerPhone || loading}
          isLoading={loading}
        >
          Book Ticket
        </Button>
      </div>
    </Card>
  );
  
  // Ticket confirmation screen
  const renderTicketConfirmation = () => (
    <Card title="Ticket Booked Successfully!" className="max-w-4xl mx-auto">
      {ticketDetails && (
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-bold text-lg">Ticket Details</h3>
            <p className="text-sm text-gray-500">Reference: {ticketDetails.id}</p>
          </div>
          
          <div className="space-y-2">
            <p><span className="font-medium">Passenger:</span> {ticketDetails.passengerName || 'N/A'}</p>
            <p><span className="font-medium">Phone:</span> {ticketDetails.passengerPhone || 'N/A'}</p>
            <p><span className="font-medium">Seat:</span> {ticketDetails.seat?.seatNumber || 'N/A'}</p>
            <p><span className="font-medium">Status:</span> <span className="text-green-600 font-medium">Confirmed</span></p>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium">Trip Information</h3>
            <div className="space-y-1 mt-2">
              <p><span className="font-medium">From:</span> {ticketDetails.trip?.route?.source || 'N/A'}</p>
              <p><span className="font-medium">To:</span> {ticketDetails.trip?.route?.destination || 'N/A'}</p>
              <p><span className="font-medium">Date & Time:</span> {ticketDetails.trip?.departureTime ? formatDateTime(ticketDetails.trip.departureTime) : 'N/A'}</p>
              <p><span className="font-medium">Bus:</span> {ticketDetails.trip?.bus?.name || 'N/A'} ({ticketDetails.trip?.bus?.busNumber || 'N/A'})</p>
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium">Payment Information</h3>
            <div className="space-y-1 mt-2">
              <p><span className="font-medium">Amount Paid:</span> ₹{ticketDetails.trip?.fare || 0}</p>
              <p><span className="font-medium">Payment Method:</span> Cash</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded mt-4">
            <p className="font-medium text-center">Please collect your printed ticket from the machine.</p>
            <p className="text-sm text-center mt-2">Keep it safe and present it before boarding.</p>
          </div>
        </div>
      )}
      
      <div className="flex justify-center mt-8">
        <Button onClick={resetBooking}>Book Another Ticket</Button>
      </div>
    </Card>
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
        return renderMachineSelection();
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <Link href="/">
          <Button variant="secondary" size="sm">
            Back to Home
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-center">Self-Service Ticket Machine</h1>
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>
      
      {/* Progress indicator */}
      {bookingStep < 5 && (
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className={`text-sm ${bookingStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Machine</span>
            <span className={`text-sm ${bookingStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Trip</span>
            <span className={`text-sm ${bookingStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Seat</span>
            <span className={`text-sm ${bookingStep >= 4 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Details</span>
            <span className={`text-sm ${bookingStep >= 5 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Confirmation</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${(bookingStep / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {renderStep()}
    </div>
  );
} 