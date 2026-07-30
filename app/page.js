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
    fetchInternships();
    fetchCompanies();
    fetchStats();
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
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f5f9ff",
        minHeight: "100vh",
      }}
    >
      {/* Navigation */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ color: "#0057b8" }}>GradLink SA</h2>

        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/">Home</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/graduate">Graduates</Link>
          <Link href="/company">Companies</Link>
          <Link href="/admin">Admin</Link>
        </div>
      </nav>

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
          textAlign: "center",
          padding: "30px",
          background: "#0057b8",
          color: "#fff",
          marginTop: "50px",
        }}
      >
        © {new Date().getFullYear()} GradLink SA. All rights reserved.
      </footer>
    </main>
  );
}