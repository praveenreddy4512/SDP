import { prisma } from '@/lib/prisma';
import { PredictionService } from '@/utils/predictions';

interface AnalyticsCache {
  timestamp: number;
  data: any;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const analyticsCache: { [key: string]: AnalyticsCache } = {};

export async function getAnalyticsData() {
  const cacheKey = 'analytics_data';
  const cachedData = analyticsCache[cacheKey];

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data;
  }

  try {
    // Get last 30 days of ticket data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        price: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Process data for various analytics
    const data = await processAnalyticsData(tickets);

    // Cache the results
    analyticsCache[cacheKey] = {
      timestamp: Date.now(),
      data
    };

    return data;
  } catch (error) {
    console.error('Error processing analytics data:', error);
    throw error;
  }
}

async function processAnalyticsData(tickets: any[]) {
  // Prepare data for clustering
  const clusterData = tickets.map(t => [t.price, t.createdAt.getHours()]);
  
  // Perform clustering if enough data
  let clusters = null;
  if (clusterData.length >= 4) {
    clusters = PredictionService.clusterData(clusterData, 2);
  }

  // Calculate revenue metrics
  const revenue = {
    total: tickets.reduce((sum, t) => sum + t.price, 0),
    average: tickets.length > 0 ? tickets.reduce((sum, t) => sum + t.price, 0) / tickets.length : 0
  };

  // Calculate peak hours
  const hourCounts = new Array(24).fill(0);
  tickets.forEach(t => hourCounts[t.createdAt.getHours()]++);
  const peakHours = hourCounts.map((count, hour) => ({
    hour: `${hour}:00`,
    score: count
  })).sort((a, b) => b.score - a.score);

  // Calculate peak days
  const dayCounts = new Array(7).fill(0);
  tickets.forEach(t => dayCounts[t.createdAt.getDay()]++);
  const peakDays = dayCounts.map((count, day) => ({
    day,
    score: count
  })).sort((a, b) => b.score - a.score);

  // Calculate moving average
  const prices = tickets.map(t => t.price);
  const movingAverage = calculateMovingAverage(prices, 7);

  // Calculate seasonality strength
  const seasonalityStrength = calculateSeasonalityStrength(prices);

  // Perform anomaly detection
  const anomalies = detectAnomalies(prices);

  return {
    clusters,
    revenue,
    peakHours,
    peakDays,
    movingAverage,
    seasonalityStrength,
    anomalies,
    timestamp: new Date().toISOString()
  };
}

function calculateMovingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const values = data.slice(start, i + 1);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    result.push(average);
  }
  return result;
}

function calculateSeasonalityStrength(data: number[]): number {
  if (data.length < 24) return 0;

  // Calculate autocorrelation at lag 24 (assuming daily seasonality)
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  
  let autocorrelation = 0;
  for (let i = 24; i < data.length; i++) {
    autocorrelation += (data[i] - mean) * (data[i - 24] - mean);
  }
  autocorrelation /= (data.length - 24) * variance;

  return Math.abs(autocorrelation);
}

function detectAnomalies(data: number[]): Array<{ index: number; value: number; z: number }> {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const stdDev = Math.sqrt(
    data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
  );

  return data.map((value, index) => {
    const z = (value - mean) / stdDev;
    return { index, value, z };
  }).filter(item => Math.abs(item.z) > 2); // Consider values more than 2 standard deviations as anomalies
} 