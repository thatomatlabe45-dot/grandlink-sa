"use client";

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
}