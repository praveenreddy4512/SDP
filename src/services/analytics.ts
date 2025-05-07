import { prisma } from '@/lib/prisma';
import { Prisma, TicketStatus, PaymentType, PaymentStatus, UserRole, TripStatus } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

interface AnalyticsData {
  totalTickets: number;
  totalRevenue: number;
  averageTicketPrice: number;
  peakHours: string[];
  popularEvents: string[];
  customerDemographics: {
    ageGroups: Record<string, number>;
    gender: Record<string, number>;
  };
}

interface EventData {
  id: string;
  capacity: number;
  basePrice: number;
  targetAgeGroups: Record<string, number>;
  targetGender: Record<string, number>;
}

interface Ticket {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  tripId: string;
  price: number;
  status: TicketStatus;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  qrCode: string;
  passengerName: string;
  passengerPhone: string;
  machineId: string | null;
}

interface Trip {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: TripStatus;
  busId: string;
  departureTime: Date;
  arrivalTime: Date;
  availableSeats: number;
  tickets: {
    id: string;
    status: TicketStatus;
  }[];
}

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

interface PeakHour {
  hour: string;
  count: number;
  confidence: number;
}

interface PopularTrip {
  id: string;
  sales: number;
  engagement: number;
  completionRate: number;
}

interface SentimentResult {
  text: string;
  sentiment: string;
  score: number;
  context: string;
  tripStatus: string;
}

interface SentimentMetrics {
  positive: number;
  negative: number;
  averageScore: number;
}

interface SalesTrend {
  current: 'increasing' | 'decreasing' | 'stable';
  predictions: number[];
  dailySales: Record<string, number>;
}

// Enhanced sentiment analysis using API
async function analyzeSentimentWithAI(text: string) {
  try {
    const response = await fetch('/api/ai-analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'sentiment',
        data: { text }
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze sentiment');
    }
    
    const { result } = await response.json();
    return result;
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    return { label: 'neutral', score: 0.5 };
  }
}

// Enhanced text generation for predictions
async function generatePredictionsWithAI(context: string) {
  try {
    const response = await fetch('/api/ai-analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'predictions',
        data: { context }
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate predictions');
    }
    
    const { result } = await response.json();
    return result;
  } catch (error) {
    console.error('Error in prediction generation:', error);
    
    // Safely parse context data
    let contextData;
    try {
      contextData = typeof context === 'string' ? JSON.parse(context) : context;
    } catch (e) {
      contextData = {};
    }

    // Generate comprehensive fallback insights
    const insights = `
      Business Analytics Report:
      1. Performance Metrics:
         - Total Revenue: ${contextData.totalRevenue ? formatCurrency(contextData.totalRevenue) : 'N/A'}
         - Total Tickets: ${contextData.totalTickets || 'N/A'}
         - Average Price: ${contextData.averageTicketPrice ? formatCurrency(contextData.averageTicketPrice) : 'N/A'}
      
      2. Operational Insights:
         - Sales Trend: ${contextData.salesTrend || 'N/A'}
         - Peak Hours: ${contextData.peakHours ? contextData.peakHours.join(', ') : 'N/A'}
      
      3. Strategic Recommendations:
         - Implement dynamic pricing during peak hours
         - Focus on customer retention programs
         - Optimize route scheduling based on demand
         - Enhance service quality metrics
      
      4. Growth Opportunities:
         - Expand service during high-demand periods
         - Develop loyalty programs
         - Explore new market segments
         - Improve customer experience
      
      Note: These insights are based on historical data analysis. AI-powered predictions are temporarily unavailable.
    `;
    return insights;
  }
}

// Enhanced text classification for customer insights
async function analyzeCustomerInsightsWithAI(text: string) {
  try {
    const response = await fetch('/api/ai-analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'insights',
        data: { text }
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze customer insights');
    }
    
    const { result } = await response.json();
    return result;
  } catch (error) {
    console.error('Error in customer insights analysis:', error);
    return { labels: ['neutral experience'], scores: [0.5] };
  }
}

