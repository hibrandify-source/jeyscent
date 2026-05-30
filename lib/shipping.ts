export interface ShippingZone {
  name: string;
  areas: string[];
  fee: number;
  estimatedDays: string;
  isParkPickup?: boolean;
}

export const shippingZones: ShippingZone[] = [
  {
    name: "Sangotedo & Environs",
    areas: [
      "Sangotedo", "Abijo", "Awoyaya", "Lakowe", "Ibeju-Lekki",
      "Bogije", "Shapati", "Oribanwa", "Eleko",
    ],
    fee: 3500,
    estimatedDays: "Same day – 1 business day",
  },
  {
    name: "Lekki & Ajah Axis",
    areas: [
      "Ajah", "Lekki Phase 1", "Lekki Phase 2", "Chevron", "Ikota",
      "VGC", "Ikate", "Ilasan", "Jakande", "Agungi", "Osapa London",
      "Ologolo", "Igbo Efon", "Marwa", "Lekki Conservation",
    ],
    fee: 6000,
    estimatedDays: "Same day – 1 business day",
  },
  {
    name: "Victoria Island & Ikoyi",
    areas: [
      "Victoria Island", "VI", "Ikoyi", "Banana Island", "Oniru",
      "Eko Atlantic", "Bar Beach", "Lekki-Epe Expressway",
    ],
    fee: 7500,
    estimatedDays: "Same day – 1 business day",
  },
  {
    name: "Lagos Island & Surrounds",
    areas: [
      "Lagos Island", "Marina", "Apapa", "Surulere", "Yaba",
      "Ebute Metta", "Oyingbo", "Costain", "Iganmu", "Orile",
    ],
    fee: 8500,
    estimatedDays: "Same day – 1 business day",
  },
  {
    name: "Lagos Mainland (Close)",
    areas: [
      "Ikeja", "Maryland", "Ojodu", "Ogba", "Magodo", "GRA Ikeja",
      "Allen Avenue", "Opebi", "Alausa", "Berger", "Omole", "Isheri",
      "Agidingbi", "Computer Village", "Oregun", "Anthony", "Gbagada",
      "Palmgrove", "Bariga", "Somolu", "Pedro", "Onipanu",
    ],
    fee: 9500,
    estimatedDays: "Same day – 1 business day",
  },
  {
    name: "Lagos Mainland (Far)",
    areas: [
      "Festac", "Amuwo Odofin", "Mile 2", "Ojo", "Alimosho", "Egbeda",
      "Idimu", "Ikotun", "Iyana Ipaja", "Egbe", "Isolo", "Mushin",
      "Oshodi", "Agege", "Abule Egba", "Ikorodu", "Badagry", "Epe",
      "Iyana Iba", "Igando", "Dopemu", "Agbado", "Sango Ota",
    ],
    fee: 11000,
    estimatedDays: "Same day – 1 business day",
  },
  {
    name: "Outside Lagos (South-West)",
    areas: [
      "Ibadan", "Abeokuta", "Sagamu", "Ijebu Ode", "Ondo", "Akure",
      "Osogbo", "Ife", "Ado Ekiti", "Oyo", "Ogbomoso",
    ],
    fee: 3500,
    estimatedDays: "Shipped to nearest bus park",
    isParkPickup: true,
  },
  {
    name: "Outside Lagos (South-South / South-East)",
    areas: [
      "Benin City", "Warri", "Asaba", "Port Harcourt", "Owerri", "Aba",
      "Uyo", "Calabar", "Enugu", "Onitsha", "Awka", "Abakaliki",
    ],
    fee: 3500,
    estimatedDays: "Shipped to nearest bus park",
    isParkPickup: true,
  },
  {
    name: "Outside Lagos (North)",
    areas: [
      "Abuja", "FCT", "Jos", "Kaduna", "Kano", "Minna", "Ilorin",
      "Lokoja", "Makurdi", "Bauchi", "Lafia", "Sokoto", "Yola", "Maiduguri",
    ],
    fee: 3500,
    estimatedDays: "Shipped to nearest bus park",
    isParkPickup: true,
  },
];

export const FREE_SHIPPING_THRESHOLD = 200000;

export function findShippingZone(area: string): ShippingZone | null {
  const searchTerm = area.toLowerCase().trim();

  for (const zone of shippingZones) {
    for (const a of zone.areas) {
      if (a.toLowerCase() === searchTerm) {
        return zone;
      }
    }
  }

  for (const zone of shippingZones) {
    for (const a of zone.areas) {
      if (
        a.toLowerCase().includes(searchTerm) ||
        searchTerm.includes(a.toLowerCase())
      ) {
        return zone;
      }
    }
  }

  return null;
}

export function getShippingFee(area: string, cartTotal: number): {
  fee: number;
  zone: ShippingZone | null;
  freeShipping: boolean;
  isParkPickup: boolean;
} {
  const zone = findShippingZone(area);

  // Free shipping above 200,000 (Lagos only)
  if (cartTotal >= FREE_SHIPPING_THRESHOLD && zone && !zone.isParkPickup) {
    return { fee: 0, zone, freeShipping: true, isParkPickup: false };
  }

  // Outside Lagos — park pickup, fee negotiated with driver
  if (zone?.isParkPickup) {
    return { fee: 3500, zone, freeShipping: false, isParkPickup: true };
  }

  if (!zone) {
    return {
      fee: 3500,
      zone: {
        name: "Other Location",
        areas: [],
        fee: 3500,
        estimatedDays: "Contact us on WhatsApp for delivery options",
        isParkPickup: true,
      },
      freeShipping: false,
      isParkPickup: true,
    };
  }

  return { fee: zone.fee, zone, freeShipping: false, isParkPickup: false };
}

export function getAllAreas(): string[] {
  const areas: string[] = [];
  for (const zone of shippingZones) {
    areas.push(...zone.areas);
  }
  return areas.sort();
}

export function formatShippingFee(fee: number): string {
  if (fee === 0) return "Free";
  return `₦${fee.toLocaleString()}`;
}