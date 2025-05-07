import React, { useState, useEffect } from 'react';

interface Seat {
  id: string;
  seatNumber: number | string;  // Allow string or number for flexibility
  status: 'AVAILABLE' | 'BOOKED' | 'RESERVED' | 'UNAVAILABLE';
  ticketId?: string | null;
}

interface SeatMapProps {
  seats: Seat[];
  totalSeats: number;
  onSelectSeat: (seat: Seat) => void;
  selectedSeat?: Seat | null;
  seatPrice?: number;
}

const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  totalSeats,
  onSelectSeat,
  selectedSeat,
  seatPrice = 0,
}) => {
  const [arrangedSeats, setArrangedSeats] = useState<(Seat | null)[][]>([]);
  const [showTooltip, setShowTooltip] = useState<number | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  
  // Log seats data for debugging
  useEffect(() => {
    console.log("SeatMap received seats:", seats);
    console.log("SeatMap totalSeats:", totalSeats);
  }, [seats, totalSeats]);
  
  useEffect(() => {
    // Handle cases where seats might be empty or undefined
    if (!seats || seats.length === 0) {
      console.warn("No seats data available, creating placeholder seats");
      
      // Create placeholder seats if none are provided
      const placeholderSeats: Seat[] = [];
      const actualTotal = totalSeats > 0 ? totalSeats : 40; // Default to 40 seats if totalSeats is invalid
      
      for (let i = 1; i <= actualTotal; i++) {
        placeholderSeats.push({
          id: `placeholder-${i}`,
          seatNumber: i,
          status: 'AVAILABLE'
        });
      }
      
      arrangeSeats(placeholderSeats, actualTotal);
    } else {
      // Normalize seat data - convert string seatNumbers to numbers if needed
      const normalizedSeats = seats.map(seat => ({
        ...seat,
        seatNumber: typeof seat.seatNumber === 'string' ? parseInt(seat.seatNumber, 10) : seat.seatNumber
      }));
      
      arrangeSeats(normalizedSeats, totalSeats);
    }
  }, [seats, totalSeats]);
  
  // Create a separate function for arranging seats
  const arrangeSeats = (seatsData: Seat[], total: number) => {
    // Arrange seats in rows (typically 4 seats per row for AC buses)
    // Layout: [0, 1] [aisle] [2, 3]
    const seatsPerRow = 4;
    const rows = Math.ceil(total / seatsPerRow);
    
    const arranged: (Seat | null)[][] = [];
    
    for (let row = 0; row < rows; row++) {
      const currentRow: (Seat | null)[] = [];
      
      for (let col = 0; col < seatsPerRow; col++) {
        const seatIndex = row * seatsPerRow + col;
        
        if (seatIndex < seatsData.length) {
          // Find the seat with the matching seat number
          const seatNumber = seatIndex + 1;
          const seat = seatsData.find(s => Number(s.seatNumber) === seatNumber);
          currentRow.push(seat || null);
        } else {
          currentRow.push(null); // Empty spot
        }
      }
      
      arranged.push(currentRow);
    }
    
    setArrangedSeats(arranged);
  };
  
  // Toggle debug mode with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D to toggle debug mode
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDebugMode(prev => !prev);
        console.log('Debug mode:', !debugMode);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debugMode]);
  
  const getSeatColors = (seat: Seat | null) => {
    if (!seat) return { bg: 'transparent', text: 'transparent', border: 'transparent' };
    
    if (selectedSeat && seat.id === selectedSeat.id) {
      return viewMode === '3d' 
        ? { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-700' }
        : { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-700' };
    }
    
    switch (seat.status) {
      case 'AVAILABLE':
        return viewMode === '3d' 
          ? { bg: 'bg-gradient-to-b from-green-100 to-green-200', text: 'text-green-800', border: 'border-green-300' }
          : { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' };
      case 'BOOKED':
      case 'UNAVAILABLE':
        return viewMode === '3d'
          ? { bg: 'bg-gradient-to-b from-red-100 to-red-200', text: 'text-red-800', border: 'border-red-300' }
          : { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
      case 'RESERVED':
        return viewMode === '3d'
          ? { bg: 'bg-gradient-to-b from-yellow-100 to-yellow-200', text: 'text-yellow-800', border: 'border-yellow-300' }
          : { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' };
      default:
        return viewMode === '3d'
          ? { bg: 'bg-gradient-to-b from-gray-100 to-gray-200', text: 'text-gray-800', border: 'border-gray-300' }
          : { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
    }
  };
  
  const getSeatStyles = (seat: Seat | null, position: 'left' | 'right' = 'left') => {
    if (!seat) return 'invisible'; // Empty spot
    
    const { bg, text, border } = getSeatColors(seat);
    
    // Base styles
    let styles = `relative flex items-center justify-center m-1 text-sm transition-all border-2 ${border} ${bg} ${text}`;
    
    // Different styling based on view mode
    if (viewMode === '3d') {
      styles += ' transform perspective-500 rounded-t-xl';
      styles += position === 'left' ? ' rotate-y-5' : ' -rotate-y-5';
      styles += ' w-16 h-14 shadow-md hover:shadow-lg';
      
      // 3D effect for the seat back
      if (seat.status === 'AVAILABLE') {
        styles += ' hover:translate-y-[-2px]';
      }
    } else {
      styles += ' rounded-lg w-12 h-12';
    }
    
    // Status-based styles
    if (seat.status === 'AVAILABLE') {
      styles += ' cursor-pointer';
      styles += viewMode === '3d' ? ' hover:bg-green-200' : ' hover:bg-green-200 hover:scale-105';
    } else {
      styles += ' cursor-not-allowed opacity-80';
    }
    
    // Premium seats styling
    if (Number(seat.seatNumber) <= 10) {
      styles += ' font-bold';
    }
    
    return styles;
  };
  
  const getSeatTooltip = (seat: Seat | null) => {
    if (!seat) return '';
    
    if (seat.status === 'AVAILABLE') {
      return Number(seat.seatNumber) <= 10 
        ? `Premium Seat #${seat.seatNumber} - ₹${seatPrice + 50}`
        : `Seat #${seat.seatNumber} - ₹${seatPrice}`;
    } else if (seat.status === 'BOOKED') {
      return `Seat #${seat.seatNumber} - Already Booked`;
    } else if (seat.status === 'RESERVED') {
      return `Seat #${seat.seatNumber} - Reserved`;
    }
    
    return `Seat #${seat.seatNumber} - Unavailable`;
  };
  
  // If there are issues with the seat map, show a clearer message
  if (arrangedSeats.length === 0) {
    return (
      <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-inner border border-gray-200 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="font-medium text-gray-800 mb-2">Loading seat map...</h3>
        <p className="text-sm text-gray-600 mb-4">The seat layout is being prepared. This may take a moment.</p>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center space-y-6">
      {debugMode && (
        <div className="w-full max-w-lg bg-yellow-50 border border-yellow-300 p-3 rounded-lg mb-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold">Debug Mode Active</span>
            <button 
              onClick={() => setDebugMode(false)}
              className="text-xs bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded"
            >
              Hide
            </button>
          </div>
          <p className="mt-1">Press Ctrl+Shift+D to toggle debug mode</p>
          <p>Total Seats: {totalSeats}, Received: {seats ? seats.length : 0}</p>
          {selectedSeat && (
            <div className="mt-2 p-2 bg-white rounded">
              <p><strong>Selected Seat ID:</strong> {selectedSeat.id}</p>
              <p><strong>Seat Number:</strong> {selectedSeat.seatNumber}</p>
              <p><strong>Status:</strong> {selectedSeat.status}</p>
            </div>
          )}
        </div>
      )}
      
      {/* View mode toggle */}
      <div className="bg-gray-100 p-2 rounded-full flex items-center text-sm mb-2">
        <button
          onClick={() => setViewMode('2d')}
          className={`px-3 py-1 rounded-full ${viewMode === '2d' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          2D View
        </button>
        <button
          onClick={() => setViewMode('3d')}
          className={`px-3 py-1 rounded-full ${viewMode === '3d' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          3D View
        </button>
      </div>
      
      <div className={`w-full max-w-lg bg-white ${viewMode === '3d' ? 'p-8' : 'p-6'} rounded-lg shadow-lg border border-gray-200`}>
        <div className="relative">
          {/* Bus outline for 3D mode */}
          {viewMode === '3d' && (
            <div className="absolute -inset-5 -z-10 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-xl opacity-50"></div>
          )}
          
          {/* Driver's cabin */}
          <div className="mb-6 flex justify-center">
            <div className={`bg-gray-700 text-white ${viewMode === '3d' ? 'w-28 h-16' : 'w-24 h-14'} rounded-t-lg flex items-center justify-center text-sm font-medium shadow-md`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
              </svg>
              Driver
            </div>
          </div>
          
          {/* Steering wheel in 3D mode */}
          {viewMode === '3d' && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gray-800 rounded-full border-4 border-gray-600 z-10">
              <div className="absolute inset-0 rounded-full border-2 border-gray-500 opacity-50"></div>
            </div>
          )}
          
          {/* Entry/Exit */}
          <div className="mb-4 flex justify-end">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-xs font-medium shadow flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              ENTRANCE / EXIT
            </div>
          </div>
          
          {/* Seat rows */}
          <div className={`flex flex-col ${viewMode === '3d' ? 'space-y-4' : 'space-y-3'}`}>
            {arrangedSeats.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="flex justify-center">
                <div className="w-8 flex items-center justify-center text-gray-500 text-xs font-medium">
                  {String.fromCharCode(65 + rowIndex)}
                </div>
                
                {/* Left side seats */}
                <div className="flex">
                  {row.slice(0, 2).map((seat, idx) => (
                    <div
                      key={seat?.id || `empty-${rowIndex}-${idx}`}
                      className={getSeatStyles(seat, 'left')}
                      onClick={() => seat && seat.status === 'AVAILABLE' && onSelectSeat(seat)}
                      onMouseEnter={() => seat && setShowTooltip(Number(seat.seatNumber))}
                      onMouseLeave={() => setShowTooltip(null)}
                      aria-label={seat ? `Seat ${seat.seatNumber}, ${seat.status.toLowerCase()}` : 'Empty space'}
                      role={seat && seat.status === 'AVAILABLE' ? 'button' : 'presentation'}
                      tabIndex={seat && seat.status === 'AVAILABLE' ? 0 : -1}
                    >
                      {/* 3D seat details */}
                      {viewMode === '3d' && seat && (
                        <div className={`absolute inset-x-0 -top-1.5 h-1.5 ${getSeatColors(seat).bg.replace('bg-', 'bg-')} border-t-2 ${getSeatColors(seat).border.replace('border-', 'border-')} rounded-t-md`}></div>
                      )}
                      
                      <span className={seat && Number(seat.seatNumber) <= 10 ? 'relative' : ''}>
                        {seat?.seatNumber}
                        {seat && Number(seat.seatNumber) <= 10 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full shadow-sm" title="Premium Seat"></span>
                        )}
                        {debugMode && seat && (
                          <span className="absolute -bottom-1 -right-1 text-[6px] text-gray-500">{typeof seat.id === 'string' ? seat.id.slice(-4) : 'id?'}</span>
                        )}
                      </span>
                      
                      {/* 3D seat back */}
                      {viewMode === '3d' && seat && (
                        <div className={`absolute inset-x-0 -bottom-1 h-2 ${selectedSeat && seat.id === selectedSeat.id ? 'bg-blue-400' : seat.status === 'AVAILABLE' ? 'bg-green-300' : seat.status === 'BOOKED' ? 'bg-red-300' : 'bg-yellow-300'} rounded-b-md opacity-80`}></div>
                      )}
                      
                      {/* Tooltip */}
                      {seat && showTooltip === Number(seat.seatNumber) && (
                        <div className="absolute z-10 -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                          {getSeatTooltip(seat)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Aisle */}
                <div className={`${viewMode === '3d' ? 'w-10' : 'w-8'} flex items-center justify-center`}>
                  <div className="h-full border-l border-dashed border-gray-300"></div>
                </div>
                
                {/* Right side seats */}
                <div className="flex">
                  {row.slice(2, 4).map((seat, idx) => (
                    <div
                      key={seat?.id || `empty-${rowIndex}-${idx + 2}`}
                      className={getSeatStyles(seat, 'right')}
                      onClick={() => seat && seat.status === 'AVAILABLE' && onSelectSeat(seat)}
                      onMouseEnter={() => seat && setShowTooltip(Number(seat.seatNumber))}
                      onMouseLeave={() => setShowTooltip(null)}
                      aria-label={seat ? `Seat ${seat.seatNumber}, ${seat.status.toLowerCase()}` : 'Empty space'}
                      role={seat && seat.status === 'AVAILABLE' ? 'button' : 'presentation'}
                      tabIndex={seat && seat.status === 'AVAILABLE' ? 0 : -1}
                    >
                      {/* 3D seat details */}
                      {viewMode === '3d' && seat && (
                        <div className={`absolute inset-x-0 -top-1.5 h-1.5 ${getSeatColors(seat).bg.replace('bg-', 'bg-')} border-t-2 ${getSeatColors(seat).border.replace('border-', 'border-')} rounded-t-md`}></div>
                      )}
                      
                      <span className={seat && Number(seat.seatNumber) <= 10 ? 'relative' : ''}>
                        {seat?.seatNumber}
                        {seat && Number(seat.seatNumber) <= 10 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full shadow-sm" title="Premium Seat"></span>
                        )}
                        {debugMode && seat && (
                          <span className="absolute -bottom-1 -right-1 text-[6px] text-gray-500">{typeof seat.id === 'string' ? seat.id.slice(-4) : 'id?'}</span>
                        )}
                      </span>
                      
                      {/* 3D seat back */}
                      {viewMode === '3d' && seat && (
                        <div className={`absolute inset-x-0 -bottom-1 h-2 ${selectedSeat && seat.id === selectedSeat.id ? 'bg-blue-400' : seat.status === 'AVAILABLE' ? 'bg-green-300' : seat.status === 'BOOKED' ? 'bg-red-300' : 'bg-yellow-300'} rounded-b-md opacity-80`}></div>
                      )}
                      
                      {/* Tooltip */}
                      {seat && showTooltip === Number(seat.seatNumber) && (
                        <div className="absolute z-10 -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                          {getSeatTooltip(seat)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Row number (right side) */}
                <div className="w-8 flex items-center justify-center text-gray-500 text-xs font-medium">
                  {String.fromCharCode(65 + rowIndex)}
                </div>
              </div>
            ))}
          </div>

          {/* Back of the bus */}
          {viewMode === '3d' && (
            <div className="mt-4 bg-gray-200 h-6 rounded-b-lg border border-gray-300 shadow-inner"></div>
          )}
        </div>
      </div>
      
      {/* Seat Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-sm py-3 px-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100 w-full max-w-lg">
        <div className="flex items-center">
          <div className={`w-5 h-5 rounded ${viewMode === '3d' ? 'bg-gradient-to-b from-green-100 to-green-200' : 'bg-green-100'} border-2 border-green-300 mr-2`}></div>
          <span>Available</span>
        </div>
        <div className="flex items-center">
          <div className={`w-5 h-5 rounded ${viewMode === '3d' ? 'bg-gradient-to-b from-red-100 to-red-200' : 'bg-red-100'} border-2 border-red-300 mr-2`}></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center">
          <div className={`w-5 h-5 rounded ${viewMode === '3d' ? 'bg-gradient-to-b from-yellow-100 to-yellow-200' : 'bg-yellow-100'} border-2 border-yellow-300 mr-2`}></div>
          <span>Reserved</span>
        </div>
        <div className="flex items-center">
          <div className={`w-5 h-5 rounded ${viewMode === '3d' ? 'bg-blue-500' : 'bg-blue-500'} border-2 border-blue-700 mr-2`}></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center">
          <div className={`w-5 h-5 rounded ${viewMode === '3d' ? 'bg-gradient-to-b from-green-100 to-green-200' : 'bg-green-100'} border-2 border-green-300 mr-2 relative`}>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
          </div>
          <span>Premium Seat</span>
        </div>
      </div>
      
      {/* Price display */}
      {selectedSeat && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-lg w-full max-w-lg border border-blue-200 shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-3 sm:mb-0">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-md ${viewMode === '3d' ? 'bg-gradient-to-b from-blue-500 to-blue-600' : 'bg-blue-500'} text-white flex items-center justify-center text-lg mr-3 shadow-md`}>
                  {selectedSeat.seatNumber}
                </div>
                <div>
                  <p className="font-medium">
                    Selected Seat <span className="text-blue-700 font-bold">{selectedSeat.seatNumber}</span>
                  </p>
                  <p className="text-sm text-gray-600">{Number(selectedSeat.seatNumber) <= 10 ? 'Premium Seat' : 'Regular Seat'}</p>
                </div>
              </div>
            </div>
            
            <div className="text-center sm:text-right">
              <p className="text-xl font-bold text-blue-700">
                ₹{Number(selectedSeat.seatNumber) <= 10 ? (seatPrice + 50).toFixed(2) : seatPrice.toFixed(2)}
              </p>
              {Number(selectedSeat.seatNumber) <= 10 && (
                <div className="flex items-center justify-center sm:justify-end text-xs text-gray-500">
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    Premium: +₹50
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatMap; 