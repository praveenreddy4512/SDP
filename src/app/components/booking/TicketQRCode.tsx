import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface TicketQRCodeProps {
  ticketId: string;
  qrCodeData: string;
  size?: number;
}

const TicketQRCode: React.FC<TicketQRCodeProps> = ({ 
  ticketId, 
  qrCodeData, 
  size = 200 
}) => {
  const [qrCodeUrl, setQRCodeUrl] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const url = await QRCode.toDataURL(qrCodeData, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',  // Black dots
            light: '#ffffff', // White background
          },
        });
        setQRCodeUrl(url);
        setIsError(false);
      } catch (error) {
        console.error('Error generating QR code:', error);
        setIsError(true);
      }
    };

    if (qrCodeData) {
      generateQRCode();
    }
  }, [qrCodeData, size]);

  if (isError) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-center">
        <p className="text-red-600">Failed to generate QR code</p>
      </div>
    );
  }

  if (!qrCodeUrl) {
    return (
      <div className="flex justify-center items-center" style={{ height: size }}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-3 rounded-lg shadow-md">
        <img 
          src={qrCodeUrl} 
          alt={`Ticket QR Code ${ticketId}`} 
          width={size} 
          height={size} 
        />
      </div>
      <p className="mt-2 text-sm text-gray-600">Scan this QR code for boarding</p>
    </div>
  );
};

export default TicketQRCode; 