// src/layout/CommercialSidebar.tsx
import { Button } from '@/components/ui-admin/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { CommercialNavContent } from './CommercialNavContent';
import logo from '@/assets/logo.png';

interface CommercialSidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export const CommercialSidebar = ({ isCollapsed, toggleSidebar }: CommercialSidebarProps) => {
  return (
    <aside
      className={`hidden lg:flex flex-col bg-[#FAFAFA] transition-all duration-300 sticky top-0 h-screen ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* HEADER (identique à AdminSidebar) */}
      <div className="relative flex items-center h-20 transition-all duration-300 justify-center">
        {!isCollapsed && (
          <img
            src={logo}
            alt="Logo Groupe Finanssor"
            className="h-30 w-auto object-contain -translate-x-6"
          />
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute right-4"
        >
          {isCollapsed
            ? <PanelLeftOpen className="h-5 w-5" />
            : <PanelLeftClose className="h-5 w-5" />}
        </Button>
      </div>

      {/* NAVIGATION */}
      <div className="flex-1 py-4">
        <CommercialNavContent isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
};
