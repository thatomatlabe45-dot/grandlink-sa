"use client";

import { useState } from "react";

export default function FAQ() {
  const faqs = [
    {
      question: "Is GradLink SA free for graduates?",
      answer:
        "Yes. Graduates can create a profile, upload their CV and apply for internships completely free.",
    },
    {
      question: "Can companies post internships?",
      answer:
        "Yes. Companies can register, post internship opportunities and review graduate applications.",
    },
    {
      question: "Who can register?",
      answer:
        "South African graduates, final-year students and registered companies are welcome to join GradLink SA.",
    },
    {
      question: "How does matching work?",
      answer:
        "GradLink SA compares graduate qualifications and skills with internship requirements to help companies identify suitable candidates.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section
      style={{
        padding: "80px 30px",
        background: "#f8fbff",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "auto",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0057b8",
            fontSize: "40px",
            marginBottom: "15px",
          }}
        >
          Frequently Asked Questions
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "45px",
          }}
        >
          Everything you need to know about GradLink SA.
        </p>

        {faqs.map((faq, index) => (
          <div
            key={index}
            style={{
              background: "white",
              borderRadius: "12px",
              marginBottom: "18px",
              boxShadow: "0 4px 12px rgba(0,0,0,.08)",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
              style={{
                width: "100%",
                padding: "20px",
                border: "none",
                background: "white",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: "bold",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {faq.question}

              <span>
                {openIndex === index ? "−" : "+"}
              </span>
            </button>

            {openIndex === index && (
              <div
                style={{
                  padding: "20px",
                  color: "#555",
                  lineHeight: "1.7",
                }}
              >
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
