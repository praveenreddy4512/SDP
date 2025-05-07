"use client";

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
  
  // Example state (replace with real data/fetching as needed)
  const [profile, setProfile] = useState({
    name: "Vendor User",
    email: "vendor@buspos.com",
    phone: "9876543210",
  });
  const [pos, setPOS] = useState({
    defaultPayment: "cash",
    printReceipt: true,
    language: "en",
  });
  const [machine, setMachine] = useState({
    machineName: "POS-001",
    location: "Main Bus Stand",
  });
  
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

  // Handlers (replace with real API calls)
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };
  const handlePOSChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      setPOS({ ...pos, [name]: e.target.checked });
    } else {
      setPOS({ ...pos, [name]: value });
    }
  };
  const handleMachineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMachine({ ...machine, [e.target.name]: e.target.value });
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save profile to backend
    alert("Profile updated!");
  };

  const handlePOSSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save POS settings to backend
    alert("POS settings updated!");
  };

  const handleMachineSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save machine settings to backend
    alert("Machine settings updated!");
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <header className="bg-success text-white shadow">
        <div className="container py-4 d-flex flex-column flex-md-row justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Logo size="medium" color="light" className="me-3" customLogo={customLogo} />
            <h1 className="h4 mb-0">APSRTC Vendor POS - Settings</h1>
          </div>
          {session?.user && (
            <div className="d-flex align-items-center">
              <span className="me-3 small">Welcome, {session.user.name}</span>
              <Button variant="secondary" size="sm" onClick={handleBackToVendorDashboard}>
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-grow-1 container py-4">
        {status === 'loading' ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            <div className="col-12 col-md-4">
              <div className="card shadow sticky-top" style={{ top: '6rem' }}>
                <div className="card-body">
                  <nav className="nav flex-column">
                    <a href="#branding" className="nav-link active">Branding</a>
                    <a href="#preview" className="nav-link">Preview</a>
                  </nav>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-8">
              <div id="branding" className="mb-4">
                <div className="card shadow">
                  <div className="card-body">
                    <h2 className="h5 mb-4">Branding Settings</h2>
                    {saveSuccess && (
                      <div className="alert alert-success mb-4" role="alert">
                        Settings saved successfully!
                      </div>
                    )}
                    <div className="mb-3">
                      <label htmlFor="companyName" className="form-label">Company Name</label>
                      <input
                        id="companyName"
                        type="text"
                        value={companyName}
                        onChange={handleCompanyNameChange}
                        className="form-control"
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="mb-3">
                      <LogoUploader currentLogo={customLogo} onLogoChange={handleLogoChange} />
                    </div>
                    <Button
                      onClick={handleSaveSettings}
                      className="btn btn-success"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <span><span className="spinner-border spinner-border-sm me-2"></span>Saving...</span>
                      ) : (
                        'Save Settings'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <div id="preview">
                <div className="card shadow">
                  <div className="card-body">
                    <h2 className="h5 mb-4">Preview</h2>
                    <div className="mb-4 p-3 border rounded bg-success text-white">
                      <div className="d-flex align-items-center">
                        <Logo size="small" color="light" customLogo={customLogo} />
                        <span className="ms-2 fw-bold">{companyName || 'APSRTC'}</span>
                      </div>
                    </div>
                    <div className="mb-4 p-3 border rounded">
                      <div className="text-center mb-2">
                        <Logo size="small" customLogo={customLogo} />
                      </div>
                      <div className="text-center">
                        <h4 className="h6 fw-bold mb-1">{companyName || 'APSRTC'}</h4>
                        <p className="text-muted small mb-0">Sample Ticket</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 