import { CardGridSkeleton, Skeleton, StatCardSkeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <StatCardSkeleton count={3} />
      <CardGridSkeleton count={6} />
    </div>
  );
}
