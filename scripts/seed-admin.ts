import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ============ FORCE RESET ADMIN USER ============
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@jeyscent.com" },
  });

  const password = "JeyScent2026!";
  const hashedPassword = await bcrypt.hash(password, 12);

  // Verify the hash works immediately
  const testVerify = await bcrypt.compare(password, hashedPassword);
  console.log("🔐 Password hash test:", testVerify ? "PASS ✅" : "FAIL ❌");

  if (existingAdmin) {
    // Update existing admin password
    await prisma.user.update({
      where: { email: "admin@jeyscent.com" },
      data: {
        password: hashedPassword,
        role: "admin",
      },
    });
    console.log("✅ Admin user password RESET successfully!");
  } else {
    await prisma.user.create({
      data: {
        name: "Jey Scent Admin",
        email: "admin@jeyscent.com",
        password: hashedPassword,
        role: "admin",
      },
    });
    console.log("✅ Admin user created successfully!");
  }

  console.log("   Email:    admin@jeyscent.com");
  console.log("   Password: JeyScent2026!");
  console.log("   Role:     admin");

  // ============ SEED BLOG POSTS ============
  const postCount = await prisma.blogPost.count();

  if (postCount > 0) {
    console.log(`✅ Blog already has ${postCount} post(s)`);
  } else {
    const posts = [
      {
        title: "Why Your Space Deserves a Signature Scent",
        slug: "why-your-space-deserves-a-signature-scent",
        excerpt:
          "Just like you have a signature perfume, your home deserves a scent that speaks to who you are.",
        content: `Your home is an extension of you. The colours you choose, the textures, the art on the walls — they all tell a story. But what about scent?

Scent is the most powerful trigger of memory and emotion. A single fragrance can transport you to a moment, a place, a feeling.

At Jey Scent, we believe every room should feel intentional. Whether you lean towards the warm, loyal embrace of Ruth or the bold, grounding depth of Proverbs, your space should smell like it belongs to you.

Start small. A reed diffuser in your living room. A car diffuser for your commute. Let fragrance become part of your daily ritual.`,
        image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&q=80",
        author: "Jey Scent",
        published: true,
      },
      {
        title: "Reed Diffuser Care: Making Your Fragrance Last",
        slug: "reed-diffuser-care-tips",
        excerpt:
          "Simple tips to get the most out of your reed diffuser and keep your space smelling beautiful for months.",
        content: `Reed diffusers are one of the most effortless ways to fragrance your space — no flame, no electricity, just beautiful scent.

Flip your reeds weekly. This refreshes the scent throw and keeps things consistent.

Place it in a high-traffic area. Near doorways or anywhere with gentle air movement helps disperse the fragrance naturally.

Avoid direct sunlight. Heat can cause the oil to evaporate faster.

With proper care, your Jey Scent reed diffuser will last up to 3 months of consistent, beautiful fragrance.`,
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
        author: "Jey Scent",
        published: true,
      },
      {
        title: "The Story Behind Ruth & Proverbs",
        slug: "story-behind-ruth-and-proverbs",
        excerpt:
          "Why we named our first two fragrances after books of the Bible — and what they represent.",
        content: `When it came time to name our first two fragrances, we didn't want just pretty names. We wanted meaning.

Ruth is a story of loyalty, devotion, and quiet strength. Our Ruth fragrance captures that — soft peony, white tea, jasmine, and warm musk.

Proverbs is wisdom. Bergamot, black pepper, cedarwood, vetiver, oud, and amber. Bold but not loud. Grounding. Confident.

Every Jey Scent fragrance will carry meaning. Because scent isn't just about smelling nice — it's about feeling something.`,
        image: "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=800&q=80",
        author: "Jey Scent",
        published: true,
      },
    ];

    for (const post of posts) {
      await prisma.blogPost.create({ data: post });
    }

    console.log(`✅ ${posts.length} blog posts seeded!`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Seed failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });