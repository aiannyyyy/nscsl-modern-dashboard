import React from 'react';
import { NurseCards } from './component/NurseCards';
import { FollowupStats } from './component/FollowupStats';
import { FollowupQueue } from './component/FollowupQueue';
import { ActivityFeed } from './component/ActivityFeed';

export const FollowupOverview: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-1">
              Ward Dashboard
            </p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Follow-up Overview
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Thursday, 19 February 2026 — Morning Shift
            </p>
          </div>
          <button className="self-start sm:self-auto text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-violet-200 dark:shadow-none">
            + New Follow-up
          </button>
        </div>
      </header>

      {/* Stats Strip */}
      <div className="mb-6">
        <FollowupStats />
      </div>

      {/* Nurse Cards */}
      <div className="mb-6">
        <NurseCards />
      </div>

      {/* Queue + Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <FollowupQueue />
        </div>
        <div className="xl:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};