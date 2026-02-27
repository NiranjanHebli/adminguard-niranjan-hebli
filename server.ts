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
    const { fullName, email, ...details } = req.body;
    
    try {
      const stmt = db.prepare("INSERT INTO audit_trail (candidate_name, email, action, details) VALUES (?, ?, ?, ?)");
      stmt.run(fullName, email, "SUBMIT_ADMISSION", JSON.stringify(details));
      
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