// Mock analysis function
export async function analyzeData() {
  try {
    const response = await fetch('/api/analytics');
    if (!response.ok) {
      throw new Error('Failed to fetch analytics data');
    }
    const data = await response.json();
    
    const {
      totalTickets,
      totalRevenue,
      averageTicketPrice,
      peakHours,
      popularTrips,
      customerDemographics,
      sentimentAnalysis,
      trends,
    } = data.analysis;

    // Enhanced sentiment analysis using AI
    const aiSentimentResults = await Promise.all(
      sentimentAnalysis.results.slice(0, 3).map(async (result: SentimentResult) => {
        const aiAnalysis = await analyzeSentimentWithAI(result.text);
        return {
          ...result,
          aiSentiment: aiAnalysis.label,
          aiConfidence: aiAnalysis.score,
        };
      })
    );

    // Generate AI-powered insights
    const context = `
      Analyze the following business metrics and provide insights:
      - Total Revenue: ${formatCurrency(totalRevenue)}
      - Total Tickets: ${totalTickets}
      - Average Ticket Price: ${formatCurrency(averageTicketPrice)}
      - Sales Trend: ${trends.sales.current}
      - Peak Hours: ${peakHours.map((h: PeakHour) => h.hour).join(', ')}
    `;

    const aiInsights = await generatePredictionsWithAI(context);

    const analysis = `
      Key Insights:
      1. Total Revenue: ${formatCurrency(totalRevenue)} from ${totalTickets} tickets
      2. Average Ticket Price: ${formatCurrency(averageTicketPrice)}
      3. Sales Trend: ${trends.sales.current.toUpperCase()}
      4. Peak Hours: ${peakHours.map((h: PeakHour) => `${h.hour} (${(h.confidence * 100).toFixed(1)}% confidence)`).join(', ')}
      5. Most Popular Trips:
         ${popularTrips.map((trip: PopularTrip) => `
         - Trip ${trip.id}:
           * Sales: ${trip.sales}
           * Engagement: ${(trip.engagement * 100).toFixed(1)}%
           * Completion Rate: ${(trip.completionRate * 100).toFixed(1)}%
         `).join('')}
      
      Customer Insights:
      1. Demographics:
         - Age Groups: ${Object.entries(customerDemographics.ageGroups)
           .map(([group, count]) => `${group}: ${count}`)
           .join(', ')}
         - Gender Distribution: ${Object.entries(customerDemographics.gender)
           .map(([role, count]) => `${role}: ${count}`)
           .join(', ')}
      2. User Growth: ${Object.entries(customerDemographics.userGrowth)
        .map(([month, count]) => `${month}: ${count}`)
        .join(', ')}
      
      AI-Powered Sentiment Analysis:
      1. Overall Sentiment:
         - Positive: ${sentimentAnalysis.metrics.positive}
         - Negative: ${sentimentAnalysis.metrics.negative}
         - Average Score: ${sentimentAnalysis.metrics.averageScore.toFixed(2)}
      2. Recent Feedback with AI Analysis:
         ${aiSentimentResults.map(result => `
         - ${result.text}
           * Original Sentiment: ${result.sentiment} (${result.score.toFixed(2)})
           * AI Analysis: ${result.aiSentiment} (${result.aiConfidence.toFixed(2)})
           * Context: ${result.context}
           * Trip Status: ${result.tripStatus}
         `).join('')}
      
      AI-Generated Business Insights:
      ${aiInsights}
      
      Sales Predictions for Next 7 Days:
      ${trends.sales.predictions.map((prediction: number, index: number) => `
      Day ${index + 1}: ${Math.round(prediction)} tickets
      `).join('')}
    `;

    return {
      analysis,
      timestamp: new Date().toISOString(),
      metrics: {
        totalTickets,
        totalRevenue,
        averageTicketPrice,
        peakHours,
        popularTrips,
        customerDemographics,
        sentimentAnalysis: {
          ...sentimentAnalysis,
          aiResults: aiSentimentResults,
        },
        trends,
        aiInsights,
      },
    };
  } catch (error) {
    console.error('Error in analytics:', error);
    throw new Error('Failed to analyze data');
  }
}

