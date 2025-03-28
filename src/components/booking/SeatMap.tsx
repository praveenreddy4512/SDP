import React, { useState, useEffect } from 'react';

interface Seat {
  id: string;
  seatNumber: number;
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
  
  useEffect(() => {
    // Arrange seats in rows (typically 4 seats per row for AC buses)
    // Layout: [0, 1] [aisle] [2, 3]
    const seatsPerRow = 4;
    const rows = Math.ceil(totalSeats / seatsPerRow);
    
    const arranged: (Seat | null)[][] = [];
    
    for (let row = 0; row < rows; row++) {
      const currentRow: (Seat | null)[] = [];
      
      for (let col = 0; col < seatsPerRow; col++) {
        const seatIndex = row * seatsPerRow + col;
        
        if (seatIndex < seats.length) {
          // Find the seat with the matching seat number
          const seatNumber = seatIndex + 1;
          const seat = seats.find(s => s.seatNumber === seatNumber);
          currentRow.push(seat || null);
        } else {
          currentRow.push(null); // Empty spot
        }
      }
      
      arranged.push(currentRow);
    }
    
    setArrangedSeats(arranged);
  }, [seats, totalSeats]);
  
  const getSeatStyles = (seat: Seat | null) => {
    if (!seat) return 'invisible'; // Empty spot
    
    let styles = 'flex items-center justify-center rounded-md w-10 h-10 m-1 cursor-pointer text-sm transition-colors';
    
    // Base styling based on seat status
    if (seat.status === 'AVAILABLE') {
      styles += ' bg-green-100 text-green-800 hover:bg-green-200';
    } else if (seat.status === 'BOOKED' || seat.status === 'UNAVAILABLE') {
      styles += ' bg-red-100 text-red-800 cursor-not-allowed';
    } else if (seat.status === 'RESERVED') {
      styles += ' bg-yellow-100 text-yellow-800 cursor-not-allowed';
    }
    
    // Selected seat styling
    if (selectedSeat && seat.id === selectedSeat.id) {
      styles += ' ring-2 ring-blue-500 bg-blue-100 text-blue-800';
    }
    
    return styles;
  };
  
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="w-full max-w-md bg-gray-50 p-4 rounded-lg">
        {/* Driver's cabin */}
        <div className="mb-4 flex justify-center">
          <div className="bg-gray-300 w-20 h-12 rounded-t-lg flex items-center justify-center text-sm text-gray-700">
            Driver
          </div>
        </div>
        
        {/* Seat rows */}
        <div className="flex flex-col space-y-2">
          {arrangedSeats.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex justify-center">
              {/* Left side seats */}
              <div className="flex">
                {row.slice(0, 2).map((seat, idx) => (
                  <div
                    key={seat?.id || `empty-${rowIndex}-${idx}`}
                    className={getSeatStyles(seat)}
                    onClick={() => seat && seat.status === 'AVAILABLE' && onSelectSeat(seat)}
                  >
                    {seat?.seatNumber}
                  </div>
                ))}
              </div>
              
              {/* Aisle */}
              <div className="w-4"></div>
              
              {/* Right side seats */}
              <div className="flex">
                {row.slice(2, 4).map((seat, idx) => (
                  <div
                    key={seat?.id || `empty-${rowIndex}-${idx + 2}`}
                    className={getSeatStyles(seat)}
                    onClick={() => seat && seat.status === 'AVAILABLE' && onSelectSeat(seat)}
                  >
                    {seat?.seatNumber}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Seat Legend */}
      <div className="flex justify-center space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-green-100 mr-1"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-red-100 mr-1"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-blue-100 mr-1"></div>
          <span>Selected</span>
        </div>
      </div>
      
      {/* Price display */}
      {selectedSeat && (
        <div className="bg-blue-50 p-4 rounded-lg w-full max-w-md">
          <p className="font-medium text-center">
            Selected Seat: <span className="text-blue-700">{selectedSeat.seatNumber}</span>
          </p>
          <p className="text-center text-lg font-bold text-blue-700">
            Price: ₹{seatPrice.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
};

export default SeatMap; 