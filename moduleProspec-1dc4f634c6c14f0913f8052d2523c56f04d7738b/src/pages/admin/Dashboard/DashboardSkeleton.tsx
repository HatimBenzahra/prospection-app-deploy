import { Skeleton } from "@/components/ui-admin/skeleton";

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-[108px]" />
        <Skeleton className="h-[108px]" />
        <Skeleton className="h-[108px]" />
        <Skeleton className="h-[108px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="lg:col-span-4 h-[380px]" />
        <Skeleton className="lg:col-span-3 h-[380px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="lg:col-span-4 h-[380px]" />
        <Skeleton className="lg:col-span-3 h-[380px]" />
      </div>
    </div>
  );
};