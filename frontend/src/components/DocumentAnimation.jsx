import { motion } from "framer-motion";

const DOCS = [
  {
    id: 1,
    label: "Document 01",
    title: "GST Registration",
    accent: "#E57373",
    meta: "Core compliance",
    lines: [
      "PAN Card of proprietor",
      "Aadhaar Card",
      "Business address proof",
      "Bank account details",
    ],
  },
  {
    id: 2,
    label: "Document 02",
    title: "Risk Score Analysis",
    accent: "#64B5F6",
    meta: "Deterministic engine",
    lines: [
      "Compliance Score: 72/100",
      "Risk Level: Medium",
      "5 actions required",
      "2 critical issues",
    ],
  },
  {
    id: 3,
    label: "Document 03",
    title: "Action Plan",
    accent: "#81C995",
    meta: "Execution roadmap",
    lines: [
      "Week 1: Apply FSSAI",
      "Week 2: GST registration",
      "Week 3: Udyam (MSME)",
      "Week 4: Trade license",
    ],
  },
];

function DocumentCard({ doc, index, featured = false }) {
  return (
    <motion.article
      className={`le-doc-card${featured ? " featured" : ""}`}
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: "easeOut" }}
      viewport={{ once: true, margin: "-80px" }}
    >
      <div className="le-doc-card-top">
        <div>
          <div className="le-doc-card-label">{doc.label}</div>
          <h3 className="le-doc-card-title">{doc.title}</h3>
        </div>
        <span
          className="le-doc-card-badge"
          style={{
            color: doc.accent,
            borderColor: `${doc.accent}40`,
            background: `${doc.accent}14`,
          }}
        >
          {doc.meta}
        </span>
      </div>

      <div className="le-doc-card-divider" />

      <div className="le-doc-card-lines">
        {doc.lines.map((line) => (
          <div key={line} className="le-doc-card-line">
            <span
              className="le-doc-card-dot"
              style={{ background: doc.accent }}
            />
            <span>{line}</span>
          </div>
        ))}
      </div>
    </motion.article>
  );
}

export default function DocumentAnimation() {
  return (
    <section className="le-doc-showcase">
      <div className="le-container">
        <motion.div
          className="le-doc-showcase-head"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="le-section-label">Inside The Report</div>
          <h2 className="le-section-h2">
            Every report arrives as a usable
            <br />
            <em>document stack</em>
          </h2>
          <p className="le-section-sub">
            Licenses, risk diagnostics, and the action plan are presented as
            clear working cards instead of a blank scrolling area.
          </p>
        </motion.div>

        <div className="le-doc-showcase-stage">
          <div className="le-doc-showcase-glow" />
          <motion.div
            className="le-doc-showcase-grid"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            viewport={{ once: true, margin: "-120px" }}
          >
            {DOCS.map((doc, index) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                index={index}
                featured={doc.id === 3}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
