import { NextResponse } from "next/server";
import crypto from "crypto";

const PLANS = {
  starter: {
    name: "Starter",
    price: "500.00",
  },

  professional: {
    name: "Professional",
    price: "1000.00",
  },

  enterprise: {
    name: "Enterprise",
    price: "1500.00",
  },
};

export async function POST(request) {
  try {
    const body = await request.json();

    const plan = body.plan;

    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        {
          error: "Invalid plan selected.",
        },
        { status: 400 }
      );
    }

    const selectedPlan = PLANS[plan];

    const merchantId = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    const mode = process.env.PAYFAST_MODE || "sandbox";

    if (!merchantId || !merchantKey || !passphrase) {
      return NextResponse.json(
        {
          error: "PayFast environment variables are missing.",
        },
        { status: 500 }
      );
    }

    const baseUrl =
      mode === "sandbox"
        ? "https://sandbox.payfast.co.za"
        : "https://www.payfast.co.za";

    const paymentData = {
      merchant_id: merchantId,
      merchant_key: merchantKey,

      return_url: "https://grandlink-sa.vercel.app/company-pricing?payment=success",
      cancel_url: "https://grandlink-sa.vercel.app/company-pricing?payment=cancelled",
      notify_url: "https://grandlink-sa.vercel.app/api/payfast/notify",

      name_first: "GradLink",
      name_last: "Company",

      email_address:
        body.email || "gradlinksa@tuta.com",

      m_payment_id: `GL-${Date.now()}`,

      amount: selectedPlan.price,

      item_name: `GradLink SA ${selectedPlan.name} Plan`,
      item_description: `GradLink SA ${selectedPlan.name} company subscription`,
    };

    const signatureString = Object.entries(paymentData)
      .filter(
        ([key, value]) =>
          value !== undefined &&
          value !== null &&
          value !== ""
      )
      .map(
        ([key, value]) =>
          `${key}=${encodeURIComponent(String(value).trim())}`
      )
      .join("&");

    const stringToHash = passphrase
      ? `${signatureString}&passphrase=${encodeURIComponent(
          passphrase.trim()
        )}`
      : signatureString;

    const signature = crypto
      .createHash("md5")
      .update(stringToHash)
      .digest("hex");

    paymentData.signature = signature;

    return NextResponse.json({
      success: true,
      paymentUrl: `${baseUrl}/eng/process`,
      paymentData,
    });
  } catch (error) {
    console.error("PayFast create payment error:", error);

    return NextResponse.json(
      {
        error: "Unable to create PayFast payment.",
      },
      { status: 500 }
    );
  }
}
