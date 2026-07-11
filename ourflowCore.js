
// ========================================
// ASK OURFLOW ENTRY POINT
// ========================================

const DEBUG_MODE = false;

function showParkingRecall() {

    const result =
        document.getElementById("result");

    const parkingDescription =
        activeJourney?.parkingDescription || "";

    const parkingLocation =
        activeJourney?.parkingLocation || "";

    const parkingLocationAddress =
        activeJourney?.parkingLocationAddress || "";

    const parkingAddress =
        activeJourney?.parkingAddress || "";

    const verifiedParkingAddress =
        activeJourney?.verifiedParkingAddress || "";

    const savedParkingLocation =
        parkingDescription ||
        parkingLocation ||
        verifiedParkingAddress ||
        parkingLocationAddress ||
        parkingAddress;

    const savedParkingAddress =
        verifiedParkingAddress ||
        parkingLocationAddress ||
        parkingAddress;

    const displayParkingAddress =
        savedParkingAddress &&
            savedParkingAddress !== savedParkingLocation
            ? savedParkingAddress
            : "";

    if (savedParkingLocation) {

        result.innerHTML = `
<div class="card">
    <strong>Parking Location</strong>

    <br><br>

    Your vehicle is parked at:

    <br><br>

    ${savedParkingLocation}

    ${displayParkingAddress
                ? `<br><br>${displayParkingAddress}`
                : ""}

    ${activeJourney.parkingVerified
                ? `<br><br>Verified Address`
                : ""}

    <br><br>

    <button onclick="openGoogleMapsToParkingLocation()">
        Open Google Maps
    </button>
</div>
`;

        return;
    }

    result.innerHTML = `
<div class="card">
    <strong>Parking Reminder</strong>

    <br><br>

    I don't have a parking location recorded for this journey.
</div>
`;
}

function continueCurrentJourneyWithDetectedDestination() {

    if (
        !activeJourney ||
        !window.pendingActiveJourneyDestination
    ) {
        showActiveJourneyBox();
        document.getElementById("result").innerHTML = "";
        return;
    }

    const pendingDestination =
        window.pendingActiveJourneyDestination;

    const destination =
        String(pendingDestination.destination || "").trim();

    if (!destination) {
        showActiveJourneyBox();
        document.getElementById("result").innerHTML = "";
        return;
    }

    activeJourney.destination =
        destination;

    activeJourney.destinationDetail =
        destination;

    activeJourney.originalDestinationRequest =
        activeJourney.originalDestinationRequest ||
        destination;

    if (pendingDestination.purpose) {
        activeJourney.journeyPurpose =
            pendingDestination.purpose;
    }

    if (pendingDestination.travelMode) {
        activeJourney.travelMode =
            pendingDestination.travelMode;
    }

    activeJourney.journeyStatus =
        "traveling";

    activeJourney.timeline =
        activeJourney.timeline || [];

    activeJourney.timeline.push(
        "Destination Updated: " + destination
    );

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    window.pendingActiveJourneyDestination = null;

    showActiveJourneyBox();

    document.getElementById("result").innerHTML = "";

    document.getElementById("questionInput")?.focus?.();
}

function hasMeaningfulActiveJourneyDestination(journey) {

    if (!journey) {
        return false;
    }

    const destination =
        String(journey.destination || "").trim();

    const placeholderDestination =
        !destination ||
        destination === "Untitled Journey" ||
        destination === "Photo Memory";

    return Boolean(
        !placeholderDestination ||
        journey.destinationName ||
        journey.destinationDetail ||
        journey.destinationAddress ||
        journey.verifiedDestinationAddress ||
        journey.destinationPlaceId
    );
}

function showParkingMemoryReview(parkingText) {

    pendingParkingLocation =
        typeof getParkingDescriptionForDisplay === "function"
            ? getParkingDescriptionForDisplay(parkingText)
            : parkingText;

    pendingParkingLocationAddress = "";

    if (typeof showLocationConfirmationCard === "function") {
        showLocationConfirmationCard({
            originalText: parkingText,
            locationText: pendingParkingLocation,
            confidence: "place",
            reason: "parking_statement"
        });
        return;
    }

    savePendingParking();
}

function getInsideDestinationDetailRows() {

    if (!activeJourney) {
        return [];
    }

    return [
        {
            key: "building",
            label: "Building",
            value: activeJourney.destinationBuilding
        },
        {
            key: "department",
            label: "Department / Office",
            value: activeJourney.destinationDepartmentOffice
        },
        {
            key: "room",
            label: "Room / Suite",
            value: activeJourney.destinationRoomSuite ||
                activeJourney.destinationInternalLocation
        },
        {
            key: "entrance",
            label: "Entrance",
            value: activeJourney.destinationEntrance
        },
        {
            key: "floor",
            label: "Floor",
            value: activeJourney.destinationFloor
        },
        {
            key: "contact",
            label: "Contact Person",
            value: activeJourney.destinationContactPerson
        },
        {
            key: "phone",
            label: "Phone",
            value: activeJourney.destinationPhone
        },
        {
            key: "email",
            label: "Email",
            value: activeJourney.destinationEmail
        },
        {
            key: "notes",
            label: "Notes",
            value: activeJourney.destinationInsideNotes ||
                activeJourney.destinationDirectoryNote
        }
    ].filter(row => row.value);
}

function getInsideDestinationRecallRows(question) {

    const rows =
        getInsideDestinationDetailRows();

    if (!rows.length) {
        return [];
    }

    const text =
        String(question || "").toLowerCase();

    if (
        text.includes("room") ||
        text.includes("suite")
    ) {
        return rows.filter(row => row.key === "room");
    }

    if (text.includes("entrance")) {
        return rows.filter(row => row.key === "entrance");
    }

    if (text.includes("phone") || text.includes("number")) {
        return rows.filter(row => row.key === "phone");
    }

    if (text.includes("email")) {
        return rows.filter(row => row.key === "email");
    }

    if (
        text.includes("who") ||
        text.includes("meeting") ||
        text.includes("contact person")
    ) {
        return rows.filter(row => row.key === "contact");
    }

    if (text.includes("building")) {
        return rows.filter(row => row.key === "building");
    }

    if (
        text.includes("department") ||
        text.includes("office")
    ) {
        return rows.filter(row => row.key === "department");
    }

    if (text.includes("floor")) {
        return rows.filter(row => row.key === "floor");
    }

    if (
        text.includes("inside destination") ||
        text.includes("inside details") ||
        text.includes("destination details") ||
        text.includes("where am i going") ||
        text.includes("where do i go")
    ) {
        return rows;
    }

    return [];
}

function isInsideDestinationRecall(question) {

    const text =
        String(question || "").toLowerCase();

    return (
        text.includes("inside destination") ||
        text.includes("inside details") ||
        text.includes("room") ||
        text.includes("suite") ||
        text.includes("entrance") ||
        text.includes("phone") ||
        text.includes("email") ||
        text.includes("building") ||
        text.includes("floor") ||
        text.includes("department") ||
        text.includes("office") ||
        text.includes("who am i meeting") ||
        text.includes("who i'm meeting") ||
        text.includes("who im meeting") ||
        text.includes("contact person")
    );
}

function showInsideDestinationRecall(question) {

    const result =
        document.getElementById("result");

    const rows =
        getInsideDestinationRecallRows(question);

    if (!rows.length) {
        result.innerHTML = `
<div class="card">
    <strong>Inside Destination Details</strong>

    <br><br>

    I don't have inside destination details saved for this journey yet.
</div>
`;
        return;
    }

    result.innerHTML = `
<div class="card">
    <strong>Inside Destination Details</strong>

    <br><br>

    ${rows.map(row =>
        `<strong>${row.label}:</strong> ${row.value}`
    ).join("<br>")}
</div>
`;
}

function appendDestinationGuidanceText(existingValue, newValue) {

    const existing =
        String(existingValue || "").trim();

    const value =
        String(newValue || "").trim();

    if (!value) {
        return existing;
    }

    if (
        existing &&
        existing.toLowerCase().includes(value.toLowerCase())
    ) {
        return existing;
    }

    return [
        existing,
        value
    ].filter(Boolean).join("\n");
}

function extractArrivalGuidanceText(value) {

    const text =
        String(value || "").trim();

    if (!text) {
        return "";
    }

    const guidanceMatch =
        text.match(/\b(need to use [^.!?\n]*(?:elevator|stairs|entrance|door|hallway|hall|corridor)|use [^.!?\n]*(?:elevator|stairs|entrance|door|hallway|hall|corridor)|turn left|turn right|continue straight|go straight|walk straight|take the elevator|take elevator|take the stairs|take stairs|use the [^.!?\n]*entrance|use [^.!?\n]*entrance|enter through|go past|walk past|head past|turn at|go through|walk through|follow [^.!?\n]*|look for [^.!?\n]*)\b[\s\S]*/i);

    if (guidanceMatch) {
        return guidanceMatch[0]
            .trim()
            .replace(/^[,;:\s]+/, "");
    }

    return "";
}

function sanitizeArrivalGuidanceText(value) {

    return String(value || "")
        .split(/\n+/)
        .map(extractArrivalGuidanceText)
        .filter(Boolean)
        .join("\n");
}

function extractNavigationClueDetails(clue) {

    const details = {};

    const entranceMatch =
        clue.match(/\b(?:use|enter through|go through|take)\s+(?:the\s+)?([^,.!?]*entrance)\b/i) ||
        clue.match(/\b((?:north|south|east|west|main|front|back|side)\s+entrance)\b/i);

    if (entranceMatch) {
        details.destinationEntrance =
            entranceMatch[1].trim();
    }

    const floorMatch =
        clue.match(/\b(?:to|on)\s+(?:the\s+)?([a-z0-9-]+\s+floor)\b/i) ||
        clue.match(/\b((?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th)?)\s+floor)\b/i);

    if (floorMatch) {
        details.destinationFloor =
            floorMatch[1].trim();
    }

    const roomMatch =
        clue.match(/\b((?:room|suite)\s+[a-z0-9-]+)\b/i);

    if (roomMatch) {
        details.destinationRoomSuite =
            roomMatch[1].trim();
    }

    return details;
}

