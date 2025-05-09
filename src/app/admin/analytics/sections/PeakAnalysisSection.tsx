import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { FaClock, FaCalendarAlt, FaChartBar } from 'react-icons/fa';

interface PeakAnalysisSectionProps {
  peakHours?: Array<{
    hour: string;
    score: number;
  }>;
  peakDays?: Array<{
    day: number;
    score: number;
  }>;
  seasonalityStrength?: number;
}

const getDayName = (day: number) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
};

const PeakAnalysisSection: React.FC<PeakAnalysisSectionProps> = ({
  peakHours,
  peakDays,
  seasonalityStrength = 0
}) => {
  const peakHoursData = useMemo(() => ({
    labels: peakHours?.map(h => h.hour) || [],
    datasets: [{
      label: 'Score',
      data: peakHours?.map(h => h.score) || [],
      backgroundColor: 'teal'
    }]
  }), [peakHours]);

  const peakDaysData = useMemo(() => ({
    labels: peakDays?.map(d => getDayName(d.day)) || [],
    datasets: [{
      label: 'Score',
      data: peakDays?.map(d => d.score) || [],
      backgroundColor: 'orange'
    }]
  }), [peakDays]);

  const strengthColor = seasonalityStrength > 0.7 ? 'text-success' :
    seasonalityStrength > 0.4 ? 'text-warning' :
      'text-danger';

  return (
    <>
      <div className="col-12 col-lg-6">
        <div className="card shadow-sm h-100">
          <div className="card-header text-white d-flex align-items-center" style={{ background: '#20c997' }}>
            <FaClock className="me-2" />
            <h5 className="mb-0">Peak Hours</h5>
          </div>
          <div className="card-body">
            <Bar data={peakHoursData} />
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-6">
        <div className="card shadow-sm h-100">
          <div className="card-header text-white d-flex align-items-center" style={{ background: '#fd7e14' }}>
            <FaCalendarAlt className="me-2" />
            <h5 className="mb-0">Peak Days</h5>
          </div>
          <div className="card-body">
            <Bar data={peakDaysData} />
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card shadow-sm">
          <div className="card-header bg-dark text-white d-flex align-items-center">
            <FaChartBar className="me-2" />
            <h5 className="mb-0">Seasonality Analysis</h5>
          </div>
          <div className="card-body">
            <div className={strengthColor}>
              <strong>Seasonality Strength: </strong>
              {(seasonalityStrength * 100).toFixed(1)}%
            </div>
            <small className="text-muted">
              {seasonalityStrength > 0.7 ? 'Strong seasonal patterns detected' :
                seasonalityStrength > 0.4 ? 'Moderate seasonal patterns detected' :
                  'Weak or no seasonal patterns detected'}
            </small>
          </div>
        </div>
      </div>
    </>
  );
};

export default PeakAnalysisSection; 