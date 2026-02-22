"use client";

import { AuthGuard } from "@/components/shared/auth-guard";
import { BottomTabBar } from "@/components/fill/bottom-tab-bar";
import type { ReactNode } from "react";

export default function FillLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-[100dvh] flex-col bg-background">
        <main className="flex-1 overflow-auto pb-16">{children}</main>
        <BottomTabBar />
      </div>
    </AuthGuard>
  );
}
