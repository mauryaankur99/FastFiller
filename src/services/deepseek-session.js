// ============================================================
// FastFiller — DeepSeek Web Session Service
// Zero-Key, Zero-API-Cost Client via chat.deepseek.com
// Uses active logged-in browser session cookies & tokens
// ============================================================

export const DEEPSEEK_BASE = 'https://chat.deepseek.com';
export const CURRENT_USER_URL = `${DEEPSEEK_BASE}/api/v0/users/current`;
export const CREATE_SESSION_URL = `${DEEPSEEK_BASE}/api/v0/chat_session/create`;
export const DELETE_SESSION_URL = `${DEEPSEEK_BASE}/api/v0/chat_session/delete`;
export const POW_CHALLENGE_URL = `${DEEPSEEK_BASE}/api/v0/chat/create_pow_challenge`;
export const COMPLETION_URL = `${DEEPSEEK_BASE}/api/v0/chat/completion`;

/**
 * 24 round constants for Keccak-f[1600].
 */
export const RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808An, 0x8000000080008000n,
  0x000000000000808Bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008An, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000An,
  0x000000008000808Bn, 0x800000000000008Bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800An, 0x800000008000000An,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

export function rotl64(v, k) {
  const bk = BigInt(k);
  return ((v << bk) | (v >> (64n - bk))) & 0xFFFFFFFFFFFFFFFFn;
}

/**
 * Keccak-f[1600] 23-round permutation (skips round 0, doing rounds 1..23).
 */
export function keccakF23(s) {
  let [a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21, a22, a23, a24] = s;

  for (let r = 1; r < 24; r++) {
    const c0 = a0 ^ a5 ^ a10 ^ a15 ^ a20;
    const c1 = a1 ^ a6 ^ a11 ^ a16 ^ a21;
    const c2 = a2 ^ a7 ^ a12 ^ a17 ^ a22;
    const c3 = a3 ^ a8 ^ a13 ^ a18 ^ a23;
    const c4 = a4 ^ a9 ^ a14 ^ a19 ^ a24;

    const d0 = c4 ^ rotl64(c1, 1);
    const d1 = c0 ^ rotl64(c2, 1);
    const d2 = c1 ^ rotl64(c3, 1);
    const d3 = c2 ^ rotl64(c4, 1);
    const d4 = c3 ^ rotl64(c0, 1);

    a0 ^= d0; a5 ^= d0; a10 ^= d0; a15 ^= d0; a20 ^= d0;
    a1 ^= d1; a6 ^= d1; a11 ^= d1; a16 ^= d1; a21 ^= d1;
    a2 ^= d2; a7 ^= d2; a12 ^= d2; a17 ^= d2; a22 ^= d2;
    a3 ^= d3; a8 ^= d3; a13 ^= d3; a18 ^= d3; a23 ^= d3;
    a4 ^= d4; a9 ^= d4; a14 ^= d4; a19 ^= d4; a24 ^= d4;

    const b0 = a0;
    const b10 = rotl64(a1, 1);
    const b20 = rotl64(a2, 62);
    const b5 = rotl64(a3, 28);
    const b15 = rotl64(a4, 27);
    const b16 = rotl64(a5, 36);
    const b1 = rotl64(a6, 44);
    const b11 = rotl64(a7, 6);
    const b21 = rotl64(a8, 55);
    const b6 = rotl64(a9, 20);
    const b7 = rotl64(a10, 3);
    const b17 = rotl64(a11, 10);
    const b2 = rotl64(a12, 43);
    const b12 = rotl64(a13, 25);
    const b22 = rotl64(a14, 39);
    const b23 = rotl64(a15, 41);
    const b8 = rotl64(a16, 45);
    const b18 = rotl64(a17, 15);
    const b3 = rotl64(a18, 21);
    const b13 = rotl64(a19, 8);
    const b14 = rotl64(a20, 18);
    const b24 = rotl64(a21, 2);
    const b9 = rotl64(a22, 61);
    const b19 = rotl64(a23, 56);
    const b4 = rotl64(a24, 14);

    a0 = b0 ^ (~b1 & b2);
    a1 = b1 ^ (~b2 & b3);
    a2 = b2 ^ (~b3 & b4);
    a3 = b3 ^ (~b4 & b0);
    a4 = b4 ^ (~b0 & b1);
    a5 = b5 ^ (~b6 & b7);
    a6 = b6 ^ (~b7 & b8);
    a7 = b7 ^ (~b8 & b9);
    a8 = b8 ^ (~b9 & b5);
    a9 = b9 ^ (~b5 & b6);
    a10 = b10 ^ (~b11 & b12);
    a11 = b11 ^ (~b12 & b13);
    a12 = b12 ^ (~b13 & b14);
    a13 = b13 ^ (~b14 & b10);
    a14 = b14 ^ (~b10 & b11);
    a15 = b15 ^ (~b16 & b17);
    a16 = b16 ^ (~b17 & b18);
    a17 = b17 ^ (~b18 & b19);
    a18 = b18 ^ (~b19 & b15);
    a19 = b19 ^ (~b15 & b16);
    a20 = b20 ^ (~b21 & b22);
    a21 = b21 ^ (~b22 & b23);
    a22 = b22 ^ (~b23 & b24);
    a23 = b23 ^ (~b24 & b20);
    a24 = b24 ^ (~b20 & b21);

    a0 ^= RC[r];
  }

  s[0] = a0; s[1] = a1; s[2] = a2; s[3] = a3; s[4] = a4;
  s[5] = a5; s[6] = a6; s[7] = a7; s[8] = a8; s[9] = a9;
  s[10] = a10; s[11] = a11; s[12] = a12; s[13] = a13; s[14] = a14;
  s[15] = a15; s[16] = a16; s[17] = a17; s[18] = a18; s[19] = a19;
  s[20] = a20; s[21] = a21; s[22] = a22; s[23] = a23; s[24] = a24;
}

