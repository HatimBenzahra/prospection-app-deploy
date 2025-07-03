// src/components/charts/GenericLineChart.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Configuration pour une seule ligne dans le graphique.
 */
interface LineConfig {
  /** La clé de données dans l'objet de données (ex: 'rdv', 'contrats'). */
  dataKey: string;
  /** La couleur de la ligne (ex: 'hsl(var(--chart-1))'). */
  stroke: string;
  /** Le nom affiché dans la légende et le tooltip. */
  name?: string; 
}

/**
 * Props pour le composant GenericLineChart.
 */
interface GenericLineChartProps {
  /** Le titre affiché en haut de la carte. */
  title: string;
  /** Le tableau de données pour le graphique. */
  data: any[];
  /** La clé de données pour l'axe X (les labels de temps). */
  xAxisDataKey: string;
  /** Un tableau de configurations pour chaque ligne à dessiner. */
  lines: LineConfig[];
}

export const GenericLineChart = ({ title, data, xAxisDataKey, lines }: GenericLineChartProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* On s'assure que le graphique a assez de place pour la légende */}
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
                // On utilise la propriété 'name' pour la légende et le tooltip
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