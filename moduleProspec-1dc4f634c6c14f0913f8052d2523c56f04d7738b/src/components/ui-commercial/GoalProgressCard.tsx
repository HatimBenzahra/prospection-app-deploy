import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-admin/card';
import { Progress } from '@/components/ui-admin/progress';
import { Target, Info } from 'lucide-react';

interface GoalProgressCardProps {
  title: string;
  description: string;
  value: number;
  total: number;
}

export const GoalProgressCard = ({ title, description, value, total }: GoalProgressCardProps) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <Card className="rounded-2xl bg-white border border-slate-200 shadow-sm h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-blue-500" />
            <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
        </div>
        <CardDescription className="text-slate-500">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center pt-2">
        {total > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-bold text-slate-900">{value}</span>
              <span className="text-lg text-slate-500">/ {total}</span>
            </div>
            <Progress value={percentage} className="h-2.5 bg-slate-100" indicatorClassName="bg-blue-500" />
            <div className="text-right text-sm font-medium text-slate-600">{Math.round(percentage)}% atteint</div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-slate-500 h-full py-4">
            <Info className="h-8 w-8 text-slate-400 mb-2" />
            <p className="font-medium">Aucun objectif défini</p>
            <p className="text-sm">Un objectif mensuel sera bientôt assigné.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};