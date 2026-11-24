import type { ReactNode } from 'react'
import './SharedUi.css'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
  disabled?: boolean
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  ariaLabel: string
}

export function Tabs({ tabs, activeTab, onChange, ariaLabel }: TabsProps) {
  const activeItem = tabs.find((tab) => tab.id === activeTab)

  return (
    <div className="ui-tabs">
      <div className="ui-tab-list" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={tab.id === activeTab}
            aria-controls={`panel-${tab.id}`}
            tabIndex={tab.id === activeTab ? 0 : -1}
            disabled={tab.disabled}
            className={`ui-tab${tab.id === activeTab ? ' is-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeItem && (
        <section
          id={`panel-${activeItem.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeItem.id}`}
          className="ui-tab-panel"
          tabIndex={0}
        >
          {activeItem.content}
        </section>
      )}
    </div>
  )
}
