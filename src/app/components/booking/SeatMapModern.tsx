import React, { useState } from 'react';

export interface Seat {
  id: string;
  seatNumber: number | string;
  status: 'AVAILABLE' | 'BOOKED' | 'RESERVED' | 'UNAVAILABLE';
  ticketId?: string | null;
}

interface SeatMapModernProps {
  seats: Seat[];
  totalSeats: number;
  selectedSeats: Seat[];
  onSelectSeat: (seat: Seat) => void;
  seatPrice: number;
}

const SeatMapModern: React.FC<SeatMapModernProps> = ({ seats, totalSeats, selectedSeats, onSelectSeat, seatPrice }) => {
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

  const getBtnClass = (seat: Seat) => {
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    if (seat.status === 'BOOKED' || seat.status === 'UNAVAILABLE') return 'btn btn-sm btn-secondary w-100 mb-1 fw-bold disabled';
    if (isSelected) return 'btn btn-sm btn-success w-100 mb-1 fw-bold';
    if (seat.status === 'AVAILABLE') return 'btn btn-sm btn-outline-success w-100 mb-1 fw-bold';
    if (seat.status === 'RESERVED') return 'btn btn-sm btn-warning w-100 mb-1 fw-bold disabled';
    return 'btn btn-sm btn-outline-secondary w-100 mb-1 fw-bold';
  };

  return (
    <div>
      <div className="mb-3">
        <div className="row g-2">
          {allSeats.map((seat, idx) => (
            <div className="col-2 col-md-1" key={seat.id}>
              <button
                type="button"
                className={getBtnClass(seat)}
                onClick={() => seat.status === 'AVAILABLE' && onSelectSeat(seat)}
                onMouseEnter={() => setHoveredSeat(Number(seat.seatNumber))}
                onMouseLeave={() => setHoveredSeat(null)}
                disabled={seat.status !== 'AVAILABLE'}
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title={
                  seat.status === 'AVAILABLE'
                    ? `Seat #${seat.seatNumber}${Number(seat.seatNumber) <= 10 ? ' (Premium)' : ''} - ₹${Number(seat.seatNumber) <= 10 ? seatPrice + 50 : seatPrice}`
                    : `Seat #${seat.seatNumber} - ${seat.status.toLowerCase()}`
                }
              >
                {seat.seatNumber}
                {Number(seat.seatNumber) <= 10 && (
                  <span className="badge bg-warning text-dark ms-1 align-middle">P</span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="d-flex flex-wrap gap-3 justify-content-center mb-3">
        <span className="badge bg-outline-success border border-success text-success">Available</span>
        <span className="badge bg-success">Selected</span>
        <span className="badge bg-secondary">Booked</span>
        <span className="badge bg-warning text-dark">Premium</span>
      </div>
      {/* Selected seats summary */}
      {selectedSeats.length > 0 && (
        <div className="alert alert-info mt-3">
          <div className="mb-2 fw-bold">Selected Seats: {selectedSeats.map(seat => seat.seatNumber).join(', ')}</div>
          <div className="mb-2">Total: ₹{selectedSeats.reduce((total, seat) => total + (Number(seat.seatNumber) <= 10 ? seatPrice + 50 : seatPrice), 0)}</div>
          <div className="d-flex flex-wrap gap-2">
            {selectedSeats.map(seat => (
              <span key={seat.id} className="badge bg-primary">
                Seat {seat.seatNumber}
                <button
                  type="button"
                  className="btn-close btn-close-white btn-sm ms-2"
                  aria-label="Remove"
                  style={{ fontSize: '0.7em', marginLeft: 6 }}
                  onClick={e => {
                    e.stopPropagation();
                    onSelectSeat(seat);
                  }}
                />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatMapModern; 