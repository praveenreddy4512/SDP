import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 className={className}>
      {children}
    </h3>
  );
};

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardContent };
export default Card; 