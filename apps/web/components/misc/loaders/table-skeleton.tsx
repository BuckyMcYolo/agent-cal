import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import type React from "react"

export interface TableSkeletonProps {
  /**
   * Number of skeleton rows to display
   */
  rowCount?: number

  /**
   * Column configuration
   */
  columns: {
    /**
     * Column header text
     */
    header: string

    /**
     * Column width (can be pixel value, percentage, or tailwind class)
     */
    width?: string

    /**
     * Whether this is a right-aligned column
     */
    rightAligned?: boolean
  }[]

  /**
   * Whether to show header text
   */
  showHeaderText?: boolean

  /**
   * Whether to show title/description skeletons
   */
  showTitleSection?: boolean

  /**
   * Whether to show action button skeleton
   */
  showActionButton?: boolean
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rowCount = 3,
  columns,
  showHeaderText = true,
  showTitleSection = true,
  showActionButton = true,
}) => {
  return (
    <div>
      {showTitleSection && (
        <div className="space-y-2 mb-4">
          <div className="h-8 w-48 bg-accent rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-accent rounded animate-pulse"></div>
        </div>
      )}

      {showActionButton && (
        <div className="flex justify-end">
          <div className="h-10 w-32 bg-accent rounded mb-4 animate-pulse"></div>
        </div>
      )}

      <Table>
        <TableHeader className="bg-muted/50 rounded-xl">
          <TableRow>
            {columns.map((column, index) => (
              <TableHead
                key={index}
                className={column.rightAligned ? "text-right" : ""}
                style={column.width ? { width: column.width } : {}}
              >
                {showHeaderText ? (
                  column.header
                ) : (
                  <div className="h-4 bg-accent rounded animate-pulse"></div>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array(rowCount)
            .fill(0)
            .map((_, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-transparent">
                {columns.map((column, colIndex) => (
                  <TableCell
                    key={`${rowIndex}-${colIndex}`}
                    className={column.rightAligned ? "text-right" : ""}
                  >
                    {colIndex === columns.length - 1 && column.rightAligned ? (
                      <div className="flex justify-end space-x-2">
                        <div className="h-8 w-8 bg-accent rounded-full animate-pulse"></div>
                        <div className="h-8 w-8 bg-accent rounded-full animate-pulse"></div>
                      </div>
                    ) : (
                      <div
                        className={`h-5 ${column.width || "w-28"} bg-accent rounded animate-pulse`}
                      ></div>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default TableSkeleton
