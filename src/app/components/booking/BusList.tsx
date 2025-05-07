import React from 'react';
import { format } from 'date-fns';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface Bus {
  id: string;
  busNumber: string;
  busType: string;
  totalSeats: number;
  vendor: {
    name: string;
  };
}

interface Trip {
  id: string;
  departureTime: string | Date;
  arrivalTime: string | Date;
  availableSeats: number;
  bus: Bus;
}

interface BusListProps {
  trips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  isLoading?: boolean;
}

const BusList: React.FC<BusListProps> = ({ trips, onSelectTrip, isLoading = false }) => {
  // Helper function to format time
  const formatTime = (dateTime: string | Date) => {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return format(date, 'hh:mm a');
  };
  
  // Helper function to calculate duration
  const calculateDuration = (departureTime: string | Date, arrivalTime: string | Date) => {
    const departureDate = typeof departureTime === 'string' ? new Date(departureTime) : departureTime;
    
    // Handle missing arrival time
    if (!arrivalTime) {
      return 'N/A';
    }
    
    const arrivalDate = typeof arrivalTime === 'string' ? new Date(arrivalTime) : arrivalTime;
    
    const durationMs = arrivalDate.getTime() - departureDate.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${durationHours}h ${durationMinutes}m`;
  };
  
  // Helper function to get bus type display text
  const getBusTypeDisplay = (busType: string) => {
    const types: Record<string, string> = {
      AC: 'AC',
      NON_AC: 'Non-AC',
      SLEEPER: 'Sleeper',
      SEATER: 'Seater',
      AC_SLEEPER: 'AC Sleeper',
      AC_SEATER: 'AC Seater',
    };
    
    return types[busType] || busType;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!trips.length) {
    return (
      <Card className="text-center py-10">
        <p className="text-gray-500">No buses available for the selected criteria.</p>
        <p className="text-sm text-gray-400 mt-2">Try changing your filters or selecting a different date.</p>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <Card key={trip.id} className="border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h3 className="font-bold text-gray-900">{trip.bus.vendor.name}</h3>
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {getBusTypeDisplay(trip.bus.busType)}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  {trip.bus.busNumber}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{formatTime(trip.departureTime)}</p>
                  <p className="text-xs text-gray-500">Departure</p>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <div className="text-xs text-gray-500 mb-1">
                    {calculateDuration(trip.departureTime, trip.arrivalTime)}
                  </div>
                  <div className="w-full flex items-center">
                    <div className="h-0.5 flex-1 bg-gray-300"></div>
                    <div className="mx-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                    <div className="h-0.5 flex-1 bg-gray-300"></div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{trip.arrivalTime ? formatTime(trip.arrivalTime) : 'N/A'}</p>
                  <p className="text-xs text-gray-500">Arrival</p>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <span>
                  {trip.availableSeats} seats available
                </span>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0 sm:ml-6 flex flex-col justify-center">
              <Button
                onClick={() => onSelectTrip(trip)}
                disabled={trip.availableSeats === 0}
              >
                Select
              </Button>
              {trip.availableSeats === 0 && (
                <p className="text-xs text-red-500 mt-1 text-center">Sold Out</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default BusList; 