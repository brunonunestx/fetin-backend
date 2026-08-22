import { Skeleton } from '@/components/ui/skeleton';

function LoadingList({ count = 3 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Carregando conteúdo" className="space-y-3 px-4 py-5">
      {Array.from({ length: count }, (_, index) => (
        <div className="rounded-2xl border border-border bg-card p-4" key={index}>
          <div className="flex gap-3">
            <Skeleton className="size-12 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { LoadingList };