function saveNavigationClueToDestinationGuidance(clue) {

    if (!activeJourney) {
        return false;
    }

    const details =
        extractNavigationClueDetails(clue);

    activeJourney.arrivalTips =
        appendDestinationGuidanceText(
            sanitizeArrivalGuidanceText(
                activeJourney.arrivalTips
            ),
            clue
        );

    if (details.destinationEntrance) {
        activeJourney.destinationEntrance =
            details.destinationEntrance;
    }

    if (details.destinationFloor) {
        activeJourney.destinationFloor =
            details.destinationFloor;
    }

    if (details.destinationRoomSuite) {
        activeJourney.destinationRoomSuite =
            details.destinationRoomSuite;
    }

    activeJourney.timeline =
        activeJourney.timeline || [];

    activeJourney.timeline.push(
        "Destination Guidance Saved: " +
        clue
    );

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    showActiveJourneyBox("arrivalGuidance");

    return true;
}

function extractStructuredInsideDestinationDetails(text) {

    const value =
        String(text || "").trim();

    const details = {};

    const phoneMatch =
        value.match(/\b(?:phone(?: number)?|number)\s*(?:is|:)?\s*([+()0-9][0-9().\-\s]{6,})/i) ||
        value.match(/\b([+()0-9][0-9().\-\s]{6,})\b/);

    if (phoneMatch) {
        details.destinationPhone =
            phoneMatch[1]
                .trim()
                .replace(/[.,;:!?]+$/g, "");
    }

    const emailMatch =
        value.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);

    if (emailMatch) {
        details.destinationEmail =
            emailMatch[0].trim();
    }

    const floorMatch =
        value.match(/\b(?:on|to|is on)\s+(?:the\s+)?([a-z0-9-]+\s+floor)\b/i) ||
        value.match(/\b((?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th)?)\s+floor)\b/i);

    if (floorMatch) {
        details.destinationFloor =
            floorMatch[1].trim();
    }

    const entranceMatch =
        value.match(/\b((?:north|south|east|west|main|front|back|side)\s+entrance)\b/i) ||
        value.match(/\bentrance\s+(?:is|:)?\s*([^,.!?]+)/i);

    if (entranceMatch) {
        details.destinationEntrance =
            entranceMatch[1].trim();
    }

    const roomMatch =
        value.match(/\b((?:room|suite)\s+[a-z0-9-]+)\b/i) ||
        value.match(/\b([A-Z]{2,}\s*-?\s*\d{2,4}[A-Z]?)\b/);

    if (roomMatch) {
        details.destinationRoomSuite =
            roomMatch[1].trim();
    }

    const departmentOfficeMatch =
        value.match(/\b(?:the\s+)?(.+?\b(?:department|office))\b/i);

    if (departmentOfficeMatch) {
        details.destinationDepartmentOffice =
            departmentOfficeMatch[1]
                .replace(/^(the)\s+/i, "")
                .replace(/\s+department$/i, "")
                .trim();
    }

    const buildingMatch =
        value.match(/\bbuilding\s+(?:is|:)?\s*([^,.!?]+)/i);

    if (buildingMatch) {
        details.destinationBuilding =
            buildingMatch[1].trim();
    }

    const contactMatch =
        value.match(/\bcontact person\s+(?:is|:)?\s*([^,.!?]+)/i);

    if (contactMatch) {
        details.destinationContactPerson =
            contactMatch[1].trim();
    }

    return details;
}

function saveStructuredInsideDestinationDetail(text) {

    if (!activeJourney) {
        return false;
    }

    const details =
        extractStructuredInsideDestinationDetails(text);

    if (typeof saveDestinationInternalDetails === "function") {
        return saveDestinationInternalDetails(details);
    }

    [
        "destinationBuilding",
        "destinationDepartmentOffice",
        "destinationRoomSuite",
        "destinationEntrance",
        "destinationFloor",
        "destinationContactPerson",
        "destinationPhone",
        "destinationEmail"
    ].forEach(field => {
        if (details[field]) {
            activeJourney[field] =
                details[field];
        }
    });

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    showActiveJourneyBox("insideDestination");

    return true;
}

function isArrivalIntent(question) {

    const text =
        question
            .toLowerCase()
            .replace(/[’‘]/g, "'")
            .replace(/[?.!,]/g, "")
            .trim();

    return (
        text.includes("i'm here") ||
        text.includes("im here") ||
        text.includes("i am here") ||
        text.includes("i made it") ||
        text.includes("made it") ||
        text.includes("i got here") ||
        text.includes("i found it") ||
        text.includes("found it") ||
        text.includes("i've arrived") ||
        text.includes("ive arrived") ||
        text.includes("i have arrived") ||
        text.includes("i arrived") ||
        text.includes("arrived at destination")
    );
}

function escapeRouteDebugValue(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getRouteDebugHtml(routeDebug) {

    if (!DEBUG_MODE) {
        return "";
    }

    return `
<br><br>
<div style="font-size:11px; color:#666; line-height:1.5; border-top:1px solid #ddd; padding-top:8px;">
    <strong>Route Debug</strong><br>
    Raw input: ${escapeRouteDebugValue(routeDebug.rawInput)}<br>
    Normalized input: ${escapeRouteDebugValue(routeDebug.normalizedInput)}<br>
    isInstructionPhrase: ${escapeRouteDebugValue(routeDebug.isInstructionPhrase)}<br>
    AI fallback reached: ${escapeRouteDebugValue(routeDebug.aiFallbackReached)}
</div>
`;
}

function normalizeJourneyApostrophes(value) {

    return String(value || "")
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201B\u2032\u02BC\uFF07\u0060\u00B4]/g, "'")
        .replace(/\u00e2\u20ac[\u2122\u02dc]/g, "'");
}

