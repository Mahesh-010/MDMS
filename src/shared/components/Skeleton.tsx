import './SharedUi.css'

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  count?: number
  className?: string
}

function toCssSize(size: string | number | undefined): string | undefined {
  if (typeof size === 'number') return `${size}px`
  return size
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
}: SkeletonProps) {
  const style = {
    width: toCssSize(width),
    height: toCssSize(height),
  }
  const classes = ['ui-skeleton', `ui-skeleton--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className="ui-skeleton-group" role="status" aria-label="Loading">
      {Array.from({ length: Math.max(0, Math.floor(count)) }, (_, index) => (
        <span
          key={index}
          className={classes}
          style={style}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}
