"use client";

import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import Button from "./Button";
import { ArrowLeft, LogOut, User } from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
}

export default function Navbar({
  title = "EasyShare",
  showBackButton = false,
}: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Link
              href="/"
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
          )}
          <Link href="/">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary hover:opacity-80 transition-opacity cursor-pointer">
              {title}
            </h1>
          </Link>
        </div>

        {/* Right section - User profile & logout */}
        {isAuthenticated && user && (
          <div className="flex items-center gap-3">
            {/* User profile */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
                {user.name?.charAt(0).toUpperCase() || (
                  <User className="w-4 h-4" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {user.name}
              </span>
            </div>

            {/* Logout button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
