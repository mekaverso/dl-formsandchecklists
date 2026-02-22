"use client";

import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { MobileHeader } from "@/components/fill/mobile-header";
import { FormListCard } from "@/components/fill/form-list-card";
import { usePublishedForms } from "@/hooks/use-fill";

export default function FillHomePage() {
  const router = useRouter();
  const { data: forms, isLoading } = usePublishedForms();

  return (
    <>
      <MobileHeader title="Forms" />
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
            <p className="text-sm">Loading forms...</p>
          </div>
        ) : !forms || forms.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 mb-3" />
            <p className="text-sm">No forms available.</p>
            <p className="text-xs mt-1">Published forms will appear here.</p>
          </div>
        ) : (
          forms.map((form) => (
            <FormListCard
              key={form.id}
              form={form}
              onClick={() => router.push(`/fill/forms/${form.id}`)}
            />
          ))
        )}
      </div>
    </>
  );
}
