export interface UpcomingShift {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  displayDate: string;
  dateISO: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  payRate: number;
  payType: "hourly" | "flat";
  estimatedEarnings: number;
}

export const UPCOMING_SHIFTS: UpcomingShift[] = [
  {
    id: "us1",
    jobTitle: "Lead Bartender",
    company: "The Grand Hotel",
    location: "780 Seventh Ave, Manhattan, NY",
    displayDate: "Wed, Apr 9",
    dateISO: "2026-04-09",
    startTime: "4:00 PM",
    endTime: "12:00 AM",
    durationHours: 8,
    payRate: 30,
    payType: "hourly",
    estimatedEarnings: 240,
  },
  {
    id: "us2",
    jobTitle: "Warehouse Associate",
    company: "Amazon Logistics",
    location: "55 Water St, Brooklyn, NY",
    displayDate: "Thu, Apr 10",
    dateISO: "2026-04-10",
    startTime: "8:00 AM",
    endTime: "4:00 PM",
    durationHours: 8,
    payRate: 22,
    payType: "hourly",
    estimatedEarnings: 176,
  },
  {
    id: "us3",
    jobTitle: "Event Staff",
    company: "Prestige Events Co.",
    location: "132 W 22nd St, Chelsea, NY",
    displayDate: "Sat, Apr 12",
    dateISO: "2026-04-12",
    startTime: "6:00 PM",
    endTime: "11:00 PM",
    durationHours: 5,
    payRate: 250,
    payType: "flat",
    estimatedEarnings: 250,
  },
  {
    id: "us4",
    jobTitle: "Office Receptionist",
    company: "MetaLaw LLP",
    location: "350 Fifth Ave, Midtown, NY",
    displayDate: "Mon, Apr 14",
    dateISO: "2026-04-14",
    startTime: "9:00 AM",
    endTime: "5:00 PM",
    durationHours: 8,
    payRate: 18,
    payType: "hourly",
    estimatedEarnings: 144,
  },
  {
    id: "us5",
    jobTitle: "Retail Floor Associate",
    company: "Nordstrom Rack",
    location: "60 Spring St, SoHo, NY",
    displayDate: "Tue, Apr 15",
    dateISO: "2026-04-15",
    startTime: "10:00 AM",
    endTime: "6:00 PM",
    durationHours: 8,
    payRate: 16,
    payType: "hourly",
    estimatedEarnings: 128,
  },
];
