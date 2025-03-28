import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

interface LogoUploaderProps {
  currentLogo?: string;
  onLogoChange?: (logoUrl: string) => void;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ 
  currentLogo = '', 
  onLogoChange 
}) => {
  const [logoUrl, setLogoUrl] = useState<string>(currentLogo);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update local state when prop changes
  useEffect(() => {
    if (currentLogo) {
      setLogoUrl(currentLogo);
    }
  }, [currentLogo]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size exceeds 2MB limit');
      return;
    }

    setError(null);
    setIsUploading(true);

    // Create a local preview of the image
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const result = event.target.result as string;
        setLogoUrl(result);
        setIsUploading(false);
        
        // Call the callback with the new logo URL
        if (onLogoChange) {
          onLogoChange(result);
        }
      }
    };

    reader.onerror = () => {
      setError('Failed to read the file');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  // Reset to default logo
  const handleReset = () => {
    setLogoUrl('');
    setError(null);
    
    if (onLogoChange) {
      onLogoChange('');
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <h3 className="text-lg font-medium mb-4">Company Logo</h3>
      
      {logoUrl && (
        <div className="mb-4 flex justify-center">
          <div className="relative bg-white p-2 border border-gray-200 rounded-lg shadow-sm">
            <img 
              src={logoUrl} 
              alt="Company Logo" 
              className="h-24 w-auto object-contain"
            />
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-3">
        <label className="flex-1">
          <div className="relative">
            <Button 
              type="button"
              variant="secondary"
              className="w-full"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
          </div>
        </label>
        
        {logoUrl && (
          <Button 
            variant="secondary"
            onClick={handleReset}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Reset
          </Button>
        )}
      </div>
      
      <p className="mt-2 text-xs text-gray-500">
        Recommended size: 250x100 pixels. Max file size: 2MB.
      </p>
    </div>
  );
};

export default LogoUploader; 