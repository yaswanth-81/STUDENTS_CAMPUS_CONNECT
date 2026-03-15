import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">StudentsConnect</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your campus skill marketplace. Connect, collaborate, and grow with peers from your college.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Platform</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/browse" className="block hover:text-foreground transition-colors">Browse Services</Link>
              <Link to="/signup" className="block hover:text-foreground transition-colors">Become a Seller</Link>
              <Link to="/" className="block hover:text-foreground transition-colors">Categories</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Support</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="#" className="block hover:text-foreground transition-colors">Help Center</a>
              <a href="#" className="block hover:text-foreground transition-colors">Trust & Safety</a>
              <a href="#" className="block hover:text-foreground transition-colors">Contact Us</a>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Legal</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="#" className="block hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="block hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="block hover:text-foreground transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} StudentsConnect. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
