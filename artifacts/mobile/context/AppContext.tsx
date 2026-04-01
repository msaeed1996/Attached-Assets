import React, { createContext, useContext, useState, useEffect } from "react";
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRoleState] = useState<UserRole>(null);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [isOnboarded, setIsOnboardedState] = useState(false);

  useEffect(() => {
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
  }

  function setUserRole(role: UserRole) {
    setUserRoleState(role);
    if (role) AsyncStorage.setItem("userRole", role);
    else AsyncStorage.removeItem("userRole");
  }

  function setUserProfile(profile: UserProfile | null) {
    setUserProfileState(profile);
    if (profile) AsyncStorage.setItem("userProfile", JSON.stringify(profile));
    else AsyncStorage.removeItem("userProfile");
  }

  function setIsOnboarded(v: boolean) {
    setIsOnboardedState(v);
    AsyncStorage.setItem("isOnboarded", v ? "true" : "false");
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
