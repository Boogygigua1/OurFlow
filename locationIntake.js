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

function getLocationIntakeVerifiedAddress(candidate) {

    if (!candidate) {
        return "";
    }

    return candidate.verifiedAddress ||
        (
            candidate.confidence === "address"
                ? candidate.locationText
                : ""
        );
}

function getLocationIntakeText(candidate) {

    return candidate?.locationText ||
        pendingParkingLocation ||
        "";
}

function showNoVerifiedAddressMessage() {

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>No verified address yet.</strong>

    <br><br>

    Add or verify an address first.
</div>
`;
}

function openLocationConfirmationMap() {

    const candidate =
        getPendingLocationIntake();

    const address =
        getLocationIntakeVerifiedAddress(candidate) ||
        pendingParkingLocationAddress ||
        "";

    if (!address) {
        showNoVerifiedAddressMessage();
        return;
    }

    window.open(
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(address),
        "_blank"
    );
}

function verifyLocationConfirmationAddress() {

    const candidate =
        getPendingLocationIntake();

    pendingParkingLocation =
        getLocationIntakeText(candidate);

    pendingParkingLocationAddress =
        getLocationIntakeVerifiedAddress(candidate);

    verifyParkingLocation();
}

function showVerifiedLocationSaveTargetCard(candidate) {

    window.pendingLocationIntakeCandidate =
        candidate;

    const detectedNote =
        escapeLocationIntakeHtml(
            candidate.originalText ||
            candidate.locationText
        );

    const verifiedAddress =
        escapeLocationIntakeHtml(
            getLocationIntakeVerifiedAddress(candidate)
        ).replace(/,\s*/g, "<br>");

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>&#128205; Address Verified</strong>

    <br><br>

    Detected note:

    <br><br>

    "${detectedNote}"

    <br><br>

    Verified address:

    <br><br>

    ${verifiedAddress}

    <br><br>

    What would you like to save this as?

    <br><br>

    <button onclick="saveLocationIntakeAsParking()">
        &#128663; Save as Parking
    </button>

    <br><br>

    <button onclick="saveLocationIntakeAsStart()">
        &#129517; Save as Starting Location
    </button>

    <br><br>

    <button onclick="saveLocationIntakeAsParkingAndStart()">
        &#128260; Save as Both
    </button>

    <br><br>

    <button onclick="dismissLocationIntakeCandidate()">
        &#10060; Cancel
    </button>
</div>
`;
}

function confirmVerifiedLocationIntakeAddress(address) {

    const candidate =
        getPendingLocationIntake();

    if (!candidate || !address) {
        return false;
    }

    candidate.verifiedAddress =
        address;

    window.pendingLocationIntakeCandidate =
        candidate;

    pendingParkingLocation =
        getLocationIntakeText(candidate);

    pendingParkingLocationAddress =
        address;

    showVerifiedLocationSaveTargetCard(candidate);

    return true;
}

function showLocationConfirmationCard(candidate) {

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

    What would you like me to do?

    <br><br>

    <button onclick="openLocationConfirmationMap()">
        &#128506;&#65039; Open Map
    </button>

    <br><br>

    <button onclick="verifyLocationConfirmationAddress()">
        &#10133; Add / Verify Address
    </button>

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
</div>
`;
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

    const explicitNavigationPattern =
        /\b(take me to|directions to|navigate to|start journey to|how do i get to|route to|go to|get to|head to|travel to|on my way to)\b/i;

    if (explicitNavigationPattern.test(originalText)) {
        return null;
    }

    const movementRoutePattern =
        /\b(turn|turned|take|took|go|walk|walked|head|headed)\s+(left|right|straight)\b/i;

    if (movementRoutePattern.test(originalText)) {
        return {
            originalText,
            locationText: originalText.replace(/[.?!]+$/g, "").trim(),
            confidence: "route_clue",
            reason: "movement_route_clue"
        };
    }

    const streetAddressPattern =
        /\b\d{1,6}\s+[a-z0-9.'-]+(?:\s+[a-z0-9.'-]+){0,5}\s+(street|st|road|rd|avenue|ave|way|drive|dr|lane|ln|court|ct|boulevard|blvd|place|pl|circle|cir|terrace|ter|highway|hwy)\b/i;

    const hasStreetAddress =
        streetAddressPattern.test(originalText);

    const spatialRelationshipPattern =
        /\b(is|are|was|were)\s+(off of|near|behind|next to|across from|to the left of|to the right of|left of|right of|by)\b/i;

    const hasSpatialRelationship =
        spatialRelationshipPattern.test(originalText);

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
        "by ",
        "off of ",
        "next to ",
        "across from ",
        "left of ",
        "right of ",
        "to the left of ",
        "to the right of ",
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
                matchedPrefix.includes("off of ") ||
                matchedPrefix.includes("next to ") ||
                matchedPrefix.includes("across from ") ||
                matchedPrefix.includes("left of ") ||
                matchedPrefix.includes("right of ") ||
                matchedPrefix.includes("to the left of ") ||
                matchedPrefix.includes("to the right of ") ||
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
        /\b(hotel|clinic|hospital|office|building|restaurant|store|entrance|address|park|school|campus|mansion|museum|playground|trail|path|gate|landmark)\b/i.test(locationText);

    const hasEnoughPlaceWords =
        locationText.split(/\s+/).filter(Boolean).length >= 2;

    if (
        !hasStreetAddress &&
        !hasSpatialRelationship &&
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
        reason: hasStreetAddress
            ? "street_address"
            : hasSpatialRelationship
                ? "spatial_relationship"
                : "location_statement"
    };
}

function showLocationIntakeCard(candidate) {

    showLocationConfirmationCard(candidate);
}

function dismissLocationIntakeCandidate() {

    window.pendingLocationIntakeCandidate = null;
    pendingParkingLocation = "";
    pendingParkingLocationAddress = "";
    pendingLocationType = "";

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

    const verifiedAddress =
        getLocationIntakeVerifiedAddress(candidate);

    const isVerifiedAddress =
        Boolean(verifiedAddress);

    activeJourney.startLocation =
        candidate.locationText;

    if (isVerifiedAddress) {
        activeJourney.startLocationAddress =
            verifiedAddress;
        activeJourney.startAddress =
            verifiedAddress;
        activeJourney.verifiedStartAddress =
            verifiedAddress;
    } else {
        activeJourney.startLocationAddress = "";
        activeJourney.startAddress = "";
        activeJourney.verifiedStartAddress = "";
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

    const startNavigationHtml =
        isVerifiedAddress
            ? `
    <br><br>

    <button onclick="openGoogleMapsToStartLocation()">
        Return To Start
    </button>
`
            : "";

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Starting Location Saved</strong>

    <br><br>

    ${escapeLocationIntakeHtml(candidate.locationText)}

    <br><br>

    ${isVerifiedAddress
            ? "Verified address saved."
            : "Saved as a description. Address verification is optional."}
${startNavigationHtml}
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
        getLocationIntakeVerifiedAddress(candidate);

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
        getLocationIntakeVerifiedAddress(candidate);

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
