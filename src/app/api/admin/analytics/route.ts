import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PredictionService } from '@/utils/predictions';

interface Ticket {
  createdAt: Date;
  price: number;
}

export async function GET(req: NextRequest) {
  let step = 'init';
  try {
    step = 'auth';
    // Verify auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    step = 'db-fetch';
    // Get last 30 days of ticket sales
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let tickets: Ticket[] = [];
    try {
      tickets = await prisma.ticket.findMany({
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
    } catch (dbError) {
      console.error('Analytics error [db-fetch]:', dbError);
      return NextResponse.json({ error: 'DB fetch failed', details: String(dbError) }, { status: 500 });
    }

    step = 'prepare-data';
    // Prepare data for predictions
    const hourlyData = new Array(24).fill(0);
    const dailyData = new Array(7).fill(0);
    const timeSeriesData = tickets.map(ticket => ({
      timestamp: ticket.createdAt.getTime(),
      value: ticket.price
    }));

    // Aggregate data
    tickets.forEach((ticket: Ticket) => {
      const hour = ticket.createdAt.getHours();
      const day = ticket.createdAt.getDay();
      hourlyData[hour]++;
      dailyData[day]++;
    });

    // Guard for empty data
    const safePrices = tickets.map((t: Ticket) => t.price);
    const safeTimeSeries = timeSeriesData.length > 0 ? timeSeriesData : [{ timestamp: Date.now(), value: 0 }];
    const safeHourly = hourlyData.length > 0 ? hourlyData : new Array(24).fill(0);
    const safeDaily = dailyData.length > 0 ? dailyData : new Array(7).fill(0);

    let nextValuePrediction, peakHours, peakDays, demandPrediction, trend;
    try {
      step = 'predictions';
      nextValuePrediction = PredictionService.predictNextValue(safeTimeSeries);
      peakHours = PredictionService.predictPeakHours(safeHourly);
      peakDays = PredictionService.predictPeakDays(safeDaily);
      demandPrediction = safePrices.length > 0 ? PredictionService.predictDemand(safePrices) : 0;
      trend = safePrices.length > 0 ? PredictionService.calculateTrend(safePrices) : 0;
    } catch (predError) {
      console.error('Analytics error [predictions]:', predError);
      return NextResponse.json({ error: 'Prediction failed', details: String(predError) }, { status: 500 });
    }

    step = 'aggregate';
    // Calculate total revenue
    const totalRevenue = safePrices.reduce((sum: number, price: number) => sum + price, 0);
    // Calculate average ticket price
    const averageTicketPrice = safePrices.length > 0 ? totalRevenue / safePrices.length : 0;

    step = 'response';
    // Generate predictions
    const nextValuePolyPrediction = PredictionService.predictNextValuePolynomial(safeTimeSeries, 2);
    const anomalies = safePrices.length > 0 ? PredictionService.detectAnomalies(safePrices) : [];
    const movingAvg = safePrices.length > 0 ? PredictionService.movingAverage(safePrices, 3) : [];
    const seasonality = safePrices.length > 0 ? PredictionService.seasonalityStrength(safePrices, 7) : 0;
    // For clustering, PCA, and isolation forest, use [price, hour] as features if there is enough data
    let clusters = null;
    let pca = null;
    let isolationForest = null;
    if (tickets.length >= 4) {
      const clusterData = tickets.map(t => [t.price, t.createdAt.getHours()]);
      clusters = PredictionService.clusterData(clusterData, 2);
      pca = PredictionService.pcaAnalysis(clusterData);
      isolationForest = PredictionService.isolationForestAnomalies(clusterData);
    }
    // ARIMA forecast for ticket prices
    const arimaForecast = safePrices.length > 4 ? PredictionService.forecastARIMA(safePrices, 2, 1, 2, 3) : { forecast: [], error: 'Not enough data' };

    return NextResponse.json({
      salesTrend: {
        predictedValue: nextValuePrediction.predictedValue,
        confidence: nextValuePrediction.confidence,
        trend: trend
      },
      salesTrendPolynomial: {
        predictedValue: nextValuePolyPrediction.predictedValue,
        confidence: nextValuePolyPrediction.confidence
      },
      peakHours: peakHours.slice(0, 5).map(ph => ({
        hour: ph.hour,
        score: ph.score
      })),
      peakDays: peakDays.slice(0, 3).map(pd => ({
        day: pd.day,
        score: pd.score
      })),
      demandPrediction: {
        value: demandPrediction,
        confidence: nextValuePrediction.confidence
      },
      revenue: {
        total: totalRevenue,
        average: averageTicketPrice
      },
      anomalies,
      movingAverage: movingAvg,
      seasonalityStrength: seasonality,
      clusters,
      pca,
      isolationForest,
      arimaForecast
    });
  } catch (error) {
    console.error(`Analytics error [${step}]:`, error);
    return NextResponse.json(
      { error: `Failed to generate analytics at step: ${step}`, details: String(error) },
      { status: 500 }
    );
  }
} 