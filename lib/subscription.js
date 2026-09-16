"use client";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================
// GET COMPANY SUBSCRIPTION
// ============================================================

export async function getCompanySubscription(companyId) {
  if (!companyId) {
    return null;
  }

  const { data, error } = await supabase
    .from("company_subscriptions")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Subscription error:", error);
    return null;
  }

  return data;
}

// ============================================================
// CHECK IF PREMIUM IS ACTIVE
// ============================================================

export async function hasPremiumAccess(companyId) {
  const subscription = await getCompanySubscription(companyId);

  if (!subscription) {
    return false;
  }

  return subscription.status === "active";
}

// ============================================================
// GET PREMIUM STATUS
// ============================================================

export async function getPremiumStatus(companyId) {
  const subscription = await getCompanySubscription(companyId);

  if (!subscription) {
    return {
      isPremium: false,
      status: "inactive",
      subscription: null,
    };
  }

  return {
    isPremium: subscription.status === "active",
    status: subscription.status,
    subscription,
  };
}