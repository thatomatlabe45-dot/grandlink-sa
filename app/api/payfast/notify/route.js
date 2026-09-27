import { NextResponse } from "next/server";
import crypto from "crypto";

// ============================================================
// GRADLINK SA PAYFAST CONFIGURATION
// ============================================================

const PAYFAST_MERCHANT_ID =
  process.env.PAYFAST_MERCHANT_ID;

const PAYFAST_PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

// ============================================================
// PAYFAST VALIDATION URL
// ============================================================

const PAYFAST_MODE =
  process.env.PAYFAST_MODE || "sandbox";

const PAYFAST_VALIDATE_URL =
  PAYFAST_MODE === "live"
    ? "https://www.payfast.co.za/eng/query/validate"
    : "https://sandbox.payfast.co.za/eng/query/validate";

// ============================================================
// SUPABASE EDGE FUNCTION
// ============================================================

const PAYFAST_ACTIVATION_FUNCTION =
  SUPABASE_URL
    ? `${SUPABASE_URL}/functions/v1/activate-payfast`
    : null;

// ============================================================
// POST - PAYFAST NOTIFICATION
// ============================================================

export async function POST(request) {
  try {
    console.log("========================================");
    console.log("GradLink SA PayFast notification received");
    console.log("========================================");

    // ----------------------------------------------------------
    // 1. CHECK ENVIRONMENT
    // ----------------------------------------------------------

    if (!PAYFAST_MERCHANT_ID) {
      console.error("PAYFAST_MERCHANT_ID is missing.");

      return new NextResponse(
        "PayFast merchant ID missing",
        { status: 500 }
      );
    }

    if (!PAYFAST_PASSPHRASE) {
      console.error("PAYFAST_PASSPHRASE is missing.");

      return new NextResponse(
        "PayFast passphrase missing",
        { status: 500 }
      );
    }

    if (!SUPABASE_URL) {
      console.error(
        "NEXT_PUBLIC_SUPABASE_URL is missing."
      );

      return new NextResponse(
        "Supabase URL missing",
        { status: 500 }
      );
    }

    // ----------------------------------------------------------
    // 2. READ PAYFAST NOTIFICATION
    // ----------------------------------------------------------

    const rawBody =
      await request.text();

    console.log(
      "PayFast notification body received."
    );

    if (!rawBody) {
      console.error(
        "Empty PayFast notification body."
      );

      return new NextResponse(
        "Empty notification",
        { status: 400 }
      );
    }

    const params =
      new URLSearchParams(rawBody);

    // ----------------------------------------------------------
    // 3. GET IMPORTANT PAYMENT VALUES
    // ----------------------------------------------------------

    const receivedSignature =
      params.get("signature");

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

    console.log("Payment status:", paymentStatus);
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
    // 4. REQUIRE SIGNATURE
    // ----------------------------------------------------------

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
    // 7. VERIFY MERCHANT
    // ----------------------------------------------------------

    if (
      receivedMerchantId !==
      PAYFAST_MERCHANT_ID
    ) {
      console.error(
        "PayFast merchant ID does not match."
      );

      return new NextResponse(
        "Invalid merchant",
        { status: 400 }
      );
    }

    console.log(
      "PayFast merchant verified."
    );

    // ----------------------------------------------------------
    // 8. REQUIRE PAYMENT ID
    // ----------------------------------------------------------

    if (!merchantPaymentId) {
      console.error(
        "m_payment_id is missing."
      );

      return new NextResponse(
        "Missing payment ID",
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 9. ONLY PROCESS COMPLETE PAYMENTS
    // ----------------------------------------------------------

    if (paymentStatus !== "COMPLETE") {
      console.log(
        "Payment is not COMPLETE:",
        paymentStatus
      );

      // PayFast expects a successful HTTP response
      // even when the payment itself is not complete.
      return new NextResponse(
        "Payment not complete",
        { status: 200 }
      );
    }

    console.log(
      "Payment status is COMPLETE."
    );

    // ----------------------------------------------------------
    // 10. VALIDATE PAYMENT AMOUNT
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
      "Paid amount:",
      paidAmount
    );

    // ----------------------------------------------------------
    // 11. EXTRACT SUBSCRIPTION ID
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
        "Invalid GradLink payment ID:",
        merchantPaymentId
      );

      return new NextResponse(
        "Invalid payment ID format",
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
    // 12. VALIDATE UUID
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
        "Invalid subscription UUID",
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 13. PAYFAST SERVER-SIDE VALIDATION
    // ----------------------------------------------------------

    console.log(
      "Validating transaction directly with PayFast..."
    );

    const validationResponse =
      await fetch(
        PAYFAST_VALIDATE_URL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: rawBody,
        }
      );

    const validationText =
      await validationResponse.text();

    console.log(
      "PayFast validation response:",
      validationText
    );

    if (
      !validationResponse.ok ||
      validationText.trim() !== "VALID"
    ) {
      console.error(
        "PayFast transaction validation failed."
      );

      return new NextResponse(
        "PayFast validation failed",
        { status: 400 }
      );
    }

    console.log(
      "PayFast transaction successfully validated."
    );

    // ----------------------------------------------------------
    // 14. CALL SUPABASE ACTIVATION FUNCTION
    // ----------------------------------------------------------

    if (!PAYFAST_ACTIVATION_FUNCTION) {
      console.error(
        "PayFast activation function URL is missing."
      );

      return new NextResponse(
        "Activation function unavailable",
        { status: 500 }
      );
    }

    console.log(
      "Calling Supabase activate-payfast..."
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

            payment_provider:
              "payfast",

            amount:
              paidAmount,

            payment_status:
              paymentStatus,

            merchant_payment_id:
              merchantPaymentId,

            email:
              emailAddress,

            item_name:
              itemName,
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
    // 15. CHECK ACTIVATION RESULT
    // ----------------------------------------------------------

    if (!activationResponse.ok) {
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

    if (
      activationResult &&
      activationResult.success === false
    ) {
      console.error(
        "Subscription activation rejected:",
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

    console.log("========================================");
    console.log(
      "GRADLINK SA SUBSCRIPTION ACTIVATED"
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
      "Payment reference:",
      payfastPaymentId ||
      merchantPaymentId
    );
    console.log("========================================");

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