"use client";

import { useState } from "react";

export default function FAQ() {
  const faqs = [
    {
      question: "Is GradLink SA free for graduates?",
      answer:
        "Yes. Graduates can create a profile, upload their CV, search for internships and apply at no cost.",
    },
    {
      question: "Can companies post internships?",
      answer:
        "Absolutely. Registered companies can publish internship opportunities, manage applicants and recruit graduates through GradLink SA.",
    },
    {
      question: "Who can register?",
      answer:
        "South African graduates, final-year students, employers and organisations looking to recruit interns are welcome to join.",
    },
    {
      question: "How are graduates matched with internships?",
      answer:
        "GradLink SA compares qualifications, study fields and skills with internship requirements to help companies identify suitable candidates.",
    },
    {
      question: "Can I update my profile after registering?",
      answer:
        "Yes. You can edit your information, upload a new CV and keep your profile up to date whenever needed.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section
      style={{
        padding: "90px 20px",
        background: "#f8fbff",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0057b8",
            fontSize: "40px",
            fontWeight: "700",
            marginBottom: "15px",
          }}
        >
          ❓ Frequently Asked Questions
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            fontSize: "18px",
            marginBottom: "50px",
            lineHeight: "28px",
          }}
        >
          Everything you need to know before joining GradLink SA.
        </p>

        {faqs.map((faq, index) => (
          <div
            key={index}
            style={{
              background: "#fff",
              borderRadius: "16px",
              marginBottom: "20px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
              border: "1px solid #e8eef7",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
              style={{
                width: "100%",
                background: "#fff",
                border: "none",
                cursor: "pointer",
                padding: "22px 25px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "18px",
                fontWeight: "600",
                color: "#003b7a",
                textAlign: "left",
              }}
            >
              {faq.question}

              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "#0057b8",
                  color: "#fff",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "22px",
                  flexShrink: 0,
                }}
              >
                {openIndex === index ? "−" : "+"}
              </div>
            </button>

            {openIndex === index && (
              <div
                style={{
                  padding: "0 25px 25px",
                  color: "#555",
                  lineHeight: "1.8",
                  fontSize: "16px",
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