import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

config();
const app = Fastify({ logger: true });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

type ManusResult = { ok: boolean; [key: string]: any };

async function manus(endpoint: string, body: Record<string, unknown>) {
  const key = process.env.MANUS_API_KEY;
  if (!key) throw new Error("MANUS_API_KEY is not configured");
  const response = await fetch("https://api.manus.ai/v2/" + endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-manus-api-key": key },
    body: JSON.stringify(body)
  });
  const data = await response.json() as ManusResult;
  if (!response.ok || !data.ok) throw new Error(data?.error?.message || "Manus API request failed");
  return data;
}

app.get("/api/health", async () => ({ ok: true, service: "agent-botty", configured: Boolean(process.env.MANUS_API_KEY) }));

app.post("/api/tasks", async (request, reply) => {
  const body = request.body as { prompt?: string; title?: string; project_id?: string; agent_profile?: string };
  if (!body?.prompt?.trim()) return reply.code(400).send({ ok:false, error:"prompt is required" });
  const data = await manus("task.create", {
    message: { content: [{ type: "text", text: body.prompt.trim() }] },
    title: body.title,
    project_id: body.project_id,
    interactive_mode: true,
    share_visibility: "private",
    agent_profile: body.agent_profile || "manus-1.6"
  });
  return data;
});

app.post("/api/tasks/:taskId/messages", async (request, reply) => {
  const { taskId } = request.params as { taskId: string };
  const body = request.body as { message?: string };
  if (!body?.message?.trim()) return reply.code(400).send({ ok:false, error:"message is required" });
  return manus("task.sendMessage", { task_id: taskId, message: { content: [{ type:"text", text: body.message.trim() }] } });
});

app.post("/api/projects", async (request, reply) => {
  const body = request.body as { name?: string; instruction?: string };
  if (!body?.name?.trim()) return reply.code(400).send({ ok:false, error:"name is required" });
  return manus("project.create", { name: body.name.trim(), instruction: body.instruction });
});

app.get("/api/tasks/:taskId/messages", async (request) => {
  const { taskId } = request.params as { taskId: string };
  const key = process.env.MANUS_API_KEY;
  if (!key) throw new Error("MANUS_API_KEY is not configured");
  const url = new URL("https://api.manus.ai/v2/task.listMessages");
  url.searchParams.set("task_id", taskId);
  const response = await fetch(url, { headers: { "x-manus-api-key": key } });
  const data = await response.json();
  return data;
});

await app.register(fastifyStatic, { root: path.join(__dirname, "../public"), prefix: "/" });
app.get("/", async (_req, reply) => reply.sendFile("index.html"));

const port = Number(process.env.PORT || 10000);
await app.listen({ port, host: "0.0.0.0" });
