"use client";

import React, { useState, useRef, useEffect } from 'react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TriggerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

interface ContentProps {
  children: React.ReactNode;
  className?: string;
}

interface ItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface ValueProps {
  placeholder: string;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            value,
            onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
};

const SelectTrigger: React.FC<TriggerProps> = ({ children, className = '', id }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <button
      type="button"
      id={id}
      className={`w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-5 w-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

const SelectValue: React.FC<ValueProps> = ({ placeholder, className = '' }) => {
  return <span className={`block truncate ${className}`}>{placeholder}</span>;
};

const SelectContent: React.FC<ContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto ${className}`}>
      <div className="py-1">{children}</div>
    </div>
  );
};

const SelectItem: React.FC<ItemProps> & { displayName?: string } = ({ value, children, className = '' }) => {
  return (
    <div
      data-value={value}
      className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${className}`}
    >
      {children}
    </div>
  );
};

// Set displayName for debugging and component identification
Select.displayName = 'Select';
SelectTrigger.displayName = 'SelectTrigger';
SelectValue.displayName = 'SelectValue';
SelectContent.displayName = 'SelectContent';
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }; 