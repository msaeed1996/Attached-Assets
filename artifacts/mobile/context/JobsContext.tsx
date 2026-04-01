import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  duration: string;
  description: string;
  requirements: string[];
  urgency: "urgent" | "normal" | "flexible";
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
    startDate: "Tomorrow",
    duration: "5 days",
    description:
      "Pick, pack and ship customer orders in a fast-paced fulfillment center. You'll work on a team ensuring accurate order fulfillment with great attention to detail.",
    requirements: ["Able to lift 50 lbs", "Steel-toed boots required", "Background check"],
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
    startDate: "Saturday",
    duration: "1 day",
    description:
      "Join our team for a high-profile corporate gala. Serve drinks, manage coat check, and ensure VIP guests have an exceptional evening.",
    requirements: ["TABC certification preferred", "Smart attire", "18+"],
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
    startDate: "Monday",
    duration: "2 weeks",
    description:
      "Cover front desk duties for a prestigious law firm while their permanent receptionist is on leave. Answer calls, greet clients, manage mail and supplies.",
    requirements: ["Professional appearance", "MS Office skills", "2+ years admin exp"],
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
    startDate: "ASAP",
    duration: "Ongoing",
    description:
      "Operate forklifts in a temperature-controlled food distribution warehouse. Load/unload trucks and manage inventory locations.",
    requirements: ["Valid forklift cert", "2+ years exp", "Drug test required"],
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
    startDate: "This Weekend",
    duration: "2 days",
    description:
      "Help customers find products during our weekend sale event. Assist with fitting rooms, cash register, and floor stocking.",
    requirements: ["Friendly personality", "Retail exp preferred", "Comfortable standing 8 hrs"],
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
    startDate: "Tonight",
    duration: "3 nights",
    description:
      "Deep clean commercial office space after hours. Tasks include vacuuming, mopping, restroom sanitation, and trash removal.",
    requirements: ["Own transportation", "Background check", "Physical stamina"],
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
