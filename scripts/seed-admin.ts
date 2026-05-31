import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// ✅ Force Neon production URL — change this to your actual Neon connection string
// Get it from: Neon Dashboard → Connection string → select "direct" (not pooled)
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set. Run with:");
  console.error('   DATABASE_URL="postgresql://..." npx tsx scripts/seed-admin.ts');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

async function main() {
  const email = "admin@jeyscent.com";
  const password = "JeyScent2026!";
  const hashedPassword = await bcrypt.hash(password, 12);

  // Verify hash works
  const ok = await bcrypt.compare(password, hashedPassword);
  console.log("🔐 Hash test:", ok ? "PASS ✅" : "FAIL ❌");

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, role: "admin" },
    });
    console.log("✅ Admin password reset & role confirmed");
  } else {
    await prisma.user.create({
      data: {
        name: "Jey Scent Admin",
        email,
        password: hashedPassword,
        role: "admin",
      },
    });
    console.log("✅ Admin user created");
  }

  console.log("   Email:    admin@jeyscent.com");
  console.log("   Password: JeyScent2026!");

  // ── Blog posts ────────────────────────────────────────────────────────────
  const postCount = await prisma.blogPost.count();
  if (postCount > 0) {
    console.log(`✅ Blog already has ${postCount} post(s) — skipping seed`);
  } else {
    const posts = [
      {
        title: "Why Your Space Deserves a Signature Scent",
        slug: "why-your-space-deserves-a-signature-scent",
        excerpt: "Just like you have a signature perfume, your home deserves a scent that speaks to who you are.",
        content: `Your home is an extension of you. The colours you choose, the textures, the art on the walls — they all tell a story. But what about scent?\n\nScent is the most powerful trigger of memory and emotion. A single fragrance can transport you to a moment, a place, a feeling.\n\nAt Jey Scent, we believe every room should feel intentional. Whether you lean towards the warm, loyal embrace of Ruth or the bold, grounding depth of Proverbs, your space should smell like it belongs to you.\n\nStart small. A reed diffuser in your living room. A car diffuser for your commute. Let fragrance become part of your daily ritual.`,
        image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&q=80",
        author: "Jey Scent",
        published: true,
      },
      {
        title: "Reed Diffuser Care: Making Your Fragrance Last",
        slug: "reed-diffuser-care-tips",
        excerpt: "Simple tips to get the most out of your reed diffuser and keep your space smelling beautiful for months.",
        content: `Reed diffusers are one of the most effortless ways to fragrance your space — no flame, no electricity, just beautiful scent.\n\nFlip your reeds weekly. This refreshes the scent throw and keeps things consistent.\n\nPlace it in a high-traffic area. Near doorways or anywhere with gentle air movement helps disperse the fragrance naturally.\n\nAvoid direct sunlight. Heat can cause the oil to evaporate faster.\n\nWith proper care, your Jey Scent reed diffuser will last up to 3 months of consistent, beautiful fragrance.`,
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
        author: "Jey Scent",
        published: true,
      },
      {
        title: "The Story Behind Ruth & Proverbs",
        slug: "story-behind-ruth-and-proverbs",
        excerpt: "Why we named our first two fragrances after books of the Bible — and what they represent.",
        content: `When it came time to name our first two fragrances, we didn't want just pretty names. We wanted meaning.\n\nRuth is a story of loyalty, devotion, and quiet strength. Our Ruth fragrance captures that — soft peony, white tea, jasmine, and warm musk.\n\nProverbs is wisdom. Bergamot, black pepper, cedarwood, vetiver, oud, and amber. Bold but not loud. Grounding. Confident.\n\nEvery Jey Scent fragrance will carry meaning. Because scent isn't just about smelling nice — it's about feeling something.`,
        image: "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=800&q=80",
        author: "Jey Scent",
        published: true,
      },
    ];

    for (const post of posts) {
      await prisma.blogPost.create({ data: post });
    }
    console.log(`✅ ${posts.length} blog posts seeded`);
  }
}

main()
  .then(async () => { await prisma.$disconnect(); process.exit(0); })
  .catch(async (err) => { console.error("❌ Seed failed:", err); await prisma.$disconnect(); process.exit(1); });