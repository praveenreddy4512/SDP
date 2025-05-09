import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement, BarElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend
} from 'chart.js';
import { FaChartLine, FaProjectDiagram, FaClock, FaCalendarAlt, FaMoneyBillWave, FaExclamationTriangle, FaLayerGroup, FaChartBar } from 'react-icons/fa';

// Register ChartJS components
ChartJS.register(LineElement, BarElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

// Lazy load components
const KPISection = lazy(() => import('./sections/KPISection'));
const SalesSection = lazy(() => import('./sections/SalesSection'));
const ClusterSection = lazy(() => import('./sections/ClusterSection'));
const AnomalySection = lazy(() => import('./sections/AnomalySection'));
const PeakAnalysisSection = lazy(() => import('./sections/PeakAnalysisSection'));

interface AnalyticsData {
  clusters?: {
    centroids?: Array<{
      centroid: number[];
    }>;
  };
  revenue?: {
    total?: number;
    average?: number;
  };
  salesTrend?: {
    predictedValue?: number;
  };
  demandPrediction?: {
    value?: number;
  };
  movingAverage?: number[];
  arimaForecast?: {
    forecast?: number[];
  };
  pca?: {
    components?: number[][];
  };
  isolationForest?: Array<{
    point: number[];
    score: number;
    isAnomaly: boolean;
  }>;
  peakHours?: Array<{
    hour: string;
    score: number;
  }>;
  peakDays?: Array<{
    day: number;
    score: number;
  }>;
  anomalies?: Array<{
    index: number;
    value: number;
    z: number;
  }>;
  seasonalityStrength?: number;
}

interface AnalyticsDashboardProps {
  analyticsData: AnalyticsData;
}

// Helper for day names
const getDayName = (day: number) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
};

// Helper functions for data processing
const processAnalyticsData = (data: AnalyticsData) => ({
  actualPrices: data.movingAverage || [],
  arimaForecast: data.arimaForecast?.forecast || [],
  pcaPoints: data.pca?.components || [],
  centroids: data.clusters?.centroids || [],
  anomalies: (data.isolationForest || []).map(a => a.isAnomaly),
  isoAnomalies: (data.isolationForest || []).filter(a => a.isAnomaly),
  movingAvg: data.movingAverage || [],
  peakHours: data.peakHours || [],
  peakDays: data.peakDays || [],
  zAnomalies: data.anomalies || [],
  seasonalityStrength: data.seasonalityStrength ?? 0
});

// Chart data generators
const generateArimaData = (actualPrices: number[], arimaForecast: number[]) => ({
  labels: Array.from({ length: actualPrices.length + arimaForecast.length }, (_, i) => i),
  datasets: [
    {
      label: 'Actual (Moving Avg)',
      data: actualPrices,
      borderColor: 'blue',
      fill: false,
    },
    {
      label: 'ARIMA Forecast',
      data: [...Array(actualPrices.length).fill(null), ...arimaForecast],
      borderColor: 'orange',
      borderDash: [5, 5],
      fill: false,
    },
  ],
});

const generateScatterData = (pcaPoints: number[][], anomalies: boolean[], clusters: number[]) => ({
  datasets: [{
    label: 'Tickets',
    data: pcaPoints.map(([x, y], i) => ({
      x, y,
      backgroundColor: anomalies[i] ? 'red' : clusters[i] === 0 ? 'blue' : 'green',
      radius: anomalies[i] ? 8 : 5,
    })),
    showLine: false,
    pointBackgroundColor: pcaPoints.map((_, i) =>
      anomalies[i] ? 'red' : clusters[i] === 0 ? 'blue' : 'green'
    ),
  }],
});

const generateBarData = (labels: string[], data: number[], backgroundColor: string) => ({
  labels,
  datasets: [{
    label: 'Score',
    data,
    backgroundColor
  }]
});

// Loading component
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center align-items-center p-4">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

export default function AnalyticsDashboard({ analyticsData: initialData }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(initialData);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loadedSections, setLoadedSections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Progressive loading of sections
    const sections = ['kpi', 'sales', 'clusters', 'anomalies', 'peaks'];
    sections.forEach((section, index) => {
      setTimeout(() => {
        setLoadedSections(prev => [...prev, section]);
      }, index * 500); // Load each section with a 500ms delay
    });
  }, []);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container py-4">
      {/* Progressive Loading Sections */}
      <Suspense fallback={<LoadingSpinner />}>
        {loadedSections.includes('kpi') && (
          <KPISection
            revenue={analyticsData.revenue}
            salesTrend={analyticsData.salesTrend}
            demandPrediction={analyticsData.demandPrediction}
          />
        )}
      </Suspense>

      <div className="row g-4">
        <Suspense fallback={<LoadingSpinner />}>
          {loadedSections.includes('sales') && (
            <SalesSection
              actualPrices={analyticsData.movingAverage || []}
              arimaForecast={analyticsData.arimaForecast?.forecast || []}
            />
          )}
        </Suspense>

        <Suspense fallback={<LoadingSpinner />}>
          {loadedSections.includes('clusters') && (
            <ClusterSection
              clusters={analyticsData.clusters}
              pca={analyticsData.pca}
              lastUpdate={lastUpdate}
            />
          )}
        </Suspense>

        <Suspense fallback={<LoadingSpinner />}>
          {loadedSections.includes('anomalies') && (
            <AnomalySection
              isolationForest={analyticsData.isolationForest}
              zAnomalies={analyticsData.anomalies}
            />
          )}
        </Suspense>

        <Suspense fallback={<LoadingSpinner />}>
          {loadedSections.includes('peaks') && (
            <PeakAnalysisSection
              peakHours={analyticsData.peakHours}
              peakDays={analyticsData.peakDays}
              seasonalityStrength={analyticsData.seasonalityStrength}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
} 