import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { FaChartLine } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SalesSectionProps {
  actualPrices: number[];
  arimaForecast: number[];
}

const SalesSection: React.FC<SalesSectionProps> = ({ actualPrices, arimaForecast }) => {
  const chartData = useMemo(() => {
    const labels = Array.from(
      { length: Math.max(actualPrices.length, arimaForecast.length) },
      (_, i) => `Day ${i + 1}`
    );

    return {
      labels,
      datasets: [
        {
          label: 'Actual Sales (Moving Avg)',
          data: actualPrices,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.4,
          fill: false,
        },
        {
          label: 'ARIMA Forecast',
          data: [...Array(actualPrices.length).fill(null), ...arimaForecast],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderDash: [5, 5],
          tension: 0.4,
          fill: false,
        },
      ],
    };
  }, [actualPrices, arimaForecast]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sales Trend and Forecast',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Price (₹)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time Period'
        }
      }
    },
  };

  return (
    <div className="col-12 col-lg-6">
      <div className="card shadow-sm h-100">
        <div className="card-header bg-primary text-white d-flex align-items-center">
          <FaChartLine className="me-2" />
          <h5 className="mb-0">Sales & Forecast</h5>
        </div>
        <div className="card-body">
          {actualPrices.length > 0 || arimaForecast.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="text-center text-muted py-4">
              No sales data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesSection; 