import React from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import StatsSection from './StatsSection';
import CategoriesSection from './CategoriesSection';
import WhySection from './WhySection';
import Footer from './Footer';
import '../LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page-wrapper">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <CategoriesSection />
        <WhySection />
      </main>
      <Footer />
    </div>
  );
}
