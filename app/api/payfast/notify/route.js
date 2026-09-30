import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// GRADLINK SA - PAYFAST ITN NOTIFICATION
// ============================================================

// IMPORTANT:
// This route receives PayFast ITN notifications.
// It verifies the PayFast signature BEFORE activating
// the GradLink subscription.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================================
// ENVIRONMENT
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const PAYFAST_MODE =
  String(process.env.PAYFAST_MODE || "sandbox").toLowerCase();

const PAYFAST_MERCHANT_ID =
  PAYFAST_MODE === "sandbox"
    ? process.env.PAYFAST_SANDBOX_MERCHANT_ID
    : process.env.PAYFAST_MERCHANT_ID;

const PAYFAST_MERCHANT_KEY =
  PAYFAST_MODE === "sandbox"
    ? process.env.PAYFAST_SANDBOX_MERCHANT_KEY
    : process.env.PAYFAST_MERCHANT_KEY;

const PAYFAST_PASSPHRASE =
  PAYFAST_MODE === "sandbox"
    ? process.env.PAYFAST_SANDBOX_PASSPHRASE ||
      process.env.PAYFAST_PASSPHRASE
    : process.env.PAYFAST_PASSPHRASE;

// ============================================================
// SUPABASE SERVER CLIENT
// ============================================================

