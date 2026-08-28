import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { parseManifest } from "./parse.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = resolve(HERE, "..", "templates");

/** owner/repo and default branch, from the git remote. */
export function detectRepo(root) {
  const run = (...args) => {
    try {
      return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
      return null;
    }
  };
  const url = run("remote", "get-url", "origin");
  let slug = null;
  if (url) {
    const m = url.match(/github\.com[:/]+([^/]+\/[^/.]+)(?:\.git)?\/?$/);
    if (m) slug = m[1];
  }
  let branch = run("symbolic-ref", "--short", "HEAD");
  const head = run("symbolic-ref", "refs/remotes/origin/HEAD");
  if (head) branch = head.split("/").pop();
  return { slug, branch: branch || "main" };
}

export function renderPrompt({ root = process.cwd(), lang = "en", blockOnly = true } = {}) {
  const file = join(TEMPLATES, `readme-block.${lang}.md`);
  if (!existsSync(file)) {
    throw new Error(`No template for language "${lang}". Available: en, ko`);
  }
  let text = readFileSync(file, "utf8");

  const { slug, branch } = detectRepo(root);
  if (slug) text = text.replace(/<org>\/<repo>/g, slug);
  if (branch && branch !== "main") {
    text = text.replace(/(AGENT_GUIDE\.md[\s\S]*?)/, (s) => s); // no-op guard
    text = text.replace(/\/main\/AGENT_GUIDE\.md/g, `/${branch}/AGENT_GUIDE.md`);
  }

  if (!blockOnly) return { text, slug, branch };

  // The inner fenced block is what a user actually pastes into an agent.
  const fences = [...text.matchAll(/```\n([\s\S]*?)```/g)];
  const inner = fences.length ? fences[0][1] : text;
  return { text: inner.trimEnd(), slug, branch, full: text };
}


/**
 * The inline variant carries the first reply instead of asking the agent to
 * compute it. Overview, `Not for`, the flow menu and the default flow's FAQ are
 * lifted straight out of the manifest and pasted into the block, so the agent
 * needs no tool call before its first token.
 *
 * Measured on one repo, two samples each: time to first token 4.2s → 2.0s,
 * turn total 16s → 6.2s, tool calls before the first reply 1 → 0. The block is
 * the product and the wait after pasting it is the product's first impression.
 *
 * The cost is a copy of manifest content living in the README. That is exactly
 * the drift this project has been bitten by twice, so the block is generated,
 * never hand-written, and carries a digest `validate` can check.
 */
const INLINE = {
  en: {
    lead: "You are running an Agent Guide session for this project. Use the overview below as written.",
    notFor: "Not for:",
    menu: "What would you like to do?",
    faq: "Common questions:",
    rules: [
      "RULES (do not open any file yet — show the above and wait for my answer)",
      "- When I ask something, read ./AGENT_GUIDE.md then pick documents by the `covers`",
      "  column in its Docs table. One or two is usually enough.",
      "- Cite the path for anything from a document. Label anything outside the manifest",
      "  as such — reasoning is welcome, unlabelled certainty is not.",
      "- If a path will not resolve, work it out yourself: repo root, then the frontmatter",
      "  `base`, then a filename search. Do not hand the choice back to me.",
      "- Tasks commands need my go-ahead. A step tagged `effects` needs an explicit yes and",
      "  a plain sentence saying what the effect is.",
      "- If what I say matches another Flow's Signals, answer first, then offer to switch.",
      "",
      "Keep it short, and answer in my language.",
    ],
  },
  ko: {
    lead: "당신은 이 프로젝트의 Agent Guide 세션을 진행합니다. 아래 개요는 그대로 쓰세요.",
    notFor: "이건 하지 않습니다:",
    menu: "무엇을 하시겠어요?",
    faq: "자주 나오는 질문:",
    rules: [
      "■ 규칙 (지금은 파일을 열지 마세요. 위 내용을 보여주고 내 답을 기다리세요.)",
      "· 내가 질문하면 그때 ./AGENT_GUIDE.md 를 읽고, Docs 표의 covers로 열 문서를 고르세요.",
      "  보통 1~2개면 됩니다.",
      "· 문서에서 온 답은 경로를 적고, 매니페스트 밖이면 그렇게 표시하세요.",
      "  추론은 환영합니다. 표시 없는 단정만 하지 마세요.",
      "· 경로가 안 잡히면 저장소 루트 → frontmatter base → 파일명 검색 순으로 스스로 해결하세요.",
      "· Tasks의 명령은 동의를 받고, effects가 붙은 단계는 무슨 영향인지 말한 뒤 명시적 승낙을 받으세요.",
      "· 다른 Flow의 Signals에 맞으면 먼저 답하고 전환을 제안하세요.",
      "",
      "간결하게, 내가 쓰는 언어로 답하세요.",
    ],
  },
};

/** Content the inline block reproduces, hashed so staleness is detectable. */
export function digestOf(manifestText) {
  const m = parseManifest(manifestText);
  const flow = m.flows.find((f) => f.isDefault) ?? m.flows[0];
  const parts = [
    m.overview ?? "",
    (m.notFor ?? []).join("|"),
    m.flows.map((f) => `${f.id}:${f.title ?? ""}:${f.isDefault ? 1 : 0}`).join("|"),
    (flow?.faq ?? []).slice(0, 5).map((e) => e.question).join("|"),
  ].join("\n");
  return { hash: createHash("sha256").update(parts).digest("hex").slice(0, 8), model: m, flow };
}

export function renderInlinePrompt(manifestPath, { lang = "en" } = {}) {
  const text = readFileSync(manifestPath, "utf8");
  const { hash, model, flow } = digestOf(text);
  const t = INLINE[lang] ?? INLINE.en;
  if (!model.overview) throw new Error("manifest has no overview paragraph — nothing to inline");

  const menu = model.flows
    .map((f) => `  - ${f.id}${f.isDefault ? ` (${lang === "ko" ? "기본" : "default"})` : ""}${f.title ? ` — ${f.title}` : ""}`)
    .join("\n");
  const faq = (flow?.faq ?? []).slice(0, 5).map((e) => `  - ${e.question}`).join("\n");

  const body = [
    t.lead,
    "",
    model.overview,
    "",
    `${t.notFor} ${(model.notFor ?? []).join(" · ")}`,
    "",
    t.menu,
    menu,
    "",
    t.faq,
    faq,
    "",
    ...t.rules,
  ].join("\n");

  return { text: body, hash, marker: `<!-- agent-guide:inline ${hash} -->` };
}


/**
 * The authoring prompt: what a maintainer pastes into an agent in a repository
 * that has no manifest yet.
 *
 * It carries the format inline rather than pointing at the spec. Asking an
 * agent to fetch SPEC.md fails in exactly the case this is most needed — a
 * private repository, or a session with no network — and an agent that cannot
 * read the format writes a README summary instead, which is the one outcome
 * the authoring protocol exists to prevent.
 */
export function renderAuthoringPrompt({ lang = "en" } = {}) {
  const file = join(TEMPLATES, `authoring-prompt.${lang}.md`);
  if (!existsSync(file)) throw new Error(`No authoring prompt for language "${lang}". Available: en, ko`);
  const text = readFileSync(file, "utf8");
  const fence = text.match(/```\n([\s\S]*?)\n```\s*$/);
  return { text: (fence ? fence[1] : text).trimEnd(), full: text };
}
