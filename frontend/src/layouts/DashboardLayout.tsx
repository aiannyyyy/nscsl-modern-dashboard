import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { GlobalJobOrderManager } from '../components/GlobalJobOrderManager';

export const DashboardLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 relative">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      {/* Main Content Area */}
      <main 
        className={`mt-16 p-6 min-h-screen transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Outlet />
      </main>

      {/* Global Job Order Floating Tracker & FAB - Shows on ALL pages */}
      {/* 🔧 FIXED: Wrapped in a portal-like container with high z-index */}
      <div className="relative z-[9999]">
        <GlobalJobOrderManager />
      </div>
    </div>
  );
};