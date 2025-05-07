"use client";

import React, { useState } from 'react';

interface TabsProps {
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({
  value: '',
  onValueChange: () => {},
});

export const Tabs: React.FC<TabsProps> = ({ defaultValue = '', children, className = '' }) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, onValueChange: setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className = '' }) => {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;

  return (
    <button
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all 
        ${isSelected 
          ? 'bg-white text-gray-900 shadow' 
          : 'text-gray-600 hover:text-gray-900'
        } ${className}`}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({ value, children, className = '' }) => {
  const { value: selectedValue } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;

  if (!isSelected) return null;

  return <div className={className}>{children}</div>;
}; 