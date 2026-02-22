"use client";

import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
}

export function MobileHeader({ title = "Meka Forms", showBack = false }: MobileHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b bg-background px-3">
      <div className="flex items-center gap-2">
        {showBack && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <span className="text-sm font-semibold truncate">{title}</span>
      </div>

      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
        {user?.full_name?.[0]?.toUpperCase() ?? <User className="h-3.5 w-3.5" />}
      </div>
    </header>
  );
}
