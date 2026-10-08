"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function InternshipsPage() {
  const router = useRouter();

  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("All Provinces");
  const [workType, setWorkType] = useState("All Types");

  useEffect(() => {
    loadInternships();
  }, []);

  async function loadInternships() {
    try {
      setLoading(true);
      setError("");

      const { data, error: internshipsError } = await supabase
        .from("internships")
        .select(`
          id,
          title,
          job_title,
          company_name,
          province,
          location,
          internship_type,
          stipend,
          qualification,
          field_of_study,
          skills,
          deadline,
          description,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (internshipsError) {
        throw internshipsError;
      }

      setInternships(data || []);
    } catch (err) {
      console.error("Load internships error:", err);
      setError(
        err?.message ||
          "Unable to load internships right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const provinces = useMemo(() => {
    const values = internships
      .map((item) => item.province)
      .filter(Boolean);

    return ["All Provinces", ...Array.from(new Set(values))];
  }, [internships]);

  const workTypes = useMemo(() => {
    const values = internships
      .map((item) => item.internship_type)
      .filter(Boolean);

    return ["All Types", ...Array.from(new Set(values))];
  }, [internships]);

  const filteredInternships = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return internships.filter((internship) => {
      const title =
        internship.title ||
        internship.job_title ||
        "";

      const searchableText = [
        title,
        internship.company_name,
        internship.province,
        internship.location,
        internship.qualification,
        internship.field_of_study,
        internship.skills,
        internship.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchTerm ||
        searchableText.includes(searchTerm);

      const matchesProvince =
        province === "All Provinces" ||
        internship.province === province;

      const matchesWorkType =
        workType === "All Types" ||
        internship.internship_type === workType;

      return (
        matchesSearch &&
        matchesProvince &&
        matchesWorkType
      );
    });
  }, [internships, search, province, workType]);

  function openInternship(id) {
    router.push(`/jobs/${id}`);
  }

  function clearFilters() {
    setSearch("");
    setProvince("All Provinces");
    setWorkType("All Types");
  }

  return (
    <>
      <SiteHeader />

      <main className="internships-page">
        <section className="marketplace-hero">
          <div className="hero-orb hero-orb-one"></div>
          <div className="hero-orb hero-orb-two"></div>

          <div className="hero-inner">
            <Link
              href="/"
              className="hero-back-link"
            >
              ← Back to home
            </Link>

            <div className="hero-badge">
              <span className="hero-dot"></span>
              GRADLINK SA OPPORTUNITIES
            </div>

            <h1>
              Find your next
              <span> opportunity.</span>
            </h1>

            <p>
              Explore internship opportunities from companies
              across South Africa and take the next step
              toward your career.
            </p>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>{internships.length}</strong>
                <span>Opportunities</span>
              </div>

              <div className="hero-stat-divider"></div>

              <div className="hero-stat">
                <strong>
                  {provinces.length > 1
                    ? provinces.length - 1
                    : 0}
                </strong>
                <span>Provinces</span>
              </div>

              <div className="hero-stat-divider"></div>

              <div className="hero-stat">
                <strong>SA</strong>
                <span>Nationwide</span>
              </div>
            </div>
          </div>
        </section>

        <section className="search-section">
          <div className="search-container">
            <div className="search-panel">
              <div className="search-main">
                <label htmlFor="internship-search">
                  Search opportunities
                </label>

                <div className="search-input-wrap">
                  <span className="search-icon">
                    ⌕
                  </span>

                  <input
                    id="internship-search"
                    type="search"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search by title, company, skill or field..."
                  />
                </div>
              </div>

              <div className="filter-field">
                <label htmlFor="province-filter">
                  Province
                </label>

                <select
                  id="province-filter"
                  value={province}
                  onChange={(e) =>
                    setProvince(e.target.value)
                  }
                >
                  {provinces.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="type-filter">
                  Work arrangement
                </label>

                <select
                  id="type-filter"
                  value={workType}
                  onChange={(e) =>
                    setWorkType(e.target.value)
                  }
                >
                  {workTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!loading && (
              <div className="results-row">
                <div>
                  <strong>
                    {filteredInternships.length}
                  </strong>{" "}
                  {filteredInternships.length === 1
                    ? "opportunity"
                    : "opportunities"}{" "}
                  found
                </div>

                {(search ||
                  province !== "All Provinces" ||
                  workType !== "All Types") && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="clear-button"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="results-section">
          <div className="results-container">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState
                error={error}
                onRetry={loadInternships}
              />
            ) : filteredInternships.length === 0 ? (
              <EmptyState
                hasFilters={
                  Boolean(search) ||
                  province !== "All Provinces" ||
                  workType !== "All Types"
                }
                onClear={clearFilters}
              />
            ) : (
              <>
                <div className="section-heading">
                  <div>
                    <span className="section-eyebrow">
                      LATEST OPPORTUNITIES
                    </span>

                    <h2>
                      Internship opportunities
                    </h2>

                    <p>
                      Discover roles that could be the
                      beginning of your professional journey.
                    </p>
                  </div>
                </div>

                <div className="internship-grid">
                  {filteredInternships.map(
                    (internship) => (
                      <InternshipCard
                        key={internship.id}
                        internship={internship}
                        onOpen={() =>
                          openInternship(internship.id)
                        }
                      />
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="bottom-cta">
          <div className="bottom-cta-inner">
            <div>
              <span className="bottom-eyebrow">
                FOR GRADUATES
              </span>

              <h2>
                Your next opportunity could start here.
              </h2>

              <p>
                Create your GradLink profile and make it
                easier for companies to discover your
                potential.
              </p>
            </div>

            <Link
              href="/signup"
              className="cta-button"
            >
              Create Your Profile
              <span>→</span>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />

      <style jsx global>{globalStyles}</style>
    </>
  );
}

function InternshipCard({ internship, onOpen }) {
  const title =
    internship.title ||
    internship.job_title ||
    "Internship Opportunity";

  const company =
    internship.company_name ||
    "Company";

  const description =
    internship.description ||
    "Explore this internship opportunity and discover what you could learn and contribute.";

  const skills = internship.skills
    ? internship.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  const deadline = internship.deadline
    ? formatDate(internship.deadline)
    : null;

  return (
    <article
      className="internship-card"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="card-top">
        <div className="company-logo">
          {getInitials(company)}
        </div>

        <div className="posted-label">
          {getRelativeDate(internship.created_at)}
        </div>
      </div>

      <div className="company-name">
        {company}
      </div>

      <h3>{title}</h3>

      <div className="location-row">
        <span>⌖</span>

        <span>
          {internship.location ||
            internship.province ||
            "South Africa"}
        </span>
      </div>

      <p className="card-description">
        {description.length > 145
          ? `${description.slice(0, 145)}...`
          : description}
      </p>

      <div className="tag-row">
        {internship.internship_type && (
          <span className="tag blue-tag">
            {internship.internship_type}
          </span>
        )}

        {internship.qualification && (
          <span className="tag">
            {internship.qualification}
          </span>
        )}
      </div>

      {skills.length > 0 && (
        <div className="skills-row">
          {skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      )}

      <div className="card-footer">
        <div className="stipend">
          <small>STIPEND</small>
          <strong>
            {internship.stipend || "Not specified"}
          </strong>
        </div>

        {deadline && (
          <div className="deadline">
            <small>DEADLINE</small>
            <strong>{deadline}</strong>
          </div>
        )}

        <button
          type="button"
          className="view-button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          View
          <span>→</span>
        </button>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="loading-state">
      <div className="loading-spinner"></div>

      <h2>Finding opportunities</h2>

      <p>
        We're loading the latest internships for you.
      </p>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="state-box error-state">
      <div className="state-icon">!</div>

      <h2>We couldn't load the internships</h2>

      <p>{error}</p>

      <button
        type="button"
        onClick={onRetry}
        className="state-button"
      >
        Try Again
      </button>
    </div>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="state-box">
      <div className="state-icon">⌕</div>

      <h2>
        {hasFilters
          ? "No matching opportunities"
          : "No internships available yet"}
      </h2>

      <p>
        {hasFilters
          ? "Try changing your search or filters to see more opportunities."
          : "New opportunities will appear here as companies publish them."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="state-button"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

function getInitials(name) {
  if (!name) return "GL";

  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString(
      "en-ZA",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return date;
  }
}

function getRelativeDate(date) {
  if (!date) return "Recently posted";

  const created = new Date(date);
  const now = new Date();

  const difference =
    now.getTime() - created.getTime();

  const days = Math.floor(
    difference / (1000 * 60 * 60 * 24)
  );

  if (days <= 0) return "Today";

  if (days === 1) return "1 day ago";

  if (days < 7) return `${days} days ago`;

  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1
      ? "1 week ago"
      : `${weeks} weeks ago`;
  }

  return "Recently posted";
}

const globalStyles = `
  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    padding: 0;
    background: #f8fafc;
    color: #0f172a;
  }

  button,
  input,
  select {
    font: inherit;
  }

  .internships-page {
    min-height: 100vh;
    background: #f8fafc;
  }

  /* HERO */

  .marketplace-hero {
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(
        circle at 85% 15%,
        rgba(96,165,250,0.18),
        transparent 28%
      ),
      linear-gradient(
        135deg,
        #06183d 0%,
        #0a2e6f 52%,
        #2563eb 100%
      );
  }

  .hero-inner {
    position: relative;
    z-index: 2;
    max-width: 1200px;
    margin: 0 auto;
    padding: 52px 24px 70px;
  }

  .hero-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }

  .hero-orb-one {
    width: 430px;
    height: 430px;
    right: -210px;
    top: -220px;
    background: rgba(255,255,255,0.055);
  }

  .hero-orb-two {
    width: 220px;
    height: 220px;
    left: -130px;
    bottom: -150px;
    background: rgba(147,197,253,0.08);
  }

  .hero-back-link {
    display: inline-flex;
    margin-bottom: 27px;
    color: #dbeafe;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
  }

  .hero-back-link:hover {
    color: #ffffff;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 13px;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 999px;
    background: rgba(255,255,255,0.10);
    color: #dbeafe;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1.2px;
  }

  .hero-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #60a5fa;
    box-shadow: 0 0 0 4px rgba(96,165,250,0.12);
  }

  .marketplace-hero h1 {
    max-width: 780px;
    margin: 20px 0 0;
    color: #ffffff;
    font-size: clamp(42px, 7vw, 70px);
    line-height: 1;
    letter-spacing: -3px;
    font-weight: 900;
  }

  .marketplace-hero h1 span {
    color: #93c5fd;
  }

  .marketplace-hero p {
    max-width: 690px;
    margin: 22px 0 0;
    color: rgba(255,255,255,0.82);
    font-size: 16px;
    line-height: 1.7;
  }

  .hero-stats {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-top: 38px;
  }

  .hero-stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .hero-stat strong {
    color: #ffffff;
    font-size: 22px;
    font-weight: 900;
  }

  .hero-stat span {
    color: #bfdbfe;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.7px;
    text-transform: uppercase;
  }

  .hero-stat-divider {
    width: 1px;
    height: 36px;
    background: rgba(255,255,255,0.18);
  }

  /* SEARCH */

  .search-section {
    position: relative;
    z-index: 5;
    margin-top: -30px;
  }

  .search-container {
    max-width: 1160px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .search-panel {
    display: grid;
    grid-template-columns: minmax(0, 1.8fr) minmax(180px, 0.75fr) minmax(180px, 0.75fr);
    gap: 14px;
    padding: 20px;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    background: #ffffff;
    box-shadow: 0 20px 55px rgba(15,23,42,0.12);
  }

  .search-main,
  .filter-field {
    min-width: 0;
  }

  .search-main label,
  .filter-field label {
    display: block;
    margin-bottom: 7px;
    color: #334155;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .search-input-wrap {
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-52%);
    color: #64748b;
    font-size: 23px;
    line-height: 1;
  }

  .search-input-wrap input,
  .filter-field select {
    width: 100%;
    height: 48px;
    border: 1px solid #dbe2ea;
    border-radius: 10px;
    outline: none;
    background: #f8fafc;
    color: #0f172a;
    font-size: 13px;
  }

  .search-input-wrap input {
    padding: 0 14px 0 43px;
  }

  .filter-field select {
    padding: 0 12px;
  }

  .search-input-wrap input:focus,
  .filter-field select:focus {
    border-color: #2563eb;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.09);
  }

  .results-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    padding: 18px 3px 0;
    color: #64748b;
    font-size: 12px;
  }

  .results-row strong {
    color: #0f172a;
    font-weight: 900;
  }

  .clear-button {
    border: 0;
    background: transparent;
    color: #2563eb;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
  }

  /* RESULTS */

  .results-section {
    padding: 55px 20px 80px;
  }

  .results-container {
    max-width: 1160px;
    margin: 0 auto;
  }

  .section-heading {
    margin-bottom: 27px;
  }

  .section-eyebrow,
  .bottom-eyebrow {
    color: #2563eb;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1.4px;
  }

  .section-heading h2 {
    margin: 7px 0 6px;
    color: #0f172a;
    font-size: 28px;
    letter-spacing: -1px;
  }

  .section-heading p {
    margin: 0;
    color: #64748b;
    font-size: 13px;
  }

  .internship-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .internship-card {
    position: relative;
    display: flex;
    min-width: 0;
    flex-direction: column;
    min-height: 390px;
    padding: 22px;
    border: 1px solid #e2e8f0;
    border-radius: 17px;
    background: #ffffff;
    box-shadow: 0 8px 28px rgba(15,23,42,0.045);
    cursor: pointer;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }

  .internship-card:hover {
    transform: translateY(-4px);
    border-color: #bfdbfe;
    box-shadow: 0 20px 45px rgba(15,23,42,0.10);
  }

  .internship-card:focus {
    outline: 3px solid rgba(37,99,235,0.15);
    outline-offset: 2px;
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .company-logo {
    width: 45px;
    height: 45px;
    flex: 0 0 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: linear-gradient(
      135deg,
      #dbeafe,
      #eff6ff
    );
    color: #1d4ed8;
    font-size: 13px;
    font-weight: 900;
  }

  .posted-label {
    color: #94a3b8;
    font-size: 10px;
    font-weight: 700;
  }

  .company-name {
    margin-top: 17px;
    color: #64748b;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .internship-card h3 {
    margin: 7px 0 0;
    color: #0f172a;
    font-size: 18px;
    line-height: 1.3;
    letter-spacing: -0.4px;
  }

  .location-row {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 11px;
    color: #64748b;
    font-size: 11px;
  }

  .location-row span:first-child {
    color: #2563eb;
    font-size: 15px;
  }

  .card-description {
    margin: 17px 0 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.65;
  }

  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 15px;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    min-height: 25px;
    padding: 0 9px;
    border-radius: 7px;
    background: #f1f5f9;
    color: #475569;
    font-size: 9px;
    font-weight: 800;
  }

  .blue-tag {
    background: #eff6ff;
    color: #2563eb;
  }

  .skills-row {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 11px;
  }

  .skills-row span {
    color: #94a3b8;
    font-size: 9px;
    font-weight: 700;
  }

  .skills-row span:not(:last-child)::after {
    content: "•";
    margin-left: 5px;
    color: #cbd5e1;
  }

  .card-footer {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    margin-top: auto;
    padding-top: 20px;
  }

  .stipend,
  .deadline {
    min-width: 0;
  }

  .stipend small,
  .deadline small {
    display: block;
    margin-bottom: 4px;
    color: #94a3b8;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.8px;
  }

  .stipend strong,
  .deadline strong {
    display: block;
    overflow: hidden;
    max-width: 105px;
    color: #0f172a;
    font-size: 10px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .view-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 37px;
    margin-left: auto;
    padding: 0 13px;
    border: 0;
    border-radius: 9px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 10px;
    font-weight: 900;
    cursor: pointer;
  }

  .view-button:hover {
    background: #2563eb;
    color: #ffffff;
  }

  /* STATES */

  .loading-state,
  .state-box {
    min-height: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 20px;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    background: #ffffff;
    text-align: center;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #dbeafe;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: internshipSpin 0.8s linear infinite;
  }

  @keyframes internshipSpin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-state h2,
  .state-box h2 {
    margin: 18px 0 7px;
    color: #0f172a;
    font-size: 20px;
  }

  .loading-state p,
  .state-box p {
    max-width: 460px;
    margin: 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.6;
  }

  .state-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 22px;
    font-weight: 900;
  }

  .error-state .state-icon {
    background: #fef2f2;
    color: #dc2626;
  }

  .state-button {
    min-height: 43px;
    margin-top: 22px;
    padding: 0 19px;
    border: 0;
    border-radius: 9px;
    background: #2563eb;
    color: #ffffff;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  /* CTA */

  .bottom-cta {
    padding: 0 20px 80px;
  }

  .bottom-cta-inner {
    max-width: 1160px;
    min-height: 230px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
    margin: 0 auto;
    padding: 42px 50px;
    overflow: hidden;
    position: relative;
    border-radius: 20px;
    background:
      radial-gradient(
        circle at 90% 10%,
        rgba(147,197,253,0.18),
        transparent 28%
      ),
      linear-gradient(
        135deg,
        #071b46,
        #0b3277
      );
  }

  .bottom-cta-inner h2 {
    max-width: 600px;
    margin: 9px 0 8px;
    color: #ffffff;
    font-size: 28px;
    letter-spacing: -1px;
  }

  .bottom-cta-inner p {
    max-width: 600px;
    margin: 0;
    color: #bfdbfe;
    font-size: 13px;
    line-height: 1.6;
  }

  .bottom-eyebrow {
    color: #93c5fd;
  }

  .cta-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 48px;
    flex: 0 0 auto;
    padding: 0 19px;
    border-radius: 10px;
    background: #ffffff;
    color: #1d4ed8;
    font-size: 11px;
    font-weight: 900;
    text-decoration: none;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }

  .cta-button:hover {
    transform: translateY(-1px);
  }

  /* TABLET */

  @media (max-width: 950px) {
    .internship-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .search-panel {
      grid-template-columns: 1fr 1fr;
    }

    .search-main {
      grid-column: 1 / -1;
    }
  }

  /* MOBILE */

  @media (max-width: 700px) {
    .hero-inner {
      padding: 42px 18px 58px;
    }

    .marketplace-hero h1 {
      font-size: 42px;
      letter-spacing: -2px;
    }

    .marketplace-hero p {
      font-size: 14px;
    }

    .hero-stats {
      gap: 15px;
    }

    .hero-stat strong {
      font-size: 18px;
    }

    .hero-stat span {
      font-size: 8px;
    }

    .search-container {
      padding: 0 12px;
    }

    .search-panel {
      grid-template-columns: 1fr;
      padding: 16px;
    }

    .search-main {
      grid-column: auto;
    }

    .results-section {
      padding: 45px 12px 60px;
    }

    .internship-grid {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .internship-card {
      min-height: 365px;
    }

    .bottom-cta {
      padding: 0 12px 60px;
    }

    .bottom-cta-inner {
      align-items: flex-start;
      flex-direction: column;
      padding: 32px 24px;
    }

    .bottom-cta-inner h2 {
      font-size: 24px;
    }

    .cta-button {
      width: 100%;
    }
  }

  @media (max-width: 420px) {
    .hero-inner {
      padding-left: 14px;
      padding-right: 14px;
    }

    .marketplace-hero h1 {
      font-size: 36px;
    }

    .hero-stats {
      align-items: flex-start;
      gap: 11px;
    }

    .hero-stat-divider {
      height: 31px;
    }

    .hero-stat strong {
      font-size: 16px;
    }

    .hero-stat span {
      font-size: 7px;
    }

    .results-row {
      align-items: flex-start;
      flex-direction: column;
      gap: 8px;
    }

    .section-heading h2 {
      font-size: 24px;
    }

    .card-footer {
      gap: 8px;
    }

    .deadline {
      display: none;
    }
  }
`;