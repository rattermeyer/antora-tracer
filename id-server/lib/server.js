import { createServer, } from "node:http";
function sendJson(res, status, body) {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
}
export function createIdServer(options) {
    return createServer(async (req, res) => {
        try {
            if (req.method !== "GET") {
                sendJson(res, 405, { error: "method not allowed" });
                return;
            }
            const url = new URL(req.url ?? "/", "http://localhost");
            if (url.pathname !== "/next-id") {
                sendJson(res, 404, { error: "not found" });
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
            sendJson(res, 200, { id: `${prefix}-${String(n).padStart(width, "0")}` });
        }
        catch {
            sendJson(res, 500, { error: "internal error" });
        }
    });
}
