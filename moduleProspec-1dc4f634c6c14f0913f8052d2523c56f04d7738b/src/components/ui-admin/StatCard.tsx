// src/components/ui/StatCard.tsx

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui-admin/card';
import type { LucideIcon } from 'lucide-react';
import CountUp from 'react-countup';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react'; // <-- 1. Importer les icônes

interface StatCardProps {
  title: string;
  value: number;
  Icon: LucideIcon;
  prefix?: string;
  suffix?: string;
  color?: string;
  change?: number; // <-- 2. Ajouter la nouvelle prop 'change'
}

const StatCard = ({ title, value, Icon, prefix, suffix, color, change }: StatCardProps) => {
  // 3. Déterminer si le changement est positif ou non
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className="transition-transform duration-300 hover:scale-[1.03] hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground", color)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' && !isNaN(value) ? (
            <CountUp
              start={0}
              end={value}
              duration={1.5}
              separator=" "
              prefix={prefix}
              suffix={suffix}
              decimals={value % 1 !== 0 ? 1 : 0}
            />
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </div>
        {/* --- 4. LOGIQUE POUR AFFICHER L'ÉVOLUTION --- */}
        {change !== undefined && (
          <p className={cn(
             "text-xs text-muted-foreground flex items-center gap-1 mt-1",
             isPositive ? "text-emerald-600" : "text-red-600"
          )}>
            {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            <span>
              {isPositive && '+'}{change.toFixed(1)}% vs période précédente
            </span>
        </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;