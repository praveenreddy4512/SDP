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
  static predictNextValue(timeSeriesData: Array<{ timestamp: number; value: number }>) {
    if (timeSeriesData.length < 2) {
      return {
        predictedValue: 0,
        confidence: 0,
        forecast: Array(7).fill(0)
      };
    }

    // Sort data by timestamp
    const sortedData = [...timeSeriesData].sort((a, b) => a.timestamp - b.timestamp);
    const values = sortedData.map(d => d.value);

    // Calculate simple moving average
    const windowSize = Math.min(7, values.length);
    const movingAverage = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = values.slice(start, i + 1);
      const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
      movingAverage.push(avg);
    }

    // Calculate trend
    const xMean = (values.length - 1) / 2;
    const yMean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < values.length; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Generate forecast for next 7 days
    const forecast = [];
    const lastValue = values[values.length - 1];
    const lastMovingAvg = movingAverage[movingAverage.length - 1];
    
    for (let i = 1; i <= 7; i++) {
      const trendComponent = slope * (values.length + i - 1) + intercept;
      const seasonalComponent = this.calculateSeasonalComponent(values, i);
      const forecastValue = (trendComponent + seasonalComponent + lastMovingAvg) / 3;
      forecast.push(Math.max(0, forecastValue)); // Ensure non-negative values
    }

    // Calculate confidence based on recent data stability
    const recentValues = values.slice(-windowSize);
    const stdDev = this.calculateStandardDeviation(recentValues);
    const mean = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    const confidence = Math.max(0, Math.min(1, 1 - (stdDev / (mean || 1))));

    return {
      predictedValue: forecast[0],
      confidence,
      forecast
    };
  }

  private static calculateSeasonalComponent(values: number[], forecastIndex: number): number {
    if (values.length < 7) return 0;

    const seasonalPattern = [];
    for (let i = 0; i < 7; i++) {
      const indices = [];
      for (let j = i; j < values.length; j += 7) {
        indices.push(j);
      }
      if (indices.length > 0) {
        const avg = indices.reduce((sum, idx) => sum + values[idx], 0) / indices.length;
        seasonalPattern.push(avg);
      }
    }

    return seasonalPattern[(forecastIndex - 1) % 7] || 0;
  }

  private static calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
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
  static clusterData(data: number[][], k: number) {
    if (data.length < k) {
      return {
        centroids: Array(k).fill({ centroid: [0, 0] })
      };
    }

    // Simple k-means clustering
    let centroids = data.slice(0, k).map(point => [...point]);
    let oldCentroids: number[][] = [];
    let iterations = 0;
    const maxIterations = 100;

    while (!this.areCentroidsEqual(centroids, oldCentroids) && iterations < maxIterations) {
      oldCentroids = centroids.map(c => [...c]);
      const clusters = Array(k).fill(0).map(() => [] as number[][]);

      // Assign points to nearest centroid
      data.forEach(point => {
        const distances = centroids.map(centroid => 
          this.calculateDistance(point, centroid)
        );
        const nearestCentroid = distances.indexOf(Math.min(...distances));
        clusters[nearestCentroid].push(point);
      });

      // Update centroids
      centroids = clusters.map(cluster => {
        if (cluster.length === 0) return oldCentroids[clusters.indexOf(cluster)];
        return cluster[0].map((_, i) => 
          cluster.reduce((sum, point) => sum + point[i], 0) / cluster.length
        );
      });

      iterations++;
    }

    return {
      centroids: centroids.map(centroid => ({ centroid }))
    };
  }

  private static areCentroidsEqual(centroids1: number[][], centroids2: number[][]): boolean {
    if (centroids1.length !== centroids2.length) return false;
    return centroids1.every((c1, i) => 
      c1.every((val, j) => Math.abs(val - centroids2[i][j]) < 0.0001)
    );
  }

  private static calculateDistance(point1: number[], point2: number[]): number {
    return Math.sqrt(
      point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0)
    );
  }

  // Anomaly detection using z-score
  static detectAnomalies(values: number[]): Array<{ index: number; value: number; z: number }> {
    if (values.length < 2) return [];

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = this.calculateStandardDeviation(values);
    const threshold = 2.5; // Z-score threshold for anomalies

    return values
      .map((value, index) => ({
        index,
        value,
        z: (value - mean) / (stdDev || 1)
      }))
      .filter(item => Math.abs(item.z) > threshold);
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
  static seasonalityStrength(values: number[], period: number): number {
    if (values.length < period * 2) return 0;

    const detrended = this.detrendData(values);
    const seasonal = this.extractSeasonalComponent(detrended, period);
    const residual = detrended.map((val, i) => val - seasonal[i]);

    const seasonalVar = this.calculateVariance(seasonal);
    const residualVar = this.calculateVariance(residual);
    const totalVar = seasonalVar + residualVar;

    return totalVar > 0 ? seasonalVar / totalVar : 0;
  }

  private static detrendData(values: number[]): number[] {
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    return values.map((val, i) => val - (slope * i + intercept));
  }

  private static extractSeasonalComponent(values: number[], period: number): number[] {
    const seasonal = Array(values.length).fill(0);
    const counts = Array(period).fill(0);

    values.forEach((val, i) => {
      const phase = i % period;
      seasonal[i] = val;
      counts[phase]++;
    });

    // Average the seasonal pattern
    for (let phase = 0; phase < period; phase++) {
      const phaseSum = values.reduce((sum, val, i) => 
        i % period === phase ? sum + val : sum, 0
      );
      const phaseAvg = phaseSum / counts[phase];

      for (let i = phase; i < values.length; i += period) {
        seasonal[i] = phaseAvg;
      }
    }

    return seasonal;
  }

  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  // Predict peak hours using standard deviation and mean
  static predictPeakHours(hourlyData: number[]): Array<{ hour: string; score: number; confidence: number }> {
    const total = hourlyData.reduce((sum, val) => sum + val, 0);
    const avg = total / hourlyData.length;
    const stdDev = this.calculateStandardDeviation(hourlyData);

    // Analyze hourly seasonality
    const hourlyPattern = this.analyzeSeasonality(hourlyData, 24);

    return hourlyData.map((count, hour) => {
      const baseScore = (count - avg) / (stdDev || 1);
      const seasonalFactor = hourlyPattern.pattern[hour];
      const confidence = hourlyPattern.confidence;

      return {
        hour: `${hour}:00`,
        score: Math.max(0, baseScore * (1 + seasonalFactor)),
        confidence
      };
    }).sort((a, b) => b.score - a.score);
  }

  // Predict peak days using seasonal decomposition
  static predictPeakDays(dailyData: number[]): Array<{ day: number; score: number; confidence: number }> {
    const total = dailyData.reduce((sum, val) => sum + val, 0);
    const avg = total / dailyData.length;
    const stdDev = this.calculateStandardDeviation(dailyData);

    // Analyze daily seasonality
    const dailyPattern = this.analyzeSeasonality(dailyData, 7);

    return dailyData.map((count, day) => {
      const baseScore = (count - avg) / (stdDev || 1);
      const seasonalFactor = dailyPattern.pattern[day];
      const confidence = dailyPattern.confidence;

      return {
        day,
        score: Math.max(0, baseScore * (1 + seasonalFactor)),
        confidence
      };
    }).sort((a, b) => b.score - a.score);
  }

  // Predict demand using exponential smoothing
  static predictDemand(prices: number[]): number {
    if (prices.length === 0) return 0;
    
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const stdDev = this.calculateStandardDeviation(prices);
    
    // Simple demand prediction based on price elasticity
    const elasticity = -0.5; // Assumed price elasticity
    const demandChange = elasticity * (stdDev / avgPrice);
    
    return Math.max(0, 1 + demandChange);
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
    if (data.length < 2) {
      return {
        components: [[0, 0], [0, 0]]
      };
    }

    // Normalize each feature (z-score normalization)
    const means = data[0].map((_, i) => data.reduce((sum, row) => sum + row[i], 0) / data.length);
    const stds = data[0].map((_, i) => {
      const mean = means[i];
      return Math.sqrt(data.reduce((sum, row) => sum + Math.pow(row[i] - mean, 2), 0) / data.length);
    });
    const normalized = data.map(row =>
      row.map((val, i) => stds[i] ? (val - means[i]) / stds[i] : 0)
    );

    // Use PCA library for projection
    const pca = new PCA(normalized);
    const components = pca.predict(normalized, { nComponents: 2 }).to2DArray();

    return { components };
  }

  private static calculateCovarianceMatrix(data: number[][]): number[][] {
    const n = data.length;
    const dimensions = data[0].length;
    const covariance: number[][] = Array(dimensions)
      .fill(0)
      .map(() => Array(dimensions).fill(0));

    for (let i = 0; i < dimensions; i++) {
      for (let j = 0; j < dimensions; j++) {
        covariance[i][j] = data.reduce(
          (sum, point) => sum + point[i] * point[j],
          0
        ) / n;
      }
    }

    return covariance;
  }

  private static getEigenDecomposition(matrix: number[][]) {
    // Simple power iteration method for largest eigenvalue/eigenvector
    const dimensions = matrix.length;
    let vector = Array(dimensions).fill(1);
    let eigenvalue = 0;
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
      const newVector = this.matrixMultiply(matrix, vector);
      const newEigenvalue = Math.sqrt(
        newVector.reduce((sum, val) => sum + val * val, 0)
      );
      
      if (Math.abs(newEigenvalue - eigenvalue) < 0.0001) break;
      
      vector = newVector.map(val => val / newEigenvalue);
      eigenvalue = newEigenvalue;
      iterations++;
    }

    return {
      eigenvalues: [eigenvalue],
      eigenvectors: [vector]
    };
  }

  private static matrixMultiply(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => 
      row.reduce((sum, val, i) => sum + val * vector[i], 0)
    );
  }

  // Isolation Forest for anomaly detection
  static isolationForestAnomalies(data: number[][]): Array<{ point: number[]; score: number; isAnomaly: boolean }> {
    if (data.length < 4) return [];

    const maxDepth = Math.ceil(Math.log2(data.length));
    const numTrees = 100;
    const scores: number[] = Array(data.length).fill(0);

    for (let tree = 0; tree < numTrees; tree++) {
      const treeScores = this.buildIsolationTree(data, maxDepth);
      treeScores.forEach((score, i) => {
        scores[i] += score;
      });
    }

    const avgScores = scores.map(score => score / numTrees);
    const threshold = this.calculateAnomalyThreshold(avgScores);

    return data.map((point, i) => ({
      point,
      score: avgScores[i],
      isAnomaly: avgScores[i] > threshold
    }));
  }

  private static buildIsolationTree(data: number[][], maxDepth: number): number[] {
    const scores = Array(data.length).fill(0);
    const dimensions = data[0].length;

    const buildTree = (points: number[][], depth: number): void => {
      if (depth >= maxDepth || points.length <= 1) {
        points.forEach((_, i) => {
          scores[data.indexOf(points[i])] += depth;
        });
        return;
      }

      const dimension = Math.floor(Math.random() * dimensions);
      const values = points.map(p => p[dimension]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const split = min + Math.random() * (max - min);

      const left = points.filter(p => p[dimension] < split);
      const right = points.filter(p => p[dimension] >= split);

      buildTree(left, depth + 1);
      buildTree(right, depth + 1);
    };

    buildTree(data, 0);
    return scores;
  }

  private static calculateAnomalyThreshold(scores: number[]): number {
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const stdDev = this.calculateStandardDeviation(scores);
    return mean + 2 * stdDev;
  }

  // Enhanced seasonality analysis
  static analyzeSeasonality(values: number[], period: number = 7) {
    if (values.length < period * 2) {
      return {
        strength: 0,
        pattern: Array(period).fill(0),
        trend: 0,
        confidence: 0
      };
    }

    // Detrend the data
    const detrended = this.detrendData(values);
    
    // Extract seasonal pattern
    const seasonalPattern = this.extractSeasonalComponent(detrended, period);
    
    // Calculate trend
    const trend = this.calculateTrend(values);
    
    // Calculate seasonality strength
    const seasonalVar = this.calculateVariance(seasonalPattern);
    const residualVar = this.calculateVariance(detrended.map((val, i) => val - seasonalPattern[i]));
    const totalVar = seasonalVar + residualVar;
    const strength = totalVar > 0 ? seasonalVar / totalVar : 0;

    // Calculate confidence based on pattern stability
    const patternStability = this.calculatePatternStability(seasonalPattern, period);
    const confidence = Math.min(1, patternStability * strength);

    // Normalize seasonal pattern
    const normalizedPattern = this.normalizePattern(seasonalPattern);

    return {
      strength,
      pattern: normalizedPattern,
      trend: trend.strength,
      confidence,
      direction: trend.direction
    };
  }

  private static calculatePatternStability(pattern: number[], period: number): number {
    if (pattern.length < period * 2) return 0;

    // Calculate correlation between consecutive periods
    const correlations = [];
    for (let i = 0; i < pattern.length - period; i++) {
      const currentPeriod = pattern.slice(i, i + period);
      const nextPeriod = pattern.slice(i + period, i + period * 2);
      if (nextPeriod.length === period) {
        const correlation = this.calculateCorrelation(currentPeriod, nextPeriod);
        correlations.push(correlation);
      }
    }

    // Return average correlation as stability measure
    return correlations.length > 0 
      ? correlations.reduce((sum, val) => sum + val, 0) / correlations.length 
      : 0;
  }

  private static calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;

    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      xDenominator += xDiff * xDiff;
      yDenominator += yDiff * yDiff;
    }

    if (xDenominator === 0 || yDenominator === 0) return 0;
    return numerator / Math.sqrt(xDenominator * yDenominator);
  }

  private static normalizePattern(pattern: number[]): number[] {
    const min = Math.min(...pattern);
    const max = Math.max(...pattern);
    const range = max - min;
    
    return pattern.map(val => 
      range === 0 ? 0 : (val - min) / range
    );
  }

  static calculateMovingAverage(data: number[], windowSize: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = data.slice(start, i + 1);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      result.push(average);
    }
    return result;
  }

  static analyzePeakHours(tickets: { hour: number; price: number }[]): { hour: number; count: number; revenue: number; averagePrice: number; percentage: number }[] {
    if (!tickets || tickets.length === 0) {
      return Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: 0,
        revenue: 0,
        averagePrice: 0,
        percentage: 0
      }));
    }

    const hourlyStats = new Map<number, { count: number; revenue: number; totalPrice: number }>();
    
    // Initialize all hours
    for (let hour = 0; hour < 24; hour++) {
      hourlyStats.set(hour, { count: 0, revenue: 0, totalPrice: 0 });
    }
    
    // Aggregate data
    tickets.forEach(ticket => {
      const stats = hourlyStats.get(ticket.hour) || { count: 0, revenue: 0, totalPrice: 0 };
      const price = Math.max(0, ticket.price);
      stats.count++;
      stats.revenue += price;
      stats.totalPrice += price;
      hourlyStats.set(ticket.hour, stats);
    });

    const totalRevenue = Array.from(hourlyStats.values()).reduce((sum, stat) => sum + stat.revenue, 0);
    
    // Convert to array and calculate additional metrics
    return Array.from(hourlyStats.entries())
      .map(([hour, stats]) => ({
        hour,
        count: Math.max(0, stats.count),
        revenue: Math.max(0, stats.revenue),
        averagePrice: stats.count > 0 ? Math.max(0, stats.totalPrice / stats.count) : 0,
        percentage: totalRevenue > 0 ? Math.max(0, (stats.revenue / totalRevenue) * 100) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  static analyzePeakDays(tickets: { day: number; price: number }[]): { day: number; count: number; revenue: number; averagePrice: number; percentage: number; dayName: string }[] {
    if (!tickets || tickets.length === 0) {
      return Array.from({ length: 7 }, (_, day) => ({
        day,
        count: 0,
        revenue: 0,
        averagePrice: 0,
        percentage: 0,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]
      }));
    }

    const dailyStats = new Map<number, { count: number; revenue: number; totalPrice: number }>();
    
    // Initialize all days
    for (let day = 0; day < 7; day++) {
      dailyStats.set(day, { count: 0, revenue: 0, totalPrice: 0 });
    }
    
    // Aggregate data
    tickets.forEach(ticket => {
      const stats = dailyStats.get(ticket.day) || { count: 0, revenue: 0, totalPrice: 0 };
      const price = Math.max(0, ticket.price);
      stats.count++;
      stats.revenue += price;
      stats.totalPrice += price;
      dailyStats.set(ticket.day, stats);
    });

    const totalRevenue = Array.from(dailyStats.values()).reduce((sum, stat) => sum + stat.revenue, 0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Convert to array and calculate additional metrics
    return Array.from(dailyStats.entries())
      .map(([day, stats]) => ({
        day,
        count: Math.max(0, stats.count),
        revenue: Math.max(0, stats.revenue),
        averagePrice: stats.count > 0 ? Math.max(0, stats.totalPrice / stats.count) : 0,
        percentage: totalRevenue > 0 ? Math.max(0, (stats.revenue / totalRevenue) * 100) : 0,
        dayName: dayNames[day]
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }
} 