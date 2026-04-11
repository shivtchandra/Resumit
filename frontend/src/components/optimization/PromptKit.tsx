import { useState } from "react";

const GLOBAL_RULES = `You must follow these rules:
- Be specific and non-generic
- Be critical, not polite
- Avoid vague advice
- Use structured JSON output only
- Base reasoning strictly on input data
- If unsure, say "low confidence" instead of guessing`;

const AGENTS = [
  {
    id: "jd-analyzer",
    label: "01 · JD Analyzer",
    tag: "PARSING",
    color: "#0ea5e9",
    description: "Pulls out the hiring signal that actually matters: must-haves, ATS terms, seniority, hidden expectations.",
    model: "gpt-5.4-mini",
    maxTokens: 900,
    prompt: `${GLOBAL_RULES}

You are a senior recruiter and ATS system with 10+ years of experience.

Analyze the Job Description and extract structured insights.

Return ONLY valid JSON:

{
  "must_have_skills": [],
  "good_to_have_skills": [],
  "tools_and_technologies": [],
  "experience_level": "",
  "responsibilities": [],
  "soft_skills": [],
  "hidden_expectations": [],
  "keywords_for_ats": [],
  "role_focus": "",
  "seniority_signals": "",
  "confidence": "high/medium/low"
}

Guidelines:
- Infer hidden expectations from JD language only
- Separate MUST vs NICE skills clearly
- Extract ATS keywords as exact phrases
- Use "low confidence" if the JD is vague or too short

Job Description:
{{JD}}`,
  },
  {
    id: "resume-analyzer",
    label: "02 · Resume Analyzer",
    tag: "PARSING",
    color: "#0ea5e9",
    description: "Reads the resume like a hiring manager, not a keyword scraper. Depth over name-dropping.",
    model: "gpt-5.4-mini",
    maxTokens: 1000,
    prompt: `${GLOBAL_RULES}

You are an expert resume reviewer and hiring manager.

Analyze the candidate resume deeply.

Return ONLY valid JSON:

{
  "skills": {
    "technical": [],
    "tools": [],
    "domains": []
  },
  "projects": [
    {
      "name": "",
      "tech_stack": [],
      "impact": "",
      "complexity": "low/medium/high"
    }
  ],
  "experience_level": "",
  "strengths": [],
  "weaknesses": [],
  "missing_elements": [],
  "ats_keywords_present": [],
  "ats_keywords_missing": [],
  "confidence": "high/medium/low"
}

Guidelines:
- Evaluate real depth, not just listed skills
- Identify weak phrasing, vague claims, and shallow project evidence
- Detect missing measurable impact

Resume:
{{RESUME}}`,
  },
  {
    id: "gap-analyzer",
    label: "03 · Gap Analyzer",
    tag: "REASONING",
    color: "#f59e0b",
    description: "The score engine. This decides fit honestly, flags rejection risks, and identifies the gaps that actually matter.",
    model: "gpt-5.4",
    maxTokens: 1100,
    prompt: `${GLOBAL_RULES}

You are a brutally honest career coach and hiring panel.

Think step-by-step internally before answering.
Do not output reasoning.

Compare job requirements and candidate profile.

Return ONLY valid JSON:

{
  "match_score": 0,
  "confidence": "high/medium/low",
  "strong_matches": [],
  "missing_skills": [
    {"skill": "", "priority": "high/medium/low"}
  ],
  "weak_areas": [],
  "ats_keyword_gaps": [],
  "risk_flags": [],
  "short_summary": ""
}

Guidelines:
- Match score must reflect real hiring probability
- Highlight only critical missing skills
- Call out real rejection reasons, not generic advice

JD Analysis:
{{JD_ANALYSIS}}

Resume Analysis:
{{RESUME_ANALYSIS}}`,
  },
  {
    id: "resume-fixer",
    label: "04 · Resume Fixer",
    tag: "REWRITE",
    color: "#22c55e",
    description: "Converts analysis into copyable edits. Grounded, sharper, and ATS-clean.",
    model: "gpt-5.4-mini",
    maxTokens: 1000,
    prompt: `${GLOBAL_RULES}

You are a top-tier resume writer specializing in FAANG-level resumes.

Improve the resume based on gaps.

Return ONLY valid JSON:

{
  "improved_bullets": [
    {
      "original": "",
      "improved": ""
    }
  ],
  "keyword_additions": [],
  "project_improvements": [],
  "formatting_fixes": [],
  "ats_optimization_tips": []
}

Guidelines:
- Add measurable impact only if the source text supports it
- Use strong action verbs
- Avoid fluff, filler, and fake metrics

Resume:
{{RESUME}}

Gap Analysis:
{{GAP_ANALYSIS}}`,
  },
  {
    id: "project-recommender",
    label: "05 · Project Recommender",
    tag: "REASONING",
    color: "#f59e0b",
    description: "Closes missing-skill gaps with portfolio projects worth putting on a resume.",
    model: "gpt-5.4",
    maxTokens: 1000,
    prompt: `${GLOBAL_RULES}

You are a hiring manager designing ideal candidate portfolios.

Think step-by-step internally before answering.
Do not output reasoning.

Suggest high-impact projects to close skill gaps.

Return ONLY valid JSON:

{
  "projects": [
    {
      "title": "",
      "problem_statement": "",
      "tech_stack": [],
      "key_features": [],
      "why_this_matters": "",
      "difficulty": "medium/high"
    }
  ]
}

Guidelines:
- Avoid generic projects like todo apps or simple clones
- Align strictly with missing skills
- Make each project resume-worthy and interview-useful

Gap Analysis:
{{GAP_ANALYSIS}}`,
  },
  {
    id: "company-intelligence",
    label: "06 · Company Intelligence",
    tag: "CONTEXT",
    color: "#e11d48",
    description: "Provides a realistic read on the hiring situation without pretending to know live company data.",
    model: "gpt-5.4-mini",
    maxTokens: 800,
    prompt: `${GLOBAL_RULES}

You are a company intelligence analyst.

Analyze hiring patterns and company strategy.

Return ONLY valid JSON:

{
  "hiring_intensity": "aggressive/moderate/low/freeze",
  "hiring_trend": "increasing/stable/decreasing",
  "hiring_focus": [],
  "hiring_style": "mass/selective/bullseye",
  "risk_signals": [],
  "strategy_signal": "",
  "getting_in_difficulty": "low/medium/high",
  "hiring_score": 0,
  "candidate_advice": "",
  "confidence": "high/medium/low"
}

Guidelines:
- Infer from the JD and industry patterns only
- Be realistic, not optimistic
- Avoid generic company descriptions
- Use "low confidence" when the JD is sparse

Job Description:
{{JD}}`,
  },
];

