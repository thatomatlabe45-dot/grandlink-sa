import { NextResponse } from "next/server";
import crypto from "crypto";

// ============================================================
// PAYFAST NOTIFICATION ENDPOINT
// Supports:
// - multipart/form-data
// - application/x-www-form-urlencoded
// - PayFast signature verification
// - activate-payfast Supabase Edge Function
// ============================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const PAYFAST_PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE || "";

const PAYFAST_MERCHANT_ID =
  process.env.PAYFAST_MERCHANT_ID || "";


// ============================================================
// SIMPLE LOGGING
// ============================================================

function log(...args) {
  console.log("[PAYFAST NOTIFY]", ...args);
}


// ============================================================
// CREATE PAYFAST SIGNATURE
// ============================================================

function generatePayFastSignature(data) {
  const pairs = [];

  for (const [key, value] of Object.entries(data)) {
    if (key === "signature") {
      continue;
    }

    if (value === null || value === undefined) {
      continue;
    }

    pairs.push(
      `${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, "+")}`
    );
  }

  let parameterString = pairs.join("&");

  // PayFast passphrase
  if (PAYFAST_PASSPHRASE) {
    parameterString +=
      `&passphrase=${encodeURIComponent(PAYFAST_PASSPHRASE).replace(
        /%20/g,
        "+"
      )}`;
  }

  return crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex");
}


// ============================================================
// CONSTANT-TIME SIGNATURE COMPARISON
// ============================================================

function signaturesMatch(a, b) {
  if (!a || !b) {
    return false;
  }

  const aBuffer = Buffer.from(String(a).toLowerCase(), "utf8");
  const bBuffer = Buffer.from(String(b).toLowerCase(), "utf8");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}


// ============================================================
// CONVERT FORM DATA TO NORMAL OBJECT
// ============================================================

function formDataToObject(formData) {
  const data = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      data[key] = value;
    } else {
      // PayFast should not normally send files.
      // Convert unexpected file values to their name.
      data[key] = value?.name || String(value);
    }
  }

  return data;
}


// ============================================================
// PARSE URL-ENCODED BODY
// ============================================================

function parseUrlEncodedBody(body) {
  const params = new URLSearchParams(body);
  const data = {};

  for (const [key, value] of params.entries()) {
    data[key] = value;
  }

  return data;
}


// ============================================================
// EXTRACT SUBSCRIPTION ID
//
// Example:
// GL-4-1790367560936
//
// Produces:
// 4
// ============================================================

function extractSubscriptionId(paymentId) {
  if (!paymentId) {
    return null;
  }

  const value = String(paymentId).trim();

  // Expected GradLink format:
  // GL-{subscription_id}-{timestamp}
  const match = value.match(/^GL-([^-]+)-/i);

  if (match) {
    return match[1];
  }

  // Fallback in case the payment ID is simply GL-4
  const simpleMatch = value.match(/^GL-([^-]+)$/i);

  if (simpleMatch) {
    return simpleMatch[1];
  }

  return null;
}


// ============================================================
// MAIN POST HANDLER
// ============================================================

