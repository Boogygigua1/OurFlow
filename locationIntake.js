function getBlankLocationIntakeJourney(destination) {

    return {
        destination: destination || "Untitled Journey",
        destinationName: "",
        destinationAddress: "",
        destinationDetail: destination || "",
        currentLocation: "",
        travelMode: "",
        journeyStatus: "planning",
        notes: [],
        photos: [],
        questionsForDoctor: [],
        staffInstructions: [],
        medications: [],
        appointments: [],
        directories: [],
        startTime: new Date().toLocaleString(),
        startLocation: "",
        startLocationAddress: "",
        verifiedDestinationAddress: "",
        parkingLocation: "",
        parkingLocationAddress: "",
        parkingVerified: false,
        startVerified: false,
        arrivalTips: "",
        mapLink: "",
        answers: [],
        timeline: [],
        endLocation: "",
        endTime: ""
    };
}

function ensureLocationIntakeJourney(destination) {

    if (!activeJourney) {
        activeJourney =
            getBlankLocationIntakeJourney(destination);

        markActiveJourneyContext("new");
    }

    if (!activeJourney.timeline) {
        activeJourney.timeline = [];
    }
}

function getPendingLocationIntake() {

    return window.pendingLocationIntakeCandidate || null;
}

function escapeLocationIntakeHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function detectLocationIntake(question) {

    const originalText =
        String(question || "").trim();

    if (!originalText) {
        return null;
    }

    const lowerText =
        originalText
            .toLowerCase()
            .replace(/[’‘]/g, "'");

    const parkingIntent =
        typeof isParkingMemoryCommand === "function" &&
        isParkingMemoryCommand(lowerText);

    if (parkingIntent) {
        return null;
    }

    const streetAddressPattern =
        /\b\d{1,6}\s+[a-z0-9.'-]+(?:\s+[a-z0-9.'-]+){0,5}\s+(street|st|road|rd|avenue|ave|way|drive|dr|lane|ln|court|ct|boulevard|blvd|place|pl|circle|cir|terrace|ter|highway|hwy)\b/i;

    const hasStreetAddress =
        streetAddressPattern.test(originalText);

    const locationPrefixes = [
        "i'm at ",
        "im at ",
        "i am at ",
        "i'm near ",
        "im near ",
        "i am near ",
        "i'm by ",
        "im by ",
        "i am by ",
        "i'm behind ",
        "im behind ",
        "i am behind ",
        "near ",
        "behind ",
        "on the street",
        "i found ",
        "this is "
    ];

    const matchedPrefix =
        locationPrefixes.find(prefix =>
            lowerText.startsWith(prefix)
        );

    let locationText =
        originalText;

    if (matchedPrefix) {
        const relationPrefix =
            (
                matchedPrefix.includes("near ") ||
                matchedPrefix.includes("behind ") ||
                matchedPrefix.includes("by ") ||
                matchedPrefix === "on the street"
            )
                ? matchedPrefix
                    .replace(/^i'?m\s+/i, "")
                    .replace(/^im\s+/i, "")
                    .replace(/^i am\s+/i, "")
                    .trim()
                : "";

        locationText =
            relationPrefix
                ? (
                    relationPrefix === "on the street"
                        ? originalText
                        : relationPrefix + " " +
                        originalText.slice(matchedPrefix.length).trim()
                )
                : originalText.slice(matchedPrefix.length).trim();
    }

    locationText =
        locationText.replace(/[.?!]+$/g, "").trim();

    const hasLocationContext =
        locationText.includes(",") ||
        /\b(chico|california|ca)\b/i.test(locationText) ||
        /\b(hotel|clinic|hospital|office|building|restaurant|store|entrance|address)\b/i.test(locationText);

    const hasEnoughPlaceWords =
        locationText.split(/\s+/).filter(Boolean).length >= 2;

    if (
        !hasStreetAddress &&
        !(
            matchedPrefix &&
            (hasLocationContext || hasEnoughPlaceWords)
        )
    ) {
        return null;
    }

    return {
        originalText,
        locationText,
        confidence: hasStreetAddress ? "address" : "place",
        reason: hasStreetAddress ? "street_address" : "location_statement"
    };
}

function showLocationIntakeCard(candidate) {

    window.pendingLocationIntakeCandidate =
        candidate;

    const result =
        document.getElementById("result");

    const displayLocation =
        escapeLocationIntakeHtml(candidate.locationText)
            .replace(/,\s*/g, "<br>");

    const parkingLabel =
        activeJourney?.parkingLocation ||
            activeJourney?.parkingDescription ||
            activeJourney?.parkingLocationAddress
            ? "Replace Parking?"
            : "Yes, Save Parking";

    const startLabel =
        activeJourney?.startLocation ||
            activeJourney?.startLocationAddress
            ? "Replace Starting Location?"
            : "Yes, Save Starting Location";

    result.innerHTML = `
<div class="card">
    <strong>&#128205; Location Found</strong>

    <br><br>

    You said:

    <br><br>

    "${displayLocation}"

    <br><br>

    What would you like me to save?

    <br><br>

    <button onclick="saveLocationIntakeAsParking()">
        &#128663; ${parkingLabel}
    </button>

    <br><br>

    <button onclick="saveLocationIntakeAsStart()">
        &#129517; ${startLabel}
    </button>

    <br><br>

    <button onclick="saveLocationIntakeAsParkingAndStart()">
        &#128260; Yes, Save Both
    </button>

    <br><br>

    <button onclick="dismissLocationIntakeCandidate()">
        &#10060; Not a Location
    </button>

    <br><br>

    <button onclick="continueLocationIntakeWithAI()">
        Continue with Ask OurFlow
    </button>
</div>
`;
}

