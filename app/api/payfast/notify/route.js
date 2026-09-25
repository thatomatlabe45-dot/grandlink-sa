import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Supabase server environment variables are missing."
  );
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey
);

// ============================================================
// PLAN PRICES
// ============================================================

const PLANS = {
  starter: {
    monthly: 500,
    annual: 5000,
  },

  professional: {
    monthly: 950,
    annual: 9500,
  },

  enterprise: {
    monthly: 1500,
    annual: 15000,
  },

  pay_per_listing: {
    listing: 250,
  },
};

// ============================================================
// POST
// ============================================================

export async function POST(request) {
  try {
    // ----------------------------------------------------------
    // 1. CHECK SERVER CONFIGURATION
    // ----------------------------------------------------------

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Missing Supabase server environment variables."
      );

      return new NextResponse(
        "Server configuration error",
        { status: 500 }
      );
    }

    const merchantId =
      process.env.PAYFAST_MERCHANT_ID;

    const passphrase =
      process.env.PAYFAST_PASSPHRASE;

    if (!merchantId || !passphrase) {
      console.error(
        "PayFast environment variables are missing."
      );

      return new NextResponse(
        "PayFast configuration error",
        { status: 500 }
      );
    }

    // ----------------------------------------------------------
    // 2. RECEIVE PAYFAST NOTIFICATION
    // ----------------------------------------------------------

    const rawBody =
      await request.text();

    const params =
      new URLSearchParams(rawBody);

    const receivedSignature =
      params.get("signature");

    if (!receivedSignature) {
      console.error(
        "PayFast notification has no signature."
      );

      return new NextResponse(
        "Missing signature",
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 3. REBUILD PAYFAST SIGNATURE
    // ----------------------------------------------------------

    const paymentData = {};

    for (const [key, value] of params.entries()) {
      if (key !== "signature") {
        paymentData[key] = value;
      }
    }

    const signatureString =
      Object.entries(paymentData)
        .filter(
          ([key, value]) =>
            value !== undefined &&
            value !== null &&
            value !== ""
        )
        .map(
          ([key, value]) =>
            `${key}=${encodeURIComponent(
              String(value).trim()
            )}`
        )
        .join("&");

    const stringToHash =
      `${signatureString}&passphrase=${encodeURIComponent(
        passphrase.trim()
      )}`;

    const calculatedSignature =
      crypto
        .createHash("md5")
        .update(stringToHash)
        .digest("hex");

    // ----------------------------------------------------------
    // 4. VERIFY SIGNATURE
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

    // ----------------------------------------------------------
    // 5. READ PAYMENT INFORMATION
    // ----------------------------------------------------------

    const paymentStatus =
      params.get("payment_status");

    const receivedMerchantId =
      params.get("merchant_id");

    const paymentId =
      params.get("m_payment_id");

    const amountGross =
      params.get("amount_gross");

    const itemName =
      params.get("item_name");

    const emailAddress =
      params.get("email_address");

    // ----------------------------------------------------------
    // 6. VERIFY MERCHANT
    // ----------------------------------------------------------

    if (
      receivedMerchantId !==
      merchantId
    ) {
      console.error(
        "PayFast merchant ID mismatch."
      );

      return new NextResponse(
        "Invalid merchant",
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 7. PAYMENT ID REQUIRED
    // ----------------------------------------------------------

    if (!paymentId) {
      console.error(
        "PayFast payment ID is missing."
      );

      return new NextResponse(
        "Missing payment ID",
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 8. ONLY COMPLETE PAYMENTS CAN ACTIVATE
    // ----------------------------------------------------------

    if (
      paymentStatus !== "COMPLETE"
    ) {
      console.log(
        "PayFast payment is not complete:",
        paymentStatus
      );

      return new NextResponse(
        "OK",
        { status: 200 }
      );
    }

    // ----------------------------------------------------------
    // 9. EXTRACT SUBSCRIPTION ID
    // ----------------------------------------------------------

    /*
     * Payment ID format created by create-payment:
     *
     * GL-SUBSCRIPTION_ID-TIMESTAMP
     *
     * Example:
     *
     * GL-12345-1750000000000
     */

    if (!paymentId.startsWith("GL-")) {
      console.error(
        "Invalid GradLink payment ID."
      );

      return new NextResponse(
        "Invalid payment ID",
        { status: 400 }
      );
    }

    const paymentParts =
      paymentId.split("-");

    if (paymentParts.length < 3) {
      console.error(
        "Invalid GradLink payment ID format."
      );

      return new NextResponse(
        "Invalid payment ID",
        { status: 400 }
      );
    }

    const subscriptionId =
      paymentParts[1];

    if (!subscriptionId) {
      console.error(
        "Subscription ID could not be extracted."
      );

      return new NextResponse(
        "Invalid subscription ID",
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 10. FIND EXACT SUBSCRIPTION
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
        "Database error",
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

    // ----------------------------------------------------------
    // 11. PREVENT DUPLICATE ACTIVATION
    // ----------------------------------------------------------

    if (
      String(subscription.status).toLowerCase() ===
      "active"
    ) {
      console.log(
        "Subscription already active:",
        subscription.id
      );

      return new NextResponse(
        "OK",
        { status: 200 }
      );
    }

    // ----------------------------------------------------------
    // 12. IDENTIFY PLAN
    // ----------------------------------------------------------

    const planId =
      String(subscription.plan || "")
        .toLowerCase();

    const plan =
      PLANS[planId];

    if (!plan) {
      console.error(
        "Unknown subscription plan:",
        planId
      );

      return new NextResponse(
        "Invalid plan",
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 13. DETERMINE EXPECTED AMOUNT
    // ----------------------------------------------------------

    let expectedAmount = null;

    const subscriptionPrice =
      Number(
        subscription.monthly_price
      );

    /*
     * monthly_price stores the actual amount
     * selected on the pricing/payment page.
     *
     * This lets us verify the exact amount
     * associated with this subscription.
     */

    if (
      Number.isFinite(subscriptionPrice) &&
      subscriptionPrice > 0
    ) {
      expectedAmount =
        subscriptionPrice;
    }

    if (expectedAmount === null) {
      console.error(
        "Subscription has no valid payment amount."
      );

      return new NextResponse(
        "Invalid subscription amount",
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 14. VERIFY PAYMENT AMOUNT
    // ----------------------------------------------------------

    const paidAmount =
      Number(amountGross);

    if (
      !Number.isFinite(paidAmount)
    ) {
      console.error(
        "Invalid PayFast payment amount."
      );

      return new NextResponse(
        "Invalid payment amount",
        { status: 400 }
      );
    }

    /*
     * Compare to cents to avoid floating-point
     * problems.
     */

    const paidCents =
      Math.round(paidAmount * 100);

    const expectedCents =
      Math.round(expectedAmount * 100);

    if (
      paidCents !== expectedCents
    ) {
      console.error(
        "Payment amount mismatch.",
        {
          paymentId,
          subscriptionId,
          planId,
          paidAmount,
          expectedAmount,
        }
      );

      return new NextResponse(
        "Invalid payment amount",
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 15. DETERMINE PERIOD
    // ----------------------------------------------------------

    const now =
      new Date();

    const periodStart =
      now.toISOString();

    let periodEnd =
      new Date(now);

    /*
     * Annual plans:
     * 12 months access.
     *
     * Monthly plans:
     * 1 month access.
     *
     * Pay per listing:
     * no subscription period is required.
     */

    if (
      planId === "pay_per_listing"
    ) {
      periodEnd = null;
    } else if (
      expectedAmount ===
      plan.annual
    ) {
      periodEnd.setFullYear(
        periodEnd.getFullYear() + 1
      );
    } else {
      periodEnd.setMonth(
        periodEnd.getMonth() + 1
      );
    }

    // ----------------------------------------------------------
    // 16. ACTIVATE SUBSCRIPTION
    // ----------------------------------------------------------

    const updateData = {
      status: "active",

      payment_provider:
        "payfast",

      payment_reference:
        paymentId,

      started_at:
        periodStart,

      current_period_start:
        periodStart,

      current_period_end:
        periodEnd
          ? periodEnd.toISOString()
          : null,

      updated_at:
        new Date().toISOString(),
    };

    const {
      data: updatedSubscription,
      error: updateError,
    } = await supabase
      .from("company_subscriptions")
      .update(updateData)
      .eq("id", subscription.id)
      .eq("status", "inactive")
      .select()
      .maybeSingle();

    if (updateError) {
      console.error(
        "Subscription activation error:",
        updateError
      );

      return new NextResponse(
        "Could not activate subscription",
        { status: 500 }
      );
    }

    /*
     * If no row was returned, another notification
     * may have processed the payment first.
     */

    if (!updatedSubscription) {
      console.log(
        "Subscription was already processed:",
        subscription.id
      );

      return new NextResponse(
        "OK",
        { status: 200 }
      );
    }

    // ----------------------------------------------------------
    // 17. LOG SUCCESS
    // ----------------------------------------------------------

    console.log(
      "GradLink SA PayFast payment verified successfully.",
      {
        paymentId,
        subscriptionId,
        planId,
        amount: paidAmount,
        email: emailAddress,
        itemName,
      }
    );

    // ----------------------------------------------------------
    // 18. RESPOND TO PAYFAST
    // ----------------------------------------------------------

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