import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Rocket } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 md:py-24 relative overflow-hidden bg-muted/20">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center relative">
          {/* Decorative background */}
          <div className="absolute inset-0 rounded-3xl bg-card border border-border/60 shadow-premium -z-10" />
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />

          <div className="p-8 md:p-12 lg:p-16 relative">
            {/* Icon */}
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-premium flex items-center justify-center mx-auto mb-8">
              <Rocket className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
            </div>

            <h2 className="text-[22px] sm:text-[28px] md:text-[36px] font-display font-bold mb-4 text-foreground leading-tight">
              Built for Pilots.{" "}
              <span className="text-gradient-hero">Designed to Scale</span>{" "}
              Across India.
            </h2>

            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Start district-wise, prove unit economics, and scale through partnerships.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild className="min-h-[48px] px-8 text-base font-semibold rounded-2xl btn-hover-darken">
                <Link to="/signup" className="gap-2">
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild className="min-h-[48px] px-8 text-base font-medium rounded-2xl border-2">
                <Link to="/contact">Request Collaboration</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
