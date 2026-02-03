import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { DarkModeToggle } from '../components/DarkModeToggle';

export const DashboardLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      {/* Main Content Area */}
      <main 
        className={`mt-16 p-6 min-h-screen transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Dark Mode Toggle - Fixed Position */}
        <div className="fixed bottom-6 right-6 z-50">
          <DarkModeToggle />
        </div>
        
        <Outlet />
      </main>
    </div>
  );
};