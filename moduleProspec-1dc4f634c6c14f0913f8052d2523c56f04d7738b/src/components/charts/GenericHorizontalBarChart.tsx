// src/components/charts/GenericHorizontalBarChart.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';

/**
 * Props pour le composant GenericHorizontalBarChart.
 */
interface GenericHorizontalBarChartProps {
  /** Le titre affiché en haut de la carte. */
  title: string;
  /** Le tableau de données pour le graphique. */
  data: any[];
  /** La clé de données pour l'axe Y (les catégories). */
  yAxisDataKey: string;
  /** La clé de données pour la valeur des barres. */
  barDataKey: string;
  /** La couleur de remplissage des barres. */
  fillColor: string;
  /** Le nom de la série de données, affiché dans la légende et le tooltip. */
  barName?: string;
}

export const GenericHorizontalBarChart = ({ 
  title, 
  data, 
  yAxisDataKey, 
  barDataKey, 
  fillColor,
  barName 
}: GenericHorizontalBarChartProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* On augmente la hauteur pour laisser de la place à la légende en bas */}
        <ResponsiveContainer width="100%" height={350}>
          <BarChart 
            layout="vertical" // La propriété clé pour un graphique à barres horizontales
            data={data} 
            margin={{
              top: 5,
              right: 30, // Marge pour voir les labels sur les barres
              left: 20,
              bottom: 20, // Marge pour la légende
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            
            <YAxis 
              type="category" 
              dataKey={yAxisDataKey} // Les labels (ex: "Lundi", "Mardi") sont sur l'axe Y
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              width={80} // Assure un espace suffisant pour les noms des jours
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            
            <Tooltip 
              cursor={{ fill: 'hsl(var(--muted))' }} 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }} 
            />
            
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
            
            <Bar 
              dataKey={barDataKey} 
              name={barName || "Valeur"} // Ce nom sera utilisé par la légende et le tooltip
              fill={fillColor} 
              radius={[0, 4, 4, 0]} // Coins arrondis à droite
            >
              <LabelList 
                dataKey={barDataKey} 
                position="right" 
                style={{ fill: 'hsl(var(--foreground))', fontSize: '12px' }} 
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};