import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Scissors,
  Star,
  Twitter,
  X,
} from "lucide-react";
import type { Salon } from "@/types/salon";
import { formatDuration, formatPrice } from "@/types/salon";
import { siteTheme } from "@/components/site/theme";
import { AnnouncementBar, SalonFooter, SalonNav } from "@/components/site/SalonChrome";
import BookingSection from "@/components/site/BookingSection";
import ReviewsSection, { Stars } from "@/components/site/ReviewsSection";
import LuxuryMapPlaceholder from "@/components/site/LuxuryMapPlaceholder";
import GiftCardPurchaseModal from "@/components/site/GiftCardPurchaseModal";
import {
  fullAddress,
  initials,
  instagramUrl,
  facebookUrl,
  twitterUrl,
  mapsLink,
  whatsappLink,
  DEFAULT_HOURS,
  formatTime12,
} from "@/lib/salonUi";
import { cn } from "@/lib/utils";

export default function SalonSite({ salon, preview = false }: { salon: Salon; preview?: boolean }) {
  const theme = useMemo(() => siteTheme(salon), [salon.template, salon.primaryColor, salon.accentColor]);
  const [selectedServiceId, setSelectedServiceId] = useState(salon.services[0]?.id ?? "");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [category, setCategory] = useState("All");
  const [lightbox, setLightbox] = useState<{ imageUrl: string; caption: string } | null>(null);
  const [giftModalOpen, setGiftModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      if (search.has("gift")) {
        setGiftModalOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    if (salon.services.length && !salon.services.some((service) => service.id === selectedServiceId)) {
      setSelectedServiceId(salon.services[0].id);
    }
  }, [salon.services, selectedServiceId]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [lightbox]);

  const enabled = (id: string) => salon.sections.some((section) => section.id === id && section.enabled);
  const orderedSections = [...salon.sections].filter((section) => section.enabled).sort((a, b) => a.order - b.order);
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(salon.services.map((service) => service.category).filter(Boolean)))],
    [salon.services]
  );
  const visibleServices = useMemo(
    () => (category === "All" ? salon.services : salon.services.filter((service) => service.category === category)),
    [salon.services, category]
  );

  const book = (serviceId?: string, staffId?: string) => {
    if (serviceId) setSelectedServiceId(serviceId);
    if (staffId) setSelectedStaffId(staffId);
    const target = enabled("booking") ? "booking" : enabled("contact") ? "contact" : null;
    if (!target) return;
    window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  const heroEnabled = enabled("hero");
  const hasHeroImage = Boolean(salon.heroImageUrl);
  const renderSection = (id: string) => {
    switch (id) {
      case "about": {
        if (!salon.aboutText && !salon.description && !salon.aboutImageUrl) return null;
        const image = salon.aboutImageUrl || salon.heroImageUrl;
        return (
          <section
            key="about"
            id="about"
            className="scroll-mt-20 border-t py-16 sm:py-24"
            style={{ borderColor: theme.border, backgroundColor: theme.bg }}
          >
            <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-4 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5 }}
                className="relative order-2 lg:order-1"
              >
                <div className="relative overflow-hidden rounded-[28px] border" style={{ borderColor: theme.border }}>
                  {image ? (
                    <img
                      src={image}
                      alt={`Inside ${salon.name}`}
                      className="aspect-[4/5] w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="flex aspect-[4/5] flex-col items-center justify-center gap-3"
                      style={{ background: theme.heroFallback }}
                    >
                      <span className="font-serif text-7xl opacity-30" style={{ color: theme.accent }}>
                        {initials(salon.name)}
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-[0.3em]" style={{ color: theme.muted }}>
                        {salon.city || "Our studio"}
                      </span>
                    </div>
                  )}
                  {salon.logoUrl && (
                    <div
                      className="absolute bottom-4 left-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 shadow-xl"
                      style={{ borderColor: theme.accent, backgroundColor: theme.bg }}
                    >
                      <img src={salon.logoUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
                <div
                  className="absolute -right-3 -top-3 hidden rounded-full border px-4 py-2 shadow-xl sm:flex"
                  style={{ borderColor: theme.border, backgroundColor: theme.surface, color: theme.ink }}
                >
                  <span className="text-[8px] font-bold uppercase tracking-[0.18em]">
                    {salon.city ? `${salon.city} · ` : ""}Est. with care
                  </span>
                </div>
              </motion.div>

              <div className="order-1 lg:order-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: theme.accent }}>
                  Our story
                </span>
                <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl" style={{ color: theme.ink }}>
                  {salon.aboutTitle || `A quiet kind of luxury.`}
                </h2>
                <div
                  className="mt-6 space-y-4 text-sm font-light leading-relaxed"
                  style={{ color: theme.muted }}
                >
                  {(salon.aboutText || salon.description || salon.tagline)
                    .split(/\n{2,}/)
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4 border-t pt-5" style={{ borderColor: theme.border }}>
                  <div>
                    <p className="font-serif text-2xl" style={{ color: theme.ink }}>{salon.services.length}</p>
                    <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.muted }}>Services</p>
                  </div>
                  <div>
                    <p className="font-serif text-2xl" style={{ color: theme.ink }}>{salon.staff.length}</p>
                    <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.muted }}>Artists</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 font-serif text-2xl" style={{ color: theme.ink }}>
                      {salon.ratingCount > 0 ? salon.rating.toFixed(1) : "New"}
                      {salon.ratingCount > 0 && <Star className="h-3 w-3 fill-current" style={{ color: theme.accent }} />}
                    </p>
                    <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.muted }}>
                      {salon.ratingCount > 0 ? `${salon.ratingCount} reviews` : "First visit awaits"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => book()}
                  className="mt-7 inline-flex h-11 items-center gap-2 rounded-full px-6 text-[9px] font-bold uppercase tracking-[0.18em]"
                  style={{ backgroundColor: theme.accent, color: theme.accentText }}
                >
                  <CalendarDays className="h-3.5 w-3.5" /> Book a visit
                </button>
              </div>
            </div>
          </section>
        );
      }

      case "services":
        if (!salon.services.length) return null;
        return (
          <section
            key="services"
            id="services"
            className="scroll-mt-20 border-t py-16 sm:py-24"
            style={{ borderColor: theme.border, backgroundColor: theme.surface }}
          >
            <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-8">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: theme.accent }}>
                    The menu
                  </span>
                  <h2 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl" style={{ color: theme.ink }}>
                    Services & rituals.
                  </h2>
                </div>
                {categories.length > 1 && (
                  <div className="flex max-w-full flex-wrap gap-1.5">
                    {categories.map((item) => {
                      const active = category === item;
                      return (
                        <button
                          key={item}
                          onClick={() => setCategory(item)}
                          className="rounded-full border px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.14em] transition-all"
                          style={{
                            borderColor: active ? theme.accent : theme.border,
                            backgroundColor: active ? theme.accent : "transparent",
                            color: active ? theme.accentText : theme.muted,
                          }}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-2">
                {visibleServices.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ delay: (index % 4) * 0.04 }}
                    className="group flex flex-col justify-between rounded-2xl border p-5 transition-colors"
                    style={{ borderColor: theme.border, backgroundColor: theme.bg }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {service.category && (
                          <p className="text-[7px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.accent }}>
                            {service.category}
                          </p>
                        )}
                        <h3 className="mt-1 font-serif text-xl leading-tight" style={{ color: theme.ink }}>{service.name}</h3>
                        {service.description && (
                          <p className="mt-2 text-[11px] leading-relaxed" style={{ color: theme.muted }}>{service.description}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-serif text-xl" style={{ color: theme.ink }}>
                          {service.price > 0 ? formatPrice(service.price, salon.currency) : "Enquire"}
                        </p>
                        {service.durationMinutes > 0 && (
                          <p className="mt-0.5 text-[8px] uppercase tracking-[0.14em]" style={{ color: theme.muted }}>
                            {formatDuration(service.durationMinutes)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: theme.border }}>
                      <span className="text-[8px] uppercase tracking-[0.16em]" style={{ color: theme.muted }}>
                        {preview ? "Booking opens on publish" : "Available online"}
                      </span>
                      <button
                        onClick={() => book(service.id)}
                        className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.16em] transition-opacity hover:opacity-60"
                        style={{ color: theme.accent }}
                      >
                        Book this <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case "team":
        if (!salon.staff.length) return null;
        return (
          <section
            key="team"
            id="team"
            className="scroll-mt-20 border-t py-16 sm:py-24"
            style={{ borderColor: theme.border, backgroundColor: theme.bg }}
          >
            <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-8">
              <div className="max-w-xl">
                <span className="text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: theme.accent }}>
                  The people
                </span>
                <h2 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl" style={{ color: theme.ink }}>
                  Meet your artists.
                </h2>
                <p className="mt-3 text-xs leading-relaxed" style={{ color: theme.muted }}>
                  Skilled hands, good conversation and honest advice. Choose the person who feels right for you.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {salon.staff.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="group overflow-hidden rounded-2xl border"
                    style={{ borderColor: theme.border, backgroundColor: theme.surface }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {member.imageUrl ? (
                        <img
                          src={member.imageUrl}
                          alt={member.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center" style={{ background: theme.heroFallback }}>
                          <span className="font-serif text-5xl opacity-40" style={{ color: theme.accent }}>
                            {initials(member.name)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="font-serif text-xl text-white">{member.name}</h3>
                        {member.role && <p className="text-[8px] uppercase tracking-[0.16em] text-white/70">{member.role}</p>}
                      </div>
                      {member.experienceYears > 0 && (
                        <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[7px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                          {member.experienceYears}+ yrs
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      {member.bio && (
                        <p className="line-clamp-2 text-[11px] leading-relaxed" style={{ color: theme.muted }}>{member.bio}</p>
                      )}
                      {member.specialties.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {member.specialties.slice(0, 3).map((specialty) => (
                            <span
                              key={specialty}
                              className="rounded-full border px-2 py-0.5 text-[7px] uppercase tracking-[0.1em]"
                              style={{ borderColor: theme.border, color: theme.muted }}
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => book(undefined, member.id)}
                        className="mt-4 inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.16em]"
                        style={{ color: theme.accent }}
                      >
                        Book with {member.name.split(" ")[0]} <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case "gallery":
        if (!salon.gallery.length) return null;
        return (
          <section
            key="gallery"
            id="gallery"
            className="scroll-mt-20 border-t py-16 sm:py-24"
            style={{ borderColor: theme.border, backgroundColor: theme.surface }}
          >
            <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: theme.accent }}>
                    The lookbook
                  </span>
                  <h2 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl" style={{ color: theme.ink }}>
                    Work we're proud of.
                  </h2>
                </div>
                <span className="text-[9px] uppercase tracking-[0.16em]" style={{ color: theme.muted }}>
                  {salon.gallery.length} image{salon.gallery.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {salon.gallery.map((image, index) => (
                  <motion.button
                    key={image.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (index % 4) * 0.05 }}
                    onClick={() => setLightbox(image)}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border text-left",
                      index % 7 === 0 ? "sm:col-span-2 sm:row-span-2" : ""
                    )}
                    style={{ borderColor: theme.border }}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.caption || `${salon.name} gallery`}
                      className={cn(
                        "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105",
                        index % 7 === 0 ? "aspect-[4/3] sm:aspect-square" : "aspect-square"
                      )}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    {image.caption && (
                      <p className="absolute bottom-2 left-3 right-3 line-clamp-1 text-[9px] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        {image.caption}
                      </p>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </section>
        );

      case "reviews":
        return <ReviewsSection key="reviews" salon={salon} theme={theme} preview={preview} />;

      case "booking":
        return (
          <BookingSection
            key="booking"
            salon={salon}
            theme={theme}
            serviceId={selectedServiceId}
            onServiceChange={setSelectedServiceId}
            staffId={selectedStaffId}
            onStaffChange={setSelectedStaffId}
            preview={preview}
          />
        );

      case "contact": {
        if (!fullAddress(salon) && !salon.phone && !salon.email) return null;
        return (
          <section
            key="contact"
            id="contact"
            className="scroll-mt-20 border-t py-16 sm:py-24"
            style={{ borderColor: theme.border, backgroundColor: theme.bg }}
          >
            <div className="mx-auto grid w-full max-w-[1180px] gap-4 px-4 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border p-6 sm:p-9" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                <span className="text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: theme.accent }}>
                  Find us
                </span>
                <h2 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl" style={{ color: theme.ink }}>
                  Come sit with us.
                </h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="space-y-3 text-[11px]" style={{ color: theme.muted }}>
                    {fullAddress(salon) && (
                      <a href={mapsLink(salon)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 hover:opacity-70">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.accent }} />
                        <span>{fullAddress(salon)}</span>
                      </a>
                    )}
                    {salon.phone && (
                      <a href={`tel:${salon.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2.5 hover:opacity-70">
                        <Phone className="h-4 w-4 shrink-0" style={{ color: theme.accent }} /> {salon.phone}
                      </a>
                    )}
                    {salon.email && (
                      <a href={`mailto:${salon.email}`} className="flex items-center gap-2.5 break-all hover:opacity-70">
                        <Mail className="h-4 w-4 shrink-0" style={{ color: theme.accent }} /> {salon.email}
                      </a>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.ink }}>
                      <Clock className="h-3 w-3" style={{ color: theme.accent }} /> Opening hours
                    </p>
                    <div className="space-y-1">
                      {(salon.hours && salon.hours.length > 0 ? salon.hours : DEFAULT_HOURS).map((hour) => (
                        <div key={hour.day} className="flex justify-between gap-3 text-[10px]">
                          <span style={{ color: theme.muted }}>{hour.day}</span>
                          <span style={{ color: hour.closed ? theme.muted : theme.ink }}>
                            {hour.closed ? "Closed" : `${formatTime12(hour.open)} – ${formatTime12(hour.close)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-7 flex flex-wrap gap-2">
                  <button
                    onClick={() => book()}
                    className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-[9px] font-bold uppercase tracking-[0.16em]"
                    style={{ backgroundColor: theme.accent, color: theme.accentText }}
                  >
                    <CalendarDays className="h-3.5 w-3.5" /> Book appointment
                  </button>
                  {fullAddress(salon) && (
                    <a
                      href={mapsLink(salon)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[9px] font-bold uppercase tracking-[0.16em]"
                      style={{ borderColor: theme.border, color: theme.ink }}
                    >
                      <MapPin className="h-3.5 w-3.5" /> Directions
                    </a>
                  )}
                </div>

                {/* Social Channels */}
                {(salon.instagram || salon.facebook || salon.twitter || salon.whatsapp) && (
                  <div className="mt-6 border-t pt-5" style={{ borderColor: theme.border }}>
                    <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.muted }}>
                      Connect with us
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {whatsappLink(salon.whatsapp || salon.phone, `Hello ${salon.name}, I would like to book an appointment.`) && (
                        <a
                          href={whatsappLink(salon.whatsapp || salon.phone, `Hello ${salon.name}, I would like to book an appointment.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[8px] font-bold uppercase tracking-[0.14em]"
                          style={{ backgroundColor: "#128C4A", color: "#fff" }}
                        >
                          <MessageCircle className="h-3 w-3" /> WhatsApp
                        </a>
                      )}
                      {salon.instagram && (
                        <a
                          href={instagramUrl(salon.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[8px] font-bold uppercase tracking-[0.14em]"
                          style={{ borderColor: theme.border, color: theme.ink }}
                        >
                          <Instagram className="h-3 w-3" /> @{salon.instagram}
                        </a>
                      )}
                      {salon.facebook && (
                        <a
                          href={facebookUrl(salon.facebook)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[8px] font-bold uppercase tracking-[0.14em]"
                          style={{ borderColor: theme.border, color: theme.ink }}
                        >
                          <Facebook className="h-3 w-3" /> Facebook
                        </a>
                      )}
                      {salon.twitter && (
                        <a
                          href={twitterUrl(salon.twitter)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[8px] font-bold uppercase tracking-[0.14em]"
                          style={{ borderColor: theme.border, color: theme.ink }}
                        >
                          <Twitter className="h-3 w-3" /> @{salon.twitter}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Column 2: Static Map Placeholder */}
              <LuxuryMapPlaceholder salon={salon} theme={theme} className="h-full min-h-[380px]" />
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      id="top"
      className={cn("min-h-screen w-full overflow-x-clip font-sans", preview ? "" : "pb-14 md:pb-0")}
      style={{ ...theme.vars, backgroundColor: theme.bg, color: theme.ink } as CSSProperties}
    >
      <AnnouncementBar salon={salon} theme={theme} />
      <SalonNav
        salon={salon}
        theme={theme}
        onBook={() => book()}
        onBuyGiftCard={() => setGiftModalOpen(true)}
      />

      {heroEnabled && (
        <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden sm:min-h-[660px]">
          {salon.backgroundImageUrl ? (
            <img
              src={salon.backgroundImageUrl}
              alt="Site background"
              className="absolute inset-0 h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : hasHeroImage ? (
            <img
              src={salon.heroImageUrl}
              alt={`${salon.name} salon`}
              className="absolute inset-0 h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: theme.heroFallback }} />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.72) 100%)",
            }}
          />
          {!hasHeroImage && (
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{ backgroundColor: `${theme.accent}1f` }}
            />
          )}

          <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-16 pt-20 text-center sm:px-8">
            {salon.logoUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                className="mb-6 h-20 w-20 overflow-hidden rounded-full border-2 shadow-2xl sm:h-24 sm:w-24"
                style={{ borderColor: `${theme.accent}88` }}
              >
                <img src={salon.logoUrl} alt={`${salon.name} logo`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </motion.div>
            )}

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-[8px] font-bold uppercase tracking-[0.42em] sm:text-[9px]"
              style={{ color: theme.accent }}
            >
              {salon.tagline || (salon.city ? `${salon.city} · Hair & beauty` : "Independent salon studio")}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08 }}
              className="mt-4 font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl lg:text-8xl"
              style={{ color: hasHeroImage ? "#ffffff" : theme.isLight ? theme.ink : "#ffffff" }}
            >
              {salon.heroTitle || salon.name}
            </motion.h1>

            {(salon.heroSubtitle || salon.description) && (
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.18 }}
                className="mt-5 max-w-lg text-xs leading-relaxed sm:text-sm"
                style={{ color: hasHeroImage ? "rgba(255,255,255,0.78)" : theme.isLight ? theme.muted : "rgba(255,255,255,0.75)" }}
              >
                {salon.heroSubtitle || salon.description}
              </motion.p>
            )}

            {salon.ratingCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.32 }}
                className="mt-5 flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md"
                style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(0,0,0,0.25)" }}
              >
                <Stars rating={salon.rating} size="h-3 w-3" color={theme.accent} emptyColor="rgba(255,255,255,0.3)" />
                <span className="text-[9px] font-semibold text-white">{salon.rating.toFixed(1)}</span>
                <span className="text-[8px] text-white/55">({salon.ratingCount} reviews)</span>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-col items-center gap-2.5 sm:flex-row"
            >
              <button
                onClick={() => book()}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-7 text-[10px] font-bold uppercase tracking-[0.2em] transition-transform hover:scale-[1.02] sm:w-auto"
                style={{ backgroundColor: theme.accent, color: theme.accentText }}
              >
                <CalendarDays className="h-3.5 w-3.5" /> {salon.ctaText || "Book appointment"}
              </button>
              {enabled("services") && salon.services.length > 0 && (
                <a
                  href="#services"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border px-6 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-md sm:w-auto"
                  style={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff", backgroundColor: "rgba(0,0,0,0.15)" }}
                >
                  View services <ArrowDown className="h-3.5 w-3.5" />
                </a>
              )}
            </motion.div>

            {(salon.city || salon.phone) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[9px] uppercase tracking-[0.14em]"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {salon.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" style={{ color: theme.accent }} /> {salon.city}
                  </span>
                )}
                {salon.phone && (
                  <a href={`tel:${salon.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-white">
                    <Phone className="h-3 w-3" style={{ color: theme.accent }} /> {salon.phone}
                  </a>
                )}
              </motion.div>
            )}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <a href="#about" aria-label="Scroll to content" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/60">
              <ArrowDown className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>
      )}

      {!heroEnabled && (
        <div className="mx-auto w-full max-w-[1180px] px-4 pb-6 pt-10 sm:px-8">
          <span className="text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: theme.accent }}>
            {salon.tagline || "Welcome"}
          </span>
          <h1 className="mt-2 font-serif text-5xl leading-tight" style={{ color: theme.ink }}>{salon.heroTitle || salon.name}</h1>
        </div>
      )}

      {orderedSections.map((section) => renderSection(section.id))}

      <SalonFooter salon={salon} theme={theme} />

      {/* WhatsApp */}
      {whatsappLink(salon.whatsapp || salon.phone, `Hello ${salon.name}, I would like to book an appointment.`) && (
        <a
          href={whatsappLink(salon.whatsapp || salon.phone, `Hello ${salon.name}, I would like to book an appointment.`)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#128C4A] text-white shadow-2xl transition-transform hover:scale-105 md:bottom-6"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
      )}

      {/* Mobile booking bar */}
      {!preview && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t px-3 py-2.5 backdrop-blur-xl md:hidden"
          style={{ borderColor: theme.border, backgroundColor: theme.navBlur }}
        >
          {salon.phone ? (
            <a
              href={`tel:${salon.phone.replace(/[^\d+]/g, "")}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
              style={{ borderColor: theme.border, color: theme.ink }}
              aria-label="Call salon"
            >
              <Phone className="h-4 w-4" />
            </a>
          ) : null}
          <button
            onClick={() => book()}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-[9px] font-bold uppercase tracking-[0.18em]"
            style={{ backgroundColor: theme.accent, color: theme.accentText }}
          >
            <CalendarDays className="h-3.5 w-3.5" /> {salon.ctaText || "Book appointment"}
          </button>
        </div>
      )}

      {/* Gallery lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white"
              aria-label="Close image"
            >
              <X className="h-4 w-4" />
            </button>
            <motion.figure
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[85vh] max-w-4xl overflow-hidden rounded-2xl"
            >
              <img src={lightbox.imageUrl} alt={lightbox.caption} className="max-h-[78vh] w-full object-contain" referrerPolicy="no-referrer" />
              {lightbox.caption && (
                <figcaption className="bg-black/70 px-4 py-3 text-center text-[10px] text-white/75">
                  {lightbox.caption}
                </figcaption>
              )}
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift Card Purchase Modal */}
      <GiftCardPurchaseModal
        salonSlug={salon.slug}
        isOpen={giftModalOpen}
        onClose={() => setGiftModalOpen(false)}
      />
    </div>
  );
}
