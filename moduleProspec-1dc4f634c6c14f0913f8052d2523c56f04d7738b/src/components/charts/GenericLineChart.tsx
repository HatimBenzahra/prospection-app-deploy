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

export const GenericLineChart = ({ data, xAxisDataKey, lines }: GenericLineChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
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
        <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
        {lines.map(line => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            strokeWidth={2}
            dot={{ r: 4, fill: line.stroke, strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 2, fill: 'hsl(var(--background))' }}
            name={line.name || line.dataKey}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};