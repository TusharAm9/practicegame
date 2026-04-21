"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, UserCircle, LogIn, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { updateDailyStreak } from "@/utils/supabase/queries";
import { ThemeToggle } from "./ThemeToggle";

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        updateDailyStreak(session.user.id);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        updateDailyStreak(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  if (pathname === "/math") return null;

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-100 w-[95%] max-w-lg">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass px-6 py-3 rounded-2xl border border-white/10 shadow-2xl flex items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-black text-xs">
            OS
          </div>
          <span className="font-black tracking-tighter text-foreground hidden sm:block">AI EXAM OS</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="w-px h-4 bg-white/10 mx-1" />
          <NavLink href="/" icon={<Home className="w-4 h-4" />} active={pathname === "/"} />
          <div className="w-px h-4 bg-white/10 mx-1" />
          
          {user ? (
            <>
              <NavLink 
                href="/ai" 
                icon={<Sparkles className="w-4 h-4" />} 
                active={pathname === "/ai"} 
              />
              <div className="w-px h-4 bg-white/10 mx-1" />
              <NavLink 
                href="/profile" 
                icon={<UserCircle className="w-4 h-4" />} 
                active={pathname === "/profile"} 
              />
              <div className="w-px h-4 bg-white/10 mx-1" />
              <NavLink 
                href="/mistakes" 
                icon={<AlertCircle className="w-4 h-4" />} 
                active={pathname === "/mistakes"} 
              />
            </>
          ) : (
            <NavLink 
              href="/login" 
              icon={<LogIn className="w-4 h-4" />} 
              active={pathname === "/login"} 
            />
          )}
        </div>
      </motion.div>
    </nav>
  );
};

const NavLink = ({ href, icon, active }: { href: string; icon: React.ReactNode; active: boolean }) => (
  <Link 
    href={href} 
    className={`p-2 rounded-xl transition-all duration-300 relative ${
      active ? "text-blue-500 bg-blue-500/10" : "text-slate-400 hover:text-white hover:bg-white/5"
    }`}
  >
    {icon}
    {active && (
      <motion.div 
        layoutId="nav-glow"
        className="absolute inset-0 bg-blue-500/20 blur-lg rounded-xl"
      />
    )}
  </Link>
);
