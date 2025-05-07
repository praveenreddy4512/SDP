import * as ss from 'simple-statistics';
import { SimpleLinearRegression } from 'ml-regression-simple-linear';
import { PolynomialRegression } from 'ml-regression-polynomial';
import { kmeans } from 'ml-kmeans';
import Timeseries from 'timeseries-analysis';
import ARIMA from 'arima';
import { PCA } from 'ml-pca';
import { IsolationForest } from 'ml-isolation-forest';

interface TimeSeriesData {
  timestamp: number;
  value: number;
}

interface PredictionResult {
  predictedValue: number;
  confidence: number;
}

export class PredictionService {
  // Predict next value in a time series using linear regression
  static predictNextValue(data: { timestamp: number; value: number }[]) {
    if (!data || data.length < 2) {
      return { predictedValue: 0, confidence: 0 };
    }
    const x = data.map(d => d.timestamp);
    const y = data.map(d => d.value);
    if (x.length < 2 || y.length < 2) {
      return { predictedValue: 0, confidence: 0 };
    }
    const regression = new SimpleLinearRegression(x, y);
    const nextTimestamp = Math.max(...x) + (x[1] - x[0]); // Next time step
    const predictedValue = regression.predict(nextTimestamp);
    // Confidence can be calculated as R^2 or similar, but for now return 1
    return { predictedValue, confidence: 1 };
  }

  // Predict next value using polynomial regression (non-linear)
  static predictNextValuePolynomial(data: { timestamp: number; value: number }[], degree = 2) {
    if (!data || data.length < degree + 1) {
      return { predictedValue: 0, confidence: 0 };
    }
    const x = data.map(d => d.timestamp);
    const y = data.map(d => d.value);
    const uniqueX = Array.from(new Set(x));
    if (uniqueX.length < degree + 1) {
      return { predictedValue: 0, confidence: 0 };
    }
    try {
      const regression = new PolynomialRegression(x, y, degree);
      const nextTimestamp = Math.max(...x) + (x[1] - x[0]);
      const predictedValue = regression.predict(nextTimestamp);
      return { predictedValue, confidence: 1 };
    } catch (e) {
      return { predictedValue: 0, confidence: 0 };
    }
  }

  // K-means clustering for grouping (e.g., sales, trips, users)
  static clusterData(data: number[][], k = 2) {
    if (!data || data.length < k) return null;
    const result = kmeans(data, k, {});
    return result;
  }

  // Anomaly detection using z-score
  static detectAnomalies(data: number[], threshold = 2) {
    if (!data || data.length < 2) return [];
    const mean = ss.mean(data);
    const stdDev = ss.standardDeviation(data);
    return data.map((value, idx) => {
      const z = stdDev === 0 ? 0 : (value - mean) / stdDev;
      return { index: idx, value, z, isAnomaly: Math.abs(z) > threshold };
    }).filter(d => d.isAnomaly);
  }

  // Moving average (rolling window)
  static movingAverage(data: number[], window = 3) {
    if (!data || data.length < window) return [];
    const result = [];
    for (let i = 0; i <= data.length - window; i++) {
      const avg = ss.mean(data.slice(i, i + window));
      result.push(avg);
    }
    return result;
  }

  // Seasonality strength (ratio of seasonal variation to total variation)
  static seasonalityStrength(data: number[], period = 7) {
    if (!data || data.length < period * 2) return 0;
    // Use timeseries-analysis for decomposition
    const t = new Timeseries.main(data.map((v, i) => [i, v]));
    const seasonal = t.smoother({ period }).data.map((d: [number, number]) => d[1]);
    const totalVar = ss.variance(data);
    const seasonalVar = ss.variance(seasonal);
    return totalVar === 0 ? 0 : seasonalVar / totalVar;
  }

  // Predict peak hours using standard deviation and mean
  static predictPeakHours(hourlyData: number[]): { hour: number; score: number }[] {
    const stdDev = ss.standardDeviation(hourlyData);
    const mean = ss.mean(hourlyData);

    return hourlyData.map((value, hour) => {
      const zScore = (value - mean) / stdDev;
      const score = Math.max(0, Math.min(1, (zScore + 2) / 4)); // Normalize between 0 and 1
      return { hour, score };
    }).sort((a, b) => b.score - a.score);
  }

  // Predict peak days using seasonal decomposition
  static predictPeakDays(dailyData: number[]): { day: number; score: number }[] {
    const weeklyPattern = new Array(7).fill(0);
    const counts = new Array(7).fill(0);

    // Calculate average for each day of week
    dailyData.forEach((value, index) => {
      const dayOfWeek = index % 7;
      weeklyPattern[dayOfWeek] += value;
      counts[dayOfWeek]++;
    });

    // Calculate normalized scores
    const scores = weeklyPattern.map((sum, day) => {
      const avg = sum / counts[day];
      return { day, score: avg };
    });

    // Normalize scores between 0 and 1
    const maxScore = Math.max(...scores.map(s => s.score));
    return scores
      .map(({ day, score }) => ({ day, score: maxScore !== 0 ? score / maxScore : 0 }))
      .sort((a, b) => b.score - a.score);
  }

  // Predict demand using exponential smoothing
  static predictDemand(historicalData: number[], alpha: number = 0.3): number {
    if (historicalData.length === 0) return 0;
    let forecast = historicalData[0];
    for (let i = 1; i < historicalData.length; i++) {
      forecast = alpha * historicalData[i] + (1 - alpha) * forecast;
    }
    return Math.max(0, Math.round(forecast));
  }

  // Calculate trend direction and strength
  static calculateTrend(data: number[]): { direction: 'up' | 'down' | 'stable'; strength: number } {
    if (data.length < 2) {
      return { direction: 'stable', strength: 0 };
    }
    const regression = new SimpleLinearRegression(
      Array.from({ length: data.length }, (_, i) => i),
      data
    );
    const slope = typeof regression.slope === 'number' ? regression.slope : 0;
    const rSquaredArr = Array.from({ length: data.length }, (_, i) => i);
    const rSquared = typeof regression.score === 'function' ? regression.score(rSquaredArr, data) : 0;
    return {
      direction: slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'stable',
      strength: Math.min(1, Math.abs(Number(slope)) * Number(rSquared))
    };
  }

  // ARIMA time series forecasting
  static forecastARIMA(data: number[], p = 2, d = 1, q = 2, steps = 1) {
    if (!data || data.length < 5) return { forecast: [], error: 'Not enough data' };
    try {
      const arima = new ARIMA({ p, d, q, verbose: false }).train(data);
      const [pred] = arima.predict(steps);
      return { forecast: pred, error: null };
    } catch (e) {
      return { forecast: [], error: String(e) };
    }
  }

  // PCA for dimensionality reduction and feature extraction
  static pcaAnalysis(data: number[][]) {
    if (!data || data.length < 2) return { explainedVariance: [], components: [] };
    try {
      const pca = new PCA(data);
      return {
        explainedVariance: pca.getExplainedVariance(),
        components: pca.getLoadings().to2DArray()
      };
    } catch (e) {
      return { explainedVariance: [], components: [] };
    }
  }

  // Isolation Forest for anomaly detection
  static isolationForestAnomalies(data: number[][], nTrees = 100) {
    if (!data || data.length < 2) return [];
    try {
      const forest = new IsolationForest();
      forest.fit(data);
      const scores = forest.scores();
      return data.map((point, idx) => ({ point, score: scores[idx], isAnomaly: scores[idx] > 0.6 }));
    } catch (e) {
      return [];
    }
  }
} 