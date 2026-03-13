import { Navbar } from "@/components/landing/Navbar";
import { AnimatedGrid } from "@/components/landing/AnimatedGrid";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Roadmap } from "@/components/landing/Roadmap";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <AnimatedGrid />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Roadmap />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
