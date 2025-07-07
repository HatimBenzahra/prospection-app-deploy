// src/components/ui-admin/StatCard.tsx

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui-admin/card';
import type { LucideIcon } from 'lucide-react';
import CountUp from 'react-countup';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  Icon: LucideIcon;
  prefix?: string;
  suffix?: string;
  color?: string;
  change?: number;
}

const StatCard = ({ title, value, Icon, prefix, suffix, color, change }: StatCardProps) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className="transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-gray-200 rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={cn("h-5 w-5 text-gray-500", color)} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">
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
        {change !== undefined && (
          <p className={cn(
             "text-xs flex items-center gap-1 mt-1",
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