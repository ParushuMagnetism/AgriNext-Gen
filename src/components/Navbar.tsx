import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Leaf, User, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const getRoleDashboard = (role: string | null) => {
    const routes: Record<string, string> = {
      farmer: "/farmer/dashboard",
      buyer: "/marketplace/dashboard",
      agent: "/agent/dashboard",
      logistics: "/logistics/dashboard",
      admin: "/admin/dashboard",
    };
    return routes[role || ""] || "/";
  };

  const getRoleLabel = (role: string | null) => {
    const labels: Record<string, string> = {
      farmer: "Farmer",
      buyer: "Buyer",
      agent: "Agent",
      logistics: "Logistics",
      admin: "Admin",
    };
    return labels[role || ""] || "User";
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">
              AgriNext <span className="text-primary">Gen</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Home
            </Link>
            <Link to="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Marketplace
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              About
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="capitalize">{getRoleLabel(userRole)}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate(getRoleDashboard(userRole))}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    My Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/marketplace"
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                Marketplace
              </Link>
              <Link
                to="/about"
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
              <div className="flex flex-col gap-2 px-4 pt-4 border-t border-border/50">
                {user ? (
                  <>
                    <Button variant="outline" asChild onClick={() => setIsOpen(false)}>
                      <Link to={getRoleDashboard(userRole)}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        My Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" onClick={() => { handleSignOut(); setIsOpen(false); }} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild>
                      <Link to="/login">Log In</Link>
                    </Button>
                    <Button variant="hero" asChild>
                      <Link to="/signup">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;