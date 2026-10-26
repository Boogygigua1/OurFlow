const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { test } = require("node:test");

const capacity = 1000;
const routes = [
    ["askOurFlow.js", "askOurFlow", { question: "Synthetic fixture question" }, 20],
    ["searchPlace.js", "searchPlace", { query: "Synthetic Fixture Museum" }, 30],
    ["findDestinationAddress.js", "findDestinationAddress", { destination: "Synthetic Fixture Museum" }, 30],
    ["searchDestinationPlace.js", "searchDestinationPlace", { destination: "Synthetic Fixture Museum" }, 30]
];

function response() {
    return { headers: {}, status(code) { this.code = code; return this; },
        json(body) { this.body = body; return this; },
        setHeader(name, value) { this.headers[name] = value; } };
}

async function fixture(t) {
    const { applyRateLimit } = await import(pathToFileURL(path.join(__dirname, "..", "api", "requestGuards.js")).href);
    const tracker = globalThis.__ourFlowRateLimitBuckets;
    tracker.clear();
    t.after(() => tracker.clear());
    let now = 100000;
    t.mock.method(Date, "now", () => now);
    const logs = [], calls = [];
    for (const level of ["log", "warn", "error"]) t.mock.method(console, level, (...args) => logs.push(args));
    // No provider request can leave this test process.
    t.mock.method(globalThis, "fetch", async (url, options) => {
        calls.push({ url, options });
        return { ok: true, status: 200, json: async () => ({
            choices: [{ finish_reason: "stop", message: { content: "Completed fixture" } }], places: []
        }) };
    });
    // Fixtures only; the test command also supplies synthetic child-process values.
    const names = ["OPENAI_API_KEY", "GOOGLE_PLACES_API_KEY", "GOOGLE_MAPS_API_KEY"];
    const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
    for (const name of names) process.env[name] = "offline-rate-limit-fixture";
    t.after(() => {
        for (const name of names) {
            if (previous[name] === undefined) delete process.env[name];
            else process.env[name] = previous[name];
        }
    });
    const f = { tracker, calls, logs, get now() { return now; }, set now(value) { now = value; },
        hit(client, options = {}, headers = { "x-forwarded-for": client }) {
            const res = response();
            const limited = applyRateLimit({ headers }, res, options);
            return { limited, res };
        },
        fill(options = {}) {
            for (let index = tracker.size; index < capacity; index++) {
                assert.equal(f.hit("offline-client-" + index, options).limited, false);
            }
            assert.equal(tracker.size, capacity);
        },
        async invoke(file, name, body, method = "POST") {
            const { default: handler } = await import(pathToFileURL(path.join(__dirname, "..", "api", file)).href);
            const res = response();
            await handler({ method, headers: { "x-forwarded-for": "offline-endpoint-client" }, body }, res);
            return res;
        }
    };
    return f;
}

function assertLimited(result, retryAfter) {
    assert.equal(result.limited, true);
    assert.equal(result.res.code, 429);
    assert.deepEqual(result.res.body, { error: "Too many requests. Please try again shortly." });
    assert.equal(result.res.headers["Retry-After"], String(retryAfter));
}

test("default 20-per-minute limit and blocked-client deadline remain unchanged", async t => {
    const f = await fixture(t);
    for (let index = 0; index < 20; index++) assert.equal(f.hit("offline-repeat").limited, false);
    const bucket = f.tracker.get("default:offline-repeat");
    const deadline = bucket.resetAt;
    assertLimited(f.hit("offline-repeat"), 60);
    f.now += 1500;
    assertLimited(f.hit("offline-repeat"), 59);
    assert.equal(f.tracker.size, 1);
    assert.equal(bucket.count, 22);
    assert.equal(bucket.resetAt, deadline, "Blocked requests do not extend the window");
});

