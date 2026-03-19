"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import {
  CalendarDays,
  ListChecks,
  Mail,
  StickyNote,
  Plus,
  RefreshCw,
  Clock,
  MapPin,
  Send,
  ChevronRight,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LoadingButton from "@/components/LoadingButton";
import { toast } from "@/components/Toast";

// ─── Types ───────────────────────────────────────────────
type CalendarEvent = { title: string; start: string; end: string; calendar: string; location: string };
type Reminder = { name: string; dueDate: string; priority: string };
type Email = { subject: string; sender: string; date: string; preview: string };

type Tab = "calendar" | "reminders" | "mail" | "notes";

const TABS: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: "calendar", label: "Calendário", icon: CalendarDays },
  { id: "reminders", label: "Lembretes", icon: ListChecks },
  { id: "mail", label: "E-mail", icon: Mail },
  { id: "notes", label: "Notas", icon: StickyNote },
];

// ─── API helper ──────────────────────────────────────────
async function macAction(action: string, params: Record<string, unknown> = {}) {
  const res = await fetch("/api/macos-integration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ═════════════════════════════════════════════════════════
export default function IntegracoesPage() {
  const [tab, setTab] = useState<Tab>("calendar");

  return (
    <div className="page-glass max-w-3xl mx-auto p-6 space-y-4">
      <PageHeader
        title="Integrações macOS"
        description="Calendário, Lembretes, E-mail e Notas — conectado direto ao seu Mac."
      />

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-lg">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                active
                  ? "bg-white dark:bg-white/10 shadow-sm"
                  : "hover:bg-white/50 dark:hover:bg-white/5 opacity-60"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      {tab === "calendar" && <CalendarTab />}
      {tab === "reminders" && <RemindersTab />}
      {tab === "mail" && <MailTab />}
      {tab === "notes" && <NotesTab />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
//  CALENDAR TAB
// ═════════════════════════════════════════════════════════
function CalendarTab() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [calendars, setCalendars] = useState<string[]>([]);

  // Create form
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cal, setCal] = useState("");
  const [location, setLocation] = useState("");
  const [creating, setCreating] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await macAction("getCalendarEvents", { days: 7 });
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      toast("Não foi possível acessar o Calendário. Verifique permissões.");
    }
    setLoading(false);
  }, []);

  const loadCalendars = useCallback(async () => {
    try {
      const data = await macAction("listCalendars");
      setCalendars(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadEvents(); loadCalendars(); }, [loadEvents, loadCalendars]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) return;
    setCreating(true);
    try {
      await macAction("createCalendarEvent", {
        title,
        startDate,
        endDate,
        calendar: cal || undefined,
        location: location || undefined,
      });
      toast("Evento criado no Calendário!");
      setTitle(""); setStartDate(""); setEndDate(""); setLocation("");
      setShowForm(false);
      loadEvents();
    } catch {
      toast("Erro ao criar evento. Verifique as permissões.");
    }
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium opacity-70">Próximos 7 dias</h2>
        <div className="flex gap-2">
          <button onClick={loadEvents} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label="Atualizar">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors">
            <Plus size={14} /> Novo Evento
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="widget-glass p-4 space-y-3 rounded-lg">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do evento" className="w-full bg-transparent border border-white/10 rounded-md px-3 py-2 text-sm" required />
          <div className="grid grid-cols-2 gap-3">
            <input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="datetime-local" className="bg-transparent border border-white/10 rounded-md px-3 py-2 text-sm" required />
            <input value={endDate} onChange={(e) => setEndDate(e.target.value)} type="datetime-local" className="bg-transparent border border-white/10 rounded-md px-3 py-2 text-sm" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={cal} onChange={(e) => setCal(e.target.value)} className="bg-transparent border border-white/10 rounded-md px-3 py-2 text-sm">
              <option value="">Calendário padrão</option>
              {calendars.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Local (opcional)" className="bg-transparent border border-white/10 rounded-md px-3 py-2 text-sm" />
          </div>
          <LoadingButton loading={creating} label="Criar Evento" />
        </form>
      )}

      {/* Events list */}
      {events.length === 0 && !loading && (
        <p className="text-center text-sm opacity-50 py-8">Nenhum evento nos próximos 7 dias</p>
      )}
      <div className="space-y-2">
        {events.map((evt, i) => (
          <div key={i} className="widget-glass p-3 rounded-lg flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CalendarDays size={18} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{evt.title}</p>
              <div className="flex items-center gap-3 text-xs opacity-60 mt-0.5">
                <span className="flex items-center gap-1"><Clock size={12} /> {evt.start}</span>
                {evt.location && <span className="flex items-center gap-1"><MapPin size={12} /> {evt.location}</span>}
              </div>
              <p className="text-xs opacity-40 mt-0.5">{evt.calendar}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
//  REMINDERS TAB
// ═════════════════════════════════════════════════════════
function RemindersTab() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [lists, setLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const loadLists = useCallback(async () => {
    try {
      const data = await macAction("listReminderLists");
      setLists(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await macAction("getReminders", { listName: selectedList || undefined });
      setReminders(Array.isArray(data) ? data : []);
    } catch {
      toast("Não foi possível acessar os Lembretes. Verifique permissões.");
    }
    setLoading(false);
  }, [selectedList]);

  useEffect(() => { loadLists(); }, [loadLists]);
  useEffect(() => { loadReminders(); }, [loadReminders]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setCreating(true);
    try {
      await macAction("createReminder", {
        name,
        listName: selectedList || undefined,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
      });
      toast("Lembrete criado!");
      setName(""); setDueDate(""); setNotes("");
      setShowForm(false);
      loadReminders();
    } catch {
      toast("Erro ao criar lembrete.");
    }
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <select
          value={selectedList}
          onChange={(e) => setSelectedList(e.target.value)}
          className="bg-transparent border border-white/10 rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">Lista padrão</option>
          {lists.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={loadReminders} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label="Atualizar">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition-colors">
            <Plus size={14} /> Novo Lembrete
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="widget-glass p-4 space-y-3 rounded-lg">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do lembrete" className="w-full bg-transparent border border-white/10 rounded-md px-3 py-2 text-sm" required />
          <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="datetime-local" placeholder="Data limite" className="w-full bg-transparent border border-white/10 rounded-md px-3 py-2 text-sm" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)" rows={2} className="w-full bg-transparent border border-white/10 rounded-md px-3 py-2 text-sm resize-none" />
          <LoadingButton loading={creating} label="Criar Lembrete" />
        </form>
      )}

      {reminders.length === 0 && !loading && (
        <p className="text-center text-sm opacity-50 py-8">Nenhum lembrete pendente</p>
      )}
      <div className="space-y-2">
        {reminders.map((r, i) => (
          <div key={i} className="widget-glass p-3 rounded-lg flex items-center gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <ListChecks size={16} className="text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{r.name}</p>
              {r.dueDate && <p className="text-xs opacity-50 flex items-center gap-1"><Clock size={12} /> {r.dueDate}</p>}
            </div>
            <ChevronRight size={14} className="opacity-30" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
//  MAIL TAB
// ═════════════════════════════════════════════════════════
function MailTab() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const loadEmails = useCallback(async () => {
    setLoading(true);
    try {
      const data = await macAction("getUnreadEmails", { limit: 10 });
      setEmails(Array.isArray(data) ? data : []);
    } catch {
      toast("Não foi possível acessar o Mail. Verifique permissões.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadEmails(); }, [loadEmails]);

  const handleCompose = async (e: FormEvent) => {
    e.preventDefault();
    if (!to || !subject) return;
    setSending(true);
    try {
      await macAction("composeMail", { to, subject, body });
      toast("E-mail aberto no Mail.app!");
      setTo(""); setSubject(""); setBody("");
      setShowCompose(false);
    } catch {
      toast("Erro ao compor e-mail.");
    }
    setSending(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium opacity-70">E-mails não lidos</h2>
        <div className="flex gap-2">
          <button onClick={loadEmails} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label="Atualizar">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowCompose(!showCompose)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 transition-colors">
            <Send size={14} /> Compor
          </button>
        </div>
      </div>

      {showCompose && (
        <form onSubmit={handleCompose} className="widget-glass p-4 space-y-3 rounded-lg">
          <input value={to} onChange={(e) => setTo(e.target.value)} type="email" placeholder="Para (email)" className="w-full bg-transparent border border-white/10 rounded-md px-3 py-2 text-sm" required />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto" className="w-full bg-transparent border border-white/10 rounded-md px-3 py-2 text-sm" required />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Corpo do e-mail" rows={4} className="w-full bg-transparent border border-white/10 rounded-md px-3 py-2 text-sm resize-none" />
          <LoadingButton loading={sending} label="Abrir no Mail" />
        </form>
      )}

      {emails.length === 0 && !loading && (
        <p className="text-center text-sm opacity-50 py-8">Nenhum e-mail não lido</p>
      )}
      <div className="space-y-2">
        {emails.map((m, i) => (
          <div key={i} className="widget-glass p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium truncate flex-1">{m.subject}</p>
              <span className="text-xs opacity-40 shrink-0 ml-2">{m.date}</span>
            </div>
            <p className="text-xs opacity-60 truncate">{m.sender}</p>
            {m.preview && <p className="text-xs opacity-40 mt-1 line-clamp-2">{m.preview}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
//  NOTES TAB
// ═════════════════════════════════════════════════════════
function NotesTab() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    setCreating(true);
    try {
      await macAction("createNote", { title, body });
      toast("Nota criada no Notes.app!");
      setTitle(""); setBody("");
    } catch {
      toast("Erro ao criar nota.");
    }
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium opacity-70">Criar nota rápida</h2>
      <form onSubmit={handleCreate} className="widget-glass p-4 space-y-3 rounded-lg">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da nota" className="w-full bg-transparent border border-white/10 rounded-md px-3 py-2 text-sm" required />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Conteúdo da nota..." rows={6} className="w-full bg-transparent border border-white/10 rounded-md px-3 py-2 text-sm resize-none" required />
        <LoadingButton loading={creating} label="Criar no Notes" />
      </form>
      <p className="text-xs opacity-40 text-center">A nota será criada diretamente no Apple Notes.</p>
    </div>
  );
}
