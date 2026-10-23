const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { pathToFileURL } = require("node:url");
const { test } = require("node:test");

// Override only for checking these regressions against a saved pre-edit copy.
const root = process.env.OURFLOW_TEST_ROOT || path.resolve(__dirname, "..");
const privateValue = "PRIVATE_JOURNEY_SENTINEL";
const maliciousText = '<img src=x onerror="globalThis.compromised=1"> & \'quoted\'\nSecond line';
const photoData = "data:image/jpeg;base64,UEhPVE9fU0VOVElORUw=";
const scripts = [
    "state.js", "maps.js", "journeyPlaces.js", "recoveryLogic.js",
    "locationIntake.js", "orientationLogic.js", "locationLogic.js", "photos.js",
    "journey.js", "mic.js", "memoryHelpers.js", "ourflowCore.js", "app.js"
];

function fixture() {
    return {
        contextSessionId: "current-session", destination: "Museum & Library",
        destinationAddress: "10 Main Street", parkingLocation: "Garage Level 2",
        arrivalTips: "Use the west entrance", startLocation: "Station",
        journeyStatus: "active", startTime: "Now", duration: 0,
        notes: ["one", "two", "three", "four", "five", "six"],
        timeline: [privateValue], answers: [], medications: [privateValue], appointments: [privateValue],
        questionsForDoctor: [privateValue], staffInstructions: [privateValue], directories: [],
        destinationPhone: privateValue, destinationEmail: privateValue,
        photos: [{ thumbnail: photoData, note: privateValue }],
        futurePrivateField: { value: privateValue }
    };
}

function makeNode(tagName = "div") {
    return {
        tagName: tagName.toUpperCase(), innerHTML: "", textContent: "", value: "",
        style: {}, children: [], attributes: {}, classList: { add() {}, remove() {} },
        setAttribute(key, value) { this.attributes[key] = String(value); },
        getAttribute(key) { return this.attributes[key]; },
        removeAttribute(key) { delete this.attributes[key]; },
        appendChild(child) { this.children.push(child); return child; },
        replaceChildren(...children) { this.innerHTML = ""; this.children = children; },
        querySelector() { return null; }, querySelectorAll() { return []; },
        getBoundingClientRect() { return { top: 0, bottom: 100 }; },
        focus() {}, scrollIntoView() {}, addEventListener() {}, remove() {}
    };
}

function browser(journey = fixture()) {
    const nodes = new Map();
    const storage = new Map(journey ? [["activeJourney", JSON.stringify(journey)]] : []);
    const logs = [], requests = [], opened = [], events = [];
    const context = {
        console: Object.fromEntries(["log", "warn", "error"].map(level =>
            [level, (...args) => logs.push({ level, args })])),
        localStorage: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, String(value)),
            removeItem: key => storage.delete(key)
        },
        document: {
            getElementById(id) {
                if (!nodes.has(id)) nodes.set(id, makeNode());
                return nodes.get(id);
            },
            createElement: makeNode, querySelector: () => null, querySelectorAll: () => []
        },
        TextEncoder,
        innerHeight: 700, setTimeout: () => 0, clearTimeout() {},
        matchMedia: () => ({ matches: false }),
        confirm: () => true, alert: message => { throw new Error(message); },
        open: (...args) => opened.push(args), va: (...args) => events.push(args),
        fetch: async (url, options) => {
            requests.push({ url, body: JSON.parse(options.body) });
            return { ok: true, json: async () => ({ answer: maliciousText }) };
        }
    };
    context.window = context;
    vm.createContext(context);
    for (const file of scripts) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
    function set(name, value) {
        context.__value = value;
        vm.runInContext(name + " = __value", context);
        delete context.__value;
    }
    return { context, nodes, storage, logs, requests, opened, events, set,
        get: expression => vm.runInContext(expression, context) };
}

function plain(value) { return JSON.parse(JSON.stringify(value)); }
function assertSafeText(html, text = maliciousText) {
    assert(!html.includes(text), "Raw untrusted markup must not enter HTML");
    assert(!/<(?:img\s+src=x|svg)\b/i.test(html), "No attacker element is rendered");
    assert(html.includes("&lt;img"), "Text must remain visible, escaped exactly once");
    assert(!html.includes("&amp;lt;img"), "Avoid double escaping");
}

test("AI payload excludes the full journey and preserves the existing AI context", () => {
    const b = browser();
    const before = b.get("JSON.stringify(activeJourney)");
    const payload = plain(b.context.buildOurFlowPayload("How do I get to my destination?"));
    assert.deepEqual(Object.keys(payload).sort(), [
        "question", "history", "notes", "destination", "destinationAddress", "parkingLocation",
        "arrivalTips", "startLocation", "journeyStatus", "landmarkImageData"
    ].sort());
    for (const key of ["destination", "destinationAddress", "parkingLocation", "arrivalTips", "startLocation", "journeyStatus"])
        assert.equal(payload[key], fixture()[key]);
    assert.deepEqual(payload.notes, ["two", "three", "four", "five", "six"]);
    assert(!JSON.stringify(payload).includes(privateValue));
    assert.equal(b.get("JSON.stringify(activeJourney)"), before, "Local journey remains intact");
    assert.equal(b.storage.get("activeJourney"), before);
});

