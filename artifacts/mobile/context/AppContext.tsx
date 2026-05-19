import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserRole = "employer" | "worker" | null;

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
  company?: string;
  jobTitle?: string;
  skills?: string[];
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  hourlyRate?: number;
  location?: string;
  bio?: string;
  completedJobs?: number;
}

interface AppContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  isOnboarded: boolean;
  setIsOnboarded: (v: boolean) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const isWeb = Platform.OS === "web";

const DEMO_WORKER_PROFILE: UserProfile = {
  id: "demo-worker-1",
  name: "Alex Johnson",
  role: "worker",
  email: "alex@truegigs.com",
  jobTitle: "Event Staff",
  skills: ["Food Service", "Bartending", "Event Setup"],
  rating: 4.8,
  reviewCount: 124,
  verified: true,
  hourlyRate: 18,
  location: "San Francisco, CA",
  bio: "Experienced gig worker with 3+ years in hospitality and events.",
  completedJobs: 87,
};

const DEMO_EMPLOYER_PROFILE: UserProfile = {
  id: "demo-employer-1",
  name: "Sarah Chen",
  role: "employer",
  email: "sarah@brightevents.com",
  company: "Bright Events Co.",
  verified: true,
  location: "San Francisco, CA",
};

function getDemoRole(): UserRole | null {
  if (!isWeb || typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get("demo");
    if (demo === "worker") return "worker";
    if (demo === "employer") return "employer";
  } catch {}
  return null;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const demoRole = getDemoRole();

  const [userRole, setUserRoleState] = useState<UserRole>(demoRole);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(
    demoRole === "worker"
      ? DEMO_WORKER_PROFILE
      : demoRole === "employer"
        ? DEMO_EMPLOYER_PROFILE
        : null
  );
  const [isOnboarded, setIsOnboardedState] = useState(demoRole !== null);
  const [isLoading, setIsLoading] = useState(!isWeb);

  useEffect(() => {
    if (isWeb) return;
    loadStoredState();
  }, []);

  async function loadStoredState() {
    try {
      const [role, profile, onboarded] = await Promise.all([
        AsyncStorage.getItem("userRole"),
        AsyncStorage.getItem("userProfile"),
        AsyncStorage.getItem("isOnboarded"),
      ]);
      if (role) setUserRoleState(role as UserRole);
      if (profile) setUserProfileState(JSON.parse(profile));
      if (onboarded === "true") setIsOnboardedState(true);
    } catch {}
    setIsLoading(false);
  }

  function setUserRole(role: UserRole) {
    setUserRoleState(role);
    if (!isWeb) {
      if (role) AsyncStorage.setItem("userRole", role);
      else AsyncStorage.removeItem("userRole");
    }
  }

  function setUserProfile(profile: UserProfile | null) {
    setUserProfileState(profile);
    if (!isWeb) {
      if (profile) AsyncStorage.setItem("userProfile", JSON.stringify(profile));
      else AsyncStorage.removeItem("userProfile");
    }
  }

  function setIsOnboarded(v: boolean) {
    setIsOnboardedState(v);
    if (!isWeb) {
      AsyncStorage.setItem("isOnboarded", v ? "true" : "false");
    }
  }

  return (
    <AppContext.Provider
      value={{
        userRole,
        setUserRole,
        userProfile,
        setUserProfile,
        isOnboarded,
        setIsOnboarded,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
