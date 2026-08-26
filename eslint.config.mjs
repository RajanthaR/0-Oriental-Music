// ESLint 9 flat config. Migrated from .eslintrc.json { "extends":
// "next/core-web-vitals" } because Next.js 16 removed `next lint`, and
// eslint-config-next >=16 peer-requires eslint >=9.
//
// Provenance: eslint-config-next@16 ships native flat-config arrays, so no
// @eslint/eslintrc FlatCompat bridge is needed. Discovery evidence and the
// full deferred-debt census live in the tracked record rather than here:
// data/forensic-ledger.json -> nextSixteenModernization.lintMigration.
//
// Scope note: this deliberately extends ONLY core-web-vitals, matching the
// previous .eslintrc.json one-to-one. The additional typescript preset was
// NOT adopted inside a migration commit; that remains a separate measured
// decision.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// react-hooks v6 adoption COMPLETE (slice history: validation-consolidation
// -> next16-modernization -> hooks-adoption). All thirteen flagged sites
// were refactored, so the two compiler-powered rules that used to be
// warn-pinned behind a --max-warnings ratchet are now enforced at error
// severity. Do not downgrade either rule without a recorded decision in
// data/forensic-ledger.json.
const reactHooksV6Enforcement = {
  "react-hooks/set-state-in-effect": "error",
  "react-hooks/refs": "error",
};

const eslintConfig = [
  {
    // Build output and dependencies are never lint targets. `.next` is the
    // Next.js build directory regardless of bundler (Turbopack default in 16).
    ignores: [".next/**", "node_modules/**", "out/**"],
  },
  ...nextCoreWebVitals,
  {
    rules: reactHooksV6Enforcement,
  },
];

export default eslintConfig;

