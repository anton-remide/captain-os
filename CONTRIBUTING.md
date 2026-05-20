# 🤝 Contributing to Captain OS

Thank you for your interest in contributing to **Captain OS**! We are building a robust, portable, and cybernetic meta-operating system designed to protect codebase integrity and guide AI coding pilots with autonomous, closed-loop safety gates.

By contributing, you help shape a reliable SRE-driven control system for software development.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Git**

### 2. Setting Up Your Local Environment
1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/captain-os.git
   cd captain-os
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Run the local doctor validation** to ensure everything is set up correctly:
   ```bash
   npm run doctor
   ```

---

## 🛠️ Development & Testing

### Running Tests
Captain OS uses a lightweight, high-speed unit testing suite. To execute the tests locally, run:
```bash
npm run test
```

Ensure all tests pass before making any changes. If you introduce new features, please write corresponding tests inside the `packages/core/src/` or `packages/cli/src/` matching test directories.

### Project Structure
- `packages/core/`: The core logic, compilers, and state managers.
- `packages/cli/`: The CLI entry point, configure wizard, and setup flow.
- `packages/adapters/`: Handlers for integrating various LLMs (Gemini, Claude, Codex, GPT).
- `schemas/`: JSON/YAML schemas for declarative gate configurations.
- `templates/`: Templates for setup configurations.

---

## 👑 Code Quality & Cybernetic Gates

Captain OS regulates itself using the same principles it enforces. When contributing, keep the following SRE standards in mind:

1. **Keep It Simple (KISS):** Avoid deeply nested logic, excessive abstraction, and circular dependencies. Keep modules small and highly focused.
2. **Error Budget:** Avoid ignoring or bypassing warnings. High rates of bypassed warnings deplete the codebase's virtual *Error Budget*, triggering throttled pre-commit checks.
3. **Automated Mechanical Rollbacks:** Any changes made by AI assistants are automatically snapshot-protected and validated. If your local tests fail, Captain OS will restore the working tree to the last known stable state.

---

## 📬 Submitting a Pull Request (PR)

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feat/my-awesome-feature
   ```
2. **Commit your changes** with descriptive commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification:
   - `feat: add database schema auditor gate`
   - `fix: resolve cli anchor search in nested monorepo folder`
   - `docs: update setup configuration guide`
3. **Verify locally:** Run `npm run doctor` and `npm run test`.
4. **Push to your fork** and **open a Pull Request** against the `main` branch of `captain-os`.

---

## 💬 Community & Communication
- **Issues:** If you find a bug or have a feature idea, please open a ticket using our structured Issue Templates.
- **Pull Requests:** We actively review community PRs. Be sure to address any feedback or CI failures.

Thank you for making Captain OS safer and more portable for everyone! 🏎️
