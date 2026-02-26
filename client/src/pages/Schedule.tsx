import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Calendar, CheckCircle, Clock, Plus, Trash2, Video, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  no_show: "bg-red-100 text-red-700 border-red-200",
};

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function Schedule() {
  const [dialog, setDialog] = useState(false);
  const [filter, setFilter] = useState("upcoming");
  const [form, setForm] = useState({
    studentId: "",
    title: "",
    scheduledAt: toLocalInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    durationMinutes: "60",
    meetLink: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: allLessons = [], isLoading } = trpc.lessons.list.useQuery({});
  const { data: students = [] } = trpc.students.list.useQuery({});

  const createMutation = trpc.lessons.create.useMutation({
    onSuccess: () => {
      utils.lessons.list.invalidate();
      utils.analytics.overview.invalidate();
      setDialog(false);
      setForm({ studentId: "", title: "", scheduledAt: toLocalInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)), durationMinutes: "60", meetLink: "", notes: "" });
      toast.success("Lesson scheduled!");
    },
    onError: (e) => toast.error(e.message),
  });

  const completeMutation = trpc.lessons.complete.useMutation({
    onSuccess: () => { utils.lessons.list.invalidate(); toast.success("Lesson completed!"); },
  });

  const cancelMutation = trpc.lessons.cancel.useMutation({
    onSuccess: () => { utils.lessons.list.invalidate(); toast.success("Lesson cancelled."); },
  });

  const deleteMutation = trpc.lessons.delete.useMutation({
    onSuccess: () => { utils.lessons.list.invalidate(); utils.analytics.overview.invalidate(); toast.success("Lesson deleted."); },
  });

  const now = new Date();
  const filtered = allLessons.filter(l => {
    if (filter === "upcoming") return l.status === "scheduled" && new Date(l.scheduledAt) >= now;
    if (filter === "completed") return l.status === "completed";
    if (filter === "cancelled") return l.status === "cancelled" || l.status === "no_show";
    return true;
  });

  const getStudentName = (id: number) => students.find(s => s.id === id)?.name ?? `Student #${id}`;
  const getStudentWhatsApp = (id: number) => students.find(s => s.id === id)?.whatsapp;

  const sendWhatsAppReminder = (lesson: any) => {
    const wa = getStudentWhatsApp(lesson.studentId);
    if (!wa) { toast.error("No WhatsApp number for this student"); return; }
    const num = wa.replace(/\D/g, "");
    const dt = new Date(lesson.scheduledAt);
    const msg = encodeURIComponent(
      `Hello! This is a reminder for your English lesson with Ibrahim.\n\n📅 ${formatDateTime(dt)}\n⏱️ Duration: ${lesson.durationMinutes} minutes${lesson.meetLink ? `\n🎥 Google Meet: ${lesson.meetLink}` : ""}\n\nSee you soon! 😊`
    );
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
    toast.success("WhatsApp opened with reminder message!");
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Schedule</h1>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} lesson{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Schedule Lesson
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: "upcoming", label: "Upcoming" },
          { key: "completed", label: "Completed" },
          { key: "cancelled", label: "Cancelled" },
          { key: "all", label: "All" },
        ].map(tab => (
          <Button key={tab.key} variant={filter === tab.key ? "default" : "outline"} size="sm" onClick={() => setFilter(tab.key)} className={filter === tab.key ? "bg-blue-600 hover:bg-blue-700" : ""}>
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Lessons List */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border border-slate-200">
          <CardContent className="py-16 text-center">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No lessons found</p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => setDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Schedule First Lesson
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((lesson) => (
            <Card key={lesson.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg shrink-0 mt-0.5">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{getStudentName(lesson.studentId)}</p>
                        <Badge variant="outline" className={`text-xs ${statusColors[lesson.status]}`}>{lesson.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">{lesson.title || "English Lesson"}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDateTime(lesson.scheduledAt)}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{lesson.durationMinutes}min</span>
                        {lesson.meetLink && <a href={lesson.meetLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-600"><Video className="h-3 w-3" />Meet Link</a>}
                      </div>
                      {lesson.notes && <p className="text-xs text-slate-500 mt-1 italic">{lesson.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {lesson.status === "scheduled" && (
                      <>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-green-600 hover:bg-green-50" onClick={() => sendWhatsAppReminder(lesson)}>
                          📱 Remind
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:bg-green-50" onClick={() => completeMutation.mutate({ id: lesson.id })}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-orange-500 hover:bg-orange-50" onClick={() => cancelMutation.mutate({ id: lesson.id })}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600" onClick={() => { if (confirm("Delete this lesson?")) deleteMutation.mutate({ id: lesson.id }); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Schedule New Lesson</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!form.studentId) { toast.error("Select a student"); return; } createMutation.mutate({ studentId: parseInt(form.studentId), title: form.title || undefined, scheduledAt: new Date(form.scheduledAt), durationMinutes: parseInt(form.durationMinutes), meetLink: form.meetLink || undefined, notes: form.notes || undefined }); }} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Student *</Label>
                <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
                  <SelectContent>{students.filter(s => s.status === "active" || s.status === "trial").map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Lesson Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Speaking Practice - Job Interview" />
              </div>
              <div className="col-span-2">
                <Label>Date & Time *</Label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Select value={form.durationMinutes} onValueChange={(v) => setForm({ ...form, durationMinutes: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Google Meet Link</Label>
                <Input value={form.meetLink} onChange={(e) => setForm({ ...form, meetLink: e.target.value })} placeholder="https://meet.google.com/..." />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Topics to cover, student requests..." rows={2} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>Schedule Lesson</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
