// Stubbed — build-from-source / git clone functionality removed for Alt Electron fork.
// Original exports preserved as no-ops to satisfy import sites.

export async function cloneLlamaCppRepo(
    _githubOwner: string, _githubRepo: string, _tag: string, _useBundles: boolean = true, _progressLogs: boolean = true,
    _recursive: boolean = false
): Promise<void> {
    // noop — cloning not supported in this fork
}

export async function getClonedLlamaCppRepoReleaseInfo(): Promise<{tag: string, llamaCppGithubRepo: string} | null> {
    return null;
}

export async function isLlamaCppRepoCloned(_waitForLock: boolean = true): Promise<boolean> {
    return false;
}

export async function ensureLlamaCppRepoIsCloned(_options?: {progressLogs?: boolean}): Promise<void> {
    // noop — cloning not supported in this fork
}
