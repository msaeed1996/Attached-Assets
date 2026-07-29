import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface WeeklyScheduleDay {
  day: string;
  startTime: string;
  endTime: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  type: "full-day" | "part-time" | "weekend" | "evening" | "contract";
  category: string;
  pay: number;
  payType: "hourly" | "daily" | "fixed";
  startDate: string;
  endDate?: string;
  timing?: string;
  weeklySchedule?: WeeklyScheduleDay[];
  duration: string;
  description: string;
  requirements: string[];
  urgency: "urgent" | "normal" | "flexible";
  uniform?: string[];
  instructions?: string[];
  applicantsCount: number;
  postedAt: string;
  employerId: string;
  status: "open" | "filled" | "closed";
  verified: boolean;
  companyRating: number;
}

export interface Application {
  id: string;
  jobId: string;
  workerId: string;
  status: "pending" | "reviewed" | "accepted" | "rejected";
  appliedAt: string;
  coverNote?: string;
}

interface JobsContextType {
  jobs: Job[];
  applications: Application[];
  savedJobs: string[];
  applyToJob: (jobId: string, coverNote?: string) => void;
  saveJob: (jobId: string) => void;
  unsaveJob: (jobId: string) => void;
  postJob: (job: Omit<Job, "id" | "postedAt" | "applicantsCount" | "status">) => void;
  getJobById: (id: string) => Job | undefined;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

const SAMPLE_JOBS: Job[] = [
  {
    id: "1",
    title: "Warehouse Associate",
    company: "Amazon Logistics",
    location: "Austin, TX",
    type: "full-day",
    category: "Warehouse",
    pay: 22,
    payType: "hourly",
    startDate: "Mon, 07/28/2026",
    endDate: "Fri, 08/01/2026",
    timing: "7:00 AM – 3:00 PM",
    weeklySchedule: [
      { day: "Mon", startTime: "7:00 AM", endTime: "3:00 PM" },
      { day: "Tue", startTime: "7:00 AM", endTime: "3:00 PM" },
      { day: "Wed", startTime: "7:00 AM", endTime: "3:00 PM" },
      { day: "Thu", startTime: "7:00 AM", endTime: "3:00 PM" },
      { day: "Fri", startTime: "7:00 AM", endTime: "3:00 PM" },
    ],
    duration: "5 days",
    description:
      "Pick, pack and ship customer orders in a fast-paced fulfillment center. You'll work on a team ensuring accurate order fulfillment with great attention to detail.",
    requirements: ["Able to lift 50 lbs", "Steel-toed boots required", "Background check"],
    uniform: ["High-visibility vest (provided)", "Steel-toed boots", "Long pants required"],
    instructions: ["Check in at Gate B with your ID", "Pick up your badge from the supervisor", "Do not use personal phones on the floor"],
    urgency: "urgent",
    applicantsCount: 8,
    postedAt: "2 hours ago",
    employerId: "emp1",
    status: "open",
    verified: true,
    companyRating: 4.2,
  },
  {
    id: "2",
    title: "Event Staff & Bartender",
    company: "Prestige Events Co.",
    location: "Houston, TX",
    type: "evening",
    category: "Hospitality",
    pay: 250,
    payType: "daily",
    startDate: "Sat, 07/26/2026",
    endDate: "Sat, 07/26/2026",
    timing: "6:00 PM – 12:00 AM",
    duration: "1 day",
    description:
      "Join our team for a high-profile corporate gala. Serve drinks, manage coat check, and ensure VIP guests have an exceptional evening.",
    requirements: ["TABC certification preferred", "Smart attire", "18+"],
    uniform: ["Black dress shirt & trousers", "Non-slip shoes", "Name badge provided on arrival"],
    instructions: ["Arrive 30 min early for briefing", "Park at Lot C — do not use guest parking", "Report to event coordinator Sarah on arrival"],
    urgency: "normal",
    applicantsCount: 14,
    postedAt: "4 hours ago",
    employerId: "emp2",
    status: "open",
    verified: true,
    companyRating: 4.7,
  },
  {
    id: "3",
    title: "Office Receptionist",
    company: "MetaLaw LLP",
    location: "Dallas, TX",
    type: "contract",
    category: "Admin",
    pay: 18,
    payType: "hourly",
    startDate: "Mon, 08/04/2026",
    endDate: "Fri, 08/15/2026",
    timing: "9:00 AM – 5:00 PM",
    weeklySchedule: [
      { day: "Mon", startTime: "9:00 AM", endTime: "5:00 PM" },
      { day: "Tue", startTime: "9:00 AM", endTime: "5:00 PM" },
      { day: "Wed", startTime: "9:00 AM", endTime: "5:00 PM" },
      { day: "Thu", startTime: "9:00 AM", endTime: "5:00 PM" },
      { day: "Fri", startTime: "9:00 AM", endTime: "5:00 PM" },
    ],
    duration: "2 weeks",
    description:
      "Cover front desk duties for a prestigious law firm while their permanent receptionist is on leave. Answer calls, greet clients, manage mail and supplies.",
    requirements: ["Professional appearance", "MS Office skills", "2+ years admin exp"],
    uniform: ["Business casual attire", "Closed-toe shoes", "No visible tattoos or piercings"],
    instructions: ["Sign in at the front desk each morning", "Use extension 200 to reach your supervisor", "Lunch break is 12:00 PM – 1:00 PM"],
    urgency: "normal",
    applicantsCount: 5,
    postedAt: "1 day ago",
    employerId: "emp3",
    status: "open",
    verified: true,
    companyRating: 4.5,
  },
  {
    id: "4",
    title: "Forklift Operator",
    company: "FreshFoods Distribution",
    location: "San Antonio, TX",
    type: "full-day",
    category: "Warehouse",
    pay: 26,
    payType: "hourly",
    startDate: "Mon, 07/28/2026",
    timing: "6:00 AM – 2:00 PM",
    weeklySchedule: [
      { day: "Mon", startTime: "6:00 AM", endTime: "2:00 PM" },
      { day: "Tue", startTime: "6:00 AM", endTime: "2:00 PM" },
      { day: "Wed", startTime: "6:00 AM", endTime: "2:00 PM" },
      { day: "Thu", startTime: "6:00 AM", endTime: "2:00 PM" },
      { day: "Fri", startTime: "6:00 AM", endTime: "2:00 PM" },
    ],
    duration: "Ongoing",
    description:
      "Operate forklifts in a temperature-controlled food distribution warehouse. Load/unload trucks and manage inventory locations.",
    requirements: ["Valid forklift cert", "2+ years exp", "Drug test required"],
    uniform: ["High-visibility vest (provided)", "Steel-toed boots", "Hard hat required on dock"],
    instructions: ["Present forklift cert to supervisor on Day 1", "Complete safety walkthrough before operating", "Report any damage to equipment immediately"],
    urgency: "urgent",
    applicantsCount: 3,
    postedAt: "3 hours ago",
    employerId: "emp4",
    status: "open",
    verified: true,
    companyRating: 3.9,
  },
  {
    id: "5",
    title: "Retail Sales Associate",
    company: "Nordstrom Rack",
    location: "Austin, TX",
    type: "weekend",
    category: "Retail",
    pay: 16,
    payType: "hourly",
    startDate: "Sat, 07/26/2026",
    endDate: "Sun, 07/27/2026",
    timing: "10:00 AM – 6:00 PM",
    duration: "2 days",
    description:
      "Help customers find products during our weekend sale event. Assist with fitting rooms, cash register, and floor stocking.",
    requirements: ["Friendly personality", "Retail exp preferred", "Comfortable standing 8 hrs"],
    uniform: ["All-black clothing", "Comfortable closed-toe shoes", "Name badge provided at store"],
    instructions: ["Clock in at the back office", "Greet every customer within 10 seconds", "Refer returns to the service desk — do not process yourself"],
    urgency: "normal",
    applicantsCount: 20,
    postedAt: "6 hours ago",
    employerId: "emp5",
    status: "open",
    verified: true,
    companyRating: 4.4,
  },
  {
    id: "6",
    title: "Commercial Cleaner",
    company: "SparkleClean Services",
    location: "Austin, TX",
    type: "evening",
    category: "Cleaning",
    pay: 19,
    payType: "hourly",
    startDate: "Mon, 07/28/2026",
    endDate: "Wed, 07/30/2026",
    timing: "10:00 PM – 6:00 AM",
    duration: "3 nights",
    description:
      "Deep clean commercial office space after hours. Tasks include vacuuming, mopping, restroom sanitation, and trash removal.",
    requirements: ["Own transportation", "Background check", "Physical stamina"],
    uniform: ["Company t-shirt (provided)", "Dark work trousers", "Non-slip shoes required"],
    instructions: ["Pick up supplies from the van before entering", "Follow the cleaning checklist on the clipboard", "Lock all doors and drop keys in the lockbox when done"],
    urgency: "urgent",
    applicantsCount: 2,
    postedAt: "1 hour ago",
    employerId: "emp6",
    status: "open",
    verified: false,
    companyRating: 4.1,
  },
];

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(SAMPLE_JOBS);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [appsData, savedData, customJobs] = await Promise.all([
        AsyncStorage.getItem("applications"),
        AsyncStorage.getItem("savedJobs"),
        AsyncStorage.getItem("customJobs"),
      ]);
      if (appsData) setApplications(JSON.parse(appsData));
      if (savedData) setSavedJobs(JSON.parse(savedData));
      if (customJobs) {
        const parsed: Job[] = JSON.parse(customJobs);
        setJobs([...parsed, ...SAMPLE_JOBS]);
      }
    } catch {}
  }

  function applyToJob(jobId: string, coverNote?: string) {
    const app: Application = {
      id: Date.now().toString(),
      jobId,
      workerId: "me",
      status: "pending",
      appliedAt: new Date().toISOString(),
      coverNote,
    };
    const updated = [...applications, app];
    setApplications(updated);
    AsyncStorage.setItem("applications", JSON.stringify(updated));

    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, applicantsCount: j.applicantsCount + 1 } : j
      )
    );
  }

  function saveJob(jobId: string) {
    const updated = [...savedJobs, jobId];
    setSavedJobs(updated);
    AsyncStorage.setItem("savedJobs", JSON.stringify(updated));
  }

  function unsaveJob(jobId: string) {
    const updated = savedJobs.filter((id) => id !== jobId);
    setSavedJobs(updated);
    AsyncStorage.setItem("savedJobs", JSON.stringify(updated));
  }

  function postJob(jobData: Omit<Job, "id" | "postedAt" | "applicantsCount" | "status">) {
    const job: Job = {
      ...jobData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      postedAt: "Just now",
      applicantsCount: 0,
      status: "open",
    };
    const updated = [job, ...jobs];
    setJobs(updated);
    const customJobs = updated.filter(
      (j) => !SAMPLE_JOBS.find((s) => s.id === j.id)
    );
    AsyncStorage.setItem("customJobs", JSON.stringify(customJobs));
  }

  function getJobById(id: string) {
    return jobs.find((j) => j.id === id);
  }

  return (
    <JobsContext.Provider
      value={{
        jobs,
        applications,
        savedJobs,
        applyToJob,
        saveJob,
        unsaveJob,
        postJob,
        getJobById,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used within JobsProvider");
  return ctx;
}
