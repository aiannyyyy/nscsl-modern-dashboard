import React, { useState } from 'react';
import { FacilityVisitsChart } from './FacilityVisitsChart';
import { FacilityVisits } from './FacilityVisits';

export const FacilityVisitsContainer: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataChange = () => {
    console.log('📊 Data changed - incrementing refresh trigger from', refreshTrigger, 'to', refreshTrigger + 1);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Chart and Table Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[300px]">
        {/* Table on the left - 2 columns */}
        <div className="lg:col-span-2 h-full">
          <FacilityVisits onDataChange={handleDataChange} />
        </div>
        
        {/* Chart on the right - 1 column */}
        <div className="lg:col-span-1 h-full">
          <FacilityVisitsChart refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
};