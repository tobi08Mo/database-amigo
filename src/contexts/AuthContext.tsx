import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";

interface Profile {
  username: string;
  bio: string;
  join_date: string;
  feedback_score: number;
  total_sales: number;
  ltc_address: string;
}

interface AuthUser {
  id: string;
  username: string;
  isAdmin: boolean;
  bio: string;
  joinDate: string;
  feedbackScore: number;
  totalSales: number;
  ltcAddress: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (supaUser: SupaUser) => {
    const { data: profile } = await supabase
      .from("profiles" as any)
      .select("*")
      .eq("id", supaUser.id)
      .single();

    if (!profile) {
      setUser(null);
      return;
    }

    const p = profile as any as Profile & { id: string };

    // Check admin role
    const { data: roles } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", supaUser.id);

    const isAdmin = Array.isArray(roles) && roles.some((r: any) => r.role === "admin");

    setUser({
      id: supaUser.id,
      username: p.username,
      isAdmin,
      bio: p.bio || "",
      joinDate: p.join_date || "",
      feedbackScore: Number(p.feedback_score) || 0,
      totalSales: Number(p.total_sales) || 0,
      ltcAddress: p.ltc_address || "",
    });
  };

  useEffect(() => {
    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => loadProfile(session.user), 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    const email = `${username.toLowerCase()}@basta.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const register = async (username: string, password: string) => {
    if (username.length < 3) return { success: false, error: "Benutzername muss mindestens 3 Zeichen haben." };
    if (password.length < 6) return { success: false, error: "Passwort muss mindestens 6 Zeichen haben." };
    
    const cleanUsername = username.replace(/[<>"'&]/g, "").trim();
    if (!cleanUsername) return { success: false, error: "Ungültiger Benutzername." };

    const email = `${cleanUsername.toLowerCase()}@basta.local`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: cleanUsername } },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return { success: false, error: "Benutzername bereits vergeben." };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
