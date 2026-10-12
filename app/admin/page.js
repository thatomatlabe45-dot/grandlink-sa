"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================
// PROFILE SCORE
// ============================================================

function calculateMatch(graduate) {
  let score = 0;
  const reasons = [];

  if (graduate.qualification) {
    score += 35;
    reasons.push("Qualification added");
  }

  if (graduate.field_of_study) {
    score += 25;
    reasons.push("Field of study added");
  }

  if (graduate.institution) {
    score += 15;
    reasons.push("Institution provided");
  }

  if (graduate.cv_url) {
    score += 15;
    reasons.push("CV uploaded");
  }

  if (graduate.qualification_url) {
    score += 10;
    reasons.push("Certificate uploaded");
  }

  let label = "Possible Match";

  if (score >= 80) {
    label = "Strong Match";
  } else if (score >= 60) {
    label = "Good Match";
  }

  return {
    score,
    label,
    reason: reasons.join(" • ") || "Profile information is incomplete.",
  };
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(value) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value) {
  return `R${Number(value || 0).toLocaleString("en-ZA")}`;
}

function normaliseStatus(value) {
  return String(value || "unknown").toLowerCase();
}

function getStatusStyle(status) {
  const value = normaliseStatus(status);

  if (["active", "approved", "published", "open"].includes(value)) {
    return "statusActive";
  }

  if (["pending", "inactive"].includes(value)) {
    return "statusPending";
  }

  if (["rejected", "expired", "closed", "cancelled"].includes(value)) {
    return "statusRejected";
  }

  return "statusNeutral";
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorised, setAuthorised] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [graduates, setGraduates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [internships, setInternships] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);

  const [graduateSearch, setGraduateSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [internshipSearch, setInternshipSearch] = useState("");

  const [openingDocument, setOpeningDocument] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  // ==========================================================
  // CHECK ADMIN AND LOAD DATA
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function initialise() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        // Preserve the existing administrator access check.
        const { data: adminData, error: adminError } =
          await supabase
            .from("admins")
            .select("id, user_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (adminError) {
          throw new Error(
            "Could not verify administrator access. Please try again."
          );
        }

        if (!adminData) {
          router.replace("/");
          return;
        }

        if (!mounted) return;

        setAuthorised(true);

        await loadDashboardData(mounted);
      } catch (err) {
        if (mounted) {
          setError(
            err.message || "Could not load the admin dashboard."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialise();

    const handlePageShow = () => {
      setOpeningDocument("");
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      mounted = false;
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [router]);

  // ==========================================================
  // LOAD DASHBOARD DATA
  // ==========================================================

  async function loadDashboardData(mounted = true) {
    const [
      graduatesResult,
      companiesResult,
      subscriptionsResult,
      internshipsResult,
      paymentsResult,
    ] = await Promise.all([
      supabase
        .from("graduates")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("companies")
        .select(
          "id, user_id, company_name, email, industry, province, city, logo_url, created_at"
        )
        .order("company_name", { ascending: true }),

      supabase
        .from("company_subscriptions")
        .select(
          "id, company_id, plan, status, monthly_price, payment_provider, payment_reference, current_period_end, created_at"
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("internships")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("payment_requests")
        .select("id, company_id, payment_amount, status, submitted_at"),
    ]);

    if (!mounted) return;

    const problems = [];

    if (graduatesResult.error) {
      problems.push("Graduate profiles could not be loaded.");
    } else {
      setGraduates(graduatesResult.data || []);
    }

    if (companiesResult.error) {
      problems.push("Company profiles could not be loaded.");
    } else {
      setCompanies(companiesResult.data || []);
    }

    if (subscriptionsResult.error) {
      problems.push("Subscription information could not be loaded.");
    } else {
      setSubscriptions(subscriptionsResult.data || []);
    }

    if (internshipsResult.error) {
      problems.push("Internship listings could not be loaded.");
    } else {
      setInternships(internshipsResult.data || []);
    }

    if (paymentsResult.error) {
      problems.push("Payment request information could not be loaded.");
    } else {
      setPaymentRequests(paymentsResult.data || []);
    }

    setError(problems.join(" "));
  }

  // ==========================================================
  // REFRESH DASHBOARD
  // ==========================================================

  async function refreshDashboard() {
    setRefreshing(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: adminData, error: adminError } =
        await supabase
          .from("admins")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (adminError || !adminData) {
        setAuthorised(false);
        setError("Administrator access could not be verified.");
        return;
      }

      await loadDashboardData(true);
    } catch (err) {
      setError(err.message || "Could not refresh dashboard data.");
    } finally {
      setRefreshing(false);
    }
  }

  // ==========================================================
  // OPEN GRADUATE DOCUMENT
  // ==========================================================

  async function openDocument(documentPath, documentName) {
    try {
      setError("");
      setOpeningDocument(documentName);

      if (!documentPath) {
        alert(`${documentName} is not available for this graduate.`);
        setOpeningDocument("");
        return;
      }

      if (
        documentPath.startsWith("http://") ||
        documentPath.startsWith("https://")
      ) {
        window.location.assign(documentPath);
        return;
      }

      let filePath = documentPath;

      try {
        filePath = decodeURIComponent(filePath);
      } catch {}

      filePath = filePath.replace(/^\/+/, "");
      filePath = filePath.replace(/^documents\//i, "");

      if (filePath.includes("/storage/v1/object/")) {
        const parts = filePath.split("/documents/");

        if (parts.length > 1) {
          filePath = parts[1];
        }
      }

      filePath = filePath.split("?")[0];
      filePath = filePath.split("#")[0];

      if (!filePath) {
        alert(`The ${documentName} file path is empty.`);
        setOpeningDocument("");
        return;
      }

      const { data, error: signedError } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 3600);

      if (signedError || !data?.signedUrl) {
        throw new Error(
          signedError?.message ||
            `Could not create a secure link for ${documentName}.`
        );
      }

      window.location.assign(data.signedUrl);
    } catch (err) {
      alert(
        `Could not open ${documentName}.\n\n${
          err.message || "Please try again."
        }`
      );

      setOpeningDocument("");
    }
  }

  // ==========================================================
  // SIGN OUT
  // ==========================================================

  async function signOut() {
    const confirmed = window.confirm(
      "Are you sure you want to sign out of the admin dashboard?"
    );

    if (!confirmed) return;

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError("Could not sign out. Please try again.");
      return;
    }

    router.replace("/login");
  }

  // ==========================================================
  // DERIVED STATISTICS
  // ==========================================================

  const activeSubscriptions = subscriptions.filter(
    (item) => normaliseStatus(item.status) === "active"
  );

  const pendingPayments = paymentRequests.filter(
    (item) => normaliseStatus(item.status) === "pending"
  );

  const activeInternships = internships.filter((item) => {
    const status = normaliseStatus(item.status);

    const deadline = item.deadline
      ? new Date(item.deadline)
      : null;

    const notExpired =
      !deadline ||
      Number.isNaN(deadline.getTime()) ||
      deadline >= new Date();

    return (
      !["closed", "expired", "inactive"].includes(status) &&
      notExpired
    );
  });

  const companySubscriptionMap = useMemo(() => {
    const map = {};

    subscriptions.forEach((subscription) => {
      if (!map[subscription.company_id]) {
        map[subscription.company_id] = subscription;
      }
    });

    return map;
  }, [subscriptions]);

  const graduateResults = useMemo(() => {
    const term = graduateSearch.trim().toLowerCase();

    return [...graduates]
      .filter((person) => {
        const text = [
          person.full_name,
          person.email,
          person.qualification,
          person.field_of_study,
          person.province,
          person.institution,
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(term);
      })
      .sort(
        (a, b) =>
          calculateMatch(b).score - calculateMatch(a).score
      );
  }, [graduates, graduateSearch]);

  const companyResults = useMemo(() => {
    const term = companySearch.trim().toLowerCase();

    return companies.filter((company) => {
      const text = [
        company.company_name,
        company.email,
        company.industry,
        company.province,
        company.city,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [companies, companySearch]);

  const internshipResults = useMemo(() => {
    const term = internshipSearch.trim().toLowerCase();

    return internships.filter((internship) => {
      const text = [
        internship.title,
        internship.job_title,
        internship.company_name,
        internship.province,
        internship.location,
        internship.field_of_study,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [internships, internshipSearch]);

  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {
    return (
      <main className="loadingPage">
        <div className="brandMark">G</div>
        <div className="loadingSpinner" />
        <h2>Securing your admin session</h2>
        <p>Verifying access and preparing your dashboard…</p>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (!authorised) {
    return (
      <main className="loadingPage">
        <div className="brandMark">G</div>
        <h2>Administrator access required</h2>
        <p>This area is restricted to authorised administrators.</p>

        {error && <div className="alert errorAlert">{error}</div>}

        <button className="primaryButton" onClick={() => router.replace("/")}>
          Return to homepage
        </button>

        <style jsx>{styles}</style>
      </main>
    );
  }

  // ==========================================================
  // MAIN DASHBOARD
  // ==========================================================

  return (
    <main className="adminPage">
      <aside className="sidebar">
        <a className="brand" href="/admin">
          <span className="brandMark">G</span>
          <span>
            <strong>GradLink SA</strong>
            <small>Admin Console</small>
          </span>
        </a>

        <div className="navLabel">WORKSPACE</div>

        <button
          className={`navItem ${
            activeSection === "overview" ? "navActive" : ""
          }`}
          onClick={() => {
            setActiveSection("overview");
            document
              .getElementById("overview")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <span>◫</span>
          Overview
        </button>

        <button
          className={`navItem ${
            activeSection === "companies" ? "navActive" : ""
          }`}
          onClick={() => {
            setActiveSection("companies");
            document
              .getElementById("companies")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <span>▦</span>
          Companies
          <span className="navCount">{companies.length}</span>
        </button>

        <button
          className={`navItem ${
            activeSection === "subscriptions" ? "navActive" : ""
          }`}
          onClick={() => {
            setActiveSection("subscriptions");
            document
              .getElementById("subscriptions")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <span>◇</span>
          Subscriptions
        </button>

        <button
          className={`navItem ${
            activeSection === "internships" ? "navActive" : ""
          }`}
          onClick={() => {
            setActiveSection("internships");
            document
              .getElementById("internships")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <span>▤</span>
          Internships
          <span className="navCount">{internships.length}</span>
        </button>

        <button
          className={`navItem ${
            activeSection === "graduates" ? "navActive" : ""
          }`}
          onClick={() => {
            setActiveSection("graduates");
            document
              .getElementById("graduates")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <span>♙</span>
          Graduates
          <span className="navCount">{graduates.length}</span>
        </button>

        <div className="navLabel financeLabel">FINANCE</div>

        <button
          className="navItem"
          onClick={() => router.push("/admin/payment")}
        >
          <span>▣</span>
          Payment Reviews
          {pendingPayments.length > 0 && (
            <span className="pendingCount">{pendingPayments.length}</span>
          )}
        </button>

        <div className="sidebarBottom">
          <div className="secureBox">
            <span className="secureIcon">✓</span>
            <div>
              <strong>Secure admin area</strong>
              <small>Authorised access only</small>
            </div>
          </div>

          <button className="navItem signOutItem" onClick={signOut}>
            <span>↪</span>
            Sign out
          </button>

          <button
            className="homeLink"
            onClick={() => router.push("/")}
          >
            ← Return to website
          </button>
        </div>
      </aside>

      <div className="mainArea">
        <header className="topbar">
          <div>
            <span className="topEyebrow">ADMINISTRATION</span>
            <h1>Platform overview</h1>
          </div>

          <div className="topActions">
            <span className="adminStatus">
              <span className="onlineDot" />
              Admin session active
            </span>

            <button
              className="refreshButton"
              onClick={refreshDashboard}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>
        </header>

        <div className="dashboardContent">
          {error && (
            <div className="alert errorAlert">
              <span>!</span>
              <div>{error}</div>
              <button onClick={() => setError("")}>×</button>
            </div>
          )}

          {/* OVERVIEW */}

          <section id="overview" className="welcomeSection">
            <div>
              <p className="eyebrow">YOUR CONTROL CENTRE</p>
              <h2>Welcome to GradLink SA Admin</h2>
              <p>
                Monitor graduates, companies, subscriptions, internships,
                and incoming bank payments from one place.
              </p>
            </div>

            <button
              className="heroPaymentButton"
              onClick={() => router.push("/admin/payment")}
            >
              <span className="paymentButtonIcon">▣</span>
              <span>
                <strong>Review payments</strong>
                <small>
                  {pendingPayments.length} awaiting review
                </small>
              </span>
              <span className="arrowIcon">→</span>
            </button>
          </section>

          {/* STATISTICS */}

          <section className="statsGrid">
            <button
              className="statCard"
              onClick={() =>
                document
                  .getElementById("graduates")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <div className="statTop">
                <span className="statIcon blueIcon">♙</span>
                <span className="statCaption">COMMUNITY</span>
              </div>
              <strong className="statNumber">{graduates.length}</strong>
              <span className="statName">Graduate profiles</span>
              <span className="statFoot">Registered graduates</span>
            </button>

            <button
              className="statCard"
              onClick={() =>
                document
                  .getElementById("companies")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <div className="statTop">
                <span className="statIcon purpleIcon">▦</span>
                <span className="statCaption">BUSINESS</span>
              </div>
              <strong className="statNumber">{companies.length}</strong>
              <span className="statName">Registered companies</span>
              <span className="statFoot">Company profiles</span>
            </button>

            <button
              className="statCard"
              onClick={() =>
                document
                  .getElementById("subscriptions")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <div className="statTop">
                <span className="statIcon greenIcon">◇</span>
                <span className="statCaption">REVENUE</span>
              </div>
              <strong className="statNumber">
                {activeSubscriptions.length}
              </strong>
              <span className="statName">Active subscriptions</span>
              <span className="statFoot">Currently active plans</span>
            </button>

            <button
              className="statCard"
              onClick={() => router.push("/admin/payment")}
            >
              <div className="statTop">
                <span className="statIcon orangeIcon">◷</span>
                <span className="statCaption">ACTION REQUIRED</span>
              </div>
              <strong className="statNumber">{pendingPayments.length}</strong>
              <span className="statName">Pending payments</span>
              <span className="statFoot">Awaiting manual verification</span>
            </button>
          </section>

          {/* QUICK LINKS */}

          <section className="quickLinksSection">
            <div className="sectionHeading">
              <div>
                <h2>Quick access</h2>
                <p>Jump directly to the section you need.</p>
              </div>
            </div>

            <div className="quickLinksGrid">
              <button
                className="quickLink"
                onClick={() => router.push("/admin/payment")}
              >
                <span className="quickIcon blueIcon">▣</span>
                <span className="quickLinkText">
                  <strong>Payment reviews</strong>
                  <small>Approve or reject bank transfers</small>
                </span>
                <span className="quickArrow">→</span>
              </button>

              <button
                className="quickLink"
                onClick={() => {
                  setActiveSection("companies");
                  document
                    .getElementById("companies")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="quickIcon purpleIcon">▦</span>
                <span className="quickLinkText">
                  <strong>Company management</strong>
                  <small>View registered business profiles</small>
                </span>
                <span className="quickArrow">→</span>
              </button>

              <button
                className="quickLink"
                onClick={() => {
                  setActiveSection("subscriptions");
                  document
                    .getElementById("subscriptions")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="quickIcon greenIcon">◇</span>
                <span className="quickLinkText">
                  <strong>Subscriptions</strong>
                  <small>Review company plans and statuses</small>
                </span>
                <span className="quickArrow">→</span>
              </button>

              <button
                className="quickLink"
                onClick={() => {
                  setActiveSection("internships");
                  document
                    .getElementById("internships")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="quickIcon orangeIcon">▤</span>
                <span className="quickLinkText">
                  <strong>Internship listings</strong>
                  <small>Monitor opportunities on the platform</small>
                </span>
                <span className="quickArrow">→</span>
              </button>
            </div>
          </section>

          {/* COMPANIES */}

          <section id="companies" className="dataSection">
            <div className="sectionHeading">
              <div>
                <p className="eyebrow">BUSINESS DIRECTORY</p>
                <h2>Company management</h2>
                <p>
                  {companies.length} registered company profiles, ordered
                  alphabetically.
                </p>
              </div>

              <span className="sectionCount">{companies.length} companies</span>
            </div>

            <input
              className="searchInput"
              type="search"
              placeholder="Search company name, email, industry or province…"
              value={companySearch}
              onChange={(event) => setCompanySearch(event.target.value)}
            />

            {companyResults.length === 0 ? (
              <div className="emptyState">
                <strong>No companies found</strong>
                <p>Try another search term.</p>
              </div>
            ) : (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Industry</th>
                      <th>Location</th>
                      <th>Subscription</th>
                      <th>Registered</th>
                    </tr>
                  </thead>

                  <tbody>
                    {companyResults.map((company) => {
                      const subscription =
                        companySubscriptionMap[company.user_id];

                      return (
                        <tr key={company.id || company.user_id}>
                          <td>
                            <div className="tableCompany">
                              {company.logo_url ? (
                                <img
                                  src={company.logo_url}
                                  alt=""
                                  className="tableLogo"
                                />
                              ) : (
                                <span className="tableLogoFallback">
                                  {(company.company_name || "C")
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}

                              <div>
                                <strong>
                                  {company.company_name || "Unnamed company"}
                                </strong>
                                <small>
                                  {company.email || "No email provided"}
                                </small>
                              </div>
                            </div>
                          </td>

                          <td>{company.industry || "Not provided"}</td>

                          <td>
                            {[company.city, company.province]
                              .filter(Boolean)
                              .join(", ") || "Not provided"}
                          </td>

                          <td>
                            {subscription ? (
                              <span
                                className={`statusPill ${getStatusStyle(
                                  subscription.status
                                )}`}
                              >
                                {subscription.plan || "Plan"} ·{" "}
                                {subscription.status || "Unknown"}
                              </span>
                            ) : (
                              <span className="mutedText">
                                No subscription
                              </span>
                            )}
                          </td>

                          <td>{formatDate(company.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* SUBSCRIPTIONS */}

          <section id="subscriptions" className="dataSection">
            <div className="sectionHeading">
              <div>
                <p className="eyebrow">COMPANY PLANS</p>
                <h2>Subscription management</h2>
                <p>
                  Monitor subscription status, plan pricing, and period end
                  dates.
                </p>
              </div>

              <span className="sectionCount">
                {activeSubscriptions.length} active
              </span>
            </div>

            {subscriptions.length === 0 ? (
              <div className="emptyState">
                <strong>No subscriptions found</strong>
                <p>Subscription records will appear here when available.</p>
              </div>
            ) : (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Plan</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Period ends</th>
                    </tr>
                  </thead>

                  <tbody>
                    {subscriptions.map((subscription) => {
                      const company = companies.find(
                        (item) => item.user_id === subscription.company_id
                      );

                      return (
                        <tr key={subscription.id}>
                          <td>
                            <strong>
                              {company?.company_name || "Company not found"}
                            </strong>
                            <small className="tableSubtext">
                              Subscription #{subscription.id}
                            </small>
                          </td>

                          <td>
                            <span className="planName">
                              {subscription.plan || "Not specified"}
                            </span>
                          </td>

                          <td>
                            <strong>
                              {formatMoney(subscription.monthly_price)}
                            </strong>
                            <small className="tableSubtext">
                              Stored subscription price
                            </small>
                          </td>

                          <td>
                            <span
                              className={`statusPill ${getStatusStyle(
                                subscription.status
                              )}`}
                            >
                              {subscription.status || "Unknown"}
                            </span>
                          </td>

                          <td>
                            {formatDate(subscription.current_period_end)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p className="sectionNote">
              This section displays subscription records. Payment approvals
              and subscription activation remain controlled by the secure
              Payment Reviews workflow.
            </p>
          </section>

          {/* INTERNSHIPS */}

          <section id="internships" className="dataSection">
            <div className="sectionHeading">
              <div>
                <p className="eyebrow">OPPORTUNITIES</p>
                <h2>Internship listings</h2>
                <p>
                  {activeInternships.length} listings currently counted as
                  active or not expired.
                </p>
              </div>

              <span className="sectionCount">
                {internships.length} total listings
              </span>
            </div>

            <input
              className="searchInput"
              type="search"
              placeholder="Search job title, company or location…"
              value={internshipSearch}
              onChange={(event) => setInternshipSearch(event.target.value)}
            />

            {internshipResults.length === 0 ? (
              <div className="emptyState">
                <strong>No internship listings found</strong>
                <p>Try changing your search.</p>
              </div>
            ) : (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Opportunity</th>
                      <th>Company</th>
                      <th>Location</th>
                      <th>Deadline</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {internshipResults.map((internship) => {
                      const title =
                        internship.job_title ||
                        internship.title ||
                        "Untitled opportunity";

                      const status = internship.status || "Listed";

                      return (
                        <tr key={internship.id}>
                          <td>
                            <strong>{title}</strong>
                            <small className="tableSubtext">
                              {internship.internship_type ||
                                internship.field_of_study ||
                                "Internship"}
                            </small>
                          </td>

                          <td>
                            {internship.company_name || "Not provided"}
                          </td>

                          <td>
                            {[internship.location, internship.province]
                              .filter(Boolean)
                              .join(", ") || "Not provided"}
                          </td>

                          <td>{formatDate(internship.deadline)}</td>

                          <td>
                            <span
                              className={`statusPill ${getStatusStyle(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* GRADUATES */}

          <section id="graduates" className="dataSection">
            <div className="sectionHeading">
              <div>
                <p className="eyebrow">GRADUATE COMMUNITY</p>
                <h2>Graduate management</h2>
                <p>
                  Search profiles and view uploaded CVs and qualifications.
                </p>
              </div>

              <span className="sectionCount">
                {graduates.length} graduates
              </span>
            </div>

            <input
              className="searchInput"
              type="search"
              placeholder="Search graduates by name, email, qualification or province…"
              value={graduateSearch}
              onChange={(event) => setGraduateSearch(event.target.value)}
            />

            {graduateResults.length === 0 ? (
              <div className="emptyState">
                <strong>No graduate profiles found</strong>
                <p>Try another search term.</p>
              </div>
            ) : (
              <div className="graduateGrid">
                {graduateResults.map((person) => {
                  const match = calculateMatch(person);

                  return (
                    <article className="graduateCard" key={person.id}>
                      <div className="graduateHeader">
                        <div className="graduateAvatar">
                          {(person.full_name || "G")
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="graduateIdentity">
                          <h3>{person.full_name || "Graduate"}</h3>
                          <p>{person.email || "No email provided"}</p>
                        </div>
                      </div>

                      <div className="graduateDetails">
                        <div>
                          <span>Qualification</span>
                          <strong>
                            {person.qualification || "Not provided"}
                          </strong>
                        </div>

                        <div>
                          <span>Field of study</span>
                          <strong>
                            {person.field_of_study || "Not provided"}
                          </strong>
                        </div>

                        <div>
                          <span>Institution</span>
                          <strong>
                            {person.institution || "Not provided"}
                          </strong>
                        </div>

                        <div>
                          <span>Province</span>
                          <strong>
                            {person.province || "Not provided"}
                          </strong>
                        </div>

                        <div>
                          <span>Phone</span>
                          <strong>
                            {person.phone || "Not provided"}
                          </strong>
                        </div>
                      </div>

                      <div className="profileScore">
                        <div className="scoreTop">
                          <strong>Profile completeness score</strong>
                          <span>{match.score}%</span>
                        </div>

                        <div className="scoreTrack">
                          <div
                            className="scoreFill"
                            style={{ width: `${match.score}%` }}
                          />
                        </div>

                        <p>{match.reason}</p>
                      </div>

                      <div className="documentActions">
                        <button
                          className="documentButton"
                          disabled={openingDocument === "CV"}
                          onClick={() =>
                            openDocument(person.cv_url, "CV")
                          }
                        >
                          {openingDocument === "CV"
                            ? "Opening CV…"
                            : "View CV"}
                        </button>

                        <button
                          className="documentButton secondaryDocument"
                          disabled={openingDocument === "Qualification"}
                          onClick={() =>
                            openDocument(
                              person.qualification_url,
                              "Qualification"
                            )
                          }
                        >
                          {openingDocument === "Qualification"
                            ? "Opening…"
                            : "View qualification"}
                        </button>
                      </div>

                      <div className="documentStatus">
                        <span>
                          {person.cv_url ? "✓ CV uploaded" : "No CV uploaded"}
                        </span>
                        <span>
                          {person.qualification_url
                            ? "✓ Qualification uploaded"
                            : "No qualification uploaded"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <footer className="footer">
            <span>© GradLink SA · Admin Console</span>
            <span>Protect graduate information and verify payments carefully.</span>
          </footer>
        </div>
      </div>

      <style jsx>{styles}</style>
    </main>
  );
}

// ============================================================
// PREMIUM ADMIN DESIGN
// ============================================================

const styles = `
  :global(*) {
    box-sizing: border-box;
  }

  :global(html) {
    scroll-behavior: smooth;
    scroll-padding-top: 25px;
  }

  :global(body) {
    margin: 0;
    background: #f5f7fc;
    color: #172943;
    font-family: Arial, Helvetica, sans-serif;
  }

  :global(button),
  :global(input) {
    font: inherit;
  }

  .adminPage {
    min-height: 100vh;
    background: #f5f7fc;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 245px;
    display: flex;
    flex-direction: column;
    padding: 25px 15px 17px;
    background: #fff;
    border-right: 1px solid #e6ebf3;
    z-index: 20;
    overflow-y: auto;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 0 8px 29px;
    color: #152b4a;
    text-decoration: none;
  }

  .brand > span:last-child {
    display: grid;
    gap: 5px;
  }

  .brand strong {
    font-size: 15px;
    letter-spacing: -0.3px;
  }

  .brand small {
    color: #8290a5;
    font-size: 11px;
  }

  .brandMark {
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 13px;
    background: linear-gradient(145deg, #2f7af0, #1749aa);
    color: #fff;
    font-size: 22px;
    font-weight: 800;
    box-shadow: 0 5px 12px rgba(36, 91, 185, 0.2);
  }

  .navLabel {
    padding: 0 12px;
    margin: 0 0 10px;
    color: #9aa5b5;
    font-size: 9px;
    letter-spacing: 1.3px;
    font-weight: 800;
  }

  .financeLabel {
    margin-top: 28px;
  }

  .navItem {
    width: 100%;
    min-height: 43px;
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 12px;
    margin: 2px 0;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: #64748b;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .navItem > span:first-child {
    width: 19px;
    color: #8292aa;
    text-align: center;
    font-size: 17px;
  }

  .navItem:hover {
    color: #245db6;
    background: #f2f6fd;
  }

  .navItem.navActive {
    color: #225ab4;
    background: #edf4ff;
  }

  .navItem.navActive > span:first-child {
    color: #225ab4;
  }

  .navCount {
    margin-left: auto;
    color: #8190a5;
    font-size: 10px;
  }

  .pendingCount {
    margin-left: auto;
    padding: 3px 7px;
    border-radius: 20px;
    background: #fff0d3;
    color: #9b650c;
    font-size: 10px;
    font-weight: 800;
  }

  .sidebarBottom {
    margin-top: auto;
    padding-top: 28px;
  }

  .secureBox {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 19px;
    padding: 12px 10px;
    border: 1px solid #e3eee9;
    border-radius: 11px;
    background: #f7fcf9;
  }

  .secureIcon {
    width: 29px;
    height: 29px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 9px;
    background: #e0f5e9;
    color: #16845a;
    font-weight: 800;
  }

  .secureBox div {
    display: grid;
    gap: 4px;
  }

  .secureBox strong {
    color: #365b4c;
    font-size: 10px;
  }

  .secureBox small {
    color: #83988e;
    font-size: 9px;
  }

  .signOutItem {
    color: #a34a53;
  }

  .homeLink {
    padding: 12px;
    border: 0;
    background: transparent;
    color: #7e8ca1;
    font-size: 10px;
    cursor: pointer;
  }

  .mainArea {
    min-height: 100vh;
    margin-left: 245px;
  }

  .topbar {
    min-height: 86px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 18px 32px;
    border-bottom: 1px solid #e6ebf3;
    background: rgba(255, 255, 255, 0.96);
  }

  .topEyebrow {
    display: block;
    margin-bottom: 7px;
    color: #6b86ad;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.4px;
  }

  .topbar h1 {
    margin: 0;
    color: #1b2f4c;
    font-size: 22px;
    letter-spacing: -0.6px;
  }

  .topActions {
    display: flex;
    align-items: center;
    gap: 17px;
  }

  .adminStatus {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #74839a;
    font-size: 10px;
    font-weight: 700;
  }

  .onlineDot {
    width: 7px;
    height: 7px;
    display: inline-block;
    border-radius: 50%;
    background: #17a36a;
  }

  .refreshButton {
    padding: 10px 13px;
    border: 1px solid #dce5f0;
    border-radius: 9px;
    background: #fff;
    color: #345372;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .refreshButton:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .dashboardContent {
    max-width: 1500px;
    margin: 0 auto;
    padding: 28px 30px 12px;
  }

  .welcomeSection {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 27px;
    margin-bottom: 20px;
    border: 1px solid #e0e9f7;
    border-radius: 16px;
    background:
      radial-gradient(ellipse at 90% 0%, rgba(74, 137, 245, 0.12), transparent 40%),
      linear-gradient(110deg, #fff, #f9fbff);
  }

  .eyebrow {
    margin: 0 0 9px;
    color: #3974d2;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.3px;
  }

  .welcomeSection h2 {
    margin: 0;
    color: #1b3150;
    font-size: clamp(21px, 2.5vw, 28px);
    letter-spacing: -0.8px;
    line-height: 1.3;
  }

  .welcomeSection > div > p:last-child {
    max-width: 610px;
    margin: 10px 0 0;
    color: #718199;
    font-size: 12px;
    line-height: 1.8;
  }

  .heroPaymentButton {
    display: flex;
    align-items: center;
    gap: 11px;
    flex-shrink: 0;
    padding: 14px;
    border: 1px solid #d5e3fa;
    border-radius: 12px;
    background: #fff;
    color: #275db2;
    text-align: left;
    cursor: pointer;
    box-shadow: 0 4px 13px rgba(36, 91, 185, 0.05);
  }

  .paymentButtonIcon {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: #edf4ff;
    font-size: 18px;
  }

  .heroPaymentButton > span:nth-child(2) {
    display: grid;
    gap: 5px;
  }

  .heroPaymentButton strong {
    font-size: 11px;
  }

  .heroPaymentButton small {
    color: #8190a5;
    font-size: 10px;
  }

  .arrowIcon {
    font-size: 17px;
  }

  .statsGrid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 13px;
    margin-bottom: 27px;
  }

  .statCard {
    min-width: 0;
    padding: 17px;
    border: 1px solid #e5ebf3;
    border-radius: 13px;
    background: #fff;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s, transform 0.15s;
  }

  .statCard:hover {
    border-color: #b9cff2;
    transform: translateY(-2px);
  }

  .statTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 7px;
    margin-bottom: 16px;
  }

  .statIcon,
  .quickIcon {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 11px;
    font-size: 19px;
    font-weight: 800;
  }

  .blueIcon {
    background: #eaf2ff;
    color: #306bd0;
  }

  .purpleIcon {
    background: #f1ebff;
    color: #7956c8;
  }

  .greenIcon {
    background: #e5f8ef;
    color: #18855b;
  }

  .orangeIcon {
    background: #fff2df;
    color: #bd7a20;
  }

  .statCaption {
    color: #a0aabb;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-align: right;
  }

  .statNumber {
    display: block;
    color: #1b3150;
    font-size: 29px;
    letter-spacing: -1px;
  }

  .statName {
    display: block;
    margin-top: 5px;
    color: #536780;
    font-size: 11px;
    font-weight: 800;
  }

  .statFoot {
    display: block;
    margin-top: 9px;
    color: #9aa6b7;
    font-size: 9px;
    line-height: 1.5;
  }

  .quickLinksSection,
  .dataSection {
    padding: 23px;
    margin-bottom: 23px;
    border: 1px solid #e5ebf3;
    border-radius: 15px;
    background: #fff;
    box-shadow: 0 4px 15px rgba(28, 56, 97, 0.02);
    scroll-margin-top: 20px;
  }

  .sectionHeading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 20px;
  }

  .sectionHeading h2 {
    margin: 0;
    color: #203653;
    font-size: 18px;
    letter-spacing: -0.4px;
  }

  .sectionHeading p:not(.eyebrow) {
    margin: 7px 0 0;
    color: #8996a9;
    font-size: 11px;
    line-height: 1.6;
  }

  .sectionCount {
    padding: 7px 10px;
    border-radius: 20px;
    background: #eef4ff;
    color: #3868b4;
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
  }

  .quickLinksGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 11px;
  }

  .quickLink {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px;
    border: 1px solid #e7edf5;
    border-radius: 12px;
    background: #fff;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }

  .quickLink:hover {
    border-color: #c9d9f2;
    background: #fbfdff;
  }

  .quickLinkText {
    display: grid;
    gap: 5px;
    min-width: 0;
    flex: 1;
  }

  .quickLinkText strong {
    color: #2a405e;
    font-size: 11px;
  }

  .quickLinkText small {
    color: #8996a9;
    font-size: 10px;
    line-height: 1.5;
  }

  .quickArrow {
    color: #8293ac;
    font-size: 17px;
  }

  .searchInput {
    width: 100%;
    min-height: 44px;
    margin-bottom: 17px;
    padding: 12px 14px;
    border: 1px solid #dfe7f1;
    border-radius: 10px;
    outline: none;
    background: #fbfcff;
    color: #263d5b;
    font-size: 12px;
  }

  .searchInput:focus {
    border-color: #8fb4f2;
    box-shadow: 0 0 0 3px rgba(48, 107, 208, 0.08);
  }

  .searchInput::placeholder {
    color: #9aa6b7;
  }

  .tableWrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid #e9eef5;
    border-radius: 10px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  th {
    padding: 13px 14px;
    border-bottom: 1px solid #e8edf5;
    background: #f8faff;
    color: #8492a6;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    white-space: nowrap;
  }

  td {
    padding: 14px;
    border-bottom: 1px solid #edf1f6;
    color: #63738a;
    font-size: 11px;
    line-height: 1.6;
    vertical-align: middle;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  tbody tr:hover {
    background: #fbfdff;
  }

  td strong {
    color: #2b405d;
    font-size: 11px;
  }

  td small {
    display: block;
    margin-top: 4px;
    color: #91a0b2;
    font-size: 10px;
    overflow-wrap: anywhere;
  }

  .tableCompany {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 180px;
  }

  .tableCompany > div {
    min-width: 0;
  }

  .tableCompany strong {
    display: block;
    max-width: 190px;
    overflow-wrap: anywhere;
  }

  .tableLogo,
  .tableLogoFallback {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border: 1px solid #e4ebf4;
    border-radius: 9px;
    object-fit: contain;
    background: #f7faff;
  }

  .tableLogoFallback {
    display: grid;
    place-items: center;
    color: #3168c2;
    font-size: 16px;
    font-weight: 800;
  }

  .statusPill {
    display: inline-block;
    max-width: 180px;
    padding: 5px 8px;
    border-radius: 20px;
    font-size: 9px;
    font-weight: 800;
    line-height: 1.5;
    text-transform: capitalize;
    overflow-wrap: anywhere;
  }

  .statusActive {
    background: #e5f7ed;
    color: #18744e;
  }

  .statusPending {
    background: #fff3dc;
    color: #98630b;
  }

  .statusRejected {
    background: #ffeaed;
    color: #a83846;
  }

  .statusNeutral {
    background: #eef2f7;
    color: #66768d;
  }

  .mutedText {
    color: #9ba6b5;
    font-size: 10px;
  }

  .planName {
    color: #315f9f;
    font-weight: 800;
    text-transform: capitalize;
  }

  .tableSubtext {
    color: #91a0b2;
    font-size: 9px;
  }

  .sectionNote {
    margin: 14px 0 0;
    color: #8a98aa;
    font-size: 10px;
    line-height: 1.7;
  }

  .graduateGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .graduateCard {
    min-width: 0;
    padding: 17px;
    border: 1px solid #e6ecf4;
    border-radius: 12px;
    background: #fff;
  }

  .graduateHeader {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
    margin-bottom: 18px;
  }

  .graduateAvatar {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 13px;
    background: #eaf2ff;
    color: #2e67c7;
    font-size: 18px;
    font-weight: 800;
  }

  .graduateIdentity {
    min-width: 0;
  }

  .graduateIdentity h3 {
    margin: 0;
    color: #253b59;
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .graduateIdentity p {
    margin: 5px 0 0;
    color: #8795a9;
    font-size: 10px;
    overflow-wrap: anywhere;
  }

  .graduateDetails {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 12px;
  }

  .graduateDetails > div {
    min-width: 0;
    display: grid;
    gap: 5px;
  }

  .graduateDetails span {
    color: #8c99ab;
    font-size: 9px;
  }

  .graduateDetails strong {
    color: #425873;
    font-size: 10px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .profileScore {
    margin-top: 18px;
    padding: 13px;
    border-radius: 10px;
    background: #f3f7ff;
  }

  .scoreTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .scoreTop strong {
    color: #365171;
    font-size: 10px;
  }

  .scoreTop span {
    color: #2863bd;
    font-size: 13px;
    font-weight: 800;
  }

  .scoreTrack {
    height: 6px;
    margin-top: 10px;
    overflow: hidden;
    border-radius: 10px;
    background: #dfe8f7;
  }

  .scoreFill {
    height: 100%;
    border-radius: 10px;
    background: linear-gradient(90deg, #3479e4, #28a5b8);
  }

  .profileScore p {
    margin: 9px 0 0;
    color: #7c8da5;
    font-size: 9px;
    line-height: 1.7;
  }

  .documentActions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin-top: 15px;
  }

  .documentButton {
    min-width: 0;
    min-height: 38px;
    padding: 9px 7px;
    border: 1px solid #d8e5fb;
    border-radius: 8px;
    background: #edf4ff;
    color: #2e61b2;
    font-size: 10px;
    font-weight: 800;
    cursor: pointer;
  }

  .secondaryDocument {
    border-color: #d8eee4;
    background: #edf9f3;
    color: #187751;
  }

  .documentButton:disabled {
    opacity: 0.55;
    cursor: wait;
  }

  .documentStatus {
    display: flex;
    flex-wrap: wrap;
    gap: 7px 12px;
    margin-top: 12px;
    color: #7e8d9f;
    font-size: 9px;
  }

  .emptyState {
    padding: 35px 15px;
    border: 1px dashed #dbe4f0;
    border-radius: 11px;
    background: #fbfcff;
    text-align: center;
  }

  .emptyState strong {
    color: #425773;
    font-size: 12px;
  }

  .emptyState p {
    margin: 7px 0 0;
    color: #91a0b2;
    font-size: 11px;
    line-height: 1.6;
  }

  .alert {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 13px;
    margin-bottom: 18px;
    border-radius: 10px;
    font-size: 11px;
    line-height: 1.7;
  }

  .errorAlert {
    border: 1px solid #f2d1d5;
    background: #fff0f1;
    color: #a32d3b;
  }

  .errorAlert > span {
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 50%;
    background: #f9dfe2;
    font-weight: 800;
  }

  .errorAlert button {
    margin-left: auto;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 19px;
    cursor: pointer;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    padding: 10px 2px 23px;
    color: #9aa6b5;
    font-size: 9px;
    line-height: 1.7;
  }

  .loadingPage {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 25px;
    background: #f5f8fd;
    text-align: center;
  }

  .loadingPage h2 {
    margin: 20px 0 5px;
    color: #1c3353;
    font-size: 19px;
  }

  .loadingPage p {
    color: #7d8da3;
    font-size: 12px;
    line-height: 1.7;
  }

  .loadingSpinner {
    width: 26px;
    height: 26px;
    margin-top: 22px;
    border: 3px solid #dbe8fc;
    border-top-color: #2f71d7;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .primaryButton {
    padding: 12px 17px;
    border: 0;
    border-radius: 9px;
    background: #2867ca;
    color: white;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1150px) {
    .sidebar {
      width: 215px;
    }

    .mainArea {
      margin-left: 215px;
    }

    .dashboardContent {
      padding: 23px 20px 10px;
    }

    .statsGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .welcomeSection {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media (max-width: 760px) {
    .sidebar {
      position: relative;
      top: auto;
      left: auto;
      bottom: auto;
      width: 100%;
      padding: 13px 13px 10px;
      border-right: 0;
      border-bottom: 1px solid #e5ebf3;
    }

    .brand {
      padding: 0 3px 12px;
    }

    .brandMark {
      width: 37px;
      height: 37px;
      border-radius: 11px;
      font-size: 20px;
    }

    .navLabel,
    .sidebarBottom {
      display: none;
    }

    .sidebar > .navItem {
      width: auto;
      min-height: 37px;
      display: inline-flex;
      gap: 7px;
      padding: 8px 10px;
      margin: 3px 2px 0 0;
      border: 1px solid #e7edf5;
      border-radius: 9px;
      font-size: 10px;
    }

    .sidebar > .navItem > span:first-child {
      width: auto;
      font-size: 14px;
    }

    .navCount {
      display: none;
    }

    .mainArea {
      margin-left: 0;
    }

    .topbar {
      min-height: auto;
      align-items: flex-start;
      flex-direction: column;
      gap: 13px;
      padding: 19px 17px;
    }

    .topbar h1 {
      font-size: 20px;
    }

    .topActions {
      width: 100%;
      justify-content: space-between;
      gap: 10px;
    }

    .dashboardContent {
      padding: 17px 13px 5px;
    }

    .welcomeSection {
      padding: 19px;
      border-radius: 13px;
    }

    .welcomeSection h2 {
      font-size: 22px;
    }

    .welcomeSection > div > p:last-child {
      font-size: 11px;
    }

    .heroPaymentButton {
      width: 100%;
    }

    .heroPaymentButton > span:nth-child(2) {
      flex: 1;
    }

    .statsGrid {
      gap: 9px;
      margin-bottom: 17px;
    }

    .statCard {
      padding: 13px;
      border-radius: 11px;
    }

    .statTop {
      align-items: flex-start;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }

    .statIcon {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      font-size: 17px;
    }

    .statCaption {
      font-size: 7px;
      text-align: left;
    }

    .statNumber {
      font-size: 25px;
    }

    .statName {
      font-size: 10px;
      line-height: 1.5;
    }

    .statFoot {
      font-size: 9px;
    }

    .quickLinksSection,
    .dataSection {
      padding: 15px;
      margin-bottom: 16px;
      border-radius: 12px;
    }

    .sectionHeading {
      align-items: flex-start;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 15px;
    }

    .sectionHeading h2 {
      font-size: 17px;
    }

    .quickLinksGrid {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .quickLink {
      padding: 12px;
    }

    .quickIcon {
      width: 34px;
      height: 34px;
      font-size: 17px;
    }

    .searchInput {
      font-size: 12px;
      min-height: 43px;
    }

    .tableWrap {
      border-radius: 8px;
    }

    table {
      min-width: 610px;
    }

    th,
    td {
      padding: 12px 10px;
    }

    .graduateGrid {
      grid-template-columns: 1fr;
    }

    .graduateCard {
      padding: 14px;
    }

    .footer {
      flex-direction: column;
      gap: 4px;
    }
  }

  @media (max-width: 380px) {
    .sidebar > .navItem {
      gap: 5px;
      padding: 7px 8px;
      font-size: 9px;
    }

    .statsGrid {
      gap: 7px;
    }

    .statCard {
      padding: 11px;
    }

    .statNumber {
      font-size: 23px;
    }

    .statName {
      font-size: 9px;
    }

    .graduateDetails {
      gap: 12px 9px;
    }

    .documentActions {
      grid-template-columns: 1fr;
    }
  }
`;