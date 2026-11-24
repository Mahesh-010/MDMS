import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ConfirmDialog,
  DataTable,
  Input,
  Modal,
  Select,
  StatusBadge,
  Toggle,
  type DataTableColumn,
} from './modules/zone-admin/components'
import './component-preview.css'

interface DemoMeter {
  id: string
  meterNumber: string
  customer: string
  location: string
  status: 'Active' | 'Pending' | 'Deactivated'
}

const meters: DemoMeter[] = [
  { id: 'm-1001', meterNumber: 'MTR-1001', customer: 'Aarav Sharma', location: 'North Block', status: 'Active' },
  { id: 'm-1002', meterNumber: 'MTR-1002', customer: 'Mira Patel', location: 'East Market', status: 'Pending' },
  { id: 'm-1003', meterNumber: 'MTR-1003', customer: 'Dev Kumar', location: 'Central Avenue', status: 'Deactivated' },
  { id: 'm-1004', meterNumber: 'MTR-1004', customer: 'Sara Nair', location: 'West Park', status: 'Active' },
]

const meterColumns: DataTableColumn<DemoMeter>[] = [
  { key: 'meterNumber', header: 'Meter', sortable: true },
  { key: 'customer', header: 'Customer', sortable: true },
  { key: 'location', header: 'Location', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (meter) => <StatusBadge status={meter.status} />,
  },
]

export function ComponentPreview() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [meterStatus, setMeterStatus] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [modalNote, setModalNote] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [message, setMessage] = useState('')

  const emailError =
    email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? 'Enter a valid email address'
      : undefined

  return (
    <main className="component-preview">
      <header className="component-preview__header">
        <div>
          <span className="component-preview__eyebrow">MDMS · Shared UI</span>
          <h1>Component preview</h1>
          <p>Interactive examples of the reusable Zone Admin components.</p>
        </div>
      </header>

      <section className="component-preview__section">
        <div className="component-preview__section-heading">
          <div><h2>DataTable</h2><p>Sort columns, search rows, and change page size.</p></div>
        </div>
        <DataTable
          data={meters}
          columns={meterColumns}
          getRowId={(meter) => meter.id}
          pageSize={2}
          pageSizeOptions={[2, 4]}
          emptyMessage="No meters match your search."
        />
      </section>

      <section className="component-preview__section">
        <div className="component-preview__section-heading">
          <div><h2>StatusBadge</h2><p>Standard and additional status examples.</p></div>
        </div>
        <div className="component-preview__badges">
          <StatusBadge status="Active" />
          <StatusBadge status="Deactivated" />
          <StatusBadge status="Pending" />
          <StatusBadge status="Paid" />
          <StatusBadge status="Overdue" />
          <StatusBadge status="Critical" />
          <StatusBadge status="Informational" />
        </div>
      </section>

      <section className="component-preview__section">
        <div className="component-preview__section-heading">
          <div><h2>Form controls</h2><p>Controlled values, disabled states, and inline validation.</p></div>
        </div>
        <div className="component-preview__form-grid">
          <Input
            label="Customer name"
            value={name}
            onChange={setName}
            placeholder="Enter a name"
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@example.com"
            error={emailError}
          />
          <Select
            label="Meter status"
            value={meterStatus}
            onChange={setMeterStatus}
            placeholder="Choose a status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'deactivated', label: 'Deactivated' },
            ]}
          />
          <Toggle
            label="Email notifications"
            description="Receive zone alerts by email"
            checked={notifications}
            onChange={setNotifications}
          />
        </div>
        {(name || meterStatus) && (
          <p className="component-preview__form-state" aria-live="polite">
            {name ? `Name: ${name}` : ''}
            {name && meterStatus ? ' · ' : ''}
            {meterStatus ? `Status: ${meterStatus}` : ''}
          </p>
        )}
      </section>

      <section className="component-preview__section">
        <div className="component-preview__section-heading">
          <div><h2>Modal and ConfirmDialog</h2><p>Open each control to try its close and action callbacks.</p></div>
        </div>
        <div className="component-preview__actions">
          <button type="button" className="component-preview__button" onClick={() => setModalOpen(true)}>
            Open modal
          </button>
          <button
            type="button"
            className="component-preview__button component-preview__button--secondary"
            onClick={() => setConfirmOpen(true)}
          >
            Open confirmation
          </button>
          {message && <span className="component-preview__result" role="status">{message}</span>}
        </div>
      </section>

      <Modal
        open={modalOpen}
        title="Meter information"
        onClose={() => setModalOpen(false)}
        footer={
          <button type="button" className="component-preview__button" onClick={() => setModalOpen(false)}>
            Done
          </button>
        }
      >
        <p>This modal content is supplied by its parent through <code>children</code>.</p>
        <Input
          label="Modal note"
          value={modalNote}
          onChange={setModalNote}
          placeholder="Type without losing focus"
        />
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Deactivate meter?"
        message="This example demonstrates the destructive confirmation style."
        confirmLabel="Deactivate"
        destructive
        onCancel={() => {
          setConfirmOpen(false)
          setMessage('Confirmation cancelled.')
        }}
        onConfirm={() => {
          setConfirmOpen(false)
          setMessage('Confirmation accepted.')
        }}
      />
    </main>
  )
}

const previewRoot = createRoot(document.getElementById('component-preview-root')!)

previewRoot.render(
  <StrictMode>
    <ComponentPreview />
  </StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.dispose(() => previewRoot.unmount())
}
