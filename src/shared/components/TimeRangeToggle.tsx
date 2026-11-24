import './SharedUi.css'

export type TimeRange = 'day' | 'week' | 'month' | 'year'

export interface TimeRangeToggleProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
  ariaLabel?: string
}

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

export function TimeRangeToggle({
  value,
  onChange,
  ariaLabel = 'Chart time range',
}: TimeRangeToggleProps) {
  return (
    <div className="time-range-toggle" role="group" aria-label={ariaLabel}>
      {timeRanges.map((range) => (
        <button
          key={range.value}
          type="button"
          className={`time-range-button${range.value === value ? ' is-active' : ''}`}
          aria-pressed={range.value === value}
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}
