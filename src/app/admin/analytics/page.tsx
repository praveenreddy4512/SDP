"use client";

import React, { useEffect, useState } from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(res => res.json())
      .then(setAnalyticsData);
  }, []);

  return (
    <div>
      <h1>Analytics Dashboard</h1>
      <p>Predictive insights and analytics powered by AI</p>
      <AnalyticsDashboard analyticsData={analyticsData} />
    </div>
  );
} 