"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================
// GRADLINK SA COMPANY PLANS
// ============================================================

const PLANS = {
  starter: {
    key: "starter",
    name: "Starter",
    monthly: 500,
    annual: 5000,
    listings: 5,
    description: "For companies starting to recruit graduates.",
  },

  professional: {
    key: "professional",
    name: "Professional",
    monthly: 950,
    annual: 9500,
    listings: 15,
    description: "For growing companies hiring more graduates.",
    popular: true,
  },

  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    monthly: 1500,
    annual: 15000,
    listings: 30,
    description: "For companies with larger recruitment needs.",
  },

  pay_per_listing: {
    key: "pay_per_listing",
    name: "Pay Per Listing",
    price: 250,
    listings: 1,
    description: "Pay once when you only need one listing.",
    payPerListing: true,
  },
};

function formatMoney(amount) {
  return `R${Number(amount).toLocaleString("en-ZA")}`;
}

// ============================================================
// PLAN CARD
// ============================================================

function PlanCard({
  plan,
  billing,
  onSelect,
  loading,
}) {
  const isPayPerListing = plan.payPerListing === true;

  const price = isPayPerListing
    ? plan.price
    : billing === "annual"
      ? plan.annual
      : plan.monthly;

  return (
    <div
      style={{
        position: "relative",
        background: "#ffffff",
        border: plan.popular
          ? "2px solid #2563eb"
          : "1px solid #e5e7eb",
        borderRadius: "18px",
        padding: "28px",
        boxShadow: plan.popular
          ? "0 12px 35px rgba(37, 99, 235, 0.15)"
          : "0 8px 25px rgba(15, 23, 42, 0.06)",
        display: "flex",
        flexDirection: "column",
        minHeight: "430px",
      }}
    >
      {plan.popular && (
        <div
          style={{
            position: "absolute",
            top: "-13px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#2563eb",
            color: "#ffffff",
            padding: "7px 16px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "800",
            whiteSpace: "nowrap",
          }}
        >
          MOST POPULAR
        </div>
      )}

      <h2
        style={{
          margin: "0 0 8px",
          color: "#0f172a",
          fontSize: "24px",
          fontWeight: "800",
        }}
      >
        {plan.name}
      </h2>

      <p
        style={{
          color: "#64748b",
          minHeight: "48px",
          lineHeight: "1.5",
          margin: "0 0 20px",
        }}
      >
        {plan.description}
      </p>

      <div style={{ marginBottom: "8px" }}>
        <span
          style={{
            fontSize: "38px",
            fontWeight: "900",
            color: "#0f172a",
          }}
        >
          {formatMoney(price)}
        </span>

        <span
          style={{
            color: "#64748b",
            fontSize: "14px",
            marginLeft: "6px",
          }}
        >
          {isPayPerListing
            ? "once"
            : billing === "annual"
              ? "/year"
              : "/month"}
        </span>
      </div>

      {!isPayPerListing && billing === "annual" && (
        <div
          style={{
            color: "#16a34a",
            fontWeight: "800",
            fontSize: "13px",
            marginBottom: "14px",
          }}
        >
          SAVE 2 MONTHS
        </div>
      )}

      {!isPayPerListing && billing === "monthly" && (
        <div style={{ height: "27px" }} />
      )}

      <div
        style={{
          marginTop: "10px",
          padding: "14px",
          background: "#eff6ff",
          borderRadius: "12px",
          color: "#1e40af",
          fontWeight: "800",
        }}
      >
        ✓ {plan.listings} active{" "}
        {plan.listings === 1 ? "listing" : "listings"}
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={() => onSelect(plan.key)}
        disabled={loading}
        style={{
          width: "100%",
          marginTop: "25px",
          padding: "14px 18px",
          border: "none",
          borderRadius: "12px",
          background: loading ? "#94a3b8" : "#2563eb",
          color: "#ffffff",
          fontSize: "15px",
          fontWeight: "800",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading
          ? "Please wait..."
          : isPayPerListing
            ? "Publish a Listing"
            : "Choose Plan"}
      </button>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function CompanyPricingPage() {
  const router = useRouter();

  const [billing, setBilling] = useState("monthly");
  const [user, setUser] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [message, setMessage] = useState("");

  // ----------------------------------------------------------
  // LOAD USER
  // ----------------------------------------------------------

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        const { data } = await supabase
          .from("company_subscriptions")
          .select("*")
          .eq("company_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          setCurrentSubscription(data[0]);
        }
      }
    }

    loadUser();
  }, []);

  // ----------------------------------------------------------
  // SELECT PLAN
  // ----------------------------------------------------------

  async function continueToPayment(planKey) {
    try {
      setMessage("");
      setLoadingPlan(planKey);

      // ------------------------------------------------------
      // USER MUST BE LOGGED IN
      // ------------------------------------------------------

      let currentUser = user;

      if (!currentUser) {
        const {
          data: { user: loggedInUser },
        } = await supabase.auth.getUser();

        currentUser = loggedInUser;

        if (currentUser) {
          setUser(currentUser);
        }
      }

      if (!currentUser) {
        router.push(
          `/signup?role=company&redirect=/company-pricing`
        );
        return;
      }

      const selectedPlan = PLANS[planKey];

      if (!selectedPlan) {
        setMessage("Invalid plan selected.");
        return;
      }

      // ------------------------------------------------------
      // PAY PER LISTING
      // ------------------------------------------------------

      const selectedBilling = selectedPlan.payPerListing
        ? "listing"
        : billing;

      // ------------------------------------------------------
      // CHECK FOR EXISTING ACTIVE SUBSCRIPTION
      // ------------------------------------------------------

      const { data: activeSubscription } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq("company_id", currentUser.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (
        activeSubscription &&
        activeSubscription.length > 0 &&
        !selectedPlan.payPerListing
      ) {
        router.push("/company");
        return;
      }

      // ------------------------------------------------------
      // PRICE
      // ------------------------------------------------------

      const amount = selectedPlan.payPerListing
        ? selectedPlan.price
        : selectedBilling === "annual"
          ? selectedPlan.annual
          : selectedPlan.monthly;

      // ------------------------------------------------------
      // CREATE PENDING SUBSCRIPTION
      // ------------------------------------------------------

      const { data: existingPending } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq("company_id", currentUser.id)
        .eq("status", "inactive")
        .order("created_at", { ascending: false })
        .limit(1);

      let subscriptionId = null;

      if (existingPending && existingPending.length > 0) {
        const pending = existingPending[0];

        const { data: updatedSubscription, error: updateError } =
          await supabase
            .from("company_subscriptions")
            .update({
              plan: planKey,
              monthly_price: amount,
              payment_provider: "payfast",
              payment_reference: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", pending.id)
            .select()
            .single();

        if (updateError) {
          throw updateError;
        }

        subscriptionId = updatedSubscription.id;
      } else {
        const { data: newSubscription, error: insertError } =
          await supabase
            .from("company_subscriptions")
            .insert({
              company_id: currentUser.id,
              plan: planKey,
              status: "inactive",
              monthly_price: amount,
              payment_provider: "payfast",
              payment_reference: null,
            })
            .select()
            .single();

        if (insertError) {
          throw insertError;
        }

        subscriptionId = newSubscription.id;
      }

      // ------------------------------------------------------
      // SEND USER TO PAYMENT PAGE
      // ------------------------------------------------------

      const params = new URLSearchParams({
        plan: planKey,
        billing: selectedBilling,
        subscription: String(subscriptionId),
      });

      router.push(`/company/payment?${params.toString()}`);
    } catch (error) {
      console.error("Plan selection error:", error);

      setMessage(
        error?.message ||
          "Unable to continue. Please try again."
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  // ----------------------------------------------------------
  // ACTIVE SUBSCRIPTION DISPLAY
  // ----------------------------------------------------------

  const active =
    currentSubscription &&
    String(currentSubscription.status).toLowerCase() === "active";

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #eff6ff 0%, #f8fafc 45%, #ffffff 100%)",
        padding: "45px 20px 70px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "35px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#dbeafe",
              color: "#1d4ed8",
              padding: "8px 14px",
              borderRadius: "999px",
              fontWeight: "800",
              fontSize: "13px",
              marginBottom: "15px",
            }}
          >
            GRADLINK SA FOR COMPANIES
          </div>

          <h1
            style={{
              margin: "0",
              fontSize: "clamp(32px, 6vw, 52px)",
              lineHeight: "1.1",
              fontWeight: "900",
              color: "#0f172a",
            }}
          >
            Choose your company plan
          </h1>

          <p
            style={{
              maxWidth: "700px",
              margin: "16px auto 0",
              color: "#64748b",
              fontSize: "17px",
              lineHeight: "1.6",
            }}
          >
            Publish internships and connect with qualified
            graduates on GradLink SA.
          </p>

          <p
            style={{
              marginTop: "12px",
              color: "#334155",
              fontWeight: "700",
            }}
          >
            Companies require a paid plan. There is no free
            company plan.
          </p>
        </div>

        {/* ACTIVE SUBSCRIPTION */}

        {active && (
          <div
            style={{
              maxWidth: "700px",
              margin: "0 auto 30px",
              background: "#ecfdf5",
              border: "1px solid #86efac",
              borderRadius: "14px",
              padding: "16px 20px",
              color: "#166534",
              textAlign: "center",
              fontWeight: "700",
            }}
          >
            Your current plan is active:
            {" "}
            {String(currentSubscription.plan).toUpperCase()}
          </div>
        )}

        {/* MESSAGE */}

        {message && (
          <div
            style={{
              maxWidth: "700px",
              margin: "0 auto 25px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              padding: "14px 18px",
              color: "#b91c1c",
              textAlign: "center",
              fontWeight: "700",
            }}
          >
            {message}
          </div>
        )}

        {/* BILLING TOGGLE */}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "45px",
          }}
        >
          <div
            style={{
              display: "flex",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "5px",
              boxShadow: "0 5px 20px rgba(15,23,42,0.06)",
            }}
          >
            <button
              onClick={() => setBilling("monthly")}
              style={{
                border: "none",
                borderRadius: "10px",
                padding: "11px 20px",
                fontWeight: "800",
                cursor: "pointer",
                background:
                  billing === "monthly"
                    ? "#2563eb"
                    : "transparent",
                color:
                  billing === "monthly"
                    ? "#ffffff"
                    : "#475569",
              }}
            >
              Monthly
            </button>

            <button
              onClick={() => setBilling("annual")}
              style={{
                border: "none",
                borderRadius: "10px",
                padding: "11px 20px",
                fontWeight: "800",
                cursor: "pointer",
                background:
                  billing === "annual"
                    ? "#2563eb"
                    : "transparent",
                color:
                  billing === "annual"
                    ? "#ffffff"
                    : "#475569",
              }}
            >
              Annual
            </button>
          </div>
        </div>

        {/* PLANS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "22px",
          }}
        >
          <PlanCard
            plan={PLANS.starter}
            billing={billing}
            onSelect={continueToPayment}
            loading={loadingPlan === "starter"}
          />

          <PlanCard
            plan={PLANS.professional}
            billing={billing}
            onSelect={continueToPayment}
            loading={loadingPlan === "professional"}
          />

          <PlanCard
            plan={PLANS.enterprise}
            billing={billing}
            onSelect={continueToPayment}
            loading={loadingPlan === "enterprise"}
          />

          <PlanCard
            plan={PLANS.pay_per_listing}
            billing={billing}
            onSelect={continueToPayment}
            loading={loadingPlan === "pay_per_listing"}
          />
        </div>

        {/* FOOTER INFORMATION */}

        <div
          style={{
            maxWidth: "850px",
            margin: "45px auto 0",
            textAlign: "center",
            color: "#64748b",
            lineHeight: "1.7",
            fontSize: "14px",
          }}
        >
          <p>
            Payment is processed securely through PayFast.
          </p>

          <p>
            Selecting a plan does not activate your subscription.
            Your company plan becomes active only after successful
            payment verification.
          </p>

          <p>
            Graduates can use GradLink SA for free.
          </p>
        </div>
      </div>

      {/* MOBILE STYLES */}

      <style jsx>{`
        @media (max-width: 700px) {
          main {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }
        }
      `}</style>
    </main>
  );
}