function dismissLocationIntakeCandidate() {

    window.pendingLocationIntakeCandidate = null;

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Location Not Saved</strong>

    <br><br>

    Nothing was saved as a location.
</div>
`;
}

function startJourneyFromLocationIntake() {

    const candidate =
        getPendingLocationIntake();

    if (!candidate) return;

    resetJourneySessionContext();

    activeJourney =
        getBlankLocationIntakeJourney(candidate.locationText);

    markActiveJourneyContext("new");

    if (candidate.confidence === "address") {
        activeJourney.destinationAddress =
            candidate.locationText;
    }

    activeJourney.timeline.push(
        "Journey Started From Location: " +
        candidate.locationText
    );

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    window.pendingLocationIntakeCandidate = null;

    showActiveJourneyBox();

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Journey Started</strong>

    <br><br>

    ${escapeLocationIntakeHtml(candidate.locationText)}

    <br><br>

    Address not verified yet.
</div>
`;
}

function saveLocationIntakeAsDestination() {

    const candidate =
        getPendingLocationIntake();

    if (!candidate) return;

    ensureLocationIntakeJourney(candidate.locationText);

    activeJourney.destination =
        candidate.locationText;

    activeJourney.destinationDetail =
        candidate.locationText;

    if (candidate.confidence === "address") {
        activeJourney.destinationAddress =
            candidate.locationText;
    }

    activeJourney.timeline.push(
        "Destination Saved From Location: " +
        candidate.locationText
    );

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    window.pendingLocationIntakeCandidate = null;

    showActiveJourneyBox();

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Destination Saved</strong>

    <br><br>

    ${escapeLocationIntakeHtml(candidate.locationText)}

    <br><br>

    Address not verified yet.
</div>
`;
}

function saveLocationIntakeAsStart() {

    const candidate =
        getPendingLocationIntake();

    if (!candidate) return;

    ensureLocationIntakeJourney();

    const isVerifiedAddress =
        candidate.confidence === "address";

    activeJourney.startLocation =
        candidate.locationText;

    if (isVerifiedAddress) {
        activeJourney.startLocationAddress =
            candidate.locationText;
    } else {
        activeJourney.startLocationAddress = "";
    }

    activeJourney.startVerified =
        isVerifiedAddress;

    activeJourney.timeline.push(
        "Starting Location Saved From Location: " +
        candidate.locationText
    );

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    window.pendingLocationIntakeCandidate = null;

    showActiveJourneyBox();

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Starting Location Saved</strong>

    <br><br>

    ${escapeLocationIntakeHtml(candidate.locationText)}

    <br><br>

    ${isVerifiedAddress
            ? "Verified address saved."
            : "Saved as a description. Address verification is optional."}
</div>
`;
}

function saveLocationIntakeAsParking() {

    const candidate =
        getPendingLocationIntake();

    if (!candidate) return;

    ensureLocationIntakeJourney();

    pendingParkingLocation =
        candidate.locationText;

    pendingParkingLocationAddress =
        candidate.confidence === "address"
            ? candidate.locationText
            : "";

    pendingLocationType = "";

    window.pendingLocationIntakeCandidate = null;

    savePendingParking();
}

function saveLocationIntakeAsParkingAndStart() {

    const candidate =
        getPendingLocationIntake();

    if (!candidate) return;

    ensureLocationIntakeJourney();

    pendingParkingLocation =
        candidate.locationText;

    pendingParkingLocationAddress =
        candidate.confidence === "address"
            ? candidate.locationText
            : "";

    pendingLocationType =
        "both";

    window.pendingLocationIntakeCandidate = null;

    savePendingParking();
}

async function continueLocationIntakeWithAI() {

    const candidate =
        getPendingLocationIntake();

    if (!candidate) return;

    window.pendingLocationIntakeCandidate = null;

    const result =
        document.getElementById("result");

    result.innerHTML = `
<div class="card">
    <strong>OurFlow</strong><br><br>
    Looking into that...
</div>
`;

    const response = await fetch("/api/askOurFlow", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(
            buildOurFlowPayload(
                candidate.originalText,
                {
                    injectJourneyContext: true
                }
            )
        )
    });

    const data =
        await response.json();

    result.innerHTML = `
<div class="card">
    <strong>OurFlow</strong><br><br>
    ${data.answer}
</div>
`;
}
