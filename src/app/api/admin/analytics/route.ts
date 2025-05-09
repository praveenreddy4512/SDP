import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PredictionService } from '@/utils/predictions';

interface Ticket {
  createdAt: Date;
  price: number;
}

interface AnalyticsCache {
  timestamp: number;
  data: any;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const analyticsCache: { [key: string]: AnalyticsCache } = {};

async function getTicketData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await prisma.ticket.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo
      }
    },
    select: {
      createdAt: true,
      price: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  }) as Ticket[];
}

async function calculateBasicMetrics(tickets: Ticket[]) {
  if (tickets.length === 0) {
    return {
      revenue: {
        total: 0,
        average: 0,
        dailyAverage: 0,
        weeklyAverage: 0
      }
    };
  }

  // Calculate total revenue
  const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);

  // Calculate average ticket price
  const averageTicketPrice = totalRevenue / tickets.length;

  // Calculate daily average
  const firstDate = new Date(Math.min(...tickets.map(t => t.createdAt.getTime())));
  const lastDate = new Date(Math.max(...tickets.map(t => t.createdAt.getTime())));
  const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  const dailyAverage = totalRevenue / daysDiff;

  // Calculate weekly average
  const weeklyAverage = dailyAverage * 7;

  // Group tickets by date for daily analysis
  const dailySales = tickets.reduce((acc, ticket) => {
    const date = ticket.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        total: 0,
        count: 0
      };
    }
    acc[date].total += ticket.price;
    acc[date].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Calculate average daily sales
  const dailySalesValues = Object.values(dailySales);
  const averageDailySales = dailySalesValues.reduce((sum, day) => sum + day.total, 0) / dailySalesValues.length;

  return {
    revenue: {
      total: totalRevenue,
      average: averageTicketPrice,
      dailyAverage: averageDailySales,
      weeklyAverage: averageDailySales * 7,
      lastUpdated: new Date().toISOString()
    }
  };
}

async function calculatePredictions(tickets: Ticket[]) {
  // Prepare time series data for sales trend
  const timeSeriesData = tickets.map(ticket => ({
    timestamp: ticket.createdAt.getTime(),
    value: ticket.price
  }));

  // Calculate moving average for actual prices
  const movingAverage = tickets.map(ticket => ticket.price);
  const windowSize = Math.min(7, movingAverage.length);
  const smoothedPrices = [];
  
  for (let i = 0; i < movingAverage.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = movingAverage.slice(start, i + 1);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    smoothedPrices.push(avg);
  }

  // Get ARIMA forecast
  const arimaForecast = PredictionService.predictNextValue(timeSeriesData);
  const forecastValues = arimaForecast.forecast || Array(7).fill(0);

  return {
    salesTrend: {
      predictedValue: arimaForecast.predictedValue || 0,
      confidence: arimaForecast.confidence || 0
    },
    demandPrediction: {
      value: tickets.length > 0 ? PredictionService.predictDemand(tickets.map(t => t.price)) : 0
    },
    movingAverage: smoothedPrices,
    arimaForecast: {
      forecast: forecastValues
    }
  };
}

async function calculateClusters(tickets: Ticket[]) {
  if (tickets.length < 4) return null;

  const clusterData = tickets.map(t => [t.price, t.createdAt.getHours()]);
  return PredictionService.clusterData(clusterData, 2);
}

async function calculatePCA(tickets: Ticket[]) {
  if (tickets.length < 4) return null;

  const data = tickets.map(t => [t.price, t.createdAt.getHours()]);
  return PredictionService.pcaAnalysis(data);
}

async function calculateAnomalies(tickets: Ticket[]) {
  const prices = tickets.map(t => t.price);
  const anomalies = PredictionService.detectAnomalies(prices);
  const isolationForest = tickets.length >= 4 ? 
    PredictionService.isolationForestAnomalies(tickets.map(t => [t.price, t.createdAt.getHours()])) :
    [];

  return { anomalies, isolationForest };
}

