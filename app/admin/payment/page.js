"use client";

import { useCallback, useEffect, useState } from "react";
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

  const loadRequests = useCallback(async () => {
    setError("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData?.user) {
      router.replace("/login");
      return;
    }

    const { data: adminRecord, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (adminError || !adminRecord) {
      setAuthorized(false);
      setLoading(false);
      setError(
        "Administrator access required. Sign in using your registered administrator account."
      );
      return;
    }

    setAuthorized(true);

    const { data, error: requestsError } = await supabase
      .from("payment_requests")
      .select(
        "id, company_id, subscription_id, payment_amount, payment_reference, proof_path, status, submitted_at, reviewed_at, created_at"
      )
      .order("submitted_at", { ascending: false });

    if (requestsError) {
      setError(
        "Could not load payment requests. Please check your Supabase permissions and try again."
      );
      setRequests([]);
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function reviewPayment(request, decision) {
    const isApproval = decision === "approve";

    const confirmed = window.confirm(
      isApproval
        ? "Have you verified in your Capitec Business account that this payment has arrived and the amount is correct? Only approve verified payments."
        : "Are you sure you want to reject this payment request?"
    );

    if (!confirmed) return;

    setProcessingId(request.id);
    setError("");
    setMessage("");

    const { data, error: reviewError } = await supabase.rpc(
      "admin_review_payment_request",
      {
        p_payment_request_id: request.id,
        p_decision: decision,
      }
    );

    setProcessingId(null);

    if (reviewError) {
      setError(reviewError.message || "The payment review failed.");
      return;
    }

    if (!data?.success) {
      setError(data?.message || "The payment review was not completed.");
      return;
    }

    setMessage(
      isApproval
        ? "Payment approved. The associated subscription has been activated."
        : "Payment request rejected. The subscription has not been activated."
    );

    await loadRequests();
  }

  async function openProof(path) {
    if (!path) {
      setError("No proof-of-payment file was provided.");
      return;
    }

    setError("");

    const { data, error: proofError } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, 600);

    if (proofError || !data?.signedUrl) {
      setError(
        "Could not open the proof. Confirm the payment-proofs bucket exists and administrator read access is configured."
      );
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const filteredRequests = requests.filter((request) => {
    if (filter === "all") return true;
    return (request.status || "").toLowerCase() === filter;
  });

  const pendingCount = requests.filter(
    (request) => (request.status || "").toLowerCase() === "pending"
  ).length;

  const approvedCount = requests.filter(
    (request) => (request.status || "").toLowerCase() === "approved"
  ).length;

  const rejectedCount = requests.filter(
    (request) => (request.status || "").toLowerCase() === "rejected"
  ).length;

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-loading">Loading GradLink SA Admin…</div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="admin-page">
        <section className="access-card">
          <div className="brand-mark">GL</div>
          <p className="eyebrow">GRADLINK SA</p>
          <h1>Administrator access</h1>
          <p className="muted">
            This area is restricted to authorized GradLink SA administrators.
          </p>

          {error && <div className="alert error">{error}</div>}

          <Link className="primary-button" href="/login">
            Sign in
          </Link>

          <Link className="back-link" href="/">
            Back to home
          </Link>
        </section>
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">GL</span>
          <span>
            <strong>GradLink SA</strong>
            <small>Administrator portal</small>
          </span>
        </Link>

        <button
          className="logout-button"
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
        >
          Sign out
        </button>
      </header>

      <div className="content">
        <div className="intro">
          <div>
            <p className="eyebrow">PAYMENT MANAGEMENT</p>
            <h1>Bank payment reviews</h1>
            <p className="muted">
              Verify incoming transfers before activating company subscriptions.
            </p>
          </div>

          <button className="refresh-button" onClick={loadRequests}>
            Refresh
          </button>
        </div>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <section className="stats">
          <button
            className={`stat ${filter === "pending" ? "selected" : ""}`}
            onClick={() => setFilter("pending")}
          >
            <span>Awaiting review</span>
            <strong>{pendingCount}</strong>
          </button>

          <button
            className={`stat ${filter === "approved" ? "selected" : ""}`}
            onClick={() => setFilter("approved")}
          >
            <span>Approved</span>
            <strong>{approvedCount}</strong>
          </button>

          <button
            className={`stat ${filter === "rejected" ? "selected" : ""}`}
            onClick={() => setFilter("rejected")}
          >
            <span>Rejected</span>
            <strong>{rejectedCount}</strong>
          </button>
        </section>

        <section className="list-section">
          <div className="section-heading">
            <div>
              <h2>Payment requests</h2>
              <p className="muted">
                Review the payment details and proof before making a decision.
              </p>
            </div>

            <select
              aria-label="Filter payment requests"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All requests</option>
            </select>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <h3>No payment requests here</h3>
              <p className="muted">
                Requests matching this filter will appear here after companies
                submit payment details.
              </p>
            </div>
          ) : (
            <div className="request-list">
              {filteredRequests.map((request) => {
                const status = (request.status || "pending").toLowerCase();
                const isPending = status === "pending";

                return (
                  <article className="request-card" key={request.id}>
                    <div className="request-header">
                      <div>
                        <p className="request-number">
                          PAYMENT REQUEST #{request.id}
                        </p>
                        <h3>
                          R
                          {Number(request.payment_amount || 0).toLocaleString(
                            "en-ZA"
                          )}
                        </h3>
                      </div>

                      <span className={`status ${status}`}>{status}</span>
                    </div>

                    <div className="details">
                      <div>
                        <span>Company account ID</span>
                        <strong className="break-text">
                          {request.company_id}
                        </strong>
                      </div>

                      <div>
                        <span>Subscription ID</span>
                        <strong>{request.subscription_id}</strong>
                      </div>

                      <div>
                        <span>Bank reference</span>
                        <strong className="break-text">
                          {request.payment_reference || "Not supplied"}
                        </strong>
                      </div>

                      <div>
                        <span>Submitted</span>
                        <strong>
                          {request.submitted_at
                            ? new Date(request.submitted_at).toLocaleString(
                                "en-ZA"
                              )
                            : "Not recorded"}
                        </strong>
                      </div>

                      {request.reviewed_at && (
                        <div>
                          <span>Reviewed</span>
                          <strong>
                            {new Date(request.reviewed_at).toLocaleString(
                              "en-ZA"
                            )}
                          </strong>
                        </div>
                      )}
                    </div>

                    <button
                      className="proof-button"
                      onClick={() => openProof(request.proof_path)}
                    >
                      View proof of payment ↗
                    </button>

                    {isPending && (
                      <div className="actions">
                        <button
                          className="reject-button"
                          disabled={processingId === request.id}
                          onClick={() => reviewPayment(request, "reject")}
                        >
                          Reject
                        </button>

                        <button
                          className="approve-button"
                          disabled={processingId === request.id}
                          onClick={() => reviewPayment(request, "approve")}
                        >
                          {processingId === request.id
                            ? "Processing…"
                            : "Approve payment"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="admin-footer">
          <span>GradLink SA</span>
          <span>Manual bank verification enabled</span>
        </footer>
      </div>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  .admin-page {
    min-height: 100vh;
    background: #f4f7fc;
    color: #142744;
    font-family: Arial, Helvetica, sans-serif;
  }

  .topbar {
    min-height: 74px;
    padding: 14px max(18px, calc((100% - 1120px) / 2));
    background: #ffffff;
    border-bottom: 1px solid #e5ebf4;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 11px;
    color: #142744;
    text-decoration: none;
  }

  .brand-mark {
    width: 43px;
    height: 43px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    border-radius: 13px;
    background: #155eef;
    color: white;
    font-weight: 800;
    letter-spacing: -1px;
  }

  .brand strong, .brand small {
    display: block;
  }

  .brand strong { font-size: 15px; }
  .brand small { margin-top: 4px; color: #72819a; font-size: 12px; }

  .logout-button, .refresh-button {
    border: 1px solid #dbe4f0;
    background: white;
    color: #334663;
    padding: 10px 14px;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
  }

  .content {
    width: min(100% - 32px, 1120px);
    margin: 0 auto;
    padding: 34px 0 24px;
  }

  .intro {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 26px;
  }

  .eyebrow {
    margin: 0 0 9px;
    color: #155eef;
    font-size: 11px;
    letter-spacing: 1.5px;
    font-weight: 800;
  }

  h1 {
    margin: 0;
    font-size: clamp(25px, 4vw, 34px);
    letter-spacing: -1px;
  }

  .muted {
    color: #71809a;
    line-height: 1.6;
    font-size: 14px;
  }

  .intro .muted { max-width: 570px; }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 28px;
  }

  .stat {
    min-width: 0;
    padding: 20px;
    text-align: left;
    background: white;
    border: 1px solid #e3eaf4;
    border-radius: 16px;
    cursor: pointer;
  }

  .stat.selected {
    border-color: #155eef;
    box-shadow: 0 0 0 2px #155eef12;
  }

  .stat span, .stat strong { display: block; }
  .stat span { color: #71809a; font-size: 13px; }
  .stat strong { margin-top: 10px; font-size: 30px; }

  .list-section {
    background: white;
    border: 1px solid #e3eaf4;
    border-radius: 18px;
    padding: 24px;
  }

  .section-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
  }

  .section-heading h2 { margin: 0; font-size: 20px; }
  .section-heading p { margin-bottom: 0; }

  select {
    max-width: 100%;
    border: 1px solid #dbe4f0;
    border-radius: 9px;
    background: white;
    padding: 10px;
    color: #243954;
  }

  .request-list {
    display: grid;
    gap: 16px;
  }

  .request-card {
    border: 1px solid #e3eaf4;
    border-radius: 15px;
    padding: 20px;
    min-width: 0;
  }

  .request-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid #edf1f7;
  }

  .request-number {
    margin: 0 0 9px;
    font-size: 10px;
    letter-spacing: 1px;
    font-weight: 800;
    color: #71809a;
  }

  .request-header h3 {
    margin: 0;
    font-size: 27px;
    letter-spacing: -0.5px;
  }

  .status {
    flex-shrink: 0;
    border-radius: 999px;
    padding: 7px 10px;
    background: #edf1f7;
    color: #53647d;
    font-size: 11px;
    font-weight: 800;
    text-transform: capitalize;
  }

  .status.pending { background: #fff4d9; color: #8b5b00; }
  .status.approved { background: #e2f8ec; color: #14733c; }
  .status.rejected { background: #ffe8e8; color: #a62d2d; }

  .details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 17px;
    padding: 20px 0;
  }

  .details div { min-width: 0; }

  .details span, .details strong { display: block; }
  .details span { margin-bottom: 6px; color: #71809a; font-size: 12px; }
  .details strong { font-size: 13px; line-height: 1.5; }
  .break-text { overflow-wrap: anywhere; }

  .proof-button {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid #cddcf7;
    background: #f5f8ff;
    color: #155eef;
    font-weight: 800;
    cursor: pointer;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1.6fr;
    gap: 10px;
    margin-top: 12px;
  }

  .actions button {
    min-width: 0;
    padding: 13px 10px;
    border-radius: 10px;
    font-weight: 800;
    cursor: pointer;
  }

  .actions button:disabled { opacity: 0.6; cursor: wait; }

  .reject-button {
    border: 1px solid #f0caca;
    background: white;
    color: #a62d2d;
  }

  .approve-button, .primary-button {
    border: 0;
    background: #155eef;
    color: white;
  }

  .empty-state {
    text-align: center;
    padding: 45px 16px;
    border: 1px dashed #d6e0ee;
    border-radius: 14px;
  }

  .empty-icon {
    width: 46px;
    height: 46px;
    margin: 0 auto 14px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #e8f7ee;
    color: #14733c;
    font-size: 22px;
    font-weight: 800;
  }

  .empty-state h3 { margin: 0; }
  .empty-state p { max-width: 400px; margin: 10px auto 0; }

  .admin-footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 23px 4px;
    color: #8290a5;
    font-size: 12px;
  }

  .alert {
    padding: 13px 15px;
    margin-bottom: 18px;
    border-radius: 11px;
    font-size: 13px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .alert.success { background: #e7f8ee; color: #176c3b; }
  .alert.error { background: #fff0f0; color: #a62d2d; }

  .access-card {
    width: min(100% - 32px, 430px);
    margin: 12vh auto 0;
    padding: 30px;
    background: white;
    border: 1px solid #e3eaf4;
    border-radius: 20px;
    box-shadow: 0 15px 50px #16335c0d;
  }

  .access-card .brand-mark { margin-bottom: 22px; }
  .access-card h1 { font-size: 27px; }
  .primary-button {
    display: block;
    padding: 13px;
    text-align: center;
    text-decoration: none;
    border-radius: 10px;
    font-weight: 800;
  }

  .back-link {
    display: block;
    margin-top: 18px;
    color: #155eef;
    text-align: center;
    text-decoration: none;
    font-size: 13px;
  }

  .admin-loading {
    padding: 80px 20px;
    text-align: center;
    color: #71809a;
  }

  @media (max-width: 600px) {
    .topbar { min-height: 68px; padding: 12px 16px; }
    .content { width: calc(100% - 24px); padding-top: 25px; }
    .intro { align-items: flex-start; }
    .intro h1 { font-size: 27px; }
    .intro .muted { font-size: 13px; }
    .refresh-button { padding: 10px; }
    .stats { gap: 8px; }
    .stat { padding: 13px 11px; border-radius: 12px; }
    .stat span { font-size: 11px; line-height: 1.4; }
    .stat strong { font-size: 25px; }
    .list-section { padding: 15px; border-radius: 15px; }
    .section-heading { flex-direction: column; }
    .section-heading select { width: 100%; }
    .request-card { padding: 15px; }
    .request-header h3 { font-size: 24px; }
    .details { gap: 15px 12px; }
    .details strong { font-size: 12px; }
    .actions { grid-template-columns: 1fr 1.4fr; }
    .actions button { font-size: 12px; }
    .admin-footer { flex-direction: column; }
  }
`;
