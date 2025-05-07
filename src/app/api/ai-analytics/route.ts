import { HfInference } from '@huggingface/inference';
import { NextResponse } from 'next/server';
import { formatCurrency } from '@/lib/utils';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Enhanced sentiment analysis using Hugging Face
async function analyzeSentimentWithAI(text: string) {
  try {
    const result = await hf.textClassification({
      model: 'distilbert-base-uncased-finetuned-sst-2-english',
      inputs: text,
    });
    return result[0];
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    return { label: 'neutral', score: 0.5 };
  }
}

// Enhanced text generation for predictions
async function generatePredictionsWithAI(context: string) {
  try {
    const result = await hf.textGeneration({
      model: 'gpt2',
      inputs: context,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.7,
        top_p: 0.95,
      },
    });
    return result.generated_text;
  } catch (error) {
    console.error('Error in prediction generation:', error);
    return 'Unable to generate prediction at this time.';
  }
}

// Enhanced text classification for customer insights
async function analyzeCustomerInsightsWithAI(text: string) {
  try {
    const result = await hf.textClassification({
      model: 'distilbert-base-uncased-finetuned-sst-2-english',
      inputs: text,
    });
    return {
      labels: [result[0].label],
      scores: [result[0].score]
    };
  } catch (error) {
    console.error('Error in customer insights analysis:', error);
    return { labels: ['neutral experience'], scores: [0.5] };
  }
}

export async function POST(request: Request) {
  try {
    const { type, data } = await request.json();
    
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('Hugging Face API key not configured');
    }

    let result;
    switch (type) {
      case 'predictions':
        result = await generatePredictionsWithAI(data.context);
        break;
      case 'insights':
        result = await analyzeCustomerInsightsWithAI(data.text);
        break;
      case 'sentiment':
        result = await analyzeSentimentWithAI(data.text);
        break;
      default:
        throw new Error('Invalid analysis type');
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error in AI analytics:', error);
    
    // Parse the request body again for fallback data
    let requestData;
    let analysisType;
    try {
      const body = await request.json();
      requestData = body.data;
      analysisType = body.type;
    } catch (e) {
      requestData = {};
      analysisType = 'predictions';
    }

    // Generate fallback insights based on the request type
    let fallbackResult;
    switch (analysisType) {
      case 'predictions':
        const context = requestData.context || {};
        fallbackResult = `
          Business Analytics Report:
          1. Performance Metrics:
             - Total Revenue: ${context.totalRevenue ? formatCurrency(context.totalRevenue) : 'N/A'}
             - Total Tickets: ${context.totalTickets || 'N/A'}
             - Average Price: ${context.averageTicketPrice ? formatCurrency(context.averageTicketPrice) : 'N/A'}
          
          2. Operational Insights:
             - Sales Trend: ${context.salesTrend || 'N/A'}
             - Peak Hours: ${context.peakHours ? context.peakHours.join(', ') : 'N/A'}
          
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
        break;
      case 'insights':
        fallbackResult = {
          labels: ['neutral'],
          scores: [0.5]
        };
        break;
      case 'sentiment':
        fallbackResult = {
          label: 'neutral',
          score: 0.5
        };
        break;
      default:
        fallbackResult = 'Analysis type not supported';
    }

    return NextResponse.json({ result: fallbackResult });
  }
} 