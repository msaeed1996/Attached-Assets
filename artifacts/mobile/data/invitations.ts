export type InvitationStatus = "pending" | "accepted" | "declined";

export interface Invitation {
  id: string;
  jobTitle: string;
  company: string;
  companyRating: number;
  location: string;
  pay: number;
  payType: "hourly" | "daily" | "fixed";
  startDate: string;
  duration: string;
  type: string;
  message: string;
  sentAt: string;
  status: InvitationStatus;
  urgent: boolean;
  jobId: string;
  hiringManager?: string;
  responseDeadline?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
}

export const SAMPLE_INVITATIONS: Invitation[] = [
  {
    id: "inv-1",
    jobTitle: "Warehouse Supervisor",
    company: "Amazon Logistics",
    companyRating: 4.2,
    location: "Austin, TX",
    pay: 28,
    payType: "hourly",
    startDate: "Tomorrow",
    duration: "1 week",
    type: "full-day",
    message:
      "We reviewed your profile and think you'd be a great fit for this role. Your previous warehouse experience stands out!",
    sentAt: "30 min ago",
    status: "pending",
    urgent: true,
    jobId: "1",
    hiringManager: "Jordan Pierce",
    responseDeadline: "Respond within 24 hours",
    description:
      "Lead a small team of warehouse associates during the morning shift, ensuring orders are picked, packed and shipped accurately and on time.",
    responsibilities: [
      "Coordinate the daily pick & pack schedule",
      "Train and support associates on the floor",
      "Track KPIs and report to the operations lead",
    ],
    requirements: [
      "1+ years of warehouse or logistics experience",
      "Comfortable using handheld scanners and WMS",
      "Able to lift up to 50 lbs throughout the shift",
    ],
  },
  {
    id: "inv-2",
    jobTitle: "Event Coordinator",
    company: "Prestige Events Co.",
    companyRating: 4.7,
    location: "Houston, TX",
    pay: 280,
    payType: "daily",
    startDate: "Saturday",
    duration: "2 days",
    type: "weekend",
    message:
      "Hi! We're looking for reliable staff for an upcoming gala. Your hospitality background is exactly what we need.",
    sentAt: "2 hours ago",
    status: "pending",
    urgent: false,
    jobId: "2",
    hiringManager: "Lily Chen",
    responseDeadline: "Respond by Friday 6 PM",
    description:
      "Support the on-site coordination of a 400-guest charity gala including vendor check-in, room flips and guest experience.",
    responsibilities: [
      "Run the vendor check-in desk",
      "Coordinate with banquet captains on timing",
      "Be the on-floor escalation point during service",
    ],
    requirements: [
      "Prior event or hospitality coordination experience",
      "Professional appearance and clear communicator",
      "Comfortable on your feet for 8+ hours",
    ],
  },
  {
    id: "inv-3",
    jobTitle: "Retail Floor Lead",
    company: "Nordstrom Rack",
    companyRating: 4.4,
    location: "Dallas, TX",
    pay: 19,
    payType: "hourly",
    startDate: "Monday",
    duration: "3 days",
    type: "part-time",
    message:
      "Your retail experience makes you an ideal candidate. We'd love to have you on the team for our upcoming sale event.",
    sentAt: "Yesterday",
    status: "accepted",
    urgent: false,
    jobId: "5",
    hiringManager: "Maya Singh",
    description:
      "Lead the retail floor team during a high-volume promotional weekend, supporting customers and managing fitting rooms.",
    responsibilities: [
      "Greet and assist customers throughout the floor",
      "Restock high-velocity items between waves",
      "Coach part-time associates on service standards",
    ],
    requirements: [
      "Previous retail or customer service experience",
      "Ability to lead by example in a fast-paced setting",
      "Available all 3 days of the event",
    ],
  },
  {
    id: "inv-4",
    jobTitle: "Office Admin Assistant",
    company: "MetaLaw LLP",
    companyRating: 4.5,
    location: "Austin, TX",
    pay: 18,
    payType: "hourly",
    startDate: "Next Week",
    duration: "2 weeks",
    type: "contract",
    message:
      "We came across your profile and believe your admin skills match our requirements perfectly.",
    sentAt: "2 days ago",
    status: "declined",
    urgent: false,
    jobId: "3",
    hiringManager: "Dana Whitfield",
    description:
      "Provide front-desk and administrative support for a busy legal office during a partner's two-week travel period.",
    responsibilities: [
      "Greet visitors and manage the front desk",
      "Schedule conference rooms and travel",
      "Handle basic document prep and filing",
    ],
    requirements: [
      "Strong written and verbal communication",
      "Comfortable with calendaring and email tools",
      "Professional, discreet, and detail-oriented",
    ],
  },
];
