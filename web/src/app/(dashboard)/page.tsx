"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ClipboardList, AlertTriangle, Users } from "lucide-react";
import { useForms } from "@/hooks/use-forms";
import { useResponses } from "@/hooks/use-responses";
import { useActionPlans } from "@/hooks/use-action-plans";
import { useMembers } from "@/hooks/use-members";

export default function DashboardPage() {
  const { data: forms } = useForms(1, 1);
  const { data: responses } = useResponses(1, 1);
  const { data: actionPlans } = useActionPlans(1, 1);
  const { data: members } = useMembers(1, 1);

  const stats = [
    {
      title: "Total Forms",
      value: forms?.total ?? 0,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Responses",
      value: responses?.total ?? 0,
      icon: ClipboardList,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Action Plans",
      value: actionPlans?.total ?? 0,
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Team Members",
      value: members?.total ?? 0,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your organization&apos;s data collection
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Responses</CardTitle>
          </CardHeader>
          <CardContent>
            {responses?.items && responses.items.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {responses.total} responses received
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No responses yet. Create a form and start collecting data.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Action Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {actionPlans?.items && actionPlans.items.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {actionPlans.total} action plans open
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No open action plans. Great work!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
