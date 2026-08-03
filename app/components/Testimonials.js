"use client";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Lerato M.",
      role: "Computer Science Graduate",
      text: "GradLink SA helped me secure my internship within two weeks. The platform was simple to use and connected me with companies I never would have found on my own.",
    },
    {
      name: "Sipho N.",
      role: "HR Manager",
      text: "Finding talented graduates has become much easier. We received quality applications and filled our internship positions faster than expected.",
    },
    {
      name: "Ayanda P.",
      role: "Final-Year Student",
      text: "The website is clean, easy to navigate, and makes applying for internships stress-free. I recommend it to every graduate.",
    },
  ];

  return (
    <section
      style={{
        padding: "80px 20px",
        background: "linear-gradient(to bottom, #ffffff, #f5f9ff)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0057b8",
            fontSize: "40px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          ⭐ Success Stories
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            fontSize: "18px",
            maxWidth: "700px",
            margin: "0 auto 50px",
            lineHeight: "28px",
          }}
        >
          Trusted by graduates and employers across South Africa.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
            gap: "30px",
          }}
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              style={{
                background: "#fff",
                borderRadius: "18px",
                padding: "30px",
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                border: "1px solid #e6eef8",
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  marginBottom: "20px",
                }}
              >
                ⭐⭐⭐⭐⭐
              </div>

              <p
                style={{
                  color: "#444",
                  lineHeight: "1.8",
                  fontSize: "16px",
                  marginBottom: "30px",
                  fontStyle: "italic",
                }}
              >
                “{testimonial.text}”
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <div
                  style={{
                    width: "55px",
                    height: "55px",
                    borderRadius: "50%",
                    background: "#0057b8",
                    color: "#fff",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  {testimonial.name.charAt(0)}
                </div>

                <div>
                  <h4
                    style={{
                      margin: 0,
                      color: "#003b7a",
                    }}
                  >
                    {testimonial.name}
                  </h4>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#777",
                      fontSize: "14px",
                    }}
                  >
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}