import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, BookOpen, CreditCard, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const levelColors: Record<string, string> = {
  A1: "#ef4444", A2: "#f97316", B1: "#eab308",
  B2: "#3b82f6", C1: "#22c55e", C2: "#a855f7",
};

const packageColors: Record<string, string> = {
  starter: "#93c5fd", standard: "#3b82f6", premium: "#1d4ed8",
  group: "#a855f7", pay_per_lesson: "#f97316",
};

export default function Analytics() {
  const { data: overview, isLoading } = trpc.analytics.overview.useQuery();
  const { data: analyticsData, isLoading: analyticsLoading } = trpc.analytics.detailed.useQuery();

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(v);

  if (isLoading || analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const levelData = analyticsData?.levelDistribution ?? [];
  const packageData = analyticsData?.packageDistribution ?? [];
  const sourceData = analyticsData?.sourceDistribution ?? [];
  const revenueData = analyticsData?.monthlyRevenue ?? [];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Business performance overview for Fluentry</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: overview?.totalStudents ?? 0, sub: `${overview?.activeStudents ?? 0} active`, icon: Users, color: "bg-blue-100 text-blue-600" },
          { label: "Monthly Revenue", value: formatCurrency(overview?.monthlyRevenue ?? 0), sub: "This month", icon: CreditCard, color: "bg-green-100 text-green-600" },
          { label: "Upcoming Lessons", value: overview?.upcomingLessons ?? 0, sub: "Scheduled", icon: BookOpen, color: "bg-purple-100 text-purple-600" },
          { label: "Total Leads", value: overview?.totalLeads ?? 0, sub: `${overview?.newLeads ?? 0} new`, icon: TrendingUp, color: "bg-orange-100 text-orange-600" },
        ].map((stat) => (
          <Card key={stat.label} className="border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" /> Monthly Revenue (MAD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No revenue data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Level Distribution */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">Student Level Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {levelData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No students yet</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={levelData} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={70} label={({ level }) => level}>
                      {levelData.map((entry: { level: string; count: number }) => (
                        <Cell key={entry.level} fill={levelColors[entry.level] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {levelData.map((item: { level: string; count: number }) => (
                    <div key={item.level} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: levelColors[item.level] ?? "#94a3b8" }} />
                      <span className="text-sm text-slate-600">{item.level}</span>
                      <Badge variant="outline" className="text-xs ml-auto">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Package Distribution */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">Package Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {packageData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
            ) : (
              <div className="space-y-3">
                {packageData.map((item: { package: string; count: number }) => {
                  const total = packageData.reduce((s: number, p: { package: string; count: number }) => s + p.count, 0);
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  return (
                    <div key={item.package}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 capitalize">{item.package.replace(/_/g, " ")}</span>
                        <span className="text-slate-800 font-medium">{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: packageColors[item.package] ?? "#94a3b8" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No leads yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sourceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="source" type="category" tick={{ fontSize: 11 }} width={100} tickFormatter={(v) => v.replace(/_/g, " ")} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Summary */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">Payment Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Paid", count: overview?.paymentStatus?.paid ?? 0, color: "text-green-600 bg-green-100" },
              { label: "Pending", count: overview?.paymentStatus?.pending ?? 0, color: "text-yellow-600 bg-yellow-100" },
              { label: "Overdue", count: overview?.paymentStatus?.overdue ?? 0, color: "text-red-600 bg-red-100" },
            ].map((item) => (
              <div key={item.label} className={`p-4 rounded-xl ${item.color.split(" ")[1]} text-center`}>
                <p className={`text-3xl font-bold ${item.color.split(" ")[0]}`}>{item.count}</p>
                <p className={`text-sm font-medium mt-1 ${item.color.split(" ")[0]}`}>{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
