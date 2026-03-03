# Learnings — dep-pruning

## 2026-03-03 Session Start
- Worktree: /Users/andyye/dev/node-llama-cpp-dep-pruning (branch: dep-pruning)
- Plan: Remove ~16 unused deps from node-llama-cpp for Alt Electron app
- Key insight: getLlama.ts statically imports compileLLamaCpp.ts and cloneLlamaCppRepo.ts which drag in heavy deps
- chalk, fs-extra, env-var, nanoid, lifecycle-utils, proper-lockfile, strip-ansi, is-unicode-supported are in CORE code — must stay
- filenamify, pretty-ms, async-retry tangled via readGgufFileInfo.ts → parseModelUri.ts — leave them
- node-addon-api has ZERO TypeScript imports, only used in llama/CMakeLists.txt — safe to remove
- Electron default is already build: "never" — compile code is dead weight at runtime

## 2026-03-03 Task 1 - CLI removal
- Deleted src/cli/ and src/commands.ts in dep-pruning worktree.
- Verified deletion using shell tests with PASS output.

## 2026-03-03 Task 4 - compileLLamaCpp.ts gut + cloneLlamaCppRepo.ts stub
- **compileLLamaCpp.ts**: Reduced from 700 lines → 209 lines. Removed `compileLlamaCpp()` and 9 build-only helper functions (moveBuildFilesToResultDir, applyResultDirFixes, getCmakePathArgs, getToolchainFileForArch, getCmakeGeneratorArgs, getParallelBuildThreadsToUse, reduceParallelBuildThreads, isCmakeValueOff, areWindowsBuildToolsCapableForLlvmBuild).
- Preserved exactly: 4 exported prebuilt helpers (getLocalBuildBinaryPath, getLocalBuildBinaryBuildMetadata, getPrebuiltBinaryPath, getPrebuiltBinaryBuildMetadata) + 2 private helpers (resolvePrebuiltBinaryPath, getPrebuiltBinariesPackageDirectoryForBuildOptions).
- Cleaned imports: removed `fileURLToPath`, `process`, `os`, `chalk`, `which`, `spawnCommand`, cmake utils, `getConsoleLogPrefix`, `withLockfile`, `ensureLlamaCppRepoIsCloned`/`isLlamaCppRepoCloned`, `getBuildFolderNameForBuildOptions`, `setLastBuildInfo`, `BinaryPlatform`/`getPlatform`, `logDistroInstallInstruction`, `testCmakeBinary`, `getCudaNvccPaths`, `detectWindowsBuildTools`, `asyncSome`. Also removed `BuildGpu` and `convertBuildOptionsToBuildOptionsJSON` from types import. Trimmed config import to just `buildMetadataFileName`, `llamaLocalBuildBinsDirectory`, `llamaPrebuiltBinsDirectory`.
- Removed constants: `__dirname`, `requiresMsvcOnWindowsFlags`. Kept `buildConfigType`.
- **cloneLlamaCppRepo.ts**: Replaced entire 217-line file with 22-line stub. All 4 exports preserved as no-ops: `cloneLlamaCppRepo` (noop), `getClonedLlamaCppRepoReleaseInfo` (returns null), `isLlamaCppRepoCloned` (returns false), `ensureLlamaCppRepoIsCloned` (noop). Zero heavy imports.
- No surprises — all import analysis matched the task spec exactly. Both files have zero TS errors.
- getLlama.ts still imports `compileLlamaCpp` (function) from this file — that'll be a TS error until Task 5 handles it.

## 2026-03-03 Task 5 - getLlama.ts simplification (build-from-source removal)
- **File reduced**: 1059 → 824 lines (235 lines removed, ~22% reduction)
- **Removed imports**: `compileLlamaCpp` (from compileLLamaCpp.js), `resolveCustomCmakeOptions` (resolveCustomCmakeOptions.js), `hasBuildingFromSourceDependenciesInstalled` (hasBuildingFromSourceDependenciesInstalled.js)
- **Removed function**: `buildAndLoadLlamaBinary()` (lines 905-965) — the core build-from-source entry point
- **Removed variable**: `canBuild` — was a computed boolean checking `build !== "never"`, `!runningInsideAsar`, and deps installed
- **Removed code blocks**: `build === "try"` complex branch (42 lines → 3 lines), `canBuild && build === "autoAttempt"` block (50 lines), entire second build loop (lines 650-721, 72 lines)
- **Simplified**: `defaultBuildOption` constant hardcoded to `"never"` (was conditional on `runningInElectron`)
- **Replaced**: `resolveCustomCmakeOptions(cmakeOptions)` with `new Map(Object.entries(cmakeOptions))` — the original also picked up env vars like GGML_METAL/GGML_CUDA but those are only relevant for building
- **Key design**: `build` option type kept as-is for API compatibility (`"auto" | "never" | "forceRebuild" | "try" | "autoAttempt"`), but all non-"never" values now degrade gracefully: "try" → "never", "auto"/"autoAttempt" → tries prebuilt then throws, "forceRebuild" → throws immediately
- **Preserved exactly**: `loadExistingLlamaBinary()` (prebuilt binary loading), `logNoGlibcWarning()`, `describeBinary()`, `loadBindingModule()`, `getShouldTestBinaryBeforeLoading()`, all function signatures
- **Unused imports left**: `runningInsideAsar` and `runningInElectron` from runtime.js are now unused — task didn't specify removing them, Task 6 or later can clean up
- Zero LSP diagnostics on the modified file

