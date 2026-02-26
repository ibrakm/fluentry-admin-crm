import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CheckCircle, CreditCard, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
  refunded: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function Payments() {
  const [dialog, setDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ studentId: "", amount: "", description: "", status: "paid", packageType: "standard", lessonCount: "1" });

  const utils = trpc.useUtils();
  const { data: payments = [], isLoading } = trpc.payments.list.useQuery({});
  const { data: students = [] } = trpc.students.list.useQuery({});

  const createMutation = trpc.payments.create.useMutation({
    onSuccess: () => { utils.payments.list.invalidate(); utils.analytics.overview.invalidate(); setDialog(false); setForm({ studentId: "", amount: "", description: "", status: "paid", packageType: "standard", lessonCount: "1" }); toast.success("Payment recorded!"); },
    onError: (e) => toast.error(e.message),
  });

  const markPaid = trpc.payments.markPaid.useMutation({
    onSuccess: () => { utils.payments.list.invalidate(); utils.analytics.overview.invalidate(); toast.success("Marked as paid!"); },
  });

  const deleteMutation = trpc.payments.delete.useMutation({
    onSuccess: () => { utils.payments.list.invalidate(); utils.analytics.overview.invalidate(); toast.success("Payment deleted."); },
  });

  const filtered = statusFilter === "all" ? payments : payments.filter(p => p.status === statusFilter);
  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const totalOverdue = payments.filter(p => p.status === "overdue").reduce((s, p) => s + Number(p.amount), 0);

  const getStudentName = (id: number) => students.find(s => s.id === id)?.name ?? `Student #${id}`;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
          <p className="text-sm text-slate-500 mt-1">{payments.length} payment records</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Record Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-xs text-green-600 font-medium">Total Collected</p>
            <p className="text-2xl font-bold text-green-700">{totalPaid.toFixed(0)} MAD</p>
          </CardContent>
        </Card>
        <Card className="border border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-xs text-yellow-600 font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">{totalPending.toFixed(0)} MAD</p>
          </CardContent>
        </Card>
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-xs text-red-600 font-medium">Overdue</p>
            <p className="text-2xl font-bold text-red-700">{totalOverdue.toFixed(0)} MAD</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "paid", "pending", "overdue", "refunded"].map(s => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className={statusFilter === s ? "bg-blue-600 hover:bg-blue-700" : ""}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Payments Table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border border-slate-200">
          <CardContent className="py-16 text-center">
            <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No payments found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Student</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Description</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Date</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-800">{getStudentName(payment.studentId)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm text-slate-700">{payment.description || "Lesson payment"}</span>
                        {payment.lessonCount && payment.lessonCount > 1 && (
                          <span className="text-xs text-slate-400 ml-2">({payment.lessonCount} lessons)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-slate-800">{Number(payment.amount).toFixed(0)} {payment.currency}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${statusColors[payment.status]}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">
                        {new Date(payment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {payment.status === "pending" && (
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => markPaid.mutate({ id: payment.id })}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Paid
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600" onClick={() => { if (confirm("Delete this payment?")) deleteMutation.mutate({ id: payment.id }); }}>
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

      {/* Add Payment Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record New Payment</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!form.studentId) { toast.error("Select a student"); return; } createMutation.mutate({ studentId: parseInt(form.studentId), amount: form.amount, description: form.description, status: form.status as any, packageType: form.packageType as any, lessonCount: parseInt(form.lessonCount) }); }} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Student *</Label>
                <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (MAD) *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="90" />
              </div>
              <div>
                <Label>Lessons</Label>
                <Input type="number" value={form.lessonCount} onChange={(e) => setForm({ ...form, lessonCount: e.target.value })} placeholder="1" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
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
                <Select value={form.packageType} onValueChange={(v) => setForm({ ...form, packageType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter (62.50)</SelectItem>
                    <SelectItem value="standard">Standard (90)</SelectItem>
                    <SelectItem value="premium">Premium (80)</SelectItem>
                    <SelectItem value="group">Group (200/mo)</SelectItem>
                    <SelectItem value="pay_per_lesson">Pay Per Lesson (100)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. 4 lessons - February 2026" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={createMutation.isPending}>Save Payment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
