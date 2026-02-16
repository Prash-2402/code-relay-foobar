import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Zap, Shield, Layout } from 'lucide-react';
import { useAuth } from '../modules/context/AuthContext';

export default function LandingPage() {
    const { user } = useAuth();

    return (
        <div className="landing-page fade-in">
            {/* Navigation */}
            <nav className="landing-nav glass">
                <div className="landing-logo">
                    <Layout size={24} className="text-primary" />
                    <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>TaskNexus</span>
                </div>
                <div className="landing-links">
                    {user ? (
                        <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
                    ) : (
                        <>
                            <Link to="/login" className="btn-ghost" style={{ fontWeight: 600 }}>Login</Link>
                            <Link to="/register" className="btn-primary">Get Started</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-content">
                    <div className="badge-pill">
                        <span className="badge-dot"></span>
                        v2.0 is now live
                    </div>
                    <h1 className="hero-title">
                        Plan. Track. <br />
                        <span className="text-gradient">Succeed.</span>
                    </h1>
                    <p className="hero-subtitle">
                        Manage your projects with a tool that's as fluid as your workflow.
                        TaskNexus brings clarity to chaos with a beautiful, dark-mode first interface.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="btn-primary btn-lg">
                            Start for free <ArrowRight size={18} />
                        </Link>
                        <Link to="/login" className="btn-ghost btn-lg">
                            Live Demo
                        </Link>
                    </div>
                </div>

                {/* Abstract Visuals */}
                <div className="hero-visual">
                    <div className="glass-card-mockup float-animation">
                        <div className="mockup-header">
                            <div className="mockup-dots">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                        <div className="mockup-body">
                            <div className="mockup-row skeleton-w60"></div>
                            <div className="mockup-row skeleton-w80"></div>
                            <div className="mockup-row skeleton-w40"></div>
                            <div className="mockup-card glass">
                                <div className="flex-between">
                                    <div className="skeleton-circle"></div>
                                    <div className="skeleton-w40"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="glow-orb orb-1"></div>
                    <div className="glow-orb orb-2"></div>
                </div>
            </header>

            {/* Features Grid */}
            <section className="features-section">
                <h2 className="section-title">Why TaskNexus?</h2>
                <div className="features-grid">
                    <div className="feature-card glass">
                        <div className="feature-icon bg-primary-soft">
                            <Zap size={24} className="text-primary" />
                        </div>
                        <h3>Lightning Fast</h3>
                        <p>Built for speed and responsiveness. No more waiting for page loads.</p>
                    </div>
                    <div className="feature-card glass">
                        <div className="feature-icon bg-success-soft">
                            <CheckCircle2 size={24} className="text-success" />
                        </div>
                        <h3>Track Everything</h3>
                        <p>From simple to-dos to complex projects, keep everything organized.</p>
                    </div>
                    <div className="feature-card glass">
                        <div className="feature-icon bg-warning-soft">
                            <Shield size={24} className="text-warning" />
                        </div>
                        <h3>Bank-Grade Security</h3>
                        <p>Your data is encrypted and secure. We prioritize your privacy.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p className="text-muted">© 2024 TaskNexus. Built for the future of work.</p>
            </footer>

            <style>{`
                .landing-page {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                
                .landing-nav {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 2rem;
                    position: fixed;
                    top: 1rem;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 90%;
                    max-width: 1200px;
                    z-index: 1000;
                    border-radius: 100px;
                }
                
                .landing-logo {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .landing-links {
                    display: flex;
                    gap: 1rem;
                }

                .hero-section {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8rem 2rem 4rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    width: 100%;
                    position: relative;
                    gap: 4rem;
                }

                .hero-content {
                    flex: 1;
                    max-width: 600px;
                }

                .badge-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.25rem 0.75rem;
                    border-radius: 2rem;
                    background: hsla(var(--primary), 0.1);
                    color: hsl(var(--primary));
                    font-size: 0.85rem;
                    font-weight: 500;
                    margin-bottom: 1.5rem;
                    border: 1px solid hsla(var(--primary), 0.2);
                }

                .badge-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: hsl(var(--primary));
                    box-shadow: 0 0 8px hsl(var(--primary));
                }

                .hero-title {
                    font-size: 4rem;
                    line-height: 1.1;
                    font-weight: 800;
                    margin-bottom: 1.5rem;
                    letter-spacing: -0.03em;
                }

                .text-gradient {
                    background: linear-gradient(135deg, hsl(var(--primary)), #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .hero-subtitle {
                    font-size: 1.125rem;
                    color: hsl(var(--text-muted));
                    margin-bottom: 2.5rem;
                    line-height: 1.6;
                    max-width: 480px;
                }

                .hero-actions {
                    display: flex;
                    gap: 1rem;
                }

                .btn-lg {
                    padding: 0.85rem 1.75rem;
                    font-size: 1rem;
                }

                .hero-visual {
                    flex: 1;
                    position: relative;
                    display: flex;
                    justify-content: center;
                }

                .glass-card-mockup {
                    width: 100%;
                    max-width: 400px;
                    height: 300px;
                    background: var(--glass);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-xl);
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    z-index: 10;
                    transform: perspective(1000px) rotateY(-5deg) rotateX(5deg);
                }

                .mockup-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .mockup-dots {
                    display: flex;
                    gap: 6px;
                }

                .mockup-dots span {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: hsla(var(--text-muted), 0.3);
                }

                .mockup-row {
                    height: 12px;
                    background: hsla(var(--text-muted), 0.2);
                    border-radius: 6px;
                }

                .skeleton-w60 { width: 60%; }
                .skeleton-w80 { width: 80%; }
                .skeleton-w40 { width: 40%; }
                .skeleton-circle { width: 32px; height: 32px; border-radius: 50%; background: hsla(var(--text-muted), 0.2); }

                .mockup-card {
                    padding: 1rem;
                    margin-top: auto;
                    background: hsla(var(--bg), 0.5);
                }

                .float-animation {
                    animation: float 6s ease-in-out infinite;
                }

                @keyframes float {
                    0% { transform: perspective(1000px) rotateY(-5deg) rotateX(5deg) translateY(0px); }
                    50% { transform: perspective(1000px) rotateY(-5deg) rotateX(5deg) translateY(-20px); }
                    100% { transform: perspective(1000px) rotateY(-5deg) rotateX(5deg) translateY(0px); }
                }

                .glow-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.4;
                    z-index: 0;
                }

                .orb-1 {
                    width: 300px;
                    height: 300px;
                    background: hsl(var(--primary));
                    top: -20%;
                    right: -10%;
                }

                .orb-2 {
                    width: 250px;
                    height: 250px;
                    background: #a855f7;
                    bottom: -10%;
                    left: -10%;
                }

                .features-section {
                    padding: 4rem 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    width: 100%;
                }

                .section-title {
                    text-align: center;
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 3rem;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                }

                .feature-card {
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 1rem;
                    transition: transform 0.3s ease;
                }
                
                .feature-card:hover {
                    transform: translateY(-5px);
                }

                .feature-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 0.5rem;
                }

                .bg-primary-soft { background: hsla(var(--primary), 0.1); }
                .bg-success-soft { background: hsla(var(--success), 0.1); }
                .bg-warning-soft { background: hsla(var(--warning), 0.1); }
                .text-success { color: hsl(var(--success)); }
                .text-warning { color: hsl(var(--warning)); }

                .landing-footer {
                    text-align: center;
                    padding: 4rem 2rem;
                    margin-top: auto;
                    border-top: 1px solid var(--border);
                }

                @media (max-width: 768px) {
                    .hero-section {
                        flex-direction: column;
                        text-align: center;
                        padding-top: 6rem;
                    }
                    
                    .hero-title {
                        font-size: 2.5rem;
                    }
                    
                    .hero-actions {
                        justify-content: center;
                    }
                    
                    .landing-nav {
                        padding: 0.75rem 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
}