async function calculatePeakPatterns(tickets: Ticket[]) {
  // Prepare hourly and daily data
  const hourlyData = new Array(24).fill(0);
  const dailyData = new Array(7).fill(0);
  const hourlyPrices: number[][] = Array(24).fill(0).map(() => []);
  const dailyPrices: number[][] = Array(7).fill(0).map(() => []);

  tickets.forEach(ticket => {
    const hour = ticket.createdAt.getHours();
    const day = ticket.createdAt.getDay();
    hourlyData[hour]++;
    dailyData[day]++;
    hourlyPrices[hour].push(ticket.price);
    dailyPrices[day].push(ticket.price);
  });

  // Calculate average prices for each hour and day
  const hourlyAvgPrices = hourlyPrices.map(prices => 
    prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0
  );
  const dailyAvgPrices = dailyPrices.map(prices => 
    prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0
  );

  // Get peak hours and days with enhanced seasonality analysis
  const peakHours = PredictionService.predictPeakHours(hourlyData);
  const peakDays = PredictionService.predictPeakDays(dailyData);

  // Analyze seasonality patterns
  const hourlySeasonality = PredictionService.analyzeSeasonality(hourlyAvgPrices, 24);
  const dailySeasonality = PredictionService.analyzeSeasonality(dailyAvgPrices, 7);

  return {
    peakHours,
    peakDays,
    seasonalityStrength: dailySeasonality.strength,
    hourlyPattern: {
      strength: hourlySeasonality.strength,
      pattern: hourlySeasonality.pattern,
      confidence: hourlySeasonality.confidence,
      trend: hourlySeasonality.trend,
      direction: hourlySeasonality.direction
    },
    dailyPattern: {
      strength: dailySeasonality.strength,
      pattern: dailySeasonality.pattern,
      confidence: dailySeasonality.confidence,
      trend: dailySeasonality.trend,
      direction: dailySeasonality.direction
    }
  };
}

async function calculateSalesAndForecast(tickets: Ticket[]) {
  // Aggregate sales per day
  const salesMap = new Map<string, number>();
  tickets.forEach(ticket => {
    const day = ticket.createdAt.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    salesMap.set(day, (salesMap.get(day) || 0) + 1);
  });
  // Sort by date
  const salesPerDay = Array.from(salesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sales]) => ({ date, sales }));
  const salesValues = salesPerDay.map(d => d.sales);

  // Run ARIMA forecast
  let forecast = [];
  if (salesValues.length >= 5) {
    const arimaResult = PredictionService.forecastARIMA(salesValues, 2, 1, 2, 7);
    forecast = arimaResult.forecast || [];
  }

  return {
    salesAndForecast: {
      actual: salesValues,
      forecast
    }
  };
}

export async function GET(req: NextRequest) {
  let step = 'init';
  try {
    step = 'auth';
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const sections = searchParams.get('sections')?.split(',') || ['all'];
    const cacheKey = `analytics_${sections.join('_')}`;

    // Check cache
    const cachedData = analyticsCache[cacheKey];
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data);
    }

    step = 'fetch-data';
    const tickets = await getTicketData();

    // Initialize response object
    const response: any = {};

    // Process requested sections in parallel
    const tasks: Promise<void>[] = [];

    if (sections.includes('all') || sections.includes('basic')) {
      tasks.push(
        calculateBasicMetrics(tickets).then(data => {
          Object.assign(response, data);
        })
      );
    }

    if (sections.includes('all') || sections.includes('predictions')) {
      tasks.push(
        calculatePredictions(tickets).then(data => {
          Object.assign(response, data);
        })
      );
    }

    if (sections.includes('all') || sections.includes('clusters')) {
      tasks.push(
        Promise.all([
          calculateClusters(tickets),
          calculatePCA(tickets)
        ]).then(([clusters, pca]) => {
          if (clusters) response.clusters = clusters;
          if (pca) response.pca = pca;
        })
      );
    }

    if (sections.includes('all') || sections.includes('anomalies')) {
      tasks.push(
        calculateAnomalies(tickets).then(data => {
          Object.assign(response, data);
        })
      );
    }

    if (sections.includes('all') || sections.includes('patterns')) {
      tasks.push(
        calculatePeakPatterns(tickets).then(data => {
          Object.assign(response, data);
        })
      );
    }

    if (sections.includes('all') || sections.includes('salesAndForecast')) {
      tasks.push(
        calculateSalesAndForecast(tickets).then(data => {
          Object.assign(response, data);
        })
      );
    }

    // Wait for all tasks to complete
    await Promise.all(tasks);

    // Cache the results
    analyticsCache[cacheKey] = {
      timestamp: Date.now(),
      data: response
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Analytics error [${step}]:`, error);
    return NextResponse.json(
      { error: `Failed to generate analytics at step: ${step}`, details: String(error) },
      { status: 500 }
    );
  }
} 