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

// eslint-config-next@16 ships react-hooks v6, whose new compiler-powered
// rules flag pre-existing sites that did not exist under the previous
// toolchain. Faithful fixes are useSyncExternalStore-shaped refactors with
// hydration-timing implications -- deliberately deferred to a dedicated
// adoption slice (rationale and per-site census: ledger section above).
//
// These two pins pair with the --max-warnings floor in package.json's lint
// script: the floor equals the current warn count, so any NEW violation of
// either rule turns the gate red while this slice's debt stays green. The
// floor MUST be lowered whenever one of these sites is fixed, and both
// rules flip to "error" once the debt reaches zero, retiring this block.
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

