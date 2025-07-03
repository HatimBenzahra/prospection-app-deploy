// src/pages/admin/statitistiques/LeaderboardTable.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui-admin/table';
import { Badge } from '@/components/ui-admin/badge';
import { Avatar, AvatarFallback } from '@/components/ui-admin/avatar';

interface Performer {
  rank: number;
  name: string;
  avatar: string;
  value: number;
  change: number;
}

interface LeaderboardTableProps {
  title: string;
  description: string;
  data: Performer[];
  unit: string;
}

const rankColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-400/20 text-yellow-700 border-yellow-400/50";
    if (rank === 2) return "bg-slate-400/20 text-slate-700 border-slate-400/50";
    if (rank === 3) return "bg-orange-400/20 text-orange-700 border-orange-400/50";
    return "bg-muted text-muted-foreground border-transparent";
}

export const LeaderboardTable = ({ title, description, data, unit }: LeaderboardTableProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead className="text-right">{unit}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.rank}>
                <TableCell>
                    <Badge variant="outline" className={rankColor(item.rank)}>
                        {item.rank}
                    </Badge>
                </TableCell>
                <TableCell className="font-medium flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{item.avatar}</AvatarFallback>
                    </Avatar>
                    {item.name}
                </TableCell>
                <TableCell className="text-right font-bold text-lg">{item.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};