const PRODUCT_OPTIMIZATIONS = [
  {
    title: "Parallelize the cheap work",
    detail: "Run JD Analyzer and Resume Analyzer together. They are extraction tasks, not deep reasoning tasks.",
  },
  {
    title: "Gate expensive agents",
    detail: "Only run Project Recommender when there are at least 2 meaningful missing skills. Only run Company Intelligence when the JD or company field gives enough signal.",
  },
  {
    title: "Compose locally",
    detail: "Do the final merge in your app code, not with another expensive reasoning call. That keeps latency down and makes schemas easier to control.",
  },
  {
    title: "Surface proof, not just advice",
    detail: "Every miss should tell the user where to fix it, what proof to add, and which JD signal it addresses.",
  },
  {
    title: "Prefer fast model first",
    detail: "Use a mini model on parsing, formatting, and company signal inference. Escalate only the gap and project reasoning to the larger model.",
  },
];

const MODEL_STRATEGY = [
  { agent: "JD Analyzer", model: "gpt-5.4-mini", reason: "Fast structured extraction with strong enough quality." },
  { agent: "Resume Analyzer", model: "gpt-5.4-mini", reason: "Resume parsing is mostly grounded extraction, so speed wins." },
  { agent: "Gap Analyzer", model: "gpt-5.4", reason: "This is the highest-stakes reasoning step. Wrong here poisons the rest of the flow." },
  { agent: "Resume Fixer", model: "gpt-5.4-mini", reason: "Grounded rewriting with strict constraints is fast and reliable on mini." },
  { agent: "Project Recommender", model: "gpt-5.4", reason: "Project ideas get generic fast on smaller models. This is where the smarter model earns its keep." },
  { agent: "Company Intelligence", model: "gpt-5.4-mini", reason: "Useful as an inferred signal layer, but not worth a slow premium pass." },
  { agent: "Final Composer", model: "app code", reason: "Merge and dedupe locally for lower latency and cleaner contracts." },
];

const FINAL_OUTPUT = `{
  "match_score": 72,
  "summary": "",
  "strengths": [],
  "gaps": [],
  "improvements": [],
  "projects": [],
  "company_insights": {},
  "action_plan_30_days": [
    "Week 1: Learn Docker basics",
    "Week 2: Build mini project",
    "Week 3: Add to resume",
    "Week 4: Apply to 20 roles"
  ]
}`;

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  PARSING: { bg: "#0c2340", text: "#7dd3fc" },
  REASONING: { bg: "#2d1b00", text: "#fbbf24" },
  REWRITE: { bg: "#052e16", text: "#86efac" },
  CONTEXT: { bg: "#3b0a1e", text: "#fda4af" },
};

