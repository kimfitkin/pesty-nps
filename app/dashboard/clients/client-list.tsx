"use client";

import { useState, useMemo } from "react";
import type { SurveyRecord, ClientRecord } from "@/app/lib/types";
import { formatClientName, formatDate, HEADING_STYLE } from "../shared";

interface ClientSummary {
  clientName: string;
  displayName: string;
  totalSurveys: number;
  npsCount: number;
  csatCount: number;
  npsScore: number | null;
  avgCsat: number | null;
  lastActivityDate: string;
  accountManager: string | null;
  airtableClientId: string | null;
}

function computeClientSummaries(
  records: SurveyRecord[],
  clients: ClientRecord[]
): ClientSummary[] {
  // Build a map of survey data by clientName
  const surveyGrouped = new Map<string, SurveyRecord[]>();
  for (const r of records) {
    const existing = surveyGrouped.get(r.clientName) || [];
    existing.push(r);
    surveyGrouped.set(r.clientName, existing);
  }

  // Build a map of client metadata by slug
  const clientMap = new Map<string, ClientRecord>();
  for (const c of clients) {
    clientMap.set(c.clientSlug, c);
  }

  // Collect all unique client keys (from both sources)
  const allClientKeys = new Set<string>([
    ...surveyGrouped.keys(),
    ...clients.map((c) => c.clientSlug),
  ]);

  const summaries: ClientSummary[] = [];
  for (const clientName of allClientKeys) {
    const clientRecords = surveyGrouped.get(clientName) || [];
    const clientMeta = clientMap.get(clientName);

    const npsRecords = clientRecords.filter(
      (r) => r.surveyType === "NPS" && r.npsScore !== null
    );
    const csatRecords = clientRecords.filter(
      (r) => r.surveyType === "CSAT" && r.csatScore !== null
    );

    const sortedByDate = [...clientRecords].sort((a, b) =>
      b.submissionDate.localeCompare(a.submissionDate)
    );

    let npsScore: number | null = null;
    if (npsRecords.length > 0) {
      const promoters = npsRecords.filter((r) => r.npsScore! >= 9).length;
      const detractors = npsRecords.filter((r) => r.npsScore! <= 6).length;
      npsScore = Math.round(
        ((promoters - detractors) / npsRecords.length) * 100
      );
    }

    let avgCsat: number | null = null;
    if (csatRecords.length > 0) {
      const sum = csatRecords.reduce((s, r) => s + r.csatScore!, 0);
      avgCsat = parseFloat((sum / csatRecords.length).toFixed(1));
    }

    summaries.push({
      clientName,
      displayName: clientMeta?.displayName || formatClientName(clientName),
      totalSurveys: clientRecords.length,
      npsCount: npsRecords.length,
      csatCount: csatRecords.length,
      npsScore,
      avgCsat,
      lastActivityDate: sortedByDate[0]?.submissionDate || "",
      accountManager: clientMeta?.accountManager || null,
      airtableClientId: clientMeta?.id || null,
    });
  }

  return summaries.sort((a, b) =>
    b.lastActivityDate.localeCompare(a.lastActivityDate)
  );
}

function getNpsScoreColor(score: number): string {
  if (score >= 50) return "var(--success)";
  if (score >= 0) return "var(--warning)";
  return "var(--error)";
}

function getCsatScoreColor(score: number): string {
  if (score >= 4) return "var(--success)";
  if (score >= 3) return "var(--warning)";
  return "var(--error)";
}

// ─── Add Client Modal ───────────────────────────────────────────