// Mock prediction function
export async function predictFutureSales() {
  try {
    const response = await fetch('/api/analytics');
    if (!response.ok) {
      throw new Error('Failed to fetch analytics data');
    }
    const data = await response.json();
    
    const { trends, totalRevenue, totalTickets } = data.analysis;
    const { sales } = trends;

    // Generate AI-powered sales predictions
    const predictionContext = `
      Based on the following sales data, predict future sales:
      - Current Trend: ${sales.current}
      - Daily Sales: ${Object.entries(sales.dailySales)
        .map(([date, count]) => `${date}: ${count}`)
        .join(', ')}
      - Total Revenue: ${formatCurrency(totalRevenue)}
      - Total Tickets: ${totalTickets}
    `;

    const aiPredictions = await generatePredictionsWithAI(predictionContext);
    
    const predictions = `
      Sales Predictions for Next 30 Days:
      1. Current Trend: ${sales.current.toUpperCase()}
      2. Daily Sales Forecast:
         ${sales.predictions.map((prediction: number, index: number) => `
         Day ${index + 1}: ${Math.round(prediction)} tickets
         `).join('')}
      3. Revenue Projections:
         - Base Case: ${formatCurrency(totalRevenue * (sales.current === 'increasing' ? 1.1 : 0.9))}
         - Optimistic: ${formatCurrency(totalRevenue * 1.2)}
         - Conservative: ${formatCurrency(totalRevenue * 0.8)}
      
      AI-Generated Market Analysis:
      ${aiPredictions}
      
      Confidence Intervals:
      - Revenue: ±${sales.current === 'stable' ? '5' : '10'}%
      - Ticket Sales: ±${sales.current === 'stable' ? '3' : '7'}%
      
      Key Factors:
      1. Current Trend: ${sales.current}
      2. Historical Performance: ${Object.entries(sales.dailySales)
        .map(([date, count]) => `${date}: ${count}`)
        .join(', ')}
      3. Seasonal Patterns: ${sales.current === 'increasing' ? 'Growth phase' : 'Stabilization phase'}
    `;

    return {
      predictions,
      timestamp: new Date().toISOString(),
      metrics: {
        currentTrend: sales.current,
        predictions: sales.predictions,
        historicalData: sales.dailySales,
        aiPredictions,
      },
    };
  } catch (error) {
    console.error('Error in prediction:', error);
    throw new Error('Failed to generate predictions');
  }
}

