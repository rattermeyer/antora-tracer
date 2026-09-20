import { createServer, } from "node:http";
import { extractBearer } from "./auth.js";
import { constantTimeEqual } from "./hash.js";
function sendJson(res, status, body) {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
}
function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => {
            data += chunk;
        });
        req.on("end", () => {
            try {
                resolve(data ? JSON.parse(data) : {});
            }
            catch {
                reject(new Error("invalid json"));
            }
        });
        req.on("error", reject);
    });
}
function isAdmin(req, adminToken) {
    const header = req.headers.authorization;
    if (header === undefined)
        return false;
    const token = extractBearer(header);
    if (token === undefined)
        return false;
    return constantTimeEqual(token, adminToken);
}
export function createIdServer(options) {
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
                await handleAdminCollection(req, res, options.store, options.adminToken);
                return;
            }
            if (options.adminToken !== undefined &&
                path.startsWith("/admin/projects/")) {
                const tenant = decodeURIComponent(path.slice("/admin/projects/".length));
                await handleAdminItem(req, res, options.store, options.adminToken, tenant);
                return;
            }
            sendJson(res, 404, { error: "not found" });
        }
        catch {
            sendJson(res, 500, { error: "internal error" });
        }
    });
}
async function handleAdminCollection(req, res, store, adminToken) {
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
        if (body === undefined)
            return;
        const { tenant, token } = body;
        if (typeof tenant !== "string" ||
            tenant === "" ||
            typeof token !== "string" ||
            token === "") {
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
async function handleAdminItem(req, res, store, adminToken, tenant) {
    if (!isAdmin(req, adminToken)) {
        sendJson(res, 401, { error: "authentication failed" });
        return;
    }
    if (req.method === "PUT") {
        const body = await readJsonBodySafe(req, res);
        if (body === undefined)
            return;
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
async function readJsonBodySafe(req, res) {
    try {
        return await readJsonBody(req);
    }
    catch {
        sendJson(res, 400, { error: "invalid json" });
        return undefined;
    }
}
