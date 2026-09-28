import { Link } from "react-router-dom";
import { Scissors, Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <span className="text-2xl font-bold font-serif tracking-[0.1em] uppercase text-primary">Aurelia Luxe</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Experience the pinnacle of hair artistry in Mumbai's finest luxury salon.
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-semibold uppercase tracking-widest text-foreground">Navigation</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">Services</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-semibold uppercase tracking-widest text-foreground">Contact</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>101, Turner Road, Bandra West</li>
              <li>Mumbai, MH 400050</li>
              <li>+91 98765 43210</li>
              <li>hello@aurelia.luxe</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-semibold uppercase tracking-widest text-foreground">Connect</h4>
            <div className="flex flex-col gap-4">
              <a href="https://instagram.com/aurelialuxe" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group">
                <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                  <Instagram className="h-4 w-4" />
                </div>
                <span>Instagram</span>
              </a>
              <a href="https://facebook.com/aurelialuxe" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group">
                <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                  <Facebook className="h-4 w-4" />
                </div>
                <span>Facebook</span>
              </a>
              <a href="https://twitter.com/aurelialuxe" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group">
                <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                  <Twitter className="h-4 w-4" />
                </div>
                <span>Twitter</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            © {new Date().getFullYear()} Aurelia Luxe. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
