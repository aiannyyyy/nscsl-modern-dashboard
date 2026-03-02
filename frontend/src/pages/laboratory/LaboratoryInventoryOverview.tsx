import React from 'react';
import { LaboratorySupplies } from './components/LaboratorySupplies';
import { ReagentSupplies } from './components/ReagentSupplies';

export const LaboratoryInventoryOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Supplies Row — 50/50 split */}
      <div className="grid grid-cols-2 gap-6">
        <LaboratorySupplies />
        <ReagentSupplies />
      </div>
    </div>
  );
};