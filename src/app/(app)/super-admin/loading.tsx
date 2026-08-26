import { Skeleton, StatCardSkeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <StatCardSkeleton />
      <Skeleton className="h-72 w-full rounded-lg" />
      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