test("expiration at the exact reset time restores the original allowance", async t => {
    const f = await fixture(t);
    assert.equal(f.hit("offline-boundary", { maxRequests: 1 }).limited, false);
    f.now += 59999;
    assertLimited(f.hit("offline-boundary", { maxRequests: 1 }), 1);
    f.now += 1;
    assert.equal(f.hit("offline-boundary", { maxRequests: 1 }).limited, false);
    assert.equal(f.tracker.get("default:offline-boundary").count, 1);
    assert.equal(f.tracker.size, 1);
});

test("requests remove expired entries belonging to other clients and routes", async t => {
    const f = await fixture(t);
    f.hit("offline-old-a", { name: "first", windowMs: 500 });
    f.hit("offline-old-b", { name: "second", windowMs: 1000 });
    f.hit("offline-active", { maxRequests: 1 });
    const active = f.tracker.get("default:offline-active");
    f.now += 1000;
    f.hit("offline-new");
    assert.equal(f.tracker.has("first:offline-old-a"), false);
    assert.equal(f.tracker.has("second:offline-old-b"), false);
    assert.equal(f.tracker.get("default:offline-active"), active);
    assertLimited(f.hit("offline-active", { maxRequests: 1 }), 59);
    assert.equal(f.tracker.size, 2);
});

test("the 1000th entry is admitted and the 1001st is rejected without insertion", async t => {
    const f = await fixture(t);
    f.fill();
    assertLimited(f.hit("offline-overflow"), 60);
    assert.equal(f.tracker.size, capacity);
    assert.equal(f.tracker.has("default:offline-overflow"), false);
});

test("many distinct overflow clients cannot grow or evict the tracker", async t => {
    const f = await fixture(t);
    f.fill();
    const before = [...f.tracker.entries()];
    for (let index = 0; index < 2500; index++) assertLimited(f.hit("offline-overflow-" + index), 60);
    assert.equal(f.tracker.size, capacity);
    assert.deepEqual([...f.tracker.entries()], before);
});

test("saturation preserves admitted clients' remaining requests and enforcement", async t => {
    const f = await fixture(t);
    f.fill({ maxRequests: 2 });
    const bucket = f.tracker.get("default:offline-client-0");
    assert.equal(f.hit("offline-client-0", { maxRequests: 2 }).limited, false);
    assertLimited(f.hit("offline-client-0", { maxRequests: 2 }), 60);
    assertLimited(f.hit("offline-outsider", { maxRequests: 2 }), 60);
    assertLimited(f.hit("offline-client-0", { maxRequests: 2 }), 60);
    assert.equal(f.tracker.get("default:offline-client-0"), bucket);
    assert.equal(bucket.count, 4);
    assert.equal(f.tracker.size, capacity);
});

test("new-client floods cannot clear an already exhausted client's counter", async t => {
    const f = await fixture(t);
    f.fill({ maxRequests: 1 });
    assertLimited(f.hit("offline-client-0", { maxRequests: 1 }), 60);
    const deadline = f.tracker.get("default:offline-client-0").resetAt;
    for (let index = 0; index < 100; index++) f.hit("offline-flood-" + index);
    assertLimited(f.hit("offline-client-0", { maxRequests: 1 }), 60);
    assert.equal(f.tracker.get("default:offline-client-0").resetAt, deadline);
});

test("capacity Retry-After uses the earliest expiry, rounded up to at least one second", async t => {
    const f = await fixture(t);
    f.hit("offline-short", { windowMs: 1001 });
    f.fill();
    assertLimited(f.hit("offline-overflow"), 2);
    f.now += 1000;
    assertLimited(f.hit("offline-overflow"), 1);
});

test("expired capacity is reused without resetting still-active counters", async t => {
    const f = await fixture(t);
    f.hit("offline-short", { windowMs: 1000 });
    f.fill({ maxRequests: 1 });
    const active = f.tracker.get("default:offline-client-1");
    assertLimited(f.hit("offline-overflow"), 1);
    f.now += 1000;
    assert.equal(f.hit("offline-overflow").limited, false);
    assert.equal(f.tracker.has("default:offline-short"), false);
    assert.equal(f.tracker.get("default:offline-overflow").count, 1);
    assert.equal(f.tracker.get("default:offline-client-1"), active);
    assertLimited(f.hit("offline-client-1", { maxRequests: 1 }), 59);
    assert.equal(f.tracker.size, capacity);
});

