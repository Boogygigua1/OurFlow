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
        locationText =
            originalText.slice(matchedPrefix.length).trim();
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

    result.innerHTML = `
<div class="card">
    <strong>I found a location:</strong>

    <br><br>

    ${displayLocation}

    <br><br>

    What would you like to do?

    <br><br>

    <button onclick="startJourneyFromLocationIntake()">
        &#129517; Start Journey
    </button>

    <br><br>

    <button onclick="saveLocationIntakeAsDestination()">
        &#128205; Save as Destination
    </button>

    <br><br>

    <button onclick="saveLocationIntakeAsStart()">
        &#128681; Save as Starting Location
    </button>

    <br><br>

    <button onclick="saveLocationIntakeAsParking()">
        &#128663; Save as Parking
    </button>

    <br><br>

    <button onclick="continueLocationIntakeWithAI()">
        Continue with AI
    </button>
</div>
`;
}

function startJourneyFromLocationIntake() {

    const candidate =
        getPendingLocationIntake();

    if (!candidate) return;

    activeJourney =
        getBlankLocationIntakeJourney(candidate.locationText);

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

    activeJourney.startLocation =
        candidate.locationText;

    if (candidate.confidence === "address") {
        activeJourney.startLocationAddress =
            candidate.locationText;
    }

    activeJourney.startVerified = false;

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

    Address not verified yet.
</div>
`;
}

function saveLocationIntakeAsParking() {

    const candidate =
        getPendingLocationIntake();

    if (!candidate) return;

    ensureLocationIntakeJourney();

    activeJourney.parkingLocation =
        candidate.locationText;

    if (candidate.confidence === "address") {
        activeJourney.parkingLocationAddress =
            candidate.locationText;
    }

    activeJourney.parkingVerified = false;

    activeJourney.timeline.push(
        "Parking Saved From Location: " +
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
    <strong>Parking Saved</strong>

    <br><br>

    ${escapeLocationIntakeHtml(candidate.locationText)}

    <br><br>

    Address not verified yet.
</div>
`;
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
        body: JSON.stringify({
            question: candidate.originalText,
            history: conversationHistory.slice(-20),
            destination: activeJourney?.destination || "",
            destinationAddress: activeJourney?.destinationAddress || "",
            parkingLocation: activeJourney?.parkingLocation || "",
            arrivalTips: activeJourney?.arrivalTips || "",
            startLocation: activeJourney?.startLocation || "",
            journeyStatus: activeJourney?.journeyStatus || "",
            landmarkImageData
        })
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
