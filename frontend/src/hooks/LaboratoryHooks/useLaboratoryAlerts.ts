import { useState, useEffect } from 'react';
import { getLabSupplies } from '../../services/LaboratoryServices/labSuppliesService';
import { getLabReagents } from '../../services/LaboratoryServices/labReagentsService';

export interface LaboratoryAlert {
  id: string;
  type: 'supply' | 'reagent';
  itemCode: string;
  description: string;
  stock: number;
  unit: string;
  status: 'warning' | 'critical';
  timestamp: Date;
}

export const useLaboratoryAlerts = () => {
  const [alerts, setAlerts] = useState<LaboratoryAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const checkInventory = async () => {
    try {
      setLoading(true);
      const [suppliesRes, reagentsRes] = await Promise.all([
        getLabSupplies(),
        getLabReagents(),
      ]);

      const newAlerts: LaboratoryAlert[] = [];

      // Check supplies
      suppliesRes.data.forEach((supply) => {
        if (supply.status === 'warning' || supply.status === 'critical') {
          newAlerts.push({
            id: `supply-${supply.itemCode}`,
            type: 'supply',
            itemCode: supply.itemCode,
            description: supply.description,
            stock: supply.stock,
            unit: supply.unit,
            status: supply.status,
            timestamp: new Date(),
          });
        }
      });

      // Check reagents
      reagentsRes.data.forEach((reagent) => {
        if (reagent.status === 'warning' || reagent.status === 'critical') {
          newAlerts.push({
            id: `reagent-${reagent.itemCode}`,
            type: 'reagent',
            itemCode: reagent.itemCode,
            description: reagent.description,
            stock: reagent.stock,
            unit: reagent.unit,
            status: reagent.status,
            timestamp: new Date(),
          });
        }
      });

      setAlerts(newAlerts);
    } catch (err) {
      console.error('Failed to check inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkInventory();
    // Check every 5 minutes
    const interval = setInterval(checkInventory, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { alerts, loading, refetch: checkInventory };
};