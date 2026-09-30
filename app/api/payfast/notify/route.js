import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    console.log("========================================");
    console.log("GRADLINK SA PAYFAST ITN RECEIVED");
    console.log("========================================");

    const payfastMode = process.env.PAYFAST_MODE || "sandbox";

    const payfastEndpoint =
      payfastMode === "sandbox"
        ? "https://sandbox.payfast.co.za"
        : "https://www.payfast.co.za";

    console.log("PayFast mode:", payfastMode);
    console.log("PayFast endpoint:", payfastEndpoint);

    const contentType = request.headers.get("content-type") || "";

    console.log("PayFast Content-Type:", contentType);

    let params = {};

    /*
     * PayFast normally sends multipart/form-data.
     * We also support application/x-www-form-urlencoded.
     */

    if (contentType.includes("multipart/form-data")) {
      console.log("Parsing PayFast notification as multipart/form-data.");

      const formData = await request.formData();

      for (const [key, value] of formData.entries()) {
        params[key] = String(value);
      }
    } else {
      console.log("Parsing PayFast notification as URL encoded data.");

      const rawBody = await request.text();

      const searchParams = new URLSearchParams(rawBody);

      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
    }

    console.log("PayFast request parsed successfully.");

    console.log(
      "PayFast parameters received:",
      Object.keys(params)
    );

    const {
      m_payment_id,
      pf_payment_id,
      payment_status,
      amount_gross,
      amount_fee,
      amount_net,
      merchant_id,
      signature,
    } = params;

    console.log("m_payment_id:", m_payment_id);
    console.log("pf_payment_id:", pf_payment_id);
    console.log("payment_status:", payment_status);
    console.log("amount_gross:", amount_gross);
    console.log("amount_fee:", amount_fee);
    console.log("amount_net:", amount_net);
    console.log("merchant_id:", merchant_id);

    /*
     * ---------------------------------------------------------
     * REQUIRED PAYFAST VALUES
     * ---------------------------------------------------------
     */

    if (!m_payment_id) {
      throw new Error("Missing m_payment_id.");
    }

    if (!pf_payment_id) {
      throw new Error("Missing pf_payment_id.");
    }

    if (!payment_status) {
      throw new Error("Missing payment_status.");
    }

    if (!amount_gross) {
      throw new Error("Missing amount_gross.");
    }

    if (!merchant_id) {
      throw new Error("Missing merchant_id.");
    }

    if (!signature) {
      throw new Error("PayFast signature was not received.");
    }

    /*
     * ---------------------------------------------------------
     * PAYFAST SIGNATURE VERIFICATION
     * ---------------------------------------------------------
     */

    console.log(
      "PayFast signature received:",
      signature
    );

    /*
     * PayFast signature is calculated from all received fields
     * except the signature field itself.
     */

    const signatureData = Object.keys(params)
      .filter((key) => key !== "signature")
      .map((key) => {
        return (
          encodeURIComponent(key) +
          "=" +
          encodeURIComponent(params[key]).replace(/%20/g, "+")
        );
      })
      .join("&");

    const passphrase =
      process.env.PAYFAST_PASSPHRASE || "";

    let signatureString = signatureData;

    if (passphrase) {
      signatureString +=
        "&passphrase=" +
        encodeURIComponent(passphrase).replace(/%20/g, "+");
    }

    const calculatedSignature = crypto
      .createHash("md5")
      .update(signatureString)
      .digest("hex");

    console.log(
      "Calculated PayFast signature:",
      calculatedSignature
    );

    console.log(
      "Received PayFast signature:",
      signature
    );

    if (
      calculatedSignature.toLowerCase() !==
      signature.toLowerCase()
    ) {
      throw new Error(
        "PayFast signature verification failed."
      );
    }

    console.log(
      "PayFast signature verification PASSED."
    );

    /*
     * ---------------------------------------------------------
     * MERCHANT VERIFICATION
     * ---------------------------------------------------------
     */

    const expectedMerchantId =
      process.env.PAYFAST_MERCHANT_ID;

    if (
      expectedMerchantId &&
      String(merchant_id) !==
        String(expectedMerchantId)
    ) {
      throw new Error(
        `PayFast merchant ID mismatch. Received ${merchant_id}, expected ${expectedMerchantId}.`
      );
    }

    console.log(
      "PayFast merchant ID verified."
    );

    /*
     * ---------------------------------------------------------
     * PAYMENT STATUS
     * ---------------------------------------------------------
     */

    console.log(
      "PayFast payment status:",
      payment_status
    );

    if (
      String(payment_status).toUpperCase() !==
      "COMPLETE"
    ) {
      console.log(
        "Payment is not COMPLETE. No subscription activation."
      );

      return NextResponse.json({
        success: true,
        message:
          "PayFast notification received but payment is not COMPLETE.",
        payment_status,
      });
    }

    /*
     * ---------------------------------------------------------
     * EXTRACT GRADLINK SUBSCRIPTION ID
     *
     * Example:
     *
     * GL-4-1790367560936
     *
     * Subscription ID = 4
     * ---------------------------------------------------------
     */

    console.log(
      "GradLink m_payment_id:",
      m_payment_id
    );

    console.log(
      "Extracting subscription ID from:",
      m_payment_id
    );

    const paymentIdString =
      String(m_payment_id).trim();

    let subscriptionId = null;

    /*
     * Primary expected format:
     *
     * GL-4-1790367560936
     */

    const match =
      paymentIdString.match(
        /^GL-(\d+)-/
      );

    if (match && match[1]) {
      subscriptionId = Number(match[1]);
    }

    /*
     * Fallback:
     * Find the number immediately after GL-
     */

    if (!subscriptionId) {
      const fallbackMatch =
        paymentIdString.match(
          /GL-(\d+)/
        );

      if (
        fallbackMatch &&
        fallbackMatch[1]
      ) {
        subscriptionId =
          Number(fallbackMatch[1]);
      }
    }

    console.log(
      "Extracted subscription ID:",
      subscriptionId
    );

    if (
      !Number.isInteger(subscriptionId) ||
      subscriptionId <= 0
    ) {
      throw new Error(
        `Could not extract subscription ID from m_payment_id: ${m_payment_id}`
      );
    }

    console.log(
      "Subscription ID extracted successfully:",
      subscriptionId
    );

    /*
     * ---------------------------------------------------------
     * VERIFY AMOUNT
     * ---------------------------------------------------------
     */

    const verifiedAmount =
      Number(amount_gross);

    if (
      !Number.isFinite(verifiedAmount) ||
      verifiedAmount <= 0
    ) {
      throw new Error(
        `Invalid PayFast amount: ${amount_gross}`
      );
    }

    console.log(
      "Verified PayFast amount:",
      verifiedAmount
    );

    /*
     * ---------------------------------------------------------
     * PAYMENT REFERENCE
     * ---------------------------------------------------------
     */

    const paymentReference =
      String(pf_payment_id).trim();

    console.log(
      "PayFast payment reference:",
      paymentReference
    );

    /*
     * ---------------------------------------------------------
     * SUPABASE ACTIVATE-PAYFAST EDGE FUNCTION
     * ---------------------------------------------------------
     */

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL;

    if (!supabaseUrl) {
      throw new Error(
        "Supabase URL environment variable is missing."
      );
    }

    /*
     * IMPORTANT:
     *
     * Remove any trailing slash so that we don't create:
     *
     * https://project.supabase.co//functions/v1/...
     *
     * Instead we create:
     *
     * https://project.supabase.co/functions/v1/...
     */

    const cleanSupabaseUrl =
      supabaseUrl.replace(/\/+$/, "");

    const edgeFunctionUrl =
      `${cleanSupabaseUrl}/functions/v1/activate-payfast`;

    console.log(
      "Calling Supabase activate-payfast Edge Function."
    );

    console.log(
      "Edge Function URL:",
      edgeFunctionUrl
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
      verifiedAmount
    );

    /*
     * IMPORTANT:
     *
     * We deliberately do NOT require the Supabase
     * secret/service-role key here.
     *
     * The activate-payfast Edge Function must have
     * verify_jwt = false because PayFast itself does
     * not send a Supabase JWT.
     */

    const edgeFunctionResponse =
      await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          subscription_id:
            subscriptionId,
          payment_reference:
            paymentReference,
          amount:
            verifiedAmount,
        }),
      });

    const edgeFunctionText =
      await edgeFunctionResponse.text();

    console.log(
      "activate-payfast HTTP status:",
      edgeFunctionResponse.status
    );

    console.log(
      "activate-payfast response:",
      edgeFunctionText
    );

    if (!edgeFunctionResponse.ok) {
      throw new Error(
        `activate-payfast failed with HTTP ${edgeFunctionResponse.status}: ${edgeFunctionText}`
      );
    }

    /*
     * ---------------------------------------------------------
     * SUCCESS
     * ---------------------------------------------------------
     */

    console.log("========================================");
    console.log(
      "GRADLINK SA PAYFAST ITN SUCCESS"
    );
    console.log("========================================");

    return NextResponse.json({
      success: true,
      message:
        "PayFast payment verified and subscription activation requested.",
      subscription_id:
        subscriptionId,
      payment_reference:
        paymentReference,
      amount:
        verifiedAmount,
      payment_status,
    });
  } catch (error) {
    console.log("========================================");
    console.log(
      "GRADLINK SA PAYFAST ITN ERROR"
    );
    console.log("========================================");

    console.error("Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 400,
      }
    );
  }
}

/*
 * Optional GET endpoint so opening the URL in a browser
 * confirms that the endpoint exists.
 */

export async function GET() {
  return NextResponse.json({
    success: true,
    message:
      "GradLink SA PayFast notification endpoint is online",
  });
}