test("one global capacity bound applies across route namespaces", async t => {
    const f = await fixture(t);
    for (const [, name] of routes) {
        for (let index = 0; index < 250; index++) assert.equal(f.hit("offline-shared-" + index, { name }).limited, false);
    }
    assert.equal(f.tracker.size, capacity);
    assertLimited(f.hit("offline-shared-0", { name: "new-route" }), 60);
    assert.equal(f.hit("offline-shared-0", { name: "searchPlace" }).limited, false);
    assert.equal(f.tracker.size, capacity);
});

test("existing client-header parsing and unknown-client grouping remain intact", async t => {
    const f = await fixture(t);
    assert.equal(f.hit("unused", { maxRequests: 1 }, { "x-forwarded-for": "offline-forwarded, offline-proxy" }).limited, false);
    assertLimited(f.hit("offline-forwarded", { maxRequests: 1 }), 60);
    assert.equal(f.hit("unused", { maxRequests: 1 }, { "x-real-ip": "offline-real" }).limited, false);
    assertLimited(f.hit("offline-real", { maxRequests: 1 }), 60);
    assert.equal(f.hit("unused", { maxRequests: 1 }, {}).limited, false);
    assertLimited(f.hit("different-unused", { maxRequests: 1 }, {}), 60);
    assert.equal(f.tracker.size, 3);
});

test("capacity rejection emits no client identifiers or personal data", async t => {
    const f = await fixture(t);
    f.fill();
    const privateIdentifier = "PRIVATE_SYNTHETIC_CLIENT_IDENTIFIER";
    const result = f.hit(privateIdentifier);
    assertLimited(result, 60);
    assert.deepEqual(f.logs, []);
    assert(!JSON.stringify(result.res).includes(privateIdentifier));
});

for (const [file, name, body, limit] of routes) {
    test(file + " retains its " + limit + "-per-minute limit with mocked providers", async t => {
        const f = await fixture(t);
        for (let index = 0; index < limit; index++) assert.equal((await f.invoke(file, name, body)).code, 200);
        assert.equal(f.calls.length, limit);
        const blocked = await f.invoke(file, name, body);
        assert.equal(blocked.code, 429);
        assert.equal(blocked.headers["Retry-After"], "60");
        assert.equal(f.calls.length, limit, "Rejected requests cannot contact providers");
        const counter = f.tracker.get(name + ":offline-endpoint-client");
        assert.equal(counter.count, limit + 1);
        f.now += 60000;
        assert.equal((await f.invoke(file, name, body)).code, 200);
        assert.equal(f.calls.length, limit + 1);
        assert.equal(f.tracker.get(name + ":offline-endpoint-client").count, 1);
        const output = JSON.stringify(f.logs);
        for (const value of ["offline-endpoint-client", "offline-rate-limit-fixture", body.question || body.query || body.destination])
            assert(!output.includes(value), "Provider diagnostics remain sanitized");
    });

    test(file + " fails closed at capacity before reading credentials or contacting providers", async t => {
        const f = await fixture(t);
        f.fill();
        delete process.env.OPENAI_API_KEY;
        delete process.env.GOOGLE_PLACES_API_KEY;
        delete process.env.GOOGLE_MAPS_API_KEY;
        const res = await f.invoke(file, name, body);
        assert.equal(res.code, 429);
        assert.deepEqual(res.body, { error: "Too many requests. Please try again shortly." });
        assert.equal(res.headers["Retry-After"], "60");
        assert.equal(f.calls.length, 0);
        assert.equal(f.tracker.size, capacity);
        assert.equal(f.tracker.has(name + ":offline-endpoint-client"), false);
        assert.deepEqual(f.logs, []);
        assert.equal((await f.invoke(file, name, body, "GET")).code, 405);
        assert.equal(f.tracker.size, capacity);
    });
}
