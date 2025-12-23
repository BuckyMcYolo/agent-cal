
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Separator } from "@workspace/ui/components/separator"

const Loading = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* List container */}
      <div className="bg-card rounded-lg border">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <div className="p-4 lg:p-6 flex items-start gap-3 lg:gap-4">
              {/* Drag handle */}
              <Skeleton className="h-6 w-6 lg:h-5 lg:w-5 rounded" />

              {/* Main content */}
              <div className="flex-1 space-y-3">
                {/* Title + badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-5 w-44" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>

                {/* Description */}
                <Skeleton className="h-4 w-3/4" />

                {/* Details row */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
              </div>

              {/* Actions */}
              <div className="hidden sm:flex items-center gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
            {index < 3 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Loading