test("AI history remains scoped to the latest 20 messages in the current session", () => {
    const b = browser();
    b.set("conversationHistory", [
        { contextSessionId: "other-session", text: privateValue }, privateValue,
        ...Array.from({ length: 23 }, (_, index) => ({ contextSessionId: "current-session", text: "clue " + index }))
    ]);
    const payload = plain(b.context.buildOurFlowPayload("Where is my destination?"));
    assert.deepEqual(payload.history, Array.from({ length: 20 }, (_, index) => "clue " + (index + 3)));
});

test("explicit context overrides and selected-photo AI input keep working", () => {
    const b = browser();
    b.set("landmarkImageData", photoData);
    const withContext = plain(b.context.buildOurFlowPayload("Read this photo", { injectJourneyContext: true }));
    assert.equal(withContext.landmarkImageData, photoData);
    assert.equal(withContext.destination, fixture().destination);
    const withoutContext = plain(b.context.buildOurFlowPayload("Read this photo", { injectJourneyContext: false }));
    assert.equal(withoutContext.landmarkImageData, photoData);
    assert.deepEqual(withoutContext.notes, []);
    assert.deepEqual(withoutContext.history, []);
    for (const key of ["destination", "destinationAddress", "parkingLocation", "arrivalTips", "startLocation", "journeyStatus"])
        assert.equal(withoutContext[key], "");
});

test("unrelated requests do not include journey context or nested records", () => {
    const b = browser();
    let payload = plain(b.context.buildOurFlowPayload("remember to buy milk"));
    assert.equal(payload.destination, "");
    assert.deepEqual(payload.notes, []);
    const nested = { privateValue };
    b.set("activeJourney", { ...fixture(), destination: nested, notes: [nested, "Useful clue"] });
    b.set("conversationHistory", [{ contextSessionId: "current-session", text: nested }]);
    payload = plain(b.context.buildOurFlowPayload("Help", { injectJourneyContext: true }));
    assert(!JSON.stringify(payload).includes(privateValue));
    assert.equal(payload.destination, "");
    assert.deepEqual(payload.notes, ["Useful clue"]);
    assert.deepEqual(payload.history, []);
});

test("browser logs exclude context, photographs, and arbitrary error names", () => {
    const b = browser({ ...fixture(), destination: privateValue, notes: [privateValue] });
    b.set("landmarkImageData", photoData);
    b.context.buildOurFlowPayload(privateValue, { injectJourneyContext: true });
    b.storage.set("broken", '{"privateValue":"' + privateValue);
    b.context.safeReadLocalStorageJson("broken", null);
    b.context.localStorage.getItem = () => { const error = new Error(privateValue); error.name = privateValue; throw error; };
    b.context.safeReadLocalStorageJson("activeJourney", null);
    const output = JSON.stringify(b.logs);
    assert(!output.includes(privateValue));
    assert(!output.includes(photoData));
    assert(output.includes("storage_read_error"));
});

let requestId = 0;
async function api(t, file, fetchImpl) {
    const logs = [], calls = [];
    for (const level of ["log", "error", "warn"]) t.mock.method(console, level, (...args) => logs.push(args));
    t.mock.method(globalThis, "fetch", async (...args) => { calls.push(args); return fetchImpl(...args); });
    for (const key of ["OPENAI_API_KEY", "GOOGLE_PLACES_API_KEY"]) {
        const previous = process.env[key];
        process.env[key] = "offline-test-key";
        t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
    }
    const { default: handler } = await import(pathToFileURL(path.join(root, "api", file)).href);
    return { logs, calls, async invoke(body) {
        const res = { status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; }, setHeader() {} };
        await handler({ method: "POST", headers: { "x-forwarded-for": "offline-security-" + (++requestId) }, body }, res);
        return res;
    } };
}

test("server preserves text/image AI context without logging it or forwarding unused journey fields", async t => {
    const a = await api(t, "askOurFlow.js", async () => ({ ok: true, status: 200,
        json: async () => ({ choices: [{ message: { content: "Helpful answer" } }] }) }));
    const body = {
        question: privateValue, history: [privateValue], notes: [privateValue],
        destination: privateValue, destinationAddress: privateValue, parkingLocation: privateValue,
        arrivalTips: privateValue, startLocation: privateValue, journeyStatus: "active",
        landmarkImageData: photoData, activeJourney: { futurePrivateField: "UNUSED_PRIVATE_RECORD" }
    };
    const response = await a.invoke(body);
    assert.equal(response.code, 200);
    assert.equal(response.body.answer, "Helpful answer");
    const sent = JSON.parse(a.calls[0][1].body);
    assert(!sent.messages[0].content.includes(privateValue), "Trusted instructions remain separate");
    assert(sent.messages[1].content[0].text.includes(privateValue));
    assert.equal(sent.messages[1].content[1].image_url.url, photoData);
    assert(!JSON.stringify(sent).includes("UNUSED_PRIVATE_RECORD"));
    assert(!JSON.stringify(a.logs).includes(privateValue));
    assert(!JSON.stringify(a.logs).includes(photoData));
    assert(!JSON.stringify(a.logs).includes("UNUSED_PRIVATE_RECORD"));
});

