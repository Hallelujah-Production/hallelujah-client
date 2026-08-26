import { Skeleton, StatCardSkeleton, TableSkeleton } from "@/components/ui/states";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <StatCardSkeleton />
      <StatCardSkeleton count={3} />
      <TableSkeleton rows={5} columns={6} />
    </div>
  );
}
