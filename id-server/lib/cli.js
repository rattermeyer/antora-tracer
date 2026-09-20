export async function runProjectsCommand(args) {
    const subcommand = args[0];
    const flags = {};
    const positionals = [];
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith("--")) {
            const eq = arg.indexOf("=");
            if (eq !== -1) {
                flags[arg.slice(2, eq)] = arg.slice(eq + 1);
            }
            else if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
                flags[arg.slice(2)] = args[++i];
            }
        }
        else {
            positionals.push(arg);
        }
    }
    const endpoint = flags.endpoint ?? process.env.ID_SERVER_ENDPOINT ?? "http://localhost:8080";
    const adminToken = flags["admin-token"] ?? process.env.ID_SERVER_ADMIN_TOKEN;
    if (adminToken === undefined) {
        throw new Error("admin token required: pass --admin-token or set ID_SERVER_ADMIN_TOKEN");
    }
    const base = `${endpoint.replace(/\/+$/, "")}/admin/projects`;
    const headers = {
        authorization: `Bearer ${adminToken}`,
    };
    switch (subcommand) {
        case "list": {
            const res = await fetch(base, { headers });
            await ensureOk(res);
            const tenants = (await res.json());
            console.log(tenants.length > 0 ? tenants.join("\n") : "(no projects)");
            return;
        }
        case "add": {
            const tenant = positionals[0];
            const token = flags.token;
            if (tenant === undefined || token === undefined) {
                throw new Error("usage: projects add <tenant> --token <token>");
            }
            const res = await fetch(base, {
                method: "POST",
                headers: { ...headers, "content-type": "application/json" },
                body: JSON.stringify({ tenant, token }),
            });
            await ensureOk(res);
            console.log(`added project "${tenant}"`);
            return;
        }
        case "update": {
            const tenant = positionals[0];
            const token = flags.token;
            if (tenant === undefined || token === undefined) {
                throw new Error("usage: projects update <tenant> --token <token>");
            }
            const res = await fetch(`${base}/${encodeURIComponent(tenant)}`, {
                method: "PUT",
                headers: { ...headers, "content-type": "application/json" },
                body: JSON.stringify({ token }),
            });
            await ensureOk(res);
            console.log(`updated project "${tenant}"`);
            return;
        }
        case "remove": {
            const tenant = positionals[0];
            if (tenant === undefined) {
                throw new Error("usage: projects remove <tenant>");
            }
            const res = await fetch(`${base}/${encodeURIComponent(tenant)}`, {
                method: "DELETE",
                headers,
            });
            await ensureOk(res);
            console.log(`removed project "${tenant}"`);
            return;
        }
        default:
            throw new Error(`unknown subcommand "${subcommand ?? ""}" (expected list, add, update, or remove)`);
    }
}
async function ensureOk(res) {
    if (res.ok)
        return;
    let detail = "";
    try {
        const body = (await res.json());
        detail = body.error ? `: ${body.error}` : "";
    }
    catch {
        // non-JSON error body; keep detail empty
    }
    throw new Error(`request failed (${res.status})${detail}`);
}
