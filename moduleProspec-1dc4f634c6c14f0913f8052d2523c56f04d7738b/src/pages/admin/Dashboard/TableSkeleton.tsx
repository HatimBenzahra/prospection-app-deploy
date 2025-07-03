// frontend-shadcn/src/pages/admin/TableSkeleton.tsx
import { Skeleton } from "@/components/ui-admin/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui-admin/card";

export const TableSkeleton = () => (
  <Card className="animate-in fade-in-0 duration-500">
    <CardHeader>
      <Skeleton className="h-6 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);