/**
 * Computes DeepSeekHashV1 for a string or byte array.
 * Matches DeepSeek's official WebAssembly sha3_wasm_bg.wasm exactly.
 */
export function deepSeekHashV1(input) {
  const encoder = new TextEncoder();
  const data = typeof input === 'string' ? encoder.encode(input) : input;
  const rate = 136;
  const s = new BigUint64Array(25);
  let off = 0;

  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);

  while (off + rate <= data.length) {
    for (let i = 0; i < rate / 8; i++) {
      s[i] ^= dataView.getBigUint64(off + i * 8, true);
    }
    keccakF23(s);
    off += rate;
  }

  const finalBuf = new Uint8Array(rate);
  finalBuf.set(data.subarray(off));
  finalBuf[data.length - off] = 0x06;
  finalBuf[rate - 1] |= 0x80;

  const finalView = new DataView(finalBuf.buffer);
  for (let i = 0; i < rate / 8; i++) {
    s[i] ^= finalView.getBigUint64(i * 8, true);
  }
  keccakF23(s);

  const outBuf = new ArrayBuffer(32);
  const outView = new DataView(outBuf);
  outView.setBigUint64(0, s[0], true);
  outView.setBigUint64(8, s[1], true);
  outView.setBigUint64(16, s[2], true);
  outView.setBigUint64(24, s[3], true);

  return Array.from(new Uint8Array(outBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Solves DeepSeek Proof-of-Work challenge by searching nonce [0, difficulty).
 */
export function solveDeepSeekPow(challengeHex, salt, expireAt, difficulty = 144000) {
  const enc = new TextEncoder();
  const targetBytes = new Uint8Array(challengeHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  const tView = new DataView(targetBytes.buffer);
  const t0 = tView.getBigUint64(0, true);
  const t1 = tView.getBigUint64(8, true);
  const t2 = tView.getBigUint64(16, true);
  const t3 = tView.getBigUint64(24, true);

  const prefix = enc.encode(salt + '_' + expireAt + '_');
  const rate = 136;
  const baseState = new BigUint64Array(25);
  let off = 0;
  const pView = new DataView(prefix.buffer, prefix.byteOffset, prefix.byteLength);

  while (off + rate <= prefix.length) {
    for (let i = 0; i < rate / 8; i++) {
      baseState[i] ^= pView.getBigUint64(off + i * 8, true);
    }
    keccakF23(baseState);
    off += rate;
  }

  const tailLen = prefix.length - off;
  const tail = prefix.subarray(off);

  const buf = new Uint8Array(rate);
  buf.set(tail, 0);
  const bView = new DataView(buf.buffer);
  const s = new BigUint64Array(25);
  const numBuf = new Uint8Array(20);

  for (let n = 0; n < difficulty; n++) {
    let v = n;
    let pos = 20;
    if (v === 0) {
      pos--;
      numBuf[pos] = 48; // '0'
    } else {
      while (v > 0) {
        pos--;
        numBuf[pos] = 48 + (v % 10);
        v = (v / 10) | 0;
      }
    }
    const numLen = 20 - pos;
    for (let j = 0; j < numLen; j++) {
      buf[tailLen + j] = numBuf[pos + j];
    }
    const totalTail = tailLen + numLen;
    buf[totalTail] = 0x06;
    buf.fill(0, totalTail + 1, rate - 1);
    buf[rate - 1] = 0x80;

    s.set(baseState);
    for (let i = 0; i < rate / 8; i++) {
      s[i] ^= bView.getBigUint64(i * 8, true);
    }
    keccakF23(s);

    if (s[0] === t0 && s[1] === t1 && s[2] === t2 && s[3] === t3) {
      return n;
    }
  }
  return -1;
}

/**
 * Finds the best active or loaded DeepSeek tab.
 */
export async function findDeepSeekTab() {
  if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
    return null;
  }
  const tabs = await chrome.tabs.query({ url: '*://chat.deepseek.com/*' });
  if (!tabs || tabs.length === 0) return null;

  // Prioritize active tab, then tab on /chat or /a/chat, then first tab
  return tabs.find(t => t.active) ||
         tabs.find(t => t.url && (t.url.includes('/chat') || t.url.includes('/a/chat'))) ||
         tabs[0];
}

/**
 * Checks whether user has an active, authenticated DeepSeek session.
 * STRICT: Verified via same-origin /api/v0/users/current inside open DeepSeek tab.
 */
export async function checkDeepSeekSessionStatus() {
  try {
    const tab = await findDeepSeekTab();
    if (!tab) {
      return {
        success: true,
        authenticated: false,
        tabOpen: false,
        loginUrl: 'https://chat.deepseek.com',
        error: 'Please open https://chat.deepseek.com in your browser to enable DeepSeek Web Session.'
      };
    }

    if (!chrome.scripting?.executeScript) {
      return {
        success: true,
        authenticated: false,
        tabOpen: true,
        loginUrl: 'https://chat.deepseek.com',
        error: 'Chrome scripting API unavailable.'
      };
    }

    // Execute verification directly inside the DeepSeek tab in world: 'MAIN'
    let results;
    try {
      results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: async () => {
        try {
          // 1. Extract userToken from localStorage
          let token = null;
          try {
            const raw = localStorage.getItem('userToken');
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                token = parsed?.value || raw;
              } catch (e) {
                token = raw;
              }
            }
          } catch (e) {}

          const headers = {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'x-client-platform': 'web',
            'x-client-version': '2.5.0'
          };
          if (token && typeof token === 'string' && token.trim().length > 10) {
            headers['Authorization'] = `Bearer ${token.trim()}`;
          }

          // 2. Same-origin query to /api/v0/users/current with native cookies + Bearer token
          const res = await fetch('/api/v0/users/current', {
            method: 'GET',
            headers,
            credentials: 'include'
          });

          if (res.ok) {
            const data = await res.json();
            const bizData = data?.data?.biz_data;
            if (data?.code === 0 && bizData?.id) {
              const email = bizData.email || '';
              const name = email ? email.split('@')[0] : 'DeepSeek User';
              return {
                authenticated: true,
                user: {
                  name,
                  email,
                  id: bizData.id
                },
                token: bizData.token || token || null
              };
            }
          }

          // 2. Cross-verify with DOM
          const isLoggedOutDom = Boolean(
            document.querySelector('a[href*="/login"]') ||
            document.querySelector('a[href*="/sign-up"]') ||
            Array.from(document.querySelectorAll('button, a')).some(el => {
              const txt = (el.innerText || '').trim().toLowerCase();
              return txt === 'log in' || txt === 'sign up';
            })
          );

          return {
            authenticated: false,
            isLoggedOutDom
          };
        } catch (err) {
          return {
            authenticated: false,
            error: err.message
          };
        }
      }
    });
    } catch (scriptErr) {
      return {
        success: true,
        authenticated: false,
        tabOpen: true,
        loginUrl: 'https://chat.deepseek.com',
        error: `Cannot access DeepSeek tab (${scriptErr.message}). Check extension site access permissions.`
      };
    }

    const statusResult = results?.[0]?.result;
    if (statusResult?.authenticated && statusResult.user) {
      return {
        success: true,
        authenticated: true,
        tabOpen: true,
        user: statusResult.user,
        loginUrl: 'https://chat.deepseek.com'
      };
    }

    return {
      success: true,
      authenticated: false,
      tabOpen: true,
      loginUrl: 'https://chat.deepseek.com',
      error: 'DeepSeek session is not signed in. Please log in on the open chat.deepseek.com tab.'
    };
  } catch (err) {
    return {
      success: true,
      authenticated: false,
      loginUrl: 'https://chat.deepseek.com',
      error: err.message || 'DeepSeek Web session check failed.'
    };
  }
}

