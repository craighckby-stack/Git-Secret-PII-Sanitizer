# Git Secret & PII Sanitizer — Code Evolution Engine

An enterprise-grade secret scanner, PII detector, Git commit history purge generator, SARIF exporter, and AI Code Evolution Architect powered by **Google Gemini 3.1 Pro (High Thinking)**.

---

## 🌐 Live System Preview Links

- **Shared App URL:** [https://ais-pre-w3ohwbrlkmimctvzipumce-483535245139.asia-southeast1.run.app](https://ais-pre-w3ohwbrlkmimctvzipumce-483535245139.asia-southeast1.run.app)
- **Development App URL:** [https://ais-dev-w3ohwbrlkmimctvzipumce-483535245139.asia-southeast1.run.app](https://ais-dev-w3ohwbrlkmimctvzipumce-483535245139.asia-southeast1.run.app)

---

## 📖 How to Use the System

The Git Secret & PII Sanitizer provides four key security workflows directly in your browser:

### 1. GitHub Repository Scanner (`GitHub Repo` Tab)
Scan public or private GitHub repositories across all commit blobs with full tree pagination and concurrency limits.

1. **Enter Repository URL:** Input your target repository link (e.g. `https://github.com/craighckby-stack/AI-Project-Genesis-Scaffold`).
2. **Select Target Branch:** The system auto-fetches branches (e.g., `main`, `dev`, `master`). Select the branch you wish to audit.
3. **Personal Access Token (Optional):** Provide a `ghp_...` token if scanning private repositories or to expand API rate limits.
4. **Execute Scan:** Click **Start Full GitHub Scan**. The system paginates the entire recursive tree, tracking `X-RateLimit-Remaining` headers and executing concurrency-limited requests.

---

### 2. Live Snippet & Code Sanitizer (`Live Snippet` Tab)
Instantly sanitize pasted code snippets, configuration files, or `.env` blocks with real-time surgical redaction.

1. **Paste Code:** Insert any raw code or environment string into the left-hand editor, or choose a preset sample.
2. **Real-time Redaction:** The right-hand editor automatically renders surgically redacted code using type-specific placeholders (e.g., `<OPENAI_API_KEY_REDACTED>`, `<GEMINI_API_KEY_REDACTED>`).
3. **Copy Redacted Code:** Click **Copy Redacted Code** to safely share or commit clean snippets.

---

### 3. Local Folder Security Scanner (`Local Folder` Tab)
Perform an offline, client-side directory audit of your local disk projects without uploading files to external servers.

1. **Select Folder:** Click **Select Local Folder to Scan** and choose a project directory from your disk.
2. **Automatic Filtering:** The scanner automatically skips binary files, `node_modules`, lockfiles, and files exceeding the 8MB threshold.
3. **View Report:** Inspect summary statistics including scanned files, total findings, and skip reason breakdowns.

---

### 4. Git History Purge Generator (`Generate Purge Script` Modal)
Completely rewrite Git commit history across all branches and tags to purge exposed secret strings using `git-filter-repo --replace-text`.

1. **Trigger Purge Generator:** Click **Generate Git History Purge Script** on any findings summary.
2. **Review Generated Bash Script:** The system generates a surgical shell script containing deduplicated `matched_text==>replacement` replacement rules.
3. **Safety Confirmation:** Type `DELETE` into the confirmation input to unlock download and copy controls.
4. **Execute Script:** Run the script in a terminal to execute a mirror clone, run `git filter-repo --replace-text`, and force-push clean history.

---

### 5. AI Code Evolution Architect (`AI Architect` Tab)
Leverage **Google Gemini 3.1 Pro** with `High Thinking` reasoning to assess threat levels, blast radius, compliance risks, and generate refactored code patches.

1. **Execute Deep Assessment:** Click **Execute High-Thinking Deep Assessment** on any scan findings.
2. **Inspect Threat & Blast Radius:** Review AI-generated threat ratings (`Critical`, `High`, `Medium`, `Low`), compromise risks, and GDPR/PCI compliance notes.
3. **Copy Refactored Code Patches:** Copy ready-to-use code patches replacing hardcoded credentials with `process.env` or secret manager integrations.
4. **Interactive Architect Chat:** Ask follow-up questions regarding key rotation, CI/CD pre-commit hooks, or cloud secret management.

---

### 6. Aggregated Findings & SARIF Exporter
Filter and export scan findings in industry-standard formats:

- **Filters:** Search by file path or filter by severity (`Critical`, `High`, `Medium`, `Low`) and category.
- **Exporters:** Download scan reports as **JSON**, **CSV**, or **SARIF v2.1.0** (importable directly into GitHub Security Code Scanning).

---

## 📜 License

**Non-Commercial Use Only** (CC BY-NC 4.0).  
Copyright © 2026 craighckby-stack.

This system and codebase are licensed strictly for non-commercial, educational, and personal research purposes. Commercial use, reselling, or incorporating into commercial SaaS offerings is prohibited without explicit permission.

---

*Copyright craighckby-stack 2026. Powered by Google Gemini 3.1 Pro (High Thinking).*
