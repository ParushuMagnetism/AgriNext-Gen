import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Mail, Lock, User, Phone, ArrowRight, Users, ShoppingBag, ClipboardList, Truck, Loader2, Shield, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const roles: { id: AppRole; label: string; icon: typeof Users; description: string }[] = [
  { id: "farmer", label: "Farmer", icon: Users, description: "Sell your produce directly" },
  { id: "buyer", label: "Buyer", icon: ShoppingBag, description: "Source quality products" },
  { id: "agent", label: "Agent", icon: ClipboardList, description: "Collect field data" },
  { id: "logistics", label: "Logistics", icon: Truck, description: "Deliver goods" },
  { id: "admin", label: "Admin", icon: Shield, description: "Manage ecosystem" },
];

const roleRoutes: Record<string, string> = {
  farmer: "/farmer/dashboard",
  buyer: "/marketplace/dashboard",
  agent: "/agent/dashboard",
  logistics: "/logistics/dashboard",
  admin: "/admin/dashboard",
};

const Signup = () => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, refreshRole } = useAuth();

  // Redirect if already logged in with role
  useEffect(() => {
    if (user && userRole) {
      navigate(roleRoutes[userRole] || "/");
    }
  }, [user, userRole, navigate]);

  // Input validation
  const validateForm = useCallback(() => {
    if (!formData.name.trim()) {
      return "Please enter your full name";
    }
    if (!formData.email.trim()) {
      return "Please enter your email address";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return "Please enter a valid email address";
    }
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return null;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (step === 1 && selectedRole) {
      setStep(2);
      return;
    }
    
    if (step === 2) {
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        toast({
          title: "Validation Error",
          description: validationError,
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      try {
        const redirectUrl = `${window.location.origin}/`;

        // Sign up the user with role in metadata
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: formData.name.trim(),
              phone: formData.phone.trim() || null,
              role: selectedRole,
            },
          },
        });

        if (authError) {
          if (authError.message.includes("already registered")) {
            setError("This email is already registered. Please sign in instead.");
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            setError(authError.message);
            toast({
              title: "Signup failed",
              description: authError.message,
              variant: "destructive",
            });
          }
          return;
        }

        if (authData.user) {
          // Wait a moment for the trigger to create the profile
          await new Promise(resolve => setTimeout(resolve, 500));

          // Assign role explicitly (backup in case trigger doesn't work)
          const { error: roleError } = await supabase
            .from("user_roles")
            .upsert({
              user_id: authData.user.id,
              role: selectedRole as AppRole,
            }, { onConflict: 'user_id' });

          if (roleError) {
            console.error("Role assignment error:", roleError);
          }

          // Create role-specific profile
          if (selectedRole === "buyer") {
            await supabase
              .from("buyers")
              .upsert({
                user_id: authData.user.id,
                name: formData.name.trim(),
                phone: formData.phone.trim() || null,
              }, { onConflict: 'user_id' });
          } else if (selectedRole === "logistics") {
            await supabase
              .from("transporters")
              .upsert({
                user_id: authData.user.id,
                name: formData.name.trim(),
                phone: formData.phone.trim() || null,
              }, { onConflict: 'user_id' });
          } else if (selectedRole === "admin") {
            await supabase
              .from("admin_users")
              .upsert({
                user_id: authData.user.id,
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim() || null,
              }, { onConflict: 'user_id' });
          }

          // Refresh the role in auth context
          await refreshRole();

          toast({
            title: "Account created!",
            description: "Welcome to AgriNext Gen. You're now signed in.",
          });

          // Navigate to the appropriate dashboard
          navigate(roleRoutes[selectedRole] || "/");
        }
      } catch (error) {
        console.error("Signup error:", error);
        setError("An unexpected error occurred. Please try again.");
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const selectedRoleInfo = useMemo(() => 
    roles.find(r => r.id === selectedRole),
    [selectedRole]
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">
              AgriNext <span className="text-primary">Gen</span>
            </span>
          </Link>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <>
              {/* Step 1: Role Selection */}
              <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                  Join AgriNext Gen
                </h1>
                <p className="text-muted-foreground">
                  Select your role to get started
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                        selectedRole === role.id
                          ? "border-primary bg-primary/5 shadow-glow"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                        selectedRole === role.id ? "bg-gradient-hero" : "bg-muted"
                      }`}>
                        <role.icon className={`w-5 h-5 ${
                          selectedRole === role.id ? "text-primary-foreground" : "text-muted-foreground"
                        }`} />
                      </div>
                      <h3 className="font-display font-semibold text-foreground">{role.label}</h3>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </button>
                  ))}
                </div>

                <Button 
                  type="submit" 
                  variant="hero" 
                  className="w-full mt-6" 
                  size="lg"
                  disabled={!selectedRole}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Step 2: Account Details */}
              <div className="mb-8">
                <button
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
                  disabled={isLoading}
                  type="button"
                >
                  ← Back
                </button>
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                  Create your account
                </h1>
                <p className="text-muted-foreground">
                  Fill in your details as a{" "}
                  <span className="text-primary font-medium capitalize">{selectedRoleInfo?.label}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="pl-10 h-12"
                      disabled={isLoading}
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 h-12"
                      disabled={isLoading}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10 h-12"
                      disabled={isLoading}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 h-12"
                      disabled={isLoading}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">At least 6 characters</p>
                </div>

                <Button type="submit" variant="hero" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Login Link */}
          <p className="mt-8 text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 right-20 w-40 h-40 rounded-full border-2 border-primary-foreground/20" />
        <div className="absolute bottom-20 left-20 w-60 h-60 rounded-full border-2 border-primary-foreground/10" />
        <div className="absolute top-1/3 left-1/4 w-20 h-20 rounded-full bg-primary-foreground/10" />

        <div className="text-center text-primary-foreground relative z-10">
          <h2 className="text-4xl font-display font-bold mb-4">
            Join Our Growing Community
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Become part of India's largest agricultural network. Connect, trade, 
            and grow with thousands of farmers and buyers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
