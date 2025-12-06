import { 
  Globe2, 
  MessageSquare, 
  MapPin, 
  Shield, 
  Smartphone,
  TrendingUp 
} from "lucide-react";

const features = [
  {
    icon: Globe2,
    title: "Multi-Role Platform",
    description: "Dedicated dashboards for Farmers, Buyers, Agents, and Logistics partners with role-specific features.",
  },
  {
    icon: MessageSquare,
    title: "AI Multilingual Chatbot",
    description: "Get instant support in English, Hindi, and Kannada with our intelligent AI assistant.",
  },
  {
    icon: MapPin,
    title: "GPS Route Management",
    description: "Smart logistics routing and real-time tracking for efficient farm-to-market delivery.",
  },
  {
    icon: Shield,
    title: "Secure Authentication",
    description: "Phone OTP and email verification for trusted, secure transactions.",
  },
  {
    icon: Smartphone,
    title: "Real-Time Notifications",
    description: "Stay updated with instant alerts for orders, pickups, and market updates.",
  },
  {
    icon: TrendingUp,
    title: "Market Insights",
    description: "Access data-driven insights on pricing, demand trends, and crop analytics.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-gradient-card relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-accent/5 blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Features</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mt-3 mb-4">
            Everything You Need to{" "}
            <span className="text-gradient-hero">Grow</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A comprehensive suite of tools designed for every stakeholder in the agricultural value chain.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border/50 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-hero flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-glow">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
