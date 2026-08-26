import { Skeleton, TableSkeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-10 w-full max-w-xl" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
      <TableSkeleton rows={8} columns={7} />
    </div>
  );
}
