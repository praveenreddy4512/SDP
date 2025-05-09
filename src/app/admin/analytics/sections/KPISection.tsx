import React from 'react';
import { FaMoneyBillWave, FaChartLine, FaChartBar, FaExclamationTriangle } from 'react-icons/fa';

interface KPISectionProps {
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
}

const KPISection: React.FC<KPISectionProps> = ({ revenue, salesTrend, demandPrediction }) => {
  return (
    <div className="row mb-4 g-3">
      <div className="col-6 col-md-3">
        <div className="card text-white bg-success h-100">
          <div className="card-body text-center">
            <FaMoneyBillWave size={28} className="mb-2" />
            <h6 className="card-title">Total Revenue</h6>
            <div className="display-6">₹{revenue?.total?.toLocaleString() ?? '-'}</div>
          </div>
        </div>
      </div>
      <div className="col-6 col-md-3">
        <div className="card text-white bg-primary h-100">
          <div className="card-body text-center">
            <FaChartLine size={28} className="mb-2" />
            <h6 className="card-title">Avg Ticket</h6>
            <div className="display-6">₹{revenue?.average?.toLocaleString() ?? '-'}</div>
          </div>
        </div>
      </div>
      <div className="col-6 col-md-3">
        <div className="card text-white bg-info h-100">
          <div className="card-body text-center">
            <FaChartBar size={28} className="mb-2" />
            <h6 className="card-title">Next Prediction</h6>
            <div className="display-6">₹{salesTrend?.predictedValue?.toLocaleString() ?? '-'}</div>
          </div>
        </div>
      </div>
      <div className="col-6 col-md-3">
        <div className="card text-white bg-warning h-100">
          <div className="card-body text-center">
            <FaExclamationTriangle size={28} className="mb-2" />
            <h6 className="card-title">Demand Prediction</h6>
            <div className="display-6">{demandPrediction?.value ?? '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPISection; 