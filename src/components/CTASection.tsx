import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Leaf } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Decorative background */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-card border border-border/50 shadow-medium -z-10" />
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl" />

          <div className="p-12 md:p-16 relative">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-8 shadow-glow">
              <Leaf className="w-8 h-8 text-primary-foreground" />
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-6">
              Ready to Transform Your{" "}
              <span className="text-gradient-hero">Agricultural</span> Business?
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Join thousands of farmers, buyers, and partners who are already 
              benefiting from AgriNext Gen's connected ecosystem.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup" className="gap-2">
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
