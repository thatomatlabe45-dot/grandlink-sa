"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PLAN_DETAILS = {
  starter: {
    name: "Starter",
    monthly: 500,
    annual: 5000,
  },
  professional: {
    name: "Professional",
    monthly: 1000,
    annual: 10000,
  },
  enterprise: {
    name: "Enterprise",
    monthly: 1500,
    annual: 15000,
  },
  listing: {
    name: "Pay Per Listing",
    monthly: 350,
    annual: 350,
  },
  pay_per_listing: {
    name: "Pay Per Listing",
    monthly: 350,
    annual: 350,
  },
};
function money(value) {
  return new Intl.NumberFormat("en-ZA", {
    maximumFractionDigits: 0,
  }).format(value);
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
        const params = new URLSearchParams(
          window.location.search
        );

        const subscriptionId = params.get("subscription");
        const requestedPlan = params.get("plan");
        const requestedBilling =
          params.get("billing") || "monthly";

        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!currentUser) {
          window.location.replace(
            "/login?redirect=/company/payment"
          );
          return;
        }

        if (
          !subscriptionId ||
          !/^\d+$/.test(subscriptionId)
        ) {
          throw new Error(
            "Your payment request is missing or invalid. Please choose a plan again."
          );
        }

        const { data, error: subError } = await supabase
          .from("company_subscriptions")
          .select(
            "id, company_id, plan, status, monthly_price, created_at"
          )
          .eq("id", subscriptionId)
          .eq("company_id", currentUser.id)
          .maybeSingle();

        if (subError) throw subError;

        if (!data) {
          throw new Error(
            "We could not find this payment request for your account."
          );
        }

        if (
          String(data.status || "").toLowerCase() !==
          "pending"
        ) {
          throw new Error(
            "This subscription is not awaiting payment. Please return to your company pricing page."
          );
        }

        if (!PLAN_DETAILS[data.plan]) {
          throw new Error(
            "This plan is not recognised. Please choose a plan again."
          );
        }

        if (
          requestedPlan &&
          requestedPlan !== data.plan
        ) {
          throw new Error(
            "The selected plan does not match this payment request. Please choose a plan again."
          );
        }

        if (
          !["monthly", "annual", "listing"].includes(
            requestedBilling
          )
        ) {
          throw new Error(
            "The billing option is invalid. Please choose a plan again."
          );
        }

        if (
          data.plan === "listing" &&
          requestedBilling !== "listing"
        ) {
          throw new Error(
            "Please restart the Pay Per Listing checkout."
          );
        }

        if (
          data.plan !== "listing" &&
          requestedBilling === "listing"
        ) {
          throw new Error(
            "Please choose monthly or annual billing."
          );
        }

        data.billing_cycle = requestedBilling;

        data.payment_amount =
          data.plan === "listing"
            ? PLAN_DETAILS.listing.monthly
            : requestedBilling === "annual"
            ? PLAN_DETAILS[data.plan].annual
            : PLAN_DETAILS[data.plan].monthly;

        if (active) {
          setUser(currentUser);
          setSubscription(data);
        }
      } catch (e) {
        if (active) {
          setError(
            e?.message ||
              "Unable to load your payment details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPayment();

    return () => {
      active = false;
    };
  }, []);

  async function submitPayment(e) {
    e.preventDefault();
    setError("");

    if (!user || !subscription) return;

    if (!reference.trim()) {
      setError(
        "Enter the payment reference shown by your bank."
      );
      return;
    }

    if (!proof) {
      setError("Please attach your proof of payment.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(proof.type)) {
      setError("Upload a PDF, JPG or PNG file.");
      return;
    }

    if (proof.size > 5 * 1024 * 1024) {
      setError(
        "Your proof of payment must be 5 MB or smaller."
      );
      return;
    }

    setSending(true);

    try {
      const extension =
        proof.name
          .split(".")
          .pop()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "") || "pdf";

      const path = `${user.id}/${subscription.id}-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, proof, {
          upsert: false,
          contentType: proof.type,
        });

      if (uploadError) throw uploadError;

      const { error: requestError } = await supabase
        .from("payment_requests")
        .insert({
          company_id: user.id,
          subscription_id: subscription.id,
          payment_amount: Number(
            subscription.payment_amount
          ),
          payment_reference: reference.trim(),
          proof_path: path,
          status: "pending",
        });

      if (requestError) {
        await supabase.storage
          .from("payment-proofs")
          .remove([path]);

        throw requestError;
      }

      setSuccess(true);
    } catch (e) {
      console.error(
        "Payment submission failed:",
        e
      );

      setError(
        e?.message ||
          "We could not submit your payment. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  const plan = subscription
    ? PLAN_DETAILS[subscription.plan]
    : null;

  const amount =
    subscription?.payment_amount ??
    (plan
      ? subscription?.billing_cycle === "annual"
        ? plan.annual
        : plan.monthly
      : 0);

  const billingLabel =
    subscription?.billing_cycle === "annual"
      ? "per year"
      : subscription?.billing_cycle === "listing"
      ? "once-off · 30 days"
      : "per month";

  return (
    <main className="page">
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          padding: 28px 18px 55px;
          background: #f3f6fc;
          color: #132544;
          font-family: Arial, Helvetica, sans-serif;
        }

        .wrap {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
        }

        /* TOP NAVIGATION */

        .top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 28px;
        }

        .brand {
          color: #1554be;
          font-size: 23px;
          font-weight: 900;
          letter-spacing: -0.9px;
          text-decoration: none;
        }

        .back {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: #2454a6;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .back:hover {
          color: #103c91;
        }

        /* PREMIUM BILLING HEADER */

        .hero {
          position: relative;
          overflow: hidden;
          margin-bottom: 24px;
          padding: 30px;
          border: 1px solid #dce7f8;
          border-radius: 24px;
          background: linear-gradient(
            125deg,
            #ffffff 0%,
            #f0f5ff 65%,
            #e8f0ff 100%
          );
          box-shadow: 0 15px 40px rgba(28, 64, 125, 0.08);
        }

        .hero::before {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 5px;
          background: linear-gradient(
            180deg,
            #60a5fa,
            #1554be
          );
          content: "";
        }

        .hero::after {
          position: absolute;
          top: -100px;
          right: -80px;
          width: 240px;
          height: 240px;
          border: 35px solid rgba(59, 130, 246, 0.045);
          border-radius: 50%;
          content: "";
          pointer-events: none;
        }

        .hero-topline {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .hero-icon {
          display: flex;
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border: 1px solid #cbdfff;
          border-radius: 14px;
          background: #e2ecff;
          color: #1554be;
          font-size: 21px;
          font-weight: 900;
        }

        .hero-label {
          color: #2454a6;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .hero h1 {
          position: relative;
          z-index: 1;
          margin: 0 0 14px;
          color: #102344;
          font-size: clamp(29px, 5vw, 42px);
          font-weight: 900;
          letter-spacing: -1.5px;
          line-height: 1.15;
          overflow-wrap: anywhere;
        }

        .hero-description {
          position: relative;
          z-index: 1;
          max-width: 660px;
          margin: 0;
          color: #50617b;
          font-size: 14px;
          line-height: 1.9;
          overflow-wrap: anywhere;
        }

        .hero-bottom {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 22px;
          padding-top: 17px;
          border-top: 1px solid #dce6f5;
          color: #31558b;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.6;
        }

        .hero-bottom-icon {
          display: flex;
          width: 25px;
          height: 25px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #dceaff;
          color: #1554be;
          font-size: 13px;
          font-weight: 900;
        }

        /* MAIN LAYOUT */

        .grid {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          align-items: start;
          gap: 20px;
        }

        .card {
          min-width: 0;
          padding: 25px;
          border: 1px solid #e0e8f5;
          border-radius: 21px;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(26, 54, 100, 0.055);
        }

        h2 {
          margin: 0 0 20px;
          color: #152847;
          font-size: 19px;
          font-weight: 900;
          letter-spacing: -0.5px;
          line-height: 1.4;
        }

        .section-subtitle {
          margin: -11px 0 20px;
          color: #77869d;
          font-size: 12px;
          line-height: 1.7;
        }

        /* PLAN SUMMARY */

        .planbox {
          margin-bottom: 19px;
          padding: 17px;
          border: 1px solid #dbe7fb;
          border-radius: 16px;
          background: linear-gradient(
            145deg,
            #f6f9ff,
            #edf4ff
          );
        }

        .planname {
          margin-bottom: 8px;
          color: #435a7b;
          font-size: 13px;
          font-weight: 800;
        }

        .price-row {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 4px;
        }

        .amount {
          color: #1554be;
          font-size: clamp(31px, 4vw, 39px);
          font-weight: 900;
          letter-spacing: -1.3px;
          overflow-wrap: anywhere;
        }

        .period {
          color: #77869d;
          font-size: 12px;
          font-weight: 600;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 14px;
          padding: 8px 11px;
          border: 1px solid #f4dfad;
          border-radius: 30px;
          background: #fff8e8;
          color: #95600b;
          font-size: 10px;
          font-weight: 900;
          line-height: 1.5;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #e6a323;
        }

        .line {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #edf1f7;
          color: #748198;
          font-size: 12px;
          line-height: 1.7;
        }

        .line strong {
          max-width: 60%;
          color: #253954;
          font-size: 12px;
          font-weight: 800;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .note {
          margin-top: 17px;
          padding: 14px;
          border: 1px solid #dce8fb;
          border-radius: 13px;
          background: #f3f7ff;
          color: #526783;
          font-size: 12px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        /* BANK DETAILS */

        .bankrow {
          padding: 13px 0;
          border-bottom: 1px solid #edf1f7;
        }

        .banklabel {
          margin-bottom: 6px;
          color: #7a879c;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .bankvalue {
          color: #192e4d;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .account-number {
          display: inline-block;
          padding: 7px 10px;
          border: 1px solid #d9e6fb;
          border-radius: 8px;
          background: #f2f6ff;
          color: #1554be;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.5px;
          overflow-wrap: anywhere;
        }

        /* PAYMENT FORM */

        .form-divider {
          height: 1px;
          margin: 23px 0 19px;
          background: #e8edf5;
        }

        .form-heading {
          margin-bottom: 7px;
          color: #192e4d;
          font-size: 16px;
          font-weight: 900;
        }

        .form-description {
          margin: 0 0 17px;
          color: #77869d;
          font-size: 12px;
          line-height: 1.8;
        }

        label {
          display: block;
          margin: 18px 0 8px;
          color: #344966;
          font-size: 12px;
          font-weight: 900;
        }

        .required {
          color: #dc4141;
        }

        input[type="text"] {
          display: block;
          width: 100%;
          min-width: 0;
          min-height: 49px;
          padding: 13px 14px;
          border: 1px solid #d6e0ef;
          border-radius: 11px;
          outline: none;
          background: #ffffff;
          color: #192e4d;
          font-family: inherit;
          font-size: 14px;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        input[type="text"]::placeholder {
          color: #a0aabc;
          font-size: 12px;
        }

        input[type="text"]:focus {
          border-color: #3778e8;
          box-shadow: 0 0 0 3px rgba(55, 120, 232, 0.12);
        }

        .uploadbox {
          padding: 14px;
          border: 1px dashed #b9cbea;
          border-radius: 13px;
          background: #f8faff;
          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .uploadbox:focus-within {
          border-color: #3778e8;
          background: #f2f7ff;
        }

        input[type="file"] {
          display: block;
          width: 100%;
          min-width: 0;
          color: #50617b;
          font-family: inherit;
          font-size: 12px;
          line-height: 1.8;
        }

        input[type="file"]::file-selector-button {
          margin-right: 10px;
          padding: 10px 12px;
          border: 1px solid #cbdcf8;
          border-radius: 8px;
          background: #eaf1ff;
          color: #174ca7;
          font-family: inherit;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .selected-file {
          margin-top: 9px;
          color: #285d43;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .hint {
          margin: 9px 0 0;
          color: #7b899e;
          font-size: 11px;
          line-height: 1.8;
        }

        /* BUTTONS */

        .button {
          display: flex;
          width: 100%;
          min-height: 52px;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-top: 22px;
          padding: 15px 18px;
          border: 1px solid #1554be;
          border-radius: 12px;
          background: linear-gradient(
            135deg,
            #2869d6,
            #1549ac
          );
          box-shadow: 0 7px 16px rgba(21, 84, 190, 0.19);
          color: #ffffff;
          font-family: inherit;
          font-size: 13px;
          font-weight: 900;
          text-align: center;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .button:hover:not(:disabled) {
          transform: translateY(-1px);
          background: linear-gradient(
            135deg,
            #1d5dc5,
            #103e98
          );
          box-shadow: 0 10px 22px rgba(21, 84, 190, 0.24);
        }

        .button:active:not(:disabled) {
          transform: translateY(0);
        }

        .button:focus-visible,
        .secondary-button:focus-visible {
          outline: 3px solid #9cc0ff;
          outline-offset: 3px;
        }

        .button:disabled {
          opacity: 0.65;
          box-shadow: none;
          cursor: not-allowed;
        }

        .secondary-button {
          display: inline-flex;
          min-height: 45px;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 20px;
          padding: 12px 17px;
          border: 1px solid #d4e1f5;
          border-radius: 11px;
          background: #ffffff;
          color: #2054a6;
          font-size: 12px;
          font-weight: 900;
          text-decoration: none;
          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .secondary-button:hover {
          border-color: #a9c5f5;
          background: #f3f7ff;
        }

        /* MESSAGES */

        .error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 19px;
          padding: 15px;
          border: 1px solid #f2caca;
          border-radius: 13px;
          background: #fff3f3;
          color: #a32727;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .error-icon {
          display: flex;
          width: 23px;
          height: 23px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #ffe1e1;
          font-weight: 900;
        }

        .success {
          padding: 36px 25px;
          text-align: center;
        }

        .successmark {
          display: flex;
          width: 66px;
          height: 66px;
          align-items: center;
          justify-content: center;
          margin: 0 auto 19px;
          border: 1px solid #bde8cd;
          border-radius: 50%;
          background: #e6f8ed;
          color: #18804b;
          font-size: 29px;
          font-weight: 900;
        }

        .success h2 {
          margin-bottom: 10px;
          font-size: 23px;
        }

        .success .small {
          max-width: 470px;
          margin: 0 auto;
        }

        .small {
          color: #64748b;
          font-size: 13px;
          line-height: 1.9;
          overflow-wrap: anywhere;
        }

        .loading-indicator {
          display: inline-block;
          width: 19px;
          height: 19px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .footer {
          margin-top: 27px;
          color: #8491a5;
          font-size: 11px;
          line-height: 1.9;
          text-align: center;
        }

        .footer strong {
          color: #5e708b;
        }

        /* MOBILE */

        @media (max-width: 700px) {
          .page {
            padding: 17px 12px 35px;
          }

          .top {
            margin-bottom: 20px;
          }

          .brand {
            font-size: 19px;
          }

          .back {
            font-size: 11px;
          }

          .hero {
            margin-bottom: 17px;
            padding: 21px 17px 18px;
            border-radius: 19px;
          }

          .hero-topline {
            gap: 10px;
            margin-bottom: 16px;
          }

          .hero-icon {
            width: 39px;
            height: 39px;
            border-radius: 12px;
            font-size: 19px;
          }

          .hero-label {
            font-size: 10px;
            letter-spacing: 1.5px;
          }

          .hero h1 {
            margin-bottom: 12px;
            font-size: 29px;
            letter-spacing: -0.8px;
            line-height: 1.22;
          }

          .hero-description {
            font-size: 13px;
            line-height: 1.85;
          }

          .hero-bottom {
            align-items: flex-start;
            gap: 8px;
            margin-top: 16px;
            padding-top: 14px;
            font-size: 11px;
          }

          .grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 15px;
          }

          .card {
            padding: 20px 17px;
            border-radius: 17px;
          }

          h2 {
            font-size: 18px;
          }

          .amount {
            font-size: 34px;
          }

          .bankvalue {
            font-size: 14px;
          }

          .button {
            min-height: 52px;
            font-size: 13px;
          }

          .footer {
            margin-top: 22px;
          }
        }

        @media (max-width: 360px) {
          .page {
            padding-right: 10px;
            padding-left: 10px;
          }

          .top {
            gap: 8px;
          }

          .brand {
            font-size: 17px;
          }

          .back {
            font-size: 10px;
          }

          .hero {
            padding: 18px 14px;
          }

          .hero h1 {
            font-size: 26px;
          }

          .card {
            padding: 16px 14px;
          }

          .amount {
            font-size: 30px;
          }

          .account-number {
            font-size: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="wrap">
        {/* NAVIGATION */}

        <header className="top">
          <Link className="brand" href="/">
            GradLink SA
          </Link>

          <Link
            className="back"
            href="/company-pricing"
          >
            ← Back to plans
          </Link>
        </header>

        {/* BILLING HERO */}

        <section className="hero">
          <div className="hero-topline">
            <div className="hero-icon" aria-hidden="true">
              R
            </div>

            <div className="hero-label">
              Company Billing
            </div>
          </div>

          <h1>Complete your bank transfer</h1>

          <p className="hero-description">
            You're one step closer to getting your company
            in front of South African graduates. Transfer
            the amount shown below, then submit your bank
            reference and proof of payment. Your plan stays
            pending until GradLink SA verifies receipt of
            your funds.
          </p>

          <div className="hero-bottom">
            <span
              className="hero-bottom-icon"
              aria-hidden="true"
            >
              ✓
            </span>

            <span>
              Secure proof submission · Manual payment
              verification before activation
            </span>
          </div>
        </section>

        {/* ERROR MESSAGE */}

        {error && (
          <div className="error" role="alert">
            <span className="error-icon" aria-hidden="true">
              !
            </span>

            <span>{error}</span>
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <section className="card">
            <p className="small">
              Loading your payment request. Please wait…
            </p>
          </section>
        ) : success ? (
          /* SUCCESS */

          <section className="card success">
            <div className="successmark" aria-hidden="true">
              ✓
            </div>

            <h2>Payment proof submitted!</h2>

            <p className="small">
              Thank you for submitting your payment details.
              Your request is now awaiting review. Your
              subscription will activate only after GradLink
              SA confirms that the funds have arrived in the
              business account.
            </p>

            <Link
              className="secondary-button"
              href="/company-dashboard"
            >
              Return to company dashboard →
            </Link>
          </section>
        ) : subscription && plan ? (
          /* PAYMENT CONTENT */

          <div className="grid">
            {/* PLAN SUMMARY */}

            <section className="card">
              <h2>Your selected plan</h2>

              <div className="planbox">
                <div className="planname">
                  {plan.name}
                </div>

                <div className="price-row">
                  <span className="amount">
                    R{money(amount)}
                  </span>

                  <span className="period">
                    {billingLabel}
                  </span>
                </div>

                <div className="status">
                  <span className="status-dot" />
                  Awaiting payment verification
                </div>
              </div>

              <div className="line">
                <span>Payment reference</span>

                <strong>
                  Your bank transfer reference
                </strong>
              </div>

              <div className="line">
                <span>Subscription status</span>

                <strong>Pending</strong>
              </div>

              <div className="line">
                <span>Activation</span>

                <strong>After payment verification</strong>
              </div>

              {subscription.plan === "listing" && (
                <div className="note">
                  <strong>Pay Per Listing:</strong> Your
                  purchase includes one active listing for
                  30 days. It does not renew automatically.
                </div>
              )}

              {subscription.billing_cycle === "annual" && (
                <div className="note">
                  <strong>Annual billing:</strong> Pay once
                  for 12 months at the agreed discounted
                  annual price.
                </div>
              )}

              <Link
                className="secondary-button"
                href="/company-pricing"
              >
                ← View other plans
              </Link>
            </section>

            {/* BANK DETAILS AND FORM */}

            <section className="card">
              <h2>Bank transfer details</h2>

              <p className="section-subtitle">
                Use these details when making your transfer.
              </p>

              <div className="bankrow">
                <div className="banklabel">
                  Account name
                </div>

                <div className="bankvalue">
                  GradLink SA
                </div>
              </div>

              <div className="bankrow">
                <div className="banklabel">Bank</div>

                <div className="bankvalue">
                  Capitec Business
                </div>
              </div>

              <div className="bankrow">
                <div className="banklabel">
                  Account number
                </div>

                <div className="bankvalue">
                  <span className="account-number">
                    2609988253
                  </span>
                </div>
              </div>

              <div className="bankrow">
                <div className="banklabel">
                  Account type
                </div>

                <div className="bankvalue">
                  Entrepreneur Business Account
                </div>
              </div>

              <div className="note">
                <strong>Before paying:</strong> Double-check
                these details in your Capitec app. Transfer
                the exact amount shown under your selected
                plan, use an identifiable payment reference,
                and keep your proof of payment.
              </div>

              <div className="form-divider" />

              <div className="form-heading">
                Submit your payment
              </div>

              <p className="form-description">
                After making the transfer, complete the form
                below so your payment can be reviewed.
              </p>

              <form onSubmit={submitPayment}>
                <label htmlFor="reference">
                  Bank payment reference{" "}
                  <span className="required">*</span>
                </label>

                <input
                  id="reference"
                  type="text"
                  value={reference}
                  onChange={(e) =>
                    setReference(e.target.value)
                  }
                  placeholder="Enter your bank transfer reference"
                  maxLength={120}
                  autoComplete="off"
                  required
                />

                <label htmlFor="proof">
                  Proof of payment{" "}
                  <span className="required">*</span>
                </label>

                <div className="uploadbox">
                  <input
                    id="proof"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(e) =>
                      setProof(
                        e.target.files?.[0] || null
                      )
                    }
                    required
                  />

                  {proof && (
                    <div className="selected-file">
                      ✓ Selected: {proof.name}
                    </div>
                  )}
                </div>

                <p className="hint">
                  Accepted formats: PDF, JPG or PNG.
                  Maximum file size: 5 MB. Please upload
                  your transfer receipt or proof of payment,
                  not your full bank statement.
                </p>

                <button
                  className="button"
                  type="submit"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <span
                        className="loading-indicator"
                        aria-hidden="true"
                      />

                      Submitting payment…
                    </>
                  ) : (
                    <>
                      Submit proof of payment

                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>
        ) : (
          /* UNAVAILABLE PAYMENT */

          <section className="card">
            <h2>Payment request unavailable</h2>

            <p className="small">
              We couldn't load a valid pending payment
              request. Return to the pricing page and select
              a plan to create a new request.
            </p>

            <Link
              className="secondary-button"
              href="/company-pricing"
            >
              Choose a plan →
            </Link>
          </section>
        )}

        <footer className="footer">
          <strong>GradLink SA</strong>
          <br />
          Manual bank payments · Subscription activation
          follows payment verification.
        </footer>
      </div>
    </main>
  );
}