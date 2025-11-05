import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInventory } from '../hooks/useInventory';
import { useWarehouse } from '../hooks/useWarehouse';
import { useLocale } from '../hooks/useLocale';
import { Package, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { StatCardSkeleton, CardSkeleton } from '../components/skeletons';

export const Dashboard: React.FC = () => {
  const { items, history, loading } = useInventory();
  const { selectedWarehouse } = useWarehouse();
  const { t } = useLocale();

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const movementsToday = history.filter(entry => isToday(new Date(entry.timestamp))).length;
    const lowStockItems = items.filter(
      item => item.minQuantity && item.quantity <= item.minQuantity
    ).length;

    return { totalItems, totalQuantity, movementsToday, lowStockItems };
  }, [items, history]);

  const recentActivity = useMemo(() => {
    return history.slice(0, 10);
  }, [history]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'text-success';
      case 'out':
        return 'text-destructive';
      case 'adjustment':
        return 'text-warning';
      default:
        return '';
    }
  };

  if (!selectedWarehouse) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">{t('dashboard.selectWarehouse')}</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{selectedWarehouse.name}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        <CardSkeleton contentLines={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{selectedWarehouse.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalItems')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalQuantity')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuantity}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.movementsToday')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.movementsToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.lowStock')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.lowStockItems}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('history.noHistory')}</div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{entry.itemName}</div>
                    <div className="text-sm text-muted-foreground">
                      <span className={getTypeColor(entry.type)}>
                        {t(`history.${entry.type}`)}
                      </span>
                      {' • '}
                      {entry.username}
                      {' • '}
                      {format(new Date(entry.timestamp), 'PPp')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {entry.previousQuantity} → {entry.newQuantity}
                    </div>
                    <div className={`text-xs ${getTypeColor(entry.type)}`}>
                      {entry.type === 'in' ? '+' : entry.type === 'out' ? '-' : '±'}
                      {entry.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
