import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";

// ─── Helper ──────────────────────────────────────────────
function runAppleScript(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("osascript", ["-e", script], { timeout: 10000 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout.trim());
    });
  });
}

function sanitize(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// ─── Calendar ────────────────────────────────────────────

async function getCalendarEvents(days: number) {
  const script = `
set output to ""
set startDate to current date
set endDate to startDate + (${Number(days)} * days)
tell application "Calendar"
  repeat with cal in every calendar
    set calName to name of cal
    set evts to (every event of cal whose start date ≥ startDate and start date ≤ endDate)
    repeat with evt in evts
      set evtTitle to summary of evt
      set evtStart to start date of evt
      set evtEnd to end date of evt
      set evtLoc to ""
      try
        set evtLoc to location of evt
      end try
      set output to output & evtTitle & "||" & (evtStart as string) & "||" & (evtEnd as string) & "||" & calName & "||" & evtLoc & "\\n"
    end repeat
  end repeat
end tell
return output`.trim();

  const raw = await runAppleScript(script);
  if (!raw) return [];
  return raw
    .split("\\n")
    .filter(Boolean)
    .map((line) => {
      const p = line.split("||");
      return { title: p[0] || "", start: p[1] || "", end: p[2] || "", calendar: p[3] || "", location: p[4] || "" };
    });
}

async function createCalendarEvent(data: {
  title: string;
  startDate: string;
  endDate: string;
  calendar?: string;
  location?: string;
  notes?: string;
}) {
  const calFilter = data.calendar
    ? `set targetCal to first calendar whose name is "${sanitize(data.calendar)}"`
    : `set targetCal to first calendar`;
  const loc = data.location ? `set location of newEvent to "${sanitize(data.location)}"` : "";
  const notes = data.notes ? `set description of newEvent to "${sanitize(data.notes)}"` : "";

  const script = `
tell application "Calendar"
  ${calFilter}
  set newEvent to make new event at end of events of targetCal with properties {summary:"${sanitize(data.title)}", start date:date "${sanitize(data.startDate)}", end date:date "${sanitize(data.endDate)}"}
  ${loc}
  ${notes}
end tell
return "ok"`.trim();

  await runAppleScript(script);
  return true;
}

async function listCalendars() {
  const script = `
set output to ""
tell application "Calendar"
  repeat with cal in every calendar
    set output to output & name of cal & "\\n"
  end repeat
end tell
return output`.trim();

  const raw = await runAppleScript(script);
  return raw.split("\\n").filter(Boolean);
}

// ─── Reminders ───────────────────────────────────────────

async function getReminders(listName?: string) {
  const listFilter = listName
    ? `set targetList to list "${sanitize(listName)}"`
    : `set targetList to default list`;

  const script = `
set output to ""
tell application "Reminders"
  ${listFilter}
  set rems to (every reminder of targetList whose completed is false)
  repeat with r in rems
    set rName to name of r
    set rDue to ""
    try
      set rDue to due date of r as string
    end try
    set rPriority to priority of r as string
    set output to output & rName & "||" & rDue & "||" & rPriority & "\\n"
  end repeat
end tell
return output`.trim();

  const raw = await runAppleScript(script);
  if (!raw) return [];
  return raw
    .split("\\n")
    .filter(Boolean)
    .map((line) => {
      const p = line.split("||");
      return { name: p[0] || "", dueDate: p[1] || "", priority: p[2] || "0" };
    });
}

async function createReminder(data: { name: string; listName?: string; dueDate?: string; notes?: string }) {
  const listFilter = data.listName
    ? `set targetList to list "${sanitize(data.listName)}"`
    : `set targetList to default list`;
  const due = data.dueDate ? `set due date of newReminder to date "${sanitize(data.dueDate)}"` : "";
  const notes = data.notes ? `set body of newReminder to "${sanitize(data.notes)}"` : "";

  const script = `
tell application "Reminders"
  ${listFilter}
  set newReminder to make new reminder at end of reminders of targetList with properties {name:"${sanitize(data.name)}"}
  ${due}
  ${notes}
end tell
return "ok"`.trim();

  await runAppleScript(script);
  return true;
}

async function listReminderLists() {
  const script = `
set output to ""
tell application "Reminders"
  repeat with l in every list
    set output to output & name of l & "\\n"
  end repeat
end tell
return output`.trim();

  const raw = await runAppleScript(script);
  return raw.split("\\n").filter(Boolean);
}

// ─── Mail ────────────────────────────────────────────────

async function getUnreadEmails(limit: number) {
  const script = `
set output to ""
tell application "Mail"
  set msgs to (messages of inbox whose read status is false)
  set counter to 0
  repeat with m in msgs
    if counter ≥ ${Number(limit)} then exit repeat
    set mSubject to subject of m
    set mSender to sender of m
    set mDate to date received of m as string
    set mPreview to ""
    try
      set mPreview to text 1 thru 100 of (content of m)
    on error
      try
        set mPreview to content of m
      end try
    end try
    set output to output & mSubject & "||" & mSender & "||" & mDate & "||" & mPreview & "\\n"
    set counter to counter + 1
  end repeat
end tell
return output`.trim();

  const raw = await runAppleScript(script);
  if (!raw) return [];
  return raw
    .split("\\n")
    .filter(Boolean)
    .map((line) => {
      const p = line.split("||");
      return { subject: p[0] || "", sender: p[1] || "", date: p[2] || "", preview: p[3] || "" };
    });
}

async function composeMail(data: { to: string; subject: string; body: string }) {
  const script = `
tell application "Mail"
  set newMessage to make new outgoing message with properties {subject:"${sanitize(data.subject)}", content:"${sanitize(data.body)}", visible:true}
  tell newMessage
    make new to recipient at end of to recipients with properties {address:"${sanitize(data.to)}"}
  end tell
  activate
end tell
return "ok"`.trim();

  await runAppleScript(script);
  return true;
}

// ─── Notes ───────────────────────────────────────────────

async function createNote(data: { title: string; body: string; folder?: string }) {
  const target = data.folder ? `folder "${sanitize(data.folder)}"` : "default account";

  const script = `
tell application "Notes"
  tell ${target}
    make new note with properties {name:"${sanitize(data.title)}", body:"${sanitize(data.body)}"}
  end tell
end tell
return "ok"`.trim();

  await runAppleScript(script);
  return true;
}

// ─── Route Handler ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json();

    switch (action) {
      case "getCalendarEvents":
        return NextResponse.json(await getCalendarEvents(params.days ?? 7));
      case "createCalendarEvent":
        await createCalendarEvent(params);
        return NextResponse.json({ ok: true });
      case "listCalendars":
        return NextResponse.json(await listCalendars());
      case "getReminders":
        return NextResponse.json(await getReminders(params.listName));
      case "createReminder":
        await createReminder(params);
        return NextResponse.json({ ok: true });
      case "listReminderLists":
        return NextResponse.json(await listReminderLists());
      case "getUnreadEmails":
        return NextResponse.json(await getUnreadEmails(params.limit ?? 10));
      case "composeMail":
        await composeMail(params);
        return NextResponse.json({ ok: true });
      case "createNote":
        await createNote(params);
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
