import { NextResponse } from "next/server";
import crypto from "crypto";

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
    // 5. CALCULATE EXACT PAYMENT AMOUNT
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
    // 7. PAYFAST URL
    // ----------------------------------------------------------

    const baseUrl =
      mode.toLowerCase() === "sandbox"
        ? "https://sandbox.payfast.co.za"
        : "https://www.payfast.co.za";

    // ----------------------------------------------------------
    // 8. CREATE UNIQUE PAYMENT ID
    // ----------------------------------------------------------

    /*
     * The subscription ID is included in the payment ID.
     *
     * Example:
     *
     * GL-SUB-123-1750000000000
     *
     * This allows the notify route to identify
     * the exact subscription that belongs to
     * this payment.
     */

    const paymentId =
      `GL-${subscriptionId}-${Date.now()}`;

    // ----------------------------------------------------------
    // 9. PAYFAST PAYMENT DATA
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
    // 10. CREATE PAYFAST SIGNATURE
    // ----------------------------------------------------------

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

    const signature =
      crypto
        .createHash("md5")
        .update(stringToHash)
        .digest("hex");

    paymentData.signature = signature;

    // ----------------------------------------------------------
    // 11. RETURN PAYFAST CHECKOUT INFORMATION
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