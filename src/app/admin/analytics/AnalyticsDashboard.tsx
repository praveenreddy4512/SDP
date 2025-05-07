import React from 'react';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement, BarElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend
} from 'chart.js';
import { FaChartLine, FaProjectDiagram, FaClock, FaCalendarAlt, FaMoneyBillWave, FaExclamationTriangle, FaLayerGroup, FaChartBar } from 'react-icons/fa';

ChartJS.register(LineElement, BarElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

interface AnalyticsDashboardProps {
  analyticsData: any;
}

// Helper for day names
const getDayName = (day: number) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
};

export default function AnalyticsDashboard({ analyticsData }: AnalyticsDashboardProps) {
  if (!analyticsData) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;

  // Prepare data
  const actualPrices = analyticsData.movingAverage || [];
  const arimaForecast = analyticsData.arimaForecast?.forecast || [];
  const pcaPoints: any[] = analyticsData.pca?.components || [];
  const clusters: any[] = analyticsData.clusters?.clusters || [];
  const anomalies: any[] = (analyticsData.isolationForest || []).map((a: any) => a.isAnomaly);
  const isoAnomalies: any[] = (analyticsData.isolationForest || []).filter((a: any) => a.isAnomaly);
  const movingAvg: any[] = analyticsData.movingAverage || [];
  const peakHours: any[] = analyticsData.peakHours || [];
  const peakDays: any[] = analyticsData.peakDays || [];
  const zAnomalies: any[] = analyticsData.anomalies || [];
  const centroids: any[] = analyticsData.clusters?.centroids || [];

  // ARIMA + Moving Average Line Chart
  const arimaData = {
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
        data: [
          ...Array(actualPrices.length).fill(null),
          ...arimaForecast
        ],
        borderColor: 'orange',
        borderDash: [5, 5],
        fill: false,
      },
    ],
  };

  // PCA Scatter Plot
  const scatterData = {
    datasets: [
      {
        label: 'Tickets',
        data: pcaPoints.map(([x, y]: any, i: number) => ({
          x, y,
          backgroundColor: anomalies[i] ? 'red' : clusters[i] === 0 ? 'blue' : 'green',
          radius: anomalies[i] ? 8 : 5,
        })),
        showLine: false,
        pointBackgroundColor: pcaPoints.map((_: any, i: number) =>
          anomalies[i] ? 'red' : clusters[i] === 0 ? 'blue' : 'green'
        ),
      },
    ],
  };

  // Peak Hours Bar Chart
  const peakHoursData = {
    labels: peakHours.map((h: any) => h.hour),
    datasets: [{
      label: 'Peak Hour Score',
      data: peakHours.map((h: any) => h.score),
      backgroundColor: 'teal'
    }]
  };

  // Peak Days Bar Chart
  const peakDaysData = {
    labels: peakDays.map((d: any) => getDayName(d.day)),
    datasets: [{
      label: 'Peak Day Score',
      data: peakDays.map((d: any) => d.score),
      backgroundColor: 'orange'
    }]
  };

  // Moving Average Line Chart
  const movingAvgData = {
    labels: movingAvg.map((_: any, i: number) => i),
    datasets: [{
      label: 'Moving Average',
      data: movingAvg,
      borderColor: 'purple',
      fill: false,
    }]
  };

  return (
    <div className="container py-4">
      {/* KPIs */}
      <div className="row mb-4 g-3">
        <div className="col-6 col-md-3">
          <div className="card text-white bg-success h-100">
            <div className="card-body text-center">
              <FaMoneyBillWave size={28} className="mb-2" />
              <h6 className="card-title">Total Revenue</h6>
              <div className="display-6">₹{analyticsData.revenue?.total?.toLocaleString() ?? '-'}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-white bg-primary h-100">
            <div className="card-body text-center">
              <FaChartLine size={28} className="mb-2" />
              <h6 className="card-title">Avg Ticket</h6>
              <div className="display-6">₹{analyticsData.revenue?.average?.toLocaleString() ?? '-'}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-white bg-info h-100">
            <div className="card-body text-center">
              <FaChartBar size={28} className="mb-2" />
              <h6 className="card-title">Next Prediction</h6>
              <div className="display-6">₹{analyticsData.salesTrend?.predictedValue?.toLocaleString() ?? '-'}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-white bg-warning h-100">
            <div className="card-body text-center">
              <FaExclamationTriangle size={28} className="mb-2" />
              <h6 className="card-title">Demand Prediction</h6>
              <div className="display-6">{analyticsData.demandPrediction?.value ?? '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="row g-4">
        {/* Sales & Forecast */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white d-flex align-items-center">
              <FaChartLine className="me-2" />
              <h5 className="mb-0">Sales & Forecast</h5>
            </div>
            <div className="card-body"><Line data={arimaData} /></div>
          </div>
        </div>
        {/* PCA Scatter Plot */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-info text-white d-flex align-items-center">
              <FaProjectDiagram className="me-2" />
              <h5 className="mb-0">PCA Scatter Plot (Clusters & Anomalies)</h5>
            </div>
            <div className="card-body"><Scatter data={scatterData} /></div>
          </div>
        </div>
        {/* Cluster Centroids */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-secondary text-white d-flex align-items-center">
              <FaLayerGroup className="me-2" />
              <h5 className="mb-0">Cluster Centroids</h5>
            </div>
            <div className="card-body p-0">
              <table className="table mb-0">
                <thead>
                  <tr><th>Cluster</th><th>Centroid (Price, Hour)</th></tr>
                </thead>
                <tbody>
                  {centroids.map((c: any, i: number) => (
                    Array.isArray(c.centroid) ? (
                      <tr key={i}>
                        <td>{i}</td>
                        <td>{c.centroid.join(', ')}</td>
                      </tr>
                    ) : null
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Isolation Forest Anomalies */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-danger text-white d-flex align-items-center">
              <FaExclamationTriangle className="me-2" />
              <h5 className="mb-0">Isolation Forest Anomalies</h5>
            </div>
            <div className="card-body p-0">
              <table className="table mb-0">
                <thead>
                  <tr><th>Index</th><th>Point (Price, Hour)</th><th>Score</th></tr>
                </thead>
                <tbody>
                  {isoAnomalies.map((a: any, i: number) => (
                    <tr key={i}>
                      <td>{i}</td>
                      <td>{a.point.join(', ')}</td>
                      <td>{a.score.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Moving Average */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-purple text-white d-flex align-items-center" style={{ background: '#6f42c1' }}>
              <FaChartLine className="me-2" />
              <h5 className="mb-0">Moving Average</h5>
            </div>
            <div className="card-body"><Line data={movingAvgData} /></div>
          </div>
        </div>
        {/* Seasonality Strength */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-dark text-white d-flex align-items-center">
              <FaChartBar className="me-2" />
              <h5 className="mb-0">Seasonality Strength</h5>
            </div>
            <div className="card-body">
              <strong>Seasonality Strength:</strong> {(analyticsData.seasonalityStrength * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        {/* Peak Hours */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-teal text-white d-flex align-items-center" style={{ background: '#20c997' }}>
              <FaClock className="me-2" />
              <h5 className="mb-0">Peak Hours</h5>
            </div>
            <div className="card-body"><Bar data={peakHoursData} /></div>
          </div>
        </div>
        {/* Peak Days */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-orange text-white d-flex align-items-center" style={{ background: '#fd7e14' }}>
              <FaCalendarAlt className="me-2" />
              <h5 className="mb-0">Peak Days</h5>
            </div>
            <div className="card-body"><Bar data={peakDaysData} /></div>
          </div>
        </div>
        {/* Z-Score Anomalies */}
        <div className="col-12">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-warning text-dark d-flex align-items-center">
              <FaExclamationTriangle className="me-2" />
              <h5 className="mb-0">Z-Score Anomalies</h5>
            </div>
            <div className="card-body p-0">
              <table className="table mb-0">
                <thead>
                  <tr><th>Index</th><th>Value</th><th>Z-Score</th></tr>
                </thead>
                <tbody>
                  {zAnomalies.map((a: any, i: number) => (
                    <tr key={i}>
                      <td>{a.index}</td>
                      <td>{a.value}</td>
                      <td>{a.z.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 