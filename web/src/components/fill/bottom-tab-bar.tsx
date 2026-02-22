"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/fill", label: "Forms", icon: ClipboardList },
  { href: "/fill/history", label: "History", icon: Clock },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t bg-background pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const active = tab.href === "/fill"
          ? pathname === "/fill" || pathname.startsWith("/fill/forms")
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-1.5 text-xs transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
