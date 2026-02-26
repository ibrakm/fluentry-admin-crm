import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpen, CreditCard, MessageCircle, Plus, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

const levelColors: Record<string, string> = {
  A1: "bg-red-100 text-red-700", A2: "bg-orange-100 text-orange-700",
  B1: "bg-yellow-100 text-yellow-700", B2: "bg-blue-100 text-blue-700",
  C1: "bg-green-100 text-green-700", C2: "bg-purple-100 text-purple-700",
};

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const studentId = parseInt(id ?? "0");

  const [paymentDialog, setPaymentDialog] = useState(false);
  const [progressDialog, setProgressDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", description: "", status: "paid", packageType: "standard", lessonCount: "1" });
  const [progressForm, setProgressForm] = useState({ levelBefore: "A2", levelAfter: "B1", note: "", strengths: "", areasToImprove: "", homework: "" });

  const utils = trpc.useUtils();
  const { data: student, isLoading } = trpc.students.get.useQuery({ id: studentId });
  const { data: payments = [] } = trpc.payments.list.useQuery({ studentId });
  const { data: lessons = [] } = trpc.lessons.list.useQuery({ studentId });
  const { data: progressNotes = [] } = trpc.progress.list.useQuery({ studentId });

  const createPayment = trpc.payments.create.useMutation({
    onSuccess: () => { utils.payments.list.invalidate(); setPaymentDialog(false); toast.success("Payment recorded!"); },
    onError: (e) => toast.error(e.message),
  });

  const markPaid = trpc.payments.markPaid.useMutation({
    onSuccess: () => { utils.payments.list.invalidate(); toast.success("Marked as paid!"); },
  });

  const createProgress = trpc.progress.create.useMutation({
    onSuccess: () => { utils.progress.list.invalidate(); setProgressDialog(false); toast.success("Progress note added!"); },
    onError: (e) => toast.error(e.message),
  });

  const completeLesson = trpc.lessons.complete.useMutation({
    onSuccess: () => { utils.lessons.list.invalidate(); toast.success("Lesson marked as completed!"); },
  });

  if (isLoading) return <div className="animate-pulse p-8"><div className="h-8 bg-slate-200 rounded w-1/3 mb-4" /><div className="h-32 bg-slate-200 rounded" /></div>;
  if (!student) return <div className="p-8 text-center text-slate-500">Student not found. <Button variant="link" onClick={() => setLocation("/students")}>Go back</Button></div>;

  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const pendingAmount = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const completedLessons = lessons.filter(l => l.status === "completed").length;

  const openWhatsApp = () => {
    if (!student.whatsapp) { toast.error("No WhatsApp number for this student"); return; }
    const num = student.whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${num}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/students")} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-lg font-bold text-blue-700">{student.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{student.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${levelColors[student.englishLevel ?? "A1"]}`}>{student.englishLevel}</Badge>
                <span className="text-slate-300">→</span>
                <Badge variant="outline" className={`text-xs ${levelColors[student.targetLevel ?? "B1"]}`}>{student.targetLevel}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{student.status}</Badge>
              </div>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={openWhatsApp} className="text-green-600 border-green-200 hover:bg-green-50">
          <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Paid", value: `${totalPaid.toFixed(0)} MAD`, color: "text-green-600" },
          { label: "Pending", value: `${pendingAmount.toFixed(0)} MAD`, color: "text-yellow-600" },
          { label: "Lessons Done", value: completedLessons, color: "text-blue-600" },
          { label: "Progress Notes", value: progressNotes.length, color: "text-purple-600" },
        ].map((stat) => (
          <Card key={stat.label} className="border border-slate-200">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Info */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: "Email", value: student.email || "—" },
              { label: "WhatsApp", value: student.whatsapp || "—" },
              { label: "Package", value: student.packageType?.replace(/_/g, " ") || "—" },
              { label: "Source", value: student.source?.replace(/_/g, " ") || "—" },
              { label: "Enrolled", value: new Date(student.enrolledAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) },
            ].map((item) => (
              <div key={item.label} className="flex justify-between">
                <span className="text-slate-500">{item.label}</span>
                <span className="text-slate-800 font-medium capitalize">{item.value}</span>
              </div>
            ))}
            {student.goals && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-500 mb-1">Goals</p>
                <p className="text-slate-700">{student.goals}</p>
              </div>
            )}
            {student.notes && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-500 mb-1">Notes</p>
                <p className="text-slate-700">{student.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lessons */}
        <Card className="border border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" /> Lessons
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setLocation("/schedule")}>
              <Plus className="h-3 w-3 mr-1" /> Schedule
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {lessons.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No lessons yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lessons.slice(0, 8).map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{lesson.title || "English Lesson"}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(lesson.scheduledAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {" · "}{lesson.durationMinutes}min
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${lesson.status === "completed" ? "bg-green-50 text-green-600" : lesson.status === "scheduled" ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-500"}`}>
                        {lesson.status}
                      </Badge>
                      {lesson.status === "scheduled" && (
                        <Button size="sm" variant="ghost" className="h-6 text-xs text-green-600 hover:text-green-700" onClick={() => completeLesson.mutate({ id: lesson.id })}>
                          Done
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card className="border border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-600" /> Payments
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setPaymentDialog(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {payments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No payments recorded</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{payment.description || "Lesson payment"}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(payment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{Number(payment.amount).toFixed(0)} {payment.currency}</span>
                      <Badge variant="outline" className={`text-xs ${payment.status === "paid" ? "bg-green-50 text-green-600" : payment.status === "pending" ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600"}`}>
                        {payment.status}
                      </Badge>
                      {payment.status === "pending" && (
                        <Button size="sm" variant="ghost" className="h-6 text-xs text-green-600" onClick={() => markPaid.mutate({ id: payment.id })}>
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Notes */}
        <Card className="border border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" /> Progress Notes
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setProgressDialog(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {progressNotes.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No progress notes yet</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {progressNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {note.levelBefore && <Badge variant="outline" className={`text-xs ${levelColors[note.levelBefore]}`}>{note.levelBefore}</Badge>}
                        {note.levelAfter && <><span className="text-slate-300 text-xs">→</span><Badge variant="outline" className={`text-xs ${levelColors[note.levelAfter]}`}>{note.levelAfter}</Badge></>}
                      </div>
                      <span className="text-xs text-slate-400">{new Date(note.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                    </div>
                    <p className="text-sm text-slate-700">{note.note}</p>
                    {note.homework && <p className="text-xs text-blue-600 mt-1">📚 {note.homework}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createPayment.mutate({ studentId, amount: paymentForm.amount, description: paymentForm.description, status: paymentForm.status as any, packageType: paymentForm.packageType as any, lessonCount: parseInt(paymentForm.lessonCount) }); }} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount (MAD) *</Label>
                <Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required placeholder="90" />
              </div>
              <div>
                <Label>Lessons Count</Label>
                <Input type="number" value={paymentForm.lessonCount} onChange={(e) => setPaymentForm({ ...paymentForm, lessonCount: e.target.value })} placeholder="1" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={paymentForm.status} onValueChange={(v) => setPaymentForm({ ...paymentForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Package</Label>
                <Select value={paymentForm.packageType} onValueChange={(v) => setPaymentForm({ ...paymentForm, packageType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="pay_per_lesson">Pay Per Lesson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Input value={paymentForm.description} onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })} placeholder="e.g. 4 lessons - February" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setPaymentDialog(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={createPayment.isPending}>Save Payment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={progressDialog} onOpenChange={setProgressDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Progress Note</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createProgress.mutate({ studentId, levelBefore: progressForm.levelBefore as any, levelAfter: progressForm.levelAfter as any, note: progressForm.note, strengths: progressForm.strengths, areasToImprove: progressForm.areasToImprove, homework: progressForm.homework }); }} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Level Before</Label>
                <Select value={progressForm.levelBefore} onValueChange={(v) => setProgressForm({ ...progressForm, levelBefore: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["A1","A2","B1","B2","C1","C2"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level After</Label>
                <Select value={progressForm.levelAfter} onValueChange={(v) => setProgressForm({ ...progressForm, levelAfter: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["A1","A2","B1","B2","C1","C2"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Note *</Label>
                <Textarea value={progressForm.note} onChange={(e) => setProgressForm({ ...progressForm, note: e.target.value })} required placeholder="Summary of this lesson's progress..." rows={3} />
              </div>
              <div>
                <Label>Strengths</Label>
                <Textarea value={progressForm.strengths} onChange={(e) => setProgressForm({ ...progressForm, strengths: e.target.value })} placeholder="What went well..." rows={2} />
              </div>
              <div>
                <Label>Areas to Improve</Label>
                <Textarea value={progressForm.areasToImprove} onChange={(e) => setProgressForm({ ...progressForm, areasToImprove: e.target.value })} placeholder="What to work on..." rows={2} />
              </div>
              <div className="col-span-2">
                <Label>Homework</Label>
                <Input value={progressForm.homework} onChange={(e) => setProgressForm({ ...progressForm, homework: e.target.value })} placeholder="Assigned homework for next session..." />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setProgressDialog(false)}>Cancel</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={createProgress.isPending}>Save Note</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
