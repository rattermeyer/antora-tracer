import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { type Auth, extractBearer } from "./auth.js";
import { constantTimeEqual } from "./hash.js";
import type { AllocatorStore, ProjectStore } from "./store.js";

export interface IdServerOptions {
  store: AllocatorStore & ProjectStore;
  auth: Auth;
  /** Map of prefix -> minimum padding width. */
  prefixes: ReadonlyMap<string, number>;
  /** Width for prefixes not present in `prefixes`. */
  defaultWidth: number;
  /** When set, enables the `/admin/projects` routes. */
  adminToken?: string;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? (JSON.parse(data) as Record<string, unknown>) : {});
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

function isAdmin(req: IncomingMessage, adminToken: string): boolean {
  const header = req.headers.authorization;
  if (header === undefined) return false;
  const token = extractBearer(header);
  if (token === undefined) return false;
  return constantTimeEqual(token, adminToken);
}

export function createIdServer(options: IdServerOptions): Server {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const path = url.pathname;

      if (path === "/next-id") {
        if (req.method !== "GET") {
          sendJson(res, 405, { error: "method not allowed" });
          return;
        }
        const prefix = url.searchParams.get("prefix");
        if (prefix === null || prefix.trim() === "") {
          sendJson(res, 400, { error: "prefix is required" });
          return;
        }
        const tenant = options.auth.resolve(req.headers.authorization);
        if (tenant === undefined) {
          sendJson(res, 401, { error: "authentication failed" });
          return;
        }
        const n = await options.store.nextId(tenant, prefix);
        const width = options.prefixes.get(prefix) ?? options.defaultWidth;
        sendJson(res, 200, {
          id: `${prefix}-${String(n).padStart(width, "0")}`,
        });
        return;
      }

      if (options.adminToken !== undefined && path === "/admin/projects") {
        await handleAdminCollection(
          req,
          res,
          options.store,
          options.adminToken,
        );
        return;
      }

      if (
        options.adminToken !== undefined &&
        path.startsWith("/admin/projects/")
      ) {
        const tenant = decodeURIComponent(
          path.slice("/admin/projects/".length),
        );
        await handleAdminItem(
          req,
          res,
          options.store,
          options.adminToken,
          tenant,
        );
        return;
      }

      sendJson(res, 404, { error: "not found" });
    } catch {
      sendJson(res, 500, { error: "internal error" });
    }
  });
}

async function handleAdminCollection(
  req: IncomingMessage,
  res: ServerResponse,
  store: ProjectStore,
  adminToken: string,
): Promise<void> {
  if (!isAdmin(req, adminToken)) {
    sendJson(res, 401, { error: "authentication failed" });
    return;
  }
  if (req.method === "GET") {
    sendJson(res, 200, store.listProjects());
    return;
  }
  if (req.method === "POST") {
    const body = await readJsonBodySafe(req, res);
    if (body === undefined) return;
    const { tenant, token } = body;
    if (
      typeof tenant !== "string" ||
      tenant === "" ||
      typeof token !== "string" ||
      token === ""
    ) {
      sendJson(res, 400, { error: "tenant and token are required" });
      return;
    }
    if (!store.createProject(tenant, token)) {
      sendJson(res, 409, { error: "tenant already exists" });
      return;
    }
    sendJson(res, 201, { tenant });
    return;
  }
  sendJson(res, 405, { error: "method not allowed" });
}

async function handleAdminItem(
  req: IncomingMessage,
  res: ServerResponse,
  store: ProjectStore,
  adminToken: string,
  tenant: string,
): Promise<void> {
  if (!isAdmin(req, adminToken)) {
    sendJson(res, 401, { error: "authentication failed" });
    return;
  }
  if (req.method === "PUT") {
    const body = await readJsonBodySafe(req, res);
    if (body === undefined) return;
    const { token } = body;
    if (typeof token !== "string" || token === "") {
      sendJson(res, 400, { error: "token is required" });
      return;
    }
    if (!store.updateProjectToken(tenant, token)) {
      sendJson(res, 404, { error: "tenant not found" });
      return;
    }
    sendJson(res, 200, { status: "ok" });
    return;
  }
  if (req.method === "DELETE") {
    if (!store.removeProject(tenant)) {
      sendJson(res, 404, { error: "tenant not found" });
      return;
    }
    sendJson(res, 200, { status: "ok" });
    return;
  }
  sendJson(res, 405, { error: "method not allowed" });
}

/** Reads the JSON body, sending a 400 and returning undefined on parse error. */
async function readJsonBodySafe(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<Record<string, unknown> | undefined> {
  try {
    return await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "invalid json" });
    return undefined;
  }
}
