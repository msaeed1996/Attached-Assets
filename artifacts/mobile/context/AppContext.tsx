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

const SESSION_KEY = "tg_session_active";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRoleState] = useState<UserRole>(null);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [isOnboarded, setIsOnboardedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredState();
  }, []);

  async function loadStoredState() {
    try {
      if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
        const hasSession = sessionStorage.getItem(SESSION_KEY);
        if (!hasSession) {
          await AsyncStorage.multiRemove(["userRole", "userProfile", "isOnboarded"]);
          setIsLoading(false);
          return;
        }
      }

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
    if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, "1");
    }
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
