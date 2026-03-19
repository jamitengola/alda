/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * macOS Native Integrations via AppleScript
 * 
 * Provides Calendar, Reminders, Mail, Notes integration
 * using osascript (AppleScript) commands.
 */

const { execFile } = require("node:child_process");

// ─── Helper ──────────────────────────────────────────────
function runAppleScript(script) {
  return new Promise((resolve, reject) => {
    execFile("osascript", ["-e", script], { timeout: 10000 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout.trim());
    });
  });
}

// ─── Calendar ────────────────────────────────────────────

/**
 * Get upcoming events from Calendar.app (next N days)
 */
async function getCalendarEvents(days = 7) {
  const script = `
set output to ""
set startDate to current date
set endDate to startDate + (${days} * days)

tell application "Calendar"
  set allCals to every calendar
  repeat with cal in allCals
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

return output
  `.trim();

  try {
    const raw = await runAppleScript(script);
    if (!raw) return [];
    return raw.split("\\n").filter(Boolean).map((line) => {
      const parts = line.split("||");
      return {
        title: parts[0] || "",
        start: parts[1] || "",
        end: parts[2] || "",
        calendar: parts[3] || "",
        location: parts[4] || "",
      };
    });
  } catch {
    return [];
  }
}

/**
 * Create a new event in Calendar.app
 */
async function createCalendarEvent({ title, startDate, endDate, calendar, location, notes }) {
  const calFilter = calendar
    ? `set targetCal to first calendar whose name is "${calendar.replace(/"/g, '\\"')}"`
    : `set targetCal to first calendar`;

  const locationLine = location
    ? `set location of newEvent to "${location.replace(/"/g, '\\"')}"`
    : "";

  const notesLine = notes
    ? `set description of newEvent to "${notes.replace(/"/g, '\\"')}"`
    : "";

  const script = `
tell application "Calendar"
  ${calFilter}
  set newEvent to make new event at end of events of targetCal with properties {summary:"${title.replace(/"/g, '\\"')}", start date:date "${startDate}", end date:date "${endDate}"}
  ${locationLine}
  ${notesLine}
end tell
return "ok"
  `.trim();

  await runAppleScript(script);
  return true;
}

/**
 * List available calendars
 */
async function listCalendars() {
  const script = `
set output to ""
tell application "Calendar"
  repeat with cal in every calendar
    set output to output & name of cal & "\\n"
  end repeat
end tell
return output
  `.trim();

  try {
    const raw = await runAppleScript(script);
    return raw.split("\\n").filter(Boolean);
  } catch {
    return [];
  }
}

// ─── Reminders ───────────────────────────────────────────

/**
 * Get reminders from Reminders.app
 */
async function getReminders(listName) {
  const listFilter = listName
    ? `set targetList to list "${listName.replace(/"/g, '\\"')}"`
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
return output
  `.trim();

  try {
    const raw = await runAppleScript(script);
    if (!raw) return [];
    return raw.split("\\n").filter(Boolean).map((line) => {
      const parts = line.split("||");
      return {
        name: parts[0] || "",
        dueDate: parts[1] || "",
        priority: parts[2] || "0",
      };
    });
  } catch {
    return [];
  }
}

/**
 * Create a reminder in Reminders.app
 */
async function createReminder({ name, listName, dueDate, notes }) {
  const listFilter = listName
    ? `set targetList to list "${listName.replace(/"/g, '\\"')}"`
    : `set targetList to default list`;

  const dueLine = dueDate
    ? `set due date of newReminder to date "${dueDate}"`
    : "";

  const notesLine = notes
    ? `set body of newReminder to "${notes.replace(/"/g, '\\"')}"`
    : "";

  const script = `
tell application "Reminders"
  ${listFilter}
  set newReminder to make new reminder at end of reminders of targetList with properties {name:"${name.replace(/"/g, '\\"')}"}
  ${dueLine}
  ${notesLine}
end tell
return "ok"
  `.trim();

  await runAppleScript(script);
  return true;
}

/**
 * List reminder lists
 */
async function listReminderLists() {
  const script = `
set output to ""
tell application "Reminders"
  repeat with l in every list
    set output to output & name of l & "\\n"
  end repeat
end tell
return output
  `.trim();

  try {
    const raw = await runAppleScript(script);
    return raw.split("\\n").filter(Boolean);
  } catch {
    return [];
  }
}

// ─── Mail ────────────────────────────────────────────────

/**
 * Compose a new email in Mail.app (opens draft)
 */
async function composeMail({ to, subject, body }) {
  const script = `
tell application "Mail"
  set newMessage to make new outgoing message with properties {subject:"${subject.replace(/"/g, '\\"')}", content:"${body.replace(/"/g, '\\"').replace(/\n/g, '\\n')}", visible:true}
  tell newMessage
    make new to recipient at end of to recipients with properties {address:"${to.replace(/"/g, '\\"')}"}
  end tell
  activate
end tell
return "ok"
  `.trim();

  await runAppleScript(script);
  return true;
}

/**
 * Get recent unread emails
 */
async function getUnreadEmails(limit = 10) {
  const script = `
set output to ""
tell application "Mail"
  set msgs to (messages of inbox whose read status is false)
  set counter to 0
  repeat with m in msgs
    if counter ≥ ${limit} then exit repeat
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
return output
  `.trim();

  try {
    const raw = await runAppleScript(script);
    if (!raw) return [];
    return raw.split("\\n").filter(Boolean).map((line) => {
      const parts = line.split("||");
      return {
        subject: parts[0] || "",
        sender: parts[1] || "",
        date: parts[2] || "",
        preview: parts[3] || "",
      };
    });
  } catch {
    return [];
  }
}

// ─── Notes ───────────────────────────────────────────────

/**
 * Create a note in Notes.app
 */
async function createNote({ title, body, folder }) {
  const folderLine = folder
    ? `set targetFolder to folder "${folder.replace(/"/g, '\\"')}"`
    : `set targetFolder to default account`;

  const script = `
tell application "Notes"
  tell ${folder ? "targetFolder" : "default account"}
    make new note with properties {name:"${title.replace(/"/g, '\\"')}", body:"${body.replace(/"/g, '\\"').replace(/\n/g, '<br>')}"}
  end tell
end tell
return "ok"
  `.trim();

  await runAppleScript(script);
  return true;
}

// ─── Exports ─────────────────────────────────────────────
module.exports = {
  getCalendarEvents,
  createCalendarEvent,
  listCalendars,
  getReminders,
  createReminder,
  listReminderLists,
  composeMail,
  getUnreadEmails,
  createNote,
};
