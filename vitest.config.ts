import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    // Vitest's 5s default is too tight for this suite, and the symptom is a
    // flaky failure that moves between tests rather than a stable one.
    //
    // Measured over five local full-suite runs (24 files / 583 tests): three
    // runs failed, each with a *different* single test, always "Test timed out
    // in 5000ms" at 5112-5135ms, sometimes alongside a
    // "[vitest-worker]: Timeout calling onTaskUpdate" RPC error. The same
    // tests pass in isolation with a stable ~2.8s. In a loaded run the suite
    // has tests at 58s, 27s, 22s, 15s, 14s, 11s, and several near 6-8s; the
    // heavy ones already carry explicit ceilings (60s budget-scale graph
    // traversal, 30s search-engine and admin-page) and therefore survive,
    // while any test that merely lands near 5s under parallel worker
    // contention crosses the default and fails.
    //
    // This is contention, not a regression: hosted CI passes the same commit,
    // and the publication-decision parity dump is byte-identical to the base.
    // Raising the default addresses the whole class instead of chasing
    // whichever test loses the race; 30s matches the ceiling already used by
    // the explicitly-annotated tests. Genuinely hung work still fails, just
    // 30s later, which is a good trade for a suite this size.
    testTimeout: 30_000,
    // This host has 4 logical CPUs, and the suite's heavy tests are CPU-bound
    // and synchronous (bounded-graph traversal, uncached publication-summary
    // recomputes). At default parallelism the forks oversubscribe the machine
    // and block their own event loops, so the worker cannot answer the main
    // thread's reporter RPC within its 5s budget. The observed symptom is a
    // run where every one of the 583 tests passes but the process still exits
    // non-zero with an unhandled `[vitest-worker]: Timeout calling
    // "onTaskUpdate"` — a reporting failure masquerading as a red build.
    //
    // Capping workers leaves a core for the main thread and its reporter.
    // Measured across three consecutive full runs after this change:
    // 73.3s / 72.1s / 72.1s wall clock, all exit 0, zero RPC errors. Before
    // it, five runs ranged 60-129s with three failures (two different tests
    // timing out at ~5.1s, and one run where all 583 passed but the process
    // still exited non-zero on the reporter RPC). Less oversubscription made
    // the suite dramatically more consistent at no meaningful cost, because
    // the earlier spread was contention rather than parallel speedup.
    //
    // 2 is tuned to this 4-CPU host. A CI runner with more cores can afford
    // more; raise it only alongside measurements like the above, since the
    // failure it prevents is intermittent and reports as a red build.
    //
    // Vitest 4 re-validation (next16-modernization slice): both values were
    // retained unchanged through the vitest ^3.2.7 -> ^4.1.11 upgrade and
    // re-validated on the upgraded runner - full suite 24 files / 583 tests
    // in ~56s, exit 0, no RPC errors observed across repeated runs. Whether
    // the Vitest 3-era RPC diagnosis above still reproduces under Vitest 4
    // is unknown; the conservative settings are kept because the failure
    // they guarded against presented as a red build and their cost is
    // bounded. Standard ubuntu-latest runners are also 4-vCPU, so hosted CI
    // inherits the same scheduling envelope.
    //
    // EMPIRICAL ANSWER (anchor-engine-hardening slice): the Vitest 4 RPC
    // failure does NOT reproduce at higher concurrency. Measured on this
    // host, three consecutive full runs per setting, all exit 0 with zero
    // RPC errors and zero test failures:
    //   maxWorkers 2: 101.8s / 85.0s / 89.6s   (25 files / 596 tests)
    //   maxWorkers 4: 71.0s / 56.9s / 53.3s    (27 files / 600 tests)
    // The cap is therefore raised to match this host's logical CPU count;
    // hosted ubuntu-latest runners share the same 4-vCPU envelope. If a red
    // build ever reappears with all tests passing, drop back to 2 and record
    // it here. Note the two timing sets bracket adjacent tree states (596 vs
    // 600 tests — the parity split landed between them), so treat them as
    // directionally comparable rather than a strict like-for-like benchmark.
    maxWorkers: 4,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
