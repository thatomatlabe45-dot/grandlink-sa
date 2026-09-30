import { NextResponse } from "next/server";
import crypto from "crypto";

// ============================================================
// GRADLINK SA - PAYFAST ITN NOTIFICATION
// ============================================================
// IMPORTANT:
// - This route does NOT require SUPABASE_SECRET_KEY.
// - This route does NOT require SUPABASE_SERVICE_ROLE_KEY.
// - Supabase activation is handled by the existing
//   activate-payfast Edge Function.
// ============================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const PAYFAST_MODE =
  (process.env.PAYFAST_MODE || "sandbox").toLowerCase();

const PAYFAST_MERCHANT_ID =
  process.env.PAYFAST_MERCHANT_ID ||
  process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID;

const PAYFAST_PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE || "";

const PAYFAST_ENDPOINT =
  PAYFAST_MODE === "sandbox"
    ? "https://sandbox.payfast.co.za"
    : "https://www.payfast.co.za";

// ============================================================
// HELPERS
// ============================================================

function logHeader(title) {
  console.log("");
  console.log("========================================");
  console.log(title);
  console.log("========================================");
}

function md5(value) {
  return crypto
    .createHash("md5")
    .update(value, "utf8")
    .digest("hex");
}

// ============================================================
// PAYFAST SIGNATURE
// ============================================================
// PayFast signs the received fields in their original order,
// excluding the signature field itself.
// ============================================================

function calculatePayFastSignature(data) {
  const pairs = [];

  for (const [key, value] of Object.entries(data)) {
    if (key === "signature") {
      continue;
    }

    if (value === null || value === undefined) {
      continue;
    }

    const stringValue = String(value).trim();

    pairs.push(
      `${key}=${encodeURIComponent(stringValue).replace(/%20/g, "+")}`
    );
  }

  let parameterString = pairs.join("&");

  if (PAYFAST_PASSPHRASE) {
    parameterString +=
      `&passphrase=${encodeURIComponent(PAYFAST_PASSPHRASE).replace(
        /%20/g,
        "+"
      )}`;
  }

  return md5(parameterString);
}

// ============================================================
// PARSE PAYFAST REQUEST
// ============================================================

async function parsePayFastRequest(request) {
  const contentType =
    request.headers.get("content-type") || "";

  console.log(`PayFast Content-Type: ${contentType}`);

  // ----------------------------------------------------------
  // MULTIPART/FORM-DATA
  // ----------------------------------------------------------

  if (
    contentType.toLowerCase().includes("multipart/form-data")
  ) {
    console.log(
      "Parsing PayFast notification as multipart/form-data."
    );

    const formData = await request.formData();

    const data = {};

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        data[key] = value;
      } else {
        data[key] = String(value);
      }
    }

    console.log(
      "PayFast request parsed successfully."
    );

    return data;
  }

  // ----------------------------------------------------------
  // APPLICATION/X-WWW-FORM-URLENCODED
  // ----------------------------------------------------------

  if (
    contentType
      .toLowerCase()
      .includes("application/x-www-form-urlencoded")
  ) {
    console.log(
      "Parsing PayFast notification as application/x-www-form-urlencoded."
    );

    const body = await request.text();

    const params = new URLSearchParams(body);

    const data = {};

    for (const [key, value] of params.entries()) {
      data[key] = value;
    }

    console.log(
      "PayFast request parsed successfully."
    );

    return data;
  }

  // ----------------------------------------------------------
  // FALLBACK
  // ----------------------------------------------------------

  console.log(
    "Unknown PayFast content type. Attempting URL-encoded parsing."
  );

  const body = await request.text();

  const params = new URLSearchParams(body);

  const data = {};

  for (const [key, value] of params.entries()) {
    data[key] = value;
  }

  return data;
}

// ============================================================
// EXTRACT SUBSCRIPTION ID
// ============================================================

