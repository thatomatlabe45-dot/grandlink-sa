"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PLAN_DETAILS = {
  starter: { name: "Starter", monthly: 500, annual: 5000, cycle: "monthly" },
  professional: { name: "Professional", monthly: 1000, annual: 10000, cycle: "monthly" },
  listing: { name: "Pay Per Listing", monthly: 350, annual: 350, cycle: "listing" },
};

function money(value) {
  return new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(value);
}

export default function CompanyPaymentPage() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [reference, setReference] = useState("");
  const [proof, setProof] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPayment() {
      try {
        const params = new URLSearchParams(window.location.search);
        const subscriptionId = params.get("subscription");
        const requestedPlan = params.get("plan");
        const requestedBilling = params.get("billing") || "monthly";
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!currentUser) {
          window.location.replace("/login?redirect=/company/payment");
          return;
        }
        if (!subscriptionId || !/^\d+$/.test(subscriptionId)) {
          throw new Error("The payment request is missing or invalid. Please choose a plan again.");
        }

        const { data, error: subError } = await supabase
          .from("company_subscriptions")
          .select("id, company_id, plan, status, monthly_price, created_at")
          .eq("id", subscriptionId)
          .eq("company_id", currentUser.id)
          .maybeSingle();
        if (subError) throw subError;
        if (!data) throw new Error("We could not find this payment request for your account.");
        if (String(data.status || "").toLowerCase() !== "pending") {
          throw new Error("This subscription is not awaiting payment. Please return to your company pricing page.");
        }
        if (!PLAN_DETAILS[data.plan]) throw new Error("This plan is not recognised. Please choose a plan again.");
        if (requestedPlan && requestedPlan !== data.plan) throw new Error("The selected plan does not match this payment request. Please choose a plan again.");
        if (!["monthly", "annual", "listing"].includes(requestedBilling)) throw new Error("The billing option is invalid. Please choose a plan again.");
        if (data.plan === "listing" && requestedBilling !== "listing") throw new Error("Please restart the Pay Per Listing checkout.");
        if (data.plan !== "listing" && requestedBilling === "listing") throw new Error("Please choose monthly or annual billing.");
        data.billing_cycle = requestedBilling;
        data.payment_amount = data.plan === "listing" ? PLAN_DETAILS.listing.monthly : requestedBilling === "annual" ? PLAN_DETAILS[data.plan].annual : PLAN_DETAILS[data.plan].monthly;
        if (active) {
          setUser(currentUser);
          setSubscription(data);
        }
      } catch (e) {
        if (active) setError(e?.message || "Unable to load your payment details.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPayment();
    return () => { active = false; };
  }, []);

  async function submitPayment(e) {
    e.preventDefault();
    setError("");
    if (!user || !subscription) return;
    if (!reference.trim()) {
      setError("Enter the payment reference shown by your bank.");
      return;
    }
    if (!proof) {
      setError("Please attach your proof of payment.");
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(proof.type)) {
      setError("Upload a PDF, JPG or PNG file.");
      return;
    }
    if (proof.size > 5 * 1024 * 1024) {
      setError("Your proof of payment must be 5 MB or smaller.");
      return;
    }

    setSending(true);
    try {
      const extension = proof.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
      const path = `${user.id}/${subscription.id}-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, proof, { upsert: false, contentType: proof.type });
      if (uploadError) throw uploadError;

      const { error: requestError } = await supabase
        .from("payment_requests")
        .insert({
          company_id: user.id,
          subscription_id: subscription.id,
          payment_amount: Number(subscription.payment_amount),
          payment_reference: reference.trim(),
          proof_path: path,
          status: "pending",
        });
      if (requestError) {
        // Best-effort cleanup if the database insert did not succeed.
        await supabase.storage.from("payment-proofs").remove([path]);
        throw requestError;
      }
      setSuccess(true);
    } catch (e) {
      console.error("Payment submission failed:", e);
      setError(e?.message || "We could not submit your payment. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const plan = subscription ? PLAN_DETAILS[subscription.plan] : null;
  const amount = subscription?.payment_amount ?? (plan ? (subscription?.billing_cycle === "annual" ? plan.annual : plan.monthly) : 0);
  const billingLabel = subscription?.billing_cycle === "annual" ? "per year" : subscription?.billing_cycle === "listing" ? "once-off · 30 days" : "per month";

  return (
    <main className="page">
      <style jsx>{`
        * { box-sizing: border-box; }
        .page { min-height: 100vh; background: #f4f8ff; color: #13233f; padding: 28px 16px 54px; }
        .wrap { max-width: 850px; margin: 0 auto; }
        .top { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:26px; }
        .brand { font-weight:900; font-size:20px; letter-spacing:-.5px; color:#1455c0; text-decoration:none; }
        .back { color:#2454a6; font-weight:700; text-decoration:none; font-size:14px; }
        .hero { margin-bottom:22px; }
        .eyebrow { color:#2762c4; font-size:11px; font-weight:900; letter-spacing:1.6px; text-transform:uppercase; }
        h1 { font-size:clamp(28px, 5vw, 42px); line-height:1.1; letter-spacing:-1.3px; margin:10px 0; }
        .intro { color:#60718b; line-height:1.7; max-width:620px; margin:0; }
        .grid { display:grid; grid-template-columns: .9fr 1.1fr; gap:18px; align-items:start; }
        .card { background:white; border:1px solid #e0e9f7; border-radius:20px; padding:22px; box-shadow:0 12px 34px rgba(25,65,125,.06); min-width:0; }
        h2 { margin:0 0 15px; font-size:18px; letter-spacing:-.3px; }
        .amount { font-size:36px; font-weight:900; color:#1554be; letter-spacing:-1px; }
        .period { color:#73819a; font-size:13px; margin-left:5px; }
        .planname { font-size:14px; font-weight:800; margin-bottom:7px; }
        .line { display:flex; justify-content:space-between; gap:14px; padding:12px 0; border-bottom:1px solid #edf1f7; color:#63718a; font-size:13px; }
        .line strong { color:#1c2e4a; text-align:right; }
        .note { background:#f0f6ff; border:1px solid #d9e8ff; border-radius:13px; padding:13px; margin-top:16px; color:#435b7c; font-size:12px; line-height:1.6; }
        .bankrow { padding:12px 0; border-bottom:1px solid #edf1f7; }
        .banklabel { color:#7b8aa1; font-size:11px; font-weight:800; letter-spacing:.6px; text-transform:uppercase; margin-bottom:5px; }
        .bankvalue { font-size:15px; font-weight:800; overflow-wrap:anywhere; }
        .placeholder { color:#9a5a13; }
        label { display:block; color:#334763; font-size:13px; font-weight:800; margin:16px 0 7px; }
        input[type=text], input[type=file] { width:100%; border:1px solid #d7e1f0; border-radius:11px; background:#fff; padding:13px; color:#1b2d48; font:inherit; font-size:14px; }
        input[type=file] { padding:10px; }
        .hint { color:#8290a5; font-size:12px; line-height:1.5; margin-top:7px; }
        .button { width:100%; border:0; border-radius:12px; background:#1554be; color:#fff; padding:15px 16px; font-weight:900; font-size:14px; margin-top:19px; cursor:pointer; }
        .button:disabled { opacity:.6; cursor:not-allowed; }
        .error { margin:0 0 16px; padding:12px 14px; border-radius:11px; background:#fff0f0; color:#a32626; font-size:13px; line-height:1.5; overflow-wrap:anywhere; }
        .success { text-align:center; padding:20px 4px 8px; }
        .successmark { width:52px; height:52px; margin:0 auto 14px; border-radius:50%; display:grid; place-items:center; background:#e2f8eb; color:#167744; font-size:25px; font-weight:900; }
        .small { color:#6d7b91; font-size:13px; line-height:1.7; }
        .footer { text-align:center; color:#8390a4; font-size:12px; margin-top:22px; }
        @media(max-width:680px) { .grid { grid-template-columns:1fr; } .page { padding:20px 13px 40px; } .card { padding:18px; border-radius:17px; } .top { margin-bottom:22px; } }
      `}</style>

      <div className="wrap">
        <header className="top">
          <Link className="brand" href="/">GradLink SA</Link>
          <Link className="back" href="/company-pricing">← Back to plans</Link>
        </header>

        <section className="hero">
          <div className="eyebrow">Company billing</div>
          <h1>Complete your bank transfer</h1>
          <p className="intro">Use the details below to make payment, then submit your bank reference and proof. Your plan stays pending until GradLink SA verifies that the funds have arrived.</p>
        </section>

        {error && <div className="error" role="alert">{error}</div>}

        {loading ? (
          <section className="card"><p className="small">Loading your secure payment request…</p></section>
        ) : success ? (
          <section className="card success">
            <div className="successmark">✓</div>
            <h2>Payment details submitted</h2>
            <p className="small">Thank you. Your payment request is now pending review. Your plan will activate only after we confirm the payment in the business account.</p>
            <Link className="back" href="/company-dashboard">Return to company dashboard →</Link>
          </section>
        ) : subscription && plan ? (
          <div className="grid">
            <section className="card">
              <h2>Your selected plan</h2>
              <div className="planname">{plan.name}</div>
              <div><span className="amount">R{money(amount)}</span><span className="period">{billingLabel}</span></div>
              <div className="line"><span>Payment reference</span><strong>Use your bank's reference</strong></div>
              <div className="line"><span>Subscription status</span><strong>Pending payment verification</strong></div>
              {subscription.plan === "listing" && <div className="note">Pay Per Listing includes one active listing for 30 days. It does not renew automatically.</div>}
              {subscription.billing_cycle === "annual" && <div className="note">Annual billing is paid once for 12 months, at the agreed discounted annual price.</div>}
            </section>

            <section className="card">
              <h2>Bank transfer details</h2>
              <div className="bankrow"><div className="banklabel">Account name</div><div className="bankvalue">GradLink SA</div></div>
              <div className="bankrow"><div className="banklabel">Bank</div><div className="bankvalue">Capitec Business</div></div>
              <div className="bankrow"><div className="banklabel">Account number</div><div className="bankvalue placeholder">2609988253</div></div>
              <div className="bankrow"><div className="banklabel">Account type</div><div className="bankvalue">Entrepreneur Business Account</div></div>
              <div className="note">Before launch, replace the highlighted account-number placeholder in this file with your confirmed business account number. Double-check all bank details in your Capitec app before accepting payments.</div>

              <form onSubmit={submitPayment}>
                <label htmlFor="reference">Bank payment reference</label>
                <input id="reference" type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Enter the reference from your transfer" maxLength={120} required />
                <label htmlFor="proof">Proof of payment</label>
                <input id="proof" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => setProof(e.target.files?.[0] || null)} required />
                <p className="hint">PDF, JPG or PNG · Maximum 5 MB. Upload a receipt or proof of transfer, not a full bank statement.</p>
                <button className="button" type="submit" disabled={sending}>{sending ? "Submitting payment details…" : "Submit proof of payment"}</button>
              </form>
            </section>
          </div>
        ) : (
          <section className="card"><h2>Payment request unavailable</h2><p className="small">Return to the pricing page and select a plan to create a new payment request.</p><Link className="back" href="/company-pricing">Choose a plan →</Link></section>
        )}
        <div className="footer">Manual bank payments · Plans activate only after verification</div>
      </div>
    </main>
  );
}