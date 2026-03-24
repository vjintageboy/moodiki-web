'use client';

/**
 * Skeleton component for table rows
 */
export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
        <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-6 w-16 bg-muted animate-pulse rounded" />
    </div>
  );
}

/**
 * Skeleton for card content loading
 */
export function CardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}
