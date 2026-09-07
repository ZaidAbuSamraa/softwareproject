// One-off script: seed realistic sample chat messages into Supabase's
// `messages` table (the real backend for company<->trainer and
// trainer<->student chat — see frontend/src/utils/chatService.js).
const SUPABASE_URL = "https://dycchslrqbnpgfpjdtgo.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5Y2Noc2xycWJucGdmcGpkdGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTU5OTEsImV4cCI6MjEwMTk3MTk5MX0.dJnpAJSkEL1UVVw9Tt7da_YmmyZUFrQ_euxQRCm34bE";

const IDS = {
  company: 57, // MedTech Solutions
  trainer: 41, // Suhail Barghouti
  salma: 67, // 100% match
  yousef: 68, // 68% match
  adam: 69, // 26% match
  lina: 70, // 23% match
};

const baseTime = new Date("2026-09-07T09:00:00Z").getTime();
let minuteOffset = 0;
function nextTimestamp() {
  const ts = new Date(baseTime + minuteOffset * 60000).toISOString();
  minuteOffset += 3;
  return ts;
}

function conversation(pairs) {
  return pairs.map(([sender_id, receiver_id, message]) => ({
    sender_id,
    receiver_id,
    message,
    read: true,
    created_at: nextTimestamp(),
  }));
}

const rows = [
  ...conversation([
    [IDS.company, IDS.trainer, "Hi Suhail, welcome aboard as trainer for the Frontend Developer Intern position. Let me know if you need anything to get started."],
    [IDS.trainer, IDS.company, "Thanks! I've gone through the applications, we have a few strong frontend profiles this round."],
    [IDS.company, IDS.trainer, "Great to hear. Can you set up interviews with the top candidates this week?"],
    [IDS.trainer, IDS.company, "On it, I'll start with the highest match and work down the list."],
  ]),
  ...conversation([
    [IDS.trainer, IDS.salma, "Hi Salma, thanks for applying to the Frontend Developer Intern position. Your profile looks like a great fit."],
    [IDS.salma, IDS.trainer, "Thank you! I'm really excited about this opportunity."],
    [IDS.trainer, IDS.salma, "Are you available for a quick interview this Thursday at 11 AM?"],
    [IDS.salma, IDS.trainer, "Yes, that works perfectly for me."],
  ]),
  ...conversation([
    [IDS.trainer, IDS.yousef, "Hi Yousef, thanks for your application. Could you tell me a bit more about your experience with React?"],
    [IDS.yousef, IDS.trainer, "Sure! I've built a couple of small React projects during coursework, mainly using hooks and component state."],
    [IDS.trainer, IDS.yousef, "Sounds good, I'll be in touch soon about next steps."],
  ]),
  ...conversation([
    [IDS.trainer, IDS.adam, "Hi Adam, thanks for applying. I noticed your background is more backend-focused, are you comfortable picking up frontend work?"],
    [IDS.adam, IDS.trainer, "Yes, I'm willing to learn, I've done a bit of HTML and CSS before and I'm eager to grow into frontend."],
  ]),
  ...conversation([
    [IDS.trainer, IDS.lina, "Hi Lina, thank you for your interest in the Frontend Developer Intern role."],
    [IDS.lina, IDS.trainer, "Thank you for considering my application!"],
    [IDS.trainer, IDS.lina, "We'll review all applications and get back to you soon."],
  ]),
];

async function main() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(rows),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("Insert failed:", res.status, text);
    process.exit(1);
  }
  const inserted = JSON.parse(text);
  console.log(`Inserted ${inserted.length} messages across 5 conversations.`);
}

main();
