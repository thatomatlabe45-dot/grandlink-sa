import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// SUPABASE SERVER CLIENT
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Support either Supabase's newer secret key or the older
// service-role key name.
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServerKey
    ? createClient(supabaseUrl, supabaseServerKey)
    : null;

// ============================================================
// GRADLINK SA PLANS
// ============================================================

const PLANS = {
  starter: {
    name: "Starter",
    monthly: 500,
    annual: 5000,
    listings: 5,
  },

  professional: {
    name: "Professional",
    monthly: 950,
    annual: 9500,
    listings: 15,
  },

  enterprise: {
    name: "Enterprise",
    monthly: 1500,
    annual: 15000,
    listings: 30,
  },

  pay_per_listing: {
    name: "Pay Per Listing",
    listing: 250,
    listings: 1,
  },
};

// ============================================================
// POST - PAYFAST NOTIFICATION
// ============================================================

export async function POST(request) {
  try {
    console.log("========================================");
    console.log("GradLink SA PayFast notification received");
    console.log("========================================");

    // ----------------------------------------------------------
    // 1. CHECK SUPABASE CONFIGURATION
    // ----------------------------------------------------------

    if (!supabase) {
      console.error(
        "Missing Supabase server environment variables."
      );

      return new NextResponse(
        "Supabase server configuration error",
        { status: 500 }
      );
    }

    // ----------------------------------------------------------
    // 2. CHECK PAYFAST CONFIGURATION
    // ----------------------------------------------------------

    const merchantId =
      process.env.PAYFAST_MERCHANT_ID;

    const passphrase =
      process.env.PAYFAST_PASSPHRASE;

    if (!merchantId || !passphrase) {
      console.error(
        "Missing PayFast environment variables."
      );

      return new NextResponse(
        "PayFast configuration error",
        { status: 500 }
      );
    }

    // ----------------------------------------------------------
    // 3. READ PAYFAST BODY
    // ----------------------------------------------------------

    const rawBody = await request.text();

    console.log("Raw PayFast notification received.");

    const params = new URLSearchParams(rawBody);

    // ----------------------------------------------------------
    // 4. GET SIGNATURE
    // ----------------------------------------------------------

    const receivedSignature =
      params.get("signature");

    if (!receivedSignature) {
      console.error(
        "No PayFast signature received."
      );

      return new NextResponse(
        "Missing signature",
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 5. RECREATE PAYFAST SIGNATURE
    // ----------------------------------------------------------

    const signatureParts = [];

    for (const [key, value] of params.entries()) {
      if (key === "signature") {
        continue;
      }

      signatureParts.push(
        `${key}=${encodeURIComponent(value).replace(
          /%20/g,
          "+"
        )}`
      );
    }

    let signatureString =
      signatureParts.join("&");

    signatureString +=
      `&passphrase=${encodeURIComponent(
        passphrase.trim()
      ).replace(/%20/g, "+")}`;

    const calculatedSignature =
      crypto
        .createHash("md5")
        .update(signatureString)
        .digest("hex");

    console.log(
      "Calculated signature:",
      calculatedSignature
    );

    console.log(
      "Received signature:",
      receivedSignature
    );

    // ----------------------------------------------------------
    // 6. VERIFY SIGNATURE
    // ----------------------------------------------------------

    if (
      calculatedSignature.toLowerCase() !==
      receivedSignature.toLowerCase()
    ) {
      console.error(
        "PayFast signature verification failed."
      );

      return new NextResponse(
        "Invalid signature",
        { status: 400 }
      );
    }

    console.log(
      "PayFast signature verified."
    );

    // ----------------------------------------------------------
    // 7. READ PAYMENT INFORMATION
    // ----------------------------------------------------------

    const paymentStatus =
      params.get("payment_status");

    const receivedMerchantId =
      params.get("merchant_id");

    // GradLink merchant reference
    const merchantPaymentId =
      params.get("m_payment_id");

    // Actual PayFast payment ID
    const payfastPaymentId =
      params.get("pf_payment_id");

    const amountGross =
      params.get("amount_gross");

    const emailAddress =
      params.get("email_address");

    const itemName =
      params.get("item_name");

    console.log(
      "Payment status:",
      paymentStatus
    );

    console.log(
      "Merchant ID:",
      receivedMerchantId
    );

    console.log(
      "GradLink payment ID:",
      merchantPaymentId
    );

    console.log(
      "PayFast payment ID:",
      payfastPaymentId
    );

    console.log(
      "Amount:",
      amountGross
    );

    console.log(
      "Email:",
      emailAddress
    );

    console.log(
      "Item:",
      itemName
    );

    // ----------------------------------------------------------
    // 8. VERIFY MERCHANT ID
    // ----------------------------------------------------------

    if (
      receivedMerchantId !==
      merchantId
    ) {
      console.error(
        "Merchant ID does not match."
      );

      return new NextResponse(
        "Invalid merchant",
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 9. PAYMENT REFERENCE MUST EXIST
    // ----------------------------------------------------------

    if (!merchantPaymentId) {
      console.error(
        "No m_payment_id received."
      );

      return new NextResponse(
        "Missing payment ID",
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 10. ONLY COMPLETE PAYMENTS ARE ACTIVATED
    // ----------------------------------------------------------

    if (paymentStatus !== "COMPLETE") {
      console.log(
        "Payment is not COMPLETE:",
        paymentStatus
      );

      return new NextResponse(
        "Payment not complete",
        { status: 200 }
      );
    }

    console.log(
      "Payment status is COMPLETE."
    );

    // ----------------------------------------------------------
    // 11. EXTRACT SUBSCRIPTION ID
    //
    // Expected:
    // GL-SUBSCRIPTION_UUID-TIMESTAMP
    //
    // UUID contains hyphens, so regex is required.
    // ----------------------------------------------------------

    const paymentMatch =
      merchantPaymentId.match(
        /^GL-(.+)-(\d+)$/
      );

    if (!paymentMatch) {
      console.error(
        "Invalid GradLink payment ID format:",
        merchantPaymentId
      );

      return new NextResponse(
        "Invalid payment ID",
        { status: 400 }
      );
    }

    const subscriptionId =
      paymentMatch[1];

    console.log(
      "Subscription ID:",
      subscriptionId
    );

    // ----------------------------------------------------------
    // 12. FIND EXACT SUBSCRIPTION
    // ----------------------------------------------------------

    const {
      data: subscription,
      error: subscriptionError,
    } = await supabase
      .from("company_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .maybeSingle();

    if (subscriptionError) {
      console.error(
        "Subscription lookup error:",
        subscriptionError
      );

      return new NextResponse(
        "Subscription lookup failed",
        { status: 500 }
      );
    }

    if (!subscription) {
      console.error(
        "Subscription not found:",
        subscriptionId
      );

      return new NextResponse(
        "Subscription not found",
        { status: 404 }
      );
    }

    console.log(
      "Subscription found for company:",
      subscription.company_id
    );

    // ----------------------------------------------------------
    // 13. PREVENT DOUBLE ACTIVATION
    // ----------------------------------------------------------

    if (
      String(subscription.status).toLowerCase() ===
      "active"
    ) {
      console.log(
        "Subscription is already active."
      );

      return new NextResponse(
        "Already active",
        { status: 200 }
      );
    }

    // ----------------------------------------------------------
    // 14. VERIFY PLAN
    // ----------------------------------------------------------

    const planId =
      String(
        subscription.plan || ""
      ).toLowerCase();

    const selectedPlan =
      PLANS[planId];

    if (!selectedPlan) {
      console.error(
        "Unknown subscription plan:",
        planId
      );

      return new NextResponse(
        "Invalid plan",
        { status: 400 }
      );
    }

    console.log(
      "Subscription plan:",
      planId
    );

    // ----------------------------------------------------------
    // 15. VERIFY PAYMENT AMOUNT
    // ----------------------------------------------------------

    const expectedAmount =
      Number(subscription.monthly_price);

    const paidAmount =
      Number(amountGross);

    if (
      !Number.isFinite(expectedAmount) ||
      !Number.isFinite(paidAmount)
    ) {
      console.error(
        "Invalid payment amount."
      );

      return new NextResponse(
        "Invalid amount",
        { status: 400 }
      );
    }

    const expectedCents =
      Math.round(expectedAmount * 100);

    const paidCents =
      Math.round(paidAmount * 100);

    console.log(
      "Expected amount:",
      expectedAmount
    );

    console.log(
      "Paid amount:",
      paidAmount
    );

    if (
      expectedCents !==
      paidCents
    ) {
      console.error(
        "Payment amount does not match subscription."
      );

      return new NextResponse(
        "Invalid payment amount",
        { status: 400 }
      );
    }

    console.log(
      "Payment amount verified."
    );

    // ----------------------------------------------------------
    // 16. CALCULATE SUBSCRIPTION PERIOD
    // ----------------------------------------------------------

    const now = new Date();

    const periodStart =
      now.toISOString();

    let periodEnd = null;

    // Pay Per Listing = one-time payment
    if (planId === "pay_per_listing") {
      periodEnd = null;
    } else {
      // Annual plan
      if (
        selectedPlan.annual ===
        expectedAmount
      ) {
        const annualEnd =
          new Date(now);

        annualEnd.setFullYear(
          annualEnd.getFullYear() + 1
        );

        periodEnd =
          annualEnd.toISOString();
      } else {
        // Monthly plan
        const monthlyEnd =
          new Date(now);

        monthlyEnd.setMonth(
          monthlyEnd.getMonth() + 1
        );

        periodEnd =
          monthlyEnd.toISOString();
      }
    }

    // ----------------------------------------------------------
    // 17. ACTIVATE SUBSCRIPTION
    // ----------------------------------------------------------

    const {
      data: updatedSubscription,
      error: updateError,
    } = await supabase
      .from("company_subscriptions")
      .update({
        status: "active",

        started_at:
          subscription.started_at ||
          periodStart,

        current_period_start:
          periodStart,

        current_period_end:
          periodEnd,

        payment_provider:
          "payfast",

        // Store the ACTUAL PayFast payment ID.
        // Fall back to merchant ID if PayFast did not
        // provide pf_payment_id.
        payment_reference:
          payfastPaymentId ||
          merchantPaymentId,

        updated_at:
          periodStart,
      })
      .eq("id", subscriptionId)
      .eq("status", "inactive")
      .select()
      .maybeSingle();

    if (updateError) {
      console.error(
        "Subscription activation error:",
        updateError
      );

      return new NextResponse(
        "Subscription activation failed",
        { status: 500 }
      );
    }

    if (!updatedSubscription) {
      console.error(
        "Subscription was not updated."
      );

      return new NextResponse(
        "Subscription activation failed",
        { status: 500 }
      );
    }

    // ----------------------------------------------------------
    // 18. SUCCESS
    // ----------------------------------------------------------

    console.log(
      "========================================"
    );

    console.log(
      "GradLink SA subscription ACTIVATED"
    );

    console.log(
      "Subscription:",
      subscriptionId
    );

    console.log(
      "Company:",
      subscription.company_id
    );

    console.log(
      "Plan:",
      planId
    );

    console.log(
      "Amount:",
      paidAmount
    );

    console.log(
      "PayFast payment reference:",
      payfastPaymentId ||
        merchantPaymentId
    );

    console.log(
      "========================================"
    );

    return new NextResponse(
      "OK",
      { status: 200 }
    );

  } catch (error) {
    console.error(
      "PayFast notification error:",
      error
    );

    return new NextResponse(
      "Server error",
      { status: 500 }
    );
  }
}