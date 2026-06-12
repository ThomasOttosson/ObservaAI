import "./App.css";
import { useState, useEffect } from "react";
import logo from "./assets/logo14.png";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://web-production-392e59.up.railway.app";

console.log("API_URL =", API_URL);

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [registerError, setRegisterError] = useState("");
  const [aiServiceError, setAiServiceError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [dragActive, setDragActive] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [incidentTimeline, setIncidentTimeline] = useState([]);
  const [rootCause, setRootCause] = useState(null);
  const [affectedServices, setAffectedServices] = useState([]);
  const [analysisMode, setAnalysisMode] = useState("security");
  const [splunkQueries, setSplunkQueries] = useState([]);
  const [runbookSteps, setRunbookSteps] = useState([]);
  const [businessImpact, setBusinessImpact] = useState(null);
  const [mttrEstimate, setMttrEstimate] = useState(null);
  const [showDemoIncident, setShowDemoIncident] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [incidentHealthScore, setIncidentHealthScore] = useState(null);
  const [splunkBaseUrl, setSplunkBaseUrl] = useState(
    localStorage.getItem("splunkBaseUrl") || "",
  );
  const [incidentHistory, setIncidentHistory] = useState(() => {
    const saved = localStorage.getItem("incidentHistory");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    console.log("TOKEN CHANGED:", token);
  }, [token]);

  useEffect(() => {
    localStorage.setItem("incidentHistory", JSON.stringify(incidentHistory));
  }, [incidentHistory]);

  useEffect(() => {
    setScores((prev) => ({
      ...prev,
      observability: "N/A",
      reliability: "N/A",
      severity: "N/A",
    }));
  }, []);

  console.log("TOKEN:", token);

  const [stats, setStats] = useState({
    total_analyses: 0,
    favorite_analyses: 0,
    latest_analysis: null,
    analyses_per_day: [],
    score_history: [],
    average_scores: {
      architecture: 0,
      security: 0,
      performance: 0,
      production: 0,
      observability: "-",
      reliability: "-",
      severity: "-",
    },
  });

  const [scores, setScores] = useState({
    architecture: "-",
    security: "-",
    performance: "-",
    production: "-",
  });

  useEffect(() => {
    if (token) {
      loadUser();
      loadHistory();
      loadStats();
    }
  }, [token]);

  const loadHistory = async () => {
    if (!token) {
      setHistory([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/history/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setHistory([]);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setHistory(data);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error(error);
      setHistory([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      setStats({
        total_analyses: data.total_analyses || 0,
        favorite_analyses: data.favorite_analyses || 0,
        latest_analysis: data.latest_analysis || null,
        analyses_per_day: data.analyses_per_day || [],
        score_history: data.score_history || [],

        total_lines_analyzed: data.total_lines_analyzed || 0,

        avg_response_time: data.avg_response_time || 0,

        average_scores: data.average_scores || {
          architecture: 0,
          security: 0,
          performance: 0,
          production: 0,
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const extractScores = (text = "") => {
    const architecture = text.match(/Architecture:\s*(\d+)\/10/i)?.[1] || "-";

    const security = text.match(/Security:\s*(\d+)\/10/i)?.[1] || "-";

    const performance = text.match(/Performance:\s*(\d+)\/10/i)?.[1] || "-";

    const production =
      text.match(/Production Readiness:\s*(\d+)\/10/i)?.[1] || "-";

    setScores({
      architecture,
      security,
      performance,
      production,
    });
  };

  const deleteAnalysis = async (id) => {
    try {
      await fetch(`${API_URL}/api/delete/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      loadHistory();
      loadStats();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await fetch(`${API_URL}/api/favorite/${id}/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      loadHistory();
    } catch (error) {
      console.error(error);
    }
  };

  const register = async () => {
    try {
      setRegisterError("");
      setRegisterSuccess("");

      const response = await fetch(`${API_URL}/api/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRegisterSuccess("Account created. You can now login.");
        setAuthMode("login");
        setPassword("");
      } else {
        setRegisterError(data.error || "Could not create account.");
      }
    } catch (error) {
      console.error(error);
      setRegisterError("Failed to connect to server.");
    }
  };

  const login = async () => {
    try {
      console.log("USERNAME VALUE:", username);
      console.log("PASSWORD VALUE:", password);

      const response = await fetch(`${API_URL}/api/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      console.log("STATUS:", response.status);

      const data = await response.json();

      console.log("DATA:", data);

      if (data.access) {
        console.log("ACCESS TOKEN RECEIVED");

        localStorage.setItem("token", data.access);

        console.log("LOCALSTORAGE TOKEN:", localStorage.getItem("token"));

        setToken(data.access);

        setLoggedIn(true);

        setUsername("");
        setPassword("");
        setLoginError("");
        setShowLoginModal(false);
      } else {
        setLoginError("Invalid username or password");
      }
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      setLoginError("Failed to connect to server");
    }
  };

  const sendMessage = async () => {
    if (!token) {
      alert("Please login first");
      setShowLoginModal(true);
      return;
    }

    if (!message.trim() && files.length === 0) return;

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("message", message);
      formData.append("analysis_mode", analysisMode);

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`${API_URL}/api/chat/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        setToken("");
        setShowLoginModal(true);
        return;
      }

      const data = await response.json();

      if (response.status === 503) {
        setAiServiceError(
          data.reply ||
            "AI service is not configured yet. Please add GEMINI_API_KEY on the backend.",
        );
        setMessages((prev) => [
          ...prev,
          {
            user: message || `Uploaded ${files.length} file(s)`,
            assistant:
              data.reply ||
              "AI service is not configured yet. Please add GEMINI_API_KEY on the backend.",
          },
        ]);

        return;
      }

      extractScores(data.reply || "");

      if (data?.incident_data) {
        const incident = data.incident_data;

        const observability = incident?.incident_scores?.observability ?? 0;
        const reliability = incident?.incident_scores?.reliability ?? 0;
        const security = incident?.incident_scores?.security ?? 0;

        const healthScore = Math.round(
          ((observability + reliability + security) / 30) * 100,
        );

        setIncidentHealthScore(healthScore);

        setExecutiveSummary(incident?.summary || "");

        setScores((prev) => ({
          ...prev,
          observability: incident?.incident_scores?.observability ?? "-",
          security: incident?.incident_scores?.security ?? prev.security,
          reliability: incident?.incident_scores?.reliability ?? "-",
          severity: incident?.incident_scores?.severity ?? "-",
        }));

        setRootCause(incident?.root_cause || null);

        setIncidentTimeline(
          Array.isArray(incident?.timeline) ? incident.timeline : [],
        );

        setAffectedServices(
          Array.isArray(incident?.affected_services)
            ? incident.affected_services
            : [],
        );

        setSplunkQueries(
          Array.isArray(incident?.splunk_queries)
            ? incident.splunk_queries
            : [],
        );

        setRunbookSteps(
          Array.isArray(incident?.runbook_steps) ? incident.runbook_steps : [],
        );

        setBusinessImpact(incident?.business_impact || null);

        setMttrEstimate(incident?.mttr_estimate || null);

        setIncidentHistory((prev) => [
          {
            date: new Date().toLocaleString(),
            severity: incident?.incident_scores?.severity || "Unknown",
            summary: incident?.summary || "No summary available",
          },
          ...prev,
        ]);
      }

      setMessages((prev) => [
        ...prev,
        {
          user: message || `Uploaded ${files.length} file(s)`,
          assistant: data.reply || "No response received.",
        },
      ]);

      await loadHistory();
      await loadStats();

      setMessage("");
      setFiles([]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          user: message || "File upload",
          assistant: "Failed to connect to backend.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUsername("");
    setPassword("");
    setMessages([]);
    setHistory([]);
    setLoggedIn(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);

    const allowedFiles = droppedFiles.filter((file) =>
      [".py", ".txt", ".zip", ".log"].some((ext) =>
        file.name.toLowerCase().endsWith(ext),
      ),
    );

    setFiles((prev) => [...prev, ...allowedFiles]);
  };

  const tryDemoIncident = async () => {
    if (showDemoIncident) {
      setShowDemoIncident(false);
      setIncidentTimeline([]);
      setRootCause(null);
      setAffectedServices([]);
      setSplunkQueries([]);
      setRunbookSteps([]);
      setBusinessImpact(null);
      setMttrEstimate(null);
      setExecutiveSummary("");
      setIncidentHealthScore(null);
      setMessage("");
      return;
    }

    if (!token) {
      alert("Please login first");
      setShowLoginModal(true);
      return;
    }

    const demoLogs = `Analyze this production incident:

2026-06-09 12:00:01 ERROR Database connection timeout on /api/token/
2026-06-09 12:00:03 ERROR Login failed for multiple users
2026-06-09 12:00:05 CRITICAL Authentication service unavailable
2026-06-09 12:00:08 WARNING Response time increased to 8.4s
2026-06-09 12:00:12 ERROR Gunicorn worker timeout
`;

    setShowDemoIncident(true);
    setMessage(demoLogs);
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("message", demoLogs);
      formData.append("analysis_mode", "security");

      const response = await fetch(`${API_URL}/api/chat/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        setToken("");
        setShowLoginModal(true);
        return;
      }

      const data = await response.json();

      if (response.status === 503) {
        setMessages((prev) => [
          ...prev,
          {
            user: "Try Demo Incident",
            assistant:
              data.reply ||
              "AI service is not configured yet. Please add GEMINI_API_KEY on the backend.",
          },
        ]);

        return;
      }

      if (data?.incident_data) {
        const incident = data.incident_data;

        setExecutiveSummary(incident?.summary || "");

        setRootCause(incident?.root_cause || null);

        setIncidentTimeline(
          Array.isArray(incident?.timeline) ? incident.timeline : [],
        );

        setAffectedServices(
          Array.isArray(incident?.affected_services)
            ? incident.affected_services
            : [],
        );

        setSplunkQueries(
          Array.isArray(incident?.splunk_queries)
            ? incident.splunk_queries
            : [],
        );

        setRunbookSteps(
          Array.isArray(incident?.runbook_steps) ? incident.runbook_steps : [],
        );

        setBusinessImpact(incident?.business_impact || null);

        setMttrEstimate(incident?.mttr_estimate || null);

        const observability = incident?.incident_scores?.observability ?? 0;
        const reliability = incident?.incident_scores?.reliability ?? 0;
        const security = incident?.incident_scores?.security ?? 0;

        const healthScore = Math.round(
          ((observability + reliability + security) / 30) * 100,
        );

        setIncidentHealthScore(healthScore);

        setScores((prev) => ({
          ...prev,
          observability,
          security,
          reliability,
          severity: incident?.incident_scores?.severity || "-",
        }));

        setIncidentHistory((prev) => [
          {
            date: new Date().toLocaleString(),
            severity: incident?.incident_scores?.severity || "Unknown",
            summary: incident?.summary || "Demo incident analyzed",
          },
          ...prev,
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            user: "Try Demo Incident",
            assistant: data.reply || "No structured incident data received.",
          },
        ]);
      }

      await loadHistory();
      await loadStats();
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          user: "Try Demo Incident",
          assistant: "Failed to analyze demo incident.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreClass = () => {
    if (incidentHealthScore < 40) {
      return "health-critical";
    }

    if (incidentHealthScore < 70) {
      return "health-warning";
    }

    return "health-good";
  };

  const loadUser = async () => {
    const response = await fetch(`${API_URL}/api/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    setUsername(data.username);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);

      alert("Query copied to clipboard");
    } catch (error) {
      console.error(error);

      alert("Could not copy query");
    }
  };

  return (
    <div className="container">
      <div className="logo-container">
        <img src={logo} alt="ObservaAI" className="logo" />
        <p className="logo-subtitle">
          AI-powered security and observability analysis
        </p>
      </div>

      {username && <h3>Logged in as: {username}</h3>}

      <div className="stats-panel">
        <div className="score-board">
          <div className="score-card">
            <h3>Avg Architecture</h3>
            <h2>{stats.average_scores?.architecture}</h2>
          </div>

          <div className="score-card">
            <h3>Avg Security</h3>
            <h2>{stats.average_scores?.security}</h2>
          </div>

          <div className="score-card">
            <h3>Avg Performance</h3>
            <h2>{stats.average_scores?.performance}</h2>
          </div>

          <div className="score-card">
            <h3>Avg Production</h3>
            <h2>{stats.average_scores?.production}</h2>
          </div>
        </div>
        <div className="stat-card">
          <h3>Total Analyses</h3>
          <h2>{stats.total_analyses}</h2>
        </div>

        <div className="stat-card">
          <h3>Favorite Analyses</h3>
          <h2>{stats.favorite_analyses}</h2>
        </div>

        <div className="stat-card">
          <h3>Latest Analysis</h3>

          <p>
            {stats.latest_analysis
              ? new Date(stats.latest_analysis).toLocaleString()
              : "No analyses yet"}
          </p>
        </div>

        <div className="stat-card">
          <h3>Total Lines Analyzed</h3>
          <h2>{stats.total_lines_analyzed}</h2>
        </div>

        <div className="stat-card">
          <h3>Avg Response Time</h3>
          <h2>{stats.avg_response_time}s</h2>
        </div>
      </div>

      <div className="chart-card">
        <h3>Score Trends</h3>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={stats.score_history}>
            <XAxis dataKey="date" />
            <YAxis domain={[0, 10]} />
            <Tooltip />

            <Line type="monotone" dataKey="architecture" name="Architecture" />
            <Line type="monotone" dataKey="security" name="Security" />
            <Line type="monotone" dataKey="performance" name="Performance" />
            <Line type="monotone" dataKey="production" name="Production" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Analyses Over Time</h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.analyses_per_day}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />

            <Line type="monotone" dataKey="total" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Response Time Over Time</h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.score_history}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />

            <Line
              type="monotone"
              dataKey="response_time"
              name="Response Time (s)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <input
        type="text"
        placeholder="Search history..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}
      />

      <div
        style={{
          marginBottom: "10px",
        }}
      >
        <label>
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={() => setShowFavoritesOnly(!showFavoritesOnly)}
          />
          Show Favorites Only
        </label>
      </div>

      <div className="history-panel">
        <h3>History</h3>

        {history.length === 0 && <p>No previous analyses.</p>}

        {history
          .filter((item) =>
            item.prompt.toLowerCase().includes(searchTerm.toLowerCase()),
          )
          .filter((item) => (showFavoritesOnly ? item.favorite : true))
          .map((item) => (
            <div key={item.id} className="history-item">
              <div
                onClick={() => {
                  extractScores(item.response || "");

                  setMessages([
                    {
                      user: item.prompt,
                      assistant: item.response,
                    },
                  ]);
                }}
                style={{
                  cursor: "pointer",
                  marginBottom: "10px",
                }}
              >
                {item.prompt}
              </div>

              <button
                onClick={() => {
                  window.open(`${API_URL}/api/export/${item.id}/`, "_blank");
                }}
              >
                Export PDF
              </button>

              <button onClick={() => toggleFavorite(item.id)}>
                {item.favorite ? "⭐" : "☆"}
              </button>

              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete this analysis?",
                    )
                  ) {
                    deleteAnalysis(item.id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          ))}
      </div>

      {messages.length > 0 && (
        <div className="score-board">
          <div className="score-card">
            <h3>Architecture</h3>
            <h2>{scores.architecture}/10</h2>
          </div>

          <div className="score-card">
            <h3>Security</h3>
            <h2>{scores.security}/10</h2>
          </div>

          <div className="score-card">
            <h3>Performance</h3>
            <h2>{scores.performance}/10</h2>
          </div>

          <div className="score-card">
            <h3>Production</h3>
            <h2>{scores.production}/10</h2>
          </div>

          <div className="score-card">
            <h3>Observability</h3>
            <h2>{scores.observability}</h2>
          </div>

          <div className="score-card">
            <h3>Reliability</h3>
            <h2>{scores.reliability}</h2>
          </div>

          <div className="score-card">
            <h3>Severity</h3>
            <h2>{scores.severity}</h2>
          </div>
        </div>
      )}

      <div className="mode-selector">
        <button
          className={analysisMode === "security" ? "active-mode" : ""}
          onClick={() => setAnalysisMode("security")}
        >
          Security &<br />
          Observability Mode
        </button>

        <button
          className={analysisMode === "code" ? "active-mode" : ""}
          onClick={() => setAnalysisMode("code")}
        >
          Code Review
          <br />
          Mode
        </button>
      </div>
      {incidentTimeline.length > 0 && (
        <div className="timeline-card">
          <h3>Incident Timeline</h3>

          {incidentTimeline.map((item, index) => (
            <div key={index} className="timeline-item">
              <strong>{item.time}</strong>

              <span>{item.event}</span>
            </div>
          ))}
        </div>
      )}

      {incidentHealthScore !== null && (
        <div className="health-score-card">
          <h3>Incident Health Score</h3>
          <div className={`health-score-number ${getHealthScoreClass()}`}>
            {incidentHealthScore}/100
          </div>
        </div>
      )}

      {executiveSummary && (
        <div className="executive-summary-card">
          <h3>Executive Summary</h3>

          <p>{executiveSummary}</p>
        </div>
      )}

      {rootCause && (
        <div className="root-cause-card">
          <h3>Root Cause Analysis</h3>

          <div>
            <strong>Cause</strong>
            <p>{rootCause.cause}</p>
          </div>

          <div>
            <strong>Impact</strong>
            <p>{rootCause.impact}</p>
          </div>

          <div>
            <strong>Severity</strong>

            <span
              className={`severity-badge severity-${rootCause.severity.toLowerCase()}`}
            >
              {rootCause.severity}
            </span>
          </div>

          <div>
            <button
              className="export-incident-btn"
              onClick={() => window.print()}
            >
              Export Incident Report
            </button>
            <strong>Recommended Fix</strong>
            <p>{rootCause.fix}</p>
          </div>
        </div>
      )}
      {affectedServices.length > 0 && (
        <div className="services-card">
          <h3>Affected Services</h3>

          {affectedServices.map((service, index) => (
            <div key={index} className="service-row">
              <span>{service.name}</span>

              <span className={`service-status status-${service.status}`}>
                {service.status}
              </span>
            </div>
          ))}
        </div>
      )}
      {splunkQueries.length > 0 && (
        <>
          <div className="splunk-url-card">
            <h3>Splunk Instance</h3>

            <input
              type="text"
              placeholder="https://your-splunk-instance.com"
              value={splunkBaseUrl}
              onChange={(e) => {
                setSplunkBaseUrl(e.target.value);
                localStorage.setItem("splunkBaseUrl", e.target.value);
              }}
            />
          </div>

          <div className="splunk-query-card">
            <h3>Suggested Splunk Queries</h3>

            {splunkQueries.map((query, index) => (
              <div key={index} className="splunk-query-row">
                <pre className="splunk-query">{query}</pre>

                <div className="splunk-query-actions">
                  <button
                    className="copy-query-btn"
                    onClick={() => copyToClipboard(query)}
                  >
                    Copy
                  </button>

                  <button
                    className="open-splunk-btn"
                    onClick={() => {
                      if (!splunkBaseUrl) {
                        alert("Please enter your Splunk instance URL first");
                        return;
                      }

                      const url =
                        `${splunkBaseUrl}/en-US/app/search/search?q=` +
                        encodeURIComponent(`search ${query}`);

                      window.open(url, "_blank");
                    }}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {runbookSteps.length > 0 && (
        <div className="runbook-card">
          <h3>Recommended Runbook</h3>

          <ol>
            {runbookSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {businessImpact && (
        <div className="business-impact-card">
          <h3>Business Impact</h3>

          <p>
            <strong>Affected Users:</strong> {businessImpact.affectedUsers}
          </p>
          <p>
            <strong>Affected Endpoint:</strong>{" "}
            {businessImpact.affectedEndpoint}
          </p>
          <p>
            <strong>Estimated Downtime:</strong>{" "}
            {businessImpact.estimatedDowntime}
          </p>
          <p>
            <strong>Risk:</strong> {businessImpact.risk}
          </p>
        </div>
      )}
      {mttrEstimate && (
        <div className="mttr-card">
          <h3>MTTR Estimate</h3>

          <div className="mttr-grid">
            <div>
              <strong>Current</strong>
              <p>{mttrEstimate.current}</p>
            </div>

            <div>
              <strong>Target</strong>
              <p>{mttrEstimate.target}</p>
            </div>

            <div>
              <strong>Improvement</strong>
              <p>{mttrEstimate.improvement}</p>
            </div>
          </div>
        </div>
      )}
      {incidentHistory.length > 0 && (
        <div className="incident-history-card">
          <h3>Incident History</h3>
          <button
            className="clear-history-btn"
            onClick={() => setIncidentHistory([])}
          >
            Clear History
          </button>

          {incidentHistory.map((item, index) => (
            <div key={index} className="incident-history-item">
              <strong>{item.severity}</strong>

              <p>{item.summary}</p>

              <small>{item.date}</small>
            </div>
          ))}
        </div>
      )}
      <button className="demo-incident-btn" onClick={tryDemoIncident}>
        {showDemoIncident ? "Hide Demo Incident" : "Try Demo Incident"}
      </button>

      {aiServiceError && (
        <div className="ai-service-error">
          <strong>AI Service Not Configured</strong>
          <p>{aiServiceError}</p>
        </div>
      )}
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <div className="user-message">
              <strong>You</strong>

              <p>{msg.user}</p>
            </div>

            <div className="assistant-message">
              <strong>Assistant</strong>

              <ReactMarkdown
                components={{
                  code({ className, children }) {
                    const match = /language-(\w+)/.exec(className || "");

                    return match ? (
                      <SyntaxHighlighter language={match[1]}>
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code>{children}</code>
                    );
                  },
                }}
              >
                {msg.assistant}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      <div className="input-row">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Upload code, logs, or ask a question..."
          rows={10}
        />
      </div>

      <div
        style={{
          marginTop: "10px",
          marginBottom: "10px",
        }}
      >
        <div
          className={`drop-zone ${dragActive ? "drop-zone-active" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p>Drag and drop files here</p>
          <span>Accepted: .py, .txt, .zip</span>

          <input
            type="file"
            multiple
            accept=".py,.txt,.zip,.log"
            onChange={(e) => setFiles([...e.target.files])}
          />
        </div>

        {files.length > 0 && (
          <div className="selected-files">
            <p>Selected files:</p>

            {files.map((file, index) => (
              <p key={index}>
                <strong>{file.name}</strong>
              </p>
            ))}
          </div>
        )}
      </div>

      <button className="send-btn" onClick={sendMessage} disabled={loading}>
        {loading ? "Thinking..." : "Send"}
      </button>

      <div className="auth-actions">
        {!token ? (
          <>
            <button
              className="login-open-btn"
              onClick={() => {
                setAuthMode("login");
                setShowLoginModal(true);
              }}
            >
              Login
            </button>

            <button
              className="register-open-btn"
              onClick={() => {
                setAuthMode("register");
                setShowLoginModal(true);
              }}
            >
              Register
            </button>
          </>
        ) : (
          <button
            className="logout-btn"
            onClick={() => setShowLogoutModal(true)}
          >
            Logout
          </button>
        )}
      </div>

      {showLoginModal && !token && (
        <div className="modal-overlay">
          <div className="login-modal">
            <button
              className="modal-close"
              onClick={() => setShowLoginModal(false)}
            >
              ×
            </button>

            <h2>{authMode === "login" ? "Welcome back" : "Create account"}</h2>

            <p>
              {authMode === "login"
                ? "Login to access your Django AI dashboard."
                : "Create an account to start saving your analyses."}
            </p>

            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {loginError && authMode === "login" && (
              <p className="login-error">{loginError}</p>
            )}

            {registerError && authMode === "register" && (
              <p className="login-error">{registerError}</p>
            )}

            {registerSuccess && (
              <p className="register-success">{registerSuccess}</p>
            )}

            <button
              className="login-submit-btn"
              onClick={authMode === "login" ? login : register}
            >
              {authMode === "login" ? "Login" : "Create account"}
            </button>

            <button
              className="auth-switch-btn"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setLoginError("");
                setRegisterError("");
                setRegisterSuccess("");
              }}
            >
              {authMode === "login"
                ? "No account? Create one"
                : "Already have an account? Login"}
            </button>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="logout-modal">
            <h2>Log out?</h2>

            <p>Are you sure you want to log out of your account?</p>

            <div className="logout-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>

              <button
                className="confirm-logout-btn"
                onClick={() => {
                  logout();
                  setShowLogoutModal(false);
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
