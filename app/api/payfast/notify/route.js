import { NextResponse } from "next/server";
import crypto from "crypto";

// ============================================================
// GRADLINK SA PAYFAST CONFIGURATION
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
// PAYFAST CONFIGURATION
// ============================================================

const PAYFAST_MERCHANT_ID =
  process.env.PAYFAST_MERCHANT_ID;

const PAYFAST_PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE;

// ============================================================
// SUPABASE EDGE FUNCTION
// ============================================================

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const PAYFAST_ACTIVATION_FUNCTION =
  `${SUPABASE_URL}/functions/v1/activate-payfast`;

// ============================================================
// POST - PAYFAST NOTIFICATION
// ============================================================

export async function POST(request) {
  try {
    console.log("========================================");
    console.log(
      "GradLink SA PayFast notification received"
    );
    console.log("========================================");

    // ----------------------------------------------------------
    // 1. CHECK CONFIGURATION
    // ----------------------------------------------------------

    if (
      !PAYFAST_MERCHANT_ID ||
      !PAYFAST_PASSPHRASE
    ) {
      console.error(
        "PayFast environment variables are missing."
      );

      return new NextResponse(
        "PayFast configuration error",
        { status: 500 }
      );
    }

    if (!SUPABASE_URL) {
      console.error(
        "NEXT_PUBLIC_SUPABASE_URL is missing."
      );

      return new NextResponse(
        "Supabase URL configuration error",
        { status: 500 }
      );
    }

    // ----------------------------------------------------------
    // 2. READ PAYFAST BODY
    // ----------------------------------------------------------

    const rawBody =
      await request.text();

    console.log(
      "Raw PayFast notification received."
    );

    const params =
      new URLSearchParams(rawBody);

    // ----------------------------------------------------------
    // 3. GET SIGNATURE
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
    // 4. RECREATE PAYFAST SIGNATURE
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
        PAYFAST_PASSPHRASE.trim()
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
    // 5. VERIFY SIGNATURE
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
    // 6. READ PAYMENT INFORMATION
    // ----------------------------------------------------------

    const paymentStatus =
      params.get("payment_status");

    const receivedMerchantId =
      params.get("merchant_id");

    const merchantPaymentId =
      params.get("m_payment_id");

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
    // 7. VERIFY MERCHANT
    // ----------------------------------------------------------

    if (
      receivedMerchantId !==
      PAYFAST_MERCHANT_ID
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
    // 8. REQUIRE MERCHANT PAYMENT ID
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
    // 9. ONLY COMPLETE PAYMENTS
    // ----------------------------------------------------------

    if (
      paymentStatus !== "COMPLETE"
    ) {
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
    // 10. EXTRACT SUBSCRIPTION ID
    //
    // Expected:
    //
    // GL-SUBSCRIPTION_UUID-TIMESTAMP
    //
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
    // 11. VALIDATE UUID
    // ----------------------------------------------------------

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      !uuidRegex.test(subscriptionId)
    ) {
      console.error(
        "Subscription ID is not a valid UUID."
      );

      return new NextResponse(
        "Invalid subscription ID",
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 12. VERIFY PAYMENT AMOUNT EXISTS
    // ----------------------------------------------------------

    const paidAmount =
      Number(amountGross);

    if (
      !Number.isFinite(paidAmount) ||
      paidAmount <= 0
    ) {
      console.error(
        "Invalid PayFast amount:",
        amountGross
      );

      return new NextResponse(
        "Invalid payment amount",
        { status: 400 }
      );
    }

    console.log(
      "Verified PayFast amount:",
      paidAmount
    );

    // ----------------------------------------------------------
    // 13. CALL SUPABASE EDGE FUNCTION
    // ----------------------------------------------------------

    console.log(
      "Calling Supabase activate-payfast function..."
    );

    const activationResponse =
      await fetch(
        PAYFAST_ACTIVATION_FUNCTION,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            subscription_id:
              subscriptionId,

            payment_reference:
              payfastPaymentId ||
              merchantPaymentId,

            amount:
              paidAmount,
          }),
        }
      );

    const activationText =
      await activationResponse.text();

    console.log(
      "Supabase activation response:",
      activationText
    );

    // ----------------------------------------------------------
    // 14. CHECK EDGE FUNCTION RESPONSE
    // ----------------------------------------------------------

    if (
      !activationResponse.ok
    ) {
      console.error(
        "Supabase activation failed:",
        activationText
      );

      return new NextResponse(
        "Subscription activation failed",
        { status: 500 }
      );
    }

    let activationResult;

    try {
      activationResult =
        JSON.parse(
          activationText
        );
    } catch {
      activationResult = {
        raw: activationText,
      };
    }

    // ----------------------------------------------------------
    // 15. CHECK DATABASE RESULT
    // ----------------------------------------------------------

    if (
      activationResult &&
      activationResult.success === false
    ) {
      console.error(
        "Database rejected activation:",
        activationResult
      );

      return new NextResponse(
        "Subscription activation rejected",
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 16. SUCCESS
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
      "Amount:",
      paidAmount
    );

    console.log(
      "PayFast reference:",
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

// ============================================================
// GET - BROWSER TEST
// ============================================================

export async function GET() {
  return new NextResponse(
    "GradLink SA PayFast notification endpoint is online.",
    { status: 200 }
  );
}