function normalizeJourneyStartInput(question) {

    return normalizeJourneyApostrophes(question)
        .toLowerCase()
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201B\u2032\u02BC\uFF07\u0060\u00B4]/g, "'")
        .replace(/[Ã¢â‚¬â„¢Ã¢â‚¬Ëœ]/g, "'")
        .replace(/[?.!,]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeJourneyStartMatchText(question) {

    return normalizeJourneyApostrophes(question)
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201B\u2032\u02BC\uFF07\u0060\u00B4]/g, "'")
        .replace(/[Ã¢â‚¬â„¢Ã¢â‚¬Ëœ]/g, "'")
        .replace(/[?.!,]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function extractJourneyDestination(match) {

    return String(match?.groups?.destination || "")
        .replace(/[.?!]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeJourneyPurpose(value) {

    const text =
        String(value || "")
            .replace(/[.?!]+$/g, "")
            .replace(/\s+/g, " ")
            .trim();

    if (!text) {
        return "";
    }

    return text.charAt(0).toUpperCase() + text.slice(1);
}

function splitJourneyDestinationAndPurpose(destination) {

    const text =
        String(destination || "")
            .replace(/[.?!]+$/g, "")
            .replace(/\s+/g, " ")
            .trim();

    if (!text) {
        return {
            destination: "",
            purpose: ""
        };
    }

    const purposePatterns = [
        /\s+to\s+(ask|see|meet|pick\s+up|drop\s+off)\b(.+)$/i,
        /\s+for\s+((?:my\s+|an?\s+)?appointment|(?:my\s+|an?\s+)?meeting)\b(.*)$/i
    ];

    for (const pattern of purposePatterns) {
        const match =
            text.match(pattern);

        if (!match || !match.index) {
            continue;
        }

        const cleanDestination =
            text.slice(0, match.index).trim();

        if (!isLikelyPlaceDestination(cleanDestination)) {
            continue;
        }

        return {
            destination:
                cleanDestination,
            purpose:
                normalizeJourneyPurpose(
                    match[1] + (match[2] || "")
                )
        };
    }

    return {
        destination:
            text,
        purpose: ""
    };
}

function detectJourneyTravelMode(match) {

    const mode =
        String(match?.groups?.mode || "")
            .toLowerCase()
            .trim();

    if (!mode) {
        return "";
    }

    if (mode.includes("driving")) {
        return "driving";
    }

    if (mode.includes("walking")) {
        return "walking";
    }

    if (
        mode.includes("biking") ||
        mode.includes("cycling")
    ) {
        return "biking";
    }

    if (mode.includes("hiking")) {
        return "hiking";
    }

    if (mode.includes("bus")) {
        return "transit";
    }

    if (mode.includes("flying")) {
        return "traveling";
    }

    return "";
}

function isLikelyPlaceDestination(destination) {

    const text =
        String(destination || "").trim();

    if (!text || text.length < 3) {
        return false;
    }

    const normalized =
        normalizeJourneyStartInput(text);

    if (/^(a|an|the|there|home|work)$/.test(normalized)) {
        return false;
    }

    return /[a-z0-9]/i.test(text);
}

function isFalsePositiveJourneyStart(question, destination) {

    const text =
        normalizeJourneyStartInput(question);

    const destinationText =
        normalizeJourneyStartInput(destination);

    if (!destinationText) {
        return true;
    }

    const blockedWholePhrases = [
        /\bi'?m thinking about\b/,
        /\bi am thinking about\b/,
        /\bi worked at\b/,
        /\bi was at\b/,
        /\bi used to go to\b/,
        /\bi heard about\b/,
        /\bi like\b/
    ];

    if (blockedWholePhrases.some(pattern => pattern.test(text))) {
        return true;
    }

    const blockedDestinations = [
        /^ask\b/,
        /^call\b/,
        /^tell\b/,
        /^bring\b/,
        /^buy\b/,
        /^get\b/,
        /^text\b/,
        /^email\b/,
        /^message\b/,
        /^fix\b/,
        /^fixing\b/,
        /^work on\b/,
        /^working on\b/,
        /^talk to\b/,
        /^check\b/,
        /^see whether\b/,
        /^find out\b/,
        /^remember\b/,
        /^think about\b/,
        /^thinking about\b/
    ];

    return blockedDestinations.some(pattern =>
        pattern.test(destinationText)
    );
}

function isRejectedJourneyStartActionPhrase(question) {

    const text =
        normalizeJourneyStartInput(question);

    return (
        /^(?:i'm|im|i am)\s+going\s+to\s+(?:ask|call|tell|bring|buy|get|fix|work on|talk to|check|see whether|find out|remember)\b/.test(text) ||
        /^(?:i'm|im|i am)\s+headed\s+toward\b/.test(text)
    );
}

function detectJourneyStartIntent(question) {

    const normalizedText =
        normalizeJourneyStartInput(question);

    const matchText =
        normalizeJourneyStartMatchText(question);

    if (!normalizedText) {
        return null;
    }

    const personPrefix =
        "(?:(?:i'm|im|i am)\\s+)?";

    const destinationPatterns = [
        {
            name: "explicit-journey-to",
            pattern: /^(?:start|begin)\s+(?:a\s+)?journey\s+to\s+(?<destination>.+)$/i
        },
        {
            name: "explicit-start-journey",
            pattern: /^start\s+(?:a\s+)?journey\s+(?<destination>.+)$/i
        },
        {
            name: "explicit-starting-journey-to",
            pattern: /^starting\s+(?:a\s+)?(?:my\s+)?journey\s+to\s+(?<destination>.+)$/i
        },
        {
            name: "explicit-starting-journey",
            pattern: /^starting\s+(?:a\s+)?journey\s+(?<destination>.+)$/i
        },
        {
            name: "on-my-way-to",
            pattern: new RegExp(
                "^" + personPrefix +
                "on\\s+my\\s+way\\s+to\\s+(?<destination>.+)$",
                "i"
            )
        },
        {
            name: "headed-to",
            pattern: new RegExp(
                "^" + personPrefix +
                "(?:headed\\s+off|headed|heading)\\s+to\\s+(?<destination>.+)$",
                "i"
            )
        },
        {
            name: "off-to",
            pattern: new RegExp(
                "^" + personPrefix +
                "off\\s+to\\s+(?<destination>.+)$",
                "i"
            )
        },
        {
            name: "leaving-for",
            pattern: new RegExp(
                "^" + personPrefix +
                "leaving\\s+for\\s+(?<destination>.+)$",
                "i"
            )
        },
        {
            name: "going-to",
            pattern: new RegExp(
                "^" + personPrefix +
                "going\\s+to\\s+(?<destination>.+)$",
                "i"
            )
        },
        {
            name: "travel-mode-to",
            pattern: new RegExp(
                "^" + personPrefix +
                "(?<mode>driving|walking|biking|cycling|hiking|flying)\\s+to\\s+(?<destination>.+)$",
                "i"
            )
        },
        {
            name: "bus-to",
            pattern: new RegExp(
                "^" + personPrefix +
                "(?<mode>taking\\s+the\\s+bus)\\s+to\\s+(?<destination>.+)$",
                "i"
            )
        },
        {
            name: "traveling-to",
            pattern: new RegExp(
                "^" + personPrefix +
                "(?<mode>travell?ing)\\s+to\\s+(?<destination>.+)$",
                "i"
            )
        }
    ];

    for (const entry of destinationPatterns) {
        const match =
            matchText.match(entry.pattern);

        if (!match) {
            continue;
        }

        const destinationParts =
            splitJourneyDestinationAndPurpose(
                extractJourneyDestination(match)
            );

        const destination =
            destinationParts.destination;

        if (!isLikelyPlaceDestination(destination)) {
            continue;
        }

        if (isFalsePositiveJourneyStart(question, destination)) {
            continue;
        }

        return {
            destination,
            purpose:
                destinationParts.purpose,
            matchedPattern:
                entry.name,
            travelMode:
                detectJourneyTravelMode(match),
            normalizedInput:
                normalizedText
        };
    }

    return null;
}

function getJourneyDestinationFromInput(question) {

    return detectJourneyStartIntent(question)?.destination || "";
}

function getJourneyDestinationFromInputLegacy(question) {

    const originalText =
        String(question || "").trim();

    if (!originalText) {
        return "";
    }

    const normalizedText =
        originalText
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[â€™â€˜]/g, "'")
            .trim();

    const destinationPatterns = [
        /^(?:begin|start)\s+(?:a\s+)?journey\s+to\s+(.+)$/i,
        /^start\s+(?:a\s+)?journey\s+(.+)$/i,
        /^starting\s+(?:a\s+)?(?:my\s+)?journey\s+to\s+(.+)$/i,
        /^starting\s+(?:a\s+)?journey\s+(.+)$/i,
        /^(?:i'm|im|i am)\s+off\s+to\s+(.+)$/i,
        /^(?:i'm|im|i am)\s+headed\s+to\s+(.+)$/i,
        /^(?:i'm|im|i am)\s+heading\s+to\s+(.+)$/i,
        /^(?:i'm|im|i am)\s+going\s+to\s+(.+)$/i,
        /^(?:i'm|im|i am)\s+on\s+my\s+way\s+to\s+(.+)$/i,
        /^on\s+my\s+way\s+to\s+(.+)$/i,
        /^off\s+to\s+(.+)$/i,
        /^headed\s+to\s+(.+)$/i,
        /^heading\s+to\s+(.+)$/i,
        /^going\s+to\s+(.+)$/i,
        /^(?:leaving|leave)\s+for\s+(.+)$/i,
        /^travell?ing\s+to\s+(.+)$/i
    ];

    for (const pattern of destinationPatterns) {
        const match =
            normalizedText.match(pattern);

        if (match?.[1]) {
            return match[1]
                .replace(/[.?!]+$/g, "")
                .trim();
        }
    }

    return "";
}

function getRouteNormalizedQuestion(question) {

    return String(question || "")
        .toLowerCase()
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201B\u2032\u02BC\uFF07\u0060\u00B4]/g, "'")
        .replace(/[â€™â€˜]/g, "'")
        .trim()
        .replace(/[?.!,]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

async function askOurFlow() {

    const question =
        document.getElementById("questionInput").value.trim();

    if (isWeatherQuestion(question)) {
        showWeatherCard();
        return;
    }

    const normalizedQuestion =
        getRouteNormalizedQuestion(question);

    const looksLikeAddress =

        /^\d+/.test(question) &&

        (
            question.includes(",") ||
            question.toLowerCase().includes("ca") ||
            question.toLowerCase().includes("california")
        );

    const questionInfo = analyzeUserQuestion(question);

    const journeyStartIntent =
        detectJourneyStartIntent(question);

    const journeyDestination =
        journeyStartIntent?.destination || "";

    const journeyPurpose =
        journeyStartIntent?.purpose || "";

    const isJourneyDestinationInput =
        Boolean(journeyDestination) ||
        looksLikeAddress;

    const hadActiveJourneyAtQuestionStart =
        Boolean(activeJourney);

    if (
        activeJourney &&
        typeof isReturnIntent === "function" &&
        isReturnIntent(question)
    ) {

        showActiveJourneyRecoveryCard();

        return;
    }

    if (activeJourney && questionInfo.travelMode !== "unknown") {
        activeJourney.travelMode = questionInfo.travelMode;
    }

    // ========================================
    // PHOTO MEMORY PROCESSING
    // ========================================

    if (
        activeJourney &&
        pendingPhotoMemory &&
        activeJourney.photos &&
        activeJourney.photos.length > 0
    ) {

        // REVIEW:
        // lastPhoto may be unused

        const lastPhoto =
            activeJourney.photos[activeJourney.photos.length - 1];

        pendingPhotoClassification = question;

        pendingPhotoMemory = false;

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        showActiveJourneyBox("photos");

        // REVIEW:
        // May be redundant.
        // User already receives card feedback below.

        alert("Destination saved successfully");

        // ========================================
        // PHOTO CLASSIFICATION UI
        // ========================================

        document.getElementById("result").innerHTML = `
<div class="card">

<strong>📷 Photo Memory</strong>

<br><br>

${question}

<br><br>

How should I save this?

<br><br>

<button onclick="savePhotoClassification('parking')">
🚗 Parking
</button>

<br><br>

<button onclick="savePhotoClassification('start')">
🧭 Start Location
</button>

<br><br>

<button onclick="savePhotoClassification('both')">
🚗 + 🧭 Both
</button>

<br><br>

<button onclick="savePhotoClassification('note')">
📝 Photo Note Only
</button>

</div>
`;
        document.getElementById("questionInput").value = "";

        return;
    }

    // ========================================
    // JOURNEY CREATION / START JOURNEY
    // ========================================

    // CLEANUP:
    // Replace repeated question.toLowerCase()
    // with lowerQuestion

    if (
        !activeJourney &&
        isJourneyDestinationInput
    ) {


        // ========================================
        // BLANK JOURNEY CREATION
        // ========================================
        activeJourney = {

            destination:
                "Untitled Journey",

            destinationName: "",

            journeyPurpose: "",

            destinationAddress: "",

            destinationDetail: "",

            currentLocation: "",

            travelMode: "",

            journeyStatus: "traveling",

            notes: [],

            photos: [],

            questionsForDoctor: [],

            staffInstructions: [],

            medications: [],

            appointments: [],

            directories: [],

            startTime:
                new Date().toLocaleString(),

            startLocation: "",

            startLocationAddress: "",

            verifiedDestinationAddress: "",

            parkingLocation: "",

            parkingLocationAddress: "",

            arrivalTips: "",

            mapLink: "",

            answers: [],

            timeline: [],

            endLocation: "",

            endTime: ""
        };
    }

    if (!question) {
        alert("Ask OurFlow a question first 🧭");
        return;
    }

    // ========================================
    // QUESTION VALIDATION
    // ========================================

    const result = document.getElementById("result");

    result.innerHTML = `
    <div class="card">
        <strong>🧭 OurFlow</strong><br><br>
        Looking into that...
    </div>
    `;

    // ========================================
    // LOADING UI
    // ========================================

    try {

        addConversationHistoryEntry(question);

        // ========================================
        // MAIN PROCESSING
        // ========================================

        // REVIEW:
        // Possible duplicate Journey Creation logic.
        // Compare with earlier !activeJourney block.

        if (
            isJourneyDestinationInput
        ) {

            if (
                hadActiveJourneyAtQuestionStart &&
                journeyStartIntent &&
                hasMeaningfulActiveJourneyDestination(activeJourney)
            ) {
                window.pendingActiveJourneyDestination = {
                    destination:
                        journeyStartIntent.destination,
                    purpose:
                        journeyStartIntent.purpose || "",
                    travelMode:
                        journeyStartIntent.travelMode || ""
                };

                result.innerHTML = `
<div class="card">
    <strong>🧭 Journey Already Active</strong>

    <br><br>

    You already have an active journey.

    <br><br>

    New destination detected:
    ${journeyStartIntent.destination}

    <br><br>

    <button onclick="continueCurrentJourneyWithDetectedDestination()">
        Continue Current Journey
    </button>

    <br><br>

    <button onclick="requestEndJourney()">
        End Current Journey
    </button>
</div>
`;
                return;
            }

            resetJourneySessionContext();

            let destination =
                journeyDestination || question.trim();

            const destinationPurpose =
                journeyPurpose;
            // ========================================
            // DESTINATION JOURNEY CREATION
            // ========================================
            if (!activeJourney) {
                activeJourney = {

                    destination:
                        destination,

                    originalDestinationRequest:
                        journeyStartIntent
                            ? destination
                            : "",

                    journeyPurpose:
                        destinationPurpose,

                    destinationAddress:
                        looksLikeAddress ? destination : "",

                    verifiedDestinationAddress:
                        looksLikeAddress ? destination : "",

                    destinationDetail:
                        destination,

                    currentLocation: "",

                    travelMode: "",

                    journeyStatus: "traveling",

                    notes: [],

                    photos: [],

                    questionsForDoctor: [],

                    staffInstructions: [],

                    medications: [],

                    appointments: [],

                    directories: [],

                    startTime:
                        new Date().toLocaleString(),

                    startLocation:
                        "",

                    startLocationAddress:
                        "",

                    parkingLocation:
                        "",

                    parkingLocationAddress:
                        "",

                    arrivalTips: "",

                    mapLink: "",

                    answers: [],

                    timeline: [],

                    endLocation:
                        "",

                    endTime:
                        ""
                };

                markActiveJourneyContext("new");
            } else {
                activeJourney.destination =
                    destination;

                activeJourney.originalDestinationRequest =
                    activeJourney.originalDestinationRequest ||
                    (
                        journeyStartIntent
                            ? destination
                            : ""
                    );

                if (destinationPurpose) {
                    activeJourney.journeyPurpose =
                        destinationPurpose;
                }

                activeJourney.destinationDetail =
                    destination;

                if (looksLikeAddress) {
                    activeJourney.destinationAddress =
                        destination;

                    activeJourney.verifiedDestinationAddress =
                        destination;
                }

                activeJourney.journeyStatus =
                    "traveling";

                activeJourney.notes =
                    activeJourney.notes || [];

                activeJourney.photos =
                    activeJourney.photos || [];

                activeJourney.questionsForDoctor =
                    activeJourney.questionsForDoctor || [];

                activeJourney.staffInstructions =
                    activeJourney.staffInstructions || [];

                activeJourney.medications =
                    activeJourney.medications || [];

                activeJourney.appointments =
                    activeJourney.appointments || [];

                activeJourney.directories =
                    activeJourney.directories || [];

                activeJourney.answers =
                    activeJourney.answers || [];

                activeJourney.timeline =
                    activeJourney.timeline || [];

                activeJourney.startTime =
                    activeJourney.startTime ||
                    new Date().toLocaleString();
            }

            if (journeyStartIntent?.travelMode) {
                activeJourney.travelMode =
                    journeyStartIntent.travelMode;
            }

            addConversationHistoryEntry(question);

            activeJourney.timeline.push(
                "🧭 Journey Started: " +
                destination
            );

            localStorage.setItem(
                "activeJourney",
                JSON.stringify(activeJourney)
            );

            showActiveJourneyBox();

            await getArrivalHelp(destination);

            result.innerHTML = "";

            return;

        }

        // ========================================
        // ARRIVAL DETECTION
        // ========================================

        // CLEANUP:
        // Could reuse lowerQuestion instead of
        // creating another lowercase variable.

        const endQuestion =
            question.toLowerCase().trim();

        if (
            activeJourney &&
            isArrivalIntent(endQuestion)
        ) {

            activeJourney.journeyStatus = "arrived";

            showArrivalMode();

            return;
        }

        // ========================================
        // END JOURNEY DETECTION
        // ========================================

        // CLEANUP:
        // Reuses endQuestion.
        // Good candidate for lowerQuestion.

        if (
            endQuestion === "end journey" ||
            endQuestion.includes("all set") ||
            endQuestion.includes("finished") ||
            endQuestion.includes("that's all") ||
            endQuestion.includes("thats all") ||
            endQuestion.includes("no thanks")
        ) {

            /* END JOURNEY BLOCK HERE */

            // ========================================
            // END JOURNEY PROCESSING
            // ========================================

            if (!activeJourney) {

                result.innerHTML = `
        <div class="card">
            <strong>🧭 OurFlow</strong><br><br>
            No active journey to end.
        </div>
        `;

                return;
            }

            requestEndJourney();

            return;

            activeJourney.endTime =
                new Date().toLocaleString();

            localStorage.setItem(
                "activeJourney",
                JSON.stringify(activeJourney)
            );

            // CLEANUP:
            // Duration calculation could become
            // a helper function later.

            const start = new Date(activeJourney.startTime);
            const end = new Date(activeJourney.endTime);

            const minutes =
                Math.round((end - start) / 60000);

            activeJourney.duration = minutes;


            activeJourney.timeline.push(
                "🧭 Journey Ended: " +
                activeJourney.destination
            );

            // CLEANUP:
            // Large recap card.
            // Candidate for showJourneyRecap().

            result.innerHTML = `
<div class="card">
    <strong>🧭 Journey Recap</strong>

    <br><br>

    Destination:
    ${activeJourney.destination}

    <br><br>

    ❓ Questions:
    ${activeJourney.questionsForDoctor?.length || 0}

    <br><br>

    📝 Notes:
    ${activeJourney.notes?.length || 0}

    <br><br>

    💊 Medications:
    ${activeJourney.medications?.length || 0}

    <br><br>

    📅 Appointments:
    ${activeJourney.appointments?.length || 0}

    <br><br>

    👩‍⚕️ Instructions:
    ${activeJourney.staffInstructions?.length || 0}

    <br><br>

    🏢 Directories:
    ${activeJourney.directories?.length || 0}

    <br><br>

    ⏱ Duration:
    ${activeJourney.duration} minute(s)

    <br><br>

    📌 Total Events:
    ${activeJourney.timeline?.length || 0}

    <br><br>

    You captured ${activeJourney.timeline?.length || 0} important moments during this journey.

<br><br>

Take a moment to review everything before saving.

<br><br>

Ready to save?

    <br><br>

    Use 💾 Save Journey to store this trip.
</div>
`;

            return;
        }

        // ========================================
        // QUESTION CLASSIFICATION
        // ========================================

        const lowerQuestion =
            question
                .toLowerCase()
                .replace(/[’‘]/g, "'");

        const routeDebug = {
            rawInput: question,
            normalizedInput: lowerQuestion,
            isInstructionPhrase:
                typeof isInstructionPhrase === "function"
                    ? isInstructionPhrase(lowerQuestion)
                    : "missing",
            aiFallbackReached: false
        };

        // CLEANUP:
        // Preferred lowercase variable.
        // Other sections should eventually use this.

        // ========================================
        // UTILITY QUESTION DETECTION
        // ========================================

        const isUtilityQuestion =

            (
                lowerQuestion.startsWith("where's ") ||
                lowerQuestion.startsWith("where is ") ||
                lowerQuestion.startsWith("wheres ") ||

                lowerQuestion.includes("closest ") ||
                lowerQuestion.includes("nearest ") ||
                lowerQuestion.includes("near me") ||

                lowerQuestion.includes("starbucks") ||
                lowerQuestion.includes("wells fargo") ||
                lowerQuestion.includes("coffee") ||
                lowerQuestion.includes("restaurant") ||
                lowerQuestion.includes("gas station") ||
                lowerQuestion.includes("hotel") ||

                isAppointmentRecall(lowerQuestion)

                ||

                (
                    lowerQuestion.includes("hospital")
                    &&
                    !lowerQuestion.includes("appointment")
                    &&
                    !lowerQuestion.startsWith("start journey")
                    &&
                    !lowerQuestion.startsWith("start a journey")
                    &&
                    !lowerQuestion.startsWith("starting journey")
                    &&
                    !lowerQuestion.startsWith("starting a journey")
                )
            )

            &&

            !lowerQuestion.includes("my ride")
            && !lowerQuestion.includes("my bike")
            && !lowerQuestion.includes("my car");

        // ========================================
        // MEMORY COMMAND DETECTION
        // ========================================

        // CLEANUP:
        // Largest detection block in file.
        // Candidate for arrays:
        // rideTerms
        // parkingTerms
        // memoryCommands
        // confirmationTerms

        // REVIEW:
        // Convert to grouped arrays later.
        // No behavior changes during cleanup.

        const isMemoryCommand =

            // SAVE PHRASES

            isAppointmentPhrase(lowerQuestion) ||

            isInstructionPhrase(lowerQuestion) ||

            (
                typeof isNavigationCluePhrase === "function" &&
                isNavigationCluePhrase(lowerQuestion)
            ) ||

            (
                typeof isInsideDestinationDetailPhrase === "function" &&
                isInsideDestinationDetailPhrase(lowerQuestion)
            ) ||

            isNotePhrase(lowerQuestion) ||

            isMedicationPhrase(lowerQuestion) ||

            isQuestionPhrase(lowerQuestion) ||

            (
                typeof isPersonContactDirectoryPhrase === "function" &&
                isPersonContactDirectoryPhrase(lowerQuestion)
            ) ||

            // EXPLICIT SAVE COMMANDS

            lowerQuestion.startsWith("save appointment:") ||

            lowerQuestion.startsWith("save instruction:") ||

            lowerQuestion.startsWith("save note:") ||

            lowerQuestion.startsWith("save directory:") ||

            lowerQuestion.startsWith("save question:") ||

            lowerQuestion.startsWith("save medication:") ||

            // RECALL COMMANDS

            isAppointmentRecall(lowerQuestion) ||

            isInstructionRecall(lowerQuestion) ||

            isNoteRecall(lowerQuestion) ||

            isQuestionRecall(lowerQuestion) ||

            isMedicationRecall(lowerQuestion) ||

            isDirectoryRecall(lowerQuestion) ||

            isJourneySummaryRecall(lowerQuestion) ||

            isParkingRecall(lowerQuestion) ||

            isRecoveryIntent(lowerQuestion) ||

            // PARKING MEMORY

            isParkingMemoryCommand(lowerQuestion);

        const createdParkingJourneyForMemory =
            !activeJourney &&
            isParkingMemoryCommand(lowerQuestion);

        if (createdParkingJourneyForMemory) {

            activeJourney = {

                destination: "Untitled Journey",

                destinationName: "",
                destinationAddress: "",
                destinationDetail: "",

                currentLocation: "",
                travelMode: "",

                journeyStatus: "traveling",

                notes: [],
                photos: [],
                questionsForDoctor: [],
                staffInstructions: [],
                medications: [],
                appointments: [],
                directories: [],

                startTime:
                    new Date().toLocaleString(),

                startLocation: "",
                startLocationAddress: "",
                parkingLocation: "",
                parkingLocationAddress: "",
                parkingVerified: false,

                arrivalTips: "",
                mapLink: "",

                answers: [],
                timeline: [],

                endLocation: "",
                endTime: ""
            };

            markActiveJourneyContext("new");

            const parkingEventText =
                typeof getStartingLocationDescriptionForDisplay === "function"
                    ? getStartingLocationDescriptionForDisplay(question)
                    : "";

            const fallbackParkingEventText =
                typeof getParkingDescriptionForDisplay === "function"
                    ? getParkingDescriptionForDisplay(question)
                    : question;

            activeJourney.timeline.push(
                "\uD83D\uDE97 Parking Saved: " +
                (parkingEventText || fallbackParkingEventText)
            );

            showActiveJourneyBox("journeyLocations");
        }

        // ========================================
        // DIRECTORY ENTRY DETECTION
        // ========================================

        if (activeJourney) {

            const isDirectoryEntry =
                isDirectoryPhrase(lowerQuestion) &&
                !isQuestionPhrase(lowerQuestion);

            // ========================================
            // AUTOMATIC QUESTION CAPTURE
            // ========================================

            if (
                !isMemoryCommand &&
                !isUtilityQuestion &&
                !isDirectoryEntry &&
                isQuestionPhrase(lowerQuestion) &&
                !lowerQuestion.includes("appointment")
            ) {

                activeJourney.questionsForDoctor.push(question);
            }
        }

        // ========================================
        // DESTINATION AUTO-DETECTION
        // ========================================

        // CLEANUP:
        // Candidate for detectDestination()

        if (
            activeJourney &&
            activeJourney.destination === "Untitled Journey"
        ) {

            const teaMatch =
                question.match(/tea bar/i);

            const chicoMatch =
                question.match(/chico state/i);

            const anthroMatch =
                question.match(/anthropology|anthro lab|anthro|anthro\. dep/i);

            const hospitalMatch =
                question.match(/hospital|hematology|enloe|emergency room|er/i);

            if (teaMatch) {
                activeJourney.destination = "Tea Bar";
                activeJourney.destinationAddress = "Tea Bar";
            }

            if (chicoMatch) {
                activeJourney.destination = "Chico State";
                activeJourney.destinationAddress = "Chico State";
            }

            if (anthroMatch) {
                activeJourney.destination =
                    "Anthropology Lab";

                activeJourney.destinationAddress =
                    "Anthropology Lab";
            }

            if (hospitalMatch) {
                activeJourney.destination =
                    "Hospital Visit";

                activeJourney.destinationAddress =
                    "Hospital Visit";
            }

        }

        // ========================================
        // MEMORY PROCESSING SETUP
        // ========================================

        const recallQuestion =
            question
                .toLowerCase()
                .replace(/[’‘]/g, "'")
                .replace(/[?.!,]/g, "")
                .trim();

        // CLEANUP:
        // Could reuse lowerQuestion

        // FUTURE REFACTOR:
        // Replace noteQuestion with lowerQuestion

        const noteQuestion = lowerQuestion;

        const isGeneralNoteEntry =
            typeof isGeneralNoteObservation === "function" &&
            isGeneralNoteObservation(noteQuestion) &&
            !questionInfo.mentionsParking &&
            !isParkingMemoryCommand(noteQuestion) &&
            !isAppointmentPhrase(noteQuestion) &&
            !(
                typeof isNavigationCluePhrase === "function" &&
                isNavigationCluePhrase(noteQuestion)
            ) &&
            !(
                typeof isInsideDestinationDetailPhrase === "function" &&
                isInsideDestinationDetailPhrase(noteQuestion)
            ) &&
            !isInstructionPhrase(noteQuestion) &&
            !isMedicationPhrase(noteQuestion) &&
            !isQuestionPhrase(noteQuestion) &&
            !isRecoveryIntent(noteQuestion) &&
            !isAppointmentRecall(noteQuestion) &&
            !isInstructionRecall(noteQuestion) &&
            !isNoteRecall(noteQuestion) &&
            !isQuestionRecall(noteQuestion) &&
            !isMedicationRecall(noteQuestion) &&
            !isDirectoryRecall(noteQuestion) &&
            !isJourneySummaryRecall(noteQuestion) &&
            !isParkingRecall(noteQuestion) &&
            !isStartLocationRecall(noteQuestion);

        const looksLikeMemoryEntry =
            noteQuestion.startsWith("i'm meeting") ||
            noteQuestion.startsWith("im meeting") ||
            noteQuestion.startsWith("i am meeting") ||

            isNotePhrase(noteQuestion) ||

            isGeneralNoteEntry ||

            isAppointmentPhrase(noteQuestion) ||

            isInstructionPhrase(noteQuestion) ||

            (
                typeof isNavigationCluePhrase === "function" &&
                isNavigationCluePhrase(noteQuestion)
            ) ||

            (
                typeof isInsideDestinationDetailPhrase === "function" &&
                isInsideDestinationDetailPhrase(noteQuestion)
            ) ||

            isMedicationPhrase(noteQuestion) ||

            (
                typeof isPersonContactDirectoryPhrase === "function" &&
                isPersonContactDirectoryPhrase(noteQuestion)
            ) ||

            isDirectoryPhrase(noteQuestion) ||

            isQuestionPhrase(noteQuestion) ||

            noteQuestion.startsWith("ask about ") ||
            noteQuestion.startsWith("ask doctor about ");

        if (
            !activeJourney &&
            looksLikeMemoryEntry &&
            !isRejectedJourneyStartActionPhrase(question)
        ) {

            activeJourney = {

                destination: "Untitled Journey",

                destinationName: "",
                destinationAddress: "",
                destinationDetail: "",

                currentLocation: "",
                travelMode: "",

                journeyStatus: "traveling",

                notes: [],
                photos: [],
                questionsForDoctor: [],
                staffInstructions: [],
                medications: [],
                appointments: [],
                directories: [],

                startTime:
                    new Date().toLocaleString(),

                startLocation: "",
                parkingLocation: "",

                arrivalTips: "",
                mapLink: "",

                answers: [],
                timeline: [],

                endLocation: "",
                endTime: ""
            };

            markActiveJourneyContext("new");

            activeJourney.timeline.push(
                "🧭 Journey Started: Auto-Created"
            );

            showActiveJourneyBox();
        }

        // ========================================
        // DESTINATION DETAIL SAVE
        // ========================================

        // REVIEW:
        // This may be related to the
        // "office / room / floor" bug.

        if (
            activeJourney &&
            !questionInfo.mentionsParking &&

            !noteQuestion.startsWith("find ") &&
            !noteQuestion.startsWith("search ") &&
            !noteQuestion.includes("department") &&
            !noteQuestion.includes("directory") &&

            !noteQuestion.startsWith("save medication:") &&
            !noteQuestion.startsWith("save appointment:") &&
            !noteQuestion.startsWith("save instruction:") &&
            !noteQuestion.startsWith("save note:") &&
            !noteQuestion.startsWith("save question:") &&
            !noteQuestion.startsWith("save directory:") &&

            (
                noteQuestion.includes("exact location") ||
                noteQuestion.includes("the address is") ||
                noteQuestion.includes("address is") ||
                noteQuestion.includes("this is the address") ||
                noteQuestion.includes("enter at") ||
                noteQuestion.includes("located at") ||
                question.match(/^\d+\s/)
            )
        ) {

            const cleanDestination =
                question
                    .replace(/navigate to\s*/i, "")
                    .replace(/take me to\s*/i, "")
                    .replace(/directions to\s*/i, "")
                    .replace(/go to\s*/i, "")
                    .replace(/head to\s*/i, "")
                    .replace(/headed to\s*/i, "")
                    .trim();

            activeJourney.destinationName =
                cleanDestination;

            const cleanDestinationLooksLikeAddress =
                /^\d+/.test(cleanDestination) &&
                (
                    cleanDestination.includes(",") ||
                    cleanDestination.toLowerCase().includes("ca") ||
                    cleanDestination.toLowerCase().includes("california")
                );

            if (cleanDestinationLooksLikeAddress) {
                activeJourney.destinationAddress =
                    cleanDestination;
            }

            activeJourney.destinationDetail =
                cleanDestination;

            activeJourney.timeline.push(
                "📍 Destination Saved: " +
                cleanDestination
            );

            showActiveJourneyBox("destination");

            result.innerHTML = `
<div class="card">
    <strong>📍 Location Detail Saved</strong>

    <br><br>

    ${cleanDestination}

    <br><br>

    I'll remember this as part of the destination details.

    <br><br>

<button onclick="openGoogleMapsToDestinationDetails('walking')">
    🚶 Walk There
</button>

<br><br>

<button onclick="openGoogleMapsToDestinationDetails('bicycling')">
    🚴 Bike There
</button>

<br><br>

<button onclick="openGoogleMapsToDestinationDetails('driving')">
    🚗 Drive There
</button>
</div>
`;

            return;
        }

        // ========================================
        // QUESTION SAVE
        // ========================================        

        if (
            activeJourney &&
            typeof isPersonContactDirectoryPhrase === "function" &&
            isPersonContactDirectoryPhrase(noteQuestion)
        ) {

            if (
                activeJourney.directories.includes(question)
            ) {

                result.innerHTML = `
<div class="card">
    <strong>🏢 Directory Already Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I already have that people or place detail.
</div>
`;

                return;
            }

            saveJourneyItem(
                "directories",
                question,
                "🏢 Directory Saved: "
            );

            result.innerHTML = `
<div class="card">
    <strong>🏢 People &amp; Place Detail Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I'll remember this for the journey.
</div>
`;

            return;
        }





        if (
            activeJourney &&
            (
                isQuestionPhrase(noteQuestion)
            )
        ) {

            saveJourneyItem(
                "questionsForDoctor",
                question,
                "❓ Question Saved: "
            );


            result.innerHTML = `
<div class="card">
    <strong>❓ Question Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        // ========================================
        // MEDICATION SAVE
        // ========================================


        if (
            activeJourney &&
            (
                isMedicationPhrase(noteQuestion)
            )
        ) {

            saveJourneyItem(
                "medications",
                question,
                "💊 Medication Saved: "
            );


            result.innerHTML = `
<div class="card">
    <strong>💊 Medication Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        // ========================================
        // DESTINATION NAVIGATION CLUE SAVE
        // ========================================

        if (
            activeJourney &&
            typeof isNavigationCluePhrase === "function" &&
            isNavigationCluePhrase(noteQuestion)
        ) {
            saveNavigationClueToDestinationGuidance(
                question
            );

            result.innerHTML = `
<div class="card">
    <strong>Destination Guidance Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I'll remember this for arrival and inside-destination guidance.
</div>
`;

            return;
        }

        // ========================================
        // STRUCTURED INSIDE DESTINATION DETAIL SAVE
        // ========================================

        if (
            activeJourney &&
            typeof isInsideDestinationDetailPhrase === "function" &&
            isInsideDestinationDetailPhrase(noteQuestion)
        ) {
            saveStructuredInsideDestinationDetail(
                question
            );

            result.innerHTML = `
<div class="card">
    <strong>Inside Destination Details Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I'll remember this as part of the destination details.
</div>
`;

            return;
        }

        // ========================================
        // MEDICAL FOLLOW-UP INSTRUCTION SAVE
        // ========================================

        // CLEANUP:
        // Candidate for saveMedication()

        // CLEANUP:
        // Candidate for saveInstruction()


        if (
            activeJourney &&
            (
                noteQuestion.startsWith("follow up in ") ||
                noteQuestion.startsWith("return in ") ||
                noteQuestion.startsWith("schedule another ") ||
                noteQuestion.startsWith("monitor ") ||
                noteQuestion.startsWith("continue ")

                || noteQuestion.startsWith("follow-up in ")
                || noteQuestion.startsWith("follow up with ")
                || noteQuestion.startsWith("return for ")
                || noteQuestion.startsWith("come back in ")
                || noteQuestion.startsWith("check back in ")
                || noteQuestion.startsWith("call if ")
                || noteQuestion.startsWith("contact us if ")
            )
        ) {
            saveJourneyItem(
                "staffInstructions",
                question,
                "👩‍⚕️ Instruction Saved: "
            );


            result.innerHTML = `
<div class="card">
    <strong>👩‍⚕️ Instruction Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        // ========================================
        // GENERAL INSTRUCTION SAVE
        // ========================================

        // REVIEW:
        // Earlier cleanup removed
        // remember to
        // don't forget
        // from this block.
        // Those now route to Instructions.

        if (
            activeJourney &&
            (
                isNotePhrase(noteQuestion) ||
                isGeneralNoteEntry
            )
        ) {
            // ========================================
            // NOTE SAVE HANDLER
            // FUTURE REFACTOR:
            // Candidate for saveJourneyItem()
            // ========================================
            saveJourneyItem(
                "notes",
                question,
                "📝 Note Saved: "
            );

            result.innerHTML = `
<div class="card">
    <strong>📝 Note Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        // ========================================
        // MANUAL NOTE SAVE
        // ========================================

        if (
            activeJourney &&
            noteQuestion.startsWith("save note:")
        ) {

            const note = question
                .replace(/save note:/i, "")
                .trim();
            // ========================================
            // NOTE SAVE HANDLER
            // FUTURE REFACTOR:
            // Candidate for saveJourneyItem()
            // ========================================
            saveJourneyItem(
                "notes",
                note,
                "📝 Note Saved: "
            );

            result.innerHTML = `
<div class="card">
    <strong>📝 Note Saved</strong>

    <br><br>

    ${note}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        // ========================================
        // QUESTION DETECTION & SAVE
        // ========================================

        // ========================================
        // MANUAL MEDICATION SAVE
        // ========================================

        if (
            activeJourney &&
            (
                noteQuestion.startsWith("save question:") ||

                (
                    isQuestionWord(noteQuestion) &&
                    !isAppointmentRecall(noteQuestion) &&
                    !isInstructionRecall(noteQuestion) &&
                    !isDirectoryRecall(noteQuestion) &&
                    !isNoteRecall(noteQuestion) &&
                    !isMedicationRecall(noteQuestion) &&
                    !isQuestionRecall(noteQuestion) &&
                    !isParkingRecall(noteQuestion) &&
                    !isStartLocationRecall(noteQuestion)
                )
            )
        ) {


            const doctorQuestion = question
                .replace(/save question:/i, "")
                .trim();

            activeJourney.questionsForDoctor.push(
                doctorQuestion
            );

            activeJourney.timeline.push(
                "❓ Question Saved: " +
                doctorQuestion
            );

            showActiveJourneyBox("questions");

            result.innerHTML = `
<div class="card">
    <strong>❓ Question Saved</strong>

    <br><br>

    ${doctorQuestion}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        // ========================================
        // MANUAL DIRECTORY SAVE
        // ========================================

        if (
            activeJourney &&
            noteQuestion.startsWith("save medication:")
        ) {

            const medication = question
                .replace(/save medication:/i, "")
                .trim();

            activeJourney.medications.push(
                medication
            );

            activeJourney.timeline.push(
                "💊 Medication Saved: " +
                medication
            );

            showActiveJourneyBox("medications");

            result.innerHTML = `
<div class="card">
    <strong>💊 Medication Saved</strong>

    <br><br>

    ${medication}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        // REVIEW:
        // Manual Save Section
        // save note:
        // save question:
        // save medication:
        // save directory:

        if (
            activeJourney &&
            noteQuestion.startsWith("save directory:")
        ) {

            const directory = question
                .replace(/save directory:/i, "")
                .trim();

            activeJourney.directories.push(directory);

            activeJourney.timeline.push(
                "🏢 Directory Saved: " +
                directory
            );

            showActiveJourneyBox("peoplePlace");

            result.innerHTML = `
<div class="card">
    <strong>🏢 Directory Saved</strong>

    <br><br>

    ${directory}

    <br><br>

    I'll remember this directory for the journey.
</div>
`;

            return;
        }

        // ========================================
        // APPOINTMENT SAVE
        // ========================================

        // REVIEW:
        // Earlier duplicate appointment block removed.
        // This is now the primary appointment handler.

        if (
            activeJourney &&
            !isAppointmentRecall(noteQuestion) &&
            (
                noteQuestion.startsWith("save appointment:") ||

                noteQuestion.startsWith("i have an appointment") ||
                noteQuestion.startsWith("my appointment") ||
                noteQuestion.startsWith("appointment at") ||
                noteQuestion.startsWith("meeting with") ||

                noteQuestion.includes("meeting") ||
                noteQuestion.includes("appointment")
            )
        ) {



            const appointment = question
                .replace(/save appointment:/i, "")
                .trim();
            // ========================================
            // APPOINTMENT SAVE HANDLER
            // FUTURE REFACTOR:
            // Candidate for saveJourneyItem()
            // ========================================
            saveJourneyItem(
                "appointments",
                appointment,
                "📅 Appointment Saved: "
            );

            result.innerHTML = `
<div class="card">
    <strong>📅 Appointment Saved</strong>

    <br><br>

    ${appointment}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        // ========================================
        // GENERAL INSTRUCTION SAVE
        // ========================================

        // REVIEW:
        // Handles:
        // remember to
        // don't forget
        // make sure to
        // be sure to

        if (
            activeJourney &&
            (
                noteQuestion.startsWith("save instruction:") ||
                isInstructionPhrase(noteQuestion)
            )
        ) {

            const instruction = question
                .replace(/save instruction:/i, "")
                .trim();

            // ========================================
            // INSTRUCTION SAVE HANDLER
            // FUTURE REFACTOR:
            // Candidate for saveJourneyItem()
            // ========================================
            saveJourneyItem(
                "staffInstructions",
                instruction,
                "👩‍⚕️ Instruction Saved: "
            );

            result.innerHTML = `
<div class="card">
    <strong>👩‍⚕️ Instruction Saved</strong>

    <br><br>

    ${instruction}

    <br><br>

    I'll remember that for this journey.

    ${getRouteDebugHtml(routeDebug)}
</div>
`;

            return;
        }

        // ========================================
        // START LOCATION SAVE
        // ========================================

        if (
            activeJourney &&
            noteQuestion.startsWith("save start location:")
        ) {

            const startLocation = question
                .replace(/save start location:/i, "")
                .trim();

            const cleanStartLocation =
                typeof getStartingLocationDescriptionForDisplay === "function"
                    ? getStartingLocationDescriptionForDisplay(startLocation) ||
                    startLocation
                    : startLocation;

            activeJourney.startLocation =
                cleanStartLocation;

            activeJourney.timeline.push(
                "🧭 Starting Location Saved: " +
                cleanStartLocation
            );

            showActiveJourneyBox("journeyLocations");

            result.innerHTML = `
<div class="card">
    <strong>🧭 Start Location Saved</strong>

    <br><br>

    ${cleanStartLocation}

    <br><br>

    I'll remember where you started.
</div>
`;

            return;
        }

        // ========================================
        // MEMORY RECALL
        // ========================================

        if (
            activeJourney &&
            isDirectoryRecall(noteQuestion)
        ) {

            if (!activeJourney.directories || activeJourney.directories.length === 0) {

                result.innerHTML = `
<div class="card">
    <strong>🏢 Directories</strong>

    <br><br>

    No directories saved for this journey yet.
</div>
`;

                return;
            }

            // CLEANUP:
            // Candidate for buildListHtml()

            showJourneyList(
                "🏢 Saved Directory Information",
                activeJourney.directories
            );

            return;
        }

        // ========================================
        // SHOW DIRECTORIES
        // ========================================

        if (
            activeJourney &&
            isNoteRecall(noteQuestion)
        ) {

            if (activeJourney.notes.length === 0) {

                result.innerHTML = `
<div class="card">
    <strong>📝 Notes</strong>

    <br><br>

    No notes saved for this journey yet.
</div>
`;

                return;
            }

            // CLEANUP:
            // Candidate for buildListHtml()

            // CLEANUP:
            // Same pattern as directories.

            showJourneyList(
                "📝 Notes",
                activeJourney.notes
            );

            return;
        }

        // ========================================
        // SHOW QUESTIONS
        // ========================================

        if (
            activeJourney &&
            isQuestionRecall(noteQuestion)
        ) {

            if (activeJourney.questionsForDoctor.length === 0) {

                result.innerHTML = `
<div class="card">
    <strong>❓ Saved Questions</strong>

    <br><br>

    No saved questions for this journey yet.
</div>
`;

                return;
            }

            // CLEANUP:
            // Same pattern as Show Notes
            // and Show Directories.

            showJourneyList(
                "❓ Questions",
                activeJourney.questionsForDoctor
            );

            return;
        }

        // ========================================
        // SHOW MEDICATIONS
        // ========================================

        if (
            activeJourney &&
            isMedicationRecall(noteQuestion)
        ) {

            if (activeJourney.medications.length === 0) {

                result.innerHTML = `
<div class="card">
    <strong>💊 Medications</strong>

    <br><br>

    No medications saved for this journey yet.
</div>
`;

                return;
            }

            // CLEANUP:
            // Same pattern as Show Questions.


            showJourneyList(
                "💊 Medications",
                activeJourney.medications
            );

            return;
        }

        // ========================================
        // SHOW APPOINTMENTS
        // ========================================

        if (
            activeJourney &&
            isAppointmentRecall(noteQuestion)
        ) {

            if (activeJourney.appointments.length === 0) {

                result.innerHTML = `
<div class="card">
    <strong>📅 Appointments</strong>

    <br><br>

    No appointments saved for this journey yet.
</div>
`;

                return;
            }

            // CLEANUP:
            // Same pattern as Notes,
            // Questions, Medications.

            showJourneyList(
                "📅 Appointments",
                activeJourney.appointments
            );

            return;
        }

        // ========================================
        // SHOW INSTRUCTIONS
        // ========================================

        if (
            activeJourney &&
            isInstructionRecall(noteQuestion)
        ) {


            if (activeJourney.staffInstructions.length === 0) {

                result.innerHTML = `
<div class="card">
    <strong>👩‍⚕️ Instructions</strong>

    <br><br>

    No instructions saved for this journey yet.
</div>
`;

                return;
            }
            // CLEANUP:
            // Same pattern as Appointments.

            showJourneyList(
                "👩‍⚕️ Instructions",
                activeJourney.staffInstructions
            );

            return;
        }

        if (
            activeJourney &&
            isJourneySummaryRecall(noteQuestion)
        ) {

            showQuickJourneySummary();

            return;
        }

        // ========================================
        // JOURNEY RECOVERY
        // ========================================

        if (
            isRecoveryIntent(recallQuestion)
        ) {

            showRecoveryChoices();

            return;
        }

        // ========================================
        // ARRIVAL RECALL SHORTCUTS
        // ========================================
        if (

            isArrivalIntent(recallQuestion)

        ) {

            showArrivalMode();

            return;
        }

        if (
            activeJourney &&
            isInsideDestinationRecall(recallQuestion)
        ) {

            showInsideDestinationRecall(recallQuestion);

            return;
        }
        // ========================================
        // DIRECT RETURN NAVIGATION COMMANDS
        // ========================================

        if (recallQuestion === "return to parking") {
            openGoogleMapsToParkingLocation();
            return;
        }

        if (recallQuestion === "return to start") {
            openGoogleMapsToStartLocation();
            return;
        }

        // ========================================
        // PARKING & VEHICLE RECALL
        // ========================================

        // CLEANUP:
        // Large recall block.
        // Candidate for parkingRecallTerms[]

        if (
            isParkingRecall(recallQuestion)
        ) {

            showParkingRecall();

            return;
        }

        // ========================================
        // RETURN TO START LOCATION
        // ========================================

        // CLEANUP:
        // Candidate for navigationRecallTerms[]

        if (
            recallQuestion.includes("take me back") ||
            recallQuestion.includes("go back") ||
            recallQuestion.includes("return me") ||
            recallQuestion.includes("get back there") ||
            recallQuestion.includes("help me get back") ||
            recallQuestion.includes("get me back") ||

            isStartLocationRecall(recallQuestion)
        ) {

            // ========================================
            // RETURN TO START LOCATION
            // ========================================

            // CLEANUP:
            // Similar pattern to Parking Recall.
            // Candidate for showLocationCard().

            if (activeJourney?.startLocation) {

                result.innerHTML = `
<div class="card">
    <strong>🧭 Starting Location</strong>

    <br><br>

    You started at:

    <br><br>

    ${activeJourney.startLocation}

    <br><br>

<button onclick="openGoogleMapsToStartLocation()">
    🧭 Return To Start
</button>

<br><br>

Can I help you get back there?
</div>
`;

                return;
            }

            result.innerHTML = `
<div class="card">
    <strong>🧭 Starting Location</strong>

    <br><br>

    I don't have a starting location recorded for this journey.
</div>
`;

            return;
        }
        // ========================================
        // AUTOMATIC DIRECTORY DETECTION
        // ========================================

        // REVIEW:
        // May need expansion:
        // office
        // room
        // suite
        // floor
        // building
        if (
            activeJourney &&

            !question.includes("?") &&

            !noteQuestion.startsWith("can ") &&
            !noteQuestion.startsWith("where ") &&
            !noteQuestion.startsWith("find ") &&
            !noteQuestion.startsWith("search ") &&
            !noteQuestion.startsWith("help me find") &&
            !noteQuestion.startsWith("take me to") &&
            !noteQuestion.startsWith("navigate to") &&
            !noteQuestion.startsWith("directions to") &&
            !noteQuestion.startsWith("go to") &&
            !noteQuestion.startsWith("head to") &&
            !noteQuestion.startsWith("headed to") &&

            (
                isDirectoryPhrase(noteQuestion) &&
                !isQuestionPhrase(noteQuestion)
            )
        ) {

            if (
                activeJourney.directories.includes(question)
            ) {

                result.innerHTML = `
<div class="card">
    <strong>🏢 Directory Already Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I already have that directory information.
</div>
`;

                return;
            }

            saveJourneyItem(
                "directories",
                question,
                "🏢 Directory Saved: "
            );

            result.innerHTML = `
<div class="card">
    <strong>🏢 Directory Info Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I'll remember this for finding the right office or department.
</div>
`;

            return;
        }
        // ========================================
        // PARKING LOCATION DETECTION
        // ========================================

        // CLEANUP:
        // Could reuse lowerQuestion
        // instead of parkingQuestion.

        // REVIEW:
        // Duplicate checks found:
        // i parked
        // my car is parked
        // my vehicle is parked

        const parkingQuestion = lowerQuestion;

        if (
            isParkingMemoryCommand(parkingQuestion)
        ) {
            // ========================================
            // LOCATION CLASSIFICATION
            // ========================================

            // CLEANUP:
            // Long replace chain.
            // Candidate for cleanLocationText()

            const hasBusinessLandmark =
                parkingQuestion.includes(" at ") ||
                parkingQuestion.includes("by ") ||
                parkingQuestion.includes("near ") ||
                parkingQuestion.includes("next to ") ||
                parkingQuestion.includes("across from ");

            const hasParkingDescription =
                parkingQuestion.includes("parking lot") ||
                parkingQuestion.includes("southwest") ||
                parkingQuestion.includes("northwest") ||
                parkingQuestion.includes("southeast") ||
                parkingQuestion.includes("northeast") ||
                parkingQuestion.includes("level") ||
                parkingQuestion.includes("row") ||
                parkingQuestion.includes("elevator") ||
                parkingQuestion.includes("stairs") ||
                parkingQuestion.includes("parking structure");

            if (activeJourney) {
                showParkingMemoryReview(question);
                return;
            }

            if (
                activeJourney &&
                !createdParkingJourneyForMemory &&
                false &&
                hasBusinessLandmark &&
                !hasParkingDescription
            ) {
                pendingLocationClassification = question
                    .replace(/start journey\s*/i, "")
                    .replace(/i'?m parked near\s*/i, "")
                    .replace(/i'?m parked at\s*/i, "")
                    .replace(/i parked near\s*/i, "")
                    .replace(/i parked at\s*/i, "")
                    .replace(/parked by\s*/i, "")
                    .replace(/i'?m parked by\s*/i, "")
                    .replace(/my car is at\s*/i, "")
                    .replace(/my ride is at\s*/i, "")
                    .replace(/my ride is near\s*/i, "")
                    .replace(/i'?m at\s*/i, "")
                    .replace(/i'?m by\s*/i, "")
                    .replace(/i'?m near\s*/i, "")
                    .replace(/i'?m\s*/i, "")
                    .replace(/i am at\s*/i, "")
                    .replace(/i am near\s*/i, "")
                    .replace(/i am by\s*/i, "")

                    .replace(/this is where i parked\s*/i, "")
                    .replace(/this is my parking location\s*/i, "")
                    .replace(/this is where my car is\s*/i, "")

                    .trim();


                result.innerHTML = `
<div class="card">
    <strong>📍 Location Found</strong>

    <br><br>

    Should I remember this as?

    <br><br>

    <button onclick="saveLocationType('parking')">
        🚗 Parking
    </button>

    <br><br>

    <button onclick="saveLocationType('start')">
        🧭 Start
    </button>

    <br><br>

    <button onclick="saveLocationType('both')">
        🚗🧭 Both
    </button>
</div>
`;

                return;
            }
        }

        // ========================================
        // DESTINATION UPDATE DETECTION
        // ========================================

        // CLEANUP:
        // Could reuse lowerQuestion
        // instead of destinationUpdate.

        const destinationUpdate =
            lowerQuestion;

        if (
            activeJourney &&
            (
                destinationUpdate.includes("i'm going here") ||
                destinationUpdate.includes("im going here") ||
                destinationUpdate.includes("the address is") ||
                destinationUpdate.includes("it says") ||
                destinationUpdate.includes("this is the address") ||
                destinationUpdate.includes("found the address") ||
                destinationUpdate.includes("i found the address") ||
                destinationUpdate.includes("located at") ||
                destinationUpdate.includes("265 cohasset") ||
                destinationUpdate.includes("here it is") ||
                destinationUpdate.includes("cohasset rd")

            )
        ) {
            activeJourney.destination = question;

            activeJourney.answers.push(
                "Destination updated."
            );

            result.innerHTML = `
<div class="card">
    <strong>🧭 Destination Updated</strong>
    <br><br>
    I saved this as your journey destination:
    <br><br>
    ${activeJourney.destination}
    <br><br>
    I can use this for the rest of your journey.
</div>
`;

            return;
        }

        // ========================================
        // SEARCH & NAVIGATION REQUESTS
        // ========================================

        // CLEANUP:
        // Could reuse lowerQuestion
        // instead of navigationSearch.

        // FUTURE REFACTOR:
        // Replace with lowerQuestion

        const navigationSearch =
            lowerQuestion;

        const normalizedNavigationSearch =
            navigationSearch.replace(/[’‘]/g, "'");

        const isCurrentLocationStatement =
            normalizedNavigationSearch.startsWith("i'm at ") ||
            normalizedNavigationSearch.startsWith("im at ") ||
            normalizedNavigationSearch.startsWith("i am at ") ||
            normalizedNavigationSearch.startsWith("i'm near ") ||
            normalizedNavigationSearch.startsWith("im near ") ||
            normalizedNavigationSearch.startsWith("i am near ") ||
            normalizedNavigationSearch.startsWith("i'm by ") ||
            normalizedNavigationSearch.startsWith("im by ") ||
            normalizedNavigationSearch.startsWith("i am by ");

        const looksLikeDestinationClue =
            activeJourney &&
            !questionInfo.mentionsParking &&
            !isCurrentLocationStatement &&
            question.includes(",") &&
            (
                navigationSearch.includes(" on ") ||
                navigationSearch.includes(" in ") ||
                navigationSearch.includes(" at ")
            ) &&
            (
                navigationSearch.includes("chico") ||
                navigationSearch.includes(" ca") ||
                navigationSearch.includes("california")
            );

        if (
            (
                navigationSearch.includes("directions") ||
                navigationSearch.includes("route") ||
                navigationSearch.includes("fastest route") ||
                navigationSearch.includes("walking to") ||
                navigationSearch.includes("walk to") ||
                navigationSearch.includes("drive to") ||
                navigationSearch.includes("driving to") ||
                navigationSearch.includes("ride to") ||
                navigationSearch.includes("bike to") ||
                navigationSearch.includes("navigate to") ||

                navigationSearch.includes("search for") ||
                navigationSearch.includes("search the") ||
                navigationSearch.startsWith("search ") ||
                navigationSearch.includes("look up") ||
                navigationSearch.includes("find the") ||
                navigationSearch.includes("find ") ||
                navigationSearch.includes("directory") ||
                navigationSearch.includes("office") ||

                navigationSearch.includes("go to") ||
                navigationSearch.includes("get to") ||
                navigationSearch.includes("head to") ||
                navigationSearch.includes("travel to") ||
                navigationSearch.includes("on my way to") ||
                navigationSearch.includes("how do i get to") ||
                navigationSearch.includes("take me to") ||
                looksLikeDestinationClue
            )

            &&

            !navigationSearch.includes("take me to my ride")

        ) {

            // ========================================
            // SEARCH QUERY CLEANUP
            // ========================================

            const cleanedSearch =
                looksLikeDestinationClue
                    ? question.trim()
                    : question
                        .replace(
                            /^(search the|search for|search|directory for|i need to get to|i need to go to|i need directions to|how do i get to|help me get to|take me to|go to|find)\s+/i,
                            ""
                        )
                        .trim();

            if (
                activeJourney &&
                cleanedSearch
            ) {
                const normalizedCleanedSearch =
                    cleanedSearch.toLowerCase();

                const existingDestination =
                    (activeJourney.destination || "")
                        .toLowerCase();

                const existingDestinationDetail =
                    (activeJourney.destinationDetail || "")
                        .toLowerCase();

                if (
                    normalizedCleanedSearch !== existingDestination &&
                    normalizedCleanedSearch !== existingDestinationDetail
                ) {
                    activeJourney.destinationAddress =
                        "";

                    activeJourney.verifiedDestinationAddress =
                        "";
                }

                activeJourney.destination =
                    cleanedSearch;

                activeJourney.destinationDetail =
                    cleanedSearch;

                localStorage.setItem(
                    "activeJourney",
                    JSON.stringify(activeJourney)
                );
            }

            // ========================================
            // INFORMATION SEARCH DETECTION
            // ========================================

            // REVIEW:
            // Hospital directory searches:
            // hematology
            // radiology
            // oncology
            // admissions
            // financial aid

            const isInformationSearch =

                navigationSearch.includes("search") ||
                navigationSearch.includes("look up") ||
                navigationSearch.includes("directory") ||
                navigationSearch.includes("office") ||
                navigationSearch.includes("hematology") ||
                navigationSearch.includes("radiology") ||
                navigationSearch.includes("oncology") ||
                navigationSearch.includes("financial aid") ||
                navigationSearch.includes("admissions");

            const placeResponse = await fetch("/api/searchPlace", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query: cleanedSearch
                })
            });

            const placeData = await placeResponse.json();


            if (isInformationSearch) {

                const searchResponse =
                    await fetch(
                        "/api/searchDestinationInfo",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                destination:
                                    activeJourney?.destination || "",
                                question
                            })
                        }
                    );

                const searchData =
                    await searchResponse.json();
                // CLEANUP:
                // Duplicate search cleanup logic.
                // Similar to cleanedSearch above.

                pendingDestinationSearch =
                    question
                        .replace(
                            /^(search the|search for|search|directory for|go to|find)\s+/i,
                            ""
                        )
                        .trim();

                // ========================================
                // INFORMATION SEARCH UI
                // ========================================

                result.innerHTML = `
<div class="card">
    <strong>🔍 Information Search</strong>

    <br><br>

    Search prepared for:

    <br><br>

   ${question}

<br><br>

<strong>Search Domain:</strong>

<br>

${searchData.searchDomain || "No domain found"}

<br><br>

<a
href="https://www.google.com/search?q=${encodeURIComponent(
                    `site:${searchData.searchDomain} ${question}`
                )}"
target="_blank">

    🔍 Search ${activeJourney?.destination || "Site"}

</a>

<br><br>

<button onclick="
const address = prompt(
'Paste the verified address you found:'
);

if (address) {
    saveVerifiedDestinationAddress(address);
}
">
    📍 Save Verified Address
</button>

<br><br>


After you find the building, office, or department,
copy the full address and paste it here.

Example:

Anthropology Lab
Butte Hall
400 W 1st St
Chico, CA
</div>
`;

                return;
            }
            // ========================================
            // VERIFIED MAP SEARCH
            // ========================================
            if (
                questionInfo.mentionsParking
            ) {
                pendingParkingLocation = question;
            }

            if (
                activeJourney &&
                cleanedSearch &&
                !questionInfo.mentionsParking
            ) {
                const savedDestinationAddress =
                    activeJourney.verifiedDestinationAddress ||
                    activeJourney.destinationAddress;

                if (savedDestinationAddress) {
                    result.innerHTML = `
<div class="card">
    <strong>Navigation Available</strong>

    <br><br>

    <strong>Verified Destination</strong>

    <br><br>

    ${savedDestinationAddress}

    <br><br>

    <button onclick="openGoogleMapsToDestinationDetails()">
        Open Google Maps
    </button>
</div>
`;
                    return;
                }

                result.innerHTML = `
<div class="card">
    <strong>📍 Destination Saved</strong>

    <br><br>

    ${cleanedSearch}

    <br><br>

    <strong>Address not verified yet</strong>

    <br><br>

    <button onclick="verifySavedLocation()">
        📍 Verify Address
    </button>

    <br><br>

    <a href="${placeData.mapUrl}" target="_blank">
        Open Map Search
    </a>

    <br><br>

    <button onclick="
const address = prompt(
'Paste the verified address:'
);

if (address) {
    saveVerifiedDestinationAddress(address);
}
">
        ✏ Enter Address Manually
    </button>
</div>
`;
                return;
            }

            result.innerHTML = `
<div class="card">
    <strong>🧭 Verified Map Search</strong>

    ${pendingParkingLocation
                    ? `
            <br><br>
<strong>📍 Parking location detected.</strong>

<br><br>

<button onclick="verifyParkingLocation()">
    🚗 Verify Parking Address
</button>

<br><br>

<button onclick="savePendingParking()">
    📍 Save Parking As Entered
</button>
            `
                    : ""
                }

    <br><br>
    I should not guess exact directions without verified map data.
    <br><br>
    Open this map search:
    <br><br>
    <a href="${placeData.mapUrl}" target="_blank">
        Search Google Maps
    </a>
    <br><br>
    After you open it, come back and tell me what you see.
</div>
`;
            return;
        }
        // ========================================
        // DESTINATION NAVIGATION SHORTCUT
        // ========================================
        if (
            activeJourney?.destinationAddress &&
            (
                lowerQuestion.includes("how do i get") ||
                lowerQuestion.includes("directions") ||
                lowerQuestion.includes("navigate") ||
                lowerQuestion.includes("take me there") ||
                lowerQuestion.includes("route to")
            )
        ) {

            result.innerHTML = `
<div class="card">
    <strong>🧭 Navigation Available</strong>

    <br><br>

    Destination:

    <br><br>

    ${activeJourney.destinationAddress}

    <br><br>

    <button onclick="openGoogleMapsToDestinationDetails()">
        🧭 Open Google Maps
    </button>
</div>
`;

            return;
        }

        // ========================================
        // DESCRIPTIVE PARKING MEMORY STOP
        // ========================================

        if (
            activeJourney &&
            isParkingMemoryCommand(lowerQuestion)
        ) {
            const hasBusinessLandmark =
                lowerQuestion.includes(" at ") ||
                lowerQuestion.includes("by ") ||
                lowerQuestion.includes("near ") ||
                lowerQuestion.includes("next to ") ||
                lowerQuestion.includes("across from ");

            const hasParkingDescription =
                lowerQuestion.includes("parking lot") ||
                lowerQuestion.includes("southwest") ||
                lowerQuestion.includes("northwest") ||
                lowerQuestion.includes("southeast") ||
                lowerQuestion.includes("northeast") ||
                lowerQuestion.includes("level") ||
                lowerQuestion.includes("row") ||
                lowerQuestion.includes("elevator") ||
                lowerQuestion.includes("stairs") ||
                lowerQuestion.includes("parking structure");

            if (
                true
            ) {
                showParkingMemoryReview(question);

                return;
            }
        }

        // ========================================
        // JOURNEY LOCATION INTAKE
        // ========================================

        const locationIntakeCandidate =
            detectLocationIntake(question);

        if (locationIntakeCandidate) {
            showLocationIntakeCard(locationIntakeCandidate);
            return;
        }

        // ========================================
        // AI FALLBACK RESPONSE
        // ========================================

        routeDebug.aiFallbackReached = true;

        const response = await fetch("/api/askOurFlow", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                buildOurFlowPayload(question)
            )
        });

        const data = await response.json();
        // ========================================
        // ANSWER HISTORY STORAGE
        // ========================================
        if (
            activeJourney &&
            !isMemoryCommand &&
            !isUtilityQuestion
        ) {

            activeJourney.answers.push(data.answer);
        }

        result.innerHTML = `
<div class="card">
    <strong>🧭 OurFlow</strong><br><br>
    ${data.answer}

    ${getRouteDebugHtml(routeDebug)}
</div>
`;
        // ========================================
        // ERROR HANDLING
        // ========================================
    } catch (error) {

        console.error(error);

        result.innerHTML = `
<div class="card">
    <strong>🧭 OurFlow</strong><br><br>
    Error contacting OurFlow.
</div>
`;
    }
}

