"use client";

import React, { useEffect, useState } from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';

interface AnalyticsData {
  [key: string]: any;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load all data at once instead of separate requests
        const response = await fetch('/api/admin/analytics?sections=all');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data || Object.keys(data).length === 0) {
          throw new Error('No data received from the server');
        }

        console.log('Received analytics data:', data);
        setAnalyticsData(data);
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0">Analytics Dashboard</h1>
          <p className="text-muted">Predictive insights and analytics powered by AI</p>
        </div>
        {isLoading && (
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        )}
      </div>
      
      {analyticsData && <AnalyticsDashboard analyticsData={analyticsData} />}
    </div>
  );
} 