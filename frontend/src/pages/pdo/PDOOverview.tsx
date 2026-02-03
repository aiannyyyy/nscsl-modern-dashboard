import React from 'react';
import { WeatherBar } from './components/WeatherWidget';
import { FacilityVisitsContainer } from './components/FacilityVisitsContainer';
import { Notebooks } from './components/Notebooks';
import { Endorsements } from './components/Endorsements';
import { TimelinessCharts } from './components/TimelinessCharts';

export const PDOOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      <WeatherBar />

      <FacilityVisitsContainer />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Notebooks />
        </div>
        <div className="lg:col-span-2">
          <Endorsements />
        </div>
      </div>

      <TimelinessCharts />
    </div>
  );
};
