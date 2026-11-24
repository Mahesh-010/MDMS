import { useEffect, useRef, useState, type ReactNode } from 'react'
import './DataTable.css'

export type SortDirection = 'asc' | 'desc'

export interface DataTableSort<T> {
  key: keyof T
  direction: SortDirection
}

export interface DataTableColumn<T> {
  key: keyof T
  header: string
  sortable?: boolean
  render?: (row: T) => ReactNode
  className?: string
}

export interface DataTableRowAction<T> {
  label: string
  onSelect: (row: T) => void
  disabled?: boolean
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onSortChange: (sort: DataTableSort<T>) => void
  sort?: DataTableSort<T> | null
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  isLoading?: boolean
  emptyMessage?: string
  rowActions?: (row: T) => DataTableRowAction<T>[]
  getRowId?: (row: T) => string
  selectedRowIds?: readonly string[]
  onSelectionChange?: (selectedIds: string[]) => void
  caption?: string
}

function displayValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}

export function DataTable<T>({
  data,
  columns,
  page,
  pageSize,
  total,
  onPageChange,
  onSortChange,
  sort = null,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  isLoading = false,
  emptyMessage = 'No records found.',
  rowActions,
  getRowId,
  selectedRowIds = [],
  onSelectionChange,
  caption = 'Data table',
}: DataTableProps<T>) {
  const [internalSearchValue, setInternalSearchValue] = useState('')
  const selectVisibleRows = Boolean(getRowId && onSelectionChange)
  const selectedIds = new Set(selectedRowIds)
  const visibleIds = selectVisibleRows ? data.map((row) => getRowId?.(row) ?? '') : []
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.has(id)).length
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected
  const selectAllRef = useRef<HTMLInputElement>(null)
  const pageCount = Math.ceil(total / pageSize)
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, total)
  const currentSearchValue = searchValue ?? internalSearchValue

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected
    }
  }, [someVisibleSelected])

  function changeSort(key: keyof T) {
    const direction =
      sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc'
    onSortChange({ key, direction })
  }

  function toggleRowSelection(row: T, checked: boolean) {
    if (!getRowId || !onSelectionChange) return

    const id = getRowId(row)
    const nextIds = new Set(selectedIds)
    if (checked) {
      nextIds.add(id)
    } else {
      nextIds.delete(id)
    }
    onSelectionChange([...nextIds])
  }

  function toggleVisibleSelection(checked: boolean) {
    if (!getRowId || !onSelectionChange) return

    const nextIds = new Set(selectedIds)
    for (const id of visibleIds) {
      if (checked) {
        nextIds.add(id)
      } else {
        nextIds.delete(id)
      }
    }
    onSelectionChange([...nextIds])
  }

  return (
    <section className="data-table" aria-label={caption}>
      <div className="data-table-toolbar">
        <label className="data-table-search">
          <span className="visually-hidden">Search table</span>
          <input
            type="search"
            value={currentSearchValue}
            placeholder={searchPlaceholder}
            onChange={(event) => {
              const nextValue = event.target.value
              if (searchValue === undefined) {
                setInternalSearchValue(nextValue)
              }
              onSearchChange?.(nextValue)
            }}
          />
        </label>
      </div>

      <div className="data-table-scroll">
        <table>
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {selectVisibleRows && (
                <th scope="col" className="data-table-selection-cell">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    aria-label="Select all rows on this page"
                    checked={allVisibleSelected}
                    onChange={(event) => toggleVisibleSelection(event.target.checked)}
                    disabled={data.length === 0 || isLoading}
                  />
                </th>
              )}
              {columns.map((column) => {
                const isSortable = column.sortable !== false
                const sortDirection =
                  sort?.key === column.key ? sort.direction : undefined

                return (
                  <th
                    key={String(column.key)}
                    scope="col"
                    className={column.className}
                    aria-sort={
                      sortDirection === 'asc'
                        ? 'ascending'
                        : sortDirection === 'desc'
                          ? 'descending'
                          : 'none'
                    }
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        className="data-table-sort-button"
                        onClick={() => changeSort(column.key)}
                      >
                        {column.header}
                        <span aria-hidden="true">
                          {sortDirection === 'asc'
                            ? ' ↑'
                            : sortDirection === 'desc'
                              ? ' ↓'
                              : ' ↕'}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
              {rowActions && <th scope="col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }, (_, rowIndex) => (
                  <tr key={`loading-${rowIndex}`} aria-hidden="true">
                    {selectVisibleRows && (
                      <td className="data-table-selection-cell">
                        <span className="data-table-skeleton data-table-skeleton-checkbox" />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={String(column.key)}>
                        <span className="data-table-skeleton" />
                      </td>
                    ))}
                    {rowActions && (
                      <td>
                        <span className="data-table-skeleton data-table-skeleton-action" />
                      </td>
                    )}
                  </tr>
                ))
              : data.map((row, rowIndex) => {
                  const rowId = getRowId?.(row)
                  const actions = rowActions?.(row)

                  return (
                    <tr key={rowId ?? rowIndex}>
                      {selectVisibleRows && (
                        <td className="data-table-selection-cell">
                          <input
                            type="checkbox"
                            aria-label={`Select row ${rowIndex + 1}`}
                            checked={rowId ? selectedIds.has(rowId) : false}
                            onChange={(event) =>
                              toggleRowSelection(row, event.target.checked)
                            }
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td key={String(column.key)} className={column.className}>
                          {column.render
                            ? column.render(row)
                            : displayValue(row[column.key])}
                        </td>
                      ))}
                      {rowActions && (
                        <td>
                          {actions && actions.length > 0 ? (
                            <details className="data-table-actions">
                              <summary aria-label={`Actions for row ${rowIndex + 1}`}>
                                More
                              </summary>
                              <div className="data-table-actions-menu">
                                {actions.map((action) => (
                                  <button
                                    key={action.label}
                                    type="button"
                                    disabled={action.disabled}
                                    onClick={() => action.onSelect(row)}
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            </details>
                          ) : (
                            '—'
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
            {!isLoading && data.length === 0 && (
              <tr>
                <td
                  className="data-table-empty"
                  colSpan={
                    columns.length +
                    Number(selectVisibleRows) +
                    Number(Boolean(rowActions))
                  }
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="data-table-pagination">
        <p>
          {total === 0
            ? '0 records'
            : `Showing ${firstItem}–${lastItem} of ${total}`}
        </p>
        <div className="data-table-page-controls">
          <span>
            Page {pageCount === 0 ? 0 : page} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading || pageCount === 0}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount || isLoading || pageCount === 0}
          >
            Next
          </button>
        </div>
      </footer>
    </section>
  )
}
