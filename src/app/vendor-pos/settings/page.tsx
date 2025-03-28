'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import Logo from '@/components/Logo';
import LogoUploader from '@/components/LogoUploader';

export default function VendorSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [customLogo, setCustomLogo] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('APSRTC');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Check if user is logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);
  
  // Load saved settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLogo = localStorage.getItem('vendorLogo');
      const savedCompanyName = localStorage.getItem('companyName');
      
      if (savedLogo) {
        setCustomLogo(savedLogo);
      }
      
      if (savedCompanyName) {
        setCompanyName(savedCompanyName);
      } else {
        // Set default company name to APSRTC and save it
        localStorage.setItem('companyName', 'APSRTC');
      }
    }
  }, []);
  
  // Handle logo change
  const handleLogoChange = (logoUrl: string) => {
    setCustomLogo(logoUrl);
  };
  
  // Handle company name change
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyName(e.target.value);
  };
  
  // Save settings
  const handleSaveSettings = () => {
    setIsSaving(true);
    
    // Simulate API call with a timeout
    setTimeout(() => {
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('vendorLogo', customLogo);
        localStorage.setItem('companyName', companyName);
      }
      
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 1000);
  };
  
  // Go back to vendor dashboard
  const handleBackToVendorDashboard = () => {
    router.push('/vendor-pos');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-green-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
            <div className="flex items-center">
              <Logo size="medium" color="light" className="mr-4" customLogo={customLogo} />
              <h1 className="text-xl md:text-2xl font-bold">APSRTC Vendor POS - Settings</h1>
            </div>
            {session?.user && (
              <div className="flex items-center">
                <span className="mr-4 text-sm md:text-base">Welcome, {session.user.name}</span>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleBackToVendorDashboard}
                >
                  Back to Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        {status === 'loading' ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card className="shadow-md sticky top-6">
                <CardContent>
                  <nav className="space-y-1">
                    <a 
                      href="#branding" 
                      className="block py-2 px-3 text-gray-900 rounded-md bg-gray-100 font-medium"
                    >
                      Branding
                    </a>
                    <a 
                      href="#preview" 
                      className="block py-2 px-3 text-gray-600 hover:bg-gray-50 rounded-md"
                    >
                      Preview
                    </a>
                  </nav>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              <div id="branding">
                <Card className="shadow-md">
                  <CardContent>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Branding Settings</h2>
                    
                    {saveSuccess && (
                      <div className="mb-4 bg-green-50 text-green-600 p-3 rounded-md">
                        Settings saved successfully!
                      </div>
                    )}
                    
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name
                        </label>
                        <input
                          id="companyName"
                          type="text"
                          value={companyName}
                          onChange={handleCompanyNameChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter company name"
                        />
                      </div>
                      
                      <LogoUploader 
                        currentLogo={customLogo}
                        onLogoChange={handleLogoChange}
                      />
                      
                      <div className="pt-4">
                        <Button
                          onClick={handleSaveSettings}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <div className="flex items-center">
                              <div className="animate-spin h-5 w-5 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                              <span>Saving...</span>
                            </div>
                          ) : (
                            'Save Settings'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div id="preview">
                <Card className="shadow-md">
                  <CardContent>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Preview</h2>
                    
                    <div className="space-y-6">
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Header Preview</h3>
                        <div className="bg-green-600 text-white p-4 rounded-md">
                          <div className="flex items-center">
                            <Logo size="small" color="light" customLogo={customLogo} />
                            <span className="ml-2 font-bold">{companyName || 'APSRTC'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Ticket Preview</h3>
                        <div className="border border-gray-200 p-4 rounded-md">
                          <div className="flex justify-center mb-2">
                            <Logo size="small" customLogo={customLogo} />
                          </div>
                          <div className="text-center">
                            <h4 className="text-lg font-bold">{companyName || 'APSRTC'}</h4>
                            <p className="text-gray-500 text-sm">Sample Ticket</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 