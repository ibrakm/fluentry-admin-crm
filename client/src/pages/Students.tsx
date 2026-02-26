import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Edit2, Eye, Plus, Search, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const PACKAGES = ["starter", "standard", "premium", "group", "pay_per_lesson"];
const STATUSES = ["active", "inactive", "trial", "paused"];
const SOURCES = ["facebook_ad", "referral", "organic", "onboarding_test", "direct", "other"];

const levelColors: Record<string, string> = {
  A1: "bg-red-100 text-red-700 border-red-200",
  A2: "bg-orange-100 text-orange-700 border-orange-200",
  B1: "bg-yellow-100 text-yellow-700 border-yellow-200",
  B2: "bg-blue-100 text-blue-700 border-blue-200",
  C1: "bg-green-100 text-green-700 border-green-200",
  C2: "bg-purple-100 text-purple-700 border-purple-200",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
  trial: "bg-blue-100 text-blue-700 border-blue-200",
  paused: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

type StudentFormData = {
  name: string;
  email: string;
  whatsapp: string;
  englishLevel: string;
  targetLevel: string;
  goals: string;
  packageType: string;
  status: string;
  notes: string;
  source: string;
};

const defaultForm: StudentFormData = {
  name: "",
  email: "",
  whatsapp: "",
  englishLevel: "A2",
  targetLevel: "B1",
  goals: "",
  packageType: "standard",
  status: "active",
  notes: "",
  source: "other",
};

export default function Students() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<StudentFormData>(defaultForm);

  const utils = trpc.useUtils();
  const { data: students = [], isLoading } = trpc.students.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    level: levelFilter !== "all" ? levelFilter : undefined,
  });

  const createMutation = trpc.students.create.useMutation({
    onSuccess: () => {
      utils.students.list.invalidate();
      utils.analytics.overview.invalidate();
      setDialogOpen(false);
      setForm(defaultForm);
      toast.success("Student added successfully!");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.students.update.useMutation({
    onSuccess: () => {
      utils.students.list.invalidate();
      setDialogOpen(false);
      setEditingId(null);
      setForm(defaultForm);
      toast.success("Student updated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.students.delete.useMutation({
    onSuccess: () => {
      utils.students.list.invalidate();
      utils.analytics.overview.invalidate();
      toast.success("Student removed.");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      email: form.email || undefined,
      whatsapp: form.whatsapp || undefined,
      englishLevel: form.englishLevel as any,
      targetLevel: form.targetLevel as any,
      goals: form.goals || undefined,
      packageType: form.packageType as any,
      status: form.status as any,
      notes: form.notes || undefined,
      source: form.source as any,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEdit = (student: any) => {
    setEditingId(student.id);
    setForm({
      name: student.name ?? "",
      email: student.email ?? "",
      whatsapp: student.whatsapp ?? "",
      englishLevel: student.englishLevel ?? "A2",
      targetLevel: student.targetLevel ?? "B1",
      goals: student.goals ?? "",
      packageType: student.packageType ?? "standard",
      status: student.status ?? "active",
      notes: student.notes ?? "",
      source: student.source ?? "other",
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students</h1>
          <p className="text-sm text-slate-500 mt-1">{students.length} student{students.length !== 1 ? "s" : ""} found</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Student" : "Add New Student"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Fatima Zahra" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="student@email.com" />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+212 6XX XXX XXX" />
                </div>
                <div>
                  <Label>Current Level</Label>
                  <Select value={form.englishLevel} onValueChange={(v) => setForm({ ...form, englishLevel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Level</Label>
                  <Select value={form.targetLevel} onValueChange={(v) => setForm({ ...form, targetLevel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Package</Label>
                  <Select value={form.packageType} onValueChange={(v) => setForm({ ...form, packageType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter (62.50 MAD)</SelectItem>
                      <SelectItem value="standard">Standard (90 MAD)</SelectItem>
                      <SelectItem value="premium">Premium (80 MAD)</SelectItem>
                      <SelectItem value="group">Group (200 MAD/mo)</SelectItem>
                      <SelectItem value="pay_per_lesson">Pay Per Lesson (100 MAD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source</Label>
                  <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook_ad">Facebook Ad</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="organic">Organic</SelectItem>
                      <SelectItem value="onboarding_test">Onboarding Test</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="goals">Learning Goals</Label>
                  <Textarea id="goals" value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} placeholder="e.g. Prepare for IELTS, improve speaking confidence..." rows={2} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Private notes about this student..." rows={2} />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Save Changes" : "Add Student"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, or WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Students Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="border border-slate-200">
              <CardContent className="p-4">
                <div className="animate-pulse flex gap-4">
                  <div className="h-10 w-10 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : students.length === 0 ? (
        <Card className="border border-slate-200">
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No students found</p>
            <p className="text-sm text-slate-400 mt-1">Add your first student to get started</p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Add Student
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Student</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Contact</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Level</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Package</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Enrolled</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-blue-700">{student.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{student.name}</p>
                          <p className="text-xs text-slate-400">{student.goals?.slice(0, 40) || "No goals set"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-600">{student.email || "—"}</div>
                      <div className="text-xs text-slate-400">{student.whatsapp || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className={`text-xs ${levelColors[student.englishLevel ?? "A1"]}`}>
                          {student.englishLevel ?? "—"}
                        </Badge>
                        <span className="text-slate-300 text-xs">→</span>
                        <Badge variant="outline" className={`text-xs ${levelColors[student.targetLevel ?? "B1"]}`}>
                          {student.targetLevel ?? "—"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600 capitalize">{student.packageType?.replace(/_/g, " ") ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${statusColors[student.status]}`}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">
                        {new Date(student.enrolledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600" onClick={() => setLocation(`/students/${student.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600" onClick={() => openEdit(student)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                          onClick={() => {
                            if (confirm(`Remove ${student.name}?`)) deleteMutation.mutate({ id: student.id });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
