import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { BookOpen, Plus, TrendingUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const levelColors: Record<string, string> = {
  A1: "bg-red-100 text-red-700", A2: "bg-orange-100 text-orange-700",
  B1: "bg-yellow-100 text-yellow-700", B2: "bg-blue-100 text-blue-700",
  C1: "bg-green-100 text-green-700", C2: "bg-purple-100 text-purple-700",
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function Progress() {
  const [, setLocation] = useLocation();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ studentId: "", levelBefore: "A2", levelAfter: "B1", note: "", strengths: "", areasToImprove: "", homework: "" });

  const utils = trpc.useUtils();
  const { data: students = [] } = trpc.students.list.useQuery({ status: "active" });
  const { data: progressNotes = [], isLoading } = trpc.progress.list.useQuery(
    { studentId: selectedStudentId! },
    { enabled: !!selectedStudentId }
  );

  const createMutation = trpc.progress.create.useMutation({
    onSuccess: () => {
      utils.progress.list.invalidate();
      setDialog(false);
      setForm({ studentId: "", levelBefore: "A2", levelAfter: "B1", note: "", strengths: "", areasToImprove: "", homework: "" });
      toast.success("Progress note added!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.progress.delete.useMutation({
    onSuccess: () => { utils.progress.list.invalidate(); toast.success("Note deleted."); },
  });

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Progress</h1>
          <p className="text-sm text-slate-500 mt-1">Track learning milestones and lesson notes</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Progress Note
        </Button>
      </div>

      {/* Student Selector */}
      <Card className="border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label className="shrink-0 text-slate-600">Select Student:</Label>
            <Select value={selectedStudentId ? String(selectedStudentId) : ""} onValueChange={(v) => setSelectedStudentId(parseInt(v))}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Choose a student to view progress..." />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    <div className="flex items-center gap-2">
                      <span>{s.name}</span>
                      {s.englishLevel && <Badge variant="outline" className={`text-xs ${levelColors[s.englishLevel]}`}>{s.englishLevel}</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStudent && (
              <Button variant="ghost" size="sm" className="text-blue-600 text-xs" onClick={() => setLocation(`/students/${selectedStudent.id}`)}>
                View Full Profile →
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Level Overview */}
      {selectedStudent && (
        <Card className="border border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-700">{selectedStudent.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-blue-800">{selectedStudent.name}</p>
                  <p className="text-sm text-blue-600">{selectedStudent.goals || "No goals set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-center">
                  <p className="text-xs text-blue-500">Current Level</p>
                  <Badge className={`${levelColors[selectedStudent.englishLevel ?? "A1"]} border text-sm font-bold`}>{selectedStudent.englishLevel}</Badge>
                </div>
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <div className="text-center">
                  <p className="text-xs text-blue-500">Target Level</p>
                  <Badge className={`${levelColors[selectedStudent.targetLevel ?? "B1"]} border text-sm font-bold`}>{selectedStudent.targetLevel}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Notes */}
      {!selectedStudentId ? (
        <Card className="border border-slate-200">
          <CardContent className="py-16 text-center">
            <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Select a student above to view their progress notes</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : progressNotes.length === 0 ? (
        <Card className="border border-slate-200">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No progress notes for this student yet</p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => setDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {progressNotes.map((note) => (
            <Card key={note.id} className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div className="flex items-center gap-2">
                  {note.levelBefore && <Badge variant="outline" className={`text-xs ${levelColors[note.levelBefore]}`}>{note.levelBefore}</Badge>}
                  {note.levelAfter && note.levelAfter !== note.levelBefore && (
                    <><span className="text-slate-300">→</span><Badge variant="outline" className={`text-xs ${levelColors[note.levelAfter]}`}>{note.levelAfter} ↑</Badge></>
                  )}
                  <span className="text-xs text-slate-400">
                    {new Date(note.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-500" onClick={() => { if (confirm("Delete this note?")) deleteMutation.mutate({ id: note.id }); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <p className="text-sm text-slate-700">{note.note}</p>
                {note.strengths && (
                  <div className="p-2 bg-green-50 rounded-lg">
                    <p className="text-xs font-medium text-green-700 mb-0.5">✅ Strengths</p>
                    <p className="text-xs text-green-600">{note.strengths}</p>
                  </div>
                )}
                {note.areasToImprove && (
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <p className="text-xs font-medium text-orange-700 mb-0.5">🎯 Areas to Improve</p>
                    <p className="text-xs text-orange-600">{note.areasToImprove}</p>
                  </div>
                )}
                {note.homework && (
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 mb-0.5">📚 Homework</p>
                    <p className="text-xs text-blue-600">{note.homework}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Progress Note Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Progress Note</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); const sid = form.studentId ? parseInt(form.studentId) : selectedStudentId; if (!sid) { toast.error("Select a student"); return; } createMutation.mutate({ studentId: sid, levelBefore: form.levelBefore as any, levelAfter: form.levelAfter as any, note: form.note, strengths: form.strengths || undefined, areasToImprove: form.areasToImprove || undefined, homework: form.homework || undefined }); }} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Student *</Label>
                <Select value={form.studentId || (selectedStudentId ? String(selectedStudentId) : "")} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level Before</Label>
                <Select value={form.levelBefore} onValueChange={(v) => setForm({ ...form, levelBefore: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level After</Label>
                <Select value={form.levelAfter} onValueChange={(v) => setForm({ ...form, levelAfter: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Lesson Note *</Label>
                <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} required placeholder="Summary of today's lesson and progress..." rows={3} />
              </div>
              <div>
                <Label>Strengths</Label>
                <Textarea value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} placeholder="What went well..." rows={2} />
              </div>
              <div>
                <Label>Areas to Improve</Label>
                <Textarea value={form.areasToImprove} onChange={(e) => setForm({ ...form, areasToImprove: e.target.value })} placeholder="Focus for next session..." rows={2} />
              </div>
              <div className="col-span-2">
                <Label>Homework</Label>
                <Input value={form.homework} onChange={(e) => setForm({ ...form, homework: e.target.value })} placeholder="e.g. Practice 10 new vocabulary words, record a 2-minute speech..." />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={createMutation.isPending}>Save Note</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
