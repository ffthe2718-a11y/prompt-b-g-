import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Salon } from "@/types/salon";
import { publicApi } from "@/lib/api";
import { Loader2 } from "lucide-react";
import SalonSite from "@/components/site/SalonSite";
import NotFound from "@/pages/NotFound";

function setMetaTag(attribute: "name" | "property", key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
}

export default function PublicSalon() {
  const { slug = "" } = useParams();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setSalon(null);
    window.scrollTo({ top: 0, behavior: "auto" });

    publicApi
      .getSalon(slug)
      .then(({ salon: result }) => {
        if (cancelled) return;
        setSalon(result);
        setStatus("ready");
      })
      .catch((error: any) => {
        if (cancelled) return;
        if (error?.status === 404) {
          setStatus("missing");
        } else {
          setMessage(error?.message || "This website could not be loaded.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!salon) return;
    const origin = window.location.origin;
    const url = `${origin}/${salon.slug}`;
    const image = salon.heroImageUrl
      ? salon.heroImageUrl.startsWith("/")
        ? `${origin}${salon.heroImageUrl}`
        : salon.heroImageUrl
      : "";
    const title = salon.seoTitle || `${salon.name}${salon.city ? ` — Salon in ${salon.city}` : " — Salon"}`;
    const description =
      salon.seoDescription ||
      salon.description ||
      salon.tagline ||
      `Book an appointment at ${salon.name}${salon.city ? ` in ${salon.city}` : ""}.`;

    document.title = title;
    setMetaTag("name", "description", description);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:type", "website");
    setMetaTag("property", "og:url", url);
    if (image) setMetaTag("property", "og:image", image);
    setMetaTag("name", "twitter:card", "summary_large_image");
    setCanonical(url);

    let schema = document.getElementById("salon-schema") as HTMLScriptElement | null;
    if (!schema) {
      schema = document.createElement("script");
      schema.id = "salon-schema";
      schema.type = "application/ld+json";
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HairSalon",
      name: salon.name,
      description,
      url,
      image: image || undefined,
      logo: salon.logoUrl || undefined,
      telephone: salon.phone || undefined,
      email: salon.email || undefined,
      priceRange: salon.priceFrom
        ? `${salon.currency} ${Math.round(salon.priceFrom)}+`
        : undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: salon.address || undefined,
        addressLocality: salon.city || undefined,
        addressRegion: salon.state || undefined,
        postalCode: salon.postalCode || undefined,
        addressCountry: salon.country || undefined,
      },
      aggregateRating:
        salon.ratingCount > 0
          ? {
              "@type": "AggregateRating",
              ratingValue: salon.rating,
              reviewCount: salon.ratingCount,
            }
          : undefined,
      makesOffer: salon.services.slice(0, 10).map((service) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: service.name },
        price: service.price,
        priceCurrency: salon.currency,
      })),
    });

    return () => {
      schema?.remove();
    };
  }, [salon]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080807]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/40">Opening the salon</p>
        </div>
      </div>
    );
  }

  if (status === "missing") {
    return <NotFound />;
  }

  if (status === "error" || !salon) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080807] px-6 text-center">
        <p className="font-serif text-3xl text-white">This website is taking a moment.</p>
        <p className="mt-3 max-w-sm text-[11px] leading-relaxed text-white/50">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-full border border-[#D4AF37]/40 px-5 py-2.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]"
        >
          Try again
        </button>
      </div>
    );
  }

  return <SalonSite salon={salon} />;
}