// Mock sentiment analysis
export async function analyzeCustomerSentiment() {
  try {
    const response = await fetch('/api/analytics');
    if (!response.ok) {
      throw new Error('Failed to fetch analytics data');
    }
    const data = await response.json();
    
    const { sentimentAnalysis } = data.analysis;

    // Enhanced sentiment analysis using AI
    const aiSentimentResults = await Promise.all(
      sentimentAnalysis.results.map(async (result: SentimentResult) => {
        const aiAnalysis = await analyzeSentimentWithAI(result.text);
        const customerInsights = await analyzeCustomerInsightsWithAI(result.text);
        
        return {
          ...result,
          aiSentiment: aiAnalysis.label,
          aiConfidence: aiAnalysis.score,
          customerInsights: customerInsights.labels[0],
          insightConfidence: customerInsights.scores[0],
        };
      })
    );
    
    return {
      sentimentAnalysis: aiSentimentResults,
      metrics: {
        ...sentimentAnalysis.metrics,
        aiMetrics: {
          positive: aiSentimentResults.filter(r => r.aiSentiment === 'positive').length,
          negative: aiSentimentResults.filter(r => r.aiSentiment === 'negative').length,
          neutral: aiSentimentResults.filter(r => r.aiSentiment === 'neutral').length,
          averageConfidence: aiSentimentResults.reduce((sum, r) => sum + r.aiConfidence, 0) / aiSentimentResults.length,
        },
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    throw new Error('Failed to analyze sentiment');
  }
}

// Mock event popularity prediction
export async function predictEventPopularity(eventData: { id: string; capacity: number; basePrice: number }) {
  try {
    const response = await fetch('/api/analytics');
    if (!response.ok) {
      throw new Error('Failed to fetch analytics data');
    }
    const data = await response.json();
    
    const { popularTrips, trends } = data.analysis;
    const isPopular = popularTrips.some((trip: PopularTrip) => trip.id === eventData.id);
    const similarTrip = popularTrips.find((trip: PopularTrip) => trip.id === eventData.id);

    // Generate AI-powered event analysis
    const eventContext = `
      Analyze the popularity of this event:
      - Event ID: ${eventData.id}
      - Capacity: ${eventData.capacity}
      - Base Price: ${formatCurrency(eventData.basePrice)}
      - Current Status: ${isPopular ? 'Popular' : 'Average'}
      - Market Trend: ${trends.sales.current}
      - Similar Trip Performance: ${similarTrip ? `
        * Sales: ${similarTrip.sales}
        * Engagement: ${(similarTrip.engagement * 100).toFixed(1)}%
        * Completion Rate: ${(similarTrip.completionRate * 100).toFixed(1)}%
      ` : 'N/A'}
    `;

    const aiAnalysis = await generatePredictionsWithAI(eventContext);
    
    const prediction = `
      Trip Popularity Analysis:
      1. Current Status: ${isPopular ? 'Popular' : 'Average'}
      2. Engagement Metrics:
         - Sales: ${similarTrip?.sales || 'N/A'}
         - Engagement Rate: ${similarTrip ? `${(similarTrip.engagement * 100).toFixed(1)}%` : 'N/A'}
         - Completion Rate: ${similarTrip ? `${(similarTrip.completionRate * 100).toFixed(1)}%` : 'N/A'}
      3. Market Trends:
         - Overall Sales Trend: ${trends.sales.current.toUpperCase()}
         - Expected Attendance: ${Math.round(eventData.capacity * (isPopular ? 0.9 : 0.7))} people
         - Revenue Potential: ${formatCurrency(eventData.capacity * eventData.basePrice * (isPopular ? 0.9 : 0.7))}
      
      AI-Generated Analysis:
      ${aiAnalysis}
      
      Recommendations:
      1. ${isPopular ? 'Consider increasing capacity' : 'Focus on marketing'}
      2. ${isPopular ? 'Implement premium pricing' : 'Offer early bird discounts'}
      3. ${isPopular ? 'Add more departure times' : 'Target specific customer segments'}
      4. ${trends.sales.current === 'increasing' ? 'Capitalize on growing market' : 'Focus on retention'}
    `;

    return {
      prediction,
      timestamp: new Date().toISOString(),
      metrics: {
        isPopular,
        capacity: eventData.capacity,
        basePrice: eventData.basePrice,
        engagement: similarTrip?.engagement,
        completionRate: similarTrip?.completionRate,
        marketTrend: trends.sales.current,
        aiAnalysis,
      },
    };
  } catch (error) {
    console.error('Error in event prediction:', error);
    throw new Error('Failed to predict event popularity');
  }
}

// Mock price optimization
export async function optimizePricing(eventData: { id: string; basePrice: number }) {
  try {
    const response = await fetch('/api/analytics');
    if (!response.ok) {
      throw new Error('Failed to fetch analytics data');
    }
    const data = await response.json();
    
    const { popularTrips, trends } = data.analysis;
    const isPopular = popularTrips.some((trip: PopularTrip) => trip.id === eventData.id);
    const similarTrip = popularTrips.find((trip: PopularTrip) => trip.id === eventData.id);
    
    const marketTrend = trends.sales.current;
    const baseMultiplier = isPopular ? 1.5 : 1.3;
    const trendMultiplier = marketTrend === 'increasing' ? 1.1 : 0.9;

    // Generate AI-powered pricing recommendations
    const pricingContext = `
      Optimize pricing for this event:
      - Event ID: ${eventData.id}
      - Base Price: ${formatCurrency(eventData.basePrice)}
      - Popularity: ${isPopular ? 'High' : 'Average'}
      - Market Trend: ${marketTrend}
      - Engagement Rate: ${similarTrip ? `${(similarTrip.engagement * 100).toFixed(1)}%` : 'N/A'}
      - Current Multipliers:
        * Base: ${baseMultiplier}
        * Trend: ${trendMultiplier}
    `;

    const aiRecommendations = await generatePredictionsWithAI(pricingContext);
    
    const recommendations = `
      Pricing Recommendations:
      1. Base Price: ${formatCurrency(eventData.basePrice)}
      2. Premium Seats: ${formatCurrency(eventData.basePrice * baseMultiplier * trendMultiplier)}
      3. Market Conditions:
         - Popularity: ${isPopular ? 'High' : 'Average'}
         - Market Trend: ${marketTrend.toUpperCase()}
         - Engagement Rate: ${similarTrip ? `${(similarTrip.engagement * 100).toFixed(1)}%` : 'N/A'}
      
      AI-Generated Pricing Strategy:
      ${aiRecommendations}
      
      Dynamic Pricing Strategy:
      1. ${marketTrend === 'increasing' ? 'Increase base price by 10%' : 'Maintain current price'}
      2. Early Bird Discount: 20% off (first 20% of tickets)
      3. Group Discounts:
         - 5-10 people: 10% off
         - 11-20 people: 15% off
         - 20+ people: 20% off
      4. Premium Features:
         - Priority boarding
         - Extra legroom
         - Complimentary refreshments
      
      Risk Assessment:
      1. Market Risk: ${marketTrend === 'decreasing' ? 'High' : 'Low'}
      2. Competitive Risk: ${isPopular ? 'Low' : 'Medium'}
      3. Revenue Risk: ${marketTrend === 'stable' ? 'Low' : 'Medium'}
    `;

    return {
      recommendations,
      timestamp: new Date().toISOString(),
      metrics: {
        basePrice: eventData.basePrice,
        isPopular,
        suggestedPremiumPrice: eventData.basePrice * baseMultiplier * trendMultiplier,
        marketTrend,
        engagement: similarTrip?.engagement,
        aiRecommendations,
      },
    };
  } catch (error) {
    console.error('Error in price optimization:', error);
    throw new Error('Failed to optimize pricing');
  }
} 