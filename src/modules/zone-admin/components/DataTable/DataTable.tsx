import { useMemo, useState, type ReactNode } from 'react'
import './DataTable.css'

export type SortDirection = 'asc' | 'desc'

export interface DataTableColumn<T> {
  key?: keyof T
  header: ReactNode
  accessor?: (row: T) => unknown
  render?: (row: T, value: unknown) => ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  getRowId?: (row: T, index: number) => string | number
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
  pageSizeOptions?: number[]
  emptyMessage?: ReactNode
  className?: string
}

function compareValues(left: unknown, right: unknown): number {
  if (left === right) return 0
  if (left == null) return -1
  if (right == null) return 1

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

function getColumnValue<T>(
  row: T,
  column: DataTableColumn<T>,
): unknown {
  if (column.accessor) return column.accessor(row)
  if (column.key) return row[column.key]
  return undefined
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  searchable = true,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  pageSizeOptions,
  emptyMessage = 'No records found',
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(pageSize)

  const searchedRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return data

    return data.filter((row) =>
      columns.some((column) => {
        const value = getColumnValue(row, column)
        return value != null && String(value).toLowerCase().includes(query)
      }),
    )
  }, [columns, data, search])

  const sortedRows = useMemo(() => {
    if (sortKey == null) return searchedRows

    const column = columns[sortKey]
    if (!column) return searchedRows

    return [...searchedRows].sort((left, right) => {
      const result = compareValues(
        getColumnValue(left, column),
        getColumnValue(right, column),
      )
      return sortDirection === 'asc' ? result : -result
    })
  }, [columns, searchedRows, sortDirection, sortKey])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage
  const visibleRows = sortedRows.slice(startIndex, startIndex + rowsPerPage)

  const handleSort = (index: number) => {
    if (sortKey === index) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(index)
      setSortDirection('asc')
    }
  }

  const sizeOptions = pageSizeOptions?.includes(rowsPerPage)
    ? pageSizeOptions
    : [rowsPerPage, ...(pageSizeOptions ?? [])].filter(
        (option, index, options) => options.indexOf(option) === index,
      )

  return (
    <div className={`mdms-table ${className ?? ''}`}>
      {searchable && (
        <div className="mdms-table__toolbar">
          <label className="mdms-table__search">
            <span className="mdms-table__sr-only">Search table</span>
            <input
              type="search"
              value={search}
              placeholder={searchPlaceholder}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
            />
          </label>
        </div>
      )}

      <div className="mdms-table__viewport">
        <table>
          <thead>
            <tr>
              {columns.map((column, index) => {
                const sortable = column.sortable !== false
                const isSorted = sortKey === index
                return (
                  <th
                    key={String(column.key ?? index)}
                    scope="col"
                    className={column.className}
                    style={{
                      width: column.width,
                      textAlign: column.align ?? 'left',
                    }}
                    aria-sort={
                      isSorted
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className="mdms-table__sort"
                        onClick={() => handleSort(index)}
                      >
                        <span>{column.header}</span>
                        <span aria-hidden="true" className="mdms-table__sort-icon">
                          {isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td className="mdms-table__empty" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleRows.map((row, rowIndex) => (
                <tr
                  key={
                    getRowId
                      ? getRowId(row, startIndex + rowIndex)
                      : startIndex + rowIndex
                  }
                >
                  {columns.map((column, columnIndex) => {
                    const value = getColumnValue(row, column)
                    return (
                      <td
                        key={String(column.key ?? columnIndex)}
                        className={column.className}
                        style={{ textAlign: column.align ?? 'left' }}
                      >
                        {column.render ? column.render(row, value) : String(value ?? '')}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mdms-table__footer">
        <span className="mdms-table__range">
          {sortedRows.length === 0
            ? '0 records'
            : `${startIndex + 1}-${Math.min(startIndex + rowsPerPage, sortedRows.length)} of ${sortedRows.length}`}
        </span>
        <div className="mdms-table__pagination">
          {sizeOptions.length > 0 && (
            <label className="mdms-table__page-size">
              <span>Rows</span>
              <select
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value))
                  setCurrentPage(1)
                }}
              >
                {sizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={safePage <= 1}
          >
            Previous
          </button>
          <span aria-live="polite">
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={safePage >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
