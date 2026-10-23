import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Music2,
  Phone,
  Send,
  Twitter,
  X,
} from "lucide-react";
import type { Salon } from "@/types/salon";
import type { SiteTheme } from "@/components/site/theme";
import { initials, fullAddress, mapsLink, instagramUrl, facebookUrl, twitterUrl, tiktokUrl, whatsappLink } from "@/lib/salonUi";
import { publicApi } from "@/lib/api";
import { toast } from "sonner";

const sectionLinks = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "team", label: "Team" },
  { id: "gallery", label: "Gallery" },
  { id: "reviews", label: "Reviews" },
  { id: "contact", label: "Contact" },
];

function LogoLockup({ salon, theme, size = "default" }: { salon: Salon; theme: SiteTheme; size?: "default" | "large" }) {
  const dimension = size === "large" ? "h-14 w-14" : "h-9 w-9";
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`flex ${dimension} shrink-0 items-center justify-center overflow-hidden rounded-full border`}
        style={{ borderColor: `${theme.accent}66`, backgroundColor: theme.accentSoft, color: theme.accent }}
      >
        {salon.logoUrl ? (
          <img src={salon.logoUrl} alt={`${salon.name} logo`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="font-serif text-xs tracking-wider">{initials(salon.name)}</span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-serif text-sm tracking-wide" style={{ color: theme.ink }}>
          {salon.name}
        </span>
        {salon.city && (
          <span className="mt-0.5 block truncate text-[7px] font-bold uppercase tracking-[0.24em]" style={{ color: theme.muted }}>
            {salon.city}
          </span>
        )}
      </span>
    </span>
  );
}

export function AnnouncementBar({ salon, theme }: { salon: Salon; theme: SiteTheme }) {
  if (!salon.announcement) return null;
  return (
    <div
      className="relative z-[60] flex items-center justify-center px-4 py-2 text-center"
      style={{ backgroundColor: theme.accent, color: theme.accentText }}
    >
      <p className="text-[8px] font-bold uppercase tracking-[0.22em]">{salon.announcement}</p>
    </div>
  );
}

export function SalonNav({ salon, theme, onBook }: { salon: Salon; theme: SiteTheme; onBook: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const enabled = new Set(salon.sections.filter((section) => section.enabled).map((section) => section.id));
  const hasContent = (id: string) => {
    switch (id) {
      case "about":
        return Boolean(salon.aboutText || salon.description || salon.aboutImageUrl || salon.heroImageUrl);
      case "services":
        return salon.services.length > 0;
      case "team":
        return salon.staff.length > 0;
      case "gallery":
        return salon.gallery.length > 0;
      case "reviews":
        return true;
      case "contact":
        return Boolean(fullAddress(salon) || salon.phone || salon.email);
      default:
        return true;
    }
  };
  const links = sectionLinks.filter((link) => enabled.has(link.id) && hasContent(link.id));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b transition-all duration-300"
      style={{
        borderColor: scrolled ? theme.border : "transparent",
        backgroundColor: scrolled ? theme.navBlur : "transparent",
        backdropFilter: scrolled ? "blur(18px)" : "none",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <a href="#top" className="shrink-0">
          <LogoLockup salon={salon} theme={theme} />
        </a>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="text-[9px] font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-60"
              style={{ color: theme.ink }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {salon.phone && (
            <a
              href={`tel:${salon.phone.replace(/[^\d+]/g, "")}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-opacity hover:opacity-70"
              style={{ borderColor: theme.border, color: theme.ink }}
              aria-label={`Call ${salon.name}`}
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={onBook}
            className="h-9 rounded-full px-5 text-[9px] font-bold uppercase tracking-[0.18em] transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: theme.accent, color: theme.accentText }}
          >
            {salon.ctaText || "Book now"}
          </button>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full border md:hidden"
          style={{ borderColor: theme.border, color: theme.ink }}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex flex-col md:hidden"
            style={{ backgroundColor: theme.bg, color: theme.ink }}
          >
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: theme.border }}>
              <LogoLockup salon={salon} theme={theme} />
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border"
                style={{ borderColor: theme.border, color: theme.ink }}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-1 flex-col justify-between p-6">
              <nav className="space-y-1">
                {links.map((link, index) => (
                  <motion.a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex items-center justify-between border-b py-4 font-serif text-2xl"
                    style={{ borderColor: theme.border, color: theme.ink }}
                  >
                    {link.label}
                    <ArrowUpRight className="h-4 w-4" style={{ color: theme.accent }} />
                  </motion.a>
                ))}
              </nav>
              <div className="space-y-3 pt-6">
                <button
                  onClick={() => {
                    setOpen(false);
                    onBook();
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ backgroundColor: theme.accent, color: theme.accentText }}
                >
                  <CalendarDays className="h-4 w-4" /> {salon.ctaText || "Book appointment"}
                </button>
                <div className="flex flex-col gap-1 text-[10px]" style={{ color: theme.muted }}>
                  {salon.phone && (
                    <a href={`tel:${salon.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 py-1">
                      <Phone className="h-3 w-3" /> {salon.phone}
                    </a>
                  )}
                  {salon.email && (
                    <a href={`mailto:${salon.email}`} className="flex items-center gap-2 py-1">
                      <Mail className="h-3 w-3" /> {salon.email}
                    </a>
                  )}
                  {fullAddress(salon) && (
                    <span className="flex items-start gap-2 py-1">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {fullAddress(salon)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function SalonFooter({ salon, theme }: { salon: Salon; theme: SiteTheme }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const enabled = new Set(salon.sections.filter((section) => section.enabled).map((section) => section.id));
  const socials = [
    { url: instagramUrl(salon.instagram), icon: Instagram, label: "Instagram" },
    { url: facebookUrl(salon.facebook), icon: Facebook, label: "Facebook" },
    { url: twitterUrl(salon.twitter), icon: Twitter, label: "Twitter" },
    { url: tiktokUrl(salon.tiktok), icon: Music2, label: "TikTok" },
    { url: salon.website, icon: Globe, label: "Website" },
  ].filter((item) => item.url);

  const handleSubscribe = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      await publicApi.subscribe(salon.slug, email);
      setSubscribed(true);
      setEmail("");
      toast.success("You are on the list.");
    } catch (err: any) {
      toast.error(err?.message || "Could not subscribe right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="border-t" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
      <div className="mx-auto w-full max-w-[1240px] px-4 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.8fr_1fr]">
          <div>
            <LogoLockup salon={salon} theme={theme} size="large" />
            <p className="mt-5 max-w-xs text-xs leading-relaxed" style={{ color: theme.muted }}>
              {salon.tagline || salon.description || `Welcome to ${salon.name}.`}
            </p>
            {socials.length > 0 && (
              <div className="mt-5 flex gap-2">
                {socials.map(({ url, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border transition-opacity hover:opacity-70"
                    style={{ borderColor: theme.border, color: theme.ink }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: theme.ink }}>Explore</h4>
            <ul className="mt-4 space-y-2.5">
              {sectionLinks
                .filter((link) => enabled.has(link.id))
                .map((link) => (
                  <li key={link.id}>
                    <a href={`#${link.id}`} className="text-[11px] transition-opacity hover:opacity-60" style={{ color: theme.muted }}>
                      {link.label}
                    </a>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: theme.ink }}>Visit</h4>
            <div className="mt-4 space-y-2.5 text-[11px]" style={{ color: theme.muted }}>
              {fullAddress(salon) && (
                <a href={mapsLink(salon)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:opacity-70">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" style={{ color: theme.accent }} />
                  <span>{fullAddress(salon)}</span>
                </a>
              )}
              {salon.phone && (
                <a href={`tel:${salon.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 hover:opacity-70">
                  <Phone className="h-3 w-3" style={{ color: theme.accent }} /> {salon.phone}
                </a>
              )}
              {salon.email && (
                <a href={`mailto:${salon.email}`} className="flex items-center gap-2 break-all hover:opacity-70">
                  <Mail className="h-3 w-3 shrink-0" style={{ color: theme.accent }} /> {salon.email}
                </a>
              )}
              {whatsappLink(salon.whatsapp || salon.phone) && (
                <a
                  href={whatsappLink(salon.whatsapp || salon.phone, `Hello ${salon.name}, I would like to book an appointment.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:opacity-70"
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#25D366" }} /> WhatsApp
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: theme.ink }}>Opening hours</h4>
            <div className="mt-4 space-y-1.5">
              {salon.hours.map((hour) => (
                <div key={hour.day} className="flex justify-between gap-3 text-[10px]">
                  <span style={{ color: theme.muted }}>{hour.day}</span>
                  <span style={{ color: hour.closed ? theme.muted : theme.ink }}>
                    {hour.closed ? "Closed" : `${hour.open} – ${hour.close}`}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubscribe} className="mt-6">
              <p className="text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.muted }}>
                {subscribed ? "You're on the list" : "Studio notes & offers"}
              </p>
              {!subscribed ? (
                <div className="mt-2 flex gap-1.5">
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    placeholder="Email address"
                    className="h-9 min-w-0 flex-1 rounded-lg border bg-transparent px-2.5 text-[10px] outline-none"
                    style={{ borderColor: theme.border, color: theme.ink }}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    aria-label="Subscribe"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg disabled:opacity-50"
                    style={{ backgroundColor: theme.accent, color: theme.accentText }}
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-[10px]" style={{ color: theme.muted }}>
                  Thank you — we will be in touch softly.
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-5 text-center sm:flex-row sm:text-left" style={{ borderColor: theme.border }}>
          <p className="text-[8px] uppercase tracking-[0.18em]" style={{ color: theme.muted }}>
            © {new Date().getFullYear()} {salon.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[8px] uppercase tracking-[0.16em]" style={{ color: theme.muted }}>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" /> {salon.timezone.replace("_", " ")}
            </span>
            <Link to="/" className="transition-opacity hover:opacity-60">
              Powered by Velvet Studio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
