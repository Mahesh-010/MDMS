import './SharedUi.css'

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  siblingCount?: number
  disabled?: boolean
}

type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

function buildPageItems(page: number, pageCount: number, siblingCount: number): PageItem[] {
  if (pageCount <= 7 + siblingCount * 2) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const left = Math.max(page - siblingCount, 2)
  const right = Math.min(page + siblingCount, pageCount - 1)
  const showLeftEllipsis = left > 2
  const showRightEllipsis = right < pageCount - 1
  const items: PageItem[] = [1]

  if (showLeftEllipsis) {
    items.push('ellipsis-start')
  } else {
    for (let number = 2; number < left; number += 1) items.push(number)
  }

  for (let number = left; number <= right; number += 1) items.push(number)

  if (showRightEllipsis) {
    items.push('ellipsis-end')
  } else {
    for (let number = right + 1; number < pageCount; number += 1) items.push(number)
  }

  items.push(pageCount)
  return items
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  siblingCount = 1,
  disabled = false,
}: PaginationProps) {
  const safePageSize = Number.isFinite(pageSize)
    ? Math.max(1, Math.floor(pageSize))
    : 1
  const safeTotal = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0
  const pageCount = Math.ceil(safeTotal / safePageSize)
  const currentPage = pageCount === 0 ? 0 : Math.min(Math.max(1, page), pageCount)
  const firstItem = safeTotal === 0 ? 0 : (currentPage - 1) * safePageSize + 1
  const lastItem = Math.min(currentPage * safePageSize, safeTotal)
  const items = buildPageItems(
    currentPage,
    pageCount,
    Math.max(0, Math.floor(siblingCount)),
  )

  if (pageCount === 0) {
    return (
      <nav className="ui-pagination" aria-label="Pagination">
        <p className="ui-pagination-summary">0 records</p>
      </nav>
    )
  }

  return (
    <nav className="ui-pagination" aria-label="Pagination">
      <p className="ui-pagination-summary">
        Showing {firstItem}–{lastItem} of {safeTotal}
      </p>
      <div className="ui-pagination-controls">
        <button
          type="button"
          className="ui-pagination-button"
          aria-label="Previous page"
          disabled={disabled || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
        {items.map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              className={`ui-pagination-button ui-pagination-number${item === currentPage ? ' is-current' : ''}`}
              aria-label={`Page ${item}`}
              aria-current={item === currentPage ? 'page' : undefined}
              disabled={disabled}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="ui-pagination-ellipsis" aria-hidden="true">
              …
            </span>
          ),
        )}
        <button
          type="button"
          className="ui-pagination-button"
          aria-label="Next page"
          disabled={disabled || currentPage >= pageCount}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  )
}