function AddClientModal({
  existingSlugs,
  onSubmit,
  onCancel,
}: {
  existingSlugs: Set<string>;
  onSubmit: (data: {
    clientSlug: string;
    displayName: string;
    accountManager: string;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [accountManager, setAccountManager] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function autoSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(name: string) {
    setDisplayName(name);
    if (!slugEdited) {
      setSlug(autoSlug(name));
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugEdited(true);
  }

  async function handleSubmit() {
    setError("");

    if (!displayName.trim() || !slug.trim() || !accountManager.trim()) {
      setError("All fields are required");
      return;
    }

    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      setError("Survey URL ID must be lowercase letters, numbers, and hyphens only");
      return;
    }

    if (existingSlugs.has(slug)) {
      setError("A client with this URL ID already exists");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        clientSlug: slug,
        displayName: displayName.trim(),
        accountManager: accountManager.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
      setIsSubmitting(false);
    }
  }

  const inputStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-lg p-6"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="mb-4 text-base font-bold"
          style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}
        >
          Add Client
        </h3>

        <div className="mb-3">
          <label
            className="mb-1 block text-[11px] font-medium uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Client Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Acme Pest Control"
            className="w-full rounded-md px-3 py-2 text-[13px] focus:outline-none"
            style={inputStyle}
            autoFocus
          />
        </div>

        <div className="mb-3">
          <label
            className="mb-1 block text-[11px] font-medium uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Survey URL ID
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="e.g. acme-pest-control"
            className="w-full rounded-md px-3 py-2 text-[13px] focus:outline-none"
            style={inputStyle}
          />
          <p
            className="mt-1 text-[11px]"
            style={{ color: "var(--text-muted)" }}
          >
            Used in survey URLs: /nps-{slug || "..."}
          </p>
        </div>

        <div className="mb-4">
          <label
            className="mb-1 block text-[11px] font-medium uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Account Manager
          </label>
          <input
            type="text"
            value={accountManager}
            onChange={(e) => setAccountManager(e.target.value)}
            placeholder="e.g. Sarah Johnson"
            className="w-full rounded-md px-3 py-2 text-[13px] focus:outline-none"
            style={inputStyle}
          />
        </div>

        {error && (
          <p className="mb-3 text-[12px]" style={{ color: "var(--error)" }}>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-md px-4 py-2 text-[13px] font-medium cursor-pointer transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium text-white cursor-pointer transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Adding...
              </>
            ) : (
              "Add Client"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Client List ────────────────────────────────────────────────

export function ClientList({
  records,
  clients,
  onSelectClient,
  onCreateClient,
  onDeleteClient,
}: {
  records: SurveyRecord[];
  clients: ClientRecord[];
  onSelectClient: (clientName: string) => void;
  onCreateClient: (data: {
    clientSlug: string;
    displayName: string;
    accountManager: string;
  }) => Promise<ClientRecord>;
  onDeleteClient: (id: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ClientSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const summaries = useMemo(
    () => computeClientSummaries(records, clients),
    [records, clients]
  );

  const existingSlugs = useMemo(
    () => new Set(summaries.map((s) => s.clientName)),
    [summaries]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return summaries;
    const q = search.toLowerCase();
    return summaries.filter(
      (s) =>
        s.displayName.toLowerCase().includes(q) ||
        s.clientName.toLowerCase().includes(q) ||
        (s.accountManager && s.accountManager.toLowerCase().includes(q))
    );
  }, [summaries, search]);

  async function handleCreateClient(data: {
    clientSlug: string;
    displayName: string;
    accountManager: string;
  }) {
    await onCreateClient(data);
    setShowAddModal(false);
  }

  async function handleDeleteClient() {
    if (!confirmDelete?.airtableClientId) return;
    setIsDeleting(true);
    try {
      await onDeleteClient(confirmDelete.airtableClientId);
      setConfirmDelete(null);
    } catch {
      // keep modal open on error
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[15px] font-bold" style={HEADING_STYLE}>
          Clients
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative" style={{ minWidth: "220px" }}>
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => {
                // Delay so click on dropdown item registers
                setTimeout(() => setDropdownOpen(false), 200);
              }}
              className="w-full rounded-md px-3 py-1.5 text-[13px] focus:outline-none"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
            {dropdownOpen && summaries.length > 0 && (
              <div
                className="absolute left-0 right-0 z-40 mt-1 max-h-60 overflow-y-auto rounded-md py-1"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                {summaries
                  .filter((s) => {
                    if (!search.trim()) return true;
                    const q = search.toLowerCase();
                    return (
                      s.displayName.toLowerCase().includes(q) ||
                      s.clientName.toLowerCase().includes(q) ||
                      (s.accountManager &&
                        s.accountManager.toLowerCase().includes(q))
                    );
                  })
                  .map((s) => (
                    <button
                      key={s.clientName}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSearch("");
                        setDropdownOpen(false);
                        onSelectClient(s.clientName);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors cursor-pointer"
                      style={{ color: "var(--text)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--surface)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <div>
                        <span className="font-medium">{s.displayName}</span>
                        {s.accountManager && (
                          <span
                            className="ml-2 text-[11px]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            AM: {s.accountManager}
                          </span>
                        )}
                      </div>
                      <span
                        className="text-[11px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {s.totalSurveys} survey
                        {s.totalSurveys !== 1 ? "s" : ""}
                      </span>
                    </button>
                  ))}
                {summaries.filter((s) => {
                  if (!search.trim()) return true;
                  const q = search.toLowerCase();
                  return (
                    s.displayName.toLowerCase().includes(q) ||
                    s.clientName.toLowerCase().includes(q) ||
                    (s.accountManager &&
                      s.accountManager.toLowerCase().includes(q))
                  );
                }).length === 0 && (
                  <p
                    className="px-3 py-2 text-[12px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No clients match
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-white cursor-pointer transition-opacity whitespace-nowrap"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add Client
          </button>
        </div>
      </div>

      {showAddModal && (
        <AddClientModal
          existingSlugs={existingSlugs}
          onSubmit={handleCreateClient}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
          onClick={() => !isDeleting && setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg p-6"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="mb-2 text-base font-bold"
              style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}
            >
              Remove Client
            </h3>
            <p className="mb-4 text-[13px]" style={{ color: "var(--text-muted)" }}>
              Are you sure you want to remove{" "}
              <strong style={{ color: "var(--text)" }}>
                {confirmDelete.displayName}
              </strong>
              ? This removes the client record from the Clients table. Survey
              responses will not be deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={isDeleting}
                className="rounded-md px-4 py-2 text-[13px] font-medium cursor-pointer transition-opacity disabled:opacity-50"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
                disabled={isDeleting}
                className="rounded-md px-4 py-2 text-[13px] font-medium text-white cursor-pointer transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "var(--error)" }}
              >
                {isDeleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{
            backgroundColor: "var(--card)",
            border: "1px dashed var(--border)",
          }}
        >
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            {search
              ? "No clients match your search"
              : "No clients yet. Add your first client to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <div
              key={client.clientName}
              className="cursor-pointer rounded-lg p-5 text-left transition-colors"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
              onClick={() => onSelectClient(client.clientName)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--surface)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--card)")
              }
            >
              <div className="mb-1 flex items-center justify-between">
                <h3
                  className="text-[14px] font-bold"
                  style={{ color: "var(--text)" }}
                >
                  {client.displayName}
                </h3>
                <div className="flex items-center gap-1">
                  {client.airtableClientId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(client);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded transition-colors cursor-pointer"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--error)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--text-muted)")
                      }
                      title="Remove client"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  )}
                  <svg
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: "var(--text-muted)" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </div>

              {client.accountManager && (
                <p
                  className="mb-3 text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  AM: {client.accountManager}
                </p>
              )}

              {client.totalSurveys > 0 ? (
                <>
                  <div className="mb-3 flex gap-4">
                    {client.npsScore !== null && (
                      <div>
                        <p
                          className="text-[10px] font-medium uppercase tracking-wide"
                          style={{ color: "var(--text-muted)" }}
                        >
                          NPS
                        </p>
                        <p
                          className="text-lg font-bold"
                          style={{
                            color: getNpsScoreColor(client.npsScore),
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {client.npsScore}
                        </p>
                      </div>
                    )}
                    {client.avgCsat !== null && (
                      <div>
                        <p
                          className="text-[10px] font-medium uppercase tracking-wide"
                          style={{ color: "var(--text-muted)" }}
                        >
                          CSAT
                        </p>
                        <p
                          className="text-lg font-bold"
                          style={{
                            color: getCsatScoreColor(client.avgCsat),
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {client.avgCsat}
                          <span
                            className="text-xs font-normal"
                            style={{ color: "var(--text-muted)" }}
                          >
                            /5
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    className="flex items-center justify-between text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span>
                      {client.totalSurveys} survey
                      {client.totalSurveys !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>
                      {formatDate(client.lastActivityDate)}
                    </span>
                  </div>
                </>
              ) : (
                <p
                  className="mt-2 text-[12px] italic"
                  style={{ color: "var(--text-muted)" }}
                >
                  No surveys yet
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