export async function POST(request) {
  try {
    log("--------------------------------------------------");
    log("PayFast notification received");
    log("Method:", request.method);
    log("Content-Type:", request.headers.get("content-type"));

    // ========================================================
    // READ PAYFAST BODY
    // ========================================================

    const contentType =
      request.headers.get("content-type") || "";

    let data = {};

    // --------------------------------------------------------
    // MULTIPART/FORM-DATA
    // --------------------------------------------------------

    if (
      contentType.toLowerCase().includes("multipart/form-data")
    ) {
      log("Parsing multipart/form-data");

      const formData = await request.formData();

      data = formDataToObject(formData);
    }

    // --------------------------------------------------------
    // URL-ENCODED
    // --------------------------------------------------------

    else if (
      contentType
        .toLowerCase()
        .includes("application/x-www-form-urlencoded")
    ) {
      log("Parsing application/x-www-form-urlencoded");

      const body = await request.text();

      data = parseUrlEncodedBody(body);
    }

    // --------------------------------------------------------
    // JSON FALLBACK
    // --------------------------------------------------------

    else if (
      contentType.toLowerCase().includes("application/json")
    ) {
      log("Parsing application/json");

      data = await request.json();
    }

    // --------------------------------------------------------
    // UNKNOWN CONTENT TYPE
    // --------------------------------------------------------

    else {
      log("Unknown content type. Attempting formData().");

      try {
        const formData = await request.formData();
        data = formDataToObject(formData);
      } catch {
        const body = await request.text();
        data = parseUrlEncodedBody(body);
      }
    }


    // ========================================================
    // LOG RECEIVED PARAMETERS
    // ========================================================

    log(
      "Received PayFast parameter names:",
      Object.keys(data)
    );

    log(
      "m_payment_id:",
      data.m_payment_id || "(missing)"
    );

    log(
      "pf_payment_id:",
      data.pf_payment_id || "(missing)"
    );

    log(
      "payment_status:",
      data.payment_status || "(missing)"
    );

    log(
      "amount_gross:",
      data.amount_gross || "(missing)"
    );

    log(
      "signature received:",
      data.signature ? "YES" : "NO"
    );


    // ========================================================
    // CHECK SIGNATURE
    // ========================================================

    const receivedSignature =
      data.signature;

    if (!receivedSignature) {
      log("ERROR: PayFast signature was not received");

      return new NextResponse(
        "PayFast signature was not received",
        {
          status: 400,
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );
    }


    // ========================================================
    // GENERATE EXPECTED SIGNATURE
    // ========================================================

    const expectedSignature =
      generatePayFastSignature(data);

    log(
      "Expected signature:",
      expectedSignature
    );

    log(
      "Received signature:",
      receivedSignature
    );


    // ========================================================
    // VERIFY SIGNATURE
    // ========================================================

    if (
      !signaturesMatch(
        receivedSignature,
        expectedSignature
      )
    ) {
      log("ERROR: PayFast signature mismatch");

      return new NextResponse(
        "PayFast signature mismatch",
        {
          status: 400,
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );
    }

    log("PayFast signature verified successfully");


    // ========================================================
    // VERIFY MERCHANT ID WHEN CONFIGURED
    // ========================================================

    if (PAYFAST_MERCHANT_ID) {
      const receivedMerchantId =
        String(data.merchant_id || "").trim();

      if (
        receivedMerchantId !==
        String(PAYFAST_MERCHANT_ID).trim()
      ) {
        log(
          "ERROR: Merchant ID mismatch",
          {
            received: receivedMerchantId,
          }
        );

        return new NextResponse(
          "Merchant ID mismatch",
          {
            status: 400,
            headers: {
              "Content-Type": "text/plain",
            },
          }
        );
      }

      log("Merchant ID verified");
    }


    // ========================================================
    // PAYMENT STATUS
    // ========================================================

    const paymentStatus =
      String(data.payment_status || "")
        .trim()
        .toUpperCase();

    log(
      "Payment status:",
      paymentStatus
    );

    // We only activate a subscription after PayFast says
    // the payment is COMPLETE.
    if (paymentStatus !== "COMPLETE") {
      log(
        "Payment is not COMPLETE. No activation performed."
      );

      // PayFast has successfully reached us.
      // Do not treat a pending/failed payment as an error.
      return new NextResponse(
        "Notification received but payment is not complete",
        {
          status: 200,
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );
    }


    // ========================================================
    // PAYMENT ID
    // ========================================================

    const paymentId =
      String(data.m_payment_id || "").trim();

    if (!paymentId) {
      log("ERROR: m_payment_id missing");

      return new NextResponse(
        "m_payment_id missing",
        {
          status: 400,
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );
    }


    // ========================================================
    // EXTRACT GRADLINK SUBSCRIPTION ID
    // ========================================================

    const subscriptionId =
      extractSubscriptionId(paymentId);

    log(
      "Extracted subscription ID:",
      subscriptionId
    );

    if (!subscriptionId) {
      log(
        "ERROR: Could not extract subscription ID from:",
        paymentId
      );

      return new NextResponse(
        "Invalid GradLink payment reference",
        {
          status: 400,
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );
    }


    // ========================================================
    // PAYMENT REFERENCE
    // ========================================================

    const paymentReference =
      String(
        data.pf_payment_id ||
          data.m_payment_id ||
          ""
      ).trim();

    const amount =
      String(
        data.amount_gross ||
          data.amount ||
          ""
      ).trim();


    log("Payment reference:", paymentReference);
    log("Amount:", amount);


    // ========================================================
    // CHECK SUPABASE CONFIGURATION
    // ========================================================

    if (!SUPABASE_URL) {
      log(
        "ERROR: NEXT_PUBLIC_SUPABASE_URL is missing"
      );

      return new NextResponse(
        "Supabase URL is not configured",
        {
          status: 500,
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );
    }


    if (!SUPABASE_ANON_KEY) {
      log(
        "ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing"
      );

      return new NextResponse(
        "Supabase public key is not configured",
        {
          status: 500,
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );
    }


    // ========================================================
    // CALL activate-payfast EDGE FUNCTION
    // ========================================================

    const functionUrl =
      `${SUPABASE_URL.replace(/\/$/, "")}` +
      `/functions/v1/activate-payfast`;

    log(
      "Calling activate-payfast:",
      functionUrl
    );

    const activationResponse =
      await fetch(functionUrl, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization:
            `Bearer ${SUPABASE_ANON_KEY}`,

          apikey:
            SUPABASE_ANON_KEY,
        },

        body: JSON.stringify({
          subscription_id:
            subscriptionId,

          payment_reference:
            paymentReference,

          amount:
            amount,
        }),

        cache: "no-store",
      });


    // ========================================================
    // READ ACTIVATION RESPONSE
    // ========================================================

    const activationText =
      await activationResponse.text();

    log(
      "activate-payfast status:",
      activationResponse.status
    );

    log(
      "activate-payfast response:",
      activationText
    );


    // ========================================================
    // ACTIVATION FAILED
    // ========================================================

    if (!activationResponse.ok) {
      log(
        "ERROR: activate-payfast failed"
      );

      return new NextResponse(
        "Payment verified but subscription activation failed",
        {
          status: 500,
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );
    }


    // ========================================================
    // SUCCESS
    // ========================================================

    log(
      "=================================================="
    );

    log(
      "PAYMENT VERIFIED AND SUBSCRIPTION ACTIVATED"
    );

    log(
      "Subscription:",
      subscriptionId
    );

    log(
      "Payment reference:",
      paymentReference
    );

    log(
      "=================================================="
    );


    return new NextResponse(
      "OK",
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );

  } catch (error) {
    // ========================================================
    // UNEXPECTED ERROR
    // ========================================================

    console.error(
      "[PAYFAST NOTIFY] Unexpected error:",
      error
    );

    return new NextResponse(
      "Internal notification error",
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );
  }
}


// ============================================================
// GET HANDLER
// ============================================================

export async function GET() {
  return new NextResponse(
    "GradLink SA PayFast notification endpoint is online",
    {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    }
  );
}