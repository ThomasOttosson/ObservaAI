import "./App.css";
import { useState, useEffect } from "react";
import logo from "./assets/logo4.png";

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
    try {
      const response = await fetch(`${API_URL}/api/history/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      setHistory(data);
    } catch (error) {
      console.error(error);
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

const text = await response.text();

console.log("RAW RESPONSE:");
console.log(text);

// Stoppa här tills vi vet exakt vad backend returnerar
return;


} catch (error) {
console.error("LOGIN ERROR:", error);
}
};


  const sendMessage = async () => {
    if (!message.trim() && files.length === 0) return;

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("message", message);

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

      const data = await response.json();

      console.log("STATUS:", response.status);
      console.log("DATA:", data);

      extractScores(data.reply || "");

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
          user: message,
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

  return (
    <div className="container">
      <div className="logo-container">
        <img src={logo} alt="Django AI Assistant" className="logo" />
        <p className="logo-subtitle">AI-powered Django code reviews</p>
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
          placeholder="Paste Django code or ask a question..."
          rows={10}
        />
      </div>

      <div
        style={{
          marginTop: "10px",
          marginBottom: "10px",
        }}
      >
        <input
          type="file"
          multiple
          accept=".py,.txt,.zip"
          onChange={(e) => setFiles([...e.target.files])}
        />

        {files.length > 0 && (
          <div>
            <p>Selected files:</p>

            {files.map((file, index) => (
              <p key={index}>
                <strong>{file.name}</strong>
              </p>
            ))}
          </div>
        )}
      </div>

      {!token && (
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
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

          <button onClick={login}>Login</button>
        </div>
      )}

      {token && <button onClick={logout}>Logout</button>}

      <button onClick={sendMessage} disabled={loading}>
        {loading ? "Thinking..." : "Send"}
      </button>
    </div>
  );
}

export default App;
