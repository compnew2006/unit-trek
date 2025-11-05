import { useContext } from 'react';
import { WarehouseContext } from '../context/WarehouseContext';

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};
