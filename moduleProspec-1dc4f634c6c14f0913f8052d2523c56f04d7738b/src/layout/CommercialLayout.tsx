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
      <div className="flex-1 flex flex-col">
        <CommercialHeader />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CommercialLayout;