/**
 * Queries DeepSeek Web session with ephemeral chat session and fast Proof-of-Work solver.
 * ZERO-POLLUTION: The temporary session is deleted immediately in finally block.
 */
export async function queryDeepSeekWebSession(promptText, timeoutMs = 90000) {
  const tab = await findDeepSeekTab();
  if (!tab) {
    throw new Error('Please keep https://chat.deepseek.com open and logged in to use DeepSeek Web session.');
  }

  if (typeof chrome === 'undefined' || !chrome.scripting?.executeScript) {
    throw new Error('Chrome scripting API is required for Web Session AI.');
  }

  let results;
  try {
    results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: async (prompt) => {
      // Self-contained round constants for in-tab execution
      const RC_ARR = [
        0x0000000000000001n, 0x0000000000008082n, 0x800000000000808An, 0x8000000080008000n,
        0x000000000000808Bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
        0x000000000000008An, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000An,
        0x000000008000808Bn, 0x800000000000008Bn, 0x8000000000008089n, 0x8000000000008003n,
        0x8000000000008002n, 0x8000000000000080n, 0x000000000000800An, 0x800000008000000An,
        0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
      ];

      function _rotl64(v, k) {
        const bk = BigInt(k);
        return ((v << bk) | (v >> (64n - bk))) & 0xFFFFFFFFFFFFFFFFn;
      }

      function _keccakF23(s) {
        let [a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21, a22, a23, a24] = s;
        for (let r = 1; r < 24; r++) {
          const c0 = a0 ^ a5 ^ a10 ^ a15 ^ a20;
          const c1 = a1 ^ a6 ^ a11 ^ a16 ^ a21;
          const c2 = a2 ^ a7 ^ a12 ^ a17 ^ a22;
          const c3 = a3 ^ a8 ^ a13 ^ a18 ^ a23;
          const c4 = a4 ^ a9 ^ a14 ^ a19 ^ a24;

          const d0 = c4 ^ _rotl64(c1, 1);
          const d1 = c0 ^ _rotl64(c2, 1);
          const d2 = c1 ^ _rotl64(c3, 1);
          const d3 = c2 ^ _rotl64(c4, 1);
          const d4 = c3 ^ _rotl64(c0, 1);

          a0 ^= d0; a5 ^= d0; a10 ^= d0; a15 ^= d0; a20 ^= d0;
          a1 ^= d1; a6 ^= d1; a11 ^= d1; a16 ^= d1; a21 ^= d1;
          a2 ^= d2; a7 ^= d2; a12 ^= d2; a17 ^= d2; a22 ^= d2;
          a3 ^= d3; a8 ^= d3; a13 ^= d3; a18 ^= d3; a23 ^= d3;
          a4 ^= d4; a9 ^= d4; a14 ^= d4; a19 ^= d4; a24 ^= d4;

          const b0 = a0;
          const b10 = _rotl64(a1, 1);
          const b20 = _rotl64(a2, 62);
          const b5 = _rotl64(a3, 28);
          const b15 = _rotl64(a4, 27);
          const b16 = _rotl64(a5, 36);
          const b1 = _rotl64(a6, 44);
          const b11 = _rotl64(a7, 6);
          const b21 = _rotl64(a8, 55);
          const b6 = _rotl64(a9, 20);
          const b7 = _rotl64(a10, 3);
          const b17 = _rotl64(a11, 10);
          const b2 = _rotl64(a12, 43);
          const b12 = _rotl64(a13, 25);
          const b22 = _rotl64(a14, 39);
          const b23 = _rotl64(a15, 41);
          const b8 = _rotl64(a16, 45);
          const b18 = _rotl64(a17, 15);
          const b3 = _rotl64(a18, 21);
          const b13 = _rotl64(a19, 8);
          const b14 = _rotl64(a20, 18);
          const b24 = _rotl64(a21, 2);
          const b9 = _rotl64(a22, 61);
          const b19 = _rotl64(a23, 56);
          const b4 = _rotl64(a24, 14);

          a0 = b0 ^ (~b1 & b2);
          a1 = b1 ^ (~b2 & b3);
          a2 = b2 ^ (~b3 & b4);
          a3 = b3 ^ (~b4 & b0);
          a4 = b4 ^ (~b0 & b1);
          a5 = b5 ^ (~b6 & b7);
          a6 = b6 ^ (~b7 & b8);
          a7 = b7 ^ (~b8 & b9);
          a8 = b8 ^ (~b9 & b5);
          a9 = b9 ^ (~b5 & b6);
          a10 = b10 ^ (~b11 & b12);
          a11 = b11 ^ (~b12 & b13);
          a12 = b12 ^ (~b13 & b14);
          a13 = b13 ^ (~b14 & b10);
          a14 = b14 ^ (~b10 & b11);
          a15 = b15 ^ (~b16 & b17);
          a16 = b16 ^ (~b17 & b18);
          a17 = b17 ^ (~b18 & b19);
          a18 = b18 ^ (~b19 & b15);
          a19 = b19 ^ (~b15 & b16);
          a20 = b20 ^ (~b21 & b22);
          a21 = b21 ^ (~b22 & b23);
          a22 = b22 ^ (~b23 & b24);
          a23 = b23 ^ (~b24 & b20);
          a24 = b24 ^ (~b20 & b21);

          a0 ^= RC_ARR[r];
        }
        s[0] = a0; s[1] = a1; s[2] = a2; s[3] = a3; s[4] = a4;
        s[5] = a5; s[6] = a6; s[7] = a7; s[8] = a8; s[9] = a9;
        s[10] = a10; s[11] = a11; s[12] = a12; s[13] = a13; s[14] = a14;
        s[15] = a15; s[16] = a16; s[17] = a17; s[18] = a18; s[19] = a19;
        s[20] = a20; s[21] = a21; s[22] = a22; s[23] = a23; s[24] = a24;
      }

      async function _solvePow(challengeHex, salt, expireAt, difficulty = 144000) {
        const enc = new TextEncoder();
        const targetBytes = new Uint8Array(challengeHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const tView = new DataView(targetBytes.buffer);
        const t0 = tView.getBigUint64(0, true);
        const t1 = tView.getBigUint64(8, true);
        const t2 = tView.getBigUint64(16, true);
        const t3 = tView.getBigUint64(24, true);

        const prefix = enc.encode(salt + '_' + expireAt + '_');
        const rate = 136;
        const baseState = new BigUint64Array(25);
        let off = 0;
        const pView = new DataView(prefix.buffer, prefix.byteOffset, prefix.byteLength);

        while (off + rate <= prefix.length) {
          for (let i = 0; i < rate / 8; i++) {
            baseState[i] ^= pView.getBigUint64(off + i * 8, true);
          }
          _keccakF23(baseState);
          off += rate;
        }

        const tailLen = prefix.length - off;
        const tail = prefix.subarray(off);

        const buf = new Uint8Array(rate);
        buf.set(tail, 0);
        const bView = new DataView(buf.buffer);
        const s = new BigUint64Array(25);
        const numBuf = new Uint8Array(20);

        for (let n = 0; n < difficulty; n++) {
          // Yield every 16,384 iterations so tab UI never hangs or triggers a browser crash
          if ((n & 0x3FFF) === 0 && n > 0) {
            await new Promise((resolve) => setTimeout(resolve, 0));
          }

          let v = n;
          let pos = 20;
          if (v === 0) {
            pos--;
            numBuf[pos] = 48;
          } else {
            while (v > 0) {
              pos--;
              numBuf[pos] = 48 + (v % 10);
              v = (v / 10) | 0;
            }
          }
          const numLen = 20 - pos;
          for (let j = 0; j < numLen; j++) {
            buf[tailLen + j] = numBuf[pos + j];
          }
          const totalTail = tailLen + numLen;
          buf[totalTail] = 0x06;
          buf.fill(0, totalTail + 1, rate - 1);
          buf[rate - 1] = 0x80;

          s.set(baseState);
          for (let i = 0; i < rate / 8; i++) {
            s[i] ^= bView.getBigUint64(i * 8, true);
          }
          _keccakF23(s);

          if (s[0] === t0 && s[1] === t1 && s[2] === t2 && s[3] === t3) {
            return n;
          }
        }
        return -1;
      }

      // Retrieve userToken from localStorage
      let token = null;
      try {
        const raw = localStorage.getItem('userToken');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            token = parsed?.value || raw;
          } catch (e) {
            token = raw;
          }
        }
      } catch (e) {}

      // Discover active deviceId from localStorage
      let deviceId = '';
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.includes('device-id') || k.includes('deviceId'))) {
            const val = localStorage.getItem(k);
            if (val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
              deviceId = val;
              break;
            }
          }
        }
      } catch (e) {}

      // Retrieve cached HIF anti-bot security tokens
      let hifLeim = '';
      let hifDliq = '';
      try {
        hifLeim = localStorage.getItem('hif_leim_cached') || '';
        hifDliq = localStorage.getItem('hif_dliq_cached') || '';
      } catch (e) {}

      // Calculate real timezone offset in seconds matching DeepSeek's format (e.g. 19800 for IST)
      const tzOffsetSec = String(Math.round(-new Date().getTimezoneOffset() * 60));

      const authHeaders = {
        'x-client-platform': 'web',
        'x-client-version': '2.5.0',
        'x-client-bundle-id': 'com.deepseek.chat',
        'x-client-locale': 'en_US',
        'x-client-timezone-offset': tzOffsetSec
      };
      if (deviceId) {
        authHeaders['x-device-id'] = deviceId;
        authHeaders['x-device-model'] = '';
      }
      if (hifLeim) {
        authHeaders['x-hif-leim'] = hifLeim;
      }
      if (hifDliq) {
        authHeaders['x-hif-dliq'] = hifDliq;
      }
      if (token && typeof token === 'string' && token.trim().length > 10) {
        authHeaders['Authorization'] = `Bearer ${token.trim()}`;
      }

      // Persistent Session Handling: Reusing an established session avoids the
      // "Create & Instant Delete" bot-scraping signature that triggers account bans!
      let sessionId = null;
      try {
        sessionId = localStorage.getItem('fastfiller_ds_session_id');
      } catch (e) {}

      async function ensureSession() {
        if (sessionId && typeof sessionId === 'string' && sessionId.length > 10) {
          return sessionId;
        }
        const resSession = await fetch('/api/v0/chat_session/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeaders
          },
          credentials: 'include',
          body: JSON.stringify({})
        });

        if (!resSession.ok) {
          throw new Error('Failed to create DeepSeek chat session (HTTP ' + resSession.status + ')');
        }
        const sData = await resSession.json();
        sessionId = sData?.data?.biz_data?.chat_session?.id;
        if (!sessionId) {
          throw new Error('No session ID returned by DeepSeek chat session initialization.');
        }
        try {
          localStorage.setItem('fastfiller_ds_session_id', sessionId);
        } catch (e) {}
        return sessionId;
      }

      try {
        sessionId = await ensureSession();

        // Step 2: Request PoW Challenge
        const resPow = await fetch('/api/v0/chat/create_pow_challenge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeaders
          },
          credentials: 'include',
          body: JSON.stringify({ target_path: '/api/v0/chat/completion' })
        });

        if (!resPow.ok) {
          throw new Error('Failed to acquire DeepSeek PoW challenge (HTTP ' + resPow.status + ')');
        }
        const pData = await resPow.json();
        const ch = pData?.data?.biz_data?.challenge;
        if (!ch) {
          throw new Error('Empty challenge object received from DeepSeek PoW service.');
        }

        // Step 3: Solve PoW asynchronously without UI freeze
        const answer = await _solvePow(ch.challenge, ch.salt, ch.expire_at, ch.difficulty || 144000);
        if (answer === -1) {
          throw new Error('Failed to compute DeepSeek PoW solution within difficulty limit.');
        }

        const powHeader = btoa(JSON.stringify({
          algorithm: ch.algorithm,
          challenge: ch.challenge,
          salt: ch.salt,
          answer: answer,
          signature: ch.signature,
          target_path: ch.target_path
        }));

        // Step 4: Dispatch Completion Stream
        let resComp = await fetch('/api/v0/chat/completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'x-ds-pow-response': powHeader,
            ...authHeaders
          },
          credentials: 'include',
          body: JSON.stringify({
            chat_session_id: sessionId,
            parent_message_id: null,
            model_type: 'default',
            prompt: prompt,
            ref_file_ids: [],
            thinking_enabled: false,
            search_enabled: false,
            action: null,
            preempt: false
          })
        });

        // Automatic recovery: If session was pruned by user in DeepSeek UI, refresh and retry once
        if (resComp.status === 400 || resComp.status === 404) {
          try { localStorage.removeItem('fastfiller_ds_session_id'); } catch (e) {}
          sessionId = null;
          sessionId = await ensureSession();

          resComp = await fetch('/api/v0/chat/completion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': '*/*',
              'x-ds-pow-response': powHeader,
              ...authHeaders
            },
            credentials: 'include',
            body: JSON.stringify({
              chat_session_id: sessionId,
              parent_message_id: null,
              model_type: 'default',
              prompt: prompt,
              ref_file_ids: [],
              thinking_enabled: false,
              search_enabled: false,
              action: null,
              preempt: false
            })
          });
        }

        if (!resComp.ok) {
          throw new Error('DeepSeek Completion Error (HTTP ' + resComp.status + ')');
        }

        const reader = resComp.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const raw = line.slice(5).trim();
            if (!raw || raw === '[DONE]') continue;
            try {
              const json = JSON.parse(raw);
              if (json.p === 'response/fragments/-1/content' && json.v) {
                accumulatedText += json.v;
              } else if (typeof json.v === 'string') {
                accumulatedText += json.v;
              } else if (json.choices?.[0]?.delta?.content) {
                accumulatedText += json.choices[0].delta.content;
              } else if (json.content) {
                accumulatedText += json.content;
              } else if (json.v?.response?.fragments) {
                for (const frag of json.v.response.fragments) {
                  if (frag.type === 'RESPONSE' && frag.content) accumulatedText += frag.content;
                }
              }
            } catch (e) {}
          }
        }

        if (!accumulatedText.trim()) {
          throw new Error('Received empty response from DeepSeek Web session.');
        }

        return { success: true, text: accumulatedText };
      } catch (err) {
        return { success: false, error: err.message };
      }
      // Note: We deliberately do NOT delete the session. Keeping it persistent is what
      // makes the account look like a normal human user and prevents automated scraping bans.
    },
    args: [promptText]
  });
  } catch (err) {
    if (err.message?.includes('Cannot access contents of the page') || err.message?.includes('permission')) {
      throw new Error('Cannot access DeepSeek tab. Please ensure chat.deepseek.com has Site Access enabled in chrome://extensions.');
    }
    throw err;
  }

  const res = results?.[0]?.result;
  if (!res) {
    throw new Error('No response returned from DeepSeek tab execution.');
  }
  if (!res.success) {
    throw new Error(res.error || 'DeepSeek Web query failed.');
  }

  return res.text;
}

/**
 * Discovers active user token for backward compatibility.
 */
export async function getDeepSeekToken() {
  const tab = await findDeepSeekTab();
  if (!tab || !chrome.scripting?.executeScript) return null;
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: () => {
        try {
          const raw = localStorage.getItem('userToken');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              return parsed?.value || raw;
            } catch (e) {
              return raw;
            }
          }
        } catch (e) {}
        return null;
      }
    });
    return results?.[0]?.result || null;
  } catch (e) {
    return null;
  }
}
