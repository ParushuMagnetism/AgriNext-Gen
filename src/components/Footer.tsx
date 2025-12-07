import { Link } from "react-router-dom";
import { Leaf, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-sidebar text-sidebar-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold">
                AgriNext <span className="text-sidebar-primary">Gen</span>
              </span>
            </Link>
            <p className="text-sidebar-foreground/70 text-sm leading-relaxed">
              Empowering India's agricultural ecosystem through technology, 
              connecting farmers directly to markets.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Platform</h4>
            <ul className="space-y-3 text-sidebar-foreground/70">
              <li><Link to="/signup" className="hover:text-sidebar-primary transition-colors">For Farmers</Link></li>
              <li><Link to="/signup" className="hover:text-sidebar-primary transition-colors">For Buyers</Link></li>
              <li><Link to="/signup" className="hover:text-sidebar-primary transition-colors">For Agents</Link></li>
              <li><Link to="/signup" className="hover:text-sidebar-primary transition-colors">For Logistics</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Company</h4>
            <ul className="space-y-3 text-sidebar-foreground/70">
              <li><Link to="/about" className="hover:text-sidebar-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-sidebar-primary transition-colors">Contact</Link></li>
              <li><Link to="/login" className="hover:text-sidebar-primary transition-colors">Sign In</Link></li>
              <li><Link to="/signup" className="hover:text-sidebar-primary transition-colors">Sign Up</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Contact</h4>
            <ul className="space-y-3 text-sidebar-foreground/70">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sidebar-primary" />
                <span>support@agrinextgen.in</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-sidebar-primary" />
                <span>+91 1800-XXX-XXXX</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-sidebar-primary mt-1" />
                <span>Bengaluru, Karnataka, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-sidebar-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sidebar-foreground/60 text-sm">
            © 2024 AgriNext Gen. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-sidebar-foreground/60">
            <Link to="/about" className="hover:text-sidebar-primary transition-colors">Privacy Policy</Link>
            <Link to="/about" className="hover:text-sidebar-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
