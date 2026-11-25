import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../../shared/components/PageHeader";
import { StatCard } from "../../shared/components/StatCard";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { Loader } from "../../shared/components/Loader";
import { getBillDetails } from "../services/billsService";
import type {
  BillDetailsData,
  // The data type is imported from the billing service.
} from "../services/billsService";
import type { BillStatus, BillDay } from "../../shared/types";
import "./BillDetailsPage.css";

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`));
}

function getStatusLabel(status: BillStatus): "Paid" | "Pending" | "Overdue" {
  if (status === "paid") return "Paid";
  if (status === "pending") return "Pending";
  return "Overdue";
}

export default function BillDetailsPage() {
  const { billId } = useParams<{ billId: string }>();

  const [details, setDetails] = useState<BillDetailsData | null>(null);
  const [selectedDayId, setSelectedDayId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!billId) {
      setError("Bill ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getBillDetails(billId);
      setDetails(response);
      setSelectedDayId(response.billDays[0]?.id ?? "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load bill details.",
      );
    } finally {
      setLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  if (loading) {
    return (
      <div className="bill-details-loading">
        <Loader label="Loading bill details..." size="large" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="bill-details-page">
        <PageHeader
          title="Bill Details"
          subtitle="View individual electricity bill information."
        />

        <div className="bill-details-error" role="alert">
          <h2>Unable to display bill</h2>
          <p>{error ?? "The requested bill could not be found."}</p>

          <Link to="/user/bills" className="ui-button ui-button--primary">
            Back to Bills
          </Link>
        </div>
      </div>
    );
  }

  const { bill, customer, meter, zone, billDays } = details;

  const selectedDay =
    billDays.find((day) => day.id === selectedDayId) ?? billDays[0] ?? null;

  const hourlyReadings = selectedDay?.hourlyReadings ?? [];

  const maximumHourlyUnits = Math.max(
    0,
    ...hourlyReadings.map((reading) => reading.unitsConsumedKwh),
  );

  const totalDailyUnits = billDays.reduce(
    (total, day) => total + day.unitsConsumedKwh,
    0,
  );

  return (
    <div className="bill-details-page">
      <PageHeader
        title="Bill Details"
        subtitle={`Detailed billing information for ${bill.id}`}
      />

      <div className="bill-details-back">
        <Link to="/user/bills" className="bill-back-link">
          ← Back to Billing History
        </Link>
      </div>

      {/* Bill overview */}
      <section className="bill-overview">
        <div>
          <span className="bill-overview-label">BILL REFERENCE</span>
          <h2>{bill.id}</h2>
          <p>
            Billing period: {formatDate(bill.periodStart)} –{" "}
            {formatDate(bill.periodEnd)}
          </p>
        </div>

        <div className="bill-overview-status">
          <StatusBadge status={getStatusLabel(bill.status)} />
          <span>Bill issued {formatDate(bill.issuedAt)}</span>
        </div>
      </section>

      {/* Amount summary */}
      <section className="bill-detail-stats">
        <StatCard
          label="Total Bill Amount"
          value={formatCurrency(bill.amount, bill.currency)}
          hint="Total payable amount"
        />

        <StatCard
          label="Energy Consumed"
          value={`${bill.unitsConsumedKwh.toLocaleString("en-IN")} kWh`}
          hint="Total units consumed"
        />

        <StatCard
          label="Due Date"
          value={formatDate(bill.dueAt)}
          hint="Payment deadline"
        />

        <StatCard
          label="Payment Status"
          value={getStatusLabel(bill.status)}
          hint={
            bill.paidAt
              ? `Paid on ${formatDate(bill.paidAt)}`
              : "Payment date not recorded"
          }
        />
      </section>

      {/* Customer and meter information */}
      <div className="bill-information-grid">
        <section className="bill-information-card">
          <h2>Customer Information</h2>

          <div className="bill-information-row">
            <span>Customer Name</span>
            <strong>{customer.name}</strong>
          </div>

          <div className="bill-information-row">
            <span>Customer ID</span>
            <strong>{customer.id}</strong>
          </div>

          <div className="bill-information-row">
            <span>Email</span>
            <strong>{customer.email}</strong>
          </div>

          <div className="bill-information-row">
            <span>Address</span>
            <strong>
              {customer.address.street}, {customer.address.city},{" "}
              {customer.address.state} - {customer.address.postalCode}
            </strong>
          </div>
        </section>

        <section className="bill-information-card">
          <h2>Meter Information</h2>

          <div className="bill-information-row">
            <span>Meter ID</span>
            <strong>{meter.id}</strong>
          </div>

          <div className="bill-information-row">
            <span>Serial Number</span>
            <strong>{meter.serialNumber}</strong>
          </div>

          <div className="bill-information-row">
            <span>Meter Status</span>
            <strong>{meter.status}</strong>
          </div>

          <div className="bill-information-row">
            <span>Installation Date</span>
            <strong>{formatDate(meter.installedAt)}</strong>
          </div>

          <div className="bill-information-row">
            <span>Zone</span>
            <strong>{zone.name}</strong>
          </div>
        </section>
      </div>

      {/* Billing information */}
      <section className="bill-information-card bill-timeline-card">
        <h2>Billing Information</h2>

        <div className="bill-timeline-grid">
          <div>
            <span>Billing Period</span>
            <strong>
              {formatDate(bill.periodStart)} – {formatDate(bill.periodEnd)}
            </strong>
          </div>

          <div>
            <span>Bill Generated</span>
            <strong>{formatDate(bill.issuedAt)}</strong>
          </div>

          <div>
            <span>Payment Due</span>
            <strong>{formatDate(bill.dueAt)}</strong>
          </div>

          <div>
            <span>Payment Date</span>
            <strong>
              {bill.paidAt ? formatDate(bill.paidAt) : "Not recorded"}
            </strong>
          </div>
        </div>
      </section>

      {/* Daily consumption */}
      <section className="bill-information-card bill-consumption-card">
        <div className="bill-section-heading">
          <div>
            <h2>Daily Consumption Breakdown</h2>
            <p>Electricity usage throughout the billing period</p>
          </div>

          <span className="bill-unit-total">
            {totalDailyUnits.toFixed(2)} kWh
          </span>
        </div>

        {billDays.length > 0 ? (
          <div className="bill-daily-table-wrapper">
            <table className="bill-daily-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Consumption</th>
                  <th>Usage</th>
                  <th>Hourly Data</th>
                </tr>
              </thead>

              <tbody>
                {billDays.map((day) => {
                  const selected = selectedDay?.id === day.id;
                  const percentage =
                    bill.unitsConsumedKwh > 0
                      ? Math.min(
                          100,
                          (day.unitsConsumedKwh / bill.unitsConsumedKwh) *
                            100 *
                            billDays.length,
                        )
                      : 0;

                  return (
                    <tr key={day.id} className={selected ? "is-selected" : ""}>
                      <td>{formatDate(day.date)}</td>

                      <td>{day.unitsConsumedKwh.toFixed(2)} kWh</td>

                      <td>
                        <div className="bill-usage-track">
                          <div
                            className="bill-usage-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="bill-hourly-select"
                          onClick={() => setSelectedDayId(day.id)}
                          aria-pressed={selected}
                        >
                          {day.hourlyReadings?.length
                            ? "View hourly readings"
                            : "Select day"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bill-no-data">
            Daily consumption records are not available for this bill.
          </div>
        )}
      </section>

      {/* Hourly consumption */}
      <section className="bill-information-card bill-hourly-card">
        <div className="bill-section-heading">
          <div>
            <h2>Hourly Consumption</h2>
            <p>
              {selectedDay
                ? `Readings for ${formatDate(selectedDay.date)}`
                : "Hourly meter readings"}
            </p>
          </div>

          {selectedDay && (
            <span className="bill-unit-total">
              {selectedDay.unitsConsumedKwh.toFixed(2)} kWh
            </span>
          )}
        </div>

        {hourlyReadings.length > 0 ? (
          <div className="bill-hourly-grid">
            {hourlyReadings.map((reading) => {
              const percentage =
                maximumHourlyUnits > 0
                  ? (reading.unitsConsumedKwh / maximumHourlyUnits) * 100
                  : 0;

              return (
                <div className="bill-hour-item" key={reading.id}>
                  <div className="bill-hour-value">
                    {reading.unitsConsumedKwh.toFixed(2)}
                  </div>

                  <div className="bill-hour-track">
                    <div
                      className="bill-hour-fill"
                      style={{ height: `${percentage}%` }}
                    />
                  </div>

                  <span>{reading.hour.slice(0, 2)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bill-no-data">
            {selectedDay
              ? "Hourly readings are not available for this day. Select another day to check its hourly data."
              : "Hourly consumption data is not available for this bill."}
          </div>
        )}
      </section>

      <div className="bill-readonly-note">
        <span>ⓘ</span>
        <p>
          This bill is displayed for reference only. Payment processing and bill
          modification are not available in Phase 1.
        </p>
      </div>
    </div>
  );
}
