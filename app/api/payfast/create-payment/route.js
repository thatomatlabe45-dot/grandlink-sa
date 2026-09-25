import { NextResponse } from "next/server";
import crypto from "crypto";

// ============================================================
// PLANS
// ============================================================

const PLANS = {
  starter: {
    name: "Starter",
    monthly: 500,
    annual: 5000,
  },

  professional: {
    name: "Professional",
    monthly: 950,
    annual: 9500,
  },

  enterprise: {
    name: "Enterprise",
    monthly: 1500,
    annual: 15000,
  },

  pay_per_listing: {
    name: "Pay Per Listing",
    price: 250,
  },
};

// ============================================================
// PAYFAST URL ENCODING
// ============================================================

function payFastEncode(value) {
  return encodeURIComponent(String(value))
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

// ============================================================
// CREATE PAYFAST SIGNATURE
// ============================================================

function generateSignature(data, passphrase) {
  const parameterString = Object.entries(data)
    .filter(
      ([key, value]) =>
        key !== "signature" &&
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
    )
    .map(
      ([key, value]) =>
        `${key}=${payFastEncode(String(value).trim())}`
    )
    .join("&");

  const stringToHash =
    `${parameterString}&passphrase=${payFastEncode(
      String(passphrase).trim()
    )}`;

  return crypto
    .createHash("md5")
    .update(stringToHash, "utf8")
    .digest("hex")
    .toLowerCase();
}

// ============================================================
// POST
// ============================================================

export async function POST(request) {
  try {
    // ----------------------------------------------------------
    // 1. READ REQUEST
    // ----------------------------------------------------------

    const body = await request.json();

    const {
      plan,
      billing,
      subscriptionId,
      email,
    } = body;

    // ----------------------------------------------------------
    // 2. VALIDATE PLAN
    // ----------------------------------------------------------

    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        {
          error: "Invalid plan selected.",
        },
        { status: 400 }
      );
    }

    const selectedPlan = PLANS[plan];

    // ----------------------------------------------------------
    // 3. VALIDATE BILLING
    // ----------------------------------------------------------

    let selectedBilling = billing;

    if (plan === "pay_per_listing") {
      selectedBilling = "listing";
    }

    if (
      plan !== "pay_per_listing" &&
      selectedBilling !== "monthly" &&
      selectedBilling !== "annual"
    ) {
      return NextResponse.json(
        {
          error: "Invalid billing option.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 4. VALIDATE SUBSCRIPTION ID
    // ----------------------------------------------------------

    if (!subscriptionId) {
      return NextResponse.json(
        {
          error: "Missing subscription ID.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 5. CALCULATE PAYMENT AMOUNT
    // ----------------------------------------------------------

    let amount;

    if (plan === "pay_per_listing") {
      amount = selectedPlan.price;
    } else if (selectedBilling === "annual") {
      amount = selectedPlan.annual;
    } else {
      amount = selectedPlan.monthly;
    }

    // ----------------------------------------------------------
    // 6. PAYFAST ENVIRONMENT VARIABLES
    // ----------------------------------------------------------

    const merchantId =
      process.env.PAYFAST_MERCHANT_ID;

    const merchantKey =
      process.env.PAYFAST_MERCHANT_KEY;

    const passphrase =
      process.env.PAYFAST_PASSPHRASE;

    const mode =
      process.env.PAYFAST_MODE || "sandbox";

    if (
      !merchantId ||
      !merchantKey ||
      !passphrase
    ) {
      console.error(
        "PayFast environment variables are missing."
      );

      return NextResponse.json(
        {
          error:
            "PayFast environment variables are missing.",
        },
        { status: 500 }
      );
    }

    // ----------------------------------------------------------
    // 7. PAYFAST CHECKOUT URL
    // ----------------------------------------------------------

    const baseUrl =
      mode.toLowerCase() === "sandbox"
        ? "https://sandbox.payfast.co.za"
        : "https://www.payfast.co.za";

    // ----------------------------------------------------------
    // 8. UNIQUE PAYMENT ID
    // ----------------------------------------------------------

    const paymentId =
      `GL-${subscriptionId}-${Date.now()}`;

    // ----------------------------------------------------------
    // 9. PAYMENT DATA
    // ----------------------------------------------------------

    const paymentData = {
      merchant_id: merchantId,

      merchant_key: merchantKey,

      return_url:
        "https://grandlink-sa.vercel.app/company-pricing?payment=success",

      cancel_url:
        "https://grandlink-sa.vercel.app/company-pricing?payment=cancelled",

      notify_url:
        "https://grandlink-sa.vercel.app/api/payfast/notify",

      name_first: "GradLink",

      name_last: "Company",

      email_address:
        email || "gradlinksa@tuta.com",

      m_payment_id: paymentId,

      amount: Number(amount).toFixed(2),

      item_name:
        `GradLink SA ${selectedPlan.name} Plan`,

      item_description:
        plan === "pay_per_listing"
          ? "GradLink SA Pay Per Listing"
          : `GradLink SA ${selectedPlan.name} ${selectedBilling} company subscription`,
    };

    // ----------------------------------------------------------
    // 10. GENERATE PAYFAST SIGNATURE
    // ----------------------------------------------------------

    const signature =
      generateSignature(
        paymentData,
        passphrase
      );

    paymentData.signature =
      signature;

    // ----------------------------------------------------------
    // 11. RETURN PAYMENT INFORMATION
    // ----------------------------------------------------------

    return NextResponse.json({
      success: true,

      paymentUrl:
        `${baseUrl}/eng/process`,

      paymentData,

      paymentId,

      amount,

      plan,

      billing: selectedBilling,
    });
  } catch (error) {
    console.error(
      "PayFast create payment error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create PayFast payment.",
      },
      { status: 500 }
    );
  }
}