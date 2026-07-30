"use client";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Lerato M.",
      role: "Graduate",
      text: "GradLink SA helped me find an internship in just a few weeks. The application process was simple and professional.",
    },
    {
      name: "Sipho N.",
      role: "HR Manager",
      text: "We found talented graduates quickly through GradLink SA. It made recruiting interns much easier.",
    },
    {
      name: "Ayanda P.",
      role: "Final-Year Student",
      text: "I love how easy it is to browse internships and apply. Everything is in one place.",
    },
  ];

  return (
    <section
      style={{
        padding: "70px 40px",
        background: "#ffffff",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          color: "#0057b8",
          fontSize: "36px",
          marginBottom: "15px",
        }}
      >
        What People Say
      </h2>

      <p
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: "40px",
        }}
      >
        Trusted by graduates and employers across South Africa.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "25px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            style={{
              background: "#f5f9ff",
              borderRadius: "16px",
              padding: "25px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: "22px", marginBottom: "10px" }}>
              ⭐⭐⭐⭐⭐
            </div>

            <p
              style={{
                color: "#444",
                lineHeight: "1.7",
                marginBottom: "20px",
              }}
            >
              "{testimonial.text}"
            </p>

            <h4 style={{ color: "#0057b8", marginBottom: "5px" }}>
              {testimonial.name}
            </h4>

            <small style={{ color: "#777" }}>
              {testimonial.role}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}
