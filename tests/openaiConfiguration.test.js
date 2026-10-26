const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { test } = require("node:test");

// Synthetic fixtures are confined to tests. Every provider call is intercepted.
const configuredKey = "offline-canonical-fixture";
const updatedKey = "offline-updated-canonical-fixture";
const untrustedKey = "offline-untrusted-request-fixture";
const sensitive = "PRIVATE_SYNTHETIC_JOURNEY_LOCATION";
const routes = [
    ["searchPlace.js", { query: sensitive }, "arrivalTip", 256],
    ["findDestinationAddress.js", { destination: sensitive }, "suggestion", 256],
    ["askOurFlow.js", { question: sensitive }, "answer", 768]
];
let requestId = 0;

async function endpoint(t, file, options = {}) {
    const previous = process.env.OPENAI_API_KEY;
    const key = Object.hasOwn(options, "key") ? options.key : configuredKey;
    if (key === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = key;
    t.after(() => {
        if (previous === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = previous;
    });
    const logs = [], calls = [];
    for (const level of ["log", "warn", "error"]) t.mock.method(console, level, (...args) => logs.push(args));
    const upstream = options.upstream || (async () => ({ ok: true, status: 200,
        json: async () => ({ choices: [{ finish_reason: "stop", message: { content: "Completed fixture" } }] }) }));
    t.mock.method(globalThis, "fetch", async (...args) => { calls.push(args); return upstream(...args); });
    const { default: handler } = await import(pathToFileURL(path.join(__dirname, "..", "api", file)).href);
    return { logs, calls, async invoke(body, method = "POST") {
        const res = { status(code) { this.code = code; return this; },
            json(value) { this.body = value; return this; }, setHeader() {} };
        await handler({ method, headers: { "x-forwarded-for": "offline-configuration-" + (++requestId) }, body }, res);
        return res;
    } };
}

function assertPrivate(a, response) {
    const forbidden = [configuredKey, updatedKey, untrustedKey, sensitive, "Bearer "];
    const diagnostics = JSON.stringify(a.logs);
    for (const value of forbidden) assert(!diagnostics.includes(value), "Sensitive fields must not appear in logs");
    if (response.code !== 200) {
        assert.deepEqual(Object.keys(response.body), ["error"]);
        for (const value of forbidden) assert(!JSON.stringify(response.body).includes(value));
    }
}

for (const [file, body, field, budget] of routes) {
    test(file + " uses the canonical server key and preserves its response and token budget", async t => {
        const a = await endpoint(t, file);
        const response = await a.invoke(body);
        assert.equal(response.code, 200);
        assert.equal(response.body[field], "Completed fixture");
        assert.equal(a.calls.length, 1);
        assert.equal(a.calls[0][0], "https://api.openai.com/v1/chat/completions");
        assert.equal(a.calls[0][1].headers.Authorization, "Bearer " + configuredKey);
        const sent = JSON.parse(a.calls[0][1].body);
        assert.equal(sent.model, "gpt-4o-mini");
        assert.equal(sent.max_completion_tokens, budget);
        assertPrivate(a, response);
    });

    for (const key of [undefined, ""]) {
        test(file + " fails before contacting OpenAI for a " + (key === undefined ? "missing" : "empty") + " canonical key", async t => {
            const a = await endpoint(t, file, { key });
            const response = await a.invoke(body);
            assert.equal(response.code, 500);
            assert.equal(a.calls.length, 0);
            assert(JSON.stringify(a.logs).includes("missing_configuration"));
            assertPrivate(a, response);
        });
    }

    for (const status of [401, 403, 429, 500]) {
        test(file + " sanitizes upstream HTTP " + status + " without fallback or retry", async t => {
            const a = await endpoint(t, file, { upstream: async () => ({ ok: false, status,
                json: async () => ({ error: { message: sensitive + configuredKey } }) }) });
            const response = await a.invoke(body);
            assert.equal(response.code, status === 429 ? 503 : 502);
            assert.equal(a.calls.length, 1);
            assert.equal(a.calls[0][1].headers.Authorization, "Bearer " + configuredKey);
            assert(JSON.stringify(a.logs).includes("upstream_http_error"));
            assertPrivate(a, response);
        });
    }

    for (const failure of ["network", "malformed", "truncated"]) {
        test(file + " rejects a " + failure + " response without exposing details or retrying", async t => {
            const a = await endpoint(t, file, { upstream: async () => {
                if (failure === "network") throw new Error(sensitive + configuredKey);
                return { ok: true, status: 200, json: async () => {
                    if (failure === "malformed") throw new SyntaxError(sensitive + configuredKey);
                    return { choices: [{ finish_reason: "length", message: { content: sensitive } }] };
                } };
            } });
            const response = await a.invoke(body);
            assert.equal(response.code, failure === "network" ? 503 : 502);
            assert.equal(a.calls.length, 1);
            assertPrivate(a, response);
        });
    }

    test(file + " cannot use client-supplied credentials instead of server configuration", async t => {
        const a = await endpoint(t, file);
        const payload = { ...body, OPENAI_API_KEY: untrustedKey };
        const response = await a.invoke(payload);
        assert.equal(response.code, 200);
        assert.equal(a.calls[0][1].headers.Authorization, "Bearer " + configuredKey);
        delete process.env.OPENAI_API_KEY;
        const missing = await a.invoke(payload);
        assert.equal(missing.code, 500);
        assert.equal(a.calls.length, 1);
        assertPrivate(a, missing);
    });

    test(file + " reads current canonical configuration for each request in a warm runtime", async t => {
        const a = await endpoint(t, file);
        assert.equal((await a.invoke(body)).code, 200);
        process.env.OPENAI_API_KEY = updatedKey;
        const response = await a.invoke(body);
        assert.equal(response.code, 200);
        assert.equal(a.calls.length, 2);
        assert.equal(a.calls[0][1].headers.Authorization, "Bearer " + configuredKey);
        assert.equal(a.calls[1][1].headers.Authorization, "Bearer " + updatedKey);
        assertPrivate(a, response);
    });

    test(file + " cannot reuse a cached key after canonical configuration is removed", async t => {
        const a = await endpoint(t, file);
        assert.equal((await a.invoke(body)).code, 200);
        delete process.env.OPENAI_API_KEY;
        const response = await a.invoke(body);
        assert.equal(response.code, 500);
        assert.equal(a.calls.length, 1);
        assertPrivate(a, response);
    });

    test(file + " retains method and input validation before provider calls", async t => {
        const a = await endpoint(t, file);
        assert.equal((await a.invoke(body, "GET")).code, 405);
        assert.equal((await a.invoke({})).code, 400);
        assert.equal(a.calls.length, 0);
    });
}
