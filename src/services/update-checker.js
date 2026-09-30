/**
 * FastFiller — Update Checker Service
 * Copyright (c) 2026 Maurya Ankur, Singh Sanjiv, aeigs.com
 * Licensed under the MIT License.
 * Authors: Maurya Ankur (https://www.linkedin.com/in/ankur-maurya1/), Singh Sanjiv (https://www.linkedin.com/in/sanjiv-singh/)
 * Organization: Aeigs (https://aeigs.com)
 */

export const UPDATE_CONFIG = {
  // Remote endpoint configured for open-source FastFiller repository
  manifestUrl: 'https://raw.githubusercontent.com/mauryaankur99/FastFiller/main/manifest.json',
  // Releases / Download page
  releaseUrl: 'https://github.com/mauryaankur99/FastFiller/releases',
  // Cooldown between background auto-checks (24 hours)
  checkIntervalMs: 24 * 60 * 60 * 1000
};

export const STORAGE_KEY = 'fastfiller_update_state';

/**
 * Compares two semantic version strings (e.g. '1.0.1' vs '1.0.0').
 * Returns true if remoteVersion is strictly newer than currentVersion.
 */
export function isNewerVersion(remoteVersion, currentVersion) {
  if (!remoteVersion || !currentVersion) return false;
  const parse = (v) => v.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const [rMajor, rMinor, rPatch] = parse(remoteVersion);
  const [cMajor, cMinor, cPatch] = parse(currentVersion);

  if (rMajor > cMajor) return true;
  if (rMajor < cMajor) return false;
  if (rMinor > cMinor) return true;
  if (rMinor < cMinor) return false;
  return rPatch > cPatch;
}

/**
 * Gets currently installed extension version from manifest.
 */
export function getCurrentVersion() {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
    try {
      return chrome.runtime.getManifest()?.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }
  return '1.0.0';
}

/**
 * Checks for updates from the remote manifest.
 * Fails silently with zero errors if network is down or repo doesn't exist yet.
 */
export async function checkForUpdate(force = false) {
  const currentVersion = getCurrentVersion();
  let cached = null;

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      const data = await chrome.storage.local.get([STORAGE_KEY]);
      cached = data?.[STORAGE_KEY] || null;
    } catch {}
  }

  const now = Date.now();
  if (!force && cached && (now - (cached.lastCheckTime || 0) < UPDATE_CONFIG.checkIntervalMs)) {
    const isNewer = isNewerVersion(cached.latestVersion, currentVersion);
    const notDismissed = cached.latestVersion !== cached.dismissedVersion;
    return {
      currentVersion,
      latestVersion: cached.latestVersion || currentVersion,
      updateAvailable: Boolean(isNewer && notDismissed),
      releaseUrl: cached.releaseUrl || UPDATE_CONFIG.releaseUrl,
      lastCheckTime: cached.lastCheckTime,
      fromCache: true
    };
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 4500) : null;

  try {
    const fetchOptions = {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    };
    if (controller) fetchOptions.signal = controller.signal;

    const response = await fetch(UPDATE_CONFIG.manifestUrl, fetchOptions);
    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        currentVersion,
        latestVersion: cached?.latestVersion || currentVersion,
        updateAvailable: false,
        releaseUrl: UPDATE_CONFIG.releaseUrl,
        lastCheckTime: now
      };
    }

    const remoteManifest = await response.json();
    const remoteVersion = remoteManifest?.version;

    if (!remoteVersion || typeof remoteVersion !== 'string') {
      return {
        currentVersion,
        latestVersion: currentVersion,
        updateAvailable: false,
        releaseUrl: UPDATE_CONFIG.releaseUrl,
        lastCheckTime: now
      };
    }

    const hasNewer = isNewerVersion(remoteVersion, currentVersion);
    const updateAvailable = hasNewer && remoteVersion !== cached?.dismissedVersion;

    const newState = {
      currentVersion,
      latestVersion: remoteVersion,
      updateAvailable: hasNewer,
      releaseUrl: UPDATE_CONFIG.releaseUrl,
      lastCheckTime: now,
      dismissedVersion: cached?.dismissedVersion || null
    };

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_KEY]: newState }).catch(() => {});
    }

    return {
      ...newState,
      updateAvailable
    };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    return {
      currentVersion,
      latestVersion: cached?.latestVersion || currentVersion,
      updateAvailable: false,
      releaseUrl: UPDATE_CONFIG.releaseUrl,
      lastCheckTime: now
    };
  }
}

/**
 * Dismisses the current update alert for a specific version.
 */
export async function dismissUpdate(version) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      const data = await chrome.storage.local.get([STORAGE_KEY]);
      const current = data?.[STORAGE_KEY] || {};
      current.dismissedVersion = version;
      await chrome.storage.local.set({ [STORAGE_KEY]: current });
    } catch {}
  }
}
