import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataItem {
  [key: string]: string | number;
}

interface LineConfig {
  dataKey: string;
  stroke: string;
  name?: string; 
}

interface GenericLineChartProps {
  title: string;
  data: ChartDataItem[];
  xAxisDataKey: string;
  lines: LineConfig[];
}

export const GenericLineChart = ({ title, data, xAxisDataKey, lines }: GenericLineChartProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}> 
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xAxisDataKey} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }} 
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }}/>
            {lines.map(line => (
              <Line 
                key={line.dataKey} 
                type="monotone" 
                dataKey={line.dataKey} 
                stroke={line.stroke} 
                strokeWidth={2} 
                dot={{ r: 4 }}
                name={line.name || line.dataKey} 
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};