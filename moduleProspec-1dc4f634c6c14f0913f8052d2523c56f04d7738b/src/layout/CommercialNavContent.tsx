// src/layout/CommercialNavContent.tsx
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui-admin/button';
import { 
    LayoutDashboard, 
    Target, 
    History, 
    BarChart2, 
    User as UserIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const commercialNavLinks = [
    { to: '/commercial/dashboard', text: 'Tableau de bord', icon: LayoutDashboard, exact: true },
    { to: '/commercial/prospecting', text: 'Prospection', icon: Target, exact: false },
    { to: '/commercial/history', text: 'Historique', icon: History, exact: true },
    { to: '/commercial/stats', text: 'Mes statistiques', icon: BarChart2, exact: true },
    { to: '/commercial/profile', text: 'Profil', icon: UserIcon, exact: true },
];

interface CommercialNavContentProps {
  isCollapsed: boolean;
  onLinkClick?: () => void;
}

export const CommercialNavContent = ({ isCollapsed, onLinkClick }: CommercialNavContentProps) => {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {commercialNavLinks.map((link) => (
        // --- CORRECTION DÉFINITIVE ICI ---
        <NavLink to={link.to} key={link.text} onClick={onLinkClick} end={link.exact}>
          {({ isActive }) => (
            <Button
              variant='ghost'
              className={cn(
                "w-full justify-start gap-3 h-10 transition-colors duration-200",
                isActive
                  ? 'bg-[hsl(var(--winvest-blue-clair))] text-[hsl(var(--winvest-blue-nuit))] font-semibold hover:bg-[hsl(var(--winvest-blue-clair))]'
                  : 'hover:bg-zinc-100 text-black'
              )}
            >
              <link.icon className="h-5 w-5" />
              {!isCollapsed && <span className="truncate">{link.text}</span>}
            </Button>
          )}
        </NavLink>
      ))}
    </nav>
  );
};