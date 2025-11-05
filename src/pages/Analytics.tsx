import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useInventory } from '../hooks/useInventory';
import { useWarehouse } from '../hooks/useWarehouse';
import { useLocale } from '../hooks/useLocale';
import {
  TrendData,
  TrendAnalysis,
  ForecastData,
  InventoryForecast,
  analyzeTrend,
  forecastValues,
  calculateTurnoverRate,
  forecastInventory,
  detectSeasonality,
} from '../utils/analytics';
import { Item, HistoryEntry } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3,
  Activity,
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

export const Analytics: React.FC = () => {
  const { items, history } = useInventory();
  const { warehouses, selectedWarehouse } = useWarehouse();
  const { t } = useLocale();

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [forecastPeriods, setForecastPeriods] = useState(7);

  // Filter history by time range
  const filteredHistory = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const cutoffDate = subDays(new Date(), days);
    return history.filter(h => new Date(h.timestamp) >= cutoffDate);
  }, [history, timeRange]);

  // Filter items by warehouse
  const filteredItems = useMemo(() => {
    if (!selectedWarehouse) return items;
    return items.filter(item => item.warehouseId === selectedWarehouse.id);
  }, [items, selectedWarehouse]);

  // Prepare trend data for selected item
  const itemTrendData = useMemo((): TrendData[] => {
    if (!selectedItemId) return [];

    const itemHistory = filteredHistory
      .filter(h => h.item_id === selectedItemId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Group by day
    const dailyData = new Map<string, number>();
    itemHistory.forEach(entry => {
      const date = format(parseISO(entry.timestamp), 'yyyy-MM-dd');
      const current = dailyData.get(date) || 0;
      if (entry.type === 'in') {
        dailyData.set(date, current + entry.quantity);
      } else if (entry.type === 'out') {
        dailyData.set(date, current - entry.quantity);
      }
    });

    // Calculate cumulative stock
    const sortedDates = Array.from(dailyData.keys()).sort();
    let cumulativeStock = items.find(i => i.id === selectedItemId)?.quantity || 0;
    
    // Work backwards to get starting stock
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const date = sortedDates[i];
      const change = dailyData.get(date) || 0;
      cumulativeStock -= change;
    }

    const trendData: TrendData[] = [];
    sortedDates.forEach(date => {
      const change = dailyData.get(date) || 0;
      cumulativeStock += change;
      trendData.push({
        period: date,
        value: cumulativeStock,
        date: parseISO(date),
      });
    });

    return trendData;
  }, [selectedItemId, filteredHistory, items]);

  // Analyze trend
  const trendAnalysis = useMemo((): TrendAnalysis | null => {
    if (itemTrendData.length < 2) return null;
    return analyzeTrend(itemTrendData);
  }, [itemTrendData]);

  // Forecast values
  const forecast = useMemo((): ForecastData[] => {
    if (itemTrendData.length < 2) return [];
    return forecastValues(itemTrendData, forecastPeriods);
  }, [itemTrendData, forecastPeriods]);

  // Inventory forecasts for all items
  const inventoryForecasts = useMemo((): InventoryForecast[] => {
    return filteredItems
      .map(item => forecastInventory(item, filteredHistory, 30))
      .sort((a, b) => {
        const riskOrder = { high: 3, medium: 2, low: 1 };
        return riskOrder[b.stockoutRisk] - riskOrder[a.stockoutRisk];
      });
  }, [filteredItems, filteredHistory]);

  // Turnover analysis
  const turnoverData = useMemo(() => {
    return calculateTurnoverRate(filteredItems, filteredHistory, 30);
  }, [filteredItems, filteredHistory]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalItems = filteredItems.length;
    const totalValue = filteredItems.reduce((sum, item) => sum + (item.quantity * 1), 0); // Assuming price = 1
    const lowStockItems = filteredItems.filter(item => 
      item.minQuantity && item.quantity <= item.minQuantity
    ).length;
    const outOfStock = filteredItems.filter(item => item.quantity === 0).length;

    const movementsIn = filteredHistory.filter(h => h.type === 'in').length;
    const movementsOut = filteredHistory.filter(h => h.type === 'out').length;

    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStock,
      movementsIn,
      movementsOut,
    };
  }, [filteredItems, filteredHistory]);

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Prepare chart data for trend visualization
  const trendChartData = useMemo(() => {
    const chartData = itemTrendData.map(d => ({
      date: format(d.date, 'MMM dd'),
      stock: d.value,
    }));

    // Add forecast data
    forecast.forEach((f, i) => {
      const lastDate = itemTrendData[itemTrendData.length - 1]?.date || new Date();
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i + 1);
      
      chartData.push({
        date: format(forecastDate, 'MMM dd'),
        stock: f.forecasted,
        forecast: f.forecasted,
        upperBound: f.upperBound,
        lowerBound: f.lowerBound,
      });
    });

    return chartData;
  }, [itemTrendData, forecast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          {t('analytics.title') || 'Advanced Analytics'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('analytics.subtitle') || 'Trend analysis, forecasting, and predictive insights'}
        </p>
      </div>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.totalItems') || 'Total Items'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.lowStock') || 'Low Stock'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{overallStats.lowStockItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.outOfStock') || 'Out of Stock'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overallStats.outOfStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.movements') || 'Movements'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {t('analytics.in') || 'In'}: {overallStats.movementsIn} | {t('analytics.out') || 'Out'}: {overallStats.movementsOut}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="trends">
              <TrendingUp className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('analytics.trends') || 'Trends'}
            </TabsTrigger>
            <TabsTrigger value="forecast">
              <Calendar className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('analytics.forecast') || 'Forecast'}
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Activity className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('analytics.inventoryForecast') || 'Inventory Forecast'}
            </TabsTrigger>
            <TabsTrigger value="turnover">
              <BarChart3 className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('analytics.turnover') || 'Turnover'}
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Trend Analysis Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.trendAnalysis') || 'Trend Analysis'}</CardTitle>
              <CardDescription>
                {t('analytics.trendAnalysisDesc') || 'Analyze stock trends over time'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('inventory.name') || 'Item'}</Label>
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('analytics.selectItem') || 'Select an item'} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({item.barcode || 'No barcode'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedItemId && trendAnalysis && (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('analytics.trend') || 'Trend'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(trendAnalysis.trend)}
                          <span className="capitalize">{trendAnalysis.trend}</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('analytics.change') || 'Change'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {trendAnalysis.trend === 'increasing' ? '+' : trendAnalysis.trend === 'decreasing' ? '-' : ''}
                          {trendAnalysis.percentage.toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('analytics.average') || 'Average'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{trendAnalysis.average.toFixed(0)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="stock"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name={t('analytics.stock') || 'Stock'}
                      />
                      {forecast.length > 0 && (
                        <>
                          <Line
                            type="monotone"
                            dataKey="forecast"
                            stroke="#82ca9d"
                            strokeDasharray="5 5"
                            name={t('analytics.forecast') || 'Forecast'}
                          />
                          <Area
                            type="monotone"
                            dataKey="upperBound"
                            stroke="none"
                            fill="#82ca9d"
                            fillOpacity={0.1}
                          />
                          <Area
                            type="monotone"
                            dataKey="lowerBound"
                            stroke="none"
                            fill="#82ca9d"
                            fillOpacity={0.1}
                          />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </>
              )}

              {!selectedItemId && (
                <div className="text-center text-muted-foreground py-8">
                  {t('analytics.selectItemToView') || 'Select an item to view trend analysis'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.forecast') || 'Stock Forecast'}</CardTitle>
              <CardDescription>
                {t('analytics.forecastDesc') || 'Predictive analysis of future stock levels'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedItemId && forecast.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <Label>{t('analytics.forecastPeriods') || 'Forecast Periods'}</Label>
                    <Select
                      value={forecastPeriods.toString()}
                      onValueChange={(v) => setForecastPeriods(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={forecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="upperBound"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                        name={t('analytics.upperBound') || 'Upper Bound'}
                      />
                      <Area
                        type="monotone"
                        dataKey="forecasted"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.6}
                        name={t('analytics.forecasted') || 'Forecasted'}
                      />
                      <Area
                        type="monotone"
                        dataKey="lowerBound"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                        name={t('analytics.lowerBound') || 'Lower Bound'}
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold mb-2">{t('analytics.forecastDetails') || 'Forecast Details'}</h4>
                    <div className="space-y-2">
                      {forecast.map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{f.period}:</span>
                          <span className="font-medium">
                            {f.forecasted.toFixed(0)} ({f.lowerBound.toFixed(0)} - {f.upperBound.toFixed(0)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {t('analytics.selectItemForForecast') || 'Select an item to view forecast'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Forecast Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.inventoryForecast') || 'Inventory Forecast & Stockout Risk'}</CardTitle>
              <CardDescription>
                {t('analytics.inventoryForecastDesc') || 'Predict stock levels and identify items at risk'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryForecasts.map(forecast => (
                  <Card key={forecast.itemId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{forecast.itemName}</CardTitle>
                        <Badge variant={getRiskColor(forecast.stockoutRisk)}>
                          {t(`analytics.risk.${forecast.stockoutRisk}`) || forecast.stockoutRisk.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            {t('analytics.currentStock') || 'Current Stock'}
                          </Label>
                          <div className="text-xl font-bold">{forecast.currentStock}</div>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            {t('analytics.recommendedOrder') || 'Recommended Order'}
                          </Label>
                          <div className="text-xl font-bold text-primary">
                            {forecast.recommendedOrder > 0 ? forecast.recommendedOrder : '-'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            {t('analytics.reorderDate') || 'Reorder Date'}
                          </Label>
                          <div className="text-sm font-medium">
                            {format(parseISO(forecast.reorderDate), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            {t('analytics.stockoutRisk') || 'Risk Level'}
                          </Label>
                          <div className="flex items-center gap-1">
                            {forecast.stockoutRisk === 'high' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                            {forecast.stockoutRisk === 'medium' && <AlertTriangle className="h-4 w-4 text-warning" />}
                            {forecast.stockoutRisk === 'low' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            <span className="capitalize">{forecast.stockoutRisk}</span>
                          </div>
                        </div>
                      </div>

                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={forecast.forecastedStock.map((stock, i) => ({
                          date: forecast.forecastedDates[i],
                          stock,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" label="Out of Stock" />
                          <Line
                            type="monotone"
                            dataKey="stock"
                            stroke="#8884d8"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Turnover Analysis Tab */}
        <TabsContent value="turnover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.turnoverAnalysis') || 'Inventory Turnover Analysis'}</CardTitle>
              <CardDescription>
                {t('analytics.turnoverAnalysisDesc') || 'Items ranked by turnover rate'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={Array.from(turnoverData.values())
                    .sort((a, b) => b.turnover - a.turnover)
                    .slice(0, 10)
                    .map(data => ({
                      name: data.item.name,
                      turnover: data.turnover.toFixed(2),
                      daysOnHand: data.daysOnHand.toFixed(0),
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="turnover" fill="#8884d8" name={t('analytics.turnoverRate') || 'Turnover Rate'} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
