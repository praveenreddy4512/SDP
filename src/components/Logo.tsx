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
        return { width: 32, height: 32 };
      case 'large':
        return { width: 64, height: 64 };
      case 'medium':
      default:
        return { width: 40, height: 40 };
    }
  };

  const { width, height } = getSize();
  
  // Default APSRTC logo URL
  const defaultLogo = "https://play-lh.googleusercontent.com/lN7A23bINlQu9l8ab9QrlJJpAMs3FtOqj7Z5qlz4YCrTvDc2_4pIg4fg2f89hJUZ0Rw=w600-h300-pc0xffffff-pd";
  
  // Use custom logo if provided, otherwise use default APSRTC logo
  const logoSrc = customLogo || defaultLogo;

  return (
    <div className={`flex items-center ${className}`}>
      <Image 
        src={logoSrc} 
        alt="APSRTC Logo" 
        width={width} 
        height={height} 
        className="rounded-sm object-contain"
      />
    </div>
  );
};

export default Logo; 