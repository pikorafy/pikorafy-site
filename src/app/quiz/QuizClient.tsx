"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Need = "writing" | "coding" | "design" | "research" | "project-management";
type Budget = "free" | "under-20" | "under-50" | "any";
type Skill = "beginner" | "intermediate" | "advanced";
type Priority = "ease" | "power" | "privacy" | "integration";
type TeamSize = "solo" | "small" | "medium" | "large";

interface Answers {
  need: Need | null;
  budget: Budget | null;
  skill: Skill | null;
  priority: Priority | null;
  team: TeamSize | null;
}

interface Recommendation {
  name: string;
  reason: string;
  learnMoreUrl: string;
  tryUrl: string;
}

/* ------------------------------------------------------------------ */
/*  Questions                                                          */
/* ------------------------------------------------------------------ */

const questions = [
  {
    key: "need" as const,
    title: "What do you primarily need help with?",
    options: [
      { value: "writing", label: "Writing", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" },
      { value: "coding", label: "Coding", icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" },
      { value: "design", label: "Design", icon: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" },
      { value: "research", label: "Research", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
      { value: "project-management", label: "Project Management", icon: "M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m-13.5-3v10.5A2.25 2.25 0 008.25 21h7.5A2.25 2.25 0 0018 18.878V9m-13.5 0h13.5" },
    ],
  },
  {
    key: "budget" as const,
    title: "What's your budget?",
    options: [
      { value: "free", label: "Free only", icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" },
      { value: "under-20", label: "Under $20/mo", icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
      { value: "under-50", label: "Under $50/mo", icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" },
      { value: "any", label: "Price doesn't matter", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" },
    ],
  },
  {
    key: "skill" as const,
    title: "How technical are you?",
    options: [
      { value: "beginner", label: "Beginner", icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" },
      { value: "intermediate", label: "Intermediate", icon: "M11.42 15.17l-5.648-3.261A2.076 2.076 0 016.5 10.5h11a2.077 2.077 0 01.728 1.409l-5.648 3.261a1 1 0 01-1.16 0zM12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" },
      { value: "advanced", label: "Advanced", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
    ],
  },
  {
    key: "priority" as const,
    title: "What's most important to you?",
    options: [
      { value: "ease", label: "Ease of use", icon: "M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" },
      { value: "power", label: "Power & features", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a7.723 7.723 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" },
      { value: "privacy", label: "Privacy", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
      { value: "integration", label: "Integration with other tools", icon: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" },
    ],
  },
  {
    key: "team" as const,
    title: "Team size?",
    options: [
      { value: "solo", label: "Just me", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
      { value: "small", label: "2-10 people", icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
      { value: "medium", label: "11-50 people", icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" },
      { value: "large", label: "50+ people", icon: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Recommendation engine                                              */
/* ------------------------------------------------------------------ */

function getRecommendations(a: Answers): Recommendation[] {
  const pool: (Recommendation & { score: number })[] = [
    /* --- Writing / AI chatbots --- */
    {
      name: "Claude",
      reason:
        "Excellent for long-form writing and nuanced research. Claude offers a generous free tier and excels at following complex instructions.",
      learnMoreUrl: "/alternatives/chatgpt",
      tryUrl: "https://claude.ai",
      score: 0,
    },
    {
      name: "ChatGPT",
      reason:
        "The most popular AI assistant with strong writing, coding, and research capabilities. Great plugin ecosystem and GPT Store.",
      learnMoreUrl: "/vs/chatgpt-vs-claude",
      tryUrl: "https://chat.openai.com",
      score: 0,
    },
    {
      name: "Grammarly",
      reason:
        "Purpose-built for writing improvement. Catches grammar, tone, and clarity issues in real time across all your apps.",
      learnMoreUrl: "/alternatives/grammarly",
      tryUrl: "https://www.grammarly.com",
      score: 0,
    },
    /* --- Coding --- */
    {
      name: "Cursor",
      reason:
        "AI-native code editor built for speed. Deep codebase understanding, multi-file edits, and powerful autocomplete for professional developers.",
      learnMoreUrl: "/vs/cursor-vs-github-copilot",
      tryUrl: "https://cursor.sh",
      score: 0,
    },
    {
      name: "GitHub Copilot",
      reason:
        "Seamlessly integrates into VS Code and JetBrains. Reliable code completions backed by OpenAI, with great team management features.",
      learnMoreUrl: "/alternatives/github-copilot",
      tryUrl: "https://github.com/features/copilot",
      score: 0,
    },
    /* --- Design --- */
    {
      name: "Canva",
      reason:
        "Drag-and-drop design tool with thousands of templates. Perfect for non-designers who need professional-looking graphics fast.",
      learnMoreUrl: "/alternatives/canva",
      tryUrl: "https://www.canva.com",
      score: 0,
    },
    {
      name: "Figma",
      reason:
        "Industry-standard collaborative design tool. Best-in-class for UI/UX design with powerful prototyping and developer handoff.",
      learnMoreUrl: "/alternatives/figma",
      tryUrl: "https://www.figma.com",
      score: 0,
    },
    /* --- Research --- */
    {
      name: "Notion",
      reason:
        "All-in-one workspace for notes, docs, wikis, and project management. AI features help summarize and organize your research.",
      learnMoreUrl: "/alternatives/notion",
      tryUrl: "https://www.notion.so",
      score: 0,
    },
    /* --- Project Management --- */
    {
      name: "Linear",
      reason:
        "Fast, keyboard-driven project tracker built for modern teams. Streamlined issue tracking with beautiful design and AI triage.",
      learnMoreUrl: "/alternatives/linear",
      tryUrl: "https://linear.app",
      score: 0,
    },
    {
      name: "Asana",
      reason:
        "Flexible project management with multiple views, automation, and strong integrations. Scales from small teams to enterprise.",
      learnMoreUrl: "/alternatives/asana",
      tryUrl: "https://asana.com",
      score: 0,
    },
    {
      name: "Trello",
      reason:
        "Simple Kanban boards that are easy to set up. Great free tier for solo users and small teams who want visual task management.",
      learnMoreUrl: "/alternatives/trello",
      tryUrl: "https://trello.com",
      score: 0,
    },
    {
      name: "Slack",
      reason:
        "The hub for team communication. Channels, threads, and 2,400+ integrations keep your team connected and productive.",
      learnMoreUrl: "/alternatives/slack",
      tryUrl: "https://slack.com",
      score: 0,
    },
  ];

  // --- Score based on need ---
  const needScores: Record<Need, Record<string, number>> = {
    writing: { Claude: 10, ChatGPT: 8, Grammarly: 9, Notion: 4 },
    coding: { Cursor: 10, "GitHub Copilot": 9, ChatGPT: 5, Claude: 6 },
    design: { Canva: 10, Figma: 9 },
    research: { Claude: 9, ChatGPT: 8, Notion: 7 },
    "project-management": { Linear: 9, Asana: 8, Trello: 7, Notion: 6, Slack: 5 },
  };
  if (a.need) {
    const scores = needScores[a.need] || {};
    for (const t of pool) {
      t.score += scores[t.name] ?? 0;
    }
  }

  // --- Budget ---
  if (a.budget === "free") {
    const freeBoost: Record<string, number> = {
      Claude: 3,
      ChatGPT: 2,
      Canva: 3,
      Trello: 4,
      Notion: 2,
      Figma: 2,
      Grammarly: 2,
    };
    for (const t of pool) t.score += freeBoost[t.name] ?? -1;
  } else if (a.budget === "under-20") {
    const boost: Record<string, number> = {
      ChatGPT: 2,
      Claude: 2,
      "GitHub Copilot": 2,
      Grammarly: 2,
      Trello: 2,
      Canva: 2,
    };
    for (const t of pool) t.score += boost[t.name] ?? 0;
  } else if (a.budget === "under-50" || a.budget === "any") {
    const boost: Record<string, number> = {
      Cursor: 2,
      Linear: 2,
      Asana: 2,
      Figma: 2,
      Notion: 2,
    };
    for (const t of pool) t.score += boost[t.name] ?? 0;
  }

  // --- Skill level ---
  if (a.skill === "beginner") {
    const boost: Record<string, number> = {
      Canva: 3,
      ChatGPT: 2,
      Trello: 3,
      Grammarly: 3,
      Notion: 1,
    };
    for (const t of pool) t.score += boost[t.name] ?? 0;
  } else if (a.skill === "advanced") {
    const boost: Record<string, number> = {
      Cursor: 3,
      Figma: 2,
      Linear: 2,
      Claude: 2,
      "GitHub Copilot": 2,
    };
    for (const t of pool) t.score += boost[t.name] ?? 0;
  }

  // --- Priority ---
  if (a.priority === "ease") {
    const boost: Record<string, number> = {
      Canva: 3,
      ChatGPT: 2,
      Trello: 3,
      Grammarly: 2,
    };
    for (const t of pool) t.score += boost[t.name] ?? 0;
  } else if (a.priority === "power") {
    const boost: Record<string, number> = {
      Cursor: 3,
      Figma: 3,
      Claude: 2,
      Linear: 2,
      Asana: 2,
    };
    for (const t of pool) t.score += boost[t.name] ?? 0;
  } else if (a.priority === "privacy") {
    const boost: Record<string, number> = {
      Claude: 3,
      Notion: 2,
    };
    for (const t of pool) t.score += boost[t.name] ?? 0;
  } else if (a.priority === "integration") {
    const boost: Record<string, number> = {
      Slack: 4,
      "GitHub Copilot": 3,
      Asana: 3,
      Notion: 3,
      ChatGPT: 2,
    };
    for (const t of pool) t.score += boost[t.name] ?? 0;
  }

  // --- Team size ---
  if (a.team === "solo") {
    const boost: Record<string, number> = {
      Claude: 2,
      ChatGPT: 2,
      Cursor: 2,
      Canva: 2,
      Trello: 1,
    };
    for (const t of pool) t.score += boost[t.name] ?? 0;
  } else if (a.team === "large") {
    const boost: Record<string, number> = {
      Asana: 3,
      Slack: 3,
      Figma: 2,
      "GitHub Copilot": 2,
      Linear: 2,
    };
    for (const t of pool) t.score += boost[t.name] ?? 0;
  } else if (a.team === "medium") {
    const boost: Record<string, number> = {
      Linear: 2,
      Slack: 2,
      Asana: 2,
      Figma: 1,
      Notion: 1,
    };
    for (const t of pool) t.score += boost[t.name] ?? 0;
  }

  // Sort descending by score and return top 3 unique
  pool.sort((x, y) => y.score - x.score);
  return pool.slice(0, 3).map(({ score: _s, ...rest }) => rest);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function QuizClient() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    need: null,
    budget: null,
    skill: null,
    priority: null,
    team: null,
  });
  const [fade, setFade] = useState(true);
  const [results, setResults] = useState<Recommendation[] | null>(null);

  // Email capture state
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [emailMsg, setEmailMsg] = useState("");

  const totalSteps = questions.length;
  const progress = results ? 100 : Math.round((step / totalSteps) * 100);

  function selectAnswer(value: string) {
    const q = questions[step];
    const updated = { ...answers, [q.key]: value };
    setAnswers(updated);

    // Animate out then advance
    setFade(false);
    setTimeout(() => {
      if (step < totalSteps - 1) {
        setStep(step + 1);
      } else {
        setResults(getRecommendations(updated as Answers));
      }
      setFade(true);
    }, 250);
  }

  function retake() {
    setFade(false);
    setTimeout(() => {
      setStep(0);
      setAnswers({ need: null, budget: null, skill: null, priority: null, team: null });
      setResults(null);
      setEmail("");
      setEmailStatus("idle");
      setEmailMsg("");
      setFade(true);
    }, 250);
  }

  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailStatus("loading");
    setEmailMsg("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailStatus("success");
        setEmailMsg("Check your inbox for your personalized report!");
        setEmail("");
      } else {
        setEmailStatus("error");
        setEmailMsg(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setEmailStatus("error");
      setEmailMsg("Network error. Please try again.");
    }
  }

  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex rounded-full bg-[#3B82F6]/10 px-4 py-1.5 text-xs font-semibold text-[#3B82F6] mb-4">
            5-question quiz
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Find Your Perfect AI Tool
          </h1>
          <p className="mt-4 text-lg text-[#8b8fa3]">
            Answer a few quick questions and we&apos;ll recommend the best tools for your workflow.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#8b8fa3]">
              {results ? "Complete" : `Question ${step + 1} of ${totalSteps}`}
            </span>
            <span className="text-xs font-medium text-[#8b8fa3]">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#1a1d27] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question / Results area */}
        <div
          className={`transition-all duration-250 ${
            fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {!results ? (
            /* -------- Question Card -------- */
            <div>
              <h2 className="text-xl font-semibold text-[#e4e6eb] mb-6">
                {questions[step].title}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {questions[step].options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => selectAnswer(opt.value)}
                    className="group flex items-center gap-4 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-5 text-left transition-all hover:border-[#3B82F6]/60 hover:bg-[#1e2231] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] transition-colors group-hover:bg-[#3B82F6]/20">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-[#e4e6eb] group-hover:text-white">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* -------- Results -------- */
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#3B82F6]/10 mb-4">
                  <svg
                    className="h-7 w-7 text-[#3B82F6]"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Your Top Recommendations
                </h2>
                <p className="mt-2 text-[#8b8fa3]">
                  Based on your answers, here are the tools we think you&apos;ll love.
                </p>
              </div>

              {/* Recommendation cards */}
              <div className="grid gap-4">
                {results.map((rec, i) => (
                  <div
                    key={rec.name}
                    className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/40"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3B82F6]/10 text-xs font-bold text-[#3B82F6]">
                            {i + 1}
                          </span>
                          <h3 className="text-lg font-semibold text-white">{rec.name}</h3>
                        </div>
                        <p className="text-sm text-[#8b8fa3] leading-relaxed">{rec.reason}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link
                        href={rec.learnMoreUrl}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a2e3a] px-4 py-2 text-sm font-medium text-[#e4e6eb] transition-colors hover:border-[#3B82F6]/50 hover:text-[#3B82F6]"
                      >
                        Learn More
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </Link>
                      <a
                        href={rec.tryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
                      >
                        Try It Free
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Email capture */}
              <div className="mt-10 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 text-center">
                <h3 className="text-lg font-semibold text-white">
                  Get your full personalized report
                </h3>
                <p className="mt-2 text-sm text-[#8b8fa3]">
                  We&apos;ll send a detailed breakdown with pricing, pros/cons, and setup guides for each tool.
                </p>
                <form onSubmit={handleEmailSubmit} className="mt-5 flex gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={emailStatus === "loading" || emailStatus === "success"}
                    className="flex-1 rounded-lg border border-[#2a2e3a] bg-[#0f1117] px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={emailStatus === "loading" || emailStatus === "success"}
                    className="rounded-lg bg-[#3B82F6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2563EB] disabled:opacity-50"
                  >
                    {emailStatus === "loading"
                      ? "Sending..."
                      : emailStatus === "success"
                        ? "Sent!"
                        : "Send Report"}
                  </button>
                </form>
                {emailMsg && (
                  <p
                    className={`mt-3 text-sm ${
                      emailStatus === "success" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {emailMsg}
                  </p>
                )}
              </div>

              {/* Retake */}
              <div className="mt-8 text-center">
                <button
                  onClick={retake}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#2a2e3a] px-5 py-2.5 text-sm font-medium text-[#8b8fa3] transition-colors hover:border-[#3B82F6]/50 hover:text-white"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                    />
                  </svg>
                  Retake Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
