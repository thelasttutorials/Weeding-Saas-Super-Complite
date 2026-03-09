import { db } from "./db";
import { users, invitations, invitationCouples, invitationEvents, invitationContent, rsvps, guestMessages } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function seedDatabase() {
  try {
    const [existingUser] = await db.select().from(users).where(eq(users.username, "demo")).limit(1);
    if (existingUser) return;

    const hashedPassword = await bcrypt.hash("demo123", 10);
    const [demoUser] = await db.insert(users).values({
      id: randomUUID(),
      username: "demo",
      password: hashedPassword,
      fullName: "Ahmad Ridwan",
      email: "demo@wedsaas.app",
      plan: "premium",
    }).returning();

    const invId = randomUUID();
    const [demoInvitation] = await db.insert(invitations).values({
      id: invId,
      userId: demoUser.id,
      title: "Pernikahan Ahmad & Sari",
      slug: "ahmad-dan-sari",
      theme: "classic_elegant",
      status: "published",
      views: 247,
      publishedAt: new Date(),
    }).returning();

    await db.insert(invitationCouples).values({
      id: randomUUID(),
      invitationId: invId,
      brideName: "Sari Dewi Permata",
      groomName: "Ahmad Ridwan Santoso",
      brideParents: "Bapak Sutrisno & Ibu Marlina",
      groomParents: "Bapak Hasan & Ibu Fatimah",
      loveStory: "Kami pertama bertemu di sebuah seminar pendidikan pada tahun 2021. Dari pertemuan yang tak disengaja itu, terjalinlah persahabatan yang indah, hingga akhirnya berkembang menjadi cinta yang tulus. Setelah dua tahun bersama, kami memutuskan untuk melanjutkan ke jenjang yang lebih serius dan mengucapkan janji suci di hadapan Allah SWT.",
      bridePhoto: "",
      groomPhoto: "",
    });

    await db.insert(invitationEvents).values({
      id: randomUUID(),
      invitationId: invId,
      akadDate: "2025-06-15",
      akadTime: "08:00",
      akadVenue: "Masjid Al-Hidayah, Jl. Masjid No. 10, Jakarta Selatan",
      akadMapsLink: "https://maps.google.com",
      receptionDate: "2025-06-15",
      receptionTime: "11:00",
      receptionVenue: "Gedung Serbaguna Permata, Jl. Raya Permata No. 25, Jakarta Selatan",
      receptionMapsLink: "https://maps.google.com",
    });

    await db.insert(invitationContent).values({
      id: randomUUID(),
      invitationId: invId,
      openingQuote: "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. (QS. Ar-Rum: 21)",
      closingMessage: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Atas kehadiran dan doa restunya, kami ucapkan terima kasih.",
      hashtag: "#AhmadDanSari2025",
      livestreamLink: "",
      backgroundMusic: "",
      enableRsvp: true,
      rsvpDeadline: "2025-06-10",
      maxGuests: 2,
    });

    // Seed RSVPs
    const rsvpData = [
      { name: "Budi Santoso", whatsapp: "08123456789", guestCount: 2, status: "attending" as const, message: "Selamat ya! Semoga menjadi keluarga yang sakinah mawaddah warahmah." },
      { name: "Dewi Rahmawati", whatsapp: "08234567890", guestCount: 1, status: "attending" as const, message: "Insya Allah hadir!" },
      { name: "Fajar Pratama", whatsapp: "08345678901", guestCount: 2, status: "attending" as const, message: "" },
      { name: "Rina Kusuma", whatsapp: "08456789012", guestCount: 1, status: "not_attending" as const, message: "Maaf tidak bisa hadir, semoga lancar acaranya!" },
      { name: "Hendra Wijaya", whatsapp: "08567890123", guestCount: 2, status: "pending" as const, message: "" },
    ];

    for (const rsvp of rsvpData) {
      await db.insert(rsvps).values({ id: randomUUID(), invitationId: invId, ...rsvp });
    }

    // Seed messages
    const messageData = [
      { name: "Ibu Siti", message: "Barakallahu lakuma wa baraka alaikuma wa jama'a bainakuma fi khoir. Semoga menjadi keluarga yang sakinah, mawaddah, warahmah!" },
      { name: "Pak Budi", message: "Selamat menempuh hidup baru! Semoga selalu diberikan kebahagiaan dan keberkahan." },
      { name: "Teman SMA", message: "Akhirnya jadian juga kalian hahaha! Selamat ya gaes, semoga langgeng!" },
      { name: "Keluarga Hasan", message: "Doa kami selalu menyertai kalian berdua. Barakallah!" },
    ];

    for (const msg of messageData) {
      await db.insert(guestMessages).values({ id: randomUUID(), invitationId: invId, ...msg, isVisible: true });
    }

    console.log("Database seeded with demo data");
    console.log("Demo account: username=demo, password=demo123");
  } catch (err) {
    console.error("Seed error:", err);
  }
}
