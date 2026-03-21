import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("audit_trail.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_name TEXT,
    email TEXT,
    action TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT
  )
`);

// Migration: Add is_flagged column if it doesn't exist
const tableInfo = db.prepare("PRAGMA table_info(audit_trail)").all() as any[];
const hasFlaggedColumn = tableInfo.some(col => col.name === 'is_flagged');
if (!hasFlaggedColumn) {
  db.exec("ALTER TABLE audit_trail ADD COLUMN is_flagged INTEGER DEFAULT 0");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Eligibility Rules (Mock Engine)
  const rulesPath = path.join(__dirname, "rules.json");
  if (!fs.existsSync(rulesPath)) {
    fs.writeFileSync(rulesPath, JSON.stringify({
      minPercentage: 60,
      minCGPA: 6.5,
      minScreeningScore: 50,
      allowedQualifications: ["B.Tech", "B.E.", "B.Sc", "BCA", "M.Tech", "M.Sc", "MCA", "MBA"]
    }, null, 2));
  }

  // API Routes
  app.get("/api/rules", (req, res) => {
    const rules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
    res.json(rules);
  });

  app.post("/api/admission", (req, res) => {
    const { fullName, email, isFlagged, ...details } = req.body;
    
    try {
      const stmt = db.prepare("INSERT INTO audit_trail (candidate_name, email, action, details, is_flagged) VALUES (?, ?, ?, ?, ?)");
      stmt.run(fullName, email, "SUBMIT_ADMISSION", JSON.stringify(details), isFlagged ? 1 : 0);
      
      res.json({ success: true, message: "Admission form submitted and logged to audit trail." });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ success: false, message: "Failed to process admission." });
    }
  });

  app.get("/api/audit", (req, res) => {
    const logs = db.prepare("SELECT * FROM audit_trail ORDER BY timestamp DESC").all();
    res.json(logs);
  });

  app.get("/api/google-export", async (req, res) => {
    const rawUrl = String(req.query.url || "").trim();
    if (!rawUrl) {
      return res.status(400).json({ success: false, message: "Missing url query parameter." });
    }

    const sheetMatch = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetMatch) {
      return res.status(400).json({ success: false, message: "Provide a valid Google Sheet URL." });
    }

    try {
      let exportUrls: string[] = [];
      const contentType = "text/csv; charset=utf-8";
      const parsed = new URL(rawUrl);
      const gid = parsed.searchParams.get("gid") || (parsed.hash.startsWith("#gid=") ? parsed.hash.replace("#gid=", "") : "0");
      exportUrls = [
        `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=csv&gid=${gid}`,
        `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/gviz/tq?tqx=out:csv&gid=${gid}`
      ];

      let body = "";
      let fetchedOk = false;
      for (const exportUrl of exportUrls) {
        const response = await fetch(exportUrl, {
          headers: { Accept: "text/csv,text/plain,text/*;q=0.9,*/*;q=0.8" }
        });
        if (!response.ok) continue;
        const maybeBody = await response.text();
        const looksLikeHtml = /^\s*<(?:!doctype|html|head|body)\b/i.test(maybeBody);
        if (looksLikeHtml) continue;
        body = maybeBody;
        fetchedOk = true;
        break;
      }

      if (!fetchedOk || !body.trim()) {
        return res.status(502).json({
          success: false,
          message:
            "Google returned a non-CSV response. Make sure the file is shared as Anyone with the link can view."
        });
      }

      res.setHeader("Content-Type", contentType);
      return res.status(200).send(body);
    } catch (error) {
      console.error("Google export error:", error);
      return res.status(500).json({ success: false, message: "Unable to export from Google URL." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
