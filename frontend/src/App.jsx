import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import PointerGlow from "./components/PointerGlow";
import MagneticButton from "./components/MagneticButton";
import DocumentAnimation from "./components/DocumentAnimation";
import heroHandsImage from "./assets/hero-hands.avif";
import { globalStyles } from "./styles/global";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const css = globalStyles;
// ─── API ──────────────────────────────────────────────────────────────────────
async function callAnalyzeAPI({ idea, location, scale, mode, email }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        idea,
        location,
        scale,
        mode,
        email: email || null,
      }),
    });
    clearTimeout(timer);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Backend error (${response.status})`);
    }
    return response.json();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function fetchReportAPI(reportId) {
  const response = await fetch(
    `${API_BASE}/api/report/${encodeURIComponent(reportId)}`,
  );
  if (!response.ok) throw new Error("Report not found");
  return response.json();
}

async function fetchReportsAPI() {
  const response = await fetch(`${API_BASE}/api/reports`);
  if (!response.ok) throw new Error("Failed to load reports");
  return response.json();
}

async function fetchWorkspaceAPI(reportId) {
  const response = await fetch(
    `${API_BASE}/api/report/${encodeURIComponent(reportId)}/workspace`,
  );
  if (!response.ok) throw new Error("Failed to load workspace");
  return response.json();
}

async function updateTaskStatusAPI(reportId, taskKey, status) {
  const response = await fetch(
    `${API_BASE}/api/report/${encodeURIComponent(reportId)}/tasks/${encodeURIComponent(taskKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  if (!response.ok) throw new Error("Failed to update task");
  return response.json();
}

async function fetchDashboardSummaryAPI() {
  const response = await fetch(`${API_BASE}/api/dashboard/summary`);
  if (!response.ok) throw new Error("Failed to load dashboard summary");
  return response.json();
}

async function uploadDocumentAPI(reportId, docKey, file, note) {
  const formData = new FormData();
  formData.append("file", file);
  if (note) formData.append("note", note);
  const response = await fetch(
    `${API_BASE}/api/report/${encodeURIComponent(reportId)}/documents/${encodeURIComponent(docKey)}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload document");
  }
  return response.json();
}

async function sendReportChatMessageAPI(reportId, message, history) {
  const response = await fetch(
    `${API_BASE}/api/report/${encodeURIComponent(reportId)}/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to send chat message");
  }
  return response.json();
}

function dedupeReports(reports) {
  const seen = new Map();
  (reports || []).forEach((report) => {
    if (!report?.report_id) return;
    seen.set(report.report_id, report);
  });
  return Array.from(seen.values());
}

function normalizeReport(report) {
  if (!report) return null;
  const reportId = String(report.report_id || report.id || "").toUpperCase();
  if (!reportId) return null;
  const createdAt =
    report.created_at ||
    report.saved_at ||
    report.generated_at ||
    report.timestamp ||
    null;
  return {
    ...report,
    report_id: reportId,
    id: report.id || reportId,
    business_name: report.business_name || report.idea || report.id || reportId,
    location: report.location || report.state || report.input?.location || "",
    scale: report.scale || report.input?.scale || "",
    mode: report.mode || report.input?.mode || "both",
    created_at: createdAt,
    saved_at: report.saved_at || createdAt,
  };
}

function mergeReports(...reportSets) {
  return dedupeReports(
    reportSets.flat().map(normalizeReport).filter(Boolean),
  ).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

function formatReportMeta(report) {
  const parts = [];
  if (report?.location) parts.push(report.location);
  if (report?.scale) parts.push(formatScaleLabel(report.scale));
  return parts.join(" · ");
}

function formatScaleLabel(scale) {
  return (
    {
      solo: "Solo",
      startup: "Startup",
      sme: "SME",
      enterprise: "Enterprise",
    }[scale] ||
    scale ||
    "Unknown"
  );
}

function scoreColor(score, type) {
  if (type === "risk") {
    if (score <= 30)
      return { c: "#4CAF7D", bg: "rgba(76,175,125,0.12)", label: "Low Risk" };
    if (score <= 60)
      return {
        c: "#E09B40",
        bg: "rgba(224,155,64,0.12)",
        label: "Medium Risk",
      };
    return { c: "#E05252", bg: "rgba(224,82,82,0.12)", label: "High Risk" };
  }
  if (type === "complexity") {
    if (score <= 30)
      return { c: "#4CAF7D", bg: "rgba(76,175,125,0.12)", label: "Simple" };
    if (score <= 60)
      return { c: "#6BA3D6", bg: "rgba(107,163,214,0.12)", label: "Moderate" };
    return { c: "#E09B40", bg: "rgba(224,155,64,0.12)", label: "Complex" };
  }
  if (score >= 70)
    return { c: "#4CAF7D", bg: "rgba(76,175,125,0.12)", label: "Viable" };
  if (score >= 45)
    return { c: "#E09B40", bg: "rgba(224,155,64,0.12)", label: "Moderate" };
  return { c: "#E05252", bg: "rgba(224,82,82,0.12)", label: "Challenging" };
}

const LICENSE_DOCS = {
  gst: [
    "PAN Card of proprietor/company",
    "Aadhaar Card",
    "Bank account statement / cancelled cheque",
    "Proof of business address (rent agreement or utility bill)",
    "Digital signature (for companies/LLPs)",
    "Incorporation certificate (for companies)",
  ],
  fssai: [
    "Photo ID proof (Aadhaar/PAN)",
    "Proof of possession of premises",
    "List of food products to be handled",
    "Food safety management plan",
    "Water test report (for packaged water)",
    "NOC from local municipality/panchayat",
  ],
  udyam: [
    "Aadhaar of proprietor/partner/director",
    "PAN of business entity",
    "Bank account details",
    "NIC activity code",
  ],
  shop: [
    "Proof of address of business premises",
    "PAN of owner",
    "Aadhaar of owner",
    "Passport-size photograph",
    "Details of employees",
  ],
  trade: [
    "Ownership or tenancy document",
    "Site plan / building layout",
    "NOC from fire department",
    "PAN card",
    "Identity proof of owner",
  ],
  iec: [
    "PAN card of entity",
    "Aadhaar/voter ID/passport of director",
    "Bank certificate or cancelled cheque",
    "Digital photograph",
    "Address proof of business",
  ],
  default: [
    "PAN Card",
    "Aadhaar Card",
    "Proof of business address",
    "Bank account details (cancelled cheque)",
    "Passport-size photographs (2 copies)",
    "Business registration certificate",
  ],
};
function getDocuments(name) {
  const n = name.toLowerCase();
  for (const [k, docs] of Object.entries(LICENSE_DOCS)) {
    if (k !== "default" && n.includes(k)) return docs;
  }
  return LICENSE_DOCS.default;
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function KpiCard({ label, score, note, type }) {
  const { c, bg, label: badge } = scoreColor(score, type);
  return (
    <div className="le-kpi-card">
      <div className="le-kpi-label">{label}</div>
      <div className="le-kpi-score" style={{ color: c }}>
        {score}
      </div>
      <div className="le-kpi-badge" style={{ background: bg, color: c }}>
        {badge}
      </div>
      <div className="le-kpi-bar">
        <div
          className="le-kpi-fill"
          style={{ width: `${Math.min(score, 100)}%`, background: c }}
        />
      </div>
      {note && <div className="le-kpi-note">{note}</div>}
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  count,
  children,
  open: def = false,
}) {
  const [open, setOpen] = useState(def);
  return (
    <div className="le-sec">
      <div
        className={`le-sec-head${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="le-sec-icon">{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="le-sec-title">{title}</div>
          {subtitle && <div className="le-sec-sub">{subtitle}</div>}
        </div>
        {count != null && <span className="le-sec-count">{count}</span>}
        <span
          className="le-sec-chev"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          ▼
        </span>
      </div>
      {open && <div className="le-sec-body">{children}</div>}
    </div>
  );
}

// ─── FEATURE: TOAST ──────────────────────────────────────────────────────────
function Toast({ message, show }) {
  return <div className={`le-toast${show ? " show" : ""}`}>{message}</div>;
}

function ResultsModal({ children }) {
  return createPortal(children, document.body);
}

function buildReportChatPrompts({
  category,
  licenses,
  risks,
  actionPlan,
  location,
}) {
  const prompts = [];
  const topLicense = licenses?.[0]?.name;
  const criticalLicense = licenses?.find(
    (item) => (item.priority || "").toLowerCase() === "critical",
  )?.name;
  const topRisk = risks?.[0]?.title;
  const firstAction = actionPlan?.[0]?.title;

  if (criticalLicense)
    prompts.push(`Why is ${criticalLicense} important for this business?`);
  if (topLicense && topLicense !== criticalLicense)
    prompts.push(`What documents do I need for ${topLicense}?`);
  if (topRisk) prompts.push(`How serious is the risk around "${topRisk}"?`);
  if (firstAction) prompts.push(`How should I start with "${firstAction}"?`);
  if (category)
    prompts.push(
      `What compliance mistakes are common for ${category} businesses in ${location || "this location"}?`,
    );
  prompts.push("What should I do in the next 30 days?");

  return Array.from(new Set(prompts.filter(Boolean))).slice(0, 4);
}

function ReportChat({
  reportId,
  businessName,
  location,
  category,
  licenses,
  risks,
  actionPlan,
  showToast,
  disabledReason = "",
}) {
  const starterPrompts = buildReportChatPrompts({
    category,
    licenses,
    risks,
    actionPlan,
    location,
  });
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Ask anything about ${businessName || "this report"}. I can explain licenses, documents, risks, timelines, and next steps for ${location || "your market"} in the ${category || "business"} category.`,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const endRef = useRef(null);
  const hasStartedChatRef = useRef(false);

  useEffect(() => {
    if (!hasStartedChatRef.current) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, chatSending]);

  const handleSend = async (draft) => {
    const text = (draft ?? chatInput).trim();
    if (!text || chatSending) return;
    if (disabledReason) {
      setChatError(disabledReason);
      showToast?.(disabledReason);
      return;
    }

    hasStartedChatRef.current = true;
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: "user", content: text }]);
    setChatInput("");
    setChatError("");
    setChatSending(true);

    try {
      const payload = await sendReportChatMessageAPI(reportId, text, history);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: payload.answer },
      ]);
    } catch (error) {
      const msg = error.message || "Chat failed";
      setChatError(msg);
      showToast?.(msg);
    } finally {
      setChatSending(false);
    }
  };

  return (
    <div className="le-chat-card">
      <div className="le-chat-head">
        <div>
          <div className="le-chat-eyebrow">Report assistant</div>
          <h3>Dig Deeper</h3>
          <p>
            Have a real conversation about this report instead of launching
            another full analysis run.
          </p>
        </div>
        <div className="le-chat-meta">
          <span>{location || "India"}</span>
          <span>{category || "Compliance"}</span>
        </div>
      </div>

      <div className="le-chat-prompts">
        {starterPrompts.map((prompt) => (
          <button
            key={prompt}
            className="le-chat-prompt"
            onClick={() => handleSend(prompt)}
            disabled={chatSending || !!disabledReason}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="le-chat-shell">
        <div className="le-chat-orb" />
        <div className="le-chat-messages">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`le-chat-row ${message.role === "user" ? "user" : "assistant"}`}
            >
              <div className="le-chat-avatar">
                {message.role === "user" ? "You" : "AI"}
              </div>
              <div className="le-chat-bubble">
                <div className="le-chat-role">
                  {message.role === "user" ? "Founder" : "LegalEase Counsel"}
                </div>
                <div className="le-chat-content">{message.content}</div>
              </div>
            </div>
          ))}
          {chatSending && (
            <div className="le-chat-row assistant">
              <div className="le-chat-avatar">AI</div>
              <div className="le-chat-bubble le-chat-thinking">
                <div className="le-chat-role">LegalEase Counsel</div>
                <div className="le-chat-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="le-chat-compose">
          <textarea
            className="le-chat-input"
            placeholder="Ask about licenses, penalties, document prep, timeline, or your safest next move..."
            value={chatInput}
            disabled={!!disabledReason}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            className="le-chat-send"
            onClick={() => handleSend()}
            disabled={
              !!disabledReason || chatSending || chatInput.trim().length < 2
            }
          >
            {chatSending ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>

      {(chatError || disabledReason) && (
        <div className="le-chat-error">{chatError || disabledReason}</div>
      )}
      <div className="le-chat-footnote">
        Answers stay grounded in this report and help translate it into
        practical next steps.
      </div>
    </div>
  );
}

// ─── FEATURE: SMART SEARCH ───────────────────────────────────────────────────
function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="le-search-highlight">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── FEATURE: EXPORT TO CSV ──────────────────────────────────────────────────
function exportToCSV(data) {
  const rows = [
    ["Section", "Item", "Detail", "Cost/Penalty", "Priority/Severity"],
  ];
  (data.licenses || []).forEach((l) =>
    rows.push([
      "License",
      l.name,
      l.description?.slice(0, 80),
      l.estimated_cost,
      l.priority,
    ]),
  );
  (data.risks || []).forEach((r) =>
    rows.push([
      "Risk",
      r.title,
      r.description?.slice(0, 80),
      r.penalty,
      r.severity,
    ]),
  );
  (data.action_plan || []).forEach((a) =>
    rows.push([
      "Action",
      `Step ${a.step}: ${a.title}`,
      a.description?.slice(0, 80),
      a.cost || "—",
      a.timeframe,
    ]),
  );
  (data.cost_estimates || []).forEach((c) =>
    rows.push(["Cost", c.item, c.notes?.slice(0, 80), c.range, "—"]),
  );
  const csv = rows
    .map((r) =>
      r.map((c) => `"${(c || "").toString().replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `LegalEase_Report_${data.report_id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToExcel(data) {
  const a = document.createElement("a");
  a.href = `${API_BASE}/api/report/${encodeURIComponent(data.report_id)}/excel`;
  a.download = `LegalEase_Report_${data.report_id}.xlsx`;
  a.click();
}

// ─── FEATURE: TIMELINE VIEW ──────────────────────────────────────────────────
function TimelineView({ actionPlan }) {
  const catC = {
    legal: "#6BA3D6",
    financial: "#4CAF7D",
    operational: "#E09B40",
    compliance: "#E05252",
  };
  const catBg = {
    legal: "rgba(107,163,214,0.12)",
    financial: "rgba(76,175,125,0.12)",
    operational: "rgba(224,155,64,0.12)",
    compliance: "rgba(224,82,82,0.12)",
  };
  const grouped = {};
  (actionPlan || []).forEach((step) => {
    const week = step.timeframe || "General";
    if (!grouped[week]) grouped[week] = [];
    grouped[week].push(step);
  });
  return (
    <div className="le-timeline">
      {Object.entries(grouped).map(([week, steps]) => (
        <div key={week} className="le-timeline-week">
          <div className="le-timeline-week-label">📅 {week}</div>
          {steps.map((step, i) => {
            const c = catC[step.category] || "#C9A84C";
            const bg = catBg[step.category] || "rgba(201,168,76,0.10)";
            return (
              <div key={i} className="le-timeline-item">
                <div className="le-timeline-dot" style={{ background: c }} />
                <div className="le-timeline-title">
                  {step.step}. {step.title}
                </div>
                <span
                  className="le-timeline-cat"
                  style={{ background: bg, color: c }}
                >
                  {step.category}
                </span>
                {step.cost && (
                  <span className="le-timeline-cost">{step.cost}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── FEATURE: COST CALCULATOR ────────────────────────────────────────────────
function CostCalculator({ data }) {
  const licCount = data.licenses?.length || 0;
  const [caFee, setCaFee] = useState(3000);
  const [govtFee, setGovtFee] = useState(licCount * 500);
  const [extraCompliance, setExtraCompliance] = useState(5000);
  const [caPerReg, setCaPerReg] = useState(2000);

  const govtTotal = govtFee;
  const caTotal = licCount * caPerReg;
  const compTotal = extraCompliance;
  const consultTotal = caFee;
  const grandTotal = govtTotal + caTotal + compTotal + consultTotal;

  const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="le-calc-wrap">
      <div className="le-calc-title">Interactive Cost Estimator</div>
      <div className="le-calc-row">
        <div className="le-calc-label">Avg. Govt. fees per license</div>
        <input
          type="range"
          className="le-calc-slider"
          min={0}
          max={5000}
          step={100}
          value={Math.round(govtFee / Math.max(licCount, 1))}
          onChange={(e) => setGovtFee(+e.target.value * Math.max(licCount, 1))}
        />
        <div className="le-calc-val">
          {fmt(Math.round(govtFee / Math.max(licCount, 1)))} each
        </div>
      </div>
      <div className="le-calc-row">
        <div className="le-calc-label">CA fee per registration</div>
        <input
          type="range"
          className="le-calc-slider"
          min={500}
          max={10000}
          step={500}
          value={caPerReg}
          onChange={(e) => setCaPerReg(+e.target.value)}
        />
        <div className="le-calc-val">{fmt(caPerReg)}</div>
      </div>
      <div className="le-calc-row">
        <div className="le-calc-label">Ongoing compliance / month</div>
        <input
          type="range"
          className="le-calc-slider"
          min={0}
          max={20000}
          step={1000}
          value={extraCompliance}
          onChange={(e) => setExtraCompliance(+e.target.value)}
        />
        <div className="le-calc-val">{fmt(extraCompliance)}</div>
      </div>
      <div className="le-calc-row">
        <div className="le-calc-label">Initial consultation fee</div>
        <input
          type="range"
          className="le-calc-slider"
          min={0}
          max={15000}
          step={500}
          value={caFee}
          onChange={(e) => setCaFee(+e.target.value)}
        />
        <div className="le-calc-val">{fmt(caFee)}</div>
      </div>
      <div className="le-calc-breakdown">
        {[
          ["Govt. fees total", fmt(govtTotal)],
          ["CA registration fees", fmt(caTotal)],
          ["Monthly compliance", fmt(compTotal)],
          ["Consultation", fmt(consultTotal)],
        ].map(([k, v]) => (
          <div key={k} className="le-calc-breakdown-item">
            <span>{k}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <div className="le-calc-total">
        <div>
          <div className="le-calc-total-label">Estimated First-Year Cost</div>
          <div
            style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}
          >
            Govt. fees + CA + 12 months compliance
          </div>
        </div>
        <div className="le-calc-total-val">
          {fmt(govtTotal + caTotal + compTotal * 12 + consultTotal)}
        </div>
      </div>
    </div>
  );
}

// ─── FEATURE: LICENSE APPLY ASSISTANT ────────────────────────────────────────
const LICENSE_GUIDES = {
  gst: {
    name: "GST Registration",
    steps: [
      {
        title: "Gather Documents",
        desc: "Collect PAN, Aadhaar, proof of business address, bank account details, and incorporation certificate if applicable.",
        docs: [
          "PAN Card",
          "Aadhaar Card",
          "Address proof",
          "Bank statement",
          "Incorporation cert (if company)",
        ],
      },
      {
        title: "Register on GST Portal",
        desc: "Visit the official GST portal and complete the New Registration form under 'Services → Registration'.",
        link: "https://www.gst.gov.in/",
        linkText: "Open GST Portal →",
      },
      {
        title: "Submit & Track",
        desc: "Submit your application and note your ARN number. Approval typically takes 7–10 working days. Track under 'Services → Track Application Status'.",
        docs: ["ARN number", "Email confirmation"],
      },
    ],
  },
  fssai: {
    name: "FSSAI License",
    steps: [
      {
        title: "Determine License Type",
        desc: "Choose between Basic Registration (turnover < ₹12L), State License (₹12L–20Cr), or Central License (> ₹20Cr) based on your business size.",
        docs: [],
      },
      {
        title: "Apply on FoSCoS Portal",
        desc: "Register and apply on the Food Safety Compliance System. Upload all required documents electronically.",
        link: "https://foscos.fssai.gov.in/",
        linkText: "Open FoSCoS Portal →",
      },
      {
        title: "Inspection & Approval",
        desc: "A food safety officer may inspect your premises. Once approved, you'll receive your FSSAI number. Display it prominently at your establishment.",
        docs: ["FSSAI certificate", "License number"],
      },
    ],
  },
  udyam: {
    name: "Udyam Registration (MSME)",
    steps: [
      {
        title: "Check Eligibility",
        desc: "Your business must be a Micro, Small, or Medium enterprise. Manufacturing: investment < ₹50Cr, turnover < ₹250Cr. Service: investment < ₹10Cr, turnover < ₹50Cr.",
        docs: [],
      },
      {
        title: "Register Online",
        desc: "Udyam registration is completely free and online. You only need an Aadhaar number — no documents to upload.",
        link: "https://udyamregistration.gov.in/",
        linkText: "Open Udyam Portal →",
      },
      {
        title: "Get Certificate",
        desc: "After submission, you'll get an instant Udyam Registration Number and certificate. This never expires and needs no renewal.",
        docs: ["Udyam certificate", "URN number"],
      },
    ],
  },
  default: {
    name: "License Application",
    steps: [
      {
        title: "Gather Documents",
        desc: "Collect all required identity proofs, address proofs, and business registration documents. Make digital copies of everything.",
        docs: [
          "PAN Card",
          "Aadhaar Card",
          "Address proof",
          "Business registration",
          "Photographs",
        ],
      },
      {
        title: "Submit Application",
        desc: "Visit the relevant authority's website or office to submit your application. Pay the applicable government fee.",
        docs: [],
      },
      {
        title: "Follow Up & Collect",
        desc: "Track your application status and respond promptly to any queries. Collect your license and keep copies stored safely.",
        docs: [],
      },
    ],
  },
};

function LicenseAssistant({ licenses, onClose }) {
  const [selectedLic, setSelectedLic] = useState(null);
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState({});

  const getGuide = (name) => {
    const n = (name || "").toLowerCase();
    for (const [k, g] of Object.entries(LICENSE_GUIDES)) {
      if (k !== "default" && n.includes(k)) return g;
    }
    return { ...LICENSE_GUIDES.default, name };
  };

  if (!selectedLic)
    return (
      <div className="le-assistant-wrap">
        <div style={{ marginBottom: "1.5rem" }}>
          <div className="le-section-label">
            Select a license to get started
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8 }}>
            Step-by-step guidance to apply for each required license, including
            document checklists and portal links.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(licenses || []).map((lic, i) => {
            const guide = getGuide(lic.name);
            return (
              <div
                key={i}
                className="le-timeline-item"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSelectedLic(lic);
                  setStep(0);
                  setChecked({});
                }}
              >
                <div
                  className="le-timeline-dot"
                  style={{
                    background:
                      lic.priority === "critical"
                        ? "var(--red)"
                        : lic.priority === "high"
                          ? "var(--amber)"
                          : "var(--blue)",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div className="le-timeline-title">{lic.name}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {guide.steps.length} steps · {lic.time_to_approve}
                  </div>
                </div>
                <span className={`le-priority-badge priority-${lic.priority}`}>
                  {lic.priority}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--gold)",
                    fontWeight: 600,
                    marginLeft: 8,
                  }}
                >
                  Start →
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );

  const guide = getGuide(selectedLic.name);
  const currentStep = guide.steps[step];
  const stepKeys = checked[step]
    ? Object.keys(checked[step]).filter((k) => checked[step][k])
    : [];

  return (
    <div className="le-assistant-wrap">
      <button
        onClick={() => setSelectedLic(null)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          fontSize: 13,
          marginBottom: "1.25rem",
          fontFamily: "'DM Sans',sans-serif",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ← Back to all licenses
      </button>
      <div className="le-assistant-progress">
        {guide.steps.map((s, i) => (
          <div
            key={i}
            className={`le-assistant-step${i === step ? " active" : i < step ? " done" : ""}`}
            onClick={() => setStep(i)}
            style={{ cursor: "pointer" }}
          >
            {i < step ? "✓ " : `${i + 1}. `}
            {s.title.split(" ")[0]}
          </div>
        ))}
      </div>
      <div className="le-assistant-card">
        <h3>{currentStep.title}</h3>
        <p>{currentStep.desc}</p>
        {currentStep.docs?.length > 0 && (
          <div className="le-assistant-checklist">
            {currentStep.docs.map((doc, i) => {
              const key = `${step}-${i}`;
              const isChecked = checked[step]?.[i];
              return (
                <div
                  key={i}
                  className={`le-assistant-item${isChecked ? " checked" : ""}`}
                  onClick={() =>
                    setChecked((c) => ({
                      ...c,
                      [step]: { ...(c[step] || {}), [i]: !isChecked },
                    }))
                  }
                >
                  <div className="le-assistant-item-box">
                    {isChecked && (
                      <span
                        style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="le-assistant-item-text">{doc}</div>
                </div>
              );
            })}
          </div>
        )}
        {currentStep.link && (
          <a
            href={currentStep.link}
            target="_blank"
            rel="noopener noreferrer"
            className="le-assistant-link"
          >
            🌐 {currentStep.linkText}
          </a>
        )}
        <div className="le-assistant-nav">
          <button
            className="le-btn-ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{ fontSize: 13 }}
          >
            ← Previous
          </button>
          {step < guide.steps.length - 1 ? (
            <button
              className="le-btn-primary"
              onClick={() => setStep((s) => s + 1)}
              style={{ fontSize: 13, padding: "10px 24px" }}
            >
              Next Step →
            </button>
          ) : (
            <button
              className="le-btn-primary"
              style={{
                fontSize: 13,
                padding: "10px 24px",
                background: "linear-gradient(140deg,var(--green),#6DD99A)",
              }}
              onClick={() => setSelectedLic(null)}
            >
              ✓ Complete — Back to List
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FEATURE: COMPARISON MODE ─────────────────────────────────────────────────
function ComparisonView({ reports, onLoad }) {
  const [left, setLeft] = useState(reports[0] || null);
  const [right, setRight] = useState(reports[1] || null);

  if (reports.length < 2)
    return (
      <div className="le-compare-empty">
        <div style={{ fontSize: 32, marginBottom: "1rem" }}>📊</div>
        <div
          style={{
            color: "var(--text-primary)",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Need at least 2 reports to compare
        </div>
        <div>Run more analyses to unlock comparison mode.</div>
      </div>
    );

  const renderCol = (rep, isLeft) => {
    if (!rep)
      return <div className="le-compare-empty">Select a report to compare</div>;
    const f = rep.feasibility || {},
      r = rep.risk || {},
      c = rep.compliance_complexity || {};
    const scores = [
      { label: "Feasibility", score: f.score || 0, type: "feasibility" },
      { label: "Risk", score: r.score || 0, type: "risk" },
      { label: "Complexity", score: c.score || 0, type: "complexity" },
    ];
    return (
      <>
        <div className="le-compare-col-header">
          <div style={{ marginBottom: 6 }}>
            <select
              className="le-meta-select"
              style={{
                background: "transparent",
                border: "none",
                padding: "0",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
              value={rep.report_id}
              onChange={(e) => {
                const r = reports.find((r) => r.report_id === e.target.value);
                if (r) isLeft ? setLeft(r) : setRight(r);
              }}
            >
              {reports.map((r) => (
                <option key={r.report_id} value={r.report_id}>
                  {r.business_name || r.report_id}
                </option>
              ))}
            </select>
          </div>
          <div className="le-compare-col-meta">
            #{rep.report_id} · {rep.category}
          </div>
        </div>
        <div className="le-compare-col-body">
          <div style={{ marginBottom: "1rem" }}>
            {scores.map((s) => {
              const { c: sc } = scoreColor(s.score, s.type);
              return (
                <div key={s.label} className="le-compare-score-row">
                  <div className="le-compare-score-label">{s.label}</div>
                  <div className="le-compare-score-track">
                    <div
                      className="le-compare-score-fill"
                      style={{ width: `${s.score}%`, background: sc }}
                    />
                  </div>
                  <div className="le-compare-score-num" style={{ color: sc }}>
                    {s.score}
                  </div>
                </div>
              );
            })}
          </div>
          {[
            ["Licenses needed", rep.licenses?.length || 0],
            ["Legal risks", rep.risks?.length || 0],
            ["Action steps", rep.action_plan?.length || 0],
            ["Location", rep.location || "—"],
            ["Scale", rep.scale || "—"],
          ].map(([k, v]) => (
            <div key={k} className="le-compare-row">
              <div className="le-compare-key">{k}</div>
              <div className="le-compare-val">{v}</div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div>
      <div
        style={{
          marginBottom: "1rem",
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        Select reports from the dropdowns inside each column to compare them
        side by side.
      </div>
      <div className="le-compare-wrap">
        <div className="le-compare-col">{renderCol(left, true)}</div>
        <div className="le-compare-col">{renderCol(right, false)}</div>
      </div>
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function AnimatedHeroStat({ value, label, delay = 0 }) {
  const [display, setDisplay] = useState(/^\d/.test(value) ? "0" : value);

  useEffect(() => {
    const match = /^(\d+)(.*)$/.exec(value);
    if (!match) {
      setDisplay(value);
      return undefined;
    }

    const target = Number(match[1]);
    const suffix = match[2] || "";
    let frameId = 0;
    let startTime = null;
    let timerId = 0;

    timerId = window.setTimeout(() => {
      const step = (timestamp) => {
        if (startTime == null) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / 1200, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(`${Math.round(target * eased)}${suffix}`);
        if (progress < 1) frameId = window.requestAnimationFrame(step);
      };
      frameId = window.requestAnimationFrame(step);
    }, delay * 1000);

    return () => {
      window.clearTimeout(timerId);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [value, delay]);

  return (
    <motion.div
      className="le-hero-stat"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay, ease: "easeOut" }}
      whileHover={{ y: -4 }}
    >
      <div className="le-hero-stat-num">{display}</div>
      <div className="le-hero-stat-lbl">{label}</div>
    </motion.div>
  );
}

function LandingPage({ onStart }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleHeroMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
    setMousePos({ x, y });
  };
  const handleHeroMouseLeave = () => setMousePos({ x: 0, y: 0 });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      style={{ background: "var(--ink)" }}
    >
      <div
        className="le-hero"
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
      >
        <div className="le-hero-grid" />
        <div className="le-hero-glow" />
        <div className="le-hero-vignette" />
        <div className="le-hero-beam" />
        <motion.div className="le-hero-image-wrap" aria-hidden="true">
          <img className="le-hero-image" src={heroHandsImage} alt="" />
        </motion.div>
        <motion.div
          style={{
            transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
            transition: "transform 0.4s ease-out",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          >
            <div className="le-hero-content">
              <div className="le-hero-eyebrow">
                <span className="le-hero-eyebrow-dot" />
                AI-Powered Legal Intelligence for India
              </div>
              <h1>
                Start Smart.
                <br />
                <em>Stay Legal.</em>
              </h1>
              <p className="le-hero-sub">
                From business idea to complete compliance roadmap — licenses,
                risks, penalties, action plan, and a branded PDF. In under 60
                seconds.
              </p>
              <div className="le-hero-actions">
                <MagneticButton
                  className="le-btn-primary"
                  onClick={onStart}
                  style={{ fontSize: 16, padding: "16px 48px" }}
                >
                  Analyze My Business Free →
                </MagneticButton>
                <MagneticButton className="le-btn-ghost" onClick={onStart}>
                  See a Sample Report
                </MagneticButton>
              </div>
              <div style={{ marginTop: "2.5rem" }}>
                <span className="le-pipeline-badge">
                  ⚙ Python Rule Engine · Gemini AI · ReportLab PDF · SQLite
                </span>
              </div>
            </div>
            <div className="le-hero-stats">
              {[
                ["50+", "License Types"],
                ["28", "States Covered"],
                ["100+", "Laws Referenced"],
                ["PDF", "Auto-Generated"],
                ["60s", "Avg. Time"],
              ].map(([n, l], index) => (
                <AnimatedHeroStat
                  key={l}
                  value={n}
                  label={l}
                  delay={0.42 + index * 0.08}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <DocumentAnimation />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="le-section-mid">
          <div className="le-container">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4rem",
                alignItems: "center",
              }}
            >
              <div>
                <div className="le-section-label">What You Get</div>
                <h2 className="le-section-h2">
                  A full legal report,
                  <br />
                  <em>not just a checklist</em>
                </h2>
                <p className="le-section-sub">
                  Every analysis covers the complete legal picture — from
                  registrations to exact penalties to what happens if you skip
                  them.
                </p>
                <div
                  style={{
                    marginTop: "2.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {[
                    [
                      "#C9A84C",
                      "Required Licenses with documents, costs, timelines, apply links",
                    ],
                    [
                      "#6BA3D6",
                      "Risk scores across 5 dimensions — Python engine, not AI",
                    ],
                    [
                      "#E05252",
                      "Legal risks with exact penalty amounts from Indian Acts",
                    ],
                    [
                      "#4CAF7D",
                      "Step-by-step action plan with timeline + cost per step",
                    ],
                    [
                      "#C9A84C",
                      "Non-compliance consequences — what actually happens",
                    ],
                    [
                      "#E09B40",
                      "Realistic cost estimates with interactive calculator",
                    ],
                  ].map(([col, text], i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: col,
                          flexShrink: 0,
                          marginTop: 7,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 14,
                          color: "var(--text-secondary)",
                          lineHeight: 1.7,
                        }}
                      >
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "2.5rem" }}>
                  <MagneticButton className="le-btn-primary" onClick={onStart}>
                    Get My Report →
                  </MagneticButton>
                </div>
              </div>
              <div className="le-preview-grid">
                <div className="le-preview-card">
                  <div className="le-preview-card-title">Licenses Required</div>
                  {[
                    ["#E05252", "GST Registration"],
                    ["#E05252", "FSSAI License"],
                    ["#E09B40", "Udyam (MSME)"],
                    ["#6BA3D6", "Shop & Establishment"],
                  ].map(([c, t]) => (
                    <div key={t} className="le-preview-item">
                      <div
                        className="le-preview-dot"
                        style={{ background: c }}
                      />
                      {t}
                    </div>
                  ))}
                </div>
                <div className="le-preview-card">
                  <div className="le-preview-card-title">Risk Scores</div>
                  {[
                    ["FSSAI / Food Safety", 82, "#E05252"],
                    ["GST Compliance", 55, "#E09B40"],
                    ["Labour Laws", 30, "#4CAF7D"],
                    ["Consumer Protection", 40, "#E09B40"],
                  ].map(([l, s, c]) => (
                    <div
                      key={l}
                      className="le-preview-item"
                      style={{ flexDirection: "column", gap: 4 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                          fontSize: 11,
                        }}
                      >
                        <span>{l}</span>
                        <span style={{ color: c, fontWeight: 600 }}>
                          {s}/100
                        </span>
                      </div>
                      <div
                        style={{
                          height: 3,
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: 100,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${s}%`,
                            height: "100%",
                            background: c,
                            borderRadius: 100,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="le-preview-card">
                  <div className="le-preview-card-title">Legal Risks</div>
                  {[
                    ["#E05252", "Operating without FSSAI — Rs. 5L fine"],
                    ["#E09B40", "GST non-registration penalty"],
                    ["#6BA3D6", "No employee contracts"],
                  ].map(([c, t]) => (
                    <div key={t} className="le-preview-item">
                      <div
                        className="le-preview-dot"
                        style={{ background: c }}
                      />
                      {t}
                    </div>
                  ))}
                </div>
                <div className="le-preview-card">
                  <div className="le-preview-card-title">Action Plan</div>
                  {[
                    ["1", "Apply FSSAI", "Week 1"],
                    ["2", "GST Registration", "Week 1"],
                    ["3", "Udyam Registration", "Week 2"],
                  ].map(([n, t, w]) => (
                    <div key={n} className="le-preview-item">
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#C9A84C",
                          color: "#0C0B09",
                          fontSize: 9,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {n}
                      </div>
                      <span style={{ flex: 1 }}>{t}</span>
                      <span style={{ fontSize: 10, color: "#C9A84C" }}>
                        {w}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="le-section-dark">
          <div className="le-container">
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <div className="le-section-label">The Pipeline</div>
              <h2 className="le-section-h2">
                Python does the <em>heavy lifting</em>
              </h2>
              <p className="le-section-sub" style={{ margin: "0 auto" }}>
                Not a simple chatbot. A deterministic rule engine + AI
                enrichment pipeline built in Python + FastAPI.
              </p>
            </div>
            <div className="le-steps-row">
              {[
                [
                  "1",
                  "Category Detection",
                  "Python NLP maps idea to category — food, fintech, edtech, retail, and 12 more",
                ],
                [
                  "2",
                  "License Mapping",
                  "Rule engine cross-refs category + state + scale against 50+ license rules",
                ],
                [
                  "3",
                  "Risk Scoring",
                  "5-dimension risk model scores 0–100 — zero AI, pure Python determinism",
                ],
                [
                  "4",
                  "AI Enrichment",
                  "Gemini writes personalized explanations, exact penalties, and action plan",
                ],
                [
                  "5",
                  "PDF Generation",
                  "ReportLab makes a branded A4 PDF with QR code, saved to server",
                ],
                [
                  "6",
                  "SQLite Storage",
                  "Every report stored — retrievable by ID anytime",
                ],
              ].map(([n, t, d], index) => (
                <motion.div
                  key={n}
                  className="le-step-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "easeInOut",
                  }}
                  viewport={{ once: true }}
                >
                  <div className="le-step-num">{n}</div>
                  <div className="le-step-title">{t}</div>
                  <div className="le-step-desc">{d}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="le-section-mid">
          <div className="le-container">
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <div className="le-section-label">Why LegalEase AI</div>
              <h2 className="le-section-h2">
                Built for <em>Indian</em> founders
              </h2>
            </div>
            <div className="le-feat-grid">
              {[
                [
                  "⚖️",
                  "India-Specific Laws",
                  "Every penalty cited from actual Indian legislation — FSSAI Act, IT Act 2000, Companies Act 2013, GST Act.",
                ],
                [
                  "🗺️",
                  "State-Level Rules",
                  "Rules differ by state. Our engine applies state-specific variations for all 28 states and UTs.",
                ],
                [
                  "📋",
                  "Document Checklists",
                  "Every license card shows the exact documents to gather before applying.",
                ],
                [
                  "🔢",
                  "Deterministic Scoring",
                  "Risk and feasibility scores from a Python rule engine — not AI that can hallucinate numbers.",
                ],
                [
                  "📅",
                  "Timeline View",
                  "Visual Gantt-style layout of your action plan grouped by week and category.",
                ],
                [
                  "🔍",
                  "Smart Search",
                  "Search across all licenses, risks, and action steps instantly.",
                ],
                [
                  "💰",
                  "Cost Calculator",
                  "Interactive sliders to estimate your real compliance budget.",
                ],
                [
                  "📊",
                  "Comparison Mode",
                  "Compare two business analyses side by side on scores, licenses, and risks.",
                ],
                [
                  "🧭",
                  "Apply Assistant",
                  "Step-by-step guided flow for GST, FSSAI, Udyam, and more.",
                ],
                [
                  "📥",
                  "Export to CSV",
                  "Download your full report as a spreadsheet for CA or team review.",
                ],
                [
                  "🔗",
                  "Share Reports",
                  "One-click shareable link for any report ID.",
                ],
                [
                  "✅",
                  "Progress Tracker",
                  "Check off compliance tasks as you complete them.",
                ],
              ].map(([icon, title, desc], index) => (
                <motion.div
                  key={title}
                  className="le-feat-card le-feat-card-sm"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "easeInOut",
                  }}
                  viewport={{ once: true }}
                >
                  <div className="le-feat-icon">{icon}</div>
                  <div className="le-feat-title">{title}</div>
                  <div className="le-feat-desc">{desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="le-section-dark">
          <div className="le-container">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <div className="le-section-label">From Founders</div>
              <h2 className="le-section-h2">
                Built for the <em>real</em> India startup journey
              </h2>
            </div>
            <div className="le-testi-grid">
              {[
                [
                  "I had no idea I needed both FSSAI and a Fire NOC for my cloud kitchen. LegalEase caught it before I even started.",
                  "Priya Menon",
                  "Cloud Kitchen Founder, Bangalore",
                ],
                [
                  "The action plan was incredibly specific — exact form names, portal links, and what it would cost. Saved me hours of research.",
                  "Rahul Sharma",
                  "EdTech Startup, Delhi",
                ],
                [
                  "The risk section had exact section numbers from the IT Act and RBI guidelines. Not vague warnings — actual citations.",
                  "Anita Desai",
                  "Fintech Founder, Mumbai",
                ],
                [
                  "The fact that risk scores come from a Python engine, not AI, gave me confidence. I can trust the numbers.",
                  "Vikram Nair",
                  "Export Business, Chennai",
                ],
              ].map(([q, n, r], i) => (
                <motion.div
                  key={i}
                  className="le-testi-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                  viewport={{ once: true }}
                >
                  <div
                    style={{
                      color: "#C9A84C",
                      fontSize: 30,
                      marginBottom: 10,
                      lineHeight: 1,
                      fontFamily: "'Cormorant Garamond',serif",
                      fontWeight: 300,
                    }}
                  >
                    "
                  </div>
                  <div className="le-testi-quote">{q}</div>
                  <div className="le-testi-author">{n}</div>
                  <div className="le-testi-role">{r}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="le-cta-band">
        <div className="le-container" style={{ textAlign: "center" }}>
          <div className="le-section-label">Free · No Signup · Instant PDF</div>
          <h2 className="le-section-h2" style={{ marginBottom: "1.5rem" }}>
            Ready to start <em>legally compliant</em>?
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1rem",
              marginBottom: "2.5rem",
              fontWeight: 300,
            }}
          >
            Describe your business in one sentence. Get a complete legal roadmap
            instantly.
          </p>
          <MagneticButton
            className="le-btn-primary"
            onClick={onStart}
            style={{ fontSize: 17, padding: "18px 52px" }}
          >
            Analyze My Business Now →
          </MagneticButton>
          <div
            style={{
              marginTop: "1.5rem",
              fontSize: 11,
              color: "rgba(255,255,255,0.18)",
            }}
          >
            For informational use only · Always consult a qualified CA or
            advocate for binding legal advice
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── INPUT PAGE ───────────────────────────────────────────────────────────────
function InputPage({ onAnalyze, initialValues }) {
  const [idea, setIdea] = useState(initialValues?.idea || "");
  const [location, setLocation] = useState(
    initialValues?.location || "Maharashtra",
  );
  const [scale, setScale] = useState(initialValues?.scale || "startup");
  const [mode, setMode] = useState(initialValues?.mode || "both");
  const [email, setEmail] = useState(initialValues?.email || "");
  const suggestions = [
    "Cloud kitchen in Mumbai",
    "EdTech platform for UPSC prep",
    "Organic farm in Pune",
    "Fintech lending app",
    "Yoga studio franchise",
    "Export garments business",
    "D2C cosmetics brand",
    "Software dev agency",
  ];
  const states = [
    "Andhra Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Tamil Nadu",
    "Telangana",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];
  useEffect(() => {
    if (!initialValues) return;
    setIdea(initialValues.idea || "");
    setLocation(initialValues.location || "Maharashtra");
    setScale(initialValues.scale || "startup");
    setMode(initialValues.mode || "both");
    setEmail(initialValues.email || "");
  }, [initialValues]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      style={{
        background: "var(--ink)",
        minHeight: "100vh",
        padding: "2rem 0",
      }}
    >
      <div className="le-input-section">
        <motion.div
          style={{ textAlign: "center", marginBottom: "2.5rem" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeInOut" }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: "#C9A84C",
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            Full Legal Analysis
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: "2.2rem",
              color: "var(--text-primary)",
              marginBottom: 10,
              lineHeight: 1.1,
              fontWeight: 600,
              letterSpacing: "-0.5px",
            }}
          >
            Analyze Your Business Idea
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            The more specific you are, the more personalized your legal roadmap.
          </p>
        </motion.div>
        <motion.div
          className="le-input-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeInOut" }}
        >
          <div className="le-input-header">
            <h2>Business Description</h2>
            <p>
              Describe what your business does, who it serves, and how it
              operates.
            </p>
          </div>
          <div className="le-input-body">
            <textarea
              className="le-textarea"
              placeholder="e.g. I want to open a cloud kitchen in Mumbai that delivers healthy tiffin meals to office workers, operating 6 days a week through Swiggy and Zomato, with 3 staff members..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />
            <div className="le-suggestions">
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  alignSelf: "center",
                  marginRight: 4,
                }}
              >
                Try:
              </span>
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="le-suggestion"
                  onClick={() => setIdea(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="le-meta-row">
              <div className="le-meta-group">
                <div className="le-meta-label">State / UT</div>
                <select
                  className="le-meta-select"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  {states.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="le-meta-group">
                <div className="le-meta-label">Business Scale</div>
                <select
                  className="le-meta-select"
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                >
                  <option value="solo">Solo / Freelancer</option>
                  <option value="startup">Startup (under Rs. 50L)</option>
                  <option value="sme">SME (Rs. 50L – Rs. 5Cr)</option>
                  <option value="enterprise">Enterprise (above Rs. 5Cr)</option>
                </select>
              </div>
              <div className="le-meta-group">
                <div className="le-meta-label">Operational Mode</div>
                <select
                  className="le-meta-select"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="online">Online / Digital</option>
                  <option value="offline">Offline / Physical</option>
                  <option value="both">Both (Hybrid)</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ padding: "0 2.25rem 1.25rem" }}>
            <div className="le-meta-label" style={{ marginBottom: 7 }}>
              Email (optional — we'll send the PDF to you)
            </div>
            <input
              type="email"
              className="le-email-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="le-input-footer">
            <p className="le-disclaimer">
              Processed by Python backend · AI-generated insights · Consult a
              qualified CA or lawyer for binding legal advice.
            </p>
            <MagneticButton
              className="le-btn-primary"
              onClick={() => onAnalyze({ idea, location, scale, mode, email })}
              disabled={idea.trim().length < 5}
            >
              Run Analysis →
            </MagneticButton>
          </div>
        </motion.div>
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            justifyContent: "center",
            gap: "2rem",
            flexWrap: "wrap",
          }}
        >
          {[
            ["📋", "Licenses + Docs"],
            ["⚖️", "Risks + Penalties"],
            ["🗺️", "Action Plan"],
            ["📄", "PDF Report"],
          ].map(([i, t]) => (
            <div
              key={t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              <span>{i}</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── LOADING PAGE ─────────────────────────────────────────────────────────────
function LoadingPage() {
  const [step, setStep] = useState(0);
  const steps = [
    "Detecting business category...",
    "Mapping required licenses (rule engine)...",
    "Calculating risk scores — 5 dimensions...",
    "Calling Gemini AI for personalized enrichment...",
    "Generating branded PDF report...",
    "Saving to SQLite database...",
    "Finalizing your compliance report...",
  ];
  const pct = Math.round(((step + 1) / steps.length) * 100);
  useEffect(() => {
    const t = setInterval(
      () => setStep((s) => Math.min(s + 1, steps.length - 1)),
      1800,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div
      className="le-loading-wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <div className="le-loading">
        <div className="le-spinner" />
        <div className="le-loading-stage">Analysis Running</div>
        <div className="le-loading-sub">
          Python engines + Gemini AI + PDF — 20–40 seconds
        </div>
        <div
          className="le-progress-bar-outer"
          style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}
        >
          <motion.div
            className="le-loading-bar-fill"
            initial={{ width: "0%" }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          />
        </div>
        <div className="le-loading-steps">
          {steps.map((s, i) => (
            <motion.div
              key={s}
              className={`le-loading-step ${i < step ? "done" : i === step ? "active" : ""}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: "easeInOut" }}
            >
              <div className="le-step-dot" />
              {i < step ? "✓ " : ""}
              {s}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── RESULTS PAGE ─────────────────────────────────────────────────────────────
function ResultsPage({
  data,
  input,
  onReset,
  savedReports,
  sharedView,
  backendAvailable = true,
}) {
  const f = data.feasibility || {},
    r = data.risk || {},
    c = data.compliance_complexity || {};
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState(null); // "timeline"|"calculator"|"assistant"|"compare"|"progress"
  const [checkedItems, setCheckedItems] = useState({});
  const [workspace, setWorkspace] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [taskSaving, setTaskSaving] = useState("");
  const [documentSaving, setDocumentSaving] = useState("");
  const [documentNotes, setDocumentNotes] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastShow(true);
    setTimeout(() => setToastShow(false), 2800);
  };

  useEffect(() => {
    if (!modal) return undefined;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modal]);

  useEffect(() => {
    if (!backendAvailable) {
      setWorkspace(null);
      setDocumentNotes({});
      setWorkspaceLoading(false);
      setWorkspaceError(
        "Workspace is unavailable for this saved report because it is no longer present on the server.",
      );
      return undefined;
    }
    let cancelled = false;
    setWorkspaceLoading(true);
    setWorkspaceError("");
    fetchWorkspaceAPI(data.report_id)
      .then((payload) => {
        if (cancelled) return;
        setWorkspace(payload);
        setDocumentNotes(
          Object.fromEntries(
            (payload.documents || []).map((doc) => [
              doc.doc_key,
              doc.note || "",
            ]),
          ),
        );
        setWorkspaceLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setWorkspace(null);
        setWorkspaceLoading(false);
        setWorkspaceError("Workspace data could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [backendAvailable, data.report_id]);

  const shareReport = () => {
    const url = `${window.location.origin}/report/${data.report_id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => showToast("🔗 Link copied to clipboard!"))
      .catch(() => showToast("Report ID: #" + data.report_id));
  };

  // Build all searchable text blocks
  const searchable = [
    ...(data.licenses || []).map((l) => ({
      section: "Licenses",
      title: l.name,
      body: l.description || "",
      extra: l.authority || "",
    })),
    ...(data.risks || []).map((r) => ({
      section: "Risks",
      title: r.title,
      body: r.description || "",
      extra: r.penalty || "",
    })),
    ...(data.action_plan || []).map((a) => ({
      section: "Action Plan",
      title: a.title,
      body: a.description || "",
      extra: a.timeframe || "",
    })),
    ...(data.non_compliance_consequences || []).map((n) => ({
      section: "Non-Compliance",
      title: n.area,
      body: n.consequence || "",
      extra: "",
    })),
    ...(data.cost_estimates || []).map((ce) => ({
      section: "Costs",
      title: ce.item,
      body: ce.notes || "",
      extra: ce.range || "",
    })),
  ];
  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? searchable.filter((s) =>
        (s.title + s.body + s.extra + s.section).toLowerCase().includes(q),
      )
    : null;

  // Checklist items for progress tracker
  const checklistItems = [
    ...(data.licenses || []).map((l) => `Obtain ${l.name}`),
    "Open a dedicated business bank account",
    "Set up accounting software (Tally / Zoho Books)",
    "Draft employee contracts if hiring staff",
    "Register trademarks if using a brand name",
    "Set up GST invoicing from Day 1",
    "Display all licenses visibly at business premises",
    "Maintain statutory registers as required by law",
  ];
  const workspaceTasks = workspace?.tasks || [];
  const effectiveChecklistItems =
    workspaceTasks.length > 0
      ? workspaceTasks.map((task) => task.title)
      : checklistItems;
  const totalChecked =
    workspaceTasks.length > 0
      ? workspaceTasks.filter((task) => task.status === "completed").length
      : Object.values(checkedItems).filter(Boolean).length;
  const pct = effectiveChecklistItems.length
    ? Math.round((totalChecked / effectiveChecklistItems.length) * 100)
    : 0;
  const documentSummary = workspace?.summary || {
    document_count: 0,
    ready_documents: 0,
  };
  const documentHealth = (workspace?.documents || []).reduce(
    (acc, doc) => {
      if (doc.validation?.status === "validated") acc.validated += 1;
      else if (doc.validation?.status === "review_required")
        acc.reviewRequired += 1;
      else if (doc.original_filename) acc.uploaded += 1;
      else acc.pending += 1;
      return acc;
    },
    { validated: 0, reviewRequired: 0, uploaded: 0, pending: 0 },
  );
  const documentsByLicense = (workspace?.documents || []).reduce((acc, doc) => {
    const key = doc.license_name || "General compliance";
    acc[key] = acc[key] || [];
    acc[key].push(doc);
    return acc;
  }, {});

  const handleTaskStatus = async (task, status) => {
    setTaskSaving(task.task_key);
    try {
      const nextWorkspace = await updateTaskStatusAPI(
        data.report_id,
        task.task_key,
        status,
      );
      setWorkspace(nextWorkspace);
      showToast(
        status === "completed" ? "Task marked complete" : "Task updated",
      );
    } catch {
      showToast("Task update failed");
    } finally {
      setTaskSaving("");
    }
  };

  const handleDocumentUpload = async (doc) => {
    const file = selectedFiles[doc.doc_key];
    if (!file) {
      showToast("Choose a file first");
      return;
    }
    setDocumentSaving(doc.doc_key);
    try {
      const nextWorkspace = await uploadDocumentAPI(
        data.report_id,
        doc.doc_key,
        file,
        documentNotes[doc.doc_key] || "",
      );
      setWorkspace(nextWorkspace);
      setSelectedFiles((current) => ({ ...current, [doc.doc_key]: null }));
      setDocumentNotes((current) => ({
        ...current,
        [doc.doc_key]:
          nextWorkspace.documents?.find((item) => item.doc_key === doc.doc_key)
            ?.note ||
          current[doc.doc_key] ||
          "",
      }));
      showToast("Document verified and saved");
    } catch (error) {
      showToast(error.message || "Document upload failed");
    } finally {
      setDocumentSaving("");
    }
  };

  return (
    <div style={{ background: "var(--ink)" }}>
      <Toast message={toastMsg} show={toastShow} />

      <div className="le-banner">
        <span className="le-banner-txt">
          {sharedView && (
            <span
              style={{
                fontSize: 11,
                color: "var(--gold)",
                marginRight: 10,
                fontWeight: 600,
              }}
            >
              Shared report
            </span>
          )}
          Report{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            #{data.report_id}
          </strong>
          <span style={{ margin: "0 8px", opacity: 0.3 }}>·</span>
          {data.business_name}
          <span style={{ margin: "0 8px", opacity: 0.3 }}>·</span>
          {input.location}
          <span style={{ margin: "0 8px", opacity: 0.3 }}>·</span>
          <span style={{ color: "#C9A84C" }}>{data.category}</span>
        </span>
        <div className="le-toolbar">
          <button className="le-share-btn" onClick={shareReport}>
            🔗 Share
          </button>
          <button className="le-export-btn" onClick={() => exportToExcel(data)}>
            📥 Excel
          </button>
          <button
            className="le-btn-ghost"
            style={{ fontSize: 11, padding: "5px 12px" }}
            onClick={() => setModal("progress")}
          >
            ✅ {pct}% Done
          </button>
          {data.pdf_url && (
            <a
              href={`${API_BASE}/api/report/${data.report_id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button
                className="le-btn-primary"
                style={{ fontSize: 12, padding: "7px 16px" }}
              >
                ⬇ PDF
              </button>
            </a>
          )}
          <button
            className="le-btn-ghost"
            onClick={onReset}
            style={{ fontSize: 12, padding: "6px 14px" }}
          >
            {sharedView ? "← Home" : "← New"}
          </button>
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <ResultsModal>
          <div
            className="le-modal-overlay"
            onClick={(e) => e.target === e.currentTarget && setModal(null)}
          >
            <div className={`le-modal le-modal-${modal}`}>
              <div className="le-modal-header">
                <div className="le-modal-title">
                  {modal === "timeline" && "📅 Action Plan Timeline"}
                  {modal === "calculator" && "💰 Cost Calculator"}
                  {modal === "assistant" && "🧭 License Apply Assistant"}
                  {modal === "compare" && "📊 Compare Reports"}
                  {modal === "progress" && "✅ Progress Tracker"}
                </div>
                <button
                  className="le-modal-close"
                  onClick={() => setModal(null)}
                >
                  ✕
                </button>
              </div>
              <div className="le-modal-body">
                {modal === "timeline" && (
                  <TimelineView actionPlan={data.action_plan} />
                )}
                {modal === "calculator" && <CostCalculator data={data} />}
                {modal === "assistant" && (
                  <LicenseAssistant
                    licenses={data.licenses}
                    onClose={() => setModal(null)}
                  />
                )}
                {modal === "compare" && (
                  <ComparisonView reports={savedReports || [data]} />
                )}
                {modal === "progress" && (
                  <div>
                    <div className="le-progress-header">
                      <div className="le-progress-label">
                        Compliance Progress
                      </div>
                      <div className="le-progress-pct">{pct}%</div>
                    </div>
                    <div className="le-progress-bar-outer">
                      <div
                        className="le-progress-bar-inner"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginBottom: "1.25rem",
                      }}
                    >
                      {totalChecked} of {effectiveChecklistItems.length} tasks
                      completed
                    </div>
                    {checklistItems.map((item, i) => (
                      <div
                        key={i}
                        className={`le-check-item-tracker${checkedItems[i] ? " checked" : ""}`}
                        onClick={() =>
                          setCheckedItems((c) => ({ ...c, [i]: !c[i] }))
                        }
                      >
                        <div className="le-check-box">
                          <span className="le-check-box-tick">✓</span>
                        </div>
                        <div style={{ flex: 1 }}>{item}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ResultsModal>
      )}

      <div className="le-results">
        {/* Header */}
        <div className="le-results-header">
          <div className="le-results-meta">
            Report #{data.report_id} · Python + Gemini AI · India
          </div>
          <div className="le-results-title">{data.business_name}</div>
          <div className="le-results-sub">{data.summary}</div>
          {data.key_insight && (
            <div className="le-insight-box">
              <span
                style={{
                  color: "#C9A84C",
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                }}
              >
                Key Insight
              </span>
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  marginTop: 6,
                  lineHeight: 1.7,
                }}
              >
                {data.key_insight}
              </div>
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: "1.25rem",
            }}
          >
            {[
              ["#C9A84C", `${data.licenses?.length || 0} Licenses Required`],
              [
                r.score > 60 ? "#E05252" : r.score > 30 ? "#E09B40" : "#4CAF7D",
                `Risk: ${r.label || "—"}`,
              ],
              ["#6BA3D6", `Compliance: ${c.label || "—"}`],
              ["#4CAF7D", `Feasibility: ${f.label || "—"}`],
            ].map(([col, txt]) => (
              <span
                key={txt}
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: "4px 12px",
                  borderRadius: 100,
                  background: `${col}18`,
                  border: `1px solid ${col}35`,
                  color: col,
                }}
              >
                {txt}
              </span>
            ))}
          </div>
          {/* FEATURE SHORTCUT BUTTONS */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: "1.25rem",
            }}
          >
            {[
              ["📅 Timeline", "timeline"],
              ["💰 Calculator", "calculator"],
              ["🧭 Apply Assistant", "assistant"],
              ["📊 Compare", "compare"],
            ].map(([label, key]) => (
              <button
                key={key}
                className="le-btn-ghost"
                style={{ fontSize: 12, padding: "6px 14px" }}
                onClick={() => setModal(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* SMART SEARCH */}
        <div className="le-search-bar">
          <div className="le-search-wrap">
            <span className="le-search-icon">🔍</span>
            <input
              className="le-search-input"
              placeholder="Search across licenses, risks, actions, costs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="le-search-clear"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>
          {q && (
            <span className="le-search-count">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* SEARCH RESULTS */}
        {q && (
          <div className="le-sec" style={{ marginBottom: "1.5rem" }}>
            <div className="le-sec-body">
              {filtered.length === 0 ? (
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 13,
                    textAlign: "center",
                    padding: "1rem",
                  }}
                >
                  No results for "{searchQuery}"
                </div>
              ) : (
                filtered.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 0",
                      borderBottom: "1px solid var(--ink-border)",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 100,
                        background: "rgba(201,168,76,0.10)",
                        color: "#C9A84C",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {item.section}
                    </span>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "var(--text-primary)",
                          marginBottom: 3,
                        }}
                      >
                        {highlight(item.title, searchQuery)}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          lineHeight: 1.6,
                        }}
                      >
                        {highlight(item.body?.slice(0, 120), searchQuery)}
                        {item.body?.length > 120 ? "..." : ""}
                      </div>
                      {item.extra && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#C9A84C",
                            marginTop: 4,
                            fontWeight: 600,
                          }}
                        >
                          {highlight(item.extra, searchQuery)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="le-kpi-grid">
          <KpiCard
            label="Feasibility Score"
            score={f.score || 0}
            note={f.note}
            type="feasibility"
          />
          <KpiCard
            label="Risk Score"
            score={r.score || 0}
            note={r.note}
            type="risk"
          />
          <KpiCard
            label="Compliance Complexity"
            score={c.score || 0}
            note={c.note}
            type="complexity"
          />
        </div>

        {/* Quick Stats */}
        <div className="le-summary-grid">
          <div className="le-summary-stat">
            <div className="le-summary-label">Licenses to Obtain</div>
            <div className="le-summary-val">{data.licenses?.length || 0}</div>
            <div className="le-summary-sub">
              {data.licenses?.filter((l) => l.priority === "critical").length ||
                0}{" "}
              critical priority
            </div>
          </div>
          <div className="le-summary-stat">
            <div className="le-summary-label">Legal Risks Found</div>
            <div className="le-summary-val">{data.risks?.length || 0}</div>
            <div className="le-summary-sub">
              {data.risks?.filter((rk) => rk.severity === "high").length || 0}{" "}
              high severity
            </div>
          </div>
          <div className="le-summary-stat">
            <div className="le-summary-label">Action Steps</div>
            <div className="le-summary-val">
              {data.action_plan?.length || 0}
            </div>
            <div className="le-summary-sub">Ordered chronologically</div>
          </div>
          <div className="le-summary-stat">
            <div className="le-summary-label">Workspace Progress</div>
            <div className="le-summary-val">
              {workspace?.summary?.completion_rate ?? pct}%
            </div>
            <div className="le-summary-sub">
              {documentSummary.ready_documents}/{documentSummary.document_count}{" "}
              documents ready
            </div>
          </div>
        </div>

        {/* 1. LICENSES */}
        {data.licenses?.length > 0 && (
          <Section
            icon="📋"
            title="Required Licenses & Registrations"
            subtitle={`${data.licenses.length} registrations required before commencing operations`}
            count={data.licenses.length}
            open
          >
            {data.licenses.map((lic, i) => {
              const docs = getDocuments(lic.name);
              return (
                <div key={i} className="le-lic">
                  <div className="le-lic-top">
                    <div>
                      <div className="le-lic-name">{lic.name}</div>
                      <div className="le-lic-org">
                        Issued by: {lic.authority}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        className={`le-priority-badge priority-${lic.priority}`}
                      >
                        {lic.priority}
                      </span>
                      <button
                        className="le-btn-ghost"
                        style={{ fontSize: 11, padding: "3px 10px" }}
                        onClick={() => setModal("assistant")}
                      >
                        📝 Apply Guide
                      </button>
                    </div>
                  </div>
                  <div className="le-lic-desc">{lic.description}</div>
                  <div className="le-lic-doc-list">
                    <div className="le-lic-doc-title">
                      Documents Required to Apply
                    </div>
                    {docs.map((doc, j) => (
                      <div key={j} className="le-lic-doc-item">
                        <span style={{ color: "#C9A84C", flexShrink: 0 }}>
                          ✓
                        </span>
                        {doc}
                      </div>
                    ))}
                  </div>
                  <div className="le-lic-meta">
                    <div>
                      <span className="le-lic-meta-key">Govt. Cost:</span>
                      <span className="le-lic-meta-val">
                        {lic.estimated_cost}
                      </span>
                    </div>
                    <div>
                      <span className="le-lic-meta-key">Approval Time:</span>
                      <span className="le-lic-meta-val">
                        {lic.time_to_approve}
                      </span>
                    </div>
                    <div>
                      <span className="le-lic-meta-key">Priority:</span>
                      <span
                        className="le-lic-meta-val"
                        style={{ textTransform: "capitalize" }}
                      >
                        {lic.priority}
                      </span>
                    </div>
                    {lic.link && (
                      <div style={{ marginLeft: "auto" }}>
                        <a
                          href={lic.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#6BA3D6",
                            fontSize: 12,
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          Apply Online →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </Section>
        )}

        {/* 2. RISK CHART */}
        {data.risk_breakdown?.length > 0 && (
          <Section
            icon="📊"
            title="Risk Distribution by Category"
            subtitle="Calculated by deterministic Python rule engine — not AI"
            open
          >
            <div style={{ padding: "0.5rem 0" }}>
              {data.risk_breakdown.map((rb, i) => {
                const { c: bc } = scoreColor(rb.score, "risk");
                return (
                  <div key={i} className="le-bar-row">
                    <div className="le-bar-name">{rb.label}</div>
                    <div className="le-bar-track">
                      <div
                        className="le-bar-fill"
                        style={{
                          width: `${Math.min(rb.score, 100)}%`,
                          background: bc,
                        }}
                      />
                    </div>
                    <div className="le-bar-val" style={{ color: bc }}>
                      {rb.score}/100
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                marginTop: "1rem",
                padding: "0.85rem 1.1rem",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid var(--ink-border)",
                borderRadius: "var(--r-sm)",
                display: "flex",
                gap: "1.5rem",
                flexWrap: "wrap",
              }}
            >
              {[
                ["#4CAF7D", "0–30 Low"],
                ["#E09B40", "31–60 Medium"],
                ["#E05252", "61–100 High"],
              ].map(([c, l]) => (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 12,
                  }}
                >
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 3,
                      background: c,
                    }}
                  />
                  <span style={{ color: "var(--text-muted)" }}>{l} Risk</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 3. RISKS */}
        {data.risks?.length > 0 && (
          <Section
            icon="⚠️"
            title="Legal Risks & Penalties"
            subtitle={`${data.risks.filter((rk) => rk.severity === "high").length} high-severity risks — cited from actual Indian Acts`}
            count={data.risks.length}
            open
          >
            {data.risks.map((risk, i) => {
              const sc =
                risk.severity === "high"
                  ? "#E05252"
                  : risk.severity === "medium"
                    ? "#E09B40"
                    : "#6BA3D6";
              const bg =
                risk.severity === "high"
                  ? "rgba(224,82,82,0.06)"
                  : risk.severity === "medium"
                    ? "rgba(224,155,64,0.06)"
                    : "rgba(107,163,214,0.06)";
              return (
                <div
                  key={i}
                  className="le-risk"
                  style={{ background: bg, borderColor: `${sc}22` }}
                >
                  <div className="le-risk-header">
                    <div className="le-risk-name" style={{ color: sc }}>
                      {risk.title}
                    </div>
                    <span
                      className="le-risk-sev"
                      style={{
                        background: `${sc}16`,
                        color: sc,
                        border: `1px solid ${sc}28`,
                      }}
                    >
                      {risk.severity}
                    </span>
                  </div>
                  <div className="le-risk-desc">{risk.description}</div>
                  {risk.law && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9.5,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                        }}
                      >
                        Under
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: "var(--r-sm)",
                          background: "rgba(255,255,255,0.05)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--ink-border)",
                        }}
                      >
                        {risk.law}
                      </span>
                    </div>
                  )}
                  <span
                    className="le-risk-penalty"
                    style={{
                      background: `${sc}10`,
                      color: sc,
                      borderColor: `${sc}28`,
                    }}
                  >
                    ⚖ Penalty: {risk.penalty}
                  </span>
                </div>
              );
            })}
          </Section>
        )}

        {/* 4. NON-COMPLIANCE */}
        {data.non_compliance_consequences?.length > 0 && (
          <Section
            icon="🚫"
            title="Non-Compliance Consequences"
            subtitle="What actually happens if you skip each requirement"
            count={data.non_compliance_consequences.length}
            open
          >
            {data.non_compliance_consequences.map((nc, i) => (
              <div key={i} className="le-nc">
                <div className="le-nc-title">
                  <span>⚠</span>
                  {nc.area}
                </div>
                <div className="le-nc-desc">{nc.consequence}</div>
              </div>
            ))}
          </Section>
        )}

        {/* 5. ACTION PLAN with timeline button */}
        {data.action_plan?.length > 0 && (
          <Section
            icon="🗺️"
            title="Step-by-Step Action Plan"
            subtitle={`${data.action_plan.length} steps ordered chronologically — what to do first`}
            count={data.action_plan.length}
            open
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "1rem",
              }}
            >
              <button
                className="le-btn-ghost"
                style={{ fontSize: 12, padding: "6px 14px" }}
                onClick={() => setModal("timeline")}
              >
                📅 View Timeline
              </button>
            </div>
            {data.action_plan.map((step, i) => {
              const catC =
                {
                  legal: "#6BA3D6",
                  financial: "#4CAF7D",
                  operational: "#E09B40",
                  compliance: "#E05252",
                }[step.category] || "#C9A84C";
              const catBg =
                {
                  legal: "rgba(107,163,214,0.10)",
                  financial: "rgba(76,175,125,0.10)",
                  operational: "rgba(224,155,64,0.10)",
                  compliance: "rgba(224,82,82,0.10)",
                }[step.category] || "rgba(201,168,76,0.08)";
              return (
                <div key={i} className="le-action">
                  <div className="le-action-left">
                    <div className="le-action-num">{step.step}</div>
                    {i < data.action_plan.length - 1 && (
                      <div className="le-action-line" />
                    )}
                  </div>
                  <div className="le-action-content">
                    <div className="le-action-title">{step.title}</div>
                    <div className="le-action-desc">{step.description}</div>
                    <div className="le-action-tags">
                      <span
                        className="le-action-tag"
                        style={{
                          background: catBg,
                          color: catC,
                          borderColor: `${catC}28`,
                        }}
                      >
                        {step.category}
                      </span>
                      <span
                        className="le-action-tag"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          color: "var(--text-muted)",
                          borderColor: "var(--ink-border)",
                        }}
                      >
                        {step.timeframe}
                      </span>
                      {step.cost && (
                        <span
                          className="le-action-tag"
                          style={{
                            background: "rgba(201,168,76,0.08)",
                            color: "#C9A84C",
                            borderColor: "rgba(201,168,76,0.22)",
                          }}
                        >
                          {step.cost}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </Section>
        )}

        {/* 6. COSTS with calculator button */}
        {data.cost_estimates?.length > 0 && (
          <Section
            icon="💰"
            title="Cost Estimates"
            subtitle="Realistic rupee ranges for every registration and compliance item"
            count={data.cost_estimates.length}
            open
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "1rem",
              }}
            >
              <button
                className="le-btn-ghost"
                style={{ fontSize: 12, padding: "6px 14px" }}
                onClick={() => setModal("calculator")}
              >
                🎛 Open Calculator
              </button>
            </div>
            <table className="le-cost-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Estimated Range</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.cost_estimates.map((ce, i) => {
                  const isFree =
                    (ce.range || "").toLowerCase().includes("free") ||
                    (ce.range || "").includes(" 0");
                  return (
                    <tr key={i}>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {ce.item}
                      </td>
                      <td>
                        <span
                          className="le-cost-num"
                          style={{
                            color: isFree ? "#4CAF7D" : "var(--text-primary)",
                          }}
                        >
                          {ce.range}
                        </span>
                        {isFree && (
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: "rgba(76,175,125,0.13)",
                              color: "#4CAF7D",
                              marginLeft: 6,
                            }}
                          >
                            FREE
                          </span>
                        )}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{ce.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div
              style={{
                marginTop: "1rem",
                padding: "0.85rem 1.1rem",
                background: "rgba(201,168,76,0.05)",
                border: "1px solid rgba(201,168,76,0.14)",
                borderRadius: "var(--r-sm)",
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              💡 CA / legal fees for registration assistance: Rs. 1,500–10,000
              per registration. Use the calculator above to estimate your total.
            </div>
          </Section>
        )}

        {/* 7. CHECKLIST (progress-enabled) */}
        {data.licenses?.length > 0 && (
          <Section
            icon="✅"
            title="Pre-Launch Compliance Checklist"
            subtitle={`${totalChecked}/${checklistItems.length} completed — click to track progress`}
            open
          >
            <div style={{ marginBottom: "1rem" }}>
              <div className="le-progress-header">
                <div className="le-progress-label">Overall Progress</div>
                <div className="le-progress-pct">{pct}%</div>
              </div>
              <div className="le-progress-bar-outer">
                <div
                  className="le-progress-bar-inner"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="le-check-grid">
              {checklistItems.map((item, i) => (
                <div
                  key={i}
                  className={`le-check-item${checkedItems[i] ? " checked" : ""}`}
                  onClick={() => setCheckedItems((c) => ({ ...c, [i]: !c[i] }))}
                >
                  <span
                    style={{
                      color: checkedItems[i]
                        ? "#4CAF7D"
                        : i < (data.licenses?.length || 0)
                          ? "#C9A84C"
                          : "#4CAF7D",
                      flexShrink: 0,
                      fontSize: 15,
                    }}
                  >
                    {checkedItems[i]
                      ? "☑"
                      : i < (data.licenses?.length || 0)
                        ? "◯"
                        : "☐"}
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section
          icon="W"
          title="Execution Workspace"
          subtitle={
            workspaceLoading
              ? "Loading report workspace..."
              : `${totalChecked}/${effectiveChecklistItems.length} tasks completed`
          }
          open
        >
          {workspaceError && (
            <div style={{ color: "var(--red)", marginBottom: "1rem" }}>
              {workspaceError}
            </div>
          )}
          <div style={{ marginBottom: "1rem" }}>
            <div className="le-progress-header">
              <div className="le-progress-label">Overall Progress</div>
              <div className="le-progress-pct">
                {workspace?.summary?.completion_rate ?? pct}%
              </div>
            </div>
            <div className="le-progress-bar-outer">
              <div
                className="le-progress-bar-inner"
                style={{
                  width: `${workspace?.summary?.completion_rate ?? pct}%`,
                }}
              />
            </div>
          </div>
          {workspaceTasks.length > 0 ? (
            <div className="le-check-grid">
              {workspaceTasks.map((task) => {
                const active = task.status === "completed";
                const inProgress = task.status === "in_progress";
                return (
                  <div
                    key={task.task_key}
                    className={`le-check-item${active ? " checked" : ""}`}
                    style={{ display: "block", cursor: "default" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, flex: 1 }}>
                        <span
                          style={{
                            color: active
                              ? "#4CAF7D"
                              : inProgress
                                ? "#E09B40"
                                : "#C9A84C",
                            flexShrink: 0,
                            fontSize: 15,
                          }}
                        >
                          {active ? "✓" : inProgress ? "..." : "○"}
                        </span>
                        <div>
                          <div
                            style={{
                              color: "var(--text-primary)",
                              fontWeight: 600,
                            }}
                          >
                            {task.title}
                          </div>
                          <div
                            style={{
                              color: "var(--text-muted)",
                              fontSize: 12,
                              marginTop: 4,
                            }}
                          >
                            {task.category} | {task.timeframe || "Planned"}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                      >
                        <button
                          className="le-btn-ghost"
                          style={{ fontSize: 11, padding: "4px 10px" }}
                          disabled={taskSaving === task.task_key}
                          onClick={() => handleTaskStatus(task, "in_progress")}
                        >
                          Start
                        </button>
                        <button
                          className="le-btn-primary"
                          style={{ fontSize: 11, padding: "4px 10px" }}
                          disabled={taskSaving === task.task_key}
                          onClick={() =>
                            handleTaskStatus(
                              task,
                              active ? "pending" : "completed",
                            )
                          }
                        >
                          {active ? "Reopen" : "Done"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)" }}>
              Workspace tasks will appear here once the report workspace loads.
            </div>
          )}
        </Section>

        <Section
          icon="D"
          title="Document Vault"
          subtitle={
            workspaceLoading
              ? "Preparing document checklist..."
              : `${documentSummary.ready_documents}/${documentSummary.document_count} documents ready or submitted`
          }
          open
        >
          {Object.keys(documentsByLicense).length === 0 &&
            !workspaceLoading && (
              <div style={{ color: "var(--text-muted)" }}>
                No document checklist was generated for this report.
              </div>
            )}
          {workspace?.documents?.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  border: "1px solid rgba(76,175,125,0.22)",
                  background: "rgba(76,175,125,0.08)",
                  borderRadius: "var(--r-sm)",
                  padding: "0.85rem",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: 6,
                  }}
                >
                  Validated
                </div>
                <div
                  style={{
                    fontSize: 22,
                    color: "var(--text-primary)",
                    fontWeight: 700,
                  }}
                >
                  {documentHealth.validated}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Passed document verification.
                </div>
              </div>
              <div
                style={{
                  border: "1px solid rgba(224,82,82,0.22)",
                  background: "rgba(224,82,82,0.08)",
                  borderRadius: "var(--r-sm)",
                  padding: "0.85rem",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: 6,
                  }}
                >
                  Needs Review
                </div>
                <div
                  style={{
                    fontSize: 22,
                    color: "var(--text-primary)",
                    fontWeight: 700,
                  }}
                >
                  {documentHealth.reviewRequired}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Check mismatches or expiry flags.
                </div>
              </div>
              <div
                style={{
                  border: "1px solid var(--ink-border)",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "var(--r-sm)",
                  padding: "0.85rem",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: 6,
                  }}
                >
                  Awaiting Upload
                </div>
                <div
                  style={{
                    fontSize: 22,
                    color: "var(--text-primary)",
                    fontWeight: 700,
                  }}
                >
                  {documentHealth.pending}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Still missing from the vault.
                </div>
              </div>
            </div>
          )}
          {Object.entries(documentsByLicense).map(([licenseName, docs]) => (
            <div
              key={licenseName}
              style={{
                marginBottom: "1.5rem",
                border: "1px solid var(--ink-border)",
                borderRadius: "var(--r-md)",
                padding: "1rem",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: "0.85rem",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  {licenseName}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {
                    docs.filter(
                      (doc) =>
                        doc.status === "ready" || doc.status === "submitted",
                    ).length
                  }
                  /{docs.length} ready
                </div>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {docs.map((doc) => (
                  <div
                    key={doc.doc_key}
                    style={{
                      border:
                        doc.validation?.status === "validated"
                          ? "1px solid rgba(76,175,125,0.32)"
                          : doc.validation?.status === "review_required"
                            ? "1px solid rgba(224,82,82,0.32)"
                            : "1px solid var(--ink-border)",
                      borderRadius: "var(--r-sm)",
                      padding: "0.85rem",
                      background:
                        doc.validation?.status === "validated"
                          ? "rgba(76,175,125,0.06)"
                          : doc.validation?.status === "review_required"
                            ? "rgba(224,82,82,0.06)"
                            : "rgba(9,15,22,0.5)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{ color: "var(--text-primary)", fontSize: 13 }}
                      >
                        {doc.document_name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{ color: "var(--text-muted)", fontSize: 11 }}
                        >
                          {doc.status.replace("_", " ")}
                        </div>
                        {doc.validation?.status && (
                          <span
                            className={`le-priority-badge priority-${doc.validation.status === "validated" ? "low" : doc.validation.status === "review_required" ? "high" : "medium"}`}
                          >
                            {doc.validation.status.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                    {doc.original_filename && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          marginBottom: 8,
                        }}
                      >
                        Uploaded:{" "}
                        <strong style={{ color: "var(--text-primary)" }}>
                          {doc.original_filename}
                        </strong>
                        {typeof doc.file_size === "number" && (
                          <span>
                            {" "}
                            ({(doc.file_size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        )}
                        {doc.file_url && (
                          <a
                            href={`${API_BASE}${doc.file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              marginLeft: 8,
                              color: "#6BA3D6",
                              textDecoration: "none",
                            }}
                          >
                            View file
                          </a>
                        )}
                      </div>
                    )}
                    {(doc.note || documentNotes[doc.doc_key]) && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                          padding: "6px 10px",
                          borderRadius: "999px",
                          border: "1px solid rgba(107,163,214,0.28)",
                          background: "rgba(107,163,214,0.10)",
                          color: "#9fc7eb",
                          fontSize: 11,
                          lineHeight: 1.4,
                          maxWidth: "100%",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            color: "#6BA3D6",
                            flexShrink: 0,
                          }}
                        >
                          Verification Request
                        </span>
                        <span
                          style={{
                            color: "var(--text-primary)",
                            wordBreak: "break-word",
                          }}
                        >
                          {doc.note || documentNotes[doc.doc_key]}
                        </span>
                      </div>
                    )}
                    {doc.validation?.note && (
                      <div
                        style={{
                          fontSize: 12,
                          color:
                            doc.validation?.status === "validated"
                              ? "#86d9a5"
                              : doc.validation?.status === "review_required"
                                ? "#ff8d8d"
                                : "var(--text-muted)",
                          marginBottom: 8,
                        }}
                      >
                        {doc.validation.note}
                      </div>
                    )}
                    {doc.validation && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        {doc.validation.detected_document_type && (
                          <div
                            style={{
                              padding: "8px 10px",
                              border: "1px solid var(--ink-border)",
                              borderRadius: "var(--r-sm)",
                              background: "rgba(255,255,255,0.03)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: 4,
                              }}
                            >
                              Detected Type
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-primary)",
                              }}
                            >
                              {doc.validation.detected_document_type}
                            </div>
                          </div>
                        )}
                        {doc.validation.authenticity_assessment && (
                          <div
                            style={{
                              padding: "8px 10px",
                              border: "1px solid var(--ink-border)",
                              borderRadius: "var(--r-sm)",
                              background: "rgba(255,255,255,0.03)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: 4,
                              }}
                            >
                              Authenticity
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-primary)",
                              }}
                            >
                              {doc.validation.authenticity_assessment.replace(
                                "_",
                                " ",
                              )}
                            </div>
                          </div>
                        )}
                        {doc.validation.validity_status && (
                          <div
                            style={{
                              padding: "8px 10px",
                              border: "1px solid var(--ink-border)",
                              borderRadius: "var(--r-sm)",
                              background: "rgba(255,255,255,0.03)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: 4,
                              }}
                            >
                              Validity
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-primary)",
                              }}
                            >
                              {doc.validation.validity_status.replace("_", " ")}
                              {doc.validation.expiry_date
                                ? ` | ${doc.validation.expiry_date}`
                                : ""}
                            </div>
                          </div>
                        )}
                        {doc.validation.document_number && (
                          <div
                            style={{
                              padding: "8px 10px",
                              border: "1px solid var(--ink-border)",
                              borderRadius: "var(--r-sm)",
                              background: "rgba(255,255,255,0.03)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: 4,
                              }}
                            >
                              Identifier
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-primary)",
                              }}
                            >
                              {doc.validation.document_number}
                            </div>
                          </div>
                        )}
                        {typeof doc.validation.confidence === "number" && (
                          <div
                            style={{
                              padding: "8px 10px",
                              border: "1px solid var(--ink-border)",
                              borderRadius: "var(--r-sm)",
                              background: "rgba(255,255,255,0.03)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: 4,
                              }}
                            >
                              Confidence
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-primary)",
                              }}
                            >
                              {doc.validation.confidence}%
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <input
                      className="le-search-input le-doc-note"
                      style={{ marginBottom: 8 }}
                      placeholder="Ask what to verify: name, DOB, address, expiry, owner, source, or any custom check..."
                      value={documentNotes[doc.doc_key] ?? doc.note ?? ""}
                      onChange={(e) =>
                        setDocumentNotes((current) => ({
                          ...current,
                          [doc.doc_key]: e.target.value,
                        }))
                      }
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) =>
                          setSelectedFiles((current) => ({
                            ...current,
                            [doc.doc_key]: e.target.files?.[0] || null,
                          }))
                        }
                        style={{
                          color: "var(--text-muted)",
                          fontSize: 12,
                          maxWidth: "260px",
                        }}
                      />
                      {selectedFiles[doc.doc_key] && (
                        <div
                          style={{ fontSize: 11, color: "var(--text-muted)" }}
                        >
                          Ready:{" "}
                          <span style={{ color: "var(--text-primary)" }}>
                            {selectedFiles[doc.doc_key].name}
                          </span>
                        </div>
                      )}
                      <button
                        className="le-btn-primary"
                        style={{ fontSize: 11, padding: "6px 12px" }}
                        disabled={
                          documentSaving === doc.doc_key ||
                          !selectedFiles[doc.doc_key]
                        }
                        onClick={() => handleDocumentUpload(doc)}
                      >
                        {documentSaving === doc.doc_key
                          ? "Verifying..."
                          : doc.original_filename
                            ? "Replace & Re-Verify"
                            : "Upload Once & Verify"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Section>

        {/* FOLLOW UP */}
        {false && (
          <div className="le-followup">
            <h3>Dig Deeper</h3>
            <p>
              Click any question to run a new analysis with it pre-filled —
              tailored to your business context.
            </p>
            <div className="le-followup-qs">
              {data.follow_up_questions.map((q, i) => (
                <button
                  key={i}
                  className="le-followup-q"
                  onClick={() => onAskQuestion(q, input)}
                >
                  <span
                    style={{
                      color: "#C9A84C",
                      marginRight: 8,
                      fontWeight: 600,
                    }}
                  >
                    →
                  </span>
                  {q}
                </button>
              ))}
            </div>
            <div
              style={{
                marginTop: "1rem",
                fontSize: 11,
                color: "rgba(255,255,255,0.22)",
              }}
            >
              Each question runs the full analysis pipeline with your location,
              scale, and mode preserved.
            </div>
          </div>
        )}

        <ReportChat
          reportId={data.report_id}
          businessName={data.business_name}
          location={input?.location || data.location}
          category={data.category}
          licenses={data.licenses}
          risks={data.risks}
          actionPlan={data.action_plan}
          showToast={showToast}
          disabledReason={
            backendAvailable
              ? ""
              : "The report assistant is unavailable for this saved report because the backend no longer has the source report."
          }
        />

        {/* Footer */}
        <div
          style={{
            marginTop: "2rem",
            background: "rgba(201,168,76,0.05)",
            border: "1px solid rgba(201,168,76,0.14)",
            borderRadius: "var(--r-lg)",
            padding: "1.5rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Report ID:{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              #{data.report_id}
            </strong>
            <span style={{ margin: "0 8px" }}>·</span>Category:{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {data.category}
            </strong>
            <span style={{ margin: "0 8px" }}>·</span>Python Rule Engine +
            Gemini AI
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button className="le-share-btn" onClick={shareReport}>
              🔗 Share Link
            </button>
            <button
              className="le-export-btn"
              onClick={() => exportToExcel(data)}
            >
              📥 Export Excel
            </button>
            {data.pdf_url && (
              <a
                href={`${API_BASE}/api/report/${data.report_id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: "#6BA3D6",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Download PDF →
              </a>
            )}
            <button
              className="le-btn-outline"
              onClick={onReset}
              style={{ fontSize: 12, padding: "7px 16px" }}
            >
              ← New Analysis
            </button>
          </div>
        </div>
        <div
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            paddingBottom: "2rem",
            fontSize: 11,
            color: "rgba(255,255,255,0.15)",
          }}
        >
          LegalEase AI · For informational use only · Always consult a qualified
          CA or Advocate for binding legal advice
        </div>
      </div>
    </div>
  );
}

// ─── REPORT VIEWER PAGE ───────────────────────────────────────────────────────
function ReportViewerPage({ reportId, onBack, onAnalyze, savedReports }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
  useEffect(() => {
    if (!reportId) {
      setData(null);
      setErr("Invalid report link");
      setBackendAvailable(false);
      setLoading(false);
      return;
    }
    const localReport =
      mergeReports(savedReports).find(
        (item) => item.report_id === String(reportId).toUpperCase(),
      ) || null;
    setLoading(true);
    setErr(null);
    setData(null);
    setBackendAvailable(true);
    const ac = new AbortController();
    fetch(`${API_BASE}/api/report/${encodeURIComponent(reportId)}`, {
      signal: ac.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error("Report not found");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setBackendAvailable(true);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        if (localReport) {
          setData(localReport);
          setBackendAvailable(false);
          setLoading(false);
          return;
        }
        setErr(e.message);
        setBackendAvailable(false);
        setLoading(false);
      });
    return () => ac.abort();
  }, [reportId, savedReports]);
  if (loading)
    return (
      <div className="le-report-viewer">
        <div className="le-report-viewer-loading">
          <div className="le-spinner" />
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Loading report #{reportId}...
          </div>
        </div>
      </div>
    );
  if (err || !data)
    return (
      <div className="le-report-viewer">
        <div className="le-report-viewer-loading">
          <div style={{ color: "var(--red)", fontSize: 16, fontWeight: 600 }}>
            Report Not Found
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {reportId
              ? `Report #${reportId} could not be loaded.`
              : "No report ID in this link."}
          </div>
          <button
            className="le-btn-outline"
            onClick={onBack}
            style={{ marginTop: "1rem" }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  return (
    <div className="le-report-viewer">
      <ResultsPage
        data={data}
        sharedView
        backendAvailable={backendAvailable}
        input={{ location: data.location, scale: data.scale, mode: data.mode }}
        onReset={onBack}
        onAskQuestion={
          onAnalyze
            ? (q, inp) =>
                onAnalyze({
                  idea: q,
                  location: inp.location,
                  scale: inp.scale,
                  mode: inp.mode,
                })
            : onBack
        }
        savedReports={savedReports}
      />
    </div>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function DashboardPage({ onOpen, onBack }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API_BASE}/api/reports`)
      .then((r) => r.json())
      .then((d) => {
        setReports(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  return (
    <div style={{ background: "var(--ink)", minHeight: "100vh" }}>
      <div className="le-dashboard">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2.5rem",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: "#C9A84C",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Report History
            </div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: "1.9rem",
                color: "var(--text-primary)",
                fontWeight: 600,
                letterSpacing: "-0.3px",
              }}
            >
              Saved Analyses
            </h2>
          </div>
          <button
            className="le-btn-outline"
            onClick={onBack}
            style={{ fontSize: 13 }}
          >
            ← Back
          </button>
        </div>
        {loading && (
          <div
            style={{
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "3rem",
            }}
          >
            Loading reports...
          </div>
        )}
        {!loading && reports.length === 0 && (
          <div
            style={{
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "3rem",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid var(--ink-border)",
              borderRadius: "var(--r-md)",
            }}
          >
            No reports generated yet. Run your first analysis!
          </div>
        )}
        {!loading &&
          reports.map((r) => (
            <div
              key={r.id}
              className="le-report-row"
              onClick={() => onOpen(r.id)}
            >
              <div className="le-report-row-id">#{r.id}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="le-report-row-biz" style={{ marginBottom: 3 }}>
                  {r.idea?.slice(0, 60)}
                  {r.idea?.length > 60 ? "..." : ""}
                </div>
                <div className="le-report-row-meta">
                  {formatReportMeta(r) || "Saved report"}
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(201,168,76,0.65)",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                View →
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
function WorkspacePage({
  seedReports,
  onOpen,
  onBack,
  onCompare,
  onAnalyzeNew,
}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    fetchReportsAPI()
      .then((data) => {
        setReports(mergeReports(seedReports, data));
        setLoading(false);
      })
      .catch(() => {
        setReports(mergeReports(seedReports));
        setLoading(false);
      });
    fetchDashboardSummaryAPI()
      .then((data) => setSummary(data))
      .catch(() => {});
  }, [seedReports]);

  const totalReports = reports.length;
  const stateCount = new Set(reports.map((r) => r.location).filter(Boolean))
    .size;
  const startupCount = reports.filter((r) => r.scale === "startup").length;
  const latest = reports[0];
  const completionRate = summary?.completion_rate ?? 0;
  const readyDocs = summary?.ready_document_count ?? 0;

  return (
    <div style={{ background: "var(--ink)", minHeight: "100vh" }}>
      <div className="le-page-shell">
        <div className="le-page-header">
          <div>
            <div className="le-page-eyebrow">Workspace</div>
            <h2 className="le-page-title">Founder Dashboard</h2>
            <p className="le-page-sub">
              Recent analyses, quick actions, and a clearer snapshot of how the
              compliance engine is being used.
            </p>
          </div>
          <div className="le-page-actions">
            <button className="le-btn-ghost" onClick={onCompare}>
              Compare Reports
            </button>
            <button
              className="le-btn-primary"
              style={{ fontSize: 13, padding: "10px 20px" }}
              onClick={onAnalyzeNew}
            >
              New Analysis
            </button>
            <button
              className="le-btn-outline"
              onClick={onBack}
              style={{ fontSize: 13 }}
            >
              Home
            </button>
          </div>
        </div>
        <div className="le-stat-grid">
          <div className="le-stat-card">
            <div className="le-stat-label">Total Reports</div>
            <div className="le-stat-value">{totalReports}</div>
            <div className="le-stat-note">Stored and reopenable.</div>
          </div>
          <div className="le-stat-card">
            <div className="le-stat-label">States Covered</div>
            <div className="le-stat-value">{stateCount}</div>
            <div className="le-stat-note">
              Jurisdictions represented in recent runs.
            </div>
          </div>
          <div className="le-stat-card">
            <div className="le-stat-label">Startup Reports</div>
            <div className="le-stat-value">{startupCount}</div>
            <div className="le-stat-note">
              Startup-scale analyses in the dataset.
            </div>
          </div>
          <div className="le-stat-card">
            <div className="le-stat-label">Latest</div>
            <div className="le-stat-value">
              {latest ? `#${latest.report_id}` : "—"}
            </div>
            <div className="le-stat-note">
              {latest
                ? formatReportMeta(latest) || "Saved report"
                : "No reports yet."}
            </div>
          </div>
        </div>
        <div className="le-panel-grid">
          <div className="le-panel-card">
            <div className="le-panel-title">Quick Actions</div>
            <div className="le-quick-grid">
              <button className="le-quick-action" onClick={onAnalyzeNew}>
                Run a fresh business analysis
              </button>
              <button className="le-quick-action" onClick={onCompare}>
                Compare two stored reports
              </button>
              <button
                className="le-quick-action"
                onClick={() => latest && onOpen(latest.report_id)}
                disabled={!latest}
              >
                Open the latest report
              </button>
            </div>
          </div>
          <div className="le-panel-card">
            <div className="le-panel-title">What changed</div>
            <div className="le-feature-list">
              <div className="le-feature-line">
                Dashboard for reopening reports without sharing raw IDs
              </div>
              <div className="le-feature-line">
                Dedicated compare page for side-by-side legal tradeoffs
              </div>
              <div className="le-feature-line">
                Founder tools page for threshold and classification checks
              </div>
            </div>
          </div>
        </div>
        {loading && (
          <div
            style={{
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "3rem",
            }}
          >
            Loading reports...
          </div>
        )}
        {!loading && reports.length === 0 && (
          <div
            style={{
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "3rem",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid var(--ink-border)",
              borderRadius: "var(--r-md)",
            }}
          >
            No reports generated yet. Run your first analysis!
          </div>
        )}
        {!loading && reports.length > 0 && (
          <div className="le-panel-card">
            <div className="le-panel-title">Recent Analyses</div>
            {reports.map((r) => (
              <div
                key={r.report_id}
                className="le-report-row"
                onClick={() => onOpen(r.report_id)}
              >
                <div className="le-report-row-id">#{r.report_id}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="le-report-row-biz"
                    style={{ marginBottom: 3 }}
                  >
                    {(r.business_name || r.idea || r.report_id)?.slice(0, 90)}
                    {(r.business_name || r.idea || r.report_id)?.length > 90
                      ? "..."
                      : ""}
                  </div>
                  <div className="le-report-row-meta">
                    {formatReportMeta(r) || "Saved report"}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: "rgba(201,168,76,0.65)",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  View →
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CompareWorkspacePage({ seedReports, onOpen, onBack, onAnalyzeNew }) {
  const [reports, setReports] = useState(dedupeReports(seedReports));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const summaries = await fetchReportsAPI();
        const ids = summaries
          .slice(0, 6)
          .map((item) => item.id)
          .filter(Boolean);
        const fetched = await Promise.all(
          ids.map((id) => fetchReportAPI(id).catch(() => null)),
        );
        if (!cancelled)
          setReports(
            dedupeReports([...(seedReports || []), ...fetched.filter(Boolean)]),
          );
      } catch (e) {
        if (!cancelled)
          setError("Could not load enough reports for comparison.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [seedReports]);

  return (
    <div style={{ background: "var(--ink)", minHeight: "100vh" }}>
      <div className="le-page-shell">
        <div className="le-page-header">
          <div>
            <div className="le-page-eyebrow">Decision Support</div>
            <h2 className="le-page-title">Compare Business Reports</h2>
            <p className="le-page-sub">
              Review feasibility, risk, and compliance load side by side before
              picking the business model or state to pursue.
            </p>
          </div>
          <div className="le-page-actions">
            <button
              className="le-btn-primary"
              style={{ fontSize: 13, padding: "10px 20px" }}
              onClick={onAnalyzeNew}
            >
              Run Another Analysis
            </button>
            <button
              className="le-btn-outline"
              onClick={onBack}
              style={{ fontSize: 13 }}
            >
              Back
            </button>
          </div>
        </div>
        <div className="le-panel-card">
          {loading && (
            <div style={{ color: "var(--text-muted)" }}>
              Loading reports for comparison...
            </div>
          )}
          {!loading && error && (
            <div style={{ color: "var(--red)" }}>{error}</div>
          )}
          {!loading && <ComparisonView reports={reports} />}
        </div>
        {reports.length > 0 && (
          <div className="le-panel-card">
            <div className="le-panel-title">Open a full report</div>
            <div className="le-quick-grid">
              {reports.slice(0, 6).map((report) => (
                <button
                  key={report.report_id}
                  className="le-quick-action"
                  onClick={() => onOpen(report.report_id)}
                >
                  {report.business_name || report.report_id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FounderToolsPage({ onAnalyzeIdea, onBack }) {
  const [annualTurnover, setAnnualTurnover] = useState(18);
  const [investment, setInvestment] = useState(2);
  const [employees, setEmployees] = useState(6);
  const [state, setState] = useState("Maharashtra");

  const gstHint =
    annualTurnover >= 40
      ? "GST registration is likely required for many goods businesses."
      : annualTurnover >= 20
        ? "You may cross service thresholds depending on activity and state."
        : "You may be below common GST thresholds, but category-specific rules can still apply.";
  const msmeClass =
    investment <= 1 ? "Micro" : investment <= 10 ? "Small" : "Medium";
  const payrollRisk =
    employees >= 10
      ? "Labour law obligations become materially stronger here."
      : "Employment compliance is lighter, but contracts and records still matter.";

  const presets = [
    "Cloud kitchen in Mumbai with 6 employees and Swiggy/Zomato delivery",
    "D2C skincare brand selling online across India with warehousing in Pune",
    "UPSC EdTech platform with subscription payments and recorded courses",
    "Fintech platform offering small business invoice financing in Bengaluru",
  ];

  return (
    <div style={{ background: "var(--ink)", minHeight: "100vh" }}>
      <div className="le-page-shell">
        <div className="le-page-header">
          <div>
            <div className="le-page-eyebrow">Founder Tools</div>
            <h2 className="le-page-title">Plan Before You Analyze</h2>
            <p className="le-page-sub">
              Quick threshold checks and starter prompts for founders who want a
              sharper first analysis instead of a vague one-line query.
            </p>
          </div>
          <div className="le-page-actions">
            <button
              className="le-btn-outline"
              onClick={onBack}
              style={{ fontSize: 13 }}
            >
              Back
            </button>
          </div>
        </div>
        <div className="le-tool-grid">
          <div className="le-tool-card">
            <div className="le-panel-title">GST Threshold Lens</div>
            <div className="le-tool-label">
              Annual turnover estimate: Rs. {annualTurnover}L
            </div>
            <input
              className="le-calc-slider"
              type="range"
              min={1}
              max={100}
              step={1}
              value={annualTurnover}
              onChange={(e) => setAnnualTurnover(Number(e.target.value))}
            />
            <div className="le-tool-result">{gstHint}</div>
          </div>
          <div className="le-tool-card">
            <div className="le-panel-title">MSME Classification</div>
            <div className="le-tool-label">
              Plant / equipment investment: Rs. {investment}Cr
            </div>
            <input
              className="le-calc-slider"
              type="range"
              min={0}
              max={50}
              step={1}
              value={investment}
              onChange={(e) => setInvestment(Number(e.target.value))}
            />
            <div className="le-tool-result">
              Estimated bucket: <strong>{msmeClass}</strong> enterprise.
            </div>
          </div>
          <div className="le-tool-card">
            <div className="le-panel-title">Hiring Readiness</div>
            <div className="le-tool-label">Planned employees: {employees}</div>
            <input
              className="le-calc-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={employees}
              onChange={(e) => setEmployees(Number(e.target.value))}
            />
            <div className="le-tool-result">{payrollRisk}</div>
          </div>
          <div className="le-tool-card">
            <div className="le-panel-title">State Launch Prompt</div>
            <div className="le-tool-label">Preferred state</div>
            <select
              className="le-meta-select"
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              {[
                "Maharashtra",
                "Karnataka",
                "Delhi",
                "Telangana",
                "Tamil Nadu",
                "Gujarat",
                "West Bengal",
              ].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <div className="le-tool-result">
              Use this to pressure-test licenses before committing to launch in{" "}
              {state}.
            </div>
          </div>
        </div>
        <div className="le-panel-card">
          <div className="le-panel-title">Jump-start prompts</div>
          <div className="le-quick-grid">
            {presets.map((preset) => (
              <button
                key={preset}
                className="le-quick-action"
                onClick={() =>
                  onAnalyzeIdea({
                    idea: preset,
                    location: state,
                    scale: "startup",
                    mode: "both",
                    email: "",
                  })
                }
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const getInitialPage = () => {
    const path = window.location.pathname;
    if (path === "/report" || path.startsWith("/report/")) return "viewer";
    if (path === "/reports" || path === "/dashboard") return "dashboard";
    if (path === "/compare") return "compare";
    if (path === "/tools") return "tools";
    if (path === "/analyze") return "input";
    return "landing";
  };
  const getInitialReportId = () => {
    const path = window.location.pathname;
    const m = path.match(/^\/report\/([^/]+)/i);
    if (!m) return null;
    const raw = m[1].split(/[?#]/)[0].trim();
    return raw ? raw.toUpperCase() : null;
  };

  const [page, setPage] = useState(getInitialPage);
  const [viewReportId, setViewReportId] = useState(getInitialReportId);
  const [result, setResult] = useState(null);
  const [inputData, setInputData] = useState(null);
  const [error, setError] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [draftInput, setDraftInput] = useState(null);

  const navigate = (newPage, reportId = null) => {
    if (newPage === "viewer" && reportId) {
      const rid = String(reportId).toUpperCase();
      window.history.pushState({}, "", `/report/${rid}`);
      setViewReportId(rid);
    } else if (newPage === "dashboard")
      window.history.pushState({}, "", "/reports");
    else if (newPage === "compare")
      window.history.pushState({}, "", "/compare");
    else if (newPage === "tools") window.history.pushState({}, "", "/tools");
    else if (newPage === "landing") window.history.pushState({}, "", "/");
    else if (newPage === "input") window.history.pushState({}, "", "/analyze");
    setPage(newPage);
  };

  useEffect(() => {
    const handler = () => {
      setPage(getInitialPage());
      setViewReportId(getInitialReportId());
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("le_saved_reports");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setSavedReports(mergeReports(parsed));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "le_saved_reports",
        JSON.stringify(mergeReports(savedReports).slice(0, 20)),
      );
    } catch {}
  }, [savedReports]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [page, viewReportId]);

  async function handleAnalyze(params) {
    if (!params.idea.trim()) return;
    setInputData(params);
    setPage("loading");
    setError(null);
    window.history.pushState({}, "", "/analyze");
    let data = null,
      errMsg = null;
    try {
      data = await callAnalyzeAPI(params);
    } catch (e) {
      errMsg =
        e.name === "AbortError"
          ? "Request timed out — try again."
          : e.message || "Analysis failed.";
    }
    if (data) {
      const savedReport = normalizeReport({
        ...data,
        created_at: new Date().toISOString(),
        saved_at: new Date().toISOString(),
      });
      setResult(savedReport);
      setSavedReports((prev) => mergeReports([savedReport], prev).slice(0, 20));
      window.history.pushState({}, "", `/report/${data.report_id}`);
      setPage("results");
    } else {
      setError(errMsg);
      setPage("input");
    }
  }

  const goHome = () => {
    setResult(null);
    setError(null);
    setViewReportId(null);
    navigate("landing");
  };
  const openInputWithDraft = (draft = null) => {
    setDraftInput(draft);
    setResult(null);
    setError(null);
    navigate("input");
  };
  const navItems = [
    [
      "Analyze",
      () => openInputWithDraft(null),
      page === "input" || page === "results" || page === "viewer",
    ],
    ["Dashboard", () => navigate("dashboard"), page === "dashboard"],
    ["Compare", () => navigate("compare"), page === "compare"],
    ["Tools", () => navigate("tools"), page === "tools"],
  ];

  return (
    <div className="le-root">
      <style>{css}</style>
      <PointerGlow />
      <motion.nav
        role="navigation"
        aria-label="Main Navigation"
        className="le-nav"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <div className="le-nav-logo" onClick={goHome}>
          <div className="le-nav-logo-mark">L</div>
          <div>
            <div className="le-nav-name">LegalEase AI</div>
            <div className="le-nav-tag">India · Legal Intelligence</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="le-nav-links">
            {navItems.map(([label, action, active]) => (
              <button
                key={label}
                className={`le-nav-link${active ? " active" : ""}`}
                onClick={action}
              >
                {label}
              </button>
            ))}
          </div>
          {page === "results" && result && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              #{result.report_id}
            </span>
          )}
          <MagneticButton
            className="le-btn-ghost"
            style={{ fontSize: 11, padding: "5px 12px" }}
            onClick={() => navigate("dashboard")}
          >
            Past Reports
          </MagneticButton>
          <div className="le-nav-pill">Full Stack</div>
        </div>
      </motion.nav>
      {error && (
        <div
          style={{
            background: "rgba(224,82,82,0.12)",
            borderBottom: "2px solid var(--red)",
            padding: "0.85rem 2rem",
            color: "var(--red)",
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>⚠ {error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: "none",
              border: "none",
              color: "var(--red)",
              cursor: "pointer",
              fontWeight: 600,
              textDecoration: "underline",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={`${page}-${viewReportId || "root"}`}
          role="main"
          aria-live="polite"
          className="le-page-stage"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          {page === "landing" && (
            <LandingPage onStart={() => openInputWithDraft(null)} />
          )}
          {page === "input" && (
            <InputPage onAnalyze={handleAnalyze} initialValues={draftInput} />
          )}
          {page === "loading" && <LoadingPage />}
          {page === "results" && result && (
            <ResultsPage
              data={result}
              input={inputData}
              onReset={() => {
                setResult(null);
                setError(null);
                navigate("input");
              }}
              onAskQuestion={(q, prevInput) =>
                handleAnalyze({
                  idea: q,
                  location: prevInput.location,
                  scale: prevInput.scale,
                  mode: prevInput.mode,
                })
              }
              savedReports={savedReports}
            />
          )}
          {page === "viewer" && (
            <ReportViewerPage
              reportId={viewReportId}
              onBack={goHome}
              onAnalyze={handleAnalyze}
              savedReports={savedReports}
            />
          )}
          {page === "dashboard" && (
            <WorkspacePage
              seedReports={savedReports}
              onOpen={(id) => {
                setViewReportId(id);
                navigate("viewer", id);
              }}
              onBack={goHome}
              onCompare={() => navigate("compare")}
              onAnalyzeNew={() => openInputWithDraft(null)}
            />
          )}
          {page === "compare" && (
            <CompareWorkspacePage
              seedReports={savedReports}
              onOpen={(id) => {
                setViewReportId(id);
                navigate("viewer", id);
              }}
              onBack={() => navigate("dashboard")}
              onAnalyzeNew={() => openInputWithDraft(null)}
            />
          )}
          {page === "tools" && (
            <FounderToolsPage
              onAnalyzeIdea={(draft) => openInputWithDraft(draft)}
              onBack={goHome}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
