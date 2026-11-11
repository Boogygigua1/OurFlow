const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { pathToFileURL } = require("node:url");

function setup(options = {}) {
    const nodes = new Map();
    const journey = options.journey || {
        contextSessionId: "test", destination: "Example Hospital", destinationDetail: "Example Hospital",
        destinationAddress: "1 Example Road", verifiedDestinationAddress: "1 Example Road",
        notes: [], photos: [], questionsForDoctor: [], staffInstructions: [], medications: [],
        appointments: [], directories: [], timeline: [], answers: [], travelMode: "", journeyStatus: "traveling"
    };
    const storage = new Map([["activeJourney", JSON.stringify(journey)], ["profile", '{"name":"Example"}']]);
    const node = () => ({ value: "", innerHTML: "", textContent: "", style: {},
        setAttribute() {}, removeAttribute() {}, focus() {}, addEventListener() {}, replaceChildren() {},
        querySelector() { return null; }, querySelectorAll() { return []; },
        classList: { add() {}, remove() {} }, getBoundingClientRect() { return { top: 0, bottom: 1 }; } });
    const ctx = {
        console, TextEncoder, setTimeout() {}, clearTimeout() {}, innerHeight: 700,
        localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k) },
        document: { getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
            querySelector() { return null; }, querySelectorAll() { return []; }, createElement: node },
        matchMedia: () => ({ matches: false }), alert() {}, confirm: () => true, open() {}
    };
    ctx.window = ctx;
    vm.createContext(ctx);
    for (const f of ["state.js", "maps.js", "journeyPlaces.js", "recoveryLogic.js", "locationIntake.js", "orientationLogic.js", "locationLogic.js", "photos.js", "journey.js", "mic.js", "memoryHelpers.js", "ourflowCore.js", "app.js"]) {
        vm.runInContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8"), ctx, { filename: f });
    }
    ctx.showActiveJourneyBox = () => {};
    return { ctx, nodes, storage, journey, get: exp => vm.runInContext(exp, ctx) };
}

