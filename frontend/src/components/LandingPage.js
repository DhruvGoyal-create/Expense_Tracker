// src/components/LandingPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const teamMembers = [
    {
      name: 'Dhruv Goyal',
      role: 'Backend & Web Developer',
      icon: '💻',
      color: '#0ea5e9'
    },
    {
      name: 'Ankush Kumar Barnwal',
      role: 'Web Developer',
      icon: '🎨',
      color: '#2563eb'
    },
    {
      name: 'Harsh Sharma',
      role: 'Backend & Web Developer',
      icon: '⚡',
      color: '#0ea5e9'
    },
    {
      name: 'Mohd. Anas',
      role: 'Web Developer',
      icon: '🚀',
      color: '#2563eb'
    }
  ];

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Insights',
      description: 'Smart categorization and personalized financial advice using machine learning',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: '📊',
      title: 'Dynamic Analytics',
      description: 'Multi-level graphs with year, month, date, and day-wise expense visualization',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: '📸',
      title: 'OCR Receipt Scanning',
      description: 'Upload receipts and auto-extract transaction details instantly',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: '🎯',
      title: 'Smart Goal Tracking',
      description: 'Set savings goals with timeline projections and progress monitoring',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      icon: '🔒',
      title: 'Bank-Level Security',
      description: 'Two-step verification with encrypted local backup and JWT authentication',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      icon: '👥',
      title: 'Group Expenses',
      description: 'Split costs with friends, track shared expenses, and auto-settlement',
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <nav className={`navbar ${scrollY > 50 ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-content">
          <div className="logo">
            <span className="logo-icon">💰</span>
            <span className="logo-text">SmartSpend AI</span>
          </div>
          <div className="nav-links">
            <button onClick={() => scrollToSection('features')} className="nav-link">Features</button>
            <button onClick={() => scrollToSection('team')} className="nav-link">Team</button>
            <button onClick={() => scrollToSection('about')} className="nav-link">About</button>
            <button onClick={() => navigate('/login')} className="nav-btn-login">Login</button>
            <button onClick={() => navigate('/register')} className="nav-btn-register">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
        
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🎓</span>
            <span>AI/ML & Data Science Project</span>
          </div>
          
          <h1 className="hero-title">
            <span className="title-line-1">Personal Your Finances,</span>
            <span className="title-line-2">Here's Your Companion</span>
          </h1>
          
          <p className="hero-subtitle">
            Smart expense tracking powered by AI with OCR scanning, voice input, 
            and intelligent insights to help you achieve your financial goals.
          </p>
          
          <div className="hero-actions">
            <button onClick={() => navigate('/register')} className="btn-primary">
              <span>Start Free Trial</span>
              <span className="btn-arrow">→</span>
            </button>
            <button onClick={() => scrollToSection('features')} className="btn-secondary">
              <span>Explore Features</span>
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">100+</div>
              <div className="stat-label">Users Supported</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">21</div>
              <div className="stat-label">Smart Features</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Secure & Private</div>
            </div>
          </div>
        </div>

        <div className="scroll-indicator" onClick={() => scrollToSection('features')}>
          <div className="mouse">
            <div className="wheel"></div>
          </div>
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <span className="section-badge">Features</span>
          <h2 className="section-title">Powerful Tools for Smart Finance</h2>
          <p className="section-subtitle">
            Everything you need to manage your money wisely
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div 
                className="feature-icon" 
                style={{ background: feature.gradient }}
              >
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="team-section">
        <div className="section-header">
          <span className="section-badge">Our Team</span>
          <h2 className="section-title">Meet the Developers</h2>
          <p className="section-subtitle">
            Passionate developers building the future of finance
          </p>
        </div>

        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div 
              key={index} 
              className="team-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="team-avatar" style={{ borderColor: member.color }}>
                <span className="avatar-icon">{member.icon}</span>
              </div>
              <h3 className="team-name">{member.name}</h3>
              <p className="team-role" style={{ color: member.color }}>{member.role}</p>
              <div className="team-social">
                <button className="social-icon">💼</button>
                <button className="social-icon">🔗</button>
                <button className="social-icon">📧</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="about-content">
          <div className="about-text">
            <span className="section-badge">About Project</span>
            <h2 className="section-title">SmartSpend AI</h2>
            <p className="about-description">
              An intelligent personal finance management system that combines the power of 
              machine learning, OCR technology, and smart automation to help users track, 
              analyze, and optimize their spending habits.
            </p>
            <p className="about-description">
              Built with modern web technologies and secured with bank-level encryption, 
              SmartSpend AI offers features like AI-powered insights, voice-based entry, 
              receipt scanning, mood-based tracking, and collaborative expense management.
            </p>
            <div className="tech-stack">
              <div className="tech-badge">React</div>
              <div className="tech-badge">Python Flask</div>
              <div className="tech-badge">Machine Learning</div>
              <div className="tech-badge">OCR</div>
              <div className="tech-badge">JWT Auth</div>
            </div>
          </div>
          <div className="about-visual">
            <div className="visual-card visual-card-1">
              <div className="card-icon">📊</div>
              <div className="card-title">Analytics</div>
            </div>
            <div className="visual-card visual-card-2">
              <div className="card-icon">🤖</div>
              <div className="card-title">AI Insights</div>
            </div>
            <div className="visual-card visual-card-3">
              <div className="card-icon">🔒</div>
              <div className="card-title">Secure</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Take Control of Your Finances?</h2>
          <p className="cta-subtitle">
            Join SmartSpend AI today and experience intelligent money management
          </p>
          <div className="cta-buttons">
            <button onClick={() => navigate('/register')} className="btn-primary">
              Get Started Free
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary">
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <span className="logo-icon">💰</span>
              <span className="logo-text">SmartSpend AI</span>
            </div>
            <p className="footer-tagline">Your Personal Finance Companion</p>
          </div>
          <div className="footer-info">
            <p>© 2024 SmartSpend AI. AI/ML & Data Science Project.</p>
            <p>Built with ❤️ by Team SmartSpend</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;