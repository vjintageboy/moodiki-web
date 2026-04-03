'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Search,
  Loader2,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

/**
 * Column definition for DataTable
 * @template T The data type of each row
 */
export interface Column<T> {
  /** Unique identifier for the column */
  key: keyof T | string;
  /** Display header text */
  header: string;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Custom render function for the cell */
  render?: (item: T, index: number) => React.ReactNode;
  /** Additional CSS classes for the cell */
  className?: string;
  /** Width of the column (e.g., "100px", "20%") */
  width?: string;
}

/**
 * Props for the DataTable component
 * @template T The data type of each row
 */
export interface DataTableProps<T> {
  /** Array of data to display */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Current search query */
  searchQuery?: string;
  /** Callback when search input changes */
  onSearch?: (query: string) => void;
  /** Whether rows are selectable */
  selectable?: boolean;
  /** Callback when selected rows change */
  onSelectionChange?: (selected: T[]) => void;
  /** Render function for action column */
  actions?: (item: T, index: number) => React.ReactNode;
  /** Message to show when table is empty */
  emptyMessage?: string;
  /** Initial page size */
  initialPageSize?: number;
  /** Callback when data changes (for pagination/sorting) */
  onDataChange?: (data: T[]) => void;
  /** Additional classes for the table container */
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

/**
 * Skeleton loader row component
 */
function SkeletonRow() {
  return (
    <TableRow>
      <TableCell colSpan={8}>
        <div className="flex items-center gap-2 py-2">
          <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

/**
 * Empty state component
 */
function EmptyState({ message }: { message?: string }) {
  const t = useTranslations('Common');
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
      <p className="text-gray-600 dark:text-gray-400 font-medium">
        {message || t('noData')}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
        {t('tryAdjustFilters')}
      </p>
    </div>
  );
}

/**
 * Mobile card view for responsive design
 */
function DataTableCard<T>({
  item,
  columns,
  actions,
  index,
}: {
  item: T;
  columns: Column<T>[];
  actions?: (item: T, index: number) => React.ReactNode;
  index: number;
}) {
  return (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="space-y-3">
          {columns.slice(0, 3).map((column) => (
            <div key={String(column.key)} className="flex justify-between items-start gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {column.header}
              </span>
              <span className="text-sm text-right">
                {column.render ? (
                  column.render(item, index)
                ) : (
                  <span className="text-gray-900 dark:text-gray-100">
                    {String((item as any)[String(column.key)] ?? '')}
                  </span>
                )}
              </span>
            </div>
          ))}
          {actions && <div className="pt-2 border-t dark:border-gray-700">{actions(item, index)}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Pagination controls component
 */
function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const t = useTranslations('Common');
  const pageSizeOptions = [10, 25, 50, 100];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t dark:border-gray-700">
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">{t('itemsPerPage')}:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 text-sm border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
          aria-label="Items per page"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Page info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {totalItems === 0 ? (
          t('noItems')
        ) : (
          t('showingItems', {
            start: (currentPage - 1) * pageSize + 1,
            end: Math.min(currentPage * pageSize, totalItems),
            total: totalItems
          })
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
          {t('pageOf', { current: currentPage, total: Math.max(1, totalPages) })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Generic DataTable component with sorting, pagination, search, and selection
 *
 * @template T The type of data being displayed
 *
 * @example
 * ```tsx
 * const columns: Column<User>[] = [
 *   { key: 'name', header: 'Name', sortable: true },
 *   { key: 'email', header: 'Email', sortable: true },
 *   { 
 *     key: 'role', 
 *     header: 'Role',
 *     render: (user) => <Badge>{user.role}</Badge>
 *   },
 * ];
 *
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   isLoading={isLoading}
 *   selectable={true}
 *   onSelectionChange={(selected) => setSelectedUsers(selected)}
 *   actions={(user) => (
 *     <DropdownMenu>
 *       <DropdownMenuItem onClick={() => editUser(user.id)}>Edit</DropdownMenuItem>
 *       <DropdownMenuItem onClick={() => deleteUser(user.id)}>Delete</DropdownMenuItem>
 *     </DropdownMenu>
 *   )}
 * />
 * ```
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  searchQuery = '',
  onSearch,
  selectable = false,
  onSelectionChange,
  actions,
  emptyMessage,
  initialPageSize = 10,
  onDataChange,
  className,
}: DataTableProps<T>) {
  const t = useTranslations('Common');
  // State management
  const [sort, setSort] = useState<SortState>({ column: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Check if mobile (for responsive design)
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle sorting
  const handleSort = (columnKey: string | null) => {
    if (!columnKey) return;

    setSort((prev) => {
      if (prev.column === columnKey) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === 'asc') {
          return { column: columnKey, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { column: null, direction: null };
        } else {
          return { column: columnKey, direction: 'asc' };
        }
      } else {
        return { column: columnKey, direction: 'asc' };
      }
    });
    setCurrentPage(1); // Reset to first page on sort
  };

  // Handle search
  const handleSearch = (query: string) => {
    setLocalSearchQuery(query);
    onSearch?.(query);
    setCurrentPage(1);
  };

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(
        paginatedData.map((_, idx) => (currentPage - 1) * pageSize + idx)
      );
      setSelectedRows(newSelected);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    const absoluteIndex = (currentPage - 1) * pageSize + index;

    if (checked) {
      newSelected.add(absoluteIndex);
    } else {
      newSelected.delete(absoluteIndex);
    }

    setSelectedRows(newSelected);
  };

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (localSearchQuery && onSearch) {
      // If onSearch is provided, assume external filtering
      // Otherwise, do internal filtering
      result = result.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(localSearchQuery.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sort.column && sort.direction) {
      result.sort((a, b) => {
        const aVal = a[sort.column as keyof T];
        const bVal = b[sort.column as keyof T];

        if (aVal === bVal) return 0;

        const isAscending = sort.direction === 'asc';
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return isAscending
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return isAscending ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return result;
  }, [data, localSearchQuery, sort, onSearch]);

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Update selected rows when data changes
  const selectedData = useMemo(() => {
    return data.filter((_, idx) => selectedRows.has(idx));
  }, [data, selectedRows]);

  React.useEffect(() => {
    onSelectionChange?.(selectedData);
  }, [selectedData, onSelectionChange]);

  // Get sort icon for column header
  const getSortIcon = (columnKey: string | null) => {
    if (sort.column !== columnKey) {
      return null;
    }

    return sort.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : sort.direction === 'desc' ? (
      <ChevronDown className="h-4 w-4" />
    ) : null;
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className={cn('rounded-lg border dark:border-gray-700 overflow-hidden', className)}>
        <Table>
          <TableHeader>
            <TableRow className="dark:border-gray-700">
              {selectable && <TableHead className="w-12">
                <input
                  type="checkbox"
                  disabled
                  className="rounded dark:bg-gray-900"
                  aria-label="Select all"
                />
              </TableHead>}
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className="text-gray-700 dark:text-gray-300"
                >
                  {column.header}
                </TableHead>
              ))}
              {actions && <TableHead className="w-12">{t('actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: pageSize }).map((_, idx) => (
              <SkeletonRow key={idx} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Render empty state
  if (filteredData.length === 0) {
    return (
      <div className={cn('rounded-lg border dark:border-gray-700 overflow-hidden', className)}>
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  // Mobile view (card layout)
  if (isMobile) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Search input */}
        {onSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder={t('search')}
              value={localSearchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              aria-label="Search data"
            />
          </div>
        )}

        {/* Cards */}
        {paginatedData.map((item, idx) => (
          <DataTableCard
            key={idx}
            item={item}
            columns={columns}
            actions={actions}
            index={(currentPage - 1) * pageSize + idx}
          />
        ))}

        {/* Pagination */}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredData.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    );
  }

  // Desktop view (table layout)
  return (
    <div className={cn('space-y-4', className)}>
      {/* Search input */}
      {onSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            type="text"
            placeholder={t('search')}
            value={localSearchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            aria-label="Search data"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="dark:border-gray-700">
                {/* Select all checkbox */}
                {selectable && (
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        paginatedData.length > 0 &&
                        paginatedData.every((_, idx) =>
                          selectedRows.has((currentPage - 1) * pageSize + idx)
                        )
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded dark:bg-gray-900"
                      aria-label="Select all items"
                    />
                  </TableHead>
                )}

                {/* Column headers */}
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={cn(
                      'text-gray-700 dark:text-gray-300 font-semibold',
                      column.sortable && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100',
                      column.className
                    )}
                    onClick={() => column.sortable && handleSort(String(column.key))}
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && sort.column === String(column.key) && (
                        <span className="inline-flex">{getSortIcon(String(column.key))}</span>
                      )}
                    </div>
                  </TableHead>
                ))}

                {/* Actions column header */}
                {actions && <TableHead className="w-12">{t('actions')}</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedData.map((item, idx) => {
                const absoluteIndex = (currentPage - 1) * pageSize + idx;
                const isSelected = selectedRows.has(absoluteIndex);

                return (
                  <TableRow
                    key={absoluteIndex}
                    className={cn(
                      'dark:border-gray-700 transition-colors',
                      isSelected && 'bg-blue-50 dark:bg-blue-950'
                    )}
                  >
                    {/* Selection checkbox */}
                    {selectable && (
                      <TableCell className="w-12">
                        <input
                           type="checkbox"
                           checked={isSelected}
                           onChange={(e) => handleSelectRow(idx, e.target.checked)}
                           className="rounded dark:bg-gray-900"
                           aria-label={`Select item ${absoluteIndex + 1}`}
                         />
                       </TableCell>
                     )}
 
                     {/* Data cells */}
                     {columns.map((column) => (
                       <TableCell
                         key={String(column.key)}
                         className={cn(
                           'dark:text-gray-300',
                           column.className
                         )}
                         style={{ width: column.width }}
                       >
                         {column.render ? (
                           column.render(item, absoluteIndex)
                         ) : (
                           <span>{String((item as any)[String(column.key)] ?? '')}</span>
                         )}
                       </TableCell>
                     ))}
 
                     {/* Actions cell */}
                     {actions && (
                       <TableCell className="w-12">
                         {actions(item, absoluteIndex)}
                       </TableCell>
                     )}
                   </TableRow>
                 );
               })}
             </TableBody>
           </Table>
         </div>
       </div>
 
       {/* Pagination controls */}
       <PaginationControls
         currentPage={currentPage}
         totalPages={totalPages}
         pageSize={pageSize}
         totalItems={filteredData.length}
         onPageChange={setCurrentPage}
         onPageSizeChange={(size) => {
           setPageSize(size);
           setCurrentPage(1);
         }}
       />
     </div>
   );
 }

