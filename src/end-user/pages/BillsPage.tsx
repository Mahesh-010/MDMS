import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../shared/components/PageHeader";
import { StatCard } from "../../shared/components/StatCard";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { Pagination } from "../../shared/components/Pagination";
import { Loader } from "../../shared/components/Loader";
import { getCustomerBills } from "../services/billsService";
import type { Bill, BillStatus } from "../../shared/types";
import "./BillsPage.css";

type StatusFilter = "all" | BillStatus;
type SortOrder = "newest" | "oldest";

const PAGE_SIZE = 8;

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`));
}

function getStatusLabel(status: BillStatus): "Paid" | "Pending" | "Overdue" {
  if (status === "paid") return "Paid";
  if (status === "pending") return "Pending";
  return "Overdue";
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const loadBills = useCallback(() => getCustomerBills(), []);

  useEffect(() => {
    let active = true;

    void loadBills()
      .then((response) => {
        if (active) {
          setBills(response.bills);
          setCustomerName(response.customerName);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load billing information.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadBills]);

  const summary = useMemo(() => {
    const paid = bills.filter((bill) => bill.status === "paid");
    const pending = bills.filter((bill) => bill.status === "pending");
    const overdue = bills.filter((bill) => bill.status === "overdue");

    const outstanding = bills
      .filter((bill) => bill.status === "pending" || bill.status === "overdue")
      .reduce((total, bill) => total + bill.amount, 0);

    return {
      total: bills.length,
      paid: paid.length,
      pending: pending.length,
      overdue: overdue.length,
      outstanding,
    };
  }, [bills]);

  const filteredBills = useMemo(() => {
    let result = [...bills];

    if (statusFilter !== "all") {
      result = result.filter((bill) => bill.status === statusFilter);
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();

      result = result.filter((bill) =>
        [bill.id, bill.meterId, bill.periodStart, bill.periodEnd].some(
          (value) => value.toLowerCase().includes(query),
        ),
      );
    }

    result.sort((a, b) => {
      const comparison = a.issuedAt.localeCompare(b.issuedAt);
      return sortOrder === "newest" ? -comparison : comparison;
    });

    return result;
  }, [bills, search, statusFilter, sortOrder]);

  const visibleBills = filteredBills.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function handleSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function handleSortChange(value: SortOrder) {
    setSortOrder(value);
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <div className="bills-loading">
        <Loader label="Loading bills and payments..." size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bills-page">
        <PageHeader
          title="Bills & Payments"
          subtitle="View your electricity bills and payment history."
        />

        <div className="bills-error" role="alert">
          <h2>Unable to load bills</h2>
          <p>{error}</p>
          <button
            className="ui-button ui-button--primary"
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              void loadBills()
                .then((response) => {
                  setBills(response.bills);
                  setCustomerName(response.customerName);
                })
                .catch((err: unknown) => {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Unable to load billing information.",
                  );
                })
                .finally(() => setLoading(false));
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bills-page">
      <PageHeader
        title="Bills & Payments"
        subtitle={`View and track your electricity bills${customerName ? `, ${customerName}` : ""}.`}
      />

      <section className="bills-summary">
        <StatCard
          label="Total Bills"
          value={summary.total}
          hint="All billing records"
        />

        <StatCard
          label="Paid Bills"
          value={summary.paid}
          hint="Successfully paid"
        />

        <StatCard
          label="Pending Bills"
          value={summary.pending}
          hint="Awaiting payment"
        />

        <StatCard
          label="Overdue Bills"
          value={summary.overdue}
          hint="Past their due date"
        />
      </section>

      <section className="bills-outstanding">
        <div>
          <span className="bills-outstanding-label">
            Total Outstanding Balance
          </span>
          <h2>{formatCurrency(summary.outstanding)}</h2>
          <p>Combined amount of pending and overdue bills</p>
        </div>

        <div className="bills-outstanding-icon" aria-hidden="true">
          ₹
        </div>
      </section>

      <section className="bills-table-section">
        <div className="bills-section-heading">
          <div>
            <h2>Billing History</h2>
            <p>All your electricity billing records</p>
          </div>

          <span className="bills-record-count">
            {filteredBills.length} records
          </span>
        </div>

        <div className="bills-toolbar">
          <div className="bills-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search by bill ID or meter ID..."
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              aria-label="Search bills"
            />
          </div>

          <div className="bills-filters">
            <select
              value={statusFilter}
              onChange={(event) =>
                handleStatusChange(event.target.value as StatusFilter)
              }
              aria-label="Filter by payment status"
            >
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) =>
                handleSortChange(event.target.value as SortOrder)
              }
              aria-label="Sort bills"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {visibleBills.length > 0 ? (
          <>
            <div className="bills-table-wrapper">
              <table className="bills-table">
                <thead>
                  <tr>
                    <th>Bill ID</th>
                    <th>Billing Period</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Consumption</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleBills.map((bill) => (
                    <tr key={bill.id}>
                      <td>
                        <Link
                          className="bills-id-link"
                          to={`/user/bills/${encodeURIComponent(bill.id)}`}
                        >
                          {bill.id}
                        </Link>
                        <span className="bills-meter-id">{bill.meterId}</span>
                      </td>

                      <td>
                        <span className="bills-period">
                          {formatDate(bill.periodStart)}
                        </span>
                        <span className="bills-subtext">
                          to {formatDate(bill.periodEnd)}
                        </span>
                      </td>

                      <td>{formatDate(bill.issuedAt)}</td>
                      <td>{formatDate(bill.dueAt)}</td>

                      <td>
                        {bill.unitsConsumedKwh.toLocaleString("en-IN")} kWh
                      </td>

                      <td className="bills-amount">
                        {formatCurrency(bill.amount, bill.currency)}
                      </td>

                      <td>
                        <StatusBadge status={getStatusLabel(bill.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bills-pagination">
              <Pagination
                page={currentPage}
                pageSize={PAGE_SIZE}
                total={filteredBills.length}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <div className="bills-empty">
            <span aria-hidden="true">▤</span>
            <h3>No bills found</h3>
            <p>Try changing your search or payment status filter.</p>

            <button
              type="button"
              className="ui-button ui-button--secondary"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <div className="bills-footer-note">
        <span aria-hidden="true">ⓘ</span>
        <p>
          This is a read-only billing view. Payments are not processed in Phase
          1.
        </p>
      </div>
    </div>
  );
}
