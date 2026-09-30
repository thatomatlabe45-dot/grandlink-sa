import { NextResponse } from "next/server";
import crypto from "crypto";

// ============================================================
// GRADLINK SA - PAYFAST NOTIFICATION / ITN
// ============================================================
//
// FLOW:
//
// PayFast payment
//       ↓
// PayFast sends ITN to this route
//       ↓
// Verify PayFast signature
//       ↓
// Validate ITN with PayFast
//       ↓
// Confirm COMPLETE
//       ↓
// Extract GradLink subscription ID
//       ↓
// Call Supabase activate-payfast Edge Function
//       ↓
// company_subscriptions becomes ACTIVE
//
// ============================================================


// ============================================================
// PAYFAST CONFIGURATION
// ============================================================

const PAYFAST_MERCHANT_ID =
  process.env.PAYFAST_MERCHANT_ID;

const PAYFAST_PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE;

const PAYFAST_MODE =
  String(
    process.env.PAYFAST_MODE || "sandbox"
  ).toLowerCase();

const IS_SANDBOX =
  PAYFAST_MODE === "sandbox";

const PAYFAST_BASE_URL =
  IS_SANDBOX
    ? "https://sandbox.payfast.co.za"
    : "https://www.payfast.co.za";


// ============================================================
// SUPABASE CONFIGURATION
// ============================================================

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const ACTIVATION_FUNCTION_URL =
  SUPABASE_URL
    ? `${SUPABASE_URL}/functions/v1/activate-payfast`
    : null;


// ============================================================
// HELPER - PAYFAST URL ENCODING
// ============================================================

function payfastEncode(value) {
  return encodeURIComponent(
    String(value ?? "")
  ).replace(/%20/g, "+");
}


// ============================================================
// HELPER - CREATE PAYFAST SIGNATURE
// ============================================================

function createPayFastSignature(
  params,
  passphrase
) {
  const signatureParts = [];

  for (const [key, value] of params.entries()) {
    if (key === "signature") {
      continue;
    }

    signatureParts.push(
      `${key}=${payfastEncode(value)}`
    );
  }

  let signatureString =
    signatureParts.join("&");

  if (passphrase) {
    signatureString +=
      `&passphrase=${payfastEncode(
        passphrase.trim()
      )}`;
  }

  return crypto
    .createHash("md5")
    .update(signatureString)
    .digest("hex");
}


// ============================================================
// HELPER - SAFE RESPONSE
// ============================================================

function response(
  message,
  status = 200
) {
  return new NextResponse(
    message,
    {
      status,
      headers: {
        "Content-Type":
          "text/plain; charset=utf-8",
      },
    }
  );
}


// ============================================================
// POST - PAYFAST ITN
// ============================================================

