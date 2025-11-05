import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '../components/DateRangePicker';
import { useInventory } from '../hooks/useInventory';
import { useWarehouse } from '../hooks/useWarehouse';
import { useLocale } from '../hooks/useLocale';
import { api } from '../services/apiService';
import { Item, HistoryEntry } from '../types';
import * as XLSX from 'xlsx';
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  BarChart3,
  Calendar,
  Warehouse,
} from 'lucide-react';
import { format, isToday, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { toast } from 'sonner';

export const Reports: React.FC = () => {
  const { items, history } = useInventory();
  const { warehouses, selectedWarehouse } = useWarehouse();
  const { t } = useLocale();
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [allHistory, setAllHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory-summary');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date | undefined>(endOfMonth(new Date()));
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [itemFilter, setItemFilter] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [itemsData, historyData] = await Promise.all([
          api.items.getAll(),
          api.history.getAll(),
        ]);
        setAllItems(itemsData);
        setAllHistory(historyData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter data based on warehouse and date range
  const filteredItems = useMemo(() => {
    let filtered = allItems;
    if (warehouseFilter !== 'all') {
      filtered = filtered.filter(item => item.warehouseId === warehouseFilter);
    }
    return filtered;
  }, [allItems, warehouseFilter]);

  const filteredHistory = useMemo(() => {
    let filtered = allHistory;
    
    if (warehouseFilter !== 'all') {
      filtered = filtered.filter(entry => {
        const item = allItems.find(i => i.id === entry.itemId);
        return item?.warehouseId === warehouseFilter;
      });
    }
    
    if (itemFilter !== 'all') {
      filtered = filtered.filter(entry => entry.itemId === itemFilter);
    }
    
    if (dateFrom || dateTo) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        if (dateFrom && entryDate < dateFrom) return false;
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          if (entryDate > endOfDay) return false;
        }
        return true;
      });
    }
    
    return filtered;
  }, [allHistory, allItems, warehouseFilter, itemFilter, dateFrom, dateTo]);

  // Common Reports
  const inventorySummary = useMemo(() => {
    const totalItems = filteredItems.length;
    const totalQuantity = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = filteredItems.reduce((sum, item) => sum + (item.quantity * (item as any).unitPrice || 0), 0);
    const lowStockItems = filteredItems.filter(item => item.minQuantity && item.quantity <= item.minQuantity);
    const outOfStockItems = filteredItems.filter(item => item.quantity === 0);
    
    return {
      totalItems,
      totalQuantity,
      totalValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems,
      outOfStockItems,
    };
  }, [filteredItems]);

  const movementReport = useMemo(() => {
    const movementsIn = filteredHistory.filter(e => e.type === 'in');
    const movementsOut = filteredHistory.filter(e => e.type === 'out');
    const movementsAdjustment = filteredHistory.filter(e => e.type === 'adjustment');
    
    const totalIn = movementsIn.reduce((sum, e) => sum + e.quantity, 0);
    const totalOut = movementsOut.reduce((sum, e) => sum + e.quantity, 0);
    const netMovement = totalIn - totalOut;
    
    return {
      movementsIn: movementsIn.length,
      movementsOut: movementsOut.length,
      movementsAdjustment: movementsAdjustment.length,
      totalIn,
      totalOut,
      netMovement,
      movements: filteredHistory,
    };
  }, [filteredHistory]);

  const warehouseSummary = useMemo(() => {
    return warehouses.map(warehouse => {
      const warehouseItems = allItems.filter(item => item.warehouseId === warehouse.id);
      const totalQuantity = warehouseItems.reduce((sum, item) => sum + item.quantity, 0);
      const lowStockCount = warehouseItems.filter(item => item.minQuantity && item.quantity <= item.minQuantity).length;
      
      return {
        warehouse,
        itemCount: warehouseItems.length,
        totalQuantity,
        lowStockCount,
      };
    });
  }, [warehouses, allItems]);

  // Advanced Reports
  const turnoverAnalysis = useMemo(() => {
    const itemTurnover: Record<string, {
      item: Item;
      totalIn: number;
      totalOut: number;
      netMovement: number;
      currentStock: number;
      turnoverRate: number;
    }> = {};

    filteredHistory.forEach(entry => {
      const item = allItems.find(i => i.id === entry.itemId);
      if (!item) return;

      if (!itemTurnover[entry.itemId]) {
        itemTurnover[entry.itemId] = {
          item,
          totalIn: 0,
          totalOut: 0,
          netMovement: 0,
          currentStock: item.quantity,
          turnoverRate: 0,
        };
      }

      if (entry.type === 'in') {
        itemTurnover[entry.itemId].totalIn += entry.quantity;
      } else if (entry.type === 'out') {
        itemTurnover[entry.itemId].totalOut += entry.quantity;
      }
    });

    Object.values(itemTurnover).forEach(data => {
      data.netMovement = data.totalIn - data.totalOut;
      data.turnoverRate = data.currentStock > 0 ? (data.totalOut / data.currentStock) * 100 : 0;
    });

    return Object.values(itemTurnover).sort((a, b) => b.turnoverRate - a.turnoverRate);
  }, [filteredHistory, allItems]);

  const exportReport = (reportType: string, data: any) => {
    try {
      const warehouseName = warehouseFilter === 'all' ? 'All_Warehouses' : warehouses.find(w => w.id === warehouseFilter)?.name || 'Unknown';
      const dateStr = dateFrom && dateTo 
        ? `${format(dateFrom, 'yyyy-MM-dd')}_to_${format(dateTo, 'yyyy-MM-dd')}`
        : format(new Date(), 'yyyy-MM-dd');
      
      const filename = `${reportType}_${warehouseName}_${dateStr}.xlsx`;
      
      // Create export data based on report type
      let exportData: any[] = [];
      
      switch (reportType) {
        case 'inventory_summary':
          exportData = filteredItems.map(item => ({
            Name: item.name,
            Barcode: item.barcode || '',
            Warehouse: warehouses.find(w => w.id === item.warehouseId)?.name || '',
            Quantity: item.quantity,
            'Min Quantity': item.minQuantity || '',
            Status: item.minQuantity && item.quantity <= item.minQuantity ? 'Low Stock' : item.quantity === 0 ? 'Out of Stock' : 'In Stock',
          }));
          break;
        case 'movement_report':
          exportData = filteredHistory.map(entry => ({
            Date: format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm'),
            Item: entry.itemName,
            Warehouse: warehouses.find(w => w.id === allItems.find(i => i.id === entry.itemId)?.warehouseId)?.name || '',
            Type: entry.type,
            Quantity: entry.quantity,
            'Previous Qty': entry.previousQuantity,
            'New Qty': entry.newQuantity,
            User: entry.username,
            Notes: entry.notes || '',
          }));
          break;
        case 'low_stock':
          exportData = inventorySummary.lowStockItems.map(item => ({
            Name: item.name,
            Barcode: item.barcode || '',
            Warehouse: warehouses.find(w => w.id === item.warehouseId)?.name || '',
            'Current Qty': item.quantity,
            'Min Qty': item.minQuantity,
            'Deficit': (item.minQuantity || 0) - item.quantity,
          }));
          break;
      }

      // Use XLSX directly for export
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, reportType);
      XLSX.writeFile(workbook, filename);
      
      toast.success(t('reports.exportSuccess') || 'Report exported successfully');
    } catch (error) {
      toast.error(t('reports.exportError') || 'Failed to export report');
      console.error('Export error:', error);
    }
  };

  const getWarehouseName = (warehouseId: string) => {
    return warehouses.find(w => w.id === warehouseId)?.name || warehouseId;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('reports.title') || 'Reports'}</h1>
          <p className="text-muted-foreground mt-2">
            {t('reports.subtitle') || 'Generate and export detailed reports'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.filters') || 'Filters'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('reports.allWarehouses') || 'All Warehouses'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('reports.allWarehouses') || 'All Warehouses'}</SelectItem>
                {warehouses.map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker
              from={dateFrom}
              to={dateTo}
              onSelect={(from, to) => {
                setDateFrom(from);
                setDateTo(to);
              }}
            />

            <Select value={itemFilter} onValueChange={setItemFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('reports.allItems') || 'All Items'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('reports.allItems') || 'All Items'}</SelectItem>
                {filteredItems.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="inventory-summary">
            <Package className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t('reports.inventorySummary') || 'Inventory'}
          </TabsTrigger>
          <TabsTrigger value="low-stock">
            <AlertTriangle className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t('reports.lowStock') || 'Low Stock'}
          </TabsTrigger>
          <TabsTrigger value="movements">
            <TrendingUp className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t('reports.movements') || 'Movements'}
          </TabsTrigger>
          <TabsTrigger value="warehouses">
            <Warehouse className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t('reports.warehouses') || 'Warehouses'}
          </TabsTrigger>
          <TabsTrigger value="turnover">
            <BarChart3 className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t('reports.turnover') || 'Turnover'}
          </TabsTrigger>
        </TabsList>

        {/* Inventory Summary */}
        <TabsContent value="inventory-summary" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('reports.inventorySummary') || 'Inventory Summary'}</CardTitle>
                <CardDescription>
                  {t('reports.inventorySummaryDesc') || 'Overview of all inventory items'}
                </CardDescription>
              </div>
              <Button onClick={() => exportReport('inventory_summary', filteredItems)}>
                <Download className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('reports.export') || 'Export'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">{t('reports.totalItems') || 'Total Items'}</div>
                  <div className="text-2xl font-bold">{inventorySummary.totalItems}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">{t('reports.totalQuantity') || 'Total Quantity'}</div>
                  <div className="text-2xl font-bold">{inventorySummary.totalQuantity}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">{t('reports.lowStock') || 'Low Stock'}</div>
                  <div className="text-2xl font-bold text-warning">{inventorySummary.lowStockCount}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">{t('reports.outOfStock') || 'Out of Stock'}</div>
                  <div className="text-2xl font-bold text-destructive">{inventorySummary.outOfStockCount}</div>
                </div>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('inventory.name')}</TableHead>
                      <TableHead>{t('inventory.barcode')}</TableHead>
                      <TableHead>{t('allWarehouses.warehouse')}</TableHead>
                      <TableHead>{t('inventory.quantity')}</TableHead>
                      <TableHead>{t('inventory.minQuantity')}</TableHead>
                      <TableHead>{t('reports.status') || 'Status'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {t('inventory.noItems')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.barcode || '-'}</TableCell>
                          <TableCell>{getWarehouseName(item.warehouseId)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.minQuantity || '-'}</TableCell>
                          <TableCell>
                            {item.quantity === 0 ? (
                              <span className="text-destructive">{t('reports.outOfStock') || 'Out of Stock'}</span>
                            ) : item.minQuantity && item.quantity <= item.minQuantity ? (
                              <span className="text-warning">{t('reports.lowStock') || 'Low Stock'}</span>
                            ) : (
                              <span className="text-success">{t('reports.inStock') || 'In Stock'}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock Report */}
        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('reports.lowStockReport') || 'Low Stock Report'}</CardTitle>
                <CardDescription>
                  {t('reports.lowStockReportDesc') || 'Items that are below minimum quantity threshold'}
                </CardDescription>
              </div>
              <Button onClick={() => exportReport('low_stock', inventorySummary.lowStockItems)}>
                <Download className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('reports.export') || 'Export'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('inventory.name')}</TableHead>
                      <TableHead>{t('inventory.barcode')}</TableHead>
                      <TableHead>{t('allWarehouses.warehouse')}</TableHead>
                      <TableHead>{t('inventory.quantity')}</TableHead>
                      <TableHead>{t('inventory.minQuantity')}</TableHead>
                      <TableHead>{t('reports.deficit') || 'Deficit'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventorySummary.lowStockItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {t('reports.noLowStock') || 'No low stock items found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      inventorySummary.lowStockItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.barcode || '-'}</TableCell>
                          <TableCell>{getWarehouseName(item.warehouseId)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.minQuantity}</TableCell>
                          <TableCell className="text-warning">
                            {(item.minQuantity || 0) - item.quantity}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movement Report */}
        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('reports.movementReport') || 'Movement Report'}</CardTitle>
                <CardDescription>
                  {t('reports.movementReportDesc') || 'Detailed movement history and statistics'}
                </CardDescription>
              </div>
              <Button onClick={() => exportReport('movement_report', filteredHistory)}>
                <Download className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('reports.export') || 'Export'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">{t('reports.movementsIn') || 'Movements In'}</div>
                  <div className="text-2xl font-bold text-success">{movementReport.movementsIn}</div>
                  <div className="text-sm text-muted-foreground">Total: {movementReport.totalIn}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">{t('reports.movementsOut') || 'Movements Out'}</div>
                  <div className="text-2xl font-bold text-destructive">{movementReport.movementsOut}</div>
                  <div className="text-sm text-muted-foreground">Total: {movementReport.totalOut}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">{t('reports.adjustments') || 'Adjustments'}</div>
                  <div className="text-2xl font-bold text-warning">{movementReport.movementsAdjustment}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">{t('reports.netMovement') || 'Net Movement'}</div>
                  <div className={`text-2xl font-bold ${movementReport.netMovement >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {movementReport.netMovement >= 0 ? '+' : ''}{movementReport.netMovement}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('history.date')}</TableHead>
                      <TableHead>{t('history.item')}</TableHead>
                      <TableHead>{t('allWarehouses.warehouse')}</TableHead>
                      <TableHead>{t('history.type')}</TableHead>
                      <TableHead>{t('history.quantity')}</TableHead>
                      <TableHead>{t('history.user')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {t('history.noHistory')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.slice(0, 100).map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell>{format(new Date(entry.timestamp), 'PPp')}</TableCell>
                          <TableCell>{entry.itemName}</TableCell>
                          <TableCell>{getWarehouseName(allItems.find(i => i.id === entry.itemId)?.warehouseId || '')}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${
                              entry.type === 'in' ? 'text-success' : 
                              entry.type === 'out' ? 'text-destructive' : 'text-warning'
                            }`}>
                              {t(`history.${entry.type}`)}
                            </span>
                          </TableCell>
                          <TableCell>{entry.quantity}</TableCell>
                          <TableCell>{entry.username}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Warehouse Summary */}
        <TabsContent value="warehouses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.warehouseSummary') || 'Warehouse Summary'}</CardTitle>
              <CardDescription>
                {t('reports.warehouseSummaryDesc') || 'Overview of inventory across all warehouses'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('warehouses.name')}</TableHead>
                      <TableHead>{t('reports.itemCount') || 'Items'}</TableHead>
                      <TableHead>{t('reports.totalQuantity')}</TableHead>
                      <TableHead>{t('reports.lowStock')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouseSummary.map(({ warehouse, itemCount, totalQuantity, lowStockCount }) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-medium">{warehouse.name}</TableCell>
                        <TableCell>{itemCount}</TableCell>
                        <TableCell>{totalQuantity}</TableCell>
                        <TableCell>
                          {lowStockCount > 0 ? (
                            <span className="text-warning">{lowStockCount}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Turnover Analysis */}
        <TabsContent value="turnover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.turnoverAnalysis') || 'Turnover Analysis'}</CardTitle>
              <CardDescription>
                {t('reports.turnoverAnalysisDesc') || 'Items ranked by turnover rate'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('inventory.name')}</TableHead>
                      <TableHead>{t('allWarehouses.warehouse')}</TableHead>
                      <TableHead>{t('reports.currentStock') || 'Current Stock'}</TableHead>
                      <TableHead>{t('reports.totalIn') || 'Total In'}</TableHead>
                      <TableHead>{t('reports.totalOut') || 'Total Out'}</TableHead>
                      <TableHead>{t('reports.netMovement')}</TableHead>
                      <TableHead>{t('reports.turnoverRate') || 'Turnover Rate %'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {turnoverAnalysis.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {t('reports.noTurnoverData') || 'No turnover data available'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      turnoverAnalysis.map(({ item, totalIn, totalOut, netMovement, currentStock, turnoverRate }) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{getWarehouseName(item.warehouseId)}</TableCell>
                          <TableCell>{currentStock}</TableCell>
                          <TableCell className="text-success">{totalIn}</TableCell>
                          <TableCell className="text-destructive">{totalOut}</TableCell>
                          <TableCell className={netMovement >= 0 ? 'text-success' : 'text-destructive'}>
                            {netMovement >= 0 ? '+' : ''}{netMovement}
                          </TableCell>
                          <TableCell>
                            <span className={turnoverRate > 50 ? 'text-warning' : ''}>
                              {turnoverRate.toFixed(2)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
