export const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "Small daily improvements are the key to staggering long-term results.",
  "You don't have to be extreme, just consistent.",
  "The pain of discipline weighs ounces; the pain of regret weighs tons.",
  "Every hour you put in today is an hour your future self doesn't have to fight for.",
  "Progress, not perfection. Show up today, even if it's not your best day.",
  "CAT rewards consistency far more than it rewards talent.",
  "You're not behind. You're exactly where your effort has placed you — keep adding to it.",
  "One focused hour beats three distracted ones. Protect your study blocks.",
  "The version of you that gets into IIM is built in ordinary evenings like this one.",
  "Nobody sees the 6:20 AM study sessions. That's exactly why they matter.",
  "Streaks are built one unremarkable, ordinary day at a time.",
]

export function quoteForDate(dateStr: string) {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) % 1000000
  }
  return QUOTES[hash % QUOTES.length]
}