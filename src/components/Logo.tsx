import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'light' | 'dark';
  className?: string;
  customLogo?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  color = 'dark',
  className = '',
  customLogo
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { height: 40 };
      case 'large':
        return { height: 64 };
      case 'medium':
      default:
        return { height: 48 };
    }
  };

  const { height } = getSize();
  const defaultLogo = "https://play-lh.googleusercontent.com/lN7A23bINlQu9l8ab9QrlJJpAMs3FtOqj7Z5qlz4YCrTvDc2_4pIg4fg2f89hJUZ0Rw=w600-h300-pc0xffffff-pd";
  const logoSrc = customLogo || defaultLogo;

  return (
    <div
      className={`flex items-center justify-center bg-white rounded shadow-sm overflow-hidden ${className}`}
      style={{ height: `${height}px`, width: 'auto', minWidth: `${height}px` }}
    >
      <Image
        src={logoSrc}
        alt="APSRTC Logo"
        height={height}
        width={height * 1.5}
        style={{ height: `${height}px`, width: 'auto', objectFit: 'contain', display: 'block' }}
        className="object-contain"
        priority
      />
    </div>
  );
};

export default Logo; 