// src/layout/CommercialLayout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CommercialSidebar } from './CommercialSidebar';
import CommercialHeader from './CommercialHeader';

const CommercialLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen bg-muted/40">
      <CommercialSidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <CommercialHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CommercialLayout;