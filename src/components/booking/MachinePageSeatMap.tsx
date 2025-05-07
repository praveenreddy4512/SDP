import React, { useState } from 'react';

interface Seat {
  id: string;
  seatNumber: number | string;
  status: 'AVAILABLE' | 'BOOKED' | 'RESERVED' | 'UNAVAILABLE';
  ticketId?: string | null;
}

interface MachinePageSeatMapProps {
  seats: Seat[];
  totalSeats: number;
  onSelectSeat: (seat: Seat) => void;
  selectedSeat?: Seat | null;
  seatPrice?: number;
}

const MachinePageSeatMap: React.FC<MachinePageSeatMapProps> = ({
  seats,
  totalSeats,
  onSelectSeat,
  selectedSeat = null,
  seatPrice = 0,
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'bus'>('bus');

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
    const isSelected = selectedSeat && selectedSeat.id === seat.id;
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

  // Organize seats for bus layout
  const generateBusLayout = () => {
    // Typically bus has 2-2 or 2-1 seating arrangement
    const rows = Math.ceil(totalSeats / 4);
    const layout: (Seat | null)[][] = [];
    
    for (let i = 0; i < rows; i++) {
      const row: (Seat | null)[] = [];
      // Left side (2 seats)
      for (let j = 0; j < 2; j++) {
        const seatIndex = i * 4 + j;
        row.push(seatIndex < allSeats.length ? allSeats[seatIndex] : null);
      }
      // Aisle
      row.push(null);
      // Right side (2 seats)
      for (let j = 2; j < 4; j++) {
        const seatIndex = i * 4 + j;
        row.push(seatIndex < allSeats.length ? allSeats[seatIndex] : null);
      }
      layout.push(row);
    }
    
    return layout;
  };

  const busLayout = generateBusLayout();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <span className="mr-2">Select Your Seat</span>
          {selectedSeat && (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              Selected: {selectedSeat.seatNumber}
            </span>
          )}
        </h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-md text-sm ${viewMode === 'grid' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('bus')}
            className={`px-3 py-1 rounded-md text-sm ${viewMode === 'bus' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Bus Layout
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        // Grid layout
        <div className="border border-gray-200 rounded-lg p-5 mb-6 bg-white shadow-sm">
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {allSeats.map((seat) => {
              const isPremium = Number(seat.seatNumber) <= 10;
              const isSelected = selectedSeat && selectedSeat.id === seat.id;
              
              return (
                <div
                  key={seat.id}
                  className={`relative flex items-center justify-center h-12 rounded-md border-2 ${getSeatClass(seat)} 
                    ${seat.status === 'AVAILABLE' ? 'cursor-pointer transition-all duration-200 hover:shadow-md' : ''}
                    ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                  onClick={() => seat.status === 'AVAILABLE' && onSelectSeat(seat)}
                  onMouseEnter={() => setHoveredSeat(Number(seat.seatNumber))}
                  onMouseLeave={() => setHoveredSeat(null)}
                >
                  <span className={`text-sm font-medium ${isPremium ? 'flex items-center' : ''}`}>
                    {seat.seatNumber}
                    {isPremium && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full shadow-sm" 
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
      ) : (
        // Bus layout
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
          {/* Driver's cabin */}
          <div className="bg-gray-100 p-4 border-b border-gray-200">
            <div className="mb-4 flex justify-center">
              <div className="bg-gray-700 text-white w-32 h-14 rounded-t-lg flex items-center justify-center text-sm shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Driver
              </div>
            </div>
            
            <div className="flex justify-end mb-2">
              <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Entry/Exit
              </div>
            </div>
          </div>
          
          {/* Seats */}
          <div className="p-6">
            <div className="flex flex-col space-y-4">
              {busLayout.map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} className="flex justify-center">
                  <div className="flex items-center text-xs text-gray-500 w-6 justify-center">
                    {String.fromCharCode(65 + rowIndex)}
                  </div>
                  
                  <div className="flex space-x-4">
                    <div className="flex space-x-2">
                      {row.slice(0, 2).map((seat, idx) => 
                        seat ? (
                          <div
                            key={`seat-${rowIndex}-${idx}`}
                            className={`relative flex items-center justify-center w-12 h-10 rounded-md border-2 ${getSeatClass(seat)} 
                              ${seat.status === 'AVAILABLE' ? 'cursor-pointer hover:shadow-md' : ''}`}
                            onClick={() => seat.status === 'AVAILABLE' && onSelectSeat(seat)}
                            onMouseEnter={() => setHoveredSeat(Number(seat.seatNumber))}
                            onMouseLeave={() => setHoveredSeat(null)}
                          >
                            <span className="text-sm">{seat.seatNumber}</span>
                            {hoveredSeat === Number(seat.seatNumber) && (
                              <div className="absolute z-10 -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                {seat.status}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div key={`empty-${rowIndex}-${idx}`} className="w-12 h-10"></div>
                        )
                      )}
                    </div>
                    
                    {/* Aisle */}
                    <div className="w-6 flex items-center justify-center">
                      <div className="h-full border-l border-dashed border-gray-300"></div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {row.slice(3, 5).map((seat, idx) => 
                        seat ? (
                          <div
                            key={`seat-${rowIndex}-${idx + 3}`}
                            className={`relative flex items-center justify-center w-12 h-10 rounded-md border-2 ${getSeatClass(seat)} 
                              ${seat.status === 'AVAILABLE' ? 'cursor-pointer hover:shadow-md' : ''}`}
                            onClick={() => seat.status === 'AVAILABLE' && onSelectSeat(seat)}
                            onMouseEnter={() => setHoveredSeat(Number(seat.seatNumber))}
                            onMouseLeave={() => setHoveredSeat(null)}
                          >
                            <span className="text-sm">{seat.seatNumber}</span>
                            {hoveredSeat === Number(seat.seatNumber) && (
                              <div className="absolute z-10 -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                {seat.status}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div key={`empty-${rowIndex}-${idx + 3}`} className="w-12 h-10"></div>
                        )
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 w-6 justify-center">
                    {String.fromCharCode(65 + rowIndex)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="flex flex-wrap gap-6 justify-center p-4 bg-gray-50 rounded-md border border-gray-200 shadow-sm mt-4">
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
      
      {/* Price info */}
      {selectedSeat && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-blue-800">Selected Seat: {selectedSeat.seatNumber}</h3>
              <p className="text-sm text-blue-600">
                {Number(selectedSeat.seatNumber) <= 10 ? 'Premium Seat (Extra legroom)' : 'Regular Seat'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-blue-700">
                ₹{Number(selectedSeat.seatNumber) <= 10 ? (seatPrice + 50).toFixed(2) : seatPrice.toFixed(2)}
              </p>
              {Number(selectedSeat.seatNumber) <= 10 && (
                <div className="text-xs text-gray-500">
                  Includes ₹50 premium charge
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachinePageSeatMap; 