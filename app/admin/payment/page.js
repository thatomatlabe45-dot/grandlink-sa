"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function AdminPaymentsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        throw new Error(
          "We could not verify administrator access. Please try again."
        );
      }

      if (!admin) {
        setAuthorized(false);
        setRequests([]);
        setError("Administrator access is required to view payment requests.");
        return;
      }

      setAuthorized(true);

      const { data: paymentRequests, error: requestsError } =
        await supabase
          .from("payment_requests")
          .select(
            "id, company_id, subscription_id, payment_amount, payment_reference, proof_path, status, submitted_at, reviewed_at, created_at"
          )
          .order("submitted_at", { ascending: false });

      if (requestsError) {
        throw new Error(
          requestsError.message || "Could not load payment requests."
        );
      }

      const rows = paymentRequests || [];

      /*
       * Look up the company profiles using:
       * payment_requests.company_id -> companies.user_id
       */
      const companyIds = [
        ...new Set(rows.map((row) => row.company_id).filter(Boolean)),
      ];

      let companyMap = {};

      if (companyIds.length > 0) {
        const { data: companies, error: companiesError } = await supabase
          .from("companies")
          .select("user_id, company_name, email, logo_url")
          .in("user_id", companyIds);

        if (companiesError) {
          throw new Error(
            "Payment requests loaded, but company details could not be loaded: " +
              companiesError.message
          );
        }

        companyMap = Object.fromEntries(
          (companies || []).map((company) => [
            company.user_id,
            {
              company_name: company.company_name,
              email: company.email,
              logo_url: company.logo_url,
            },
          ])
        );
      }

      const enrichedRequests = rows.map((request) => {
        const company = companyMap[request.company_id];

        return {
          ...request,
          company_name:
            company?.company_name?.trim() || "Company profile not found",
          company_email: company?.email || "",
          company_logo: company?.logo_url || "",
        };
      });

      setRequests(enrichedRequests);
    } catch (err) {
      setError(err.message || "Something went wrong loading payments.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function reviewPayment(request, decision) {
    setMessage("");
    setError("");

    const companyName = request.company_name || "this company";
    const amount = Number(request.payment_amount || 0).toLocaleString(
      "en-ZA"
    );

    if (decision === "approve") {
      const confirmed = window.confirm(
        `IMPORTANT: Have you confirmed that R${amount} has arrived in your Capitec business account?\n\nCompany: ${companyName}\nReference: ${request.payment_reference || "Not provided"}\n\nOnly approve if the money is confirmed in your account.`
      );

      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(
        `Reject this payment request from ${companyName}?\n\nThe subscription will not be activated.`
      );

      if (!confirmed) return;
    }

    setProcessingId(request.id);

    try {
      const { data, error: reviewError } = await supabase.rpc(
        "admin_review_payment_request",
        {
          p_payment_request_id: request.id,
          p_decision: decision,
        }
      );

      if (reviewError) {
        throw new Error(
          reviewError.message || "The payment review could not be completed."
        );
      }

      if (data && data.success === false) {
        throw new Error(
          data.message || "The payment review was not successful."
        );
      }

      setMessage(
        decision === "approve"
          ? `Payment approved for ${companyName}.`
          : `Payment rejected for ${companyName}.`
      );

      await loadRequests();
    } catch (err) {
      setError(err.message || "Could not process this payment.");
    } finally {
      setProcessingId(null);
    }
  }

  async function openProof(path) {
    setError("");

    if (!path) {
      setError("No proof of payment was attached to this request.");
      return;
    }

    try {
      const { data, error: storageError } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(path, 600);

      if (storageError || !data?.signedUrl) {
        throw new Error(
          storageError?.message ||
            "Could not open the proof of payment. Check administrator storage permissions."
        );
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message || "Could not open proof of payment.");
    }
  }

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError("Could not sign out. Please try again.");
      return;
    }

    router.replace("/login");
  }

  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter(
        (request) => request.status?.toLowerCase() === "pending"
      ).length,
      approved: requests.filter(
        (request) =>
          ["approved", "completed"].includes(
            request.status?.toLowerCase()
          )
      ).length,
      rejected: requests.filter(
        (request) => request.status?.toLowerCase() === "rejected"
      ).length,
    };
  }, [requests]);

  const visibleRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    return requests
      .filter((request) => {
        const status = request.status?.toLowerCase() || "";

        if (filter === "pending" && status !== "pending") return false;

        if (
          filter === "approved" &&
          !["approved", "completed"].includes(status)
        ) {
          return false;
        }

        if (filter === "rejected" && status !== "rejected") {
          return false;
        }

        if (!term) return true;

        return [
          request.company_name,
          request.company_email,
          request.payment_reference,
          request.subscription_id?.toString(),
          request.id?.toString(),
        ].some((value) => String(value || "").toLowerCase().includes(term));
      })
      .sort((a, b) => {
        const nameA = (a.company_name || "").toLowerCase();
        const nameB = (b.company_name || "").toLowerCase();

        const nameOrder = nameA.localeCompare(nameB);

        if (nameOrder !== 0) return nameOrder;

        return (
          new Date(b.submitted_at || b.created_at || 0).getTime() -
          new Date(a.submitted_at || a.created_at || 0).getTime()
        );
      });
  }, [requests, filter, search]);

  function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatAmount(value) {
    return `R${Number(value || 0).toLocaleString("en-ZA")}`;
  }

  function statusClass(status) {
    const value = (status || "unknown").toLowerCase();

    if (value === "pending") return "pending";
    if (["approved", "completed", "active"].includes(value)) {
      return "approved";
    }
    if (value === "rejected") return "rejected";

    return "unknown";
  }

  if (loading) {
    return (
      <main className="loadingPage">
        <div className="loadingMark">G</div>
        <h2>Loading payment reviews</h2>
        <p>Checking administrator access and payment requests…</p>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="accessPage">
        <div className="accessCard">
          <div className="brandMark">G</div>
          <p className="eyebrow">GRADLINK SA</p>
          <h1>Administrator access required</h1>
          <p>
            This area is restricted to authorised GradLink SA administrators.
          </p>

          {error && <div className="alert errorAlert">{error}</div>}

          <Link href="/" className="primaryButton">
            Return to homepage
          </Link>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brandMark">G</span>
          <span className="brandWords">
            <strong>GradLink SA</strong>
            <small>Administration</small>
          </span>
        </Link>

        <div className="topActions">
          <span className="adminLabel">
            <span className="onlineDot" />
            Admin portal
          </span>

          <button className="signOutButton" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <div className="content">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Payment reviews</span>
        </div>

        <section className="hero">
          <div className="heroText">
            <div className="eyebrow">FINANCE & SUBSCRIPTIONS</div>
            <h1>Bank payment reviews</h1>
            <p>
              Review company payments, verify deposits in your Capitec business
              account, and activate subscriptions after confirmation.
            </p>
          </div>

          <button
            className="refreshButton"
            onClick={loadRequests}
            disabled={loading}
          >
            <span className="refreshIcon">↻</span>
            Refresh requests
          </button>
        </section>

        {message && (
          <div className="alert successAlert">
            <span className="alertIcon">✓</span>
            {message}
            <button
              className="dismissButton"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="alert errorAlert">
            <span className="alertIcon">!</span>
            {error}
            <button
              className="dismissButton"
              onClick={() => setError("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <section className="stats">
          <button
            className={`statCard ${filter === "pending" ? "selected" : ""}`}
            onClick={() => setFilter("pending")}
          >
            <span className="statIcon pendingIcon">◷</span>
            <span className="statText">
              <small>Awaiting review</small>
              <strong>{counts.pending}</strong>
              <span>Needs your attention</span>
            </span>
          </button>

          <button
            className={`statCard ${filter === "approved" ? "selected" : ""}`}
            onClick={() => setFilter("approved")}
          >
            <span className="statIcon approvedIcon">✓</span>
            <span className="statText">
              <small>Approved</small>
              <strong>{counts.approved}</strong>
              <span>Reviewed successfully</span>
            </span>
          </button>

          <button
            className={`statCard ${filter === "rejected" ? "selected" : ""}`}
            onClick={() => setFilter("rejected")}
          >
            <span className="statIcon rejectedIcon">×</span>
            <span className="statText">
              <small>Rejected</small>
              <strong>{counts.rejected}</strong>
              <span>Not approved</span>
            </span>
          </button>
        </section>

        <section className="requestsSection">
          <div className="sectionHeading">
            <div>
              <h2>Company payment requests</h2>
              <p>
                {visibleRequests.length}{" "}
                {visibleRequests.length === 1 ? "request" : "requests"} shown
                · Ordered alphabetically by company
              </p>
            </div>

            <span className="totalPill">
              {counts.all} total
            </span>
          </div>

          <div className="toolbar">
            <div className="searchBox">
              <span className="searchIcon">⌕</span>
              <input
                type="search"
                placeholder="Search company, reference or ID…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search payment requests"
              />

              {search && (
                <button
                  className="clearSearch"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <select
              className="filterSelect"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter by payment status"
            >
              <option value="pending">Pending payments</option>
              <option value="approved">Approved payments</option>
              <option value="rejected">Rejected payments</option>
              <option value="all">All payments</option>
            </select>
          </div>

          {visibleRequests.length === 0 ? (
            <div className="emptyState">
              <div className="emptyIcon">▤</div>
              <h3>No payment requests found</h3>
              <p>
                {search
                  ? "Try another company name, payment reference or ID."
                  : filter === "pending"
                    ? "There are no pending payments to review right now."
                    : "There are no requests in this category yet."}
              </p>

              {(search || filter !== "pending") && (
                <button
                  className="textButton"
                  onClick={() => {
                    setSearch("");
                    setFilter("pending");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="requestList">
              {visibleRequests.map((request) => {
                const pending =
                  request.status?.toLowerCase() === "pending";

                return (
                  <article className="requestCard" key={request.id}>
                    <div className="requestTop">
                      <div className="companyIdentity">
                        {request.company_logo ? (
                          <img
                            src={request.company_logo}
                            alt=""
                            className="companyLogo"
                          />
                        ) : (
                          <div className="companyLogoFallback">
                            {(request.company_name || "C")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="companyDetails">
                          <h3>{request.company_name}</h3>
                          {request.company_email && (
                            <p className="companyEmail">
                              {request.company_email}
                            </p>
                          )}
                          <span className="requestId">
                            Request #{request.id}
                          </span>
                        </div>
                      </div>

                      <div className="amountAndStatus">
                        <strong className="amount">
                          {formatAmount(request.payment_amount)}
                        </strong>

                        <span
                          className={`statusBadge ${statusClass(
                            request.status
                          )}`}
                        >
                          <span className="statusDot" />
                          {request.status || "Unknown"}
                        </span>
                      </div>
                    </div>

                    <div className="detailsGrid">
                      <div className="detailItem">
                        <span>Payment reference</span>
                        <strong className="referenceValue">
                          {request.payment_reference || "Not provided"}
                        </strong>
                      </div>

                      <div className="detailItem">
                        <span>Subscription ID</span>
                        <strong>#{request.subscription_id}</strong>
                      </div>

                      <div className="detailItem">
                        <span>Date submitted</span>
                        <strong>
                          {formatDate(
                            request.submitted_at || request.created_at
                          )}
                        </strong>
                      </div>

                      <div className="detailItem">
                        <span>Date reviewed</span>
                        <strong>{formatDate(request.reviewed_at)}</strong>
                      </div>
                    </div>

                    <div className="requestFooter">
                      <button
                        className="proofButton"
                        onClick={() => openProof(request.proof_path)}
                        disabled={!request.proof_path}
                      >
                        <span>↗</span>
                        View proof of payment
                      </button>

                      {pending ? (
                        <div className="reviewActions">
                          <button
                            className="rejectButton"
                            onClick={() =>
                              reviewPayment(request, "reject")
                            }
                            disabled={processingId === request.id}
                          >
                            Reject
                          </button>

                          <button
                            className="approveButton"
                            onClick={() =>
                              reviewPayment(request, "approve")
                            }
                            disabled={processingId === request.id}
                          >
                            {processingId === request.id
                              ? "Processing…"
                              : "Approve payment"}
                          </button>
                        </div>
                      ) : (
                        <span className="reviewedLabel">
                          {request.status?.toLowerCase() === "approved"
                            ? "✓ Payment approved"
                            : request.status?.toLowerCase() === "rejected"
                              ? "Payment rejected"
                              : "No action available"}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="pageFooter">
          <span>GradLink SA Administration</span>
          <span>Verify funds before approving any payment.</span>
        </footer>
      </div>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    background: #f5f8fd;
    color: #15233b;
    font-family: Arial, Helvetica, sans-serif;
  }

  :global(button),
  :global(input),
  :global(select) {
    font: inherit;
  }

  .page {
    min-height: 100vh;
    background:
      radial-gradient(ellipse at 12% 0%, rgba(41, 108, 230, 0.06), transparent 32%),
      #f5f8fd;
  }

  .topbar {
    min-height: 76px;
    padding: 14px 5.5%;
    background: #fff;
    border-bottom: 1px solid #e6edf6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 11px;
    text-decoration: none;
    color: #132747;
  }

  .brandMark {
    width: 43px;
    height: 43px;
    border-radius: 13px;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 23px;
    font-weight: 800;
    background: linear-gradient(145deg, #2875ef, #1646a9);
    box-shadow: 0 5px 12px rgba(31, 94, 202, 0.22);
  }

  .brandWords {
    display: grid;
    gap: 4px;
  }

  .brandWords strong {
    font-size: 16px;
    letter-spacing: -0.3px;
  }

  .brandWords small {
    color: #7b8aa1;
    font-size: 11px;
  }

  .topActions {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .adminLabel {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    font-weight: 700;
    color: #5e6f86;
  }

  .onlineDot,
  .statusDot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    display: inline-block;
    background: #16a36b;
  }

  .signOutButton {
    border: 1px solid #dce5f1;
    background: #fff;
    color: #425570;
    padding: 10px 15px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .signOutButton:hover,
  .refreshButton:hover {
    background: #f2f6fc;
  }

  .content {
    max-width: 1160px;
    width: 91%;
    margin: 0 auto;
    padding: 26px 0 20px;
  }

  .breadcrumb {
    display: flex;
    gap: 9px;
    align-items: center;
    font-size: 12px;
    color: #8794a8;
    margin-bottom: 27px;
  }

  .breadcrumb a {
    color: #326ac5;
    text-decoration: none;
  }

  .hero {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    margin-bottom: 25px;
  }

  .eyebrow {
    color: #3973d0;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.5px;
    margin-bottom: 11px;
  }

  .hero h1 {
    margin: 0;
    font-size: clamp(27px, 4vw, 36px);
    line-height: 1.16;
    letter-spacing: -1.1px;
    color: #142947;
  }

  .hero p {
    max-width: 620px;
    margin: 11px 0 0;
    color: #6e7e95;
    font-size: 14px;
    line-height: 1.7;
  }

  .refreshButton {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #dbe5f2;
    background: #fff;
    color: #28466e;
    border-radius: 11px;
    padding: 12px 15px;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
  }

  .refreshButton:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .refreshIcon {
    font-size: 19px;
    line-height: 12px;
  }

  .alert {
    border-radius: 11px;
    padding: 13px 15px;
    margin: 0 0 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    line-height: 1.5;
  }

  .successAlert {
    color: #126b47;
    background: #eaf8f1;
    border: 1px solid #c8eddb;
  }

  .errorAlert {
    color: #a12e3a;
    background: #fff0f1;
    border: 1px solid #f6d2d6;
  }

  .alertIcon {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.05);
    font-weight: 800;
  }

  .dismissButton {
    margin-left: auto;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 21px;
    cursor: pointer;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 15px;
    margin-bottom: 31px;
  }

  .statCard {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 15px;
    text-align: left;
    padding: 19px;
    border-radius: 15px;
    border: 1px solid #e5ebf4;
    background: #fff;
    box-shadow: 0 3px 12px rgba(29, 57, 96, 0.025);
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .statCard:hover,
  .statCard.selected {
    border-color: #a8c5f6;
    box-shadow: 0 5px 18px rgba(34, 93, 188, 0.07);
  }

  .statIcon {
    width: 43px;
    height: 43px;
    border-radius: 13px;
    display: grid;
    place-items: center;
    font-size: 23px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .pendingIcon {
    color: #a66a0a;
    background: #fff5dc;
  }

  .approvedIcon {
    color: #14835a;
    background: #e5f8ef;
  }

  .rejectedIcon {
    color: #bd3e4c;
    background: #ffeaed;
  }

  .statText {
    display: grid;
    gap: 5px;
    min-width: 0;
  }

  .statText small {
    color: #72819a;
    font-size: 11px;
    font-weight: 700;
  }

  .statText strong {
    color: #182d4b;
    font-size: 27px;
    line-height: 1;
  }

  .statText > span {
    color: #94a0b1;
    font-size: 10px;
  }

  .requestsSection {
    background: #fff;
    border: 1px solid #e5ebf4;
    border-radius: 17px;
    padding: 24px;
    box-shadow: 0 5px 20px rgba(29, 57, 96, 0.025);
  }

  .sectionHeading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 22px;
  }

  .sectionHeading h2 {
    margin: 0;
    font-size: 19px;
    letter-spacing: -0.4px;
    color: #1a2e4b;
  }

  .sectionHeading p {
    margin: 7px 0 0;
    color: #8996a9;
    font-size: 12px;
    line-height: 1.5;
  }

  .totalPill {
    background: #eef4ff;
    color: #2e61ad;
    border-radius: 20px;
    padding: 7px 11px;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
  }

  .toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 205px;
    gap: 12px;
    margin-bottom: 20px;
  }

  .searchBox {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 9px;
    border: 1px solid #dfe7f1;
    background: #fbfcfe;
    border-radius: 10px;
    padding: 0 12px;
  }

  .searchIcon {
    color: #8c9bb0;
    font-size: 24px;
    line-height: 1;
  }

  .searchBox input {
    width: 100%;
    min-width: 0;
    height: 43px;
    border: 0;
    outline: 0;
    background: transparent;
    color: #203550;
    font-size: 12px;
  }

  .searchBox input::placeholder {
    color: #9aa6b7;
  }

  .clearSearch {
    border: 0;
    background: transparent;
    color: #75849b;
    font-size: 20px;
    cursor: pointer;
  }

  .filterSelect {
    width: 100%;
    min-width: 0;
    border: 1px solid #dfe7f1;
    border-radius: 10px;
    background: #fff;
    color: #334a69;
    padding: 0 11px;
    height: 45px;
    font-size: 12px;
    font-weight: 700;
    outline-color: #7ba7ef;
  }

  .requestList {
    display: grid;
    gap: 14px;
  }

  .requestCard {
    min-width: 0;
    border: 1px solid #e5ebf4;
    border-radius: 14px;
    padding: 20px;
    background: #fff;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .requestCard:hover {
    border-color: #cbdcf5;
    box-shadow: 0 5px 16px rgba(31, 73, 133, 0.045);
  }

  .requestTop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
  }

  .companyIdentity {
    display: flex;
    align-items: center;
    gap: 13px;
    min-width: 0;
  }

  .companyLogo,
  .companyLogoFallback {
    width: 51px;
    height: 51px;
    border-radius: 13px;
    border: 1px solid #e5ebf4;
    flex-shrink: 0;
    object-fit: contain;
    background: #f7faff;
  }

  .companyLogoFallback {
    display: grid;
    place-items: center;
    background: linear-gradient(145deg, #e9f1ff, #f5f8ff);
    color: #2b60b5;
    font-size: 22px;
    font-weight: 800;
  }

  .companyDetails {
    min-width: 0;
  }

  .companyDetails h3 {
    margin: 0;
    color: #1b3150;
    font-size: 15px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .companyEmail {
    margin: 4px 0 0;
    color: #74849a;
    font-size: 11px;
    overflow-wrap: anywhere;
  }

  .requestId {
    display: inline-block;
    margin-top: 6px;
    color: #98a3b3;
    font-size: 10px;
  }

  .amountAndStatus {
    flex-shrink: 0;
    display: grid;
    justify-items: end;
    gap: 9px;
  }

  .amount {
    font-size: 22px;
    letter-spacing: -0.5px;
    color: #193d72;
  }

  .statusBadge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 20px;
    padding: 6px 9px;
    font-size: 10px;
    font-weight: 800;
    text-transform: capitalize;
  }

  .statusBadge.pending {
    color: #9b670d;
    background: #fff4d9;
  }

  .statusBadge.pending .statusDot {
    background: #d89b22;
  }

  .statusBadge.approved {
    color: #11734d;
    background: #e4f7ed;
  }

  .statusBadge.approved .statusDot {
    background: #16a36b;
  }

  .statusBadge.rejected {
    color: #a12e3a;
    background: #ffeaed;
  }

  .statusBadge.rejected .statusDot {
    background: #d74c5a;
  }

  .statusBadge.unknown {
    color: #66768d;
    background: #eef2f7;
  }

  .statusBadge.unknown .statusDot {
    background: #8a98aa;
  }

  .detailsGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 17px 24px;
    padding: 19px 0;
    margin-top: 18px;
    border-top: 1px solid #edf1f7;
    border-bottom: 1px solid #edf1f7;
  }

  .detailItem {
    min-width: 0;
    display: grid;
    gap: 7px;
  }

  .detailItem > span {
    color: #8a98aa;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.55px;
  }

  .detailItem strong {
    color: #344964;
    font-size: 12px;
    font-weight: 700;
    overflow-wrap: anywhere;
    line-height: 1.5;
  }

  .referenceValue {
    color: #2d5eaa !important;
  }

  .requestFooter {
    padding-top: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 13px;
  }

  .proofButton {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 0;
    background: transparent;
    color: #326ac5;
    padding: 8px 0;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    text-align: left;
  }

  .proofButton span {
    font-size: 16px;
  }

  .proofButton:disabled {
    color: #a5afbd;
    cursor: not-allowed;
  }

  .reviewActions {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .rejectButton,
  .approveButton {
    min-height: 39px;
    border-radius: 9px;
    padding: 0 13px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
  }

  .rejectButton {
    background: #fff;
    color: #b33948;
    border: 1px solid #f0cdd2;
  }

  .rejectButton:hover {
    background: #fff5f6;
  }

  .approveButton {
    background: linear-gradient(135deg, #276fe1, #1c54b5);
    border: 1px solid #2764c7;
    color: #fff;
    box-shadow: 0 3px 8px rgba(35, 94, 193, 0.14);
  }

  .approveButton:hover {
    background: #194da8;
  }

  .rejectButton:disabled,
  .approveButton:disabled {
    opacity: 0.55;
    cursor: wait;
  }

  .reviewedLabel {
    color: #72839a;
    font-size: 11px;
    font-weight: 700;
  }

  .emptyState {
    padding: 46px 18px;
    text-align: center;
    border: 1px dashed #dbe4f0;
    border-radius: 13px;
    background: #fbfcff;
  }

  .emptyIcon {
    margin: 0 auto 12px;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    color: #4275c5;
    background: #eaf1ff;
    font-size: 25px;
  }

  .emptyState h3 {
    margin: 0;
    color: #263d5c;
    font-size: 16px;
  }

  .emptyState p {
    max-width: 360px;
    margin: 9px auto 0;
    color: #8290a4;
    font-size: 12px;
    line-height: 1.7;
  }

  .textButton {
    margin-top: 15px;
    padding: 8px 12px;
    border: 0;
    border-radius: 8px;
    color: #2d63b5;
    background: #edf4ff;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
  }

  .pageFooter {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 22px 3px;
    color: #94a0b1;
    font-size: 10px;
    line-height: 1.6;
  }

  .loadingPage,
  .accessPage {
    min-height: 100vh;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: #f5f8fd;
  }

  .loadingMark {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    background: linear-gradient(145deg, #2875ef, #1646a9);
    color: #fff;
    font-size: 26px;
    font-weight: 800;
  }

  .loadingPage h2 {
    margin: 20px 0 7px;
    color: #1b3150;
    font-size: 19px;
  }

  .loadingPage p {
    color: #7889a0;
    font-size: 13px;
    line-height: 1.6;
  }

  .accessCard {
    width: 100%;
    max-width: 440px;
    padding: 34px;
    border: 1px solid #e2eaf4;
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 12px 35px rgba(27, 59, 105, 0.06);
  }

  .accessCard .brandMark {
    margin: 0 auto 20px;
  }

  .accessCard .eyebrow {
    margin-bottom: 10px;
  }

  .accessCard h1 {
    margin: 0;
    color: #1b3150;
    font-size: 23px;
    line-height: 1.35;
  }

  .accessCard > p:not(.eyebrow) {
    color: #74849a;
    font-size: 13px;
    line-height: 1.7;
    margin: 12px 0 22px;
  }

  .primaryButton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 43px;
    padding: 0 18px;
    border-radius: 10px;
    color: #fff;
    background: #235fc2;
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
  }

  @media (max-width: 760px) {
    .topbar {
      padding: 13px 4.5%;
    }

    .topActions {
      gap: 9px;
    }

    .adminLabel {
      display: none;
    }

    .content {
      width: 92%;
      padding-top: 20px;
    }

    .hero {
      align-items: flex-start;
      flex-direction: column;
      gap: 17px;
    }

    .hero p {
      font-size: 13px;
    }

    .stats {
      gap: 9px;
    }

    .statCard {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
      padding: 13px;
      border-radius: 12px;
    }

    .statIcon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      font-size: 20px;
    }

    .statText strong {
      font-size: 24px;
    }

    .statText small {
      font-size: 10px;
      line-height: 1.4;
    }

    .statText > span {
      font-size: 9px;
      line-height: 1.4;
    }

    .requestsSection {
      padding: 15px;
      border-radius: 14px;
    }

    .sectionHeading h2 {
      font-size: 17px;
    }

    .sectionHeading p {
      font-size: 11px;
    }

    .toolbar {
      grid-template-columns: 1fr;
      gap: 9px;
    }

    .filterSelect {
      height: 42px;
    }

    .requestCard {
      padding: 14px;
    }

    .requestTop {
      gap: 8px;
    }

    .companyIdentity {
      gap: 9px;
    }

    .companyLogo,
    .companyLogoFallback {
      width: 40px;
      height: 40px;
      border-radius: 10px;
    }

    .companyDetails h3 {
      font-size: 13px;
    }

    .companyEmail {
      font-size: 10px;
    }

    .amount {
      font-size: 17px;
    }

    .statusBadge {
      padding: 5px 7px;
      font-size: 9px;
    }

    .detailsGrid {
      gap: 15px 12px;
      padding: 16px 0;
      margin-top: 15px;
    }

    .detailItem > span {
      font-size: 9px;
    }

    .detailItem strong {
      font-size: 11px;
    }

    .requestFooter {
      align-items: stretch;
      flex-direction: column;
      gap: 12px;
    }

    .proofButton {
      align-self: flex-start;
    }

    .reviewActions {
      display: grid;
      grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr);
      width: 100%;
      gap: 8px;
    }

    .rejectButton,
    .approveButton {
      width: 100%;
      min-width: 0;
      padding: 0 7px;
      font-size: 10px;
      white-space: normal;
    }

    .reviewedLabel {
      align-self: flex-start;
    }

    .pageFooter {
      flex-direction: column;
      gap: 5px;
    }
  }

  @media (max-width: 380px) {
    .brandWords strong {
      font-size: 14px;
    }

    .brandMark {
      width: 38px;
      height: 38px;
    }

    .signOutButton {
      padding: 9px 10px;
      font-size: 11px;
    }

    .stats {
      gap: 6px;
    }

    .statCard {
      padding: 10px;
    }

    .statText > span {
      display: none;
    }

    .companyLogo,
    .companyLogoFallback {
      width: 34px;
      height: 34px;
    }

    .companyIdentity {
      gap: 7px;
    }

    .amount {
      font-size: 15px;
    }

    .statusBadge {
      font-size: 8px;
    }
  }
`;