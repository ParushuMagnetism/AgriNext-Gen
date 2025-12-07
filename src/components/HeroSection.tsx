import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Users, ShoppingBag, Truck, ClipboardList } from "lucide-react";

const HeroSection = () => {
  const roleCards = [
    { icon: Users, label: "Farmers", desc: "Sell directly", color: "bg-primary", link: "/signup" },
    { icon: ShoppingBag, label: "Buyers", desc: "Source quality", color: "bg-accent", link: "/signup" },
    { icon: ClipboardList, label: "Agents", desc: "Collect data", color: "bg-primary", link: "/signup" },
    { icon: Truck, label: "Logistics", desc: "Deliver goods", color: "bg-accent", link: "/signup" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-earth opacity-50" />
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23166534' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Elements */}
      <div className="absolute top-32 left-[10%] w-20 h-20 rounded-full bg-primary/10 animate-float blur-xl" />
      <div className="absolute bottom-32 right-[15%] w-32 h-32 rounded-full bg-accent/20 animate-float-delayed blur-xl" />
      <div className="absolute top-1/2 right-[8%] w-16 h-16 rounded-full bg-primary/15 animate-float blur-lg" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
            <span className="text-sm font-medium text-primary">Connecting India's Agricultural Ecosystem</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6 animate-slide-up">
            Empowering{" "}
            <span className="text-gradient-hero">Farmers</span>,{" "}
            <br className="hidden sm:block" />
            Connecting{" "}
            <span className="text-gradient-accent">Markets</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            A unified platform bringing together farmers, buyers, agents, and logistics partners 
            to create a seamless agricultural marketplace across India.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/signup" className="gap-2">
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link to="/login">Sign In to Platform</Link>
            </Button>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {roleCards.map((role) => (
              <Link
                key={role.label}
                to={role.link}
                className="group p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl ${role.color} flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform`}>
                  <role.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground">{role.label}</h3>
                <p className="text-sm text-muted-foreground">{role.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
