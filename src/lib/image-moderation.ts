import path from "path";
import { Worker } from "worker_threads";
import { logSecurityEvent } from "@/lib/security-log";

// Every uploaded photo (avatars, logos, gallery) is classified on this
// server before it is saved. No third-party API, so there is no per-image
// cost. "Sexy" is deliberately not blocked: swimwear and beauty shots are
// normal for salons and spas.
const configuredThreshold = Number(process.env.IMAGE_BLOCK_THRESHOLD);
const BLOCK_THRESHOLD =
  Number.isFinite(configuredThreshold) && configuredThreshold > 0 && configuredThreshold <= 1 ? configuredThreshold : 0.7;
const TIMEOUT_MS = 30_000;

type Scores = Record<string, number>;
type Pending = { resolve: (s: Scores) => void; reject: (e: Error) => void; timer: NodeJS.Timeout };

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (worker) return worker;
  const w = new Worker(path.join(process.cwd(), "scripts", "image-moderation-worker.mjs"));
  w.on("message", (msg: { id: number; scores?: Scores; error?: string }) => {
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    clearTimeout(p.timer);
    if (msg.error) p.reject(new Error(msg.error));
    else p.resolve(msg.scores ?? {});
  });
  const fail = (err: Error) => {
    worker = null;
    for (const [id, p] of pending) {
      clearTimeout(p.timer);
      p.reject(err);
      pending.delete(id);
    }
  };
  w.on("error", fail);
  w.on("exit", (code) => code !== 0 && fail(new Error(`moderation worker exited with ${code}`)));
  w.unref();
  worker = w;
  return w;
}

function classify(bytes: Uint8Array): Promise<Scores> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("moderation timed out"));
    }, TIMEOUT_MS);
    pending.set(id, { resolve, reject, timer });
    getWorker().postMessage({ id, bytes });
  });
}

export type ModerationResult = { ok: true } | { ok: false; error: string };

// Fails closed: if the check itself can't run, the photo isn't saved.
export async function checkUploadedImage(
  bytes: Uint8Array,
  context: { userId?: string; storeId?: string; kind: "avatar" | "logo" | "gallery" },
): Promise<ModerationResult> {
  let scores: Scores;
  try {
    scores = await classify(bytes);
  } catch (err) {
    console.error("[image-moderation]", err);
    return { ok: false, error: "We couldn't check this photo right now. Try again in a minute." };
  }

  const porn = scores.Porn ?? 0;
  const hentai = scores.Hentai ?? 0;
  if (porn >= BLOCK_THRESHOLD || hentai >= BLOCK_THRESHOLD) {
    await logSecurityEvent("IMAGE_REJECTED", {
      userId: context.userId,
      storeId: context.storeId,
      detail: `${context.kind} porn=${porn.toFixed(2)} hentai=${hentai.toFixed(2)}`,
    });
    return { ok: false, error: "This photo looks explicit, so it wasn't uploaded. Pick a different one." };
  }
  return { ok: true };
}
