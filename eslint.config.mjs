// ESLint 9 flat config. Migrated from .eslintrc.json { "extends":
// "next/core-web-vitals" } because Next.js 16 removed `next lint`, and
// eslint-config-next >=16 peer-requires eslint >=9.
//
// Evidence for this shape: node_modules/eslint-config-next/dist/core-web-vitals.js
// exports a flat-config array (Linter.Config[]) directly -- no
// @eslint/eslintrc FlatCompat bridge is needed.
//
// Scope note: this deliberately extends ONLY core-web-vitals, matching the
// previous .eslintrc.json one-to-one. The additional `eslint-config-next/
// typescript` preset exists but was NOT part of the pre-migration lint
// surface; adopting it would add rules inside a migration commit instead of
// being a measured, separate decision.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// eslint-config-next@16 ships react-hooks v6, whose new compiler-powered
// rules (set-state-in-effect, refs) did not exist under the previous
// toolchain and flag 13 existing sites (12 set-state-in-effect across 11
// files + 1 ref-during-render). Faithful fixes are useSyncExternalStore-
// shaped refactors with real hydration-timing implications -- deliberately
// deferred to a dedicated adoption slice (recorded in
// data/forensic-ledger.json) rather than smuggled into this migration.
// Pinned at "warn": every run still enumerates the debt; the gate does not
// fail on findings that predate this migration.
const deferredReactHooksV6Rules = {
  "react-hooks/set-state-in-effect": "warn",
  "react-hooks/refs": "warn",
};

const eslintConfig = [
  {
    // Build output and dependencies are never lint targets. `.next` is the
    // Next.js build directory regardless of bundler (Turbopack default in 16).
    ignores: [".next/**", "node_modules/**", "out/**"],
  },
  ...nextCoreWebVitals,
  {
    rules: deferredReactHooksV6Rules,
  },
];

export default eslintConfig;

