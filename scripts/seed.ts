import "dotenv/config";
/**
 * Demo seed for local development and product previews.
 *
 * This script is OPTIONAL. It never runs automatically, and real owners always
 * start with a completely empty salon — they are never given demo content.
 *
 *   npm run seed
 *
 * It recreates two demonstration salons owned by demo accounts. The password
 * for both accounts is printed when the script finishes.
 */
import bcrypt from "bcryptjs";
import db, { newId, nowIso } from "../server/db";
import { DEFAULT_SECTIONS } from "../server/validation";
import { publicSalonBundle } from "../server/serializers";
import { contentHash } from "../server/approval";

const DEMO_ADMIN_EMAIL = "admin@velvet.demo";
const DEMO_PASSWORD = "velvet-demo";

const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function isoDate(offsetDays: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function hours(closedDays: string[] = ["Sunday"], open = "10:00", close = "20:00") {
  return WEEK.map((day) => ({
    day,
    closed: closedDays.includes(day),
    open,
    close,
  }));
}

interface SeedSalon {
  slug: string;
  ownerName: string;
  ownerEmail: string;
  name: string;
  tagline: string;
  description: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutText: string;
  announcement: string;
  ctaText: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  instagram: string;
  website: string;
  template: "luxury" | "blush" | "noir" | "emerald";
  primaryColor: string;
  accentColor: string;
  heroImageUrl: string;
  aboutImageUrl: string;
  seoTitle: string;
  seoDescription: string;
  views: number;
  hours: ReturnType<typeof hours>;
  services: {
    name: string;
    description: string;
    category: string;
    price: number;
    duration: number;
  }[];
  staff: {
    name: string;
    role: string;
    bio: string;
    imageUrl: string;
    specialties: string[];
    years: number;
  }[];
  gallery: { imageUrl: string; caption: string }[];
  reviews: { author: string; rating: number; title: string; comment: string; reply?: string; daysAgo: number }[];
  bookings: {
    customer: string;
    email: string;
    phone: string;
    service: number;
    staff: number;
    dayOffset: number;
    time: string;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    notes?: string;
  }[];
}

const salons: SeedSalon[] = [
  {
    slug: "house-of-lumen",
    ownerName: "Anaya Sharma",
    ownerEmail: "anaya@velvet.demo",
    name: "House of Lumen",
    tagline: "Quiet luxury for everyday hair",
    description:
      "A small Jaipur studio built around healthy hair, honest advice and a calm hour away from the world.",
    heroTitle: "Good hair, without the noise.",
    heroSubtitle: "A private hair studio in Jaipur for colour, cuts and the kind of appointments you look forward to.",
    aboutTitle: "The story behind the chair",
    aboutText:
      "House of Lumen began with a simple idea: a salon should feel like a deep breath. We keep the studio small on purpose — four chairs, natural light and enough time to do the work properly.\n\nEvery appointment starts with a conversation. We look at your hair, your routine and the amount of effort you actually want to spend in the morning. Then we make a plan that grows out beautifully, not one that needs rescuing six weeks later.\n\nOur colourists are trained in low-damage lightening and our cutting team works with texture, not against it.",
    announcement: "Bridal consultations are open for the season — book a private appointment.",
    ctaText: "Book your appointment",
    phone: "9829012345",
    whatsapp: "9829012345",
    email: "hello@houseoflumen.demo",
    address: "14 Civil Lines, Ashok Marg",
    city: "Jaipur",
    state: "Rajasthan",
    postalCode: "302001",
    country: "India",
    instagram: "houseoflumen",
    website: "",
    template: "luxury",
    primaryColor: "#D4AF37",
    accentColor: "#F4E4BC",
    heroImageUrl:
      "/images/salon-hero.jpg",
    aboutImageUrl:
      "/images/demo/gallery-2.jpg",
    seoTitle: "House of Lumen — Hair studio in Jaipur",
    seoDescription:
      "A quiet, four-chair hair studio in Jaipur for precision cuts, low-damage colour and bridal hair. Book online with House of Lumen.",
    views: 486,
    hours: hours(["Sunday"]),
    services: [
      {
        name: "Signature Cut & Finish",
        description:
          "A thorough consultation, precision cut and a finish you can recreate at home. Includes a wash and scalp massage.",
        category: "Hair",
        price: 2400,
        duration: 60,
      },
      {
        name: "Gloss & Tone",
        description: "A translucent gloss to refresh tone, add shine and soften brassiness between colour appointments.",
        category: "Colour",
        price: 3800,
        duration: 90,
      },
      {
        name: "Full Balayage",
        description:
          "Hand-painted dimension with a low-damage lightening approach, custom toner and a conditioning treatment.",
        category: "Colour",
        price: 9500,
        duration: 180,
      },
      {
        name: "Scalp Ritual",
        description: "A warm oil massage, exfoliating cleanse and steam treatment for a calmer, happier scalp.",
        category: "Spa",
        price: 2200,
        duration: 45,
      },
      {
        name: "Bridal Hair Trial",
        description:
          "A private two-hour trial, mood-board review and a written plan for the wedding morning. Redeemable against the bridal booking.",
        category: "Bridal",
        price: 6500,
        duration: 120,
      },
      {
        name: "Blow-dry",
        description: "A clean, bouncy finish for an evening out or a shoot. Wash and heat protection included.",
        category: "Hair",
        price: 1400,
        duration: 45,
      },
    ],
    staff: [
      {
        name: "Anaya Sharma",
        role: "Founder & Creative Director",
        bio: "Twelve years behind the chair, with a particular love for soft, lived-in colour and hair that behaves on a Tuesday morning.",
        imageUrl:
          "/images/demo/team-1.jpg",
        specialties: ["Balayage", "Bridal", "Curl cutting"],
        years: 12,
      },
      {
        name: "Kabir Mehta",
        role: "Senior Stylist",
        bio: "Precision cutting and texture. Kabir is the person to see when you want a shape that keeps its line for weeks.",
        imageUrl:
          "/images/demo/team-2.jpg",
        specialties: ["Precision cuts", "Texture", "Men's styling"],
        years: 8,
      },
      {
        name: "Rhea Nair",
        role: "Colour Specialist",
        bio: "Trained in low-damage lightening, Rhea builds colour slowly and intentionally — with the health of your hair first.",
        imageUrl:
          "/images/demo/team-3.jpg",
        specialties: ["Balayage", "Colour correction", "Gloss"],
        years: 6,
      },
    ],
    gallery: [
      {
        imageUrl:
          "/images/demo/gallery-1.jpg",
        caption: "Soft layers with a lived-in finish",
      },
      {
        imageUrl:
          "/images/demo/gallery-3.jpg",
        caption: "Warm balayage, built slowly",
      },
      {
        imageUrl:
          "/images/demo/gallery-2.jpg",
        caption: "The studio, before opening",
      },
      {
        imageUrl:
          "/images/demo/gallery-3.jpg",
        caption: "A quiet hour at the wash basin",
      },
      {
        imageUrl:
          "/images/demo/gallery-2.jpg",
        caption: "Natural light, four chairs",
      },
      {
        imageUrl:
          "/images/demo/gallery-1.jpg",
        caption: "Bridal detail work",
      },
    ],
    reviews: [
      {
        author: "Aditi R.",
        rating: 5,
        title: "The first haircut I have not had to fix",
        comment:
          "Anaya actually listened. I have fine hair and have spent years being given cuts that look great for a day and then collapse. This one has grown out beautifully for three months.",
        reply: "Thank you, Aditi. It means a lot that it is still working for you months later. See you at the next one.",
        daysAgo: 12,
      },
      {
        author: "Nikhil M.",
        rating: 5,
        title: "Calm, precise, worth the drive",
        comment:
          "I drive across the city for Kabir. The studio is quiet, nothing is rushed, and the cut is genuinely the best I have had in Jaipur.",
        daysAgo: 26,
      },
      {
        author: "Sara K.",
        rating: 4,
        title: "Beautiful colour",
        comment:
          "Rhea took my grown-out highlights back to something soft and expensive-looking. It took most of an afternoon, but the result was worth it.",
        reply: "Thank you for your patience, Sara — colour corrections always ask for a little time. Enjoy the new tone!",
        daysAgo: 41,
      },
      {
        author: "Meera T.",
        rating: 5,
        title: "Bridal trial was a joy",
        comment:
          "The trial felt like a proper consultation rather than a quick updo. We talked through the dress, the light and the photographs, and I left with a plan I trust.",
        daysAgo: 58,
      },
    ],
    bookings: [
      {
        customer: "Ira Malhotra",
        email: "ira@example.com",
        phone: "9812345678",
        service: 2,
        staff: 2,
        dayOffset: 1,
        time: "11:00",
        status: "confirmed",
        notes: "Bringing a photo of the tone I loved last time.",
      },
      {
        customer: "Devansh Rao",
        email: "devansh@example.com",
        phone: "9822334455",
        service: 0,
        staff: 1,
        dayOffset: 2,
        time: "16:30",
        status: "pending",
      },
      {
        customer: "Priya Shah",
        email: "priya@example.com",
        phone: "9899001122",
        service: 4,
        staff: 0,
        dayOffset: 5,
        time: "10:00",
        status: "pending",
        notes: "Wedding is in November. Would love to talk through a half-up style.",
      },
      {
        customer: "Ritu Jain",
        email: "ritu@example.com",
        phone: "9811223344",
        service: 1,
        staff: 2,
        dayOffset: -3,
        time: "12:00",
        status: "completed",
      },
      {
        customer: "Aman Verma",
        email: "aman@example.com",
        phone: "9800112233",
        service: 5,
        staff: 1,
        dayOffset: -6,
        time: "18:00",
        status: "completed",
      },
      {
        customer: "Leela Nair",
        email: "leela@example.com",
        phone: "9845566778",
        service: 0,
        staff: 0,
        dayOffset: -8,
        time: "15:00",
        status: "cancelled",
      },
    ],
  },
  {
    slug: "ochre-and-ink",
    ownerName: "Naina Iyer",
    ownerEmail: "naina@velvet.demo",
    name: "Ochre & Ink",
    tagline: "A colour-forward studio for hair and skin",
    description:
      "A sunlit Bengaluru studio where colour, skin and slow beauty meet. Known for dimensional brunettes and thoughtful facials.",
    heroTitle: "Colour that looks like you, only louder.",
    heroSubtitle: "Dimensional colour, skin rituals and a very good cup of tea in Indiranagar.",
    aboutTitle: "Made for the light here",
    aboutText:
      "Bengaluru has a particular light — soft, green, a little humid. Ochre & Ink was designed around it. Our colour work leans warm and wearable, and our skin rituals are built to calm rather than strip.\n\nWe are a small team of five, and every appointment begins with a proper look at what your hair and skin are doing right now. No upselling, no fifteen-step routines you will never keep up with.",
    announcement: "New: 60-minute express facials, Monday to Thursday.",
    ctaText: "Book a visit",
    phone: "8045678901",
    whatsapp: "9845012345",
    email: "studio@ochreandink.demo",
    address: "221, 12th Main, Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560038",
    country: "India",
    instagram: "ochreandink",
    website: "https://ochreandink.example.com",
    template: "emerald",
    primaryColor: "#C9A86A",
    accentColor: "#86A294",
    heroImageUrl:
      "/images/demo/hero-ochre.jpg",
    aboutImageUrl:
      "/images/demo/gallery-2.jpg",
    seoTitle: "Ochre & Ink — Hair and skin studio in Bengaluru",
    seoDescription:
      "A colour-forward hair and skin studio in Indiranagar, Bengaluru. Dimensional colour, restful facials and honest advice. Book online.",
    views: 312,
    hours: hours(["Sunday", "Monday"], "11:00", "19:30"),
    services: [
      {
        name: "Dimensional Brunette",
        description:
          "A bespoke blend of babylights and hand-painted sections for depth that reads expensive in every light.",
        category: "Colour",
        price: 8500,
        duration: 180,
      },
      {
        name: "Cut & Shape",
        description: "A growth-friendly cut with a dry finish, so you can see exactly how it will sit at home.",
        category: "Hair",
        price: 2600,
        duration: 60,
      },
      {
        name: "Restore Facial",
        description:
          "A barrier-first facial with double cleansing, a calming mask, facial massage and a light moisturiser. No extractions unless you ask.",
        category: "Skin",
        price: 4200,
        duration: 75,
      },
      {
        name: "Express Glow",
        description: "A 45-minute reset for tired skin: cleanse, gentle exfoliation, hydration and a very good massage.",
        category: "Skin",
        price: 2800,
        duration: 45,
      },
      {
        name: "Toner & Gloss",
        description: "Refresh your colour between appointments and put the shine back.",
        category: "Colour",
        price: 3200,
        duration: 75,
      },
    ],
    staff: [
      {
        name: "Naina Iyer",
        role: "Founder & Colourist",
        bio: "Colour specialist with a soft spot for rich brunettes and clients who want low-maintenance dimension.",
        imageUrl:
          "/images/demo/team-1.jpg",
        specialties: ["Dimensional colour", "Colour correction"],
        years: 10,
      },
      {
        name: "Tara D'Souza",
        role: "Skin Therapist",
        bio: "Barrier-repair facials, gentle routines and a firm belief that less is usually more.",
        imageUrl:
          "/images/demo/team-3.jpg",
        specialties: ["Facials", "Sensitive skin"],
        years: 7,
      },
      {
        name: "Ashwin Kumar",
        role: "Senior Stylist",
        bio: "Dry cutting and soft shapes for curly and wavy hair.",
        imageUrl:
          "/images/demo/team-2.jpg",
        specialties: ["Curl cutting", "Dry cutting"],
        years: 6,
      },
    ],
    gallery: [
      {
        imageUrl:
          "/images/demo/gallery-3.jpg",
        caption: "Rich brunette with a soft face frame",
      },
      {
        imageUrl:
          "/images/demo/gallery-3.jpg",
        caption: "The colour room",
      },
      {
        imageUrl:
          "/images/demo/gallery-1.jpg",
        caption: "Soft, wearable layers",
      },
      {
        imageUrl:
          "/images/demo/gallery-2.jpg",
        caption: "Indiranagar, early morning",
      },
    ],
    reviews: [
      {
        author: "Roshni B.",
        rating: 5,
        title: "Finally, a brunette that is not flat",
        comment:
          "Naina built the colour in two sittings and it looks completely natural. Three months on, it has faded to something still lovely.",
        reply: "That is the goal — colour that keeps looking good long after the appointment. Thank you, Roshni.",
        daysAgo: 9,
      },
      {
        author: "Kavya S.",
        rating: 5,
        title: "The facial my skin needed",
        comment:
          "Tara spent more time asking about my routine than anyone ever has, then did the gentlest facial. My skin was calm for weeks.",
        daysAgo: 33,
      },
      {
        author: "Ishaan P.",
        rating: 4,
        title: "Great cut, book ahead",
        comment:
          "Ashwin understands curly hair. The studio is busy for a reason, so plan a couple of weeks ahead if you want a weekend.",
        daysAgo: 47,
      },
    ],
    bookings: [
      {
        customer: "Tanvi Kulkarni",
        email: "tanvi@example.com",
        phone: "9900112233",
        service: 2,
        staff: 1,
        dayOffset: 1,
        time: "12:00",
        status: "confirmed",
      },
      {
        customer: "Rahul Menon",
        email: "rahul@example.com",
        phone: "9845098450",
        service: 1,
        staff: 2,
        dayOffset: 3,
        time: "17:00",
        status: "pending",
      },
      {
        customer: "Shreya Rao",
        email: "shreya@example.com",
        phone: "9812345670",
        service: 0,
        staff: 0,
        dayOffset: -4,
        time: "11:30",
        status: "completed",
      },
    ],
  },
];

function seed() {
  // Demo accounts use a published password, so never create them in production
  // unless an operator explicitly opts in.
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    console.error(
      "\n  Refusing to seed demo accounts with NODE_ENV=production.\n" +
        "  Set ALLOW_DEMO_SEED=true only for a disposable demo environment.\n"
    );
    process.exit(1);
  }

  console.log("\n  Seeding Velvet Salon Studio demo data…\n");

  const reset = db.transaction(() => {
    for (const salon of salons) {
      db.prepare("DELETE FROM users WHERE email = ? COLLATE NOCASE").run(salon.ownerEmail);
    }
  });
  reset();

  for (const seedSalon of salons) {
    const now = nowIso();
    const ownerId = newId();
    const salonId = newId();

    db.prepare(
      `INSERT INTO users (id, email, password_hash, name, role, email_verified, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'owner', 1, 'active', ?, ?)`
    ).run(ownerId, seedSalon.ownerEmail, bcrypt.hashSync(DEMO_PASSWORD, 10), seedSalon.ownerName, now, now);

    const sections = DEFAULT_SECTIONS.map((section, index) => ({ ...section, order: index }));
    const bookingSettings = {
      enabled: true,
      slotIntervalMinutes: 30,
      minNoticeHours: 4,
      maxAdvanceDays: 60,
      requireEmail: true,
    };

    db.prepare(
      `INSERT INTO salons (
        id, owner_id, name, slug, tagline, description, hero_title, hero_subtitle,
        about_title, about_text, announcement, cta_text, address, city, state,
        postal_code, country, phone, whatsapp, email, instagram, website,
        currency, timezone, template, primary_color, accent_color, status,
        sections_json, hours_json, booking_json, seo_title, seo_description,
        views, created_at, updated_at, published_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        'INR', 'Asia/Kolkata', ?, ?, ?, 'published', ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`
    ).run(
      salonId,
      ownerId,
      seedSalon.name,
      seedSalon.slug,
      seedSalon.tagline,
      seedSalon.description,
      seedSalon.heroTitle,
      seedSalon.heroSubtitle,
      seedSalon.aboutTitle,
      seedSalon.aboutText,
      seedSalon.announcement,
      seedSalon.ctaText,
      seedSalon.address,
      seedSalon.city,
      seedSalon.state,
      seedSalon.postalCode,
      seedSalon.country,
      seedSalon.phone,
      seedSalon.whatsapp,
      seedSalon.email,
      seedSalon.instagram,
      seedSalon.website,
      seedSalon.template,
      seedSalon.primaryColor,
      seedSalon.accentColor,
      JSON.stringify(sections),
      JSON.stringify(seedSalon.hours),
      JSON.stringify(bookingSettings),
      seedSalon.seoTitle,
      seedSalon.seoDescription,
      seedSalon.views,
      now,
      now,
      now
    );

    // Hero / about imagery (inserted separately to keep the statement readable).
    db.prepare("UPDATE salons SET hero_image_url = ?, about_image_url = ? WHERE id = ?").run(
      seedSalon.heroImageUrl,
      seedSalon.aboutImageUrl,
      salonId
    );

    const serviceIds: string[] = [];
    seedSalon.services.forEach((service, index) => {
      const id = newId();
      serviceIds.push(id);
      db.prepare(
        `INSERT INTO services (id, salon_id, name, description, category, price_cents,
          duration_minutes, is_active, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
      ).run(
        id,
        salonId,
        service.name,
        service.description,
        service.category,
        Math.round(service.price * 100),
        service.duration,
        index,
        now,
        now
      );
    });

    const staffIds: string[] = [];
    seedSalon.staff.forEach((member, index) => {
      const id = newId();
      staffIds.push(id);
      db.prepare(
        `INSERT INTO staff (id, salon_id, name, role, bio, image_url, specialties_json,
          experience_years, is_active, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
      ).run(
        id,
        salonId,
        member.name,
        member.role,
        member.bio,
        member.imageUrl,
        JSON.stringify(member.specialties),
        member.years,
        index,
        now,
        now
      );
    });

    seedSalon.gallery.forEach((image, index) => {
      db.prepare(
        "INSERT INTO gallery (id, salon_id, image_url, caption, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(newId(), salonId, image.imageUrl, image.caption, index, now);
    });

    seedSalon.reviews.forEach((review) => {
      const createdAt = new Date(Date.now() - review.daysAgo * 86400000).toISOString();
      db.prepare(
        `INSERT INTO reviews (id, salon_id, author_name, rating, title, comment, status, owner_reply, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)`
      ).run(
        newId(),
        salonId,
        review.author,
        review.rating,
        review.title,
        review.comment,
        review.reply || "",
        createdAt,
        createdAt
      );
    });

    seedSalon.bookings.forEach((booking) => {
      const service = seedSalon.services[booking.service];
      const staff = seedSalon.staff[booking.staff];
      db.prepare(
        `INSERT INTO bookings (id, salon_id, service_id, staff_id, service_name, staff_name,
          customer_name, customer_email, customer_phone, date, time, notes, status,
          price_cents, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        newId(),
        salonId,
        serviceIds[booking.service],
        staffIds[booking.staff],
        service.name,
        staff.name,
        booking.customer,
        booking.email,
        booking.phone,
        isoDate(booking.dayOffset),
        booking.time,
        booking.notes || "",
        booking.status,
        Math.round(service.price * 100),
        now,
        now
      );
    });

    db.prepare("INSERT OR IGNORE INTO subscribers (id, salon_id, email, created_at) VALUES (?, ?, ?, ?)").run(
      newId(),
      salonId,
      "newsletter@example.com",
      now
    );

    // Snapshot exactly as the Publish button does.
    const row = db.prepare("SELECT * FROM salons WHERE id = ?").get(salonId) as any;
    const snapshot = publicSalonBundle(row, { includeReviews: false });
    db.prepare(
      `UPDATE salons
          SET published_json = ?, status = 'published',
              submitted_at = ?, submitted_hash = ?, approved_at = ?, approved_hash = ?,
              approval_status = 'approved', reviewed_at = ?, reviewed_by = 'demo-seed'
        WHERE id = ?`
    ).run(
      JSON.stringify(snapshot),
      nowIso(),
      contentHash(row),
      nowIso(),
      contentHash(row),
      nowIso(),
      salonId
    );

    console.log(`  ✓ ${seedSalon.name} — /${seedSalon.slug} (${seedSalon.ownerEmail})`);
  }

  // A demo super admin so the platform console can be reviewed locally.
  // It owns no salon and never appears in the public directory.
  const now = nowIso();
  db.prepare("DELETE FROM users WHERE email = ? COLLATE NOCASE").run(DEMO_ADMIN_EMAIL);
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, role, email_verified, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'super_admin', 1, 'active', ?, ?)`
  ).run(newId(), DEMO_ADMIN_EMAIL, bcrypt.hashSync(DEMO_PASSWORD, 10), "Platform Admin", now, now);
  console.log(`  ✓ Platform admin — ${DEMO_ADMIN_EMAIL} (no salon)`);

  console.log(`
  Seed complete.

  Demo sign-in
  ────────────
  Email:    anaya@velvet.demo
  Password: ${DEMO_PASSWORD}

  Second salon: naina@velvet.demo (same password)
  Super admin:  ${DEMO_ADMIN_EMAIL} (same password → /admin)

  Change or delete these accounts before any real deployment.

  Press Publish in either dashboard after editing to update the public site.
`);
}

seed();
db.close();
