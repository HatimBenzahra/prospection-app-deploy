import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

interface ChartDataItem {
  [key: string]: string | number;
}

interface GenericBarChartProps {
  title: string;
  data: ChartDataItem[];
  xAxisDataKey: string;
  barDataKey: string;
  fillColor: string | ((entry: ChartDataItem, index: number) => string);
}

const chartColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

export const GenericBarChart = ({ title, data, xAxisDataKey, barDataKey }: GenericBarChartProps) => {
  return (
    <Card className="h-full">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            
            <XAxis 
              dataKey={xAxisDataKey} 
              stroke="hsl(var(--foreground))"
              fontSize={13} 
              tickLine={false} 
              axisLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60} 
            />

            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--muted))' }} 
              contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} 
            />
            <Bar dataKey={barDataKey} radius={[4, 4, 0, 0]}>
              <LabelList dataKey={barDataKey} position="top" style={{ fill: 'hsl(var(--foreground))', fontSize: '12px' }} />
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};