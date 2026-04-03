import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeleton loader for the data grid.
 * Renders a header row + data rows with varied-width skeleton cells.
 *
 * @param columns - Number of skeleton columns to render (default: 6)
 * @param rows - Number of skeleton data rows to render (default: 12)
 * @param rowHeight - Height of each row in px (default: 56, matches "medium")
 */

// Column width pattern — cycles through to mimic real column variety
const COL_WIDTHS = ["w-32", "w-44", "w-28", "w-52", "w-36", "w-40", "w-24", "w-48"];

// Skeleton bar widths within cells — varies per column for visual interest
const CELL_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/6", "w-3/5", "w-4/5"];

interface DataGridSkeletonProps {
  columns?: number;
  rows?: number;
  rowHeight?: number;
  className?: string;
}

export function DataGridSkeleton({
  columns = 6,
  rows = 12,
  rowHeight = 56,
  className,
}: DataGridSkeletonProps) {
  return (
    <div className={cn("flex flex-col overflow-hidden", className)}>
      {/* Header row */}
      <div className="flex border-b bg-muted/30">
        {Array.from({ length: columns }, (_, colIdx) => (
          <div
            key={colIdx}
            className={cn(
              "shrink-0 border-r px-3 py-2.5",
              COL_WIDTHS[colIdx % COL_WIDTHS.length],
            )}
          >
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        ))}
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }, (_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex border-b"
          style={{ height: rowHeight }}
        >
          {Array.from({ length: columns }, (_, colIdx) => (
            <div
              key={colIdx}
              className={cn(
                "flex shrink-0 items-center border-r px-3",
                COL_WIDTHS[colIdx % COL_WIDTHS.length],
              )}
            >
              <Skeleton
                className={cn(
                  "h-3.5",
                  CELL_WIDTHS[(rowIdx + colIdx) % CELL_WIDTHS.length],
                )}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
