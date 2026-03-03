import {getLlama, LlamaChatSession, type LlamaContext, type LlamaModel} from "../src/index.js";

const MODEL_PATH = "/Users/andyye/Library/Application Support/alt/models/gemma-3n-E2B-it-Q8_0-gguf/gemma-3n-E2B-it-Q4_K_S.gguf";
const PROMPT = "What is 2+2? Answer in one sentence.";

async function main() {
    const start = Date.now();
    let model: LlamaModel | null = null;
    let context: LlamaContext | null = null;

    try {
        console.log("\n[STEP 1/9] getLlama()...");
        const llama = await getLlama();
        console.log("  ✓ Got llama instance");

        console.log("\n[STEP 2/9] llama.loadModel()...");
        model = await llama.loadModel({
            modelPath: MODEL_PATH,
            gpuLayers: "auto"
        });
        console.log("  ✓ Model loaded");

        console.log("\n[STEP 3/9] model.createContext()...");
        context = await model.createContext({
            contextSize: 4096
        });
        console.log("  ✓ Context created");

        console.log("\n[STEP 4/9] context.getSequence()...");
        const sequence = context.getSequence();
        console.log("  ✓ Got sequence");

        console.log("\n[STEP 5/9] new LlamaChatSession()...");
        const session = new LlamaChatSession({
            contextSequence: sequence
        });
        console.log("  ✓ Chat session created");

        console.log("\n[STEP 6/9] session.setChatHistory()...");
        session.setChatHistory([
            {type: "system", text: "You are a helpful assistant."},
            {type: "user", text: PROMPT}
        ]);
        console.log("  ✓ Chat history set");

        console.log("\n[STEP 7/9] session.prompt() with streaming...");
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, 30_000);

        let chunkCount = 0;
        process.stdout.write("  AI: ");
        const response = await session.prompt(
            PROMPT,
            {
                temperature: 0,
                maxTokens: 100,
                signal: controller.signal,
                stopOnAbortSignal: true,
                onTextChunk(text) {
                    process.stdout.write(text);
                    chunkCount += 1;
                }
            }
        ).finally(() => {
            clearTimeout(timeout);
        });

        console.log(`\n  ✓ Got response (${chunkCount} chunks, ${response.length} chars)`);

        console.log("\n[STEP 8/9] model.dispose()...");
        await model.dispose();
        model = null;
        console.log("  ✓ Model disposed");

        console.log("\n[STEP 9/9] context.dispose()...");
        if (context != null) {
            await context.dispose();
            context = null;
        }
        console.log("  ✓ Context disposed");

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`\n✅ ALL STEPS PASSED (${elapsed}s)`);
    } catch (err) {
        console.error("\n❌ FAILED:", err);
        process.exitCode = 1;
    } finally {
        if (context != null) {
            try {
                await context.dispose();
            } catch {}
        }

        if (model != null) {
            try {
                await model.dispose();
            } catch {}
        }
    }
}

void main();
