// Excel import/export service
import * as XLSX from 'xlsx';
import { Item, HistoryEntry } from '../types';

export const excelService = {
  // Download template Excel file
  downloadTemplate: () => {
    const templateData = [
      {
        Name: 'Sample Item 1',
        Barcode: '123456789',
        Quantity: 100,
        'Min Quantity': 10,
        Description: 'This is a sample item description'
      },
      {
        Name: 'Sample Item 2',
        Barcode: '987654321',
        Quantity: 50,
        'Min Quantity': 5,
        Description: 'Another sample item'
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Name
      { wch: 15 }, // Barcode
      { wch: 10 }, // Quantity
      { wch: 12 }, // Min Quantity
      { wch: 30 }, // Description
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    XLSX.writeFile(workbook, 'Inventory_Import_Template.xlsx');
  },
  
  // Export items to Excel
  exportItems: (items: Item[], warehouseName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(
      items.map(item => ({
        Name: item.name,
        Barcode: item.barcode || '',
        Quantity: item.quantity,
        'Min Quantity': item.minQuantity || '',
        Description: item.description || '',
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    
    XLSX.writeFile(workbook, `${warehouseName}_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
  },
  
  // Export history to Excel
  exportHistory: (history: HistoryEntry[], warehouseName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(
      history.map(entry => ({
        Timestamp: new Date(entry.timestamp).toLocaleString(),
        Item: entry.itemName,
        Warehouse: entry.warehouseName,
        Type: entry.type,
        Quantity: entry.quantity,
        'Previous Qty': entry.previousQuantity,
        'New Qty': entry.newQuantity,
        User: entry.username,
        Notes: entry.notes || '',
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'History');
    
    XLSX.writeFile(workbook, `${warehouseName}_History_${new Date().toISOString().split('T')[0]}.xlsx`);
  },
  
  // Import items from Excel
  importItems: async (file: File): Promise<Partial<Item>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const items: Partial<Item>[] = jsonData.map((row: any) => ({
            name: row['Name'] || row['name'] || '',
            barcode: row['Barcode'] || row['barcode'] || '',
            quantity: Number(row['Quantity'] || row['quantity']) || 0,
            minQuantity: row['Min Quantity'] || row['minQuantity'] || row['min_quantity'] ? Number(row['Min Quantity'] || row['minQuantity'] || row['min_quantity']) : undefined,
            description: row['Description'] || row['description'] || '',
          }));
          
          resolve(items);
        } catch (error) {
          reject(new Error('Failed to parse Excel file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsBinaryString(file);
    });
  },
};
