# Terminal & AI Development Environment Setup

This guide covers the standard terminal and AI tooling stack for our development environment. The following tools replace traditional terminal emulators and shell-based workflows with modern, GPU-accelerated, and agent-assisted alternatives.

**Supported platforms:** Windows 10/11, openSUSE Leap / Tumbleweed.

---

## WezTerm
[WezTerm Documentation](https://wezterm.org/)

**What it is:** A GPU-accelerated cross-platform terminal emulator and multiplexer written in Rust.

**Why we use it:**
- **Native multiplexing** — Built-in panes, tabs, and workspaces without requiring a separate tmux/screen session.
- **Configuration as code** — Lua-based config file for reproducible setups across machines.
- **GPU rendering** — Smooth scrolling and Unicode support, including ligatures and color emoji.
- **Cross-platform** — Identical experience on Windows and openSUSE.

### Windows

```powershell
# Install
winget install wez.wezterm

# Config path
# %USERPROFILE%\.config\wezterm\wezterm.lua
```

### openSUSE

```bash
# Install
sudo zypper install wezterm

# Config path
# ~/.config/wezterm/wezterm.lua
```

---

## Zellij
[Zellij Documentation](https://zellij.dev/)

**What it is:** A terminal workspace manager with batteries included.

**Why we use it:**
- **First-class tabs** — Zellij treats tabs as first-class citizens: named, searchable, and scriptable. Unlike tmux, tabs are visible in the UI by default and can be rearranged or pinned without memorizing key chords.
- **Layout engine** — Declarative YAML layouts for spinning up pre-configured dev environments (e.g., editor + server + logs side-by-side).
- **Plugin system** — WebAssembly plugins for extending functionality.
- **Sensible defaults** — Works out of the box without a 200-line config file.

### Windows

```powershell
# Install from the website
https://zellij.dev/

# Or build from source (requires Rust)
cargo install --locked zellij

# Config path
# %APPDATA%\zellij
```

### openSUSE

```bash
# Install from crates.io (requires Rust toolchain)
cargo install --locked zellij

# Or download the pre-built binary from GitHub releases and place in ~/.local/bin

# Config path
# ~/.config/zellij
```

**Quick start:** Launch with `zellij` or attach to an existing session with `zellij attach`. Use `Ctrl + g` followed by `n` for a new tab, `Ctrl + g` + `t` to rename tabs.

---

## Pi Coding Agent
[Pi Coding Agent](https://pi.dev/)

**What it is:** An AI coding agent that runs locally in your terminal, integrated with your shell and editor context.

**Why we use it:** Pi provides autonomous code generation, refactoring, and debugging directly in the terminal without context-switching to a browser or IDE plugin.

### Both Platforms

Requires Node.js 18+.

```bash
# Install
npm install -g --ignore-scripts @earendil-works/pi-coding-agent

# Verify
pi --version
```

---

### Pi Extensions

Install the following extensions to enable the full agent stack:

```bash
# Subagent orchestration — enables Pi to spawn and coordinate sub-agents for parallel tasks
pi install npm:pi-subagents

# Web access — allows Pi to fetch documentation, search, and reference live URLs
pi install npm:pi-web-access

# Interactive user prompts — enables Pi to ask clarifying questions mid-task
pi install npm:@juicesharp/rpiv-ask-user-question

# Task tracking — adds persistent todo/checklist management within agent sessions
pi install npm:@juicesharp/rpiv-todo

# Observational memory — Pi remembers patterns and context from your codebase across sessions
pi install npm:pi-observational-memory

# Hermes memory — persistent structured memory for long-term project context
pi install npm:pi-hermes-memory

# fff - ruse based file search SDK for AI agents
pi install npm:@ff-labs/pi-fff
```

**Verify extensions:**
```bash
pi extensions list
```

---

## Install the Agentic Kit to your project

The agentic kit is intended as a standardised way to work with and guide AI agents, it comes with a selection of skills that help control the overall process and make it more repeatable

Download the Agentic Kit and copy it to your project folder, remove any existing skills/agentic folders

[Agentic Kit](https://avantedge.visualstudio.com/LegalInteract.PracticeManager/_git/agentic-foundation-kit)

---

## Recommended Workflow

1. Open **WezTerm**.
2. Launch **Zellij** (`zellij`).
3. Navigate to your project root directories
4. Open tabs for your project contexts (frontend, backend, infra).
5. Run `pi` in any pane to start an agent session with full extension support.

On first run of Pi, you will need to use /login and enter your details. In most cases you would choose the API key option to enter the API key from the AI provider. Then use /model to choose the model you work with.
---

## References

- [WezTerm Documentation](https://wezterm.org/)
- [Zellij Documentation](https://zellij.dev/)
- [Pi Coding Agent](https://pi.dev/)
- [Agentic Kit](https://avantedge.visualstudio.com/LegalInteract.PracticeManager/_git/agentic-foundation-kit/)
