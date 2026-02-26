import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { MessageCircle, Plus, Search, Trash2, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-700 border-yellow-200",
  interested: "bg-purple-100 text-purple-700 border-purple-200",
  converted: "bg-green-100 text-green-700 border-green-200",
  lost: "bg-slate-100 text-slate-500 border-slate-200",
};

const levelColors: Record<string, string> = {
  A1: "bg-red-100 text-red-700", A2: "bg-orange-100 text-orange-700",
  B1: "bg-yellow-100 text-yellow-700", B2: "bg-blue-100 text-blue-700",
  C1: "bg-green-100 text-green-700", C2: "bg-purple-100 text-purple-700",
};

export default function Leads() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", whatsapp: "", englishLevel: "A2",
    source: "facebook_ad", status: "new", notes: "", testScore: "",
  });

  const utils = trpc.useUtils();
  const { data: leadsData, isLoading } = trpc.leads.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const leads = Array.isArray(leadsData) ? leadsData : [];

  const createMutation = trpc.leads.create.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.analytics.overview.invalidate();
      setDialog(false);
      setForm({ name: "", email: "", whatsapp: "", englishLevel: "A2", source: "facebook_ad", status: "new", notes: "", testScore: "" });
      toast.success("Lead added!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => { utils.leads.list.invalidate(); toast.success("Status updated!"); },
  });

  const convertToStudent = trpc.leads.convertToStudent.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.students.list.invalidate();
      utils.analytics.overview.invalidate();
      toast.success("Lead converted to student!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.leads.delete.useMutation({
    onSuccess: () => { utils.leads.list.invalidate(); utils.analytics.overview.invalidate(); toast.success("Lead removed."); },
  });

  const openWhatsApp = (lead: any) => {
    if (!lead.whatsapp) { toast.error("No WhatsApp number"); return; }
    const num = lead.whatsapp.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hello ${lead.name}! 👋\n\nThank you for your interest in Fluentry English Coaching.\n\nI'd love to schedule a free trial lesson with you. Are you available this week?\n\nBest regards,\nIbrahim K. - Fluentry`
    );
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">{leads.length} lead{leads.length !== 1 ? "s" : ""} in pipeline</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Lead
        </Button>
      </div>

      {/* Status Summary */}
      <div className="flex gap-2 flex-wrap">
        {["all", "new", "contacted", "interested", "converted", "lost"].map(s => {
          const count = s === "all" ? leads.length : leads.filter(l => l.status === s).length;
          return (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className={statusFilter === s ? "bg-blue-600 hover:bg-blue-700" : ""}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
            </Button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search leads by name, email, or WhatsApp..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Leads Table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}</div>
      ) : leads.length === 0 ? (
        <Card className="border border-slate-200">
          <CardContent className="py-16 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No leads found</p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => setDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add First Lead
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Lead</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Contact</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Level</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Source</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Added</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-orange-700">{(lead.name ?? "?").charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{lead.name ?? "Unknown"}</p>
                          {lead.testScore && <p className="text-xs text-slate-400">Test score: {lead.testScore}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-600">{lead.email || "—"}</div>
                      <div className="text-xs text-slate-400">{lead.whatsapp || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      {lead.englishLevel ? (
                        <Badge variant="outline" className={`text-xs ${levelColors[lead.englishLevel]}`}>{lead.englishLevel}</Badge>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600 capitalize">{lead.source?.replace(/_/g, " ") ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Select value={lead.status} onValueChange={(v) => updateStatus.mutate({ id: lead.id, status: v as any })}>
                        <SelectTrigger className="h-7 text-xs w-32 border-0 p-0 bg-transparent focus:ring-0">
                          <Badge variant="outline" className={`text-xs cursor-pointer ${statusColors[lead.status]}`}>
                            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {["new", "contacted", "interested", "converted", "lost"].map(s => (
                            <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">
                        {new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-green-600 hover:bg-green-50" onClick={() => openWhatsApp(lead)}>
                          <MessageCircle className="h-3 w-3 mr-1" /> Contact
                        </Button>
                        {lead.status !== "converted" && (
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-blue-600 hover:bg-blue-50" onClick={() => { if (confirm(`Convert ${lead.name} to a student?`)) convertToStudent.mutate({ id: lead.id }); }}>
                            <UserPlus className="h-3 w-3 mr-1" /> Convert
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600" onClick={() => { if (confirm(`Remove ${lead.name}?`)) deleteMutation.mutate({ id: lead.id }); }}>
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

      {/* Add Lead Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ name: form.name, email: form.email || undefined, whatsapp: form.whatsapp || undefined, englishLevel: form.englishLevel as any, source: form.source as any, status: form.status as any, testScore: form.testScore || undefined, followUpNote: form.notes || undefined }); }} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Full Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Lead's name" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+212 6XX XXX XXX" />
              </div>
              <div>
                <Label>English Level</Label>
                <Select value={form.englishLevel} onValueChange={(v) => setForm({ ...form, englishLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["A1","A2","B1","B2","C1","C2"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
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
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["new", "contacted", "interested", "converted", "lost"].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Test Score</Label>
                <Input value={form.testScore} onChange={(e) => setForm({ ...form, testScore: e.target.value })} placeholder="e.g. 72/100" />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes about this lead..." rows={2} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>Add Lead</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
