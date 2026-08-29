import { Skeleton } from "@/components/ui/states";

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-4 w-64" />
      <Skeleton className="mx-auto h-72 w-full max-w-2xl rounded-lg" />
      <Skeleton className="h-24 w-full rounded-md" />
    </div>
  );
}