function extractSubscriptionId(mPaymentId) {
  if (!mPaymentId) {
    return null;
  }

  const value = String(mPaymentId).trim();

  console.log(
    `Extracting subscription ID from: ${value}`
  );

  // Expected format:
  //
  // GL-4-1790367560936
  //    ^
  //    subscription ID
  //

  const match = value.match(/^GL-(\d+)-/i);

  if (match) {
    const subscriptionId = Number(match[1]);

    console.log(
      `Extracted subscription ID: ${subscriptionId}`
    );

    return subscriptionId;
  }

  // Fallback in case the format changes.
  const parts = value.split("-");

  if (parts.length >= 3) {
    const possibleId = Number(parts[1]);

    if (Number.isInteger(possibleId)) {
      console.log(
        `Extracted subscription ID using fallback: ${possibleId}`
      );

      return possibleId;
    }
  }

  return null;
}

// ============================================================
// CALL EXISTING SUPABASE EDGE FUNCTION
// ============================================================

async function activateSubscription({
  subscriptionId,
  paymentReference,
  amount,
}) {
  if (!SUPABASE_URL) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  const functionUrl =
    `${SUPABASE_URL}/functions/v1/activate-payfast`;

  console.log("");
  console.log(
    "Calling Supabase activate-payfast Edge Function."
  );
  console.log(`Edge Function URL: ${functionUrl}`);
  console.log(
    `Subscription ID: ${subscriptionId}`
  );
  console.log(
    `Payment reference: ${paymentReference}`
  );
  console.log(`Amount: ${amount}`);

  const response = await fetch(functionUrl, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      subscription_id: subscriptionId,
      payment_reference: String(paymentReference),
      amount: Number(amount),
    }),

    cache: "no-store",
  });

  const responseText = await response.text();

  console.log(
    `activate-payfast HTTP status: ${response.status}`
  );

  console.log(
    `activate-payfast response: ${responseText}`
  );

  if (!response.ok) {
    throw new Error(
      `activate-payfast failed with HTTP ${response.status}: ${responseText}`
    );
  }

  return responseText;
}

// ============================================================
// POST
// ============================================================

