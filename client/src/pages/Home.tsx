import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";

const levelColors: Record<string, string> = {
  A1: "bg-red-100 text-red-700",
  A2: "bg-orange-100 text-orange-700",
  B1: "bg-yellow-100 text-yellow-700",
  B2: "bg-blue-100 text-blue-700",
  C1: "bg-green-100 text-green-700",
  C2: "bg-purple-100 text-purple-700",
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: overview, isLoading } = trpc.analytics.overview.useQuery();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(amount);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border border-slate-200">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-8 bg-slate-200 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, Ibrahim. Here's what's happening with your coaching business.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setLocation("/students")}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setLocation("/schedule")}>
            <Calendar className="h-4 w-4 mr-2" />
            Book Lesson
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={overview?.totalStudents ?? 0}
          subtitle={`${overview?.activeStudents ?? 0} active`}
          icon={Users}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(overview?.monthlyRevenue ?? 0)}
          subtitle="This month"
          icon={DollarSign}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Upcoming Lessons"
          value={overview?.upcomingLessons ?? 0}
          subtitle="Scheduled ahead"
          icon={Calendar}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="New Leads"
          value={overview?.newLeads ?? 0}
          subtitle={`${overview?.totalLeads ?? 0} total leads`}
          icon={TrendingUp}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Payment Status Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">Paid</p>
              <p className="text-xl font-bold text-green-700">{overview?.paymentStatus?.paid ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-yellow-600 font-medium">Pending</p>
              <p className="text-xl font-bold text-yellow-700">{overview?.paymentStatus?.pending ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-red-600 font-medium">Overdue</p>
              <p className="text-xl font-bold text-red-700">{overview?.paymentStatus?.overdue ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Upcoming Lessons
              </div>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/schedule")} className="text-blue-600 hover:text-blue-700">
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {!overview?.nextLessons?.length ? (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No upcoming lessons scheduled</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setLocation("/schedule")}>
                  Schedule a lesson
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {overview.nextLessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="h-3 w-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{lesson.title || "English Lesson"}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(lesson.scheduledAt).toLocaleString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                      {lesson.durationMinutes}min
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {[
              { label: "Add New Student", icon: UserPlus, path: "/students", color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
              { label: "Schedule a Lesson", icon: Calendar, path: "/schedule", color: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
              { label: "Record a Payment", icon: CreditCard, path: "/payments", color: "text-green-600 bg-green-50 hover:bg-green-100" },
              { label: "View New Leads", icon: TrendingUp, path: "/leads", color: "text-orange-600 bg-orange-50 hover:bg-orange-100" },
              { label: "Check Analytics", icon: TrendingUp, path: "/analytics", color: "text-slate-600 bg-slate-50 hover:bg-slate-100" },
            ].map((action) => (
              <button
                key={action.path}
                onClick={() => setLocation(action.path)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${action.color}`}
              >
                <action.icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{action.label}</span>
                <ArrowRight className="h-3 w-3 ml-auto opacity-50" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
