import { parse as parseYaml } from "yaml";

/**
 * Parses an AGENT_GUIDE.md into a model. Parsing is deliberately forgiving:
 * anything the spec does not define is collected rather than rejected, and it
 * is validate.js that decides what counts as an error.
 */

const SECTION_KEYS = ["Docs", "Code map", "External", "Tasks", "Glossary", "Policy"];

/** GitHub's heading-anchor slug: lowercase, drop punctuation, spaces to dashes. */
export function slugify(heading) {
  return heading
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/[`*_~]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    // GitHub replaces each whitespace character with a dash and does not
    // collapse runs: "Concurrency & Multi-User" → "concurrency--multi-user".
    .replace(/\s/g, "-");
}

function splitFrontmatter(text) {
  if (!text.startsWith("---")) return { frontmatter: null, body: text, bodyOffset: 0 };
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { frontmatter: null, body: text, bodyOffset: 0 };
  const raw = text.slice(3, end);
  const rest = text.slice(end + 4);
  let frontmatter = null;
  try {
    frontmatter = parseYaml(raw) ?? {};
  } catch (err) {
    frontmatter = { __error: err.message };
  }
  return { frontmatter, body: rest, bodyOffset: raw.split("\n").length + 1 };
}

/** Rows of a pipe table, separator row dropped, cells trimmed. */
function readTable(lines, start) {
  const rows = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) {
      if (line === "" && rows.length === 0) { i++; continue; }
      break;
    }
    const cells = line.slice(1, line.endsWith("|") ? -1 : undefined).split("|").map((c) => c.trim());
    if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push({ cells, line: i + 1 });
    i++;
  }
  return { rows, next: i };
}

/** The first fenced yaml block at or after `start`, parsed. */
function readYamlFence(lines, start) {
  let i = start;
  while (i < lines.length && !/^```ya?ml\s*$/.test(lines[i].trim())) {
    if (/^#{2,3} /.test(lines[i])) return { value: null, next: start };
    i++;
  }
  if (i >= lines.length) return { value: null, next: start };
  const from = i + 1;
  let j = from;
  while (j < lines.length && lines[j].trim() !== "```") j++;
  const raw = lines.slice(from, j).join("\n");
  try {
    return { value: parseYaml(raw) ?? {}, raw, next: j + 1 };
  } catch (err) {
    return { value: { __error: err.message }, raw, next: j + 1 };
  }
}

const ARROW = /\s(?:→|->)\s/;

/** `- question → `a`, `b` [→ task `t`] [↪ follow-up]` */
function parseFaqLine(text, line) {
  let rest = text;
  let followup = null;
  const hop = rest.split(/\s↪\s/);
  if (hop.length > 1) {
    rest = hop[0];
    followup = hop.slice(1).join(" ↪ ").trim();
  }
  let taskId = null;
  const task = rest.match(/\s(?:→|->)\s*task\s+`([^`]+)`/);
  if (task) {
    taskId = task[1];
    rest = rest.slice(0, task.index);
  }
  const parts = rest.split(ARROW);
  const question = parts[0].trim();
  const tail = parts.slice(1).join(" ");
  const docIds = [...tail.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  return { question, docIds, taskId, followup, line };
}

/** `- label → `doc` | task `t` | flow `f`` */
function parseAudienceLine(text, line) {
  const parts = text.split(ARROW);
  const label = parts[0].trim();
  const tail = parts.slice(1).join(" ");
  const task = tail.match(/task\s+`([^`]+)`/);
  const flow = tail.match(/flow\s+`([^`]+)`/);
  const docIds = task || flow ? [] : [...tail.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  return { label, docIds, taskId: task?.[1] ?? null, flowId: flow?.[1] ?? null, line };
}

export function parseManifest(text) {
  const { frontmatter, body } = splitFrontmatter(text);
  const lines = body.split("\n");

  const model = {
    frontmatter,
    title: null,
    overview: null,
    notFor: null,
    docs: [],
    codeMap: [],
    external: [],
    flows: [],
    tasks: [],
    glossary: [],
    policy: null,
    headings: [],
    unknownSections: [],
    todos: [],
  };

  let i = 0;
  let flow = null;
  let sub = null; // "Audiences" | "FAQ" | null

  const finishFlow = () => { if (flow) model.flows.push(flow); flow = null; sub = null; };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (line.includes("TODO(maintainer)")) model.todos.push({ line: i + 1 });

    const h1 = raw.match(/^# (.+)$/);
    if (h1) {
      model.title = h1[1].trim();
      // overview: the first non-empty paragraph that is not the Not for line
      let j = i + 1;
      const buf = [];
      while (j < lines.length) {
        const t = lines[j].trim();
        if (t.startsWith("<!--")) { while (j < lines.length && !lines[j].includes("-->")) j++; j++; continue; }
        if (t === "") { if (buf.length) break; j++; continue; }
        if (/^#{1,6} /.test(t) || t.startsWith("**Not for:**")) break;
        buf.push(t);
        j++;
      }
      if (buf.length) model.overview = buf.join(" ");
      i++;
      continue;
    }

    if (line.startsWith("**Not for:**")) {
      model.notFor = line
        .slice("**Not for:**".length)
        .split(/\s·\s|\s·\s/)
        .map((s) => s.trim())
        .filter(Boolean);
      i++;
      continue;
    }

    const h2 = raw.match(/^## (.+)$/);
    if (h2) {
      finishFlow();
      const full = h2[1].trim();
      model.headings.push({ text: full, line: i + 1 });
      const head = full.split(" — ")[0].trim();

      const flowMatch = head.match(/^Flow:\s*([^\s]+)/);
      if (flowMatch) {
        flow = {
          id: flowMatch[1],
          title: full.split(" — ").slice(1).join(" — ").replace(/\s*\(default\)\s*$/, "").trim() || null,
          isDefault: /\(default\)\s*$/.test(full),
          goal: null, signals: [], next: null,
          audiences: [], faq: [],
          line: i + 1,
        };
        i++;
        continue;
      }

      const key = SECTION_KEYS.find((k) => head.toLowerCase() === k.toLowerCase());
      if (!key) {
        model.unknownSections.push({ key: head, line: i + 1 });
        i++;
        continue;
      }

      if (key === "Docs" || key === "Code map" || key === "External" || key === "Glossary") {
        const { rows, next } = readTable(lines, i + 1);
        const body = rows.slice(1); // drop header row
        if (key === "Docs") {
          model.docs = body.map((r) => ({
            id: r.cells[0], path: r.cells[1],
            covers: (r.cells[2] ?? "").split(",").map((s) => s.trim()).filter(Boolean),
            size: r.cells[3] ?? null, line: r.line,
          }));
        } else if (key === "Code map") {
          model.codeMap = body.map((r) => ({ path: r.cells[0], what: r.cells[1], line: r.line }));
        } else if (key === "External") {
          model.external = body.map((r) => ({ url: r.cells[0], covers: r.cells[1], line: r.line }));
        } else {
          model.glossary = body.map((r) => ({ term: r.cells[0], meaning: r.cells[1], line: r.line }));
        }
        i = next;
        continue;
      }

      if (key === "Policy") {
        const { value } = readYamlFence(lines, i + 1);
        model.policy = value;
        i++;
        continue;
      }

      i++; // "Tasks" — the ### blocks below carry the content
      continue;
    }

    const h3 = raw.match(/^### (.+)$/);
    if (h3) {
      const head = h3[1].trim();
      const taskMatch = head.match(/^Task:\s*([^\s]+)/);
      if (taskMatch) {
        const { value } = readYamlFence(lines, i + 1);
        model.tasks.push({
          id: taskMatch[1],
          title: head.split(" — ").slice(1).join(" — ") || null,
          body: value, line: i + 1,
        });
        sub = null;
        i++;
        continue;
      }
      if (flow && /^Audiences$/i.test(head)) { sub = "Audiences"; i++; continue; }
      if (flow && /^FAQ$/i.test(head)) { sub = "FAQ"; i++; continue; }
      sub = null;
      i++;
      continue;
    }

    if (flow && line.startsWith(">")) {
      const meta = line.replace(/^>\s*/, "");
      const kv = meta.match(/^(Goal|Signals|Next):\s*(.*)$/i);
      if (kv) {
        const k = kv[1].toLowerCase();
        if (k === "goal") flow.goal = kv[2].trim();
        else if (k === "next") flow.next = kv[2].trim();
        else flow.signals = kv[2].split(",").map((s) => s.trim()).filter(Boolean);
      }
      i++;
      continue;
    }

    if (flow && sub && line.startsWith("- ")) {
      const text = line.slice(2);
      if (sub === "FAQ") flow.faq.push(parseFaqLine(text, i + 1));
      else flow.audiences.push(parseAudienceLine(text, i + 1));
      i++;
      continue;
    }

    i++;
  }

  finishFlow();
  return model;
}
