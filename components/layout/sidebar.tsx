"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userName?: string;
  isTeacher?: boolean;
}

const baseNavItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/courses", label: "My Courses" },
];

export function Sidebar({ userName, isTeacher }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    ...baseNavItems,
    ...(isTeacher
      ? [{ href: "/dashboard/settings", label: "Student Profiles" }]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const initial = userName ? userName[0].toUpperCase() : "?";
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-white px-6 py-8">
      <Link
        href="/dashboard"
        className="text-lg pl-6 font-bold tracking-[-0.5px] text-[#1A1918]"
      >
        EveryMind
      </Link>

      <div className="h-8" />

      <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm transition-colors",
                active
                  ? "bg-[#EBF7F0] font-semibold text-[#3D8A5A]"
                  : "font-medium text-[#6D6C6A] hover:bg-[#F5F4F1]",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                  active ? "bg-[#3D8A5A]" : "bg-[#D1D0CD]",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5 rounded-[10px] bg-[#F5F4F1] px-3 py-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#3D8A5A] text-xs font-bold text-white">
            {initial}
          </div>
          <span className="truncate text-sm font-medium text-[#1A1918]">
            {userName || "Loading..."}
          </span>
        </div>
        <button
          onClick={() => signOut(() => router.push("/"))}
          className="flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-medium text-[#9C9B99] transition-colors hover:bg-[#F5F4F1] hover:text-[#6D6C6A]"
        >
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#D1D0CD]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
