let pendingPhotoMemory = false;

let pendingPhotoClassification = "";

let landmarkImageData = "";

let landmarkThumbnailData = "";

let conversationHistory = [];

let currentJourneyContextId = "";

const LOCAL_STORAGE_LIMITS = {
    activeJourney: 2 * 1024 * 1024,
    savedJourneys: 5 * 1024 * 1024,
    profile: 512 * 1024
};

const PROFILE_STORAGE_KEYS = [
    "profile",
    "ourflowProfile",
    "profileMemory",
    "ourflowProfileMemory",
    "userProfile"
];

function safeReadLocalStorageJson(key, fallback, maxChars, isValid) {

    try {

        const raw =
            localStorage.getItem(key);

        if (!raw) {
            return fallback;
        }

        if (
            maxChars &&
            raw.length > maxChars
        ) {
            console.warn(
                "Ignoring oversized localStorage data:",
                key
            );
            return fallback;
        }

        const parsed =
            JSON.parse(raw);

        if (
            isValid &&
            !isValid(parsed)
        ) {
            console.warn(
                "Ignoring invalid localStorage data:",
                key
            );
            return fallback;
        }

        return parsed;

    } catch (error) {

        console.warn(
            "Ignoring unreadable localStorage data:",
            key,
            error
        );

        return fallback;
    }
}

function safeReadLocalStorageNumber(key, fallback) {

    const value =
        parseInt(localStorage.getItem(key), 10);

    return Number.isFinite(value)
        ? value
        : fallback;
}

function readSafeProfileState() {

    const profileState = {};

    PROFILE_STORAGE_KEYS.forEach(key => {

        profileState[key] =
            safeReadLocalStorageJson(
                key,
                null,
                LOCAL_STORAGE_LIMITS.profile,
                value => (
                    value === null ||
                    typeof value === "object"
                )
            );
    });

    return profileState;
}

const profileState =
    readSafeProfileState();

let activeJourney =
    safeReadLocalStorageJson(
        "activeJourney",
        null,
        LOCAL_STORAGE_LIMITS.activeJourney,
        value => (
            value === null ||
            (
                typeof value === "object" &&
                !Array.isArray(value)
            )
        )
    );

if (activeJourney) {
    currentJourneyContextId =
        activeJourney.contextSessionId ||
        activeJourney.startTime ||
        "";
}

let pendingParkingLocation = "";

let pendingParkingLocationAddress = "";

let pendingParkingGps = null;

let pendingLocationClassification = "";

let pendingLocationType = "";

let pendingDestinationSearch = "";

let savedJourneys =
    safeReadLocalStorageJson(
        "savedJourneys",
        [],
        LOCAL_STORAGE_LIMITS.savedJourneys,
        Array.isArray
    );

let JOURNEY_LIMIT =
    safeReadLocalStorageNumber(
        "journeyLimit",
        5
    );

function announceOurFlowStatus(message) {

    const status =
        document.getElementById("ourflowStatus");

    if (
        !status ||
        !message
    ) {
        return;
    }

    status.textContent = "";

    setTimeout(() => {
        status.textContent = message;
    }, 20);
}

function showOurFlowStatusCard(title, message, options = {}) {

    const result =
        document.getElementById("result");

    if (!result) {
        return;
    }

    const card =
        document.createElement("div");

    card.className = "card";

    if (options.role) {
        card.setAttribute("role", options.role);
    }

    const heading =
        document.createElement("h2");

    heading.className = "card-title";
    heading.setAttribute("data-card-heading", "");
    heading.tabIndex = -1;
    heading.textContent = title;

    const body =
        document.createElement("p");

    body.textContent = message;

    card.appendChild(heading);
    card.appendChild(body);

    result.replaceChildren(card);

    if (
        options.announce !== false &&
        options.role !== "alert"
    ) {
        announceOurFlowStatus(message);
    }

    if (typeof focusResultCardTarget === "function") {
        focusResultCardTarget("[data-card-heading]");
    }
}

function setAskOurFlowInputError(message) {

    const input =
        document.getElementById("questionInput");

    const error =
        document.getElementById("questionInputError");

    if (!input || !error) {
        return;
    }

    input.setAttribute("aria-invalid", "true");
    error.setAttribute("role", "alert");
    error.textContent = message;
}

function clearAskOurFlowInputError() {

    const input =
        document.getElementById("questionInput");

    const error =
        document.getElementById("questionInputError");

    if (input) {
        input.removeAttribute("aria-invalid");
    }

    if (error) {
        error.removeAttribute("role");
        error.textContent = "";
    }
}

function getOurFlowScrollBehavior() {

    if (
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
        return "auto";
    }

    return "smooth";
}

