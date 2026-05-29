(() => {
  const screen = document.getElementById("term-screen");
  const form = document.getElementById("term-form");
  const input = document.getElementById("term-input");
  const promptTop = document.getElementById("term-prompt-top");
  const promptPrefix = document.getElementById("term-prompt-prefix");
  if (!screen || !form || !input || !promptTop || !promptPrefix) return;
  // The scroll container wraps both the log and the live prompt so the prompt
  // sits directly under the last command's output. Fall back to screen if absent.
  const body = document.getElementById("term-body") || screen;

  const SUBNET = "10.10.20.0/24";
  const FLAG = "flag{coordinate_foister}";
  const HOME = "/home/foister";
  const HOSTS = [
    { ip: "10.10.20.201", name: "ubuntu-1", recipient: "alice" },
    { ip: "10.10.20.202", name: "ubuntu-2", recipient: "bob" },
  ];
  const WALL_BODY = [
    "[SANDBOX] foister was here.",
    "Coordinate-foister salutes you.",
  ];

  const FS = {
    "/": { type: "dir", entries: ["bin", "etc", "home", "opt", "tmp", "usr", "var"] },
    "/bin": { type: "dir", entries: [] },
    "/etc": { type: "dir", entries: [] },
    "/home": { type: "dir", entries: ["foister"] },
    "/home/foister": { type: "dir", entries: ["coordinate-linux-amd64", "scripts"] },
    "/home/foister/coordinate-linux-amd64": { type: "binary" },
    "/home/foister/scripts": { type: "dir", entries: ["flag.sh", "troll.sh"] },
    "/home/foister/scripts/flag.sh": {
      type: "file",
      body: [
        "#!/bin/bash",
        "# pulls the flag from a per-host secret store",
        "cat /opt/secrets/coordinate.flag 2>/dev/null \\",
        "  || echo \"[ERROR] flag store not present on this host\"",
      ],
    },
    "/home/foister/scripts/troll.sh": {
      type: "file",
      body: [
        "#!/bin/bash",
        "# broadcast a wall message to every logged-in user on the target",
        "wall <<'EOF'",
        "[SANDBOX] foister was here.",
        "Coordinate-foister salutes you.",
        "EOF",
      ],
    },
    "/opt": { type: "dir", entries: [] },
    "/tmp": { type: "dir", entries: [] },
    "/usr": { type: "dir", entries: [] },
    "/var": { type: "dir", entries: [] },
  };

  let cwd = HOME;
  let prevCwd = HOME;

  const normalizePath = (path) => {
    if (!path) return cwd;
    if (path === "~") return HOME;
    if (path.startsWith("~/")) path = HOME + "/" + path.slice(2);
    const abs = path.startsWith("/") ? path : cwd + "/" + path;
    const stack = [];
    for (const p of abs.split("/")) {
      if (p === "" || p === ".") continue;
      if (p === "..") stack.pop();
      else stack.push(p);
    }
    return "/" + stack.join("/");
  };

  const displayPath = (path) => {
    if (path === HOME) return "~";
    if (path.startsWith(HOME + "/")) return "~/" + path.slice(HOME.length + 1);
    return path === "" ? "/" : path;
  };

  const span = (cls, text) => {
    const s = document.createElement("span");
    if (cls) s.className = cls;
    s.textContent = text;
    return s;
  };

  const renderKaliPrompt = (parent, pathDisplay) => {
    parent.appendChild(span("term-k-box", "┌──("));
    parent.appendChild(span("term-k-user", "foister"));
    parent.appendChild(span("term-k-at", "㉿"));
    parent.appendChild(span("term-k-host", "sandbox"));
    parent.appendChild(span("term-k-box", ")-["));
    parent.appendChild(span("term-k-path", pathDisplay));
    parent.appendChild(span("term-k-box", "]"));
  };

  const renderDollar = (parent) => {
    parent.appendChild(span("term-k-box", "└─"));
    parent.appendChild(span("term-k-dollar", "$ "));
  };

  const refreshLivePrompt = () => {
    while (promptTop.firstChild) promptTop.removeChild(promptTop.firstChild);
    renderKaliPrompt(promptTop, displayPath(cwd));
  };

  refreshLivePrompt();
  renderDollar(promptPrefix);

  const newLine = (cls) => {
    const div = document.createElement("div");
    div.className = cls ? `term-line ${cls}` : "term-line";
    return div;
  };

  const writeLine = (text, cls) => {
    const div = newLine(cls);
    div.textContent = text;
    screen.appendChild(div);
    return div;
  };

  const writeBlank = () => {
    const div = newLine("term-line-blank");
    screen.appendChild(div);
  };

  const writeSpans = (parts, cls) => {
    const div = newLine(cls);
    for (const [c, t] of parts) {
      div.appendChild(span(c, t));
    }
    screen.appendChild(div);
    return div;
  };

  const writeHistoricPrompt = (cmd, pathDisplay) => {
    const top = newLine("term-historic");
    renderKaliPrompt(top, pathDisplay);
    screen.appendChild(top);
    const bot = newLine("term-historic");
    renderDollar(bot);
    bot.appendChild(span(null, cmd));
    screen.appendChild(bot);
  };

  const scrollToBottom = () => {
    body.scrollTop = body.scrollHeight;
  };

  const tokenize = (raw) => {
    const out = [];
    let cur = "";
    let quote = null;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (quote) {
        if (ch === quote) {
          quote = null;
        } else {
          cur += ch;
        }
        continue;
      }
      if (ch === "\"" || ch === "'") {
        quote = ch;
        continue;
      }
      if (ch === " " || ch === "\t") {
        if (cur.length) {
          out.push(cur);
          cur = "";
        }
        continue;
      }
      cur += ch;
    }
    if (cur.length) out.push(cur);
    return out;
  };

  const formatTime = () => {
    const d = new Date();
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, "0")}:${m}:${s}${ampm}`;
  };

  const printHelp = () => {
    writeLine("Available commands:");
    writeLine("  help                          show this list");
    writeLine("  clear                         clear the screen");
    writeLine("  ls [path]                     list files (try `ls scripts`)");
    writeLine("  cd [path]                     change directory (cd, cd .., cd -, cd ~)");
    writeLine("  pwd                           print working directory");
    writeLine("  whoami                        print current user");
    writeLine("  cat <file>                    print a file's contents");
    writeLine("  ./coordinate-linux-amd64 -h   show coordinate-foister usage");
    writeBlank();
    writeLine("Objective: retrieve the flag from the hosts on " + SUBNET + ".");
    writeLine("Bonus:     scripts/troll.sh broadcasts a wall message to every logged-in user.");
    writeLine("Hint:      the binary in this directory does it. Read the help.");
  };

  const printCoordinateUsage = () => {
    const lines = [
      "usage: coordinate [options] [script ...]",
      "       coordinate -t <targets> -u <usernames> -p <passwords> <script>",
      "       coordinate -t <targets> -u <usernames> -x <command>",
      "",
      "targeting:",
      "  -t, --targets TARGETS     target DNS names or IPs as singles, comma lists,",
      "                            ranges, or CIDR (e.g. 10.10.20.0/24)",
      "  -P, --port PORT           SSH port to use (default: 22)",
      "",
      "authentication:",
      "  -u, --usernames USERS     comma-separated username list",
      "  -p, --passwords PASSES    comma-separated password list",
      "  -k, --key[=KEY]           use SSH agent keys, or a private key path",
      "",
      "execution:",
      "  -x, --command COMMAND     execute a direct command instead of a script",
      "  -S, --sudo                attempt sudo escalation if SSH user is not root",
      "  -T, --timeout SECONDS     time limit per script or command (default: 30)",
      "",
      "Scripts and direct commands are mutually exclusive.",
    ];
    for (const ln of lines) {
      if (ln === "") writeBlank();
      else writeLine(ln);
    }
  };

  const parseFlags = (argv) => {
    const flags = {};
    const positional = [];
    const takesValue = new Set([
      "-t", "--targets",
      "-u", "--usernames",
      "-p", "--passwords",
      "-x", "--command",
      "-P", "--port",
      "-T", "--timeout",
      "-l", "--limit",
      "-W", "--tmpdir",
      "-o", "--outfile-fmt",
      "-E", "--env",
      "-F", "--upload",
      "-D", "--download",
      "-I", "--ignore-users",
      "-A", "--all-pass",
      "-c", "--callbacks",
      "-O", "--CO",
      "-C", "--create-config",
    ]);
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (a.startsWith("-")) {
        if (takesValue.has(a)) {
          flags[a] = argv[i + 1];
          i++;
        } else {
          flags[a] = true;
        }
      } else {
        positional.push(a);
      }
    }
    return { flags, positional };
  };

  const runCoordinate = (argv) => {
    if (argv.includes("-h") || argv.includes("--help")) {
      printCoordinateUsage();
      return;
    }

    const { flags, positional } = parseFlags(argv);
    const targets = flags["-t"] || flags["--targets"];
    const users = flags["-u"] || flags["--usernames"];
    const passes = flags["-p"] || flags["--passwords"];
    const command = flags["-x"] || flags["--command"];
    const script = positional[0];

    if (!targets) {
      writeSpans([["log-info", "[ERROR] "], [null, "no targets specified. use -t <targets> (e.g. -t " + SUBNET + ")."]], "term-error");
      return;
    }
    if (!users) {
      writeSpans([["log-info", "[ERROR] "], [null, "no usernames specified. use -u <usernames>."]], "term-error");
      return;
    }
    if (!passes && !(flags["-k"] || flags["--key"])) {
      writeSpans([["log-info", "[ERROR] "], [null, "no authentication provided. use -p <passwords> or -k."]], "term-error");
      return;
    }
    if (!script && !command) {
      writeSpans([["log-info", "[ERROR] "], [null, "nothing to execute. pass a script path or use -x <command>."]], "term-error");
      return;
    }
    if (script && command) {
      writeSpans([["log-info", "[ERROR] "], [null, "scripts and direct commands are mutually exclusive."]], "term-error");
      return;
    }

    if (targets !== SUBNET) {
      writeLine("Specified targets (0 addresses):", "log-muted");
      writeSpans([["log-info", "[ERROR] "], [null, "no live hosts in " + targets + "."]], "term-error");
      return;
    }

    const userList = users.split(",").map((s) => s.trim()).filter(Boolean);
    const passList = passes ? passes.split(",").map((s) => s.trim()).filter(Boolean) : [];

    let scriptKey = null;
    if (script) {
      const abs = normalizePath(script);
      const entry = FS[abs];
      const m = abs.match(/^\/home\/foister\/scripts\/(.+)$/);
      if (m && entry && entry.type === "file") {
        scriptKey = m[1];
      }
    }
    const payloadLabel = script ? (scriptKey || script.replace(/^\.\//, "")) : command;
    const payloadIsScript = Boolean(script);

    if (payloadIsScript && !scriptKey) {
      writeSpans([["log-info", "[ERROR] "], [null, "script '" + script + "' not found. try ~/scripts/flag.sh or ~/scripts/troll.sh."]], "term-error");
      return;
    }

    writeLine("Specified targets (256 addresses):");
    writeLine("        10.10.20.0-10.10.20.255");
    writeLine(payloadIsScript ? "Specified scripts (1 scripts):" : "Specified commands (1 commands):");
    writeLine("        " + payloadLabel);

    const authOk = userList.includes("root") && passList.includes("password");
    if (!authOk) {
      for (const host of HOSTS) {
        for (const u of userList) {
          writeSpans([
            ["log-info", "[INFO:0:"],
            ["log-user", u],
            ["log-info", ":"],
            ["log-user", host.ip],
            ["log-info", "] "],
            [null, "Invalid credentials for username '" + u + "'"],
          ]);
        }
      }
      writeBlank();
      writeSpans([["log-info", "[ERROR] "], [null, "authentication failed on all hosts. check -u / -p."]], "term-error");
      return;
    }

    const now = formatTime();
    for (const host of HOSTS) {
      writeSpans([
        ["log-info", "[INFO:0:"],
        ["log-user", "root"],
        ["log-info", ":"],
        ["log-user", host.ip],
        ["log-info", "] "],
        [null, "Valid credentials for username 'root'"],
      ]);
    }
    for (const host of HOSTS) {
      writeSpans([
        ["log-info", "[INFO:0@"],
        ["log-user", now],
        ["log-info", ":"],
        ["log-user", "root"],
        ["log-info", ":"],
        ["log-user", host.ip],
        ["log-info", ":"],
        ["log-user", host.name],
        ["log-info", "/" + (payloadIsScript ? "script" : "command") + ": "],
        ["log-user", payloadLabel],
        ["log-info", "] "],
        [null, "Already root, no sudo needed."],
      ]);
    }
    writeBlank();
    const d = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = days[d.getDay()] + " " + months[d.getMonth()] + " " + pad(d.getDate()) + " " +
      pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + " " + d.getFullYear();
    for (const host of HOSTS) {
      writeSpans([
        ["log-stdout", "[STDOUT:0@"],
        ["log-user", now],
        ["log-stdout", ":"],
        ["log-user", "root"],
        ["log-stdout", ":"],
        ["log-user", host.ip],
        ["log-stdout", ":"],
        ["log-user", host.name],
        ["log-stdout", "/" + (payloadIsScript ? "script" : "command") + ": "],
        ["log-user", payloadLabel],
        ["log-stdout", "]"],
      ]);
      if (scriptKey === "troll.sh") {
        writeLine("");
        writeLine("Broadcast message from root@" + host.name + " (pts/0) (" + dateStr + "):");
        writeLine("");
        for (const line of WALL_BODY) writeLine(line);
        writeLine("");
        writeSpans([
          ["log-muted", "// recipient on " + host.name + ": "],
          ["log-user", host.recipient],
        ]);
      } else {
        writeLine(FLAG, "log-flag");
      }
      writeBlank();
    }
  };

  const handleCat = (argv) => {
    if (argv.length === 0) {
      writeLine("cat: missing operand", "term-error");
      return;
    }
    for (const file of argv) {
      const abs = normalizePath(file);
      const entry = FS[abs];
      if (!entry) {
        writeLine("cat: " + file + ": No such file or directory", "term-error");
      } else if (entry.type === "dir") {
        writeLine("cat: " + file + ": Is a directory", "term-error");
      } else if (entry.type === "binary") {
        writeLine("cat: " + file + ": binary file (ELF 64-bit LSB executable)", "term-error");
      } else if (entry.type === "file") {
        for (const line of entry.body) writeLine(line);
      }
    }
  };

  const handleLs = (argv) => {
    const targets = argv.length === 0 ? [cwd] : argv.map(normalizePath);
    const showLabel = argv.length > 1;
    let first = true;
    for (let i = 0; i < targets.length; i++) {
      const abs = targets[i];
      const label = argv.length === 0 ? null : argv[i];
      const entry = FS[abs];
      if (!entry) {
        writeLine("ls: cannot access '" + label + "': No such file or directory", "term-error");
        continue;
      }
      if (showLabel) {
        if (!first) writeBlank();
        writeLine(label + ":");
      }
      first = false;
      if (entry.type === "dir") {
        if (entry.entries.length) writeLine(entry.entries.join("  "));
      } else {
        writeLine(label || abs.split("/").pop());
      }
    }
  };

  const handleCd = (argv) => {
    const raw = argv[0];
    let target;
    if (!raw || raw === "~") {
      target = HOME;
    } else if (raw === "-") {
      target = prevCwd;
    } else {
      target = normalizePath(raw);
    }
    const entry = FS[target];
    if (!entry) {
      writeLine("cd: " + raw + ": No such file or directory", "term-error");
      return;
    }
    if (entry.type !== "dir") {
      writeLine("cd: " + raw + ": Not a directory", "term-error");
      return;
    }
    prevCwd = cwd;
    cwd = target;
    refreshLivePrompt();
    if (raw === "-") writeLine(cwd);
  };

  const COMMANDS = ["cat", "cd", "clear", "exit", "help", "hostname", "logout", "ls", "pwd", "whoami"];
  const VALUE_TAKING_FLAGS = new Set([
    "-t", "--targets", "-u", "--usernames", "-p", "--passwords",
    "-x", "--command", "-P", "--port", "-T", "--timeout", "-l", "--limit",
    "-W", "--tmpdir", "-o", "--outfile-fmt", "-E", "--env",
    "-F", "--upload", "-D", "--download", "-I", "--ignore-users",
    "-A", "--all-pass", "-c", "--callbacks", "-O", "--CO", "-C", "--create-config",
  ]);

  const commonPrefix = (arr) => {
    if (arr.length === 0) return "";
    let p = arr[0];
    for (let i = 1; i < arr.length; i++) {
      while (!arr[i].startsWith(p)) {
        p = p.slice(0, -1);
        if (p === "") return "";
      }
    }
    return p;
  };

  const splitFragment = (frag) => {
    const i = frag.lastIndexOf("/");
    if (i < 0) return { dir: "", name: frag };
    return { dir: frag.slice(0, i + 1), name: frag.slice(i + 1) };
  };

  const pathCandidates = (fragment, onlyDirs) => {
    const { dir, name } = splitFragment(fragment);
    const absDir = dir === "" ? cwd : normalizePath(dir);
    const entry = FS[absDir];
    if (!entry || entry.type !== "dir") return [];
    const out = [];
    for (const e of entry.entries) {
      if (!e.startsWith(name)) continue;
      const childAbs = (absDir === "/" ? "/" : absDir + "/") + e;
      const child = FS[childAbs];
      const isDir = !!(child && child.type === "dir");
      if (onlyDirs && !isDir) continue;
      out.push({ name: e, isDir });
    }
    return out;
  };

  const commandCandidates = (fragment) => {
    return COMMANDS
      .filter((c) => c.startsWith(fragment))
      .map((c) => ({ name: c, isDir: false }));
  };

  const completionContext = (before) => {
    let lastSpace = -1;
    for (let i = before.length - 1; i >= 0; i--) {
      if (before[i] === " " || before[i] === "\t") { lastSpace = i; break; }
    }
    const fragment = before.slice(lastSpace + 1);
    const fragmentStart = lastSpace + 1;
    const preTokens = tokenize(before.slice(0, lastSpace + 1));
    if (preTokens.length === 0) {
      if (fragment.startsWith("./") || fragment.startsWith("/") || fragment.startsWith("~")) {
        return { kind: "path", fragment, fragmentStart };
      }
      return { kind: "command", fragment, fragmentStart };
    }
    const head = preTokens[0];
    if (head === "cd") return { kind: "path-dir", fragment, fragmentStart };
    if (head === "ls" || head === "cat") return { kind: "path", fragment, fragmentStart };
    if (head === "./coordinate-linux-amd64" || head === "coordinate-linux-amd64" || head === "coordinate") {
      const last = preTokens[preTokens.length - 1];
      if (VALUE_TAKING_FLAGS.has(last)) return { kind: "none", fragment, fragmentStart };
      return { kind: "path", fragment, fragmentStart };
    }
    return { kind: "none", fragment, fragmentStart };
  };

  const handleTab = () => {
    const value = input.value;
    const cursor = input.selectionStart != null ? input.selectionStart : value.length;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);
    const ctx = completionContext(before);
    if (ctx.kind === "none") return;

    let candidates = [];
    if (ctx.kind === "command") candidates = commandCandidates(ctx.fragment);
    else if (ctx.kind === "path") candidates = pathCandidates(ctx.fragment, false);
    else if (ctx.kind === "path-dir") candidates = pathCandidates(ctx.fragment, true);
    if (candidates.length === 0) return;

    const isCmd = ctx.kind === "command";
    const dirPart = isCmd ? "" : splitFragment(ctx.fragment).dir;
    const namePart = isCmd ? ctx.fragment : splitFragment(ctx.fragment).name;

    const setInput = (replacement) => {
      const newValue = value.slice(0, ctx.fragmentStart) + replacement + after;
      input.value = newValue;
      const newCursor = ctx.fragmentStart + replacement.length;
      input.setSelectionRange(newCursor, newCursor);
    };

    if (candidates.length === 1) {
      const c = candidates[0];
      const suffix = c.isDir ? "/" : " ";
      setInput(isCmd ? c.name + suffix : dirPart + c.name + suffix);
      return;
    }

    const names = candidates.map((c) => c.name);
    const lcp = commonPrefix(names);
    if (lcp.length > namePart.length) {
      setInput(isCmd ? lcp : dirPart + lcp);
      return;
    }

    const listed = candidates.map((c) => c.isDir ? c.name + "/" : c.name).join("  ");
    writeLine(listed, "log-muted");
    scrollToBottom();
  };

  const handleCommand = (raw) => {
    const trimmed = raw.trim();
    if (trimmed === "") return;
    const argv = tokenize(trimmed);
    const cmd = argv[0];
    const rest = argv.slice(1);

    if (cmd === "help") { printHelp(); return; }
    if (cmd === "clear") { while (screen.firstChild) screen.removeChild(screen.firstChild); return; }
    if (cmd === "ls") { handleLs(rest); return; }
    if (cmd === "cd") { handleCd(rest); return; }
    if (cmd === "pwd") { writeLine(cwd); return; }
    if (cmd === "whoami") { writeLine("foister"); return; }
    if (cmd === "hostname") { writeLine("sandbox"); return; }
    if (cmd === "cat") { handleCat(rest); return; }
    if (cmd === "./coordinate-linux-amd64" || cmd === "coordinate-linux-amd64" || cmd === "coordinate") {
      runCoordinate(rest);
      return;
    }
    if (cmd === "exit" || cmd === "logout") {
      writeLine("nope, you're stuck here. type 'help'.", "log-muted");
      return;
    }
    writeLine("zsh: command not found: " + cmd, "term-error");
  };

  const history = [];
  let historyIdx = -1;
  let draft = "";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = input.value;
    writeHistoricPrompt(raw, displayPath(cwd));
    if (raw.trim().length) {
      history.push(raw);
      if (history.length > 100) history.shift();
    }
    historyIdx = -1;
    draft = "";
    handleCommand(raw);
    input.value = "";
    scrollToBottom();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      handleTab();
      return;
    }
    if (e.key === "ArrowUp") {
      if (history.length === 0) return;
      e.preventDefault();
      if (historyIdx === -1) {
        draft = input.value;
        historyIdx = history.length - 1;
      } else if (historyIdx > 0) {
        historyIdx -= 1;
      }
      input.value = history[historyIdx];
      requestAnimationFrame(() => {
        input.setSelectionRange(input.value.length, input.value.length);
      });
    } else if (e.key === "ArrowDown") {
      if (historyIdx === -1) return;
      e.preventDefault();
      if (historyIdx < history.length - 1) {
        historyIdx += 1;
        input.value = history[historyIdx];
      } else {
        historyIdx = -1;
        input.value = draft;
      }
      requestAnimationFrame(() => {
        input.setSelectionRange(input.value.length, input.value.length);
      });
    } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      while (screen.firstChild) screen.removeChild(screen.firstChild);
    }
  });

  body.addEventListener("click", () => {
    if (window.getSelection && window.getSelection().toString()) return;
    input.focus();
  });

  writeLine("coordinate-foister sandbox — type 'help' to begin.", "log-muted");
})();