export const PromptKit = () => {
  const [activeAgent, setActiveAgent] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("prompt");

  const agent = AGENTS[activeAgent];

  const handleCopy = () => {
    navigator.clipboard.writeText(agent.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        fontFamily: "'Berkeley Mono', 'JetBrains Mono', 'Fira Code', monospace",
        background: "#080b0f",
        color: "#e2e8f0",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #1e2a38",
      }}
    >
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #1e2a38",
          background: "linear-gradient(180deg, #0d1117 0%, #080b0f 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 8px #10b981",
            }}
          />
          <span style={{ fontSize: 10, color: "#4b5563", letterSpacing: 3, textTransform: "uppercase" }}>
            Resumit · Prompt Kit
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 9,
              background: "#0d2818",
              color: "#10b981",
              padding: "2px 8px",
              borderRadius: 4,
              border: "1px solid #065f46",
              letterSpacing: 2,
            }}
          >
            v2 · 6 AGENTS
          </span>
        </div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>
          Match & Fix Production Prompt Kit
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
          Faster routing, stricter schemas, local composition, and prompts tuned for real hiring signal.
        </p>
      </div>

      <div style={{ display: "flex", minHeight: 560 }}>
        <div
          style={{
            width: 220,
            borderRight: "1px solid #1e2a38",
            background: "#0a0e14",
            flexShrink: 0,
            overflowY: "auto",
            padding: "12px 0",
          }}
        >
          {AGENTS.map((a, i) => {
            const tc = TAG_COLORS[a.tag];
            return (
              <button
                key={a.id}
                onClick={() => {
                  setActiveAgent(i);
                  setActiveTab("prompt");
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 14px",
                  background: activeAgent === i ? "#0f1a26" : "transparent",
                  border: "none",
                  borderLeft: activeAgent === i ? `2px solid ${a.color}` : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 10, color: activeAgent === i ? "#f1f5f9" : "#94a3b8", fontWeight: 600 }}>
                  {a.label}
                </div>
                <div
                  style={{
                    marginTop: 3,
                    fontSize: 8,
                    display: "inline-block",
                    background: tc.bg,
                    color: tc.text,
                    padding: "1px 5px",
                    borderRadius: 3,
                    letterSpacing: 1.5,
                  }}
                >
                  {a.tag}
                </div>
              </button>
            );
          })}

          <div style={{ margin: "12px 0", borderTop: "1px solid #1e2a38" }} />

          {(["model-strategy", "orchestration", "final-output"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveAgent(-1);
                setActiveTab(tab);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "9px 14px",
                background: activeTab === tab && activeAgent === -1 ? "#0f1a26" : "transparent",
                border: "none",
                borderLeft: activeTab === tab && activeAgent === -1 ? "2px solid #6366f1" : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 10, color: activeTab === tab && activeAgent === -1 ? "#f1f5f9" : "#64748b", fontWeight: 600 }}>
                {tab === "model-strategy" ? "Model Strategy" : tab === "orchestration" ? "Usefulness Optimizations" : "Final Output"}
              </div>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
          {activeAgent >= 0 && (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{agent.label}</span>
                    <span
                      style={{
                        fontSize: 9,
                        background: TAG_COLORS[agent.tag].bg,
                        color: TAG_COLORS[agent.tag].text,
                        padding: "2px 7px",
                        borderRadius: 4,
                        letterSpacing: 2,
                      }}
                    >
                      {agent.tag}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{agent.description}</p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {(["prompt", "meta"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: "4px 12px",
                        fontSize: 10,
                        fontFamily: "inherit",
                        background: activeTab === tab ? agent.color : "#0f1a26",
                        color: activeTab === tab ? "#fff" : "#64748b",
                        border: `1px solid ${activeTab === tab ? agent.color : "#1e2a38"}`,
                        borderRadius: 5,
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === "prompt" && (
                <div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                    {[
                      { label: "Model", value: agent.model },
                      { label: "max_tokens", value: agent.maxTokens },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          padding: "3px 10px",
                          background: "#0d1117",
                          border: "1px solid #1e2a38",
                          borderRadius: 5,
                        }}
                      >
                        <span style={{ fontSize: 9, color: "#4b5563" }}>{item.label}: </span>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      background: "#0d1117",
                      border: "1px solid #1e2a38",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 14px",
                        borderBottom: "1px solid #1e2a38",
                        background: "#0a0e14",
                      }}
                    >
                      <span style={{ fontSize: 9, color: "#4b5563", letterSpacing: 2 }}>SYSTEM PROMPT</span>
                      <button
                        onClick={handleCopy}
                        style={{
                          padding: "3px 12px",
                          fontSize: 9,
                          fontFamily: "inherit",
                          background: copied ? "#022c22" : "#0f1a26",
                          color: copied ? "#10b981" : "#64748b",
                          border: `1px solid ${copied ? "#065f46" : "#1e2a38"}`,
                          borderRadius: 4,
                          cursor: "pointer",
                          letterSpacing: 1,
                          transition: "all 0.2s",
                        }}
                      >
                        {copied ? "COPIED" : "COPY"}
                      </button>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        padding: "16px",
                        fontSize: 11,
                        lineHeight: 1.7,
                        color: "#cbd5e1",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        maxHeight: 400,
                        overflowY: "auto",
                      }}
                    >
                      {agent.prompt}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === "meta" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ background: "#0d1117", border: "1px solid #1e2a38", borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: 2, marginBottom: 12 }}>PIPELINE POSITION</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {AGENTS.map((item, index) => (
                        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div
                            style={{
                              padding: "3px 8px",
                              borderRadius: 4,
                              fontSize: 9,
                              background: index === activeAgent ? agent.color : "#0f1a26",
                              color: index === activeAgent ? "#fff" : "#4b5563",
                              border: `1px solid ${index === activeAgent ? agent.color : "#1e2a38"}`,
                            }}
                          >
                            {item.label.split("·")[0].trim()}
                          </div>
                          {index < AGENTS.length - 1 && <span style={{ color: "#1e2a38", fontSize: 10 }}>→</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: "#0d1117", border: "1px solid #1e2a38", borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: 2, marginBottom: 12 }}>INPUT VARIABLES</div>
                    {(agent.prompt.match(/\{\{[A-Z_]+\}\}/g)?.filter((value, index, array) => array.indexOf(value) === index) || []).map((value) => (
                      <div
                        key={value}
                        style={{
                          padding: "5px 10px",
                          background: "#0a0e14",
                          border: "1px solid #1e2a38",
                          borderRadius: 5,
                          marginBottom: 6,
                          fontSize: 11,
                          color: "#fbbf24",
                        }}
                      >
                        {value}
                      </div>
                    ))}
                    {!agent.prompt.match(/\{\{[A-Z_]+\}\}/g) && <span style={{ fontSize: 11, color: "#4b5563" }}>No template variables</span>}
                  </div>
                </div>
              )}
            </>
          )}

          {activeAgent === -1 && activeTab === "model-strategy" && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Model Strategy</h3>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>
                Official OpenAI guidance makes the tradeoff pretty clean right now: use `gpt-5.4-mini` when latency matters, and reserve `gpt-5.4` for the reasoning steps that determine score quality and project quality.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {MODEL_STRATEGY.map((item) => (
                  <div
                    key={item.agent}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "140px 130px 1fr",
                      gap: 12,
                      padding: "10px 14px",
                      background: "#0d1117",
                      border: "1px solid #1e2a38",
                      borderRadius: 7,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{item.agent}</span>
                    <span
                      style={{
                        fontSize: 9,
                        color: item.model.includes("mini") ? "#7dd3fc" : item.model === "app code" ? "#c4b5fd" : "#fbbf24",
                        background: item.model.includes("mini") ? "#0c2340" : item.model === "app code" ? "#22134d" : "#2d1b00",
                        padding: "2px 7px",
                        borderRadius: 4,
                        letterSpacing: 0.5,
                      }}
                    >
                      {item.model}
                    </span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>{item.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeAgent === -1 && activeTab === "orchestration" && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Usefulness Optimizations</h3>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>
                This is the product layer that makes Match & Fix feel useful instead of slow, noisy, and repetitive.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {PRODUCT_OPTIMIZATIONS.map((item) => (
                  <div
                    key={item.title}
                    style={{
                      padding: "12px 14px",
                      background: "#0d1117",
                      border: "1px solid #1e2a38",
                      borderRadius: 7,
                    }}
                  >
                    <div style={{ fontSize: 11, color: "#f1f5f9", fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeAgent === -1 && activeTab === "final-output" && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Final Output Contract</h3>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>
                Keep the user-facing payload small, readable, and easy to render. The final composer should merge, dedupe, and prioritize instead of rethinking the whole analysis.
              </p>
              <div
                style={{
                  background: "#0d1117",
                  border: "1px solid #1e2a38",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "8px 14px",
                    borderBottom: "1px solid #1e2a38",
                    background: "#0a0e14",
                    fontSize: 9,
                    color: "#4b5563",
                    letterSpacing: 2,
                  }}
                >
                  FINAL JSON
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: "16px",
                    fontSize: 11,
                    lineHeight: 1.7,
                    color: "#cbd5e1",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {FINAL_OUTPUT}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
