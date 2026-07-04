import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/utils/format.js';
import { Spinner, EmptyState } from './index.jsx';

/**
 * DataTable
 * columns: [{ key, label, sortable?, align?, width?, render?(row, i), className? }]
 * rows: array of records
 * onRowClick(row) optional
 * meta: { page, limit, total, pages } for pagination
 * onPageChange, onLimitChange, sort { key, direction: 'asc'|'desc' }, onSortChange
 */
export default function DataTable({
  columns = [],
  rows = [],
  loading,
  onRowClick,
  emptyTitle = 'Nothing here yet',
  emptySubtitle = 'Records will appear here once created.',
  emptyIcon = Inbox,
  emptyAction,
  meta,
  onPageChange,
  onLimitChange,
  sort,
  onSortChange,
  rowKey = '_id',
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  className,
}) {
  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.length === rows.length) onSelectionChange([]);
    else onSelectionChange(rows.map((r) => r[rowKey]));
  };

  const toggleRow = (id) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className={cn('bg-surface border border-hairline', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selectedIds.length === rows.length}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-ultra"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'text-mono text-[0.65rem] uppercase tracking-widest text-slate font-normal px-4 py-3 text-left',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.width,
                    col.headerClassName
                  )}
                >
                  {col.sortable ? (
                    <button
                      onClick={() =>
                        onSortChange?.({
                          key: col.key,
                          direction:
                            sort?.key === col.key && sort?.direction === 'asc' ? 'desc' : 'asc',
                        })
                      }
                      className="inline-flex items-center gap-1 hover:text-ink transition-colors"
                    >
                      {col.label}
                      {sort?.key === col.key ? (
                        sort.direction === 'asc' ? (
                          <ChevronUp size={12} strokeWidth={1.5} />
                        ) : (
                          <ChevronDown size={12} strokeWidth={1.5} />
                        )
                      ) : (
                        <ChevronsUpDown size={12} strokeWidth={1.5} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-20">
                  <div className="flex justify-center">
                    <Spinner size={24} className="text-ultra" />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-4">
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    subtitle={emptySubtitle}
                    action={emptyAction}
                    className="border-0"
                  />
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row[rowKey] || i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-hairline row-hover',
                    onRowClick && 'cursor-pointer',
                    selectedIds.includes(row[rowKey]) && 'bg-ultra-tint'
                  )}
                >
                  {selectable && (
                    <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row[rowKey])}
                        onChange={() => toggleRow(row[rowKey])}
                        className="w-4 h-4 accent-ultra"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      {col.render ? col.render(row, i) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-hairline text-mono text-xs">
          <div className="text-slate uppercase tracking-widest">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)}{' '}
            of {meta.total}
          </div>
          <div className="flex items-center gap-2">
            {onLimitChange && (
              <select
                value={meta.limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="bg-surface border border-hairline-strong px-2 py-1 text-mono text-xs hover:border-slate transition-colors"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => onPageChange?.(meta.page - 1)}
              disabled={meta.page <= 1}
              className="p-1.5 border border-hairline-strong hover:border-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={12} strokeWidth={1.5} />
            </button>
            <span className="px-3">
              {meta.page} / {meta.pages}
            </span>
            <button
              onClick={() => onPageChange?.(meta.page + 1)}
              disabled={meta.page >= meta.pages}
              className="p-1.5 border border-hairline-strong hover:border-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={12} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
