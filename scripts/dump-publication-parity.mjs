// Publication-decision parity oracle reproducer.
//
// Dumps the complete public inventory — sorted public IDs from every
// repository getter, getPublicationSummary(), and the complete getSources()
// projections — as one JSON line, for SHA256 comparison across trees.
//
// Usage:
//   npx vite-node scripts/dump-publication-parity.mjs --out <file>
// (vite-node resolves the "@/..." alias through the committed vite.config.ts;
//  vitest keeps reading vitest.config.ts, so tests are unaffected.)
//
// Procedure used by the P02 CI-and-traversal-cost slice to prove the
// traversal-cost fix changed zero publication decisions:
//   1. git worktree add <tmp> 1d0ee6a  (pristine merge head)
//   2. junction node_modules into the worktree:
//      cmd /c mklink /J <tmp>\node_modules <repo>\node_modules
//   3. copy vite.config.ts in; run this script in both trees
//   4. compare SHA256 lines — identical means zero decision change.
// Both trees hashed to
// 832A96F0479E320E7A57FDBE9F153312607AEBFC3690E632A2D60AB0556BF9BC.
import fs from "node:fs";
import { repository } from "../src/lib/data/repository";

const dump = {
  lessons: repository.getLessons().map((r) => r.id).sort(),
  ragas: repository.getRagas().map((r) => r.id).sort(),
  talas: repository.getTalas().map((r) => r.id).sort(),
  instruments: repository.getInstruments().map((r) => r.id).sort(),
  glossary: repository.getGlossary().map((r) => r.id).sort(),
  learningPaths: repository.getLearningPaths().map((r) => r.id).sort(),
  quizzes: repository.getQuizzes().map((r) => r.id).sort(),
  examPapers: repository.getExamPapers().map((r) => r.id).sort(),
  summary: repository.getPublicationSummary(),
  sources: repository.getSources(),
};
const line = JSON.stringify(dump);
const out = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : "parity-dump.json";
fs.writeFileSync(out, line, "utf8");
const { createHash } = await import("node:crypto");
console.log(`wrote ${out} bytes=${line.length} sha256=${createHash("sha256").update(line).digest("hex")}`);
