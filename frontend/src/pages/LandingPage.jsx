import { useState, useEffect } from "react";
import "./LandingPage.css";
import ThemeToggle from "../components/ui/ThemeToggle";

const StatCard = ({ number, label }) => (
  <div className="stat-card">
    <span className="stat-number">{number}</span>
    <span className="stat-label">{label}</span>
  </div>
);

const FeatureItem = ({ icon, title, text }) => (
  <div className="feature-item">
    <div className="feature-icon">
      <i className={`ti ${icon}`} aria-hidden="true"></i>
    </div>
    <div className="feature-text">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  </div>
);

const StepCard = ({ number, title, text, highlight }) => (
  <div className={`step-card ${highlight ? "step-card--highlight" : ""}`}>
    <div className="step-number">{number}</div>
    <h3 className="step-title">{title}</h3>
    <p className="step-text">{text}</p>
  </div>
);

export default function LandingPage() {

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // If user has scrolled more than 20px, set scrolled = true
      setScrolled(window.scrollY > 20);
    };

    // Attach the scroll listener to the browser window
    window.addEventListener("scroll", handleScroll);
    //It removes the event listener when the component is destroyed to prevent memory leaks.
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = [
    { number: "56", label: "Active groups" },
    { number: "38",  label: "Modules covered" },
    { number: "410", label: "Students joined" },
  ];

  const features = [
    {
      icon: "ti-search",
      title: "Find by module",
      text: "Search any module and instantly see all open study groups. Filter by date to find one that fits your schedule.",
    },
    {
      icon: "ti-users",
      title: "Creator-controlled",
      text: "Group creators approve every join request. You choose who studies with you, keeping sessions focused and productive.",
    },
    {
      icon: "ti-map-pin",
      title: "On-campus venues",
      text: "Every group meets at a verified on-campus location. No off-campus meetups. Your safety comes first.",
    },
    {
      icon: "ti-shield-check",
      title: "Same institution students only",
      text: "Sign up with your @institution.ac.za email. The platform is exclusive to students from the same institution.",
    },
    {
      icon: "ti-calendar",
      title: "Flexible scheduling",
      text: "Groups can be rescheduled when plans change. Members are notified instantly so nobody is left guessing.",
    },
    {
      icon: "ti-adjustments-horizontal",
      title: "Filter your comfort",
      text: "Set a gender preference for your group or keep it open to all. You decide the environment that works for you.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Sign up with your student email",
      text: "Register using your 1234567@myuwc.ac.za address. Verify, set up your profile, and you're in.",
      highlight: false,
    },
    {
      number: "02",
      title: "Find or create a study group",
      text: "Search by module, filter by date, and request to join or create your own group in under a minute.",
      highlight: true,
    },
    {
      number: "03",
      title: "Show up and ace it",
      text: "Get approved, confirm your spot, and meet your study group on campus at the agreed time and venue.",
      highlight: false,
    },
  ];

  return (
    <>
      <nav className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
        <a href="#" className="logo-row">
          <div className="logo-mark">
            <i className="ti ti-users" aria-hidden="true"></i>
          </div>
          <span className="logo-txt">Study Connect</span>
        </a>

        {/* Desktop nav links, hidden on mobile via CSS */}
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How it works</a>
        </div>

        <div className="nav-actions">
          <ThemeToggle />
          <a href="/login" className="btn">Log in</a>
          <a href="/signup" className="btn btn--primary">Sign up</a>
        </div>

        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >

          <i className={`ti ${menuOpen ? "ti-x" : "ti-menu-2"}`} style={{ fontSize: 22 }} aria-hidden="true"></i>
        </button>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          <a href="#features" className="mobile-link" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how-it-works" className="mobile-link" onClick={() => setMenuOpen(false)}>How it works</a>
          <div className="mobile-divider"></div>
          <a href="/login" className="mobile-link">Log in</a>
          <a href="/signup" className="btn btn--primary" style={{ textAlign: "center" }}>Sign up</a>
        </div>
      )}

      {/* HERO  */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-pill">
            <i className="ti ti-school" style={{ fontSize: 13 }} aria-hidden="true"></i>
            For UWC students
          </div>

          <h1>
            Find your people,<br />
            <em>ace it together</em>
          </h1>

          <p>
            Create or join on-campus study groups for any module.
            Search by subject, filter by date, and study smarter — with people you trust.
          </p>

          <div className="hero-ctas">
            <a href="/signup" className="btn btn--primary btn--lg">
              Get started free
              <i className="ti ti-arrow-right" aria-hidden="true"></i>
            </a>
            <a href="#how-it-works" className="btn btn--lg">See how it works</a>
          </div>
        </div>
      </section>

      <div className="stats-section">
        {stats.map((stat) => (
          <StatCard key={stat.label} number={stat.number} label={stat.label} />
        ))}
      </div>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="features-section" id="features">
        <div className="section-header">
          <span className="section-eyebrow">Why Study Connect</span>
          <h2 className="section-title">Everything you need to study better</h2>
          <p className="section-sub">Built specifically for students.</p>
        </div>

        <div className="features-grid">
          {features.map((f) => (
            <FeatureItem key={f.title} icon={f.icon} title={f.title} text={f.text} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="steps-section" id="how-it-works">
        <div className="section-header">
          <span className="section-eyebrow">How it works</span>
          <h2 className="section-title">Up and studying in three steps</h2>
          <p className="section-sub">No complicated setup. Just sign up, find your group, and show up.</p>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <StepCard
              key={step.number}
              number={step.number}
              title={step.title}
              text={step.text}
              highlight={step.highlight}
            />
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2>Ready to find your study group?</h2>
          <p>Join hundreds of UWC students already studying smarter together on campus.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/signup" className="btn btn--white btn--lg">Create your account</a>
            <a href="/browse" className="btn btn--ghost btn--lg">Browse groups</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-left">
          <div className="logo-mark" style={{ width: 24, height: 24, borderRadius: 6 }}>
            <i className="ti ti-users" style={{ fontSize: 13 }} aria-hidden="true"></i>
          </div>
          <span className="footer-txt">© 2025 Study Connect</span>
        </div>
        <div className="footer-links">
          <a href="#" className="footer-link">Privacy</a>
          <a href="#" className="footer-link">Terms</a>
          <a href="#" className="footer-link">Contact</a>
        </div>
      </footer>
    </>
  );
}