export async function POST(request) {
  try {
    console.log(
      "========================================"
    );

    console.log(
      "GRADLINK SA PAYFAST ITN RECEIVED"
    );

    console.log(
      "========================================"
    );


    // ========================================================
    // 1. CHECK SERVER CONFIGURATION
    // ========================================================

    if (!PAYFAST_MERCHANT_ID) {
      console.error(
        "PAYFAST_MERCHANT_ID is missing."
      );

      return response(
        "PayFast merchant configuration error",
        500
      );
    }

    if (!PAYFAST_PASSPHRASE) {
      console.error(
        "PAYFAST_PASSPHRASE is missing."
      );

      return response(
        "PayFast passphrase configuration error",
        500
      );
    }

    if (!SUPABASE_URL) {
      console.error(
        "NEXT_PUBLIC_SUPABASE_URL is missing."
      );

      return response(
        "Supabase URL configuration error",
        500
      );
    }

    if (!ACTIVATION_FUNCTION_URL) {
      console.error(
        "Activation function URL could not be created."
      );

      return response(
        "Activation function configuration error",
        500
      );
    }


    console.log(
      "PayFast mode:",
      PAYFAST_MODE
    );

    console.log(
      "PayFast endpoint:",
      PAYFAST_BASE_URL
    );


    // ========================================================
    // 2. READ RAW ITN BODY
    // ========================================================

    const rawBody =
      await request.text();

    console.log(
      "PayFast raw body received."
    );

    if (!rawBody) {
      console.error(
        "PayFast sent an empty notification body."
      );

      return response(
        "Empty notification",
        400
      );
    }


    // ========================================================
    // 3. PARSE PAYFAST PARAMETERS
    // ========================================================

    const params =
      new URLSearchParams(rawBody);

    console.log(
      "PayFast parameters received:",
      Array.from(params.keys())
    );


    // ========================================================
    // 4. READ SIGNATURE
    // ========================================================

    const receivedSignature =
      params.get("signature");

    if (!receivedSignature) {
      console.error(
        "PayFast signature was not received."
      );

      return response(
        "Missing signature",
        400
      );
    }


    // ========================================================
    // 5. RECREATE SIGNATURE
    // ========================================================

    const calculatedSignature =
      createPayFastSignature(
        params,
        PAYFAST_PASSPHRASE
      );

    console.log(
      "Calculated signature:",
      calculatedSignature
    );

    console.log(
      "Received signature:",
      receivedSignature
    );


    // ========================================================
    // 6. VERIFY SIGNATURE
    // ========================================================

    if (
      calculatedSignature.toLowerCase() !==
      receivedSignature.toLowerCase()
    ) {
      console.error(
        "PayFast signature verification FAILED."
      );

      return response(
        "Invalid signature",
        400
      );
    }

    console.log(
      "PayFast signature verified."
    );


    // ========================================================
    // 7. READ PAYMENT INFORMATION
    // ========================================================

    const paymentStatus =
      String(
        params.get("payment_status") || ""
      ).toUpperCase();

    const merchantId =
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
      "----------------------------------------"
    );

    console.log(
      "Payment status:",
      paymentStatus
    );

    console.log(
      "Merchant ID:",
      merchantId
    );

    console.log(
      "m_payment_id:",
      merchantPaymentId
    );

    console.log(
      "pf_payment_id:",
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

    console.log(
      "----------------------------------------"
    );


    // ========================================================
    // 8. VERIFY MERCHANT ID
    // ========================================================

    if (
      String(merchantId || "") !==
      String(PAYFAST_MERCHANT_ID)
    ) {
      console.error(
        "PayFast merchant ID does not match."
      );

      console.error(
        "Expected:",
        PAYFAST_MERCHANT_ID
      );

      console.error(
        "Received:",
        merchantId
      );

      return response(
        "Invalid merchant",
        400
      );
    }

    console.log(
      "Merchant ID verified."
    );


    // ========================================================
    // 9. REQUIRE m_payment_id
    // ========================================================

    if (!merchantPaymentId) {
      console.error(
        "m_payment_id is missing."
      );

      return response(
        "Missing payment ID",
        400
      );
    }


    // ========================================================
    // 10. ONLY ACTIVATE COMPLETE PAYMENTS
    // ========================================================

    if (paymentStatus !== "COMPLETE") {
      console.log(
        "Payment is not COMPLETE."
      );

      console.log(
        "Current status:",
        paymentStatus
      );

      return response(
        "Notification received - payment not complete",
        200
      );
    }

    console.log(
      "Payment status is COMPLETE."
    );


    // ========================================================
    // 11. VALIDATE ITN WITH PAYFAST
    // ========================================================

    console.log(
      "Validating ITN with PayFast..."
    );

    const validationUrl =
      `${PAYFAST_BASE_URL}/eng/query/validate`;

    const validationResponse =
      await fetch(
        validationUrl,
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
      (
        await validationResponse.text()
      ).trim();

    console.log(
      "PayFast ITN validation HTTP status:",
      validationResponse.status
    );

    console.log(
      "PayFast ITN validation response:",
      validationText
    );


    // ========================================================
    // 12. REQUIRE VALID PAYFAST RESPONSE
    // ========================================================

    if (
      !validationResponse.ok
    ) {
      console.error(
        "PayFast ITN validation request failed."
      );

      return response(
        "PayFast ITN validation request failed",
        500
      );
    }

    if (
      validationText.toUpperCase() !==
      "VALID"
    ) {
      console.error(
        "PayFast rejected the ITN."
      );

      console.error(
        "Validation result:",
        validationText
      );

      return response(
        "PayFast ITN validation failed",
        400
      );
    }

    console.log(
      "PayFast ITN validation PASSED."
    );


    // ========================================================
    // 13. EXTRACT GRADLINK SUBSCRIPTION ID
    // ========================================================
    //
    // Expected:
    //
    // GL-SUBSCRIPTION_UUID-TIMESTAMP
    //
    // ========================================================

    const paymentMatch =
      merchantPaymentId.match(
        /^GL-([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})-(\d+)$/i
      );

    if (!paymentMatch) {
      console.error(
        "Could not extract subscription ID from m_payment_id."
      );

      console.error(
        "m_payment_id:",
        merchantPaymentId
      );

      return response(
        "Invalid GradLink payment ID",
        400
      );
    }

    const subscriptionId =
      paymentMatch[1];

    console.log(
      "Subscription ID:",
      subscriptionId
    );


    // ========================================================
    // 14. VERIFY AMOUNT
    // ========================================================

    const paidAmount =
      Number(amountGross);

    if (
      !Number.isFinite(paidAmount) ||
      paidAmount <= 0
    ) {
      console.error(
        "Invalid payment amount:",
        amountGross
      );

      return response(
        "Invalid payment amount",
        400
      );
    }

    console.log(
      "Verified payment amount:",
      paidAmount
    );


    // ========================================================
    // 15. CALL SUPABASE EDGE FUNCTION
    // ========================================================

    console.log(
      "Calling activate-payfast Edge Function..."
    );

    console.log(
      "Activation URL:",
      ACTIVATION_FUNCTION_URL
    );

    const activationResponse =
      await fetch(
        ACTIVATION_FUNCTION_URL,
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


    // ========================================================
    // 16. READ ACTIVATION RESPONSE
    // ========================================================

    const activationText =
      await activationResponse.text();

    console.log(
      "Activation HTTP status:",
      activationResponse.status
    );

    console.log(
      "Activation response:",
      activationText
    );


    // ========================================================
    // 17. CHECK EDGE FUNCTION HTTP STATUS
    // ========================================================

    if (
      !activationResponse.ok
    ) {
      console.error(
        "activate-payfast returned an error."
      );

      return response(
        "Subscription activation failed",
        500
      );
    }


    // ========================================================
    // 18. PARSE EDGE FUNCTION RESPONSE
    // ========================================================

    let activationResult = null;

    try {
      activationResult =
        JSON.parse(
          activationText
        );
    } catch {
      console.log(
        "Activation response was not JSON."
      );
    }


    // ========================================================
    // 19. CHECK EXPLICIT FAILURE
    // ========================================================

    if (
      activationResult &&
      activationResult.success === false
    ) {
      console.error(
        "activate-payfast rejected activation."
      );

      console.error(
        activationResult
      );

      return response(
        "Subscription activation rejected",
        500
      );
    }


    // ========================================================
    // 20. SUCCESS
    // ========================================================

    console.log(
      "========================================"
    );

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
      "PayFast reference:",
      payfastPaymentId ||
      merchantPaymentId
    );

    console.log(
      "========================================"
    );


    // IMPORTANT:
    // PayFast must receive HTTP 200.
    return response(
      "OK",
      200
    );

  } catch (error) {

    console.error(
      "========================================"
    );

    console.error(
      "GRADLINK SA PAYFAST ITN ERROR"
    );

    console.error(
      error
    );

    console.error(
      "========================================"
    );

    return response(
      "Server error",
      500
    );
  }
}


// ============================================================
// GET - BROWSER TEST
// ============================================================

export async function GET() {
  return response(
    "GradLink SA PayFast notification endpoint is online.",
    200
  );
}