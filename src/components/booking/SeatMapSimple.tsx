import React, { useState } from 'react';

interface Seat {
  id: string;
  seatNumber: number | string;
  status: 'AVAILABLE' | 'BOOKED' | 'RESERVED' | 'UNAVAILABLE';
  ticketId?: string | null;
}

interface SeatMapSimpleProps {
  seats: Seat[];
  totalSeats: number;
  onSelectSeat: (seat: Seat) => void;
  selectedSeats?: Seat[];
  seatPrice?: number;
}

const SeatMapSimple: React.FC<SeatMapSimpleProps> = ({
  seats,
  totalSeats,
  onSelectSeat,
  selectedSeats = [],
  seatPrice = 0,
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);

  // Get all seat numbers in a flat structure
  const allSeats = Array.from({ length: totalSeats }, (_, i) => {
    const seatNumber = i + 1;
    const foundSeat = seats.find(s => Number(s.seatNumber) === seatNumber) || {
      id: `dummy-${seatNumber}`,
      seatNumber,
      status: 'AVAILABLE' as const
    };
    return foundSeat;
  });

  const getSeatClass = (seat: Seat) => {
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    const isPremium = Number(seat.seatNumber) <= 10;
    
    if (isSelected) {
      return "bg-blue-600 text-white border-blue-700 shadow-md transform scale-105";
    }
    
    switch (seat.status) {
      case 'AVAILABLE':
        return isPremium 
          ? "bg-gradient-to-b from-amber-50 to-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
          : "bg-white text-green-700 border-green-500 hover:bg-green-50";
      case 'BOOKED':
      case 'UNAVAILABLE':
        return "bg-gray-400 text-white border-gray-500 cursor-not-allowed opacity-70";
      case 'RESERVED':
        return "bg-yellow-100 text-yellow-800 border-yellow-300 cursor-not-allowed";
      default:
        return "bg-white border-gray-300";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Select Seats <span className="bg-blue-500 text-white px-3 py-1 rounded-md ml-2 text-sm">
            {selectedSeats.length} selected
          </span>
        </h2>
        
        <div className="flex space-x-3 text-sm">
          <div className="text-blue-700 font-medium">
            Total: ₹{(selectedSeats.length * seatPrice).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Driver's cabin */}
      <div className="mb-5 flex justify-center">
        <div className="bg-gray-700 text-white w-32 h-14 rounded-t-lg flex items-center justify-center text-sm shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Driver
        </div>
      </div>

      {/* Main seat grid */}
      <div className="border border-gray-200 rounded-lg p-5 mb-6 bg-white shadow-sm">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {allSeats.map((seat) => {
            const isPremium = Number(seat.seatNumber) <= 10;
            const isSelected = selectedSeats.some(s => s.id === seat.id);
            
            return (
              <div
                key={seat.id}
                className={`relative flex items-center justify-center h-14 rounded-md border-2 ${getSeatClass(seat)} 
                  ${seat.status === 'AVAILABLE' ? 'cursor-pointer transition-all duration-200 hover:shadow-md' : ''}
                  ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                onClick={() => seat.status === 'AVAILABLE' && onSelectSeat(seat)}
                onMouseEnter={() => setHoveredSeat(Number(seat.seatNumber))}
                onMouseLeave={() => setHoveredSeat(null)}
              >
                <span className={`text-lg font-medium ${isPremium ? 'flex items-center' : ''}`}>
                  {seat.seatNumber}
                  {isPremium && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full shadow-sm" 
                          title="Premium Seat"></span>
                  )}
                </span>
                
                {/* Tooltip */}
                {hoveredSeat === Number(seat.seatNumber) && (
                  <div className="absolute z-10 -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1.5 px-3 whitespace-nowrap shadow-lg">
                    {seat.status === 'AVAILABLE' 
                      ? `Seat #${seat.seatNumber}${isPremium ? ' (Premium)' : ''} - ₹${isPremium ? seatPrice + 50 : seatPrice}`
                      : `Seat #${seat.seatNumber} - ${seat.status.toLowerCase()}`
                    }
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 justify-center p-4 bg-gray-50 rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center">
          <div className="w-6 h-6 mr-2 bg-white border-2 border-green-500 rounded shadow-sm"></div>
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 mr-2 bg-gradient-to-b from-amber-50 to-amber-100 border-2 border-amber-300 rounded shadow-sm relative">
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
          </div>
          <span className="text-sm">Premium</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 mr-2 bg-gray-400 border-2 border-gray-500 rounded opacity-70 shadow-sm"></div>
          <span className="text-sm">Booked</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 mr-2 bg-blue-600 border-2 border-blue-700 rounded shadow-md"></div>
          <span className="text-sm">Selected</span>
        </div>
      </div>

      {/* Selected seats summary (only show if seats are selected) */}
      {selectedSeats.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
          <h3 className="font-medium text-blue-800 mb-2">Selected Seats</h3>
          <div className="flex flex-wrap gap-2">
            {selectedSeats.map(seat => (
              <div key={seat.id} className="bg-blue-100 px-3 py-1.5 rounded-full text-blue-700 font-medium text-sm flex items-center">
                Seat {seat.seatNumber}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSeat(seat);
                  }}
                  className="ml-1.5 bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center hover:bg-blue-300"
                >
                  <span className="text-blue-700 text-xs">&times;</span>
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right text-blue-800 font-medium">
            Total: ₹{(selectedSeats.reduce((total, seat) => {
              const isPremium = Number(seat.seatNumber) <= 10;
              return total + (isPremium ? seatPrice + 50 : seatPrice);
            }, 0)).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatMapSimple; 