function getSupabaseAdmin() {
  if (!SUPABASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!SUPABASE_SECRET_KEY) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================
// EXTRACT SUBSCRIPTION ID
// ============================================================
//
// Expected GradLink PayFast payment ID:
//
// GL-4-1790367560936
//
// Parts:
//
// GL
// 4               <- subscription ID
// 1790367560936   <- timestamp
//
// Therefore:
//
// GL-4-1790367560936
//    ^
//    subscription ID = 4
// ============================================================

function extractSubscriptionId(mPaymentId) {
  if (!mPaymentId) {
    console.log("No m_payment_id received.");
    return null;
  }

  const value = String(mPaymentId).trim();

  console.log("Extracting subscription ID from:", value);

  // Expected format:
  // GL-<subscriptionId>-<timestamp>
  const match = value.match(/^GL-([^-]+)-([^-]+)$/);

  if (!match) {
    console.log(
      "m_payment_id does not match expected GradLink format:",
      value
    );

    return null;
  }

  const subscriptionId = match[1];

  console.log("Extracted subscription ID:", subscriptionId);

  return subscriptionId;
}

// ============================================================
// PAYFAST SIGNATURE
// ============================================================

function generatePayFastSignature(data) {
  const fields = [];

  for (const [key, value] of Object.entries(data)) {
    if (key === "signature") {
      continue;
    }

    if (value === undefined || value === null) {
      continue;
    }

    fields.push(
      `${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, "+")}`
    );
  }

  let parameterString = fields.join("&");

  // PayFast passphrase is optional.
  if (PAYFAST_PASSPHRASE) {
    parameterString +=
      `&passphrase=${encodeURIComponent(
        String(PAYFAST_PASSPHRASE).trim()
      ).replace(/%20/g, "+")}`;
  }

  return crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex");
}

// ============================================================
// PARSE REQUEST
// ============================================================

async function parsePayFastRequest(request) {
  const contentType = request.headers.get("content-type") || "";

  console.log("PayFast Content-Type:", contentType);

  // ----------------------------------------------------------
  // multipart/form-data
  // ----------------------------------------------------------

  if (contentType.includes("multipart/form-data")) {
    console.log(
      "Parsing PayFast notification as multipart/form-data."
    );

    const formData = await request.formData();

    const data = {};

    for (const [key, value] of formData.entries()) {
      data[key] =
        typeof value === "string"
          ? value
          : String(value);
    }

    console.log("PayFast request parsed successfully.");

    return data;
  }

  // ----------------------------------------------------------
  // application/x-www-form-urlencoded
  // ----------------------------------------------------------

  if (
    contentType.includes(
      "application/x-www-form-urlencoded"
    )
  ) {
    console.log(
      "Parsing PayFast notification as application/x-www-form-urlencoded."
    );

    const rawBody = await request.text();

    const params = new URLSearchParams(rawBody);

    const data = {};

    for (const [key, value] of params.entries()) {
      data[key] = value;
    }

    console.log("PayFast request parsed successfully.");

    return data;
  }

  // ----------------------------------------------------------
  // application/json
  // ----------------------------------------------------------

  if (contentType.includes("application/json")) {
    console.log(
      "Parsing PayFast notification as application/json."
    );

    const data = await request.json();

    console.log("PayFast request parsed successfully.");

    return data;
  }

  // ----------------------------------------------------------
  // FALLBACK
  // ----------------------------------------------------------

  console.log(
    "Unknown PayFast content type. Attempting form parsing."
  );

  try {
    const formData = await request.formData();

    const data = {};

    for (const [key, value] of formData.entries()) {
      data[key] =
        typeof value === "string"
          ? value
          : String(value);
    }

    return data;
  } catch (error) {
    console.error(
      "Fallback PayFast parsing failed:",
      error
    );

    throw new Error(
      "Unable to parse PayFast notification."
    );
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(request) {
  console.log("========================================");
  console.log("GRADLINK SA PAYFAST ITN RECEIVED");
  console.log("========================================");

  try {
    console.log("PayFast mode:", PAYFAST_MODE);

    console.log(
      "PayFast endpoint:",
      PAYFAST_MODE === "sandbox"
        ? "https://sandbox.payfast.co.za"
        : "https://www.payfast.co.za"
    );

    // --------------------------------------------------------
    // PARSE PAYFAST REQUEST
    // --------------------------------------------------------

    const data = await parsePayFastRequest(request);

    console.log(
      "PayFast parameters received:",
      Object.keys(data)
    );

    // --------------------------------------------------------
    // LOG IMPORTANT VALUES
    // --------------------------------------------------------

    console.log("m_payment_id:", data.m_payment_id);
    console.log("pf_payment_id:", data.pf_payment_id);
    console.log("payment_status:", data.payment_status);
    console.log("amount_gross:", data.amount_gross);
    console.log("amount_fee:", data.amount_fee);
    console.log("amount_net:", data.amount_net);
    console.log("merchant_id:", data.merchant_id);

    // --------------------------------------------------------
    // SIGNATURE
    // --------------------------------------------------------

    const receivedSignature = data.signature;

    if (!receivedSignature) {
      console.log("PayFast signature was not received.");

      return new NextResponse(
        "PayFast signature was not received.",
        {
          status: 400,
        }
      );
    }

    console.log(
      "PayFast signature received:",
      receivedSignature
    );

    // --------------------------------------------------------
    // VERIFY SIGNATURE
    // --------------------------------------------------------

    const calculatedSignature =
      generatePayFastSignature(data);

    console.log(
      "Calculated PayFast signature:",
      calculatedSignature
    );

    console.log(
      "Received PayFast signature:",
      receivedSignature
    );

    if (
      calculatedSignature.toLowerCase() !==
      String(receivedSignature).trim().toLowerCase()
    ) {
      console.log("PayFast signature verification FAILED.");

      return new NextResponse(
        "PayFast signature verification failed.",
        {
          status: 400,
        }
      );
    }

    console.log(
      "PayFast signature verification PASSED."
    );

    // --------------------------------------------------------
    // VERIFY MERCHANT ID
    // --------------------------------------------------------

    if (
      PAYFAST_MERCHANT_ID &&
      String(data.merchant_id).trim() !==
        String(PAYFAST_MERCHANT_ID).trim()
    ) {
      console.log("PayFast merchant ID mismatch.");

      return new NextResponse(
        "PayFast merchant ID mismatch.",
        {
          status: 400,
        }
      );
    }

    console.log("PayFast merchant ID verified.");

    // --------------------------------------------------------
    // VERIFY PAYMENT STATUS
    // --------------------------------------------------------

    const paymentStatus = String(
      data.payment_status || ""
    )
      .trim()
      .toUpperCase();

    if (paymentStatus !== "COMPLETE") {
      console.log(
        "PayFast payment is not COMPLETE:",
        paymentStatus
      );

      return new NextResponse(
        "Payment not complete.",
        {
          status: 200,
        }
      );
    }

    console.log("PayFast payment status: COMPLETE");

    // --------------------------------------------------------
    // m_payment_id
    // --------------------------------------------------------

    const mPaymentId = String(
      data.m_payment_id || ""
    ).trim();

    if (!mPaymentId) {
      console.log("Missing m_payment_id.");

      return new NextResponse(
        "Missing m_payment_id.",
        {
          status: 400,
        }
      );
    }

    console.log(
      "GradLink m_payment_id:",
      mPaymentId
    );

    // --------------------------------------------------------
    // EXTRACT SUBSCRIPTION ID
    // --------------------------------------------------------

    const subscriptionId =
      extractSubscriptionId(mPaymentId);

    if (!subscriptionId) {
      console.log(
        "Could not extract subscription ID from m_payment_id."
      );

      return new NextResponse(
        "Could not extract subscription ID from m_payment_id.",
        {
          status: 400,
        }
      );
    }

    console.log(
      "Subscription ID extracted successfully:",
      subscriptionId
    );

    // --------------------------------------------------------
    // AMOUNT
    // --------------------------------------------------------

    const amount = Number(
      data.amount_gross
    );

    if (!Number.isFinite(amount)) {
      console.log(
        "Invalid PayFast amount:",
        data.amount_gross
      );

      return new NextResponse(
        "Invalid payment amount.",
        {
          status: 400,
        }
      );
    }

    console.log(
      "Verified PayFast amount:",
      amount
    );

    // --------------------------------------------------------
    // PAYFAST PAYMENT REFERENCE
    // --------------------------------------------------------

    const paymentReference =
      String(
        data.pf_payment_id ||
          data.m_payment_id ||
          ""
      ).trim();

    if (!paymentReference) {
      console.log(
        "Missing PayFast payment reference."
      );

      return new NextResponse(
        "Missing PayFast payment reference.",
        {
          status: 400,
        }
      );
    }

    console.log(
      "PayFast payment reference:",
      paymentReference
    );

    // --------------------------------------------------------
    // ACTIVATE SUBSCRIPTION
    // --------------------------------------------------------

    const supabase = getSupabaseAdmin();

    const activateFunctionUrl =
      `${SUPABASE_URL}/functions/v1/activate-payfast`;

    console.log(
      "Calling activate-payfast:",
      activateFunctionUrl
    );

    const activationResponse = await fetch(
      activateFunctionUrl,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          // The Edge Function is configured with
          // verify_jwt=false, so this is only supplied
          // when the environment value exists.
          ...(SUPABASE_SECRET_KEY
            ? {
                Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
              }
            : {}),
        },

        body: JSON.stringify({
          subscription_id: subscriptionId,
          payment_reference: paymentReference,
          amount: amount,
        }),
      }
    );

    const activationText =
      await activationResponse.text();

    console.log(
      "activate-payfast HTTP status:",
      activationResponse.status
    );

    console.log(
      "activate-payfast response:",
      activationText
    );

    if (!activationResponse.ok) {
      console.error(
        "activate-payfast failed."
      );

      return new NextResponse(
        "Payment verified, but subscription activation failed.",
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    console.log(
      "========================================"
    );

    console.log(
      "GRADLINK SA SUBSCRIPTION ACTIVATION SUCCESSFUL"
    );

    console.log(
      "Subscription ID:",
      subscriptionId
    );

    console.log(
      "Payment reference:",
      paymentReference
    );

    console.log(
      "Amount:",
      amount
    );

    console.log(
      "========================================"
    );

    return new NextResponse(
      "OK",
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "========================================"
    );

    console.error(
      "GRADLINK SA PAYFAST ITN ERROR"
    );

    console.error(error);

    console.error(
      "========================================"
    );

    return new NextResponse(
      "PayFast notification processing failed.",
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// GET
// ============================================================

export async function GET() {
  return new NextResponse(
    "GradLink SA PayFast notification endpoint is online.",
    {
      status: 200,
    }
  );
}