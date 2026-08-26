import { Skeleton } from "@/components/ui/states";

export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-[95rem] space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}
