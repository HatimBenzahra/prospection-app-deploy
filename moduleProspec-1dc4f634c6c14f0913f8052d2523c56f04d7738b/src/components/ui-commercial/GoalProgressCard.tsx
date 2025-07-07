import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-admin/card';
import { Progress } from '@/components/ui-admin/progress'; // Assurez-vous d'avoir ce composant
import { Target } from 'lucide-react';

interface GoalProgressCardProps {
  title: string;
  description: string;
  value: number;
  total: number;
}

export const GoalProgressCard = ({ title, description, value, total }: GoalProgressCardProps) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-3xl font-bold text-primary">{value}</span>
          <span className="text-lg text-muted-foreground">/ {total} contrats</span>
        </div>
        <Progress value={percentage} className="h-3" />
        <div className="text-right text-sm font-semibold">{Math.round(percentage)}% atteint</div>
      </CardContent>
    </Card>
  );
};