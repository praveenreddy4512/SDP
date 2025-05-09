import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface AnomalySectionProps {
  isolationForest?: Array<{
    point: number[];
    score: number;
    isAnomaly: boolean;
  }>;
  zAnomalies?: Array<{
    index: number;
    value: number;
    z: number;
  }>;
}

const AnomalySection: React.FC<AnomalySectionProps> = ({ isolationForest, zAnomalies }) => {
  const anomalies = isolationForest?.filter(a => a.isAnomaly) || [];

  return (
    <>
      <div className="col-12 col-lg-6">
        <div className="card shadow-sm h-100">
          <div className="card-header bg-danger text-white d-flex align-items-center">
            <FaExclamationTriangle className="me-2" />
            <h5 className="mb-0">Isolation Forest Anomalies</h5>
          </div>
          <div className="card-body p-0">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Index</th>
                  <th>Point (Price, Hour)</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a, i) => (
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

      <div className="col-12 col-lg-6">
        <div className="card shadow-sm h-100">
          <div className="card-header bg-warning text-dark d-flex align-items-center">
            <FaExclamationTriangle className="me-2" />
            <h5 className="mb-0">Z-Score Anomalies</h5>
          </div>
          <div className="card-body p-0">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Index</th>
                  <th>Value</th>
                  <th>Z-Score</th>
                </tr>
              </thead>
              <tbody>
                {zAnomalies?.map((a, i) => (
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
    </>
  );
};

export default AnomalySection; 