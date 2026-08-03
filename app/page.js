"use client";

import Link from "next/link";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import FeaturedInternships from "./components/FeaturedInternships";
import FeaturedCompanies from "./components/FeaturedCompanies";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";
import SearchBar from "./components/SearchBar";
import Navbar from "./components/Navbar";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [internships, setInternships] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [stats, setStats] = useState({
    graduates: 0,
    companies: 0,
    internships: 0,
  });

 useEffect(() => {
  // fetchInternships();
  // fetchCompanies();
  // fetchStats();
}, []);

  async function fetchInternships() {
    const { data } = await supabase
      .from("internships")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);

    if (data) setInternships(data);
  }

  async function fetchCompanies() {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);

    if (data) setCompanies(data);
  }

  async function fetchStats() {
    const { count: graduates } = await supabase
      .from("graduates")
      .select("*", { count: "exact", head: true });

    const { count: companies } = await supabase
      .from("companies")
      .select("*", { count: "exact", head: true });

    const { count: internships } = await supabase
      .from("internships")
      .select("*", { count: "exact", head: true });

    setStats({
      graduates: graduates || 0,
      companies: companies || 0,
      internships: internships || 0,
    });
  }
return (
  <main>
    <Navbar />
    <Hero />
    <SearchBar />
    <Stats stats={stats} />
    <FeaturedInternships internships={internships} />
    <FeaturedCompanies companies={companies} />
    <Testimonials />
    <FAQ />
    <Contact />
    <h1>GradLink SA</h1>
  </main>
);

      {/* Navigation */}
      {/* Navigation */}
<Navbar />

      {/* Hero */}
      <Hero />
        <SearchBar />
      

      {/* Statistics */}
    <Stats stats={stats} />
      {/* Featured Internships */}
<FeaturedInternships internships={internships} />

      {/* Featured Companies */}
     <FeaturedCompanies companies={companies} />
    <Testimonials />
    <FAQ />
    <Contact />

      {/* Footer */}
     <footer
  style={{
    background: "#0057b8",
    color: "#fff",
    marginTop: "60px",
    padding: "50px 20px",
  }}
>
  <div
    style={{
      maxWidth: "1200px",
      margin: "0 auto",
      textAlign: "center",
    }}
  >
    <h2
      style={{
        marginBottom: "10px",
      }}
    >
      GradLink SA
    </h2>

    <p
      style={{
        opacity: 0.9,
        marginBottom: "20px",
      }}
    >
      Connecting South African Graduates with Internship Opportunities.
    </p>

    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "20px",
        marginBottom: "20px",
      }}
    >
      <Link href="/" style={{ color: "#fff", textDecoration: "none" }}>
        Home
      </Link>

      <Link href="/jobs" style={{ color: "#fff", textDecoration: "none" }}>
        Jobs
      </Link>

      <Link href="/graduate" style={{ color: "#fff", textDecoration: "none" }}>
        Graduates
      </Link>

      <Link href="/company" style={{ color: "#fff", textDecoration: "none" }}>
        Companies
      </Link>
    </div>

    <hr
      style={{
        border: 0,
        borderTop: "1px solid rgba(255,255,255,0.2)",
        margin: "20px 0",
      }}
    />

    <p style={{ margin: 0 }}>
      © {new Date().getFullYear()} GradLink SA. All rights reserved.
    </p>
  </div>
</footer>
    </main>
  );
}