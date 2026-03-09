import {
  ImageIcon, Heart, Quote, Timer, BookOpen, CalendarDays,
  MapPin, GalleryHorizontal, ClipboardList, MessageSquare,
  Gift, Star, Minus, Type
} from "lucide-react";

export type BlockType =
  | "cover" | "couple" | "quote" | "countdown" | "story"
  | "events" | "maps" | "gallery" | "rsvp" | "messages"
  | "gifts" | "closing" | "divider" | "text";

export interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  icon: typeof Heart;
  defaultContent: Record<string, any>;
  defaultStyle: Record<string, any>;
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: "cover",
    label: "Opening Cover",
    description: "Halaman pembuka dengan nama pasangan dan tanggal",
    icon: ImageIcon,
    defaultContent: {
      groomName: "Nama Pengantin Pria",
      brideName: "Nama Pengantin Wanita",
      weddingDate: "Sabtu, 12 Desember 2025",
      openingText: "Bismillahirrahmanirrahim",
      subText: "Dengan memohon rahmat dan ridha Allah SWT",
      buttonText: "Buka Undangan",
      backgroundImage: "",
    },
    defaultStyle: {
      backgroundColor: "#1a0a00",
      overlayOpacity: 0.5,
      textColor: "#ffffff",
      textAlign: "center",
      minHeight: "100vh",
    },
  },
  {
    type: "couple",
    label: "Profil Pasangan",
    description: "Foto dan biodata mempelai pria & wanita",
    icon: Heart,
    defaultContent: {
      heading: "Yang Berbahagia",
      groomName: "Ahmad Ridwan, S.T.",
      groomParents: "Putra dari Bpk. Hasan & Ibu Fatimah",
      groomPhoto: "",
      brideName: "Sari Indah, S.E.",
      brideParents: "Putri dari Bpk. Darmawan & Ibu Siti",
      bridePhoto: "",
    },
    defaultStyle: {
      backgroundColor: "#fff",
      textColor: "#333",
      textAlign: "center",
      padding: "80px 20px",
    },
  },
  {
    type: "quote",
    label: "Ayat / Kutipan",
    description: "Ayat Al-Quran atau kutipan inspiratif",
    icon: Quote,
    defaultContent: {
      quoteText: "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu istri-istri dari jenismu sendiri.",
      quoteSource: "QS. Ar-Rum: 21",
    },
    defaultStyle: {
      backgroundColor: "#f9f5f0",
      textColor: "#5a3825",
      textAlign: "center",
      padding: "60px 20px",
    },
  },
  {
    type: "countdown",
    label: "Hitung Mundur",
    description: "Timer hitung mundur menuju hari pernikahan",
    icon: Timer,
    defaultContent: {
      heading: "Menuju Hari Bahagia",
      subHeading: "Sabtu, 12 Desember 2025",
      targetDate: "2025-12-12T08:00:00",
    },
    defaultStyle: {
      backgroundColor: "#2d1b0e",
      textColor: "#f5e6d3",
      textAlign: "center",
      padding: "60px 20px",
    },
  },
  {
    type: "story",
    label: "Kisah Cinta",
    description: "Timeline perjalanan kisah cinta pasangan",
    icon: BookOpen,
    defaultContent: {
      heading: "Perjalanan Cinta Kami",
      subHeading: "Sebuah kisah yang indah penuh makna",
      events: [
        { year: "2020", title: "Pertama Bertemu", description: "Takdir mempertemukan kami di tempat yang tak terduga." },
        { year: "2022", title: "Menjalin Hubungan", description: "Memulai perjalanan bersama dengan penuh harapan." },
        { year: "2025", title: "Lamaran", description: "Momen indah saat janji suci diucapkan." },
      ],
    },
    defaultStyle: {
      backgroundColor: "#fff",
      textColor: "#333",
      padding: "80px 20px",
    },
  },
  {
    type: "events",
    label: "Detail Acara",
    description: "Informasi akad nikah dan resepsi",
    icon: CalendarDays,
    defaultContent: {
      heading: "Detail Acara",
      akadLabel: "Akad Nikah",
      akadDate: "Sabtu, 12 Desember 2025",
      akadTime: "08:00 WIB",
      akadVenue: "Masjid Al-Ikhlas",
      akadAddress: "Jl. Merdeka No. 1, Jakarta",
      receptionLabel: "Resepsi Pernikahan",
      receptionDate: "Sabtu, 12 Desember 2025",
      receptionTime: "11:00 - 14:00 WIB",
      receptionVenue: "Grand Ballroom Hotel Bintang",
      receptionAddress: "Jl. Sudirman No. 100, Jakarta",
    },
    defaultStyle: {
      backgroundColor: "#f9f5f0",
      textColor: "#333",
      textAlign: "center",
      padding: "80px 20px",
    },
  },
  {
    type: "maps",
    label: "Peta Lokasi",
    description: "Link dan tombol arah ke venue pernikahan",
    icon: MapPin,
    defaultContent: {
      heading: "Lokasi Acara",
      venues: [
        { label: "Akad Nikah", name: "Masjid Al-Ikhlas", mapsLink: "https://maps.google.com" },
        { label: "Resepsi", name: "Grand Ballroom Hotel Bintang", mapsLink: "https://maps.google.com" },
      ],
    },
    defaultStyle: {
      backgroundColor: "#fff",
      textColor: "#333",
      padding: "60px 20px",
    },
  },
  {
    type: "gallery",
    label: "Galeri Foto",
    description: "Grid foto-foto indah pasangan",
    icon: GalleryHorizontal,
    defaultContent: {
      heading: "Galeri Foto",
      subHeading: "Momen berharga yang kami abadikan",
    },
    defaultStyle: {
      backgroundColor: "#fff",
      textColor: "#333",
      padding: "80px 20px",
    },
  },
  {
    type: "rsvp",
    label: "Form RSVP",
    description: "Formulir konfirmasi kehadiran tamu",
    icon: ClipboardList,
    defaultContent: {
      heading: "Konfirmasi Kehadiran",
      subHeading: "Kehadiran Anda adalah kebahagiaan kami",
      deadline: "",
    },
    defaultStyle: {
      backgroundColor: "#f0f4ff",
      textColor: "#333",
      padding: "80px 20px",
    },
  },
  {
    type: "messages",
    label: "Pesan & Doa",
    description: "Form dan daftar ucapan dari tamu",
    icon: MessageSquare,
    defaultContent: {
      heading: "Ucapan & Doa",
      subHeading: "Sampaikan doa dan ucapan terbaik Anda",
    },
    defaultStyle: {
      backgroundColor: "#fff8f0",
      textColor: "#333",
      padding: "80px 20px",
    },
  },
  {
    type: "gifts",
    label: "Digital Gift",
    description: "Rekening bank dan e-wallet untuk hadiah",
    icon: Gift,
    defaultContent: {
      heading: "Hadiah Digital",
      subHeading: "Bila Anda ingin memberikan hadiah, berikut detail rekening kami",
    },
    defaultStyle: {
      backgroundColor: "#f9f5f0",
      textColor: "#333",
      padding: "80px 20px",
    },
  },
  {
    type: "closing",
    label: "Penutup",
    description: "Ucapan terima kasih dan penutup",
    icon: Star,
    defaultContent: {
      heading: "Terima Kasih",
      message: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.",
      groomName: "Ahmad Ridwan",
      brideName: "Sari Indah",
      hashtag: "#AhmadSari2025",
    },
    defaultStyle: {
      backgroundColor: "#2d1b0e",
      textColor: "#f5e6d3",
      textAlign: "center",
      padding: "80px 20px",
    },
  },
  {
    type: "divider",
    label: "Pemisah",
    description: "Garis atau ornamen dekoratif antar section",
    icon: Minus,
    defaultContent: {
      style: "ornament", // ornament | line | floral
      text: "♦",
    },
    defaultStyle: {
      backgroundColor: "transparent",
      height: "60px",
      textAlign: "center",
    },
  },
  {
    type: "text",
    label: "Teks Bebas",
    description: "Blok teks atau paragraf bebas",
    icon: Type,
    defaultContent: {
      heading: "",
      body: "Tulis pesan atau teks di sini...",
    },
    defaultStyle: {
      backgroundColor: "#fff",
      textColor: "#333",
      textAlign: "center",
      padding: "40px 20px",
    },
  },
];

export function getBlockDefinition(type: BlockType): BlockDefinition {
  return BLOCK_DEFINITIONS.find(b => b.type === type) || BLOCK_DEFINITIONS[0];
}

export const GLOBAL_SETTINGS_DEFAULTS = {
  primaryColor: "#c0335a",
  secondaryColor: "#f43f5e",
  accentColor: "#d4a96a",
  bgColor: "#fff",
  fontHeading: "Playfair Display",
  fontBody: "Inter",
  borderRadius: "8",
  sectionSpacing: "80",
};

export type GlobalSettings = typeof GLOBAL_SETTINGS_DEFAULTS;