test("search preserves destination and profile across success, empty, error and retry until explicit selection", async () => {
    const b = setup();
    let mode = "success";
    b.ctx.fetch = async url => ({ ok: mode !== "error", json: async () => url.includes("searchDestinationInfo")
        ? { searchDomain: mode === "empty" ? "" : "example.org" }
        : { arrivalTip: "Check signs", mapUrl: "https://www.google.com/maps/" } });
    for (const state of ["success", "empty", "error", "success"]) {
        mode = state;
        b.ctx.document.getElementById("questionInput").value = "search for Example Cafe";
        await b.ctx.askOurFlow();
        assert.equal(b.get("activeJourney.destination"), "Example Hospital");
        assert.equal(JSON.parse(b.storage.get("activeJourney")).verifiedDestinationAddress, "1 Example Road");
        assert.equal(b.storage.get("profile"), '{"name":"Example"}');
        const html = b.ctx.document.getElementById("result").innerHTML;
        if (state === "empty") {
            assert.match(html, /No information source is configured for this search/);
            assert.match(html, /Search on Google Maps/);
        }
        if (state === "error") assert.match(html, /temporarily unavailable[\s\S]*Retry Search/);
        if (state === "success") assert.doesNotMatch(html, /Save Verified Address/);
    }
    const context = b.ctx.buildOurFlowPayload("Where is my destination?", { injectJourneyContext: true });
    assert.equal(context.destination, "Example Hospital");
    assert.doesNotMatch(JSON.stringify(context), /\"name\":\"Example\"/);
    b.ctx.useSearchAsDestination();
    assert.equal(JSON.parse(b.storage.get("activeJourney")).destination, "Example Cafe");
    assert.equal(JSON.parse(b.storage.get("activeJourney")).verifiedDestinationAddress, "");
});

test("retry repeats the search after a failed response", async () => {
    const b = setup();
    let fails = true;
    b.ctx.fetch = async url => ({ ok: !fails, json: async () => url.includes("searchDestinationInfo")
        ? { searchDomain: "example.org" } : { arrivalTip: "Check signs" } });
    b.ctx.document.getElementById("questionInput").value = "search for Example Cafe";
    await b.ctx.askOurFlow();
    assert.match(b.ctx.document.getElementById("result").innerHTML, /Retry Search/);
    fails = false;
    await b.ctx.retryDestinationSearch();
    assert.match(b.ctx.document.getElementById("result").innerHTML, /Information Search/);
    assert.equal(b.get("activeJourney.destination"), "Example Hospital");
});

test("a failed information search is not presented as an empty result", async () => {
    const b = setup();
    b.ctx.fetch = async url => url.includes("searchDestinationInfo")
        ? { ok: false, json: async () => ({ error: "Unavailable" }) }
        : { ok: true, json: async () => ({ arrivalTip: "Check signs" }) };
    b.ctx.document.getElementById("questionInput").value = "search for Example Cafe";
    await b.ctx.askOurFlow();
    assert.match(b.ctx.document.getElementById("result").innerHTML, /temporarily unavailable/);
    assert.equal(b.get("activeJourney.destination"), "Example Hospital");
});

test("Find shows query-specific fallback for empty and failed results, and only labels a stored verified destination as verified", async () => {
    const b = setup();
    for (const mode of ["success", "empty", "error"]) {
        b.ctx.fetch = async () => ({ ok: mode !== "error", json: async () => mode === "empty" ? {} : { arrivalTip: "Check signs" } });
        b.ctx.document.getElementById("questionInput").value = "find Example Cafe";
        await b.ctx.askOurFlow();
        const html = b.ctx.document.getElementById("result").innerHTML;
        assert.match(html, /Search on Google Maps/);
        assert.match(html, /query=Example%20Cafe/);
        assert.doesNotMatch(html, /Verified Map Search/);
    }
    b.ctx.fetch = async () => ({ ok: true, json: async () => ({ arrivalTip: "Check signs" }) });
    b.ctx.document.getElementById("questionInput").value = "find Example Hospital";
    await b.ctx.askOurFlow();
    assert.match(b.ctx.document.getElementById("result").innerHTML, /Verified Map Search/);
});

test("information search prioritizes the search term with or without an active journey", async () => {
    const { default: handler } = await import(pathToFileURL(path.join(__dirname, "..", "api", "searchDestinationInfo.js")).href);
    for (const active of [false, true]) {
        const b = setup();
        if (!active) vm.runInContext("activeJourney = null", b.ctx);
        const requests = [];
        b.ctx.fetch = async (url, options) => {
            const body = JSON.parse(options.body);
            requests.push({ url, body });
            if (!url.includes("searchDestinationInfo")) return { ok: true, json: async () => ({ arrivalTip: "Check signs" }) };
            const response = { status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
            await handler({ method: "POST", body }, response);
            return { ok: response.code === 200, json: async () => response.body };
        };
        b.ctx.document.getElementById("questionInput").value = "search for Chico State";
        await b.ctx.askOurFlow();
        const info = requests.find(request => request.url.includes("searchDestinationInfo"));
        assert.equal(info.body.searchTerm, "Chico State");
        assert.equal(info.body.destination, active ? "Example Hospital" : "");
        assert.match(b.ctx.document.getElementById("result").innerHTML, /csuchico\.edu/);
        if (active) {
            assert.equal(b.get("activeJourney.destination"), "Example Hospital");
            assert.equal(b.get("activeJourney.verifiedDestinationAddress"), "1 Example Road");
        }
    }
});

test("information lookup prioritizes a recognized search over a different recognized journey context", async () => {
    const { default: handler } = await import(pathToFileURL(path.join(__dirname, "..", "api", "searchDestinationInfo.js")).href);
    for (const [searchTerm, expected] of [["Chico State", "csuchico.edu"], ["radiology", "enloe.org"]]) {
        const response = { status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
        await handler({ method: "POST", body: { destination: "Enloe Hospital", searchTerm } }, response);
        assert.equal(response.body.searchDomain, expected);
    }
});

test("inside details stay with the existing destination until a different destination is selected", async () => {
    const b = setup();
    vm.runInContext('activeJourney.destinationBuilding = "Hospital North Wing"; activeJourney.destinationRoomSuite = "Room 204"', b.ctx);
    b.ctx.fetch = async () => ({ ok: true, json: async () => ({ arrivalTip: "Check signs" }) });
    b.ctx.document.getElementById("questionInput").value = "find Example Cafe";
    await b.ctx.askOurFlow();
    assert.equal(b.get("activeJourney.destinationBuilding"), "Hospital North Wing");
    assert.equal(b.get("activeJourney.destinationRoomSuite"), "Room 204");
    b.ctx.useSearchAsDestination();
    const saved = JSON.parse(b.storage.get("activeJourney"));
    assert.equal(saved.destination, "Example Cafe");
    assert.equal(saved.destinationBuilding, undefined);
    assert.equal(saved.destinationRoomSuite, undefined);
    assert.equal(saved.previousDestinationDetails[0].destination, "Example Hospital");
    assert.equal(saved.previousDestinationDetails[0].details.destinationBuilding, "Hospital North Wing");
    assert.equal(saved.previousDestinationDetails[0].details.destinationRoomSuite, "Room 204");
});

test("selecting the current destination preserves its verified address and inside details", async () => {
    const b = setup();
    vm.runInContext('activeJourney.destinationBuilding = "Hospital North Wing"', b.ctx);
    b.ctx.fetch = async () => ({ ok: true, json: async () => ({ arrivalTip: "Check signs" }) });
    b.ctx.document.getElementById("questionInput").value = "find Example Hospital";
    await b.ctx.askOurFlow();
    vm.runInContext('pendingSearchRequest = { query: "Example Hospital", journey: activeJourney }', b.ctx);
    b.ctx.useSearchAsDestination();
    assert.equal(b.get("activeJourney.destinationBuilding"), "Hospital North Wing");
    assert.equal(b.get("activeJourney.verifiedDestinationAddress"), "1 Example Road");
});

test("session reset releases pending journey and suppresses a late search response", async () => {
    const b = setup();
    let resolveSearch;
    let calls = 0;
    b.ctx.fetch = () => {
        calls++;
        return new Promise(resolve => { resolveSearch = resolve; });
    };
    b.ctx.document.getElementById("questionInput").value = "find Example Cafe";
    const search = b.ctx.askOurFlow();
    const oldRequest = b.get("pendingSearchRequest");
    assert.ok(oldRequest.journey);
    b.ctx.resetJourneySessionContext();
    assert.equal(b.get("pendingSearchRequest"), null);
    assert.equal(oldRequest.journey, null);
    b.ctx.document.getElementById("result").innerHTML = "Reset complete";
    b.ctx.retryDestinationSearch();
    assert.equal(calls, 1);
    resolveSearch({ ok: true, json: async () => ({ arrivalTip: "Check signs" }) });
    await search;
    assert.equal(b.ctx.document.getElementById("result").innerHTML, "Reset complete");
});

test("device clearing cancels retry and late information response without blocking fresh searches", async () => {
    const b = setup();
    let resolveInfo;
    let calls = 0;
    b.ctx.fetch = async url => {
        calls++;
        if (url.includes("searchDestinationInfo")) return new Promise(resolve => { resolveInfo = resolve; });
        return { ok: true, json: async () => ({ arrivalTip: "Check signs" }) };
    };
    b.ctx.document.getElementById("questionInput").value = "search for Example Cafe";
    const search = b.ctx.askOurFlow();
    while (!resolveInfo) await new Promise(resolve => setImmediate(resolve));
    const oldRequest = b.get("pendingSearchRequest");
    b.ctx.clearAllOurFlowDeviceData();
    assert.equal(b.get("pendingSearchRequest"), null);
    assert.equal(oldRequest.journey, null);
    assert.equal(b.storage.has("activeJourney"), false);
    b.ctx.retryDestinationSearch();
    assert.equal(calls, 2);
    resolveInfo({ ok: true, json: async () => ({ searchDomain: "example.org" }) });
    await search;
    assert.match(b.ctx.document.getElementById("result").innerHTML, /data cleared/i);
    assert.equal(b.get("activeJourney"), null);
    b.ctx.fetch = async () => ({ ok: true, json: async () => ({ arrivalTip: "Check signs" }) });
    b.ctx.document.getElementById("questionInput").value = "find Fresh Place";
    await b.ctx.askOurFlow();
    assert.match(b.ctx.document.getElementById("result").innerHTML, /Fresh%20Place/);
});

test("same destination phrases ignore capitalization without offering a new destination", async () => {
    const b = setup();
    vm.runInContext('activeJourney.destination = "Target in Chico"; activeJourney.destinationDetail = "Target in Chico"; activeJourney.originalDestinationRequest = "Target in Chico"', b.ctx);
    for (const phrase of ["headed to Target in Chico", "headed to TARGET in CHICO"]) {
        b.ctx.document.getElementById("questionInput").value = phrase;
        await b.ctx.askOurFlow();
        assert.match(b.ctx.document.getElementById("result").innerHTML, /already part of your active journey/);
        assert.doesNotMatch(b.ctx.document.getElementById("result").innerHTML, /New destination detected/);
        assert.equal(b.get("activeJourney.destination"), "Target in Chico");
    }
});

test("accepting a different destination updates its original request", async () => {
    const b = setup();
    vm.runInContext('activeJourney.destination = "chico state"; activeJourney.originalDestinationRequest = "chico state"', b.ctx);
    b.ctx.document.getElementById("questionInput").value = "headed to Target in Chico";
    await b.ctx.askOurFlow();
    assert.match(b.ctx.document.getElementById("result").innerHTML, /New destination detected/);
    b.ctx.continueCurrentJourneyWithDetectedDestination();
    const saved = JSON.parse(b.storage.get("activeJourney"));
    assert.equal(saved.destination, "Target in Chico");
    assert.equal(saved.originalDestinationRequest, "Target in Chico");
});

test("everyday journey-start phrases route through the normal input", async () => {
    for (const phrase of ["off to Sample Museum", "headed to Sample Museum", "leaving to Sample Museum", "going to Sample Museum"]) {
        const b = setup();
        vm.runInContext("activeJourney = null", b.ctx);
        b.ctx.getArrivalHelp = async () => {};
        b.ctx.document.getElementById("questionInput").value = phrase;
        await b.ctx.askOurFlow();
        assert.equal(b.get("activeJourney.destination"), "Sample Museum", phrase);
    }
});

test("saving a landmark parking note updates the visible summary without rerendering the journey", () => {
    const b = setup();
    const status = { textContent: "No" };
    b.ctx.document.querySelector = selector => selector === "#activeJourneyBox [data-parking-saved-status]" ? status : null;
    b.ctx.showParkingSavedConfirmationCard = () => {};
    vm.runInContext('pendingParkingLocation = "I\'m parked by Hulu\'s"', b.ctx);
    b.ctx.savePendingParking();
    assert.equal(status.textContent, "Yes");
    assert.match(JSON.parse(b.storage.get("activeJourney")).parkingDescription, /Hulu's/);
    assert.match(b.ctx.buildJourneySummary(JSON.parse(b.storage.get("activeJourney"))), /data-parking-saved-status>Yes/);
});

test("accepting a different destination clears prior verification and keeps inside details associated", async () => {
    const b = setup();
    vm.runInContext(`
        activeJourney.destinationName = "Example Hospital";
        activeJourney.destinationGps = { latitude: 39, longitude: -121 };
        activeJourney.destinationPlaceId = "old-place";
        activeJourney.destinationGoogleMapsUri = "https://www.google.com/maps/place/old";
        activeJourney.mapLink = "https://www.google.com/maps/search/?api=1&query=old";
        activeJourney.destinationVerificationSource = "google_places";
        activeJourney.destinationVerifiedAt = "2026-01-01";
        activeJourney.destinationBuilding = "Hospital Wing";
        activeJourney.destinationRoomSuite = "204";
        window.destinationPlaceCandidates = [{ destinationName: "Example Hospital" }];
        window.destinationVerificationSearchQuery = "Example Hospital";
    `, b.ctx);
    b.ctx.document.getElementById("questionInput").value = "headed to Example Cafe";
    await b.ctx.askOurFlow();
    assert.match(b.ctx.document.getElementById("result").innerHTML, /Continue With New Destination/);
    b.ctx.continueCurrentJourneyWithDetectedDestination();
    const saved = JSON.parse(b.storage.get("activeJourney"));
    assert.equal(saved.destination, "Example Cafe");
    for (const field of ["destinationName", "destinationAddress", "verifiedDestinationAddress", "destinationPlaceId", "destinationGoogleMapsUri", "mapLink", "destinationVerificationSource", "destinationVerifiedAt"]) {
        assert.equal(saved[field], "", field);
    }
    assert.equal(saved.destinationGps, null);
    assert.equal(saved.destinationBuilding, undefined);
    assert.equal(saved.destinationRoomSuite, undefined);
    assert.equal(saved.previousDestinationDetails[0].destination, "Example Hospital");
    assert.equal(saved.previousDestinationDetails[0].details.destinationBuilding, "Hospital Wing");
    assert.equal(saved.previousDestinationDetails[0].details.destinationRoomSuite, "204");
    assert.equal(b.ctx.window.destinationPlaceCandidates.length, 0);
    assert.equal(b.ctx.window.destinationVerificationSearchQuery, "");
});

test("a capitalization-only journey phrase preserves verification and inside details", async () => {
    const b = setup();
    vm.runInContext('activeJourney.destinationBuilding = "Hospital Wing"; activeJourney.destinationGps = { latitude: 39, longitude: -121 }; activeJourney.mapLink = "https://www.google.com/maps/place/old"', b.ctx);
    b.ctx.document.getElementById("questionInput").value = "headed to EXAMPLE HOSPITAL";
    await b.ctx.askOurFlow();
    assert.doesNotMatch(b.ctx.document.getElementById("result").innerHTML, /New destination detected/);
    assert.equal(b.get("activeJourney.verifiedDestinationAddress"), "1 Example Road");
    assert.equal(b.get("activeJourney.destinationBuilding"), "Hospital Wing");
    assert.equal(b.get("activeJourney.destinationGps.latitude"), 39);
    assert.equal(b.get("activeJourney.mapLink"), "https://www.google.com/maps/place/old");
});

test("late arrival help for the previous destination cannot restore its map link", async () => {
    const b = setup();
    let resolveLookup;
    b.ctx.fetch = () => new Promise(resolve => { resolveLookup = resolve; });
    const arrival = b.ctx.getArrivalHelp("Example Hospital");
    b.ctx.document.getElementById("questionInput").value = "headed to Example Cafe";
    await b.ctx.askOurFlow();
    b.ctx.continueCurrentJourneyWithDetectedDestination();
    resolveLookup({ ok: true, json: async () => ({ arrivalTip: "Old directions", mapUrl: "https://www.google.com/maps/place/old" }) });
    await arrival;
    assert.equal(b.get("activeJourney.destination"), "Example Cafe");
    assert.equal(b.get("activeJourney.mapLink"), "");
    assert.notEqual(b.get("activeJourney.arrivalTips"), "Old directions");
    assert.notEqual(b.get("activeJourney.arrivalTips"), "Searching for arrival tips...");
});

test("late destination verification cannot offer the previous destination after a switch", async () => {
    const b = setup();
    let resolveLookup;
    b.ctx.fetch = () => new Promise(resolve => { resolveLookup = resolve; });
    const verification = b.ctx.verifySavedLocation();
    b.ctx.document.getElementById("questionInput").value = "headed to Example Cafe";
    await b.ctx.askOurFlow();
    b.ctx.continueCurrentJourneyWithDetectedDestination();
    b.ctx.document.getElementById("result").innerHTML = "New destination remains active";
    resolveLookup({ ok: true, json: async () => ({ candidates: [{ destinationName: "Example Hospital", destinationAddress: "1 Example Road" }] }) });
    await verification;
    assert.equal(b.ctx.document.getElementById("result").innerHTML, "New destination remains active");
    assert.equal(b.get("activeJourney.destination"), "Example Cafe");
    assert.equal(b.get("activeJourney.verifiedDestinationAddress"), "");
    assert.equal(b.ctx.window.destinationPlaceCandidates.length, 0);
});

test("everyday destination changes clear old guidance from storage and outgoing context but same-destination phrases preserve it", async () => {
    const b = setup();
    vm.runInContext('activeJourney.arrivalTips = "Turn right at Hospital A entrance."; activeJourney.timeline.push("Destination Guidance Saved: Turn right at Hospital A entrance.")', b.ctx);
    b.ctx.addConversationHistoryEntry("Turn right at Hospital A entrance.");
    b.ctx.document.getElementById("questionInput").value = "headed to EXAMPLE HOSPITAL";
    await b.ctx.askOurFlow();
    assert.equal(b.get("activeJourney.arrivalTips"), "Turn right at Hospital A entrance.");
    b.ctx.document.getElementById("questionInput").value = "off to Example Cafe";
    await b.ctx.askOurFlow();
    b.ctx.continueCurrentJourneyWithDetectedDestination();
    assert.equal(b.get("activeJourney.arrivalTips"), "");
    assert.equal(JSON.parse(b.storage.get("activeJourney")).arrivalTips, "");
    const payload = b.ctx.buildOurFlowPayload("Help me navigate my journey", { injectJourneyContext: true });
    assert.equal(payload.arrivalTips, "");
    assert.doesNotMatch(JSON.stringify(payload), /Hospital A entrance/);
    const saved = JSON.parse(b.storage.get("activeJourney"));
    assert(saved.timeline.some(event => event.includes("Hospital A entrance")));
    const historyHtml = b.ctx.buildJourneyEventSection(saved.timeline, saved.destinationGuidanceDisplayBoundary);
    assert.doesNotMatch(historyHtml, /Hospital A entrance/);
    assert.match(historyHtml, /Previous Destination Guidance/);
});

test("photo and location-intake destination changes clear guidance without changing the photo or parking", () => {
    for (const route of ["photo", "legacyPhoto", "intake"]) {
        const b = setup();
        vm.runInContext('activeJourney.arrivalTips = "Turn right at Hospital A entrance."; activeJourney.photos = [{ note: "Example Cafe" }]; activeJourney.parkingLocation = "Sample Garage"', b.ctx);
        if (route === "intake") {
            b.ctx.window.pendingLocationIntakeCandidate = { locationText: "Example Cafe", originalText: "Example Cafe", confidence: "place" };
            b.ctx.saveLocationIntakeAsDestination();
        } else {
            b.ctx[route === "photo" ? "savePhotoAsLocation" : "savePhotoAsLocationLegacy"]("destination");
        }
        assert.equal(b.get("activeJourney.destination"), "Example Cafe", route);
        assert.equal(b.get("activeJourney.arrivalTips"), "", route);
        assert.equal(b.get("activeJourney.photos[0].note"), "Example Cafe", route);
        assert.equal(b.get("activeJourney.parkingLocation"), "Sample Garage", route);
        assert.equal(JSON.parse(b.storage.get("activeJourney")).arrivalTips, "", route);
    }
});

test("photo and location-intake saves for the same destination retain guidance", () => {
    for (const route of ["photo", "legacyPhoto", "intake"]) {
        const b = setup();
        vm.runInContext('activeJourney.arrivalTips = "Use the east entrance."; activeJourney.photos = [{ note: "EXAMPLE HOSPITAL" }]', b.ctx);
        if (route === "intake") {
            b.ctx.window.pendingLocationIntakeCandidate = { locationText: "EXAMPLE HOSPITAL", originalText: "EXAMPLE HOSPITAL", confidence: "place" };
            b.ctx.saveLocationIntakeAsDestination();
        } else {
            b.ctx[route === "photo" ? "savePhotoAsLocation" : "savePhotoAsLocationLegacy"]("destination");
        }
        assert.equal(b.get("activeJourney.arrivalTips"), "Use the east entrance.", route);
    }
});

test("arrival response is ignored after changing away and back to the same destination", async () => {
    const b = setup();
    let resolveLookup;
    b.ctx.fetch = () => new Promise(resolve => { resolveLookup = resolve; });
    const arrival = b.ctx.getArrivalHelp("Example Hospital");
    for (const phrase of ["headed to Example Cafe", "going to Example Hospital"]) {
        b.ctx.document.getElementById("questionInput").value = phrase;
        await b.ctx.askOurFlow();
        b.ctx.continueCurrentJourneyWithDetectedDestination();
    }
    resolveLookup({ ok: true, json: async () => ({ arrivalTip: "Old directions", mapUrl: "https://www.google.com/maps/place/old" }) });
    await arrival;
    assert.equal(b.get("activeJourney.destination"), "Example Hospital");
    assert.notEqual(b.get("activeJourney.arrivalTips"), "Old directions");
    assert.notEqual(b.get("activeJourney.mapLink"), "https://www.google.com/maps/place/old");
});

test("verification preserves guidance for the same place and clears it for a different place ID", () => {
    for (const [placeId, expectedGuidance] of [["place-a", "Turn right at Hospital A entrance."], ["place-b", ""]]) {
        const b = setup();
        vm.runInContext('activeJourney.destinationPlaceId = "place-a"; activeJourney.arrivalTips = "Turn right at Hospital A entrance."; activeJourney.destinationBuilding = "Hospital Wing"', b.ctx);
        b.ctx.saveVerifiedDestinationPlace({ destinationName: "Example Hospital", destinationAddress: "1 Example Road", destinationPlaceId: placeId });
        assert.equal(b.get("activeJourney.arrivalTips"), expectedGuidance, placeId);
        if (placeId === "place-b") {
            assert.equal(b.get("activeJourney.destinationBuilding"), undefined);
            assert.equal(b.get("activeJourney.previousDestinationDetails[0].details.destinationBuilding"), "Hospital Wing");
        } else {
            assert.equal(b.get("activeJourney.destinationBuilding"), "Hospital Wing");
        }
    }
});

function restoreFixture(b, fixture) {
    b.ctx.__restorationFixture = fixture;
    vm.runInContext("savedJourneys = [__restorationFixture]", b.ctx);
    b.ctx.restoreJourney(0);
    return JSON.parse(b.storage.get("activeJourney"));
}

test("restoring older mixed guidance keeps only guidance supported after the current destination event", () => {
    const b = setup();
    const old = "Turn right at Hospital A entrance.";
    const current = "Use the cafe side door.";
    const fixture = { ...b.journey, destination: "Example Cafe", arrivalTips: `${old}\n${current}`,
        timeline: ["Destination Set: Example Hospital", `Destination Guidance Saved: ${old}`,
            "Destination Updated: Example Cafe", `Destination Guidance Saved: ${current}`] };
    const before = JSON.stringify(fixture);
    const restored = restoreFixture(b, fixture);
    assert.equal(restored.arrivalTips, current);
    assert.equal(restored.unverifiedArrivalGuidance, old);
    assert.equal(JSON.stringify(fixture), before);
    assert.equal(b.ctx.buildOurFlowPayload("Help with my journey", { injectJourneyContext: true }).arrivalTips, current);
    assert.doesNotMatch(JSON.stringify(b.ctx.buildOurFlowPayload("Help with my journey", { injectJourneyContext: true })), /Hospital A entrance/);
    const panel = b.ctx.buildJourneyDestinationPanels(b.get("activeJourney"));
    assert.match(panel, /Review unverified arrival guidance/);
    assert.match(panel, /Hospital A entrance/);
    assert.match(panel, /not used for navigation or AI/);
});

test("saved journey detail view labels uncertain guidance without changing the archive", () => {
    const b = setup();
    const fixture = { ...b.journey, destination: "Example Cafe", arrivalTips: "Use the north entrance.",
        destinationEntrance: "north entrance", timeline: ["Destination Set: Example Hospital",
            "Destination Guidance Saved: Use the north entrance.", "Destination Updated: Example Cafe"] };
    const before = JSON.stringify(fixture);
    b.ctx.__restorationFixture = fixture;
    vm.runInContext("savedJourneys = [__restorationFixture]", b.ctx);
    b.ctx.toggleJourney(0, { open: true });
    const html = b.ctx.document.getElementById("journey-0").innerHTML;
    assert.match(html, /Review unverified arrival guidance/);
    assert.doesNotMatch(html, /<strong>Entrance<\/strong>[\s\S]*?north entrance/i);
    assert.doesNotMatch(html, /Use for current destination/);
    assert.equal(JSON.stringify(fixture), before);
});

test("missing or ambiguous event evidence keeps guidance unverified", () => {
    for (const timeline of [[], ["Destination Set: Another Place", "Destination Guidance Saved: Use the side door."],
        ["Destination Set: Example Hospital", "Destination Updated: Example Cafe"]]) {
        const b = setup();
        const restored = restoreFixture(b, { ...b.journey, destination: "Example Cafe", arrivalTips: "Use the side door.", timeline });
        assert.equal(restored.arrivalTips, "");
        assert.equal(restored.unverifiedArrivalGuidance, "Use the side door.");
        assert.equal(b.ctx.buildOurFlowPayload("Help with my journey", { injectJourneyContext: true }).arrivalTips, "");
    }
});

test("explicit guidance provenance preserves current destination guidance without legacy events", () => {
    for (const [source, expected] of [["EXAMPLE CAFE", "Use the side door."], ["Example Hospital", ""]]) {
        const b = setup();
        const restored = restoreFixture(b, { ...b.journey, destination: "Example Cafe", arrivalTips: "Use the side door.",
            arrivalGuidanceDestination: source, timeline: [] });
        assert.equal(restored.arrivalTips, expected);
        assert.equal(restored.unverifiedArrivalGuidance, expected ? "" : "Use the side door.");
    }
});

test("legacy inside fields copied from unverified guidance do not appear as current details", () => {
    const b = setup();
    const fixture = { ...b.journey, destination: "Example Cafe", arrivalTips: "Use the north entrance.",
        destinationEntrance: "north entrance", destinationBuilding: "Cafe Building",
        timeline: ["Destination Set: Example Hospital", "Destination Guidance Saved: Use the north entrance.", "Destination Updated: Example Cafe"] };
    const restored = restoreFixture(b, fixture);
    assert.equal(restored.destinationEntrance, undefined);
    assert.equal(restored.unverifiedArrivalGuidanceFields.destinationEntrance, "north entrance");
    assert.equal(restored.destinationBuilding, "Cafe Building");
    assert.equal(fixture.destinationEntrance, "north entrance");
    assert.doesNotMatch(b.ctx.buildInsideDestinationPanel(b.get("activeJourney"), true), /north entrance/i);
    b.ctx.confirmRestoredArrivalGuidance();
    assert.equal(b.get("activeJourney.destinationEntrance"), "north entrance");
});

test("duplicates of unverified guidance stay out of current notes, directories, inside recall, and AI context", () => {
    const b = setup();
    const fixture = { ...b.journey, destination: "Example Cafe", arrivalTips: "Use the north entrance.",
        destinationInsideNotes: "Use the north entrance", notes: ["Use the north entrance", "north entrance", "Bring a notebook"],
        directories: ["Use the north entrance.", "Receptionist: Jamie"], timeline: [] };
    const restored = restoreFixture(b, fixture);
    assert.equal(restored.notes.length, 3);
    const payload = b.ctx.buildOurFlowPayload("Help with my journey", { injectJourneyContext: true });
    assert.doesNotMatch(JSON.stringify(payload), /north entrance/i);
    assert.match(JSON.stringify(payload), /Bring a notebook/);
    assert.doesNotMatch(b.ctx.buildJourneyMemorySections(b.get("activeJourney")), /north entrance/i);
    assert.doesNotMatch(JSON.stringify(b.ctx.getInsideDestinationDetailRows()), /north entrance/i);
    assert.equal(fixture.notes[0], "Use the north entrance");
    b.ctx.confirmRestoredArrivalGuidance();
    assert.match(JSON.stringify(b.ctx.buildOurFlowPayload("Help with my journey", { injectJourneyContext: true })), /north entrance/i);
});

test("unverified or confirmed old guidance in notes remains excluded after another destination change", async () => {
    for (const confirmFirst of [false, true]) {
        const b = setup();
        restoreFixture(b, { ...b.journey, destination: "Example Cafe", arrivalTips: "Use the north entrance.",
            notes: ["Use the north entrance", "Bring a notebook"], timeline: [] });
        if (confirmFirst) b.ctx.confirmRestoredArrivalGuidance();
        b.ctx.document.getElementById("questionInput").value = "going to Example Market";
        await b.ctx.askOurFlow();
        b.ctx.continueCurrentJourneyWithDetectedDestination();
        const payload = b.ctx.buildOurFlowPayload("Help with my journey", { injectJourneyContext: true });
        assert.doesNotMatch(JSON.stringify(payload), /north entrance/i);
        assert.match(JSON.stringify(payload), /Bring a notebook/);
        assert.equal(b.get("activeJourney.notes.length"), 2);
    }
});

test("repeated restoration preserves the archive and confirmation makes guidance explicitly current", () => {
    const b = setup();
    const fixture = { ...b.journey, destination: "Example Cafe", arrivalTips: "Use the side door.", timeline: [] };
    const before = JSON.stringify(fixture);
    restoreFixture(b, fixture);
    b.ctx.restoreJourney(0);
    assert.equal(b.get("activeJourney.unverifiedArrivalGuidance"), "Use the side door.");
    assert.equal(JSON.stringify(fixture), before);
    b.ctx.confirmRestoredArrivalGuidance();
    assert.equal(b.get("activeJourney.arrivalTips"), "Use the side door.");
    assert.equal(b.get("activeJourney.unverifiedArrivalGuidance"), "");
    assert.equal(b.ctx.buildOurFlowPayload("Help with my journey", { injectJourneyContext: true }).arrivalTips, "Use the side door.");
    assert.equal(JSON.stringify(fixture), before);
    const confirmedSnapshot = JSON.parse(b.storage.get("activeJourney"));
    const reopened = restoreFixture(b, confirmedSnapshot);
    assert.equal(reopened.arrivalTips, "Use the side door.");
    assert.equal(reopened.unverifiedArrivalGuidance, "");
});

test("startup recovery quarantines older active-journey guidance before any AI request", () => {
    const journey = {
        contextSessionId: "legacy", destination: "Example Cafe", arrivalTips: "Use the north entrance.",
        destinationEntrance: "north entrance", notes: ["Use the north entrance", "Bring a notebook"],
        photos: [], questionsForDoctor: [], staffInstructions: [], medications: [], appointments: [],
        directories: [], answers: [], timeline: ["Destination Set: Example Hospital",
            "Destination Guidance Saved: Use the north entrance.", "Destination Updated: Example Cafe"]
    };
    const b = setup({ journey });
    const active = JSON.parse(b.storage.get("activeJourney"));
    assert.equal(active.arrivalTips, "");
    assert.equal(active.unverifiedArrivalGuidance, "Use the north entrance.");
    assert.equal(active.destinationEntrance, undefined);
    assert.doesNotMatch(JSON.stringify(b.ctx.buildOurFlowPayload("Help with my journey", { injectJourneyContext: true })), /north entrance/i);
});
