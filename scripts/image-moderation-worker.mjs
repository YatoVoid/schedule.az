// Runs in a worker thread (see src/lib/image-moderation.ts) so a ~1 s CPU
// classification never stalls the web server's event loop. Plain .mjs on
// purpose: it is loaded by path at runtime, not bundled by Next.
import { parentPort } from "node:worker_threads";
import * as tf from "@tensorflow/tfjs";
import * as nsfwjs from "nsfwjs";
import sharp from "sharp";

// MobileNetV2Mid: tested against real salon/barber/spa photos, where the
// smaller MobileNetV2 flagged close-up manicure shots as explicit.
const modelPromise = tf.setBackend("cpu").then(() => nsfwjs.load("MobileNetV2Mid"));

parentPort.on("message", async ({ id, bytes }) => {
  try {
    const model = await modelPromise;
    const { data, info } = await sharp(Buffer.from(bytes), { limitInputPixels: 50_000_000 })
      .rotate()
      .resize(224, 224, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const input = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3], "int32");
    const predictions = await model.classify(input);
    input.dispose();
    const scores = Object.fromEntries(predictions.map((p) => [p.className, p.probability]));
    parentPort.postMessage({ id, scores });
  } catch (err) {
    parentPort.postMessage({ id, error: err instanceof Error ? err.message : String(err) });
  }
});
