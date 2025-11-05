import { Item, HistoryEntry } from '../types';

// Trend Analysis Types
export interface TrendData {
  period: string;
  value: number;
  date: Date;
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  percentage: number;
  average: number;
  data: TrendData[];
}

export interface ForecastData {
  period: string;
  forecasted: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
}

export interface InventoryForecast {
  itemId: string;
  itemName: string;
  currentStock: number;
  forecastedStock: number[];
  forecastedDates: string[];
  stockoutRisk: 'low' | 'medium' | 'high';
  recommendedOrder: number;
  reorderDate: string;
}

// Calculate moving average
export const calculateMovingAverage = (data: number[], period: number): number[] => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
};

// Linear regression for trend analysis
export const calculateLinearRegression = (data: TrendData[]): { slope: number; intercept: number; r2: number } => {
  const n = data.length;
  const x = data.map((_, i) => i);
  const y = data.map(d => d.value);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const yMean = sumY / n;
  const ssRes = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const r2 = 1 - (ssRes / ssTot);

  return { slope, intercept, r2 };
};

// Analyze trend from data
export const analyzeTrend = (data: TrendData[]): TrendAnalysis => {
  if (data.length < 2) {
    return {
      trend: 'stable',
      percentage: 0,
      average: data[0]?.value || 0,
      data,
    };
  }

  const { slope, intercept, r2 } = calculateLinearRegression(data);
  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;
  const average = data.reduce((sum, d) => sum + d.value, 0) / data.length;

  let trend: 'increasing' | 'decreasing' | 'stable';
  const percentage = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  if (Math.abs(slope) < average * 0.01 || Math.abs(percentage) < 5) {
    trend = 'stable';
  } else if (slope > 0 || percentage > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }

  return {
    trend,
    percentage: Math.abs(percentage),
    average,
    data,
  };
};

// Simple exponential smoothing for forecasting
export const exponentialSmoothing = (data: number[], alpha: number = 0.3): number[] => {
  if (data.length === 0) return [];
  if (data.length === 1) return [data[0]];

  const result: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
};

// Forecast future values using linear regression
export const forecastValues = (
  data: TrendData[],
  periods: number,
  confidenceLevel: number = 0.95
): ForecastData[] => {
  if (data.length < 2) {
    return [];
  }

  const { slope, intercept, r2 } = calculateLinearRegression(data);
  const lastIndex = data.length - 1;
  const variance = data.reduce((sum, d, i) => {
    const predicted = slope * i + intercept;
    return sum + Math.pow(d.value - predicted, 2);
  }, 0) / data.length;

  // Z-score for confidence interval (simplified)
  const zScore = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.99 ? 2.58 : 1.64;

  const forecast: ForecastData[] = [];
  for (let i = 1; i <= periods; i++) {
    const futureIndex = lastIndex + i;
    const forecasted = slope * futureIndex + intercept;
    const error = Math.sqrt(variance * (1 + 1 / data.length + Math.pow(futureIndex - lastIndex, 2) / data.length));
    const margin = zScore * error;

    forecast.push({
      period: `Period ${i}`,
      forecasted: Math.max(0, forecasted),
      confidence: r2,
      lowerBound: Math.max(0, forecasted - margin),
      upperBound: forecasted + margin,
    });
  }

  return forecast;
};

// Calculate inventory turnover rate
export const calculateTurnoverRate = (
  items: Item[],
  history: HistoryEntry[],
  days: number = 30
): Map<string, { item: Item; turnover: number; daysOnHand: number }> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentHistory = history.filter(h => new Date(h.timestamp) >= cutoffDate);
  const itemOutflows = new Map<string, number>();

  recentHistory.forEach(entry => {
    if (entry.type === 'out') {
      const current = itemOutflows.get(entry.item_id) || 0;
      itemOutflows.set(entry.item_id, current + entry.quantity);
    }
  });

  const turnover = new Map<string, { item: Item; turnover: number; daysOnHand: number }>();
  
  items.forEach(item => {
    const outflows = itemOutflows.get(item.id) || 0;
    const avgStock = item.quantity / 2; // Simplified average stock
    const turnoverRate = avgStock > 0 ? (outflows / avgStock) * (365 / days) : 0;
    const daysOnHand = turnoverRate > 0 ? 365 / turnoverRate : 999;

    turnover.set(item.id, {
      item,
      turnover: turnoverRate,
      daysOnHand,
    });
  });

  return turnover;
};