## 2026-03-03 Task 6 - orphaned utility file cleanup
- Deleted 10 build-only utility files in src/utils and src/bindings/utils after build-from-source/CLI removals made them unreachable from core runtime code.
- Verified all deletions with explicit shell file-existence checks (all PASS).

- 2026-03-03 21:37 — Cleaned src/index.ts by removing stale imports/exports for deleted model-downloader/resolveModelFile/modelFileAccessTokens modules; preserved all other exports. Verified grep counts: resolveModelFile/createModelDownloader/combineModelDownloaders/ModelDownloader/ModelFileAccessTokens = 0; getLlama=5, LlamaChatSession=13, LlamaModel=6. LSP diagnostics on src/index.ts: no issues.

## 2026-03-03 Task 7 - package.json cleanup
- Removed package-level CLI/distribution metadata not needed in the fork: deleted top-level `bin`, removed `./commands` and `./commands.js` from `exports`, and removed `templates/packed/` from `files`.
- Removed scripts tied to template install, husky setup, and source-build CLI flow: `prepare`, `postinstall`, `cmake-js-llama`, `addPostinstallScript`, `dev:setup`, `dev:build`.
- Pruned 16 runtime dependencies now orphaned by prior code deletion: `yargs`, `cmake-js`, `simple-git`, `cross-spawn`, `which`, `chmodrp`, `ipull`, `ora`, `log-symbols`, `slice-ansi`, `stdout-update`, `bytes`, `validate-npm-package-name`, `ignore`, `semver`, `node-addon-api`.
- Explicitly retained core runtime deps (`@huggingface/jinja`, `async-retry`, `chalk`, `env-var`, `filenamify`, `fs-extra`, `is-unicode-supported`, `lifecycle-utils`, `nanoid`, `pretty-ms`, `proper-lockfile`, `strip-ansi`) and left `optionalDependencies`, `peerDependencies`, and `devDependencies` untouched.
- Verification: all required node checks passed (`all removed`, `bin absent`, `postinstall absent`, `required deps present`, `valid JSON`) and LSP diagnostics on `package.json` returned no issues.

## 2026-03-03 Task 9 - TypeScript compilation fix

- **Initial state**: `npx tsc --noEmit` had ~110 errors. Most were TS2307 "Cannot find module" due to missing node_modules (worktree had no `npm install` run).
- **After `npm install`**: Down to 12 errors in 3 categories:
  1. **Missing `modelDownloadEndpoints.ts`** (5 files) — incorrectly deleted in Task 3 along with model downloader files. This module exports `ModelDownloadEndpoints` type, `resolveHuggingFaceEndpoint()`, and `isHuggingFaceUrl()` which are used by GGUF network reading, model URI parsing, and URL normalization. **Fix**: restored the file from HEAD with `git checkout`.
  2. **Missing `getReadablePath.ts`** (2 files: LlamaModel.ts, GgufInsights.ts) — was in deleted `src/cli/utils/` directory. A simple utility with no CLI dependencies. **Fix**: created `src/utils/getReadablePath.ts` and updated imports in LlamaModel.ts and GgufInsights.ts from `../../cli/utils/getReadablePath.js` → `../../utils/getReadablePath.js`.
  3. **Type 'never' on `cloneLlamaCppRepoReleaseInfo`** (2 files: getLlama.ts, getCanUsePrebuiltBinaries.ts) — the Task 4 stub typed `getClonedLlamaCppRepoReleaseInfo()` as `Promise<null>`, but callers access `.tag` and `.llamaCppGithubRepo` via optional chaining. TypeScript infers `null?.prop` → accessing property on type `never`. **Fix**: changed stub return type to `Promise<{tag: string, llamaCppGithubRepo: string} | null>`.
- **Key lesson**: When stubbing functions, preserve the original return type signature even when returning null — callers may use optional chaining which breaks with `Promise<null>`.
- **Key lesson**: `modelDownloadEndpoints.ts` is NOT a model-downloader file — it's a URL resolution utility used by GGUF reading. Should not have been deleted in model downloader cleanup.
- **Result**: `npx tsc --noEmit --project tsconfig.json` exits cleanly with code 0, zero errors.
