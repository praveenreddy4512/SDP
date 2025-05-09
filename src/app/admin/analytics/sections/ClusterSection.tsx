import React, { useMemo } from 'react';
import { Scatter } from 'react-chartjs-2';
import { FaProjectDiagram, FaLayerGroup } from 'react-icons/fa';

interface ClusterSectionProps {
  clusters?: {
    centroids?: Array<{
      centroid: number[];
    }>;
  };
  pca?: {
    components?: number[][];
  };
  lastUpdate: Date;
}

const ClusterSection: React.FC<ClusterSectionProps> = ({ clusters, pca, lastUpdate }) => {
  const scatterData = useMemo(() => ({
    datasets: [{
      label: 'PCA Components',
      data: pca?.components?.map(([x, y]) => ({ x, y })) || [],
      backgroundColor: 'blue',
      pointRadius: 5,
    }],
  }), [pca]);

  return (
    <>
      <div className="col-12 col-lg-6">
        <div className="card shadow-sm h-100">
          <div className="card-header bg-info text-white d-flex align-items-center">
            <FaProjectDiagram className="me-2" />
            <h5 className="mb-0">PCA Scatter Plot</h5>
          </div>
          <div className="card-body">
            <Scatter data={scatterData} />
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-6">
        <div className="card shadow-sm h-100">
          <div className="card-header bg-secondary text-white d-flex align-items-center">
            <FaLayerGroup className="me-2" />
            <h5 className="mb-0">Cluster Centroids (Real-time)</h5>
          </div>
          <div className="card-body p-0">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Cluster</th>
                  <th>Centroid (Price, Hour)</th>
                  <th>Last Update</th>
                </tr>
              </thead>
              <tbody>
                {clusters?.centroids?.map((c, i) => (
                  Array.isArray(c.centroid) ? (
                    <tr key={i}>
                      <td>{i}</td>
                      <td>{c.centroid.join(', ')}</td>
                      <td>{lastUpdate.toLocaleTimeString()}</td>
                    </tr>
                  ) : null
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClusterSection; 