export async function POST(request) {
  logHeader(
    "GRADLINK SA PAYFAST ITN RECEIVED"
  );

  try {
    console.log(
      `PayFast mode: ${PAYFAST_MODE}`
    );

    console.log(
      `PayFast endpoint: ${PAYFAST_ENDPOINT}`
    );

    // --------------------------------------------------------
    // PARSE REQUEST
    // --------------------------------------------------------

    const data =
      await parsePayFastRequest(request);

    console.log(
      "PayFast parameters received:",
      Object.keys(data)
    );

    // --------------------------------------------------------
    // BASIC VALUES
    // --------------------------------------------------------

    const mPaymentId =
      data.m_payment_id || "";

    const pfPaymentId =
      data.pf_payment_id || "";

    const paymentStatus =
      data.payment_status || "";

    const amountGross =
      data.amount_gross || "";

    const merchantId =
      data.merchant_id || "";

    const receivedSignature =
      data.signature || "";

    console.log(
      `m_payment_id: ${mPaymentId}`
    );

    console.log(
      `pf_payment_id: ${pfPaymentId}`
    );

    console.log(
      `payment_status: ${paymentStatus}`
    );

    console.log(
      `amount_gross: ${amountGross}`
    );

    console.log(
      `amount_fee: ${data.amount_fee || ""}`
    );

    console.log(
      `amount_net: ${data.amount_net || ""}`
    );

    console.log(
      `merchant_id: ${merchantId}`
    );

    console.log(
      `PayFast signature received: ${receivedSignature}`
    );

    // --------------------------------------------------------
    // REQUIRE SIGNATURE
    // --------------------------------------------------------

    if (!receivedSignature) {
      throw new Error(
        "PayFast signature was not received"
      );
    }

    // --------------------------------------------------------
    // CALCULATE SIGNATURE
    // --------------------------------------------------------

    const calculatedSignature =
      calculatePayFastSignature(data);

    console.log(
      `Calculated PayFast signature: ${calculatedSignature}`
    );

    console.log(
      `Received PayFast signature: ${receivedSignature}`
    );

    // --------------------------------------------------------
    // VERIFY SIGNATURE
    // --------------------------------------------------------

    if (
      calculatedSignature.toLowerCase() !==
      receivedSignature.toLowerCase()
    ) {
      throw new Error(
        "PayFast signature verification FAILED"
      );
    }

    console.log(
      "PayFast signature verification PASSED."
    );

    // --------------------------------------------------------
    // VERIFY MERCHANT ID
    // --------------------------------------------------------

    if (!PAYFAST_MERCHANT_ID) {
      throw new Error(
        "Missing PAYFAST_MERCHANT_ID"
      );
    }

    if (
      String(merchantId) !==
      String(PAYFAST_MERCHANT_ID)
    ) {
      throw new Error(
        `PayFast merchant ID mismatch. Received ${merchantId}, expected ${PAYFAST_MERCHANT_ID}`
      );
    }

    console.log(
      "PayFast merchant ID verified."
    );

    // --------------------------------------------------------
    // VERIFY PAYMENT STATUS
    // --------------------------------------------------------

    console.log(
      `PayFast payment status: ${paymentStatus}`
    );

    if (
      paymentStatus.toUpperCase() !==
      "COMPLETE"
    ) {
      console.log(
        `Payment status is ${paymentStatus}; subscription will not be activated.`
      );

      return new NextResponse(
        "Payment received but not COMPLETE.",
        {
          status: 200,
        }
      );
    }

    // --------------------------------------------------------
    // VERIFY M_PAYMENT_ID
    // --------------------------------------------------------

    console.log(
      `GradLink m_payment_id: ${mPaymentId}`
    );

    if (!mPaymentId) {
      throw new Error(
        "Missing m_payment_id"
      );
    }

    // --------------------------------------------------------
    // EXTRACT SUBSCRIPTION ID
    // --------------------------------------------------------

    const subscriptionId =
      extractSubscriptionId(mPaymentId);

    if (!subscriptionId) {
      throw new Error(
        `Could not extract subscription ID from m_payment_id: ${mPaymentId}`
      );
    }

    console.log(
      `Subscription ID extracted successfully: ${subscriptionId}`
    );

    // --------------------------------------------------------
    // VERIFY AMOUNT
    // --------------------------------------------------------

    const verifiedAmount =
      Number.parseFloat(amountGross);

    if (
      !Number.isFinite(verifiedAmount)
    ) {
      throw new Error(
        `Invalid PayFast amount: ${amountGross}`
      );
    }

    console.log(
      `Verified PayFast amount: ${verifiedAmount}`
    );

    // --------------------------------------------------------
    // PAYMENT REFERENCE
    // --------------------------------------------------------

    if (!pfPaymentId) {
      throw new Error(
        "Missing PayFast payment reference"
      );
    }

    const paymentReference =
      String(pfPaymentId).trim();

    console.log(
      `PayFast payment reference: ${paymentReference}`
    );

    // ========================================================
    // ACTIVATE THROUGH EDGE FUNCTION
    // ========================================================
    //
    // NO SUPABASE SECRET KEY REQUIRED HERE.
    //
    // The activate-payfast Edge Function handles the
    // database operation server-side.
    // ========================================================

    const activationResult =
      await activateSubscription({
        subscriptionId,
        paymentReference,
        amount: verifiedAmount,
      });

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    logHeader(
      "GRADLINK SA PAYFAST ITN SUCCESS"
    );

    console.log(
      `Subscription ${subscriptionId} activation request completed.`
    );

    console.log(
      `Payment reference: ${paymentReference}`
    );

    console.log(
      `Amount: ${verifiedAmount}`
    );

    console.log(
      `Edge Function result: ${activationResult}`
    );

    return new NextResponse(
      "OK",
      {
        status: 200,
      }
    );
  } catch (error) {
    // --------------------------------------------------------
    // ERROR
    // --------------------------------------------------------

    logHeader(
      "GRADLINK SA PAYFAST ITN ERROR"
    );

    console.error(
      "Error:",
      error
    );

    return new NextResponse(
      `PayFast ITN error: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
      {
        status: 400,
      }
    );
  }
}

// ============================================================
// GET
// ============================================================

export async function GET() {
  return new NextResponse(
    "GradLink SA PayFast notification endpoint is online",
    {
      status: 200,
    }
  );
}