for (const [file, body] of [
    ["askOurFlow.js", { question: privateValue }],
    ["searchPlace.js", { query: privateValue }],
    ["findDestinationAddress.js", { destination: privateValue }],
    ["searchDestinationPlace.js", { destination: privateValue }]
]) {
    test(file + " keeps network failures out of logs and public errors", async t => {
        const a = await api(t, file, async () => { const error = new Error(privateValue); error.name = privateValue; throw error; });
        const response = await a.invoke(body);
        assert.equal(response.code, 503);
        assert(!JSON.stringify(a.logs).includes(privateValue));
        assert(!JSON.stringify(response.body).includes(privateValue));
    });
}

test("provider error bodies cannot leak through logs or the Google Places response", async t => {
    const a = await api(t, "searchDestinationPlace.js", async () => ({ ok: false, status: 403,
        json: async () => ({ error: { message: privateValue } }) }));
    const response = await a.invoke({ destination: privateValue });
    assert.equal(response.code, 502);
    assert(!JSON.stringify(response.body).includes(privateValue));
    assert(!JSON.stringify(a.logs).includes(privateValue));
});

test("AI fallback renders model text literally and still sends a minimal request", async () => {
    const b = browser();
    b.context.document.getElementById("questionInput").value = "Explain why zebras have stripes";
    await b.context.askOurFlow();
    assert.equal(b.requests.at(-1)?.url, "/api/askOurFlow");
    assert(!b.logs.some(entry => entry.level === "error"), "Successful AI calls must not fall into error handling");
    assertSafeText(b.context.document.getElementById("result").innerHTML);
    assert(!("activeJourney" in b.requests.at(-1).body));
});

test("AI fallback errors cannot log an attacker-controlled error name", async () => {
    const b = browser();
    b.context.document.getElementById("questionInput").value = "Explain why zebras have stripes";
    b.context.fetch = async () => { const error = new Error(privateValue); error.name = privateValue; throw error; };
    await b.context.askOurFlow();
    assert(b.logs.some(entry => entry.level === "error"));
    assert(!JSON.stringify(b.logs).includes(privateValue));
});

test("location-intake AI answers remain escaped with readable line breaks", async () => {
    const b = browser();
    b.context.pendingLocationIntakeCandidate = { originalText: "A building" };
    await b.context.continueLocationIntakeWithAI();
    const html = b.context.document.getElementById("result").innerHTML;
    assertSafeText(html);
    assert(html.includes("<br>Second line"));
});

for (const name of ["analyzeSavedJourneyPhoto", "analyzeSavedJourneyPhotoLegacy"]) {
    test(name + " preserves photo analysis, stored text, and suggestion buttons safely", async () => {
        const b = browser();
        b.set("landmarkImageData", photoData);
        b.context.fetch = async (url, options) => {
            b.requests.push({ url, body: JSON.parse(options.body) });
            return { json: async () => ({ answer: "1. " + maliciousText }) };
        };
        await b.context[name]();
        assertSafeText(b.context.document.getElementById("result").innerHTML);
        assert.equal(b.requests[0].body.landmarkImageData, photoData);
        assert(!("activeJourney" in b.requests[0].body));
        assert.equal(b.get("activeJourney.photos[0].analysis"), "1. " + maliciousText);
        assert(b.context.document.getElementById("result").innerHTML.includes("savePhotoMemory(window.photoSuggestions[0])"));
    });
}

test("journey rows escape each text line and cannot bypass escaping via valueHtml", () => {
    const b = browser();
    const html = b.context.buildJourneyRows([{ label: maliciousText, value: maliciousText,
        valueHtml: '<svg onload="globalThis.compromised=1">', valueLines: [maliciousText, "Verified address"] }]);
    assertSafeText(html);
    assert(html.includes("<br>Verified address"));
    const panel = b.context.buildJourneyPanel(maliciousText, [{ label: "Note", value: maliciousText }], '\" onmouseover="bad');
    assert(panel.includes('data-journey-section="&quot; onmouseover=&quot;bad"'));
});

test("location lines keep address/verification formatting while escaping every value", () => {
    const b = browser();
    const html = b.context.buildJourneyLocationPanel({ ...fixture(),
        startLocation: maliciousText, startLocationAddress: "100 Start Road", startVerified: true,
        parkingLocation: maliciousText, parkingLocationAddress: "200 Parking Road", parkingVerified: true });
    assertSafeText(html);
    assert(html.includes("<br>100 Start Road<br>✓ Verified Address"));
});

test("active/saved journeys, notes, events, and photo labels render as text", () => {
    const j = { ...fixture(), destination: maliciousText, notes: [maliciousText],
        photos: [{ note: maliciousText, thumbnail: "javascript:bad" }],
        timeline: [{ timestamp: maliciousText, category: maliciousText, text: maliciousText }] };
    const b = browser(j);
    b.context.showActiveJourneyBox();
    assertSafeText(b.context.document.getElementById("activeJourneyBox").innerHTML);
    b.set("savedJourneys", [j]);
    b.context.showSavedJourneys();
    assertSafeText(b.context.document.getElementById("result").innerHTML);
    b.context.toggleJourney(0);
    assertSafeText(b.context.document.getElementById("journey-0").innerHTML);
    assert(!b.context.buildJourneyPhotoItems(j.photos).includes('src="javascript:'));
    assertSafeText(b.context.buildJourneyEventItems(j.timeline));
});

test("orientation titles, notes, photo labels, and memory cards escape untrusted text", () => {
    const b = browser({ ...fixture(), destination: maliciousText, notes: [maliciousText],
        photos: [{ title: maliciousText, thumbnail: "data:image/svg+xml;base64,PHN2Zz4=" }] });
    b.context.showOrientationHub();
    assertSafeText(b.context.document.getElementById("result").innerHTML);
    assert(!b.context.document.getElementById("result").innerHTML.includes("data:image/svg"));
    assertSafeText(b.context.renderOrientationSection(maliciousText, "Trusted section content"));
    b.context.showCard(maliciousText, maliciousText);
    assertSafeText(b.context.document.getElementById("result").innerHTML);
});

test("map URL validation rejects executable schemes, lookalike hosts, and controls", () => {
    const b = browser();
    const safe = ["https://www.google.com/maps/", "https://maps.google.com/?cid=123",
        "https://maps.app.goo.gl/Example", "https://www.google.com/maps/search/?query=O'Reilly%20%26%20Sons"];
    for (const url of safe) assert.equal(b.context.getSafeOurFlowMapUrl(url), url);
    for (const url of ["javascript:alert(1)", "data:text/html,test", "//evil.example/maps",
        "https://www.google.com.evil.example/maps/", "https://www.google.com@evil.example/maps/",
        "https://www.google.com/maps-evil", "https://www.google.com/maps/\nattack",
        "https://maps.google.com/\\evil", "http://maps.google.com/"])
        assert.equal(b.context.getSafeOurFlowMapUrl(url), "", url);
});

test("destination map navigation validates the URL again when clicked", () => {
    const b = browser();
    b.context.destinationPlaceCandidates = [{ googleMapsUri: "javascript:alert(1)" }];
    assert.equal(b.context.openVerifiedDestinationMap(), false);
    assert.equal(b.opened.length, 0);
    b.context.destinationPlaceCandidates[0].googleMapsUri = "https://maps.google.com/?cid=123";
    assert.equal(b.context.openVerifiedDestinationMap(), true);
    assert.deepEqual(b.opened, [["https://maps.google.com/?cid=123", "_blank", "noopener,noreferrer"]]);
});

test("destination verification escapes provider text and hides unsafe map actions", async () => {
    const b = browser();
    let mapUrl = "javascript:alert(1)";
    b.context.fetch = async () => ({ json: async () => ({ candidates: [{
        destinationName: maliciousText, destinationAddress: "Museum 10 Main Street",
        googleMapsUri: mapUrl
    }] }) });
    await b.context.verifySavedLocation();
    let html = b.context.document.getElementById("result").innerHTML;
    assertSafeText(html);
    assert(!html.includes("openVerifiedDestinationMap()"));
    mapUrl = "https://maps.google.com/?cid=123";
    await b.context.verifySavedLocation();
    html = b.context.document.getElementById("result").innerHTML;
    assert(html.includes("openVerifiedDestinationMap()"));
});

test("standalone rendering scripts use the same map URL restrictions", () => {
    for (const file of ["locationLogic.js", "ourflowCore.js"]) {
        const context = { window: {} };
        vm.createContext(context);
        vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
        assert.equal(context.getSafeOurFlowMapUrl("javascript:alert(1)"), "");
        assert.equal(context.getSafeOurFlowMapUrl("https://maps.google.com/?cid=123"), "https://maps.google.com/?cid=123");
    }
});

test("device-data clearing and content-free analytics retain existing behavior", () => {
    const b = browser();
    b.storage.set("unrelatedAppData", "keep");
    b.storage.set("ourflowProfile", privateValue);
    b.context.trackOurFlow("journey_saved", { notes: privateValue });
    assert.deepEqual(plain(b.events), [["event", { name: "journey_saved" }]]);
    b.context.clearAllOurFlowDeviceData();
    assert.equal(b.storage.get("activeJourney"), undefined);
    assert.equal(b.storage.get("ourflowProfile"), undefined);
    assert.equal(b.storage.get("unrelatedAppData"), "keep");
    assert.equal(b.get("activeJourney"), null);
    assert.deepEqual(plain(b.get("savedJourneys")), []);
});

test("browser scripts and inline HTML scripts remain syntactically valid", () => {
    for (const file of scripts) assert.doesNotThrow(() => new vm.Script(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));
    const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))
        assert.doesNotThrow(() => new vm.Script(match[1]));
});

function deferred() {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

async function until(check) {
    for (let step = 0; step < 20; step += 1) {
        if (check()) return;
        await Promise.resolve();
    }
    assert.fail("Expected photo task to advance");
}

function photoBrowser() {
    const b = browser();
    const readers = [], thumbnails = [];
    b.context.FileReader = function () {
        this.readyState = 0;
        this.readAsDataURL = file => { this.file = file; this.readyState = 1; };
        this.abort = () => { this.readyState = 2; this.onabort?.(); };
        this.complete = data => { this.readyState = 2; this.onload?.({ target: { result: data } }); };
        readers.push(this);
    };
    b.context.buildLandmarkThumbnailFromData = image => {
        const task = { image, ...deferred() };
        thumbnails.push(task);
        return task.promise;
    };
    return { ...b, readers, thumbnails };
}

function resizeCanvas(b, outputs) {
    const canvases = [], encodes = [];
    const createElement = b.context.document.createElement;
    b.context.document.createElement = tag => {
        if (tag !== "canvas") return createElement(tag);
        const canvas = { getContext: () => ({ fillRect() {}, drawImage() {} }),
            toDataURL(type, quality) {
                encodes.push({ width: this.width, height: this.height, type, quality });
                return outputs[Math.min(encodes.length - 1, outputs.length - 1)];
            } };
        canvases.push(canvas);
        return canvas;
    };
    b.context.Image = function () {
        this.width = 8000;
        this.height = 6000;
        Object.defineProperty(this, "src", { set: () => this.onload() });
    };
    return { canvases, encodes };
}

const newPhoto = "data:image/jpeg;base64,TkVXUEhPVE8=";
const newThumbnail = "data:image/jpeg;base64,TkVXVEhVTUI=";
const validFile = () => ({ files: [{ type: "image/jpeg", size: 100 }] });

test("new photos clear previous data and block saving until both read and thumbnail finish", async () => {
    const b = photoBrowser();
    b.set("landmarkImageData", photoData);
    b.set("landmarkThumbnailData", "data:image/jpeg;base64,T0xEVEhVTUI=");
    const count = b.get("activeJourney.photos.length");
    const task = b.context.analyzeLandmarkImage(validFile());
    assert.equal(b.get("landmarkImageData"), "");
    assert.equal(b.get("landmarkThumbnailData"), "");
    assert(!b.context.document.getElementById("result").innerHTML.includes("saveJourneyButton"));
    assert.equal(await b.context.saveJourneyPhoto(), false);
    assert.equal(b.get("activeJourney.photos.length"), count);
    b.readers[0].complete(newPhoto);
    await until(() => b.thumbnails.length === 1);
    assert.equal(await b.context.saveJourneyPhoto(), false);
    assert.equal(b.get("activeJourney.photos.length"), count);
    b.thumbnails[0].resolve(newThumbnail);
    await task;
    assert.equal(b.context.ourFlowPhotoSelectionPending, false);
    assert(b.context.document.getElementById("result").innerHTML.includes("Photo Ready"));
    assert.equal(await b.context.saveJourneyPhoto(), true);
    assert.equal(b.get("activeJourney.photos.at(-1).thumbnail"), newThumbnail);
    assert.equal(b.get("landmarkImageData"), newPhoto);
});

test("a superseded FileReader cannot restore an old photo or overwrite ready UI", async () => {
    const b = photoBrowser();
    const oldTask = b.context.analyzeLandmarkImage(validFile());
    const newTask = b.context.analyzeLandmarkImage(validFile());
    b.readers[0].complete(photoData); // Simulate a callback already queued before abort.
    b.readers[1].complete(newPhoto);
    await until(() => b.thumbnails.length === 1);
    assert.equal(b.thumbnails[0].image, newPhoto);
    b.thumbnails[0].resolve(newThumbnail);
    await Promise.all([oldTask, newTask]);
    assert.equal(b.get("landmarkImageData"), newPhoto);
    assert.equal(b.get("landmarkThumbnailData"), newThumbnail);
    assert(b.context.document.getElementById("result").innerHTML.includes("Photo Ready"));
});

test("a superseded thumbnail cannot contaminate the new selection", async () => {
    const b = photoBrowser();
    const oldTask = b.context.analyzeLandmarkImage(validFile());
    b.readers[0].complete(photoData);
    await until(() => b.thumbnails.length === 1);
    const newTask = b.context.analyzeLandmarkImage(validFile());
    b.thumbnails[0].resolve("data:image/jpeg;base64,T0xEVEhVTUI=");
    await oldTask;
    assert.equal(b.get("landmarkImageData"), "");
    assert.equal(b.get("landmarkThumbnailData"), "");
    assert.equal(b.context.ourFlowPhotoSelectionPending, true);
    b.readers[1].complete(newPhoto);
    await until(() => b.thumbnails.length === 2);
    b.thumbnails[1].resolve(newThumbnail);
    await newTask;
    assert.equal(b.get("landmarkThumbnailData"), newThumbnail);
});

for (const phase of ["read", "thumbnail"]) {
    test("clearing device data cancels an outstanding photo " + phase, async () => {
        const b = photoBrowser();
        const task = b.context.analyzeLandmarkImage(validFile());
        if (phase === "thumbnail") {
            b.readers[0].complete(newPhoto);
            await until(() => b.thumbnails.length === 1);
        }
        b.context.clearAllOurFlowDeviceData();
        const clearedCard = b.context.document.getElementById("result").innerHTML;
        if (phase === "thumbnail") b.thumbnails[0].resolve(newThumbnail);
        else b.readers[0].complete(newPhoto);
        await task;
        assert.equal(b.get("activeJourney"), null);
        assert.equal(b.get("landmarkImageData"), "");
        assert.equal(b.get("landmarkThumbnailData"), "");
        assert.equal(b.context.document.getElementById("result").innerHTML, clearedCard);
        assert.equal(b.storage.get("activeJourney"), undefined);
    });
}

test("a save already waiting for an old thumbnail cannot write after selection changes", async () => {
    const b = photoBrowser();
    b.set("landmarkImageData", photoData);
    const oldThumbnail = deferred();
    b.context.landmarkThumbnailPromise = oldThumbnail.promise;
    const count = b.get("activeJourney.photos.length");
    const oldSave = b.context.saveJourneyPhoto();
    const newTask = b.context.analyzeLandmarkImage(validFile());
    oldThumbnail.resolve("data:image/jpeg;base64,T0xEVEhVTUI=");
    assert.equal(await oldSave, false);
    assert.equal(b.get("activeJourney.photos.length"), count);
    assert.equal(b.get("landmarkThumbnailData"), "");
    b.readers[0].complete(newPhoto);
    await until(() => b.thumbnails.length === 1);
    b.thumbnails[0].resolve(newThumbnail);
    await newTask;
    assert.equal(await b.context.saveJourneyPhoto(), true);
    assert.equal(b.get("activeJourney.photos.length"), count + 1);
    assert.equal(b.get("activeJourney.photos.at(-1).thumbnail"), newThumbnail);
});

test("duplicate Save actions persist a ready photo only once", async () => {
    const b = photoBrowser();
    b.set("landmarkImageData", newPhoto);
    b.set("landmarkThumbnailData", newThumbnail);
    const count = b.get("activeJourney.photos.length");
    const first = b.context.saveJourneyPhoto();
    const second = b.context.saveJourneyPhoto();
    assert.equal(await first, true);
    assert.equal(await second, false);
    assert.equal(b.get("activeJourney.photos.length"), count + 1);
});

test("photo read errors clear state without leaking details or enabling Save", async () => {
    const b = photoBrowser();
    const task = b.context.analyzeLandmarkImage(validFile());
    b.readers[0].onerror(new Error(privateValue));
    await task;
    assert.equal(b.get("landmarkImageData"), "");
    assert.equal(b.context.ourFlowPhotoSelectionPending, false);
    assert.equal(await b.context.saveJourneyPhoto(), false);
    assert(!JSON.stringify(b.logs).includes(privateValue));
    assert.equal(b.requests.length, 0);
});

test("a 4 MiB source photo is resized before becoming an AI image, including JSON overhead", async () => {
    const b = photoBrowser();
    const original = "data:image/jpeg;base64," + Buffer.alloc(4 * 1024 * 1024).toString("base64");
    const stillTooLarge = "data:image/jpeg;base64," + "A".repeat(3500000);
    const resized = "data:image/jpeg;base64," + "A".repeat(3400000);
    const { encodes } = resizeCanvas(b, [stillTooLarge, resized]);
    const input = { files: [{ type: "image/jpeg", size: 4 * 1024 * 1024 }] };
    assert.equal(b.context.validateSelectedLandmarkFile(input.files[0]).valid, true);
    const task = b.context.analyzeLandmarkImage(input);
    b.readers[0].complete(original);
    await until(() => b.thumbnails.length === 1);
    assert.equal(b.thumbnails[0].image, resized);
    b.thumbnails[0].resolve(newThumbnail);
    await task;
    b.set("activeJourney", { ...fixture(), notes: Array(5).fill("界".repeat(800)),
        destination: "界".repeat(800), destinationAddress: "界".repeat(800) });
    b.set("conversationHistory", Array.from({ length: 20 }, () =>
        ({ contextSessionId: "current-session", text: "界".repeat(800) })));
    const payload = b.context.buildOurFlowPayload("Analyze this photo", { injectJourneyContext: true });
    assert.equal(payload.landmarkImageData, resized);
    const body = JSON.stringify(payload);
    assert(Buffer.byteLength(body, "utf8") <= 4000000);
    assert(Buffer.byteLength(body, "utf8") < 4500000);
    assert(encodes.length >= 2);
    assert(encodes.every(x => x.width <= 2048 && x.height <= 2048 && x.type === "image/jpeg"));
    assert(!body.includes(original));
});

test("small JPEG, PNG, and WebP image data retain their original quality", async () => {
    const b = photoBrowser();
    for (const type of ["jpeg", "png", "webp"]) {
        const data = "data:image/" + type + ";base64,TkVX";
        assert.equal(await b.context.prepareLandmarkImageData(data), data);
    }
});

test("an image that cannot be resized under budget fails safely without submitting the original", async () => {
    const b = photoBrowser();
    const oversized = "data:image/png;base64," + "A".repeat(3500000);
    const { encodes } = resizeCanvas(b, ["data:image/jpeg;base64," + "A".repeat(3500000)]);
    const task = b.context.analyzeLandmarkImage({ files: [{ type: "image/png", size: 3000000 }] });
    b.readers[0].complete(oversized);
    await task;
    assert(encodes.length > 0 && encodes.length <= 5);
    assert.equal(b.get("landmarkImageData"), "");
    assert.equal(b.get("landmarkThumbnailData"), "");
    assert.equal(b.context.ourFlowPhotoSelectionPending, false);
    assert.equal(b.requests.length, 0);
});

test("existing source file-size and MIME restrictions still reject invalid selections", async () => {
    for (const file of [{ type: "image/svg+xml", size: 100 },
        { type: "image/jpeg", size: 4 * 1024 * 1024 + 1 }]) {
        const b = photoBrowser();
        b.set("landmarkImageData", photoData);
        assert.equal(await b.context.previewLandmarkImage({ files: [file] }), false);
        assert.equal(b.get("landmarkImageData"), "");
        assert.equal(b.readers.length, 0);
    }
});

test("the full JSON UTF-8 budget includes punctuation, escaping, and non-ASCII text", () => {
    const b = browser();
    const base = { question: "", landmarkImageData: "界\\\"\n" };
    const overhead = Buffer.byteLength(JSON.stringify(base), "utf8");
    const boundary = { ...base, question: "x".repeat(4000000 - overhead) };
    assert.equal(Buffer.byteLength(JSON.stringify(boundary), "utf8"), 4000000);
    assert.doesNotThrow(() => b.context.assertOurFlowRequestSize(boundary));
    assert.throws(() => b.context.assertOurFlowRequestSize({ ...boundary, question: boundary.question + "x" }),
        error => error.code === "OURFLOW_REQUEST_TOO_LARGE");
    const utf8Heavy = { question: "界".repeat(1400000) };
    assert(JSON.stringify(utf8Heavy).length < 4000000);
    assert.throws(() => b.context.assertOurFlowRequestSize(utf8Heavy),
        error => error.code === "OURFLOW_REQUEST_TOO_LARGE");
});

for (const entry of ["askOurFlow", "continueLocationIntakeWithAI", "analyzeSavedJourneyPhoto", "analyzeSavedJourneyPhotoLegacy"]) {
    test(entry + " stops oversized photo-plus-context requests before fetch", async () => {
        const b = browser({ ...fixture(), notes: Array(5).fill("界".repeat(40000)) });
        b.set("landmarkImageData", "data:image/jpeg;base64," + "A".repeat(3490000));
        b.context.pendingLocationIntakeCandidate = { originalText: "Help me with this photo" };
        b.context.document.getElementById("questionInput").value = "Explain why zebras have stripes";
        await b.context[entry]();
        assert.equal(b.requests.length, 0);
        const result = b.context.document.getElementById("result");
        assert((result.innerHTML + JSON.stringify(result.children)).includes("too large"));
        assert(!JSON.stringify(b.logs).includes("界"));
    });
}

test("server independently rejects full requests over 4,000,000 bytes before upstream work", async t => {
    const a = await api(t, "askOurFlow.js", async () => { throw new Error("Must not reach upstream"); });
    const body = { question: "Analyze", padding: "x".repeat(4000000) };
    const response = await a.invoke(body);
    assert.equal(response.code, 413);
    assert.equal(a.calls.length, 0);
});

test("server independently rejects an encoded image above its reserved image budget", async t => {
    const a = await api(t, "askOurFlow.js", async () => { throw new Error("Must not reach upstream"); });
    const body = { question: "Analyze", landmarkImageData: "data:image/jpeg;base64," + "A".repeat(3500000) };
    assert(Buffer.byteLength(JSON.stringify(body)) < 4000000);
    const response = await a.invoke(body);
    assert.equal(response.code, 413);
    assert.equal(a.calls.length, 0);
});

for (const [file, body, limit, field] of [
    ["askOurFlow.js", { question: privateValue, landmarkImageData: photoData }, 768, "answer"],
    ["searchPlace.js", { query: privateValue }, 256, "arrivalTip"],
    ["findDestinationAddress.js", { destination: privateValue }, 256, "suggestion"]
]) {
    test(file + " enforces its output-token budget and preserves completed responses", async t => {
        const a = await api(t, file, async () => ({ ok: true, status: 200,
            json: async () => ({ choices: [{ finish_reason: "stop", message: { content: "Completed answer" } }] }) }));
        const response = await a.invoke(body);
        assert.equal(response.code, 200);
        assert.equal(response.body[field], "Completed answer");
        assert.equal(a.calls.length, 1, "One paid request, without automatic retries");
        assert.equal(a.calls[0][0], "https://api.openai.com/v1/chat/completions");
        const request = JSON.parse(a.calls[0][1].body);
        assert.equal(request.model, "gpt-4o-mini");
        assert.equal(request.max_completion_tokens, limit);
        assert(!("max_tokens" in request));
        assert(Array.isArray(request.messages));
        if (body.landmarkImageData) assert.equal(request.messages[1].content[1].image_url.url, photoData);
        assert(!JSON.stringify(a.logs).includes(privateValue));
    });

    for (const content of [privateValue + " " + maliciousText, ""]) {
        test(file + " rejects " + (content ? "partial" : "empty") + " token-limited output without leaks or retries", async t => {
            const a = await api(t, file, async () => ({ ok: true, status: 200,
                json: async () => ({ choices: [{ finish_reason: "length", message: { content } }] }) }));
            const response = await a.invoke(body);
            assert.equal(response.code, 502);
            assert.deepEqual(Object.keys(response.body), ["error"]);
            assert.equal(typeof response.body.error, "string");
            assert(!(field in response.body), "No truncated answer, arrival note, or address is returned");
            assert.equal(a.calls.length, 1, "Do not retry and increase spending");
            assert(!JSON.stringify(response.body).includes(privateValue));
            assert(!JSON.stringify(response.body).includes(maliciousText));
            assert(!JSON.stringify(a.logs).includes(privateValue));
            assert(!JSON.stringify(a.logs).includes(maliciousText));
            assert(JSON.stringify(a.logs).includes("upstream_truncated_response"));
            assert(!JSON.stringify(a.logs).includes('"success":true'));
        });
    }
}

function browserForIncompleteAnswer() {
    const b = browser({ ...fixture(), answers: ["Previously saved answer"],
        photos: [{ thumbnail: photoData, analysis: "Previously saved analysis" }] });
    b.set("landmarkImageData", photoData);
    b.context.pendingLocationIntakeCandidate = { originalText: "Explain why zebras have stripes" };
    b.context.document.getElementById("questionInput").value = "Explain why zebras have stripes";
    return b;
}

test("arrival help keeps a working map search when its AI completion is truncated", async t => {
    const partial = "TRUNCATED_ARRIVAL_RESPONSE";
    const a = await api(t, "searchPlace.js", async () => ({ ok: true, status: 200,
        json: async () => ({ choices: [{ finish_reason: "length", message: { content: partial } }] }) }));
    const b = browser();
    b.context.fetch = async (url, options) => {
        const result = await a.invoke(JSON.parse(options.body));
        return { ok: false, status: result.code, json: async () => result.body };
    };
    const destination = "Museum & Library";
    await b.context.getArrivalHelp(destination);
    assert.equal(a.calls.length, 1);
    assert(b.get("activeJourney.arrivalTips").startsWith("Map search ready."));
    const map = new URL(b.get("activeJourney.mapLink"));
    assert.equal(map.origin, "https://www.google.com");
    assert.equal(map.pathname, "/maps/search/");
    assert.equal(map.searchParams.get("query"), destination);
    assert(!JSON.stringify(b.get("activeJourney")).includes(partial));
    assert(!b.context.document.getElementById("activeJourneyBox").innerHTML.includes(partial));
});

test("a truncated address lookup cannot become a suggested or saved parking address", async t => {
    const a = await api(t, "findDestinationAddress.js", async () => ({ ok: true, status: 200,
        json: async () => ({ choices: [{ finish_reason: "length", message: { content: privateValue } }] }) }));
    const b = browser({ ...fixture(), parkingLocation: "Central Garage" });
    const storedBefore = b.storage.get("activeJourney");
    b.context.fetch = async (url, options) => {
        const result = await a.invoke(JSON.parse(options.body));
        return { ok: false, status: result.code, json: async () => result.body };
    };
    await b.context.verifyParkingLocation();
    assert.equal(a.calls.length, 1);
    assert.equal(b.context.suggestedParkingAddress, "");
    assert.equal(b.get("pendingParkingLocationAddress"), "");
    assert.equal(b.storage.get("activeJourney"), storedBefore);
    const html = b.context.document.getElementById("result").innerHTML;
    assert(html.includes("No suggestion found."));
    assert(!html.includes(privateValue));
    assert(html.includes("Look Up Address"));
    assert(html.includes("Enter Address Manually"));
});

function assertIncompleteAnswerNotSaved(b, journeyBefore, storedBefore) {
    const visible = JSON.stringify([...b.nodes.values()]);
    assert(!visible.includes(privateValue));
    assert(!visible.includes(maliciousText));
    assert.equal(b.get("JSON.stringify(activeJourney)"), journeyBefore);
    assert.equal(b.storage.get("activeJourney"), storedBefore);
    assert(!JSON.stringify(b.logs).includes(privateValue));
    assert(!JSON.stringify(b.logs).includes(maliciousText));
    assert.equal(b.get("pendingPhotoMemory"), false);
    assert(!b.context.photoAnalysisInProgress, "Photo processing lock is released");
    assert(!b.context.photoSuggestions, "Incomplete output creates no memory suggestions");
    const result = b.context.document.getElementById("result");
    assert(/Error contacting|temporarily unavailable|Photo Analysis Did Not Finish/.test(
        result.innerHTML + JSON.stringify(result.children)), "Show the existing safe failure card");
}

for (const entry of ["askOurFlow", "continueLocationIntakeWithAI", "analyzeSavedJourneyPhoto", "analyzeSavedJourneyPhotoLegacy"]) {
    test(entry + " handles a server-rejected truncated completion without displaying or saving it", async t => {
        const a = await api(t, "askOurFlow.js", async () => ({ ok: true, status: 200,
            json: async () => ({ choices: [{ finish_reason: "length",
                message: { content: privateValue + " " + maliciousText } }] }) }));
        const b = browserForIncompleteAnswer();
        const journeyBefore = b.get("JSON.stringify(activeJourney)");
        const storedBefore = b.storage.get("activeJourney");
        b.context.fetch = async (url, options) => {
            b.requests.push({ url, body: JSON.parse(options.body) });
            const result = await a.invoke(JSON.parse(options.body));
            return { ok: result.code >= 200 && result.code < 300, status: result.code, json: async () => result.body };
        };
        await b.context[entry]();
        assert.equal(b.requests.length, 1);
        assert.equal(a.calls.length, 1);
        assertIncompleteAnswerNotSaved(b, journeyBefore, storedBefore);
    });

    test(entry + " rejects failed HTTP and missing or empty answers before updating the journey", async () => {
        for (const result of [
            { ok: false, body: { error: privateValue, answer: privateValue + " " + maliciousText } },
            { ok: true, body: { error: privateValue } },
            { ok: true, body: { answer: "  " } },
            { ok: true, body: null }
        ]) {
            const b = browserForIncompleteAnswer();
            const journeyBefore = b.get("JSON.stringify(activeJourney)");
            const storedBefore = b.storage.get("activeJourney");
            b.context.fetch = async (url, options) => {
                b.requests.push({ url, body: JSON.parse(options.body) });
                return { ok: result.ok, json: async () => result.body };
            };
            await b.context[entry]();
            assert.equal(b.requests.length, 1);
            assertIncompleteAnswerNotSaved(b, journeyBefore, storedBefore);
        }
    });
}
