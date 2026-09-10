export type Ride = {
  id: string;
  /** Driver profile id — present for database-backed rides. */
  driverId?: string;
  from: string;
  to: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  /** 24h HH:mm */
  time: string;
  duration: string;
  price: number;
  seats: number;
  driver: string;
  initials: string;
  rating: number;
  reviews: number;
  car: string;
  instant: boolean;
  verified: boolean;
};

function isoInDays(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const RIDES: Ride[] = [
  {
    id: "r1",
    from: "Casablanca",
    to: "Marrakech",
    date: isoInDays(0),
    time: "07:30",
    duration: "2h50",
    price: 120,
    seats: 3,
    driver: "Youssef B.",
    initials: "YB",
    rating: 4.9,
    reviews: 132,
    car: "Dacia Logan — Gris",
    instant: true,
    verified: true,
  },
  {
    id: "r2",
    from: "Casablanca",
    to: "Rabat",
    date: isoInDays(0),
    time: "17:15",
    duration: "1h10",
    price: 45,
    seats: 2,
    driver: "Salma E.",
    initials: "SE",
    rating: 4.8,
    reviews: 87,
    car: "Renault Clio — Blanc",
    instant: true,
    verified: true,
  },
  {
    id: "r3",
    from: "Rabat",
    to: "Tanger",
    date: isoInDays(1),
    time: "09:00",
    duration: "3h20",
    price: 150,
    seats: 4,
    driver: "Mehdi A.",
    initials: "MA",
    rating: 4.7,
    reviews: 54,
    car: "Peugeot 301 — Noir",
    instant: false,
    verified: true,
  },
  {
    id: "r4",
    from: "Marrakech",
    to: "Agadir",
    date: isoInDays(1),
    time: "14:45",
    duration: "3h05",
    price: 130,
    seats: 1,
    driver: "Imane K.",
    initials: "IK",
    rating: 5,
    reviews: 41,
    car: "Hyundai i20 — Bleu",
    instant: true,
    verified: true,
  },
  {
    id: "r5",
    from: "Fès",
    to: "Casablanca",
    date: isoInDays(2),
    time: "06:45",
    duration: "3h40",
    price: 140,
    seats: 3,
    driver: "Anas T.",
    initials: "AT",
    rating: 4.6,
    reviews: 76,
    car: "Volkswagen Golf — Gris",
    instant: false,
    verified: true,
  },
  {
    id: "r6",
    from: "Casablanca",
    to: "Marrakech",
    date: isoInDays(1),
    time: "19:00",
    duration: "2h45",
    price: 110,
    seats: 2,
    driver: "Nadia R.",
    initials: "NR",
    rating: 4.9,
    reviews: 210,
    car: "Kia Picanto — Rouge",
    instant: true,
    verified: true,
  },
  {
    id: "r7",
    from: "Tanger",
    to: "Tétouan",
    date: isoInDays(0),
    time: "12:30",
    duration: "1h00",
    price: 35,
    seats: 3,
    driver: "Omar L.",
    initials: "OL",
    rating: 4.5,
    reviews: 29,
    car: "Fiat Tipo — Blanc",
    instant: true,
    verified: false,
  },
  {
    id: "r8",
    from: "Marrakech",
    to: "Essaouira",
    date: isoInDays(2),
    time: "10:15",
    duration: "2h30",
    price: 90,
    seats: 4,
    driver: "Hamza D.",
    initials: "HD",
    rating: 4.8,
    reviews: 63,
    car: "Dacia Duster — Beige",
    instant: false,
    verified: true,
  },
  {
    id: "r9",
    from: "Agadir",
    to: "Casablanca",
    date: isoInDays(3),
    time: "21:00",
    duration: "6h30",
    price: 220,
    seats: 2,
    driver: "Zineb M.",
    initials: "ZM",
    rating: 4.7,
    reviews: 98,
    car: "Toyota Corolla — Gris",
    instant: true,
    verified: true,
  },
  {
    id: "r10",
    from: "Casablanca",
    to: "El Jadida",
    date: isoInDays(0),
    time: "16:00",
    duration: "1h30",
    price: 55,
    seats: 3,
    driver: "Karim S.",
    initials: "KS",
    rating: 4.6,
    reviews: 37,
    car: "Seat Ibiza — Noir",
    instant: true,
    verified: true,
  },
];

export const MOROCCAN_CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Fès",
  "Tanger",
  "Agadir",
  "Meknès",
  "Oujda",
  "Kénitra",
  "Tétouan",
  "Essaouira",
  "El Jadida",
  "Chefchaouen",
];

export const POPULAR_ROUTES = [
  { from: "Casablanca", to: "Marrakech", price: 110 },
  { from: "Casablanca", to: "Rabat", price: 45 },
  { from: "Rabat", to: "Tanger", price: 150 },
  { from: "Marrakech", to: "Agadir", price: 130 },
  { from: "Fès", to: "Casablanca", price: 140 },
  { from: "Marrakech", to: "Essaouira", price: 90 },
];

export function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filterRides(
  rides: Ride[],
  q: { from?: string | undefined; to?: string | undefined; date?: string | undefined; seats?: number | undefined },
) {
  return rides.filter((r) => {
    if (q.from && !normalize(r.from).includes(normalize(q.from))) return false;
    if (q.to && !normalize(r.to).includes(normalize(q.to))) return false;
    if (q.date && r.date !== q.date) return false;
    if (q.seats && r.seats < q.seats) return false;
    return true;
  });
}
