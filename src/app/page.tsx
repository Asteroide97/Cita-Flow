import { ClinicTypes } from "@/components/landing/clinic-types";
import { FAQSection } from "@/components/landing/faq-section";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PatientFlow } from "@/components/landing/patient-flow";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { ResultsSection } from "@/components/landing/results-section";

export default function HomePage() {
  return (
    <main id="top" className="relative overflow-hidden">
      <Header />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <ClinicTypes />
      <PatientFlow />
      <ResultsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
