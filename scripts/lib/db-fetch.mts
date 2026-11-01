// fetch for the importers' database client: retries when the database API is briefly
// unreachable (connection refused or reset, 502/503/504 while it restarts or is busy), so one
// hiccup doesn't throw away a long import. Other errors are returned as they are.

const RETRY_STATUS = new Set([502, 503, 504]);
const WAITS_MS = [2_000, 5_000, 10_000, 20_000, 30_000, 60_000];

export async function retryingFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    let problem: string;
    try {
      const res = await fetch(input, init);
      if (!RETRY_STATUS.has(res.status) || attempt >= WAITS_MS.length) return res;
      problem = `HTTP ${res.status}`;
      await res.body?.cancel();
    } catch (err) {
      if (attempt >= WAITS_MS.length) throw err;
      problem = (err as Error).cause ? String((err as { cause?: unknown }).cause) : (err as Error).message;
    }
    const wait = WAITS_MS[attempt];
    console.warn(`Database API: ${problem}; retrying in ${wait / 1000}s (${attempt + 1}/${WAITS_MS.length}).`);
    await new Promise((r) => setTimeout(r, wait));
  }
}