// Forecast inventory levels and stockout risk
export const forecastInventory = (
  item: Item,
  history: HistoryEntry[],
  days: number = 30
): InventoryForecast => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentHistory = history
    .filter(h => h.item_id === item.id && new Date(h.timestamp) >= cutoffDate)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Group by day and calculate daily consumption
  const dailyConsumption = new Map<string, number>();
  recentHistory.forEach(entry => {
    if (entry.type === 'out') {
      const date = new Date(entry.timestamp).toISOString().split('T')[0];
      const current = dailyConsumption.get(date) || 0;
      dailyConsumption.set(date, current + entry.quantity);
    }
  });

  // Calculate average daily consumption
  const consumptionValues = Array.from(dailyConsumption.values());
  const avgDailyConsumption = consumptionValues.length > 0
    ? consumptionValues.reduce((a, b) => a + b, 0) / consumptionValues.length
    : 0;

  // Forecast next 7 days
  const forecastedStock: number[] = [];
  const forecastedDates: string[] = [];
  let currentStock = item.quantity;

  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    forecastedDates.push(date.toISOString().split('T')[0]);
    
    currentStock -= avgDailyConsumption;
    forecastedStock.push(Math.max(0, currentStock));
  }

  // Determine stockout risk
  const daysUntilStockout = avgDailyConsumption > 0 ? item.quantity / avgDailyConsumption : 999;
  let stockoutRisk: 'low' | 'medium' | 'high';
  if (daysUntilStockout > 14) {
    stockoutRisk = 'low';
  } else if (daysUntilStockout > 7) {
    stockoutRisk = 'medium';
  } else {
    stockoutRisk = 'high';
  }

  // Calculate recommended order quantity (safety stock + lead time demand)
  const safetyStock = item.minQuantity || 0;
  const leadTimeDays = 7; // Assume 7 days lead time
  const leadTimeDemand = avgDailyConsumption * leadTimeDays;
  const recommendedOrder = Math.max(0, (safetyStock + leadTimeDemand) - item.quantity);

  // Calculate reorder date
  const reorderDate = new Date();
  reorderDate.setDate(reorderDate.getDate() + Math.max(0, daysUntilStockout - leadTimeDays));

  return {
    itemId: item.id,
    itemName: item.name,
    currentStock: item.quantity,
    forecastedStock,
    forecastedDates,
    stockoutRisk,
    recommendedOrder,
    reorderDate: reorderDate.toISOString().split('T')[0],
  };
};

// Calculate seasonal patterns (simplified)
export const detectSeasonality = (data: TrendData[]): { seasonal: boolean; pattern: number[] } => {
  if (data.length < 12) {
    return { seasonal: false, pattern: [] };
  }

  // Group by month (simplified seasonality detection)
  const monthlyAverages = new Map<number, number[]>();
  data.forEach(d => {
    const month = new Date(d.date).getMonth();
    if (!monthlyAverages.has(month)) {
      monthlyAverages.set(month, []);
    }
    monthlyAverages.get(month)!.push(d.value);
  });

  const pattern: number[] = [];
  for (let i = 0; i < 12; i++) {
    const values = monthlyAverages.get(i) || [];
    pattern.push(values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0);
  }

  // Check if there's significant variation (coefficient of variation > 0.2)
  const mean = pattern.reduce((a, b) => a + b, 0) / 12;
  const variance = pattern.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 12;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;

  return {
    seasonal: cv > 0.2,
    pattern,
  };
};

// Calculate correlation between two datasets
export const calculateCorrelation = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  return denominator !== 0 ? numerator / denominator : 0;
};