function focusResultCardTarget(selector) {

    const result =
        document.getElementById("result");

    if (!result) {
        return;
    }

    const target =
        selector
            ? result.querySelector(selector)
            : result.querySelector(
                "[data-card-heading], input:not([type='hidden']), textarea, select"
            );

    if (!target) {
        return;
    }

    const nativeFocusable =
        /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(
            target.tagName
        );

    if (
        !nativeFocusable &&
        !target.hasAttribute("tabindex")
    ) {
        target.setAttribute("tabindex", "-1");
    }

    target.focus({
        preventScroll: false
    });
}

function resetJourneySessionContext() {

    conversationHistory = [];

    currentJourneyContextId =
        activeJourney?.contextSessionId ||
        activeJourney?.startTime ||
        "";

    pendingPhotoMemory = false;

    pendingPhotoClassification = "";

    landmarkImageData = "";

    landmarkThumbnailData = "";

    pendingParkingLocation = "";

    pendingParkingLocationAddress = "";

    pendingParkingGps = null;

    pendingLocationClassification = "";

    pendingLocationType = "";

    pendingDestinationSearch = "";

    if (typeof window !== "undefined") {
        window.pendingLocationIntakeCandidate = null;
        window.destinationPlaceCandidates = [];
        window.destinationVerificationSearchQuery = "";
        window.suggestedAddress = "";
        window.parkingLookupAddress = "";
        window.suggestedParkingAddress = "";
    }
}

function createJourneyContextId() {

    return "journey-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 8);
}

function markActiveJourneyContext(reason) {

    if (!activeJourney) {
        currentJourneyContextId = "";
        return "";
    }

    if (
        !activeJourney.contextSessionId ||
        reason === "new"
    ) {
        activeJourney.contextSessionId =
            createJourneyContextId();
    }

    currentJourneyContextId =
        activeJourney.contextSessionId;

    return currentJourneyContextId;
}

function addConversationHistoryEntry(text) {

    conversationHistory.push({
        text,
        contextSessionId:
            currentJourneyContextId ||
            activeJourney?.contextSessionId ||
            ""
    });
}

function getScopedConversationHistory() {

    const contextSessionId =
        activeJourney?.contextSessionId ||
        currentJourneyContextId ||
        "";

    return conversationHistory
        .filter(entry => {

            if (typeof entry === "string") {
                return false;
            }

            return entry.contextSessionId === contextSessionId;
        })
        .map(entry => entry.text)
        .slice(-20);
}

function shouldInjectActiveJourneyContext(question) {

    if (!activeJourney) {
        return false;
    }

    const text =
        question
            .toLowerCase()
            .replace(/[’‘]/g, "'")
            .trim();

    const isGenericReminder =
        text.startsWith("pick up ") ||
        text.startsWith("pickup ") ||
        text.startsWith("remember to ") ||
        text.startsWith("don't forget ") ||
        text.startsWith("dont forget ") ||
        text.startsWith("remind me to ") ||
        text.startsWith("make sure to ");

    if (isGenericReminder) {
        return false;
    }

    return (
        Boolean(landmarkImageData) ||
        text.includes("journey") ||
        text.includes("destination") ||
        text.includes("arrive") ||
        text.includes("arrival") ||
        text.includes("parking") ||
        text.includes("parked") ||
        text.includes("start location") ||
        text.includes("directions") ||
        text.includes("navigate") ||
        text.includes("route") ||
        text.includes("map") ||
        text.includes("entrance") ||
        text.includes("where am i") ||
        text.includes("how do i get") ||
        text.includes("take me") ||
        text.includes("get there") ||
        text.includes("return to")
    );
}

function buildOurFlowPayload(question, overrides = {}) {

    const injectJourneyContext =
        overrides.injectJourneyContext ??
        shouldInjectActiveJourneyContext(question);

    const journey =
        injectJourneyContext
            ? activeJourney
            : null;

    const payload = {
        question,
        activeJourney: journey,
        history: injectJourneyContext
            ? getScopedConversationHistory()
            : [],
        notes: journey?.notes?.slice(-5) || [],
        destination: journey?.destination || "",
        destinationAddress: journey?.destinationAddress || "",
        parkingLocation: journey?.parkingLocation || "",
        arrivalTips: journey?.arrivalTips || "",
        startLocation: journey?.startLocation || "",
        journeyStatus: journey?.journeyStatus || "",
        landmarkImageData
    };

    logOurFlowPromptDiagnostics(payload, injectJourneyContext);

    return payload;
}

function logOurFlowPromptDiagnostics(payload, injectJourneyContext) {

    const finalPromptPayload = {
        ...payload,
        landmarkImageData: payload.landmarkImageData
            ? "[image data length " + payload.landmarkImageData.length + "]"
            : ""
    };

    console.log("OURFLOW PROMPT TRACE", {
        "Current activeJourney": activeJourney,
        "Conversation history": payload.history,
        "Injected notes": payload.notes,
        "Injected destination": payload.destination,
        "Injected parking": payload.parkingLocation,
        "Injected start location": payload.startLocation,
        "Journey context injected": injectJourneyContext,
        "Final prompt payload": finalPromptPayload
    });
}
