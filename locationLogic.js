
function analyzeUserQuestion(question) {
    const text = question.toLowerCase();

    return {
        mentionsParking:
            isParkingMemoryCommand(text),

        mentionsStartLocation:
            text.includes("i'm at") ||
            text.includes("im at") ||
            text.includes("i am at") ||
            text.includes("starting at") ||
            text.includes("start location") ||
            text.includes("starting location") ||
            text.includes("i'm by") ||
            text.includes("im by") ||
            text.includes("i am by") ||
            text.includes("i'm near") ||
            text.includes("im near") ||
            text.includes("i am near"),

        asksRoute:
            text.includes("directions") ||
            text.includes("route") ||
            text.includes("fastest route") ||
            text.includes("walking to") ||
            text.includes("walk to") ||
            text.includes("drive to") ||
            text.includes("driving to") ||
            text.includes("ride to") ||
            text.includes("bike to") ||
            text.includes("navigate to") ||
            text.includes("go to") ||
            text.includes("get to") ||
            text.includes("head to") ||
            text.includes("travel to") ||
            text.includes("on my way to") ||
            text.includes("take me to") ||
            text.includes("how do i get to"),

        travelMode:
            text.includes("walking") || text.includes("walk to") ? "walking" :
                text.includes("driving") || text.includes("drive to") ? "driving" :
                    text.includes("bike") || text.includes("ride to") ? "biking/riding" :
                        "unknown"
    };
}

function normalizeParkingDescription(parkingText) {

    return parkingText
        .replace(/[.?!]+$/g, "")
        .replace(/^\s*parking location:\s*/i, "")
        .replace(/^\s*save parking:\s*/i, "")
        .replace(/^\s*my parking is:\s*/i, "")
        .replace(/^\s*i'?m parked\s*/i, "")
        .replace(/^\s*im parked\s*/i, "")
        .replace(/^\s*i am parked\s*/i, "")
        .replace(/^\s*i parked\s*/i, "")
        .replace(/^\s*you'?re parked\s*/i, "")
        .replace(/^\s*you are parked\s*/i, "")
        .replace(/^\s*my car is parked\s*/i, "")
        .replace(/^\s*my car is\s*/i, "")
        .replace(/^\s*my vehicle is parked\s*/i, "")
        .replace(/^\s*my vehicle is\s*/i, "")
        .trim();
}

function getParkingDescriptionForDisplay(parkingText) {

    if (
        String(parkingText || "").trim().toLowerCase() ===
        "current location"
    ) {
        return "Current location";
    }

    const description =
        normalizeParkingDescription(parkingText);

    if (!description) {
        return parkingText;
    }

    return "You're parked " +
        description.replace(/^parked\s+/i, "") +
        ".";
}

function isVagueParkingDescription(parkingText) {

    const text =
        parkingText
            .toLowerCase()
            .replace(/[’‘]/g, "'")
            .trim();

    return (
        text.includes("on the street") ||
        text.includes("street parking") ||
        text.includes("parked on ") ||
        text.includes("near ") ||
        text.includes("behind ") ||
        text.includes("by ") ||
        text.includes("next to ") ||
        text.includes("across from ") ||
        text.includes("parking lot") ||
        text.includes("parking structure") ||
        text.includes("level ") ||
        text.includes("row ") ||
        text.includes("elevator") ||
        text.includes("stairs")
    );
}

function saveLocationType(type) {

    if (!activeJourney ||
        !pendingLocationClassification) {
        return;
    }

    if (!activeJourney.timeline) {
        activeJourney.timeline = [];
    }

    let saveMessage = "";

    if (type === "parking") {

        pendingLocationType = type;

        pendingParkingLocation =
            pendingLocationClassification;

        verifyParkingLocation();

        return;
    }

    if (type === "start") {

        activeJourney.startLocation =
            pendingLocationClassification;

        activeJourney.timeline.push(
            "🧭 Starting Location Saved: " +
            pendingLocationClassification
        );

        saveMessage =
            "Starting location recorded.";
    }

    if (type === "both") {

        pendingLocationType = type;

        pendingParkingLocation =
            pendingLocationClassification;

        verifyParkingLocation();

        return;
    }

    pendingLocationClassification = "";

    showActiveJourneyBox("journeyLocations");

    const hasDestination =
        activeJourney?.verifiedDestinationAddress ||
        activeJourney?.destinationAddress ||
        activeJourney?.destination;

    if (hasDestination) {

        document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📍 Location Saved</strong>

    <br><br>

    ${saveMessage}

    <br><br>

    Ready to navigate to:

    <br><br>

    <strong>
        ${activeJourney.destination}
    </strong>

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

    <br><br>

    <button onclick="verifySavedLocation()">
    ${activeJourney?.verifiedDestinationAddress
                ? "✅ Destination Verified"
                : "📍 Verify Destination"}
</button>

<br><br>

<button onclick="verifyParkingLocation()">
    🚗 Verify Parking Address
</button>
</div>
`;
        return;
    }

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📍 Location Saved</strong>

    <br><br>

    ${saveMessage}

    <br><br>

    Can I help with directions, notes,
    parking reminders, or arrival details?

    <br><br>

    <button onclick="verifySavedLocation()">
    ${activeJourney?.verifiedDestinationAddress
            ? "✅ Destination Verified"
            : "📍 Verify Destination"}
</button>

<br><br>

<button onclick="verifyParkingLocation()">
    🚗 Verify Parking Address
</button>
</div>
`;
}

function continueFromDestinationVerified() {

    showActiveJourneyBox();

    document.getElementById("result").innerHTML = "";

    document.getElementById(
        "questionInput"
    ).focus();
}

function savePendingParking() {
    if (
        !pendingParkingLocation &&
        window.pendingLocationIntakeCandidate
    ) {
        pendingParkingLocation =
            getLocationIntakeText(
                window.pendingLocationIntakeCandidate
            );
    }

    if (
        !pendingParkingLocation &&
        pendingParkingLocationAddress
    ) {
        pendingParkingLocation =
            pendingParkingLocationAddress;
    }

    if (
        !pendingParkingLocation &&
        !pendingParkingLocationAddress
    ) {
        return;
    }

if (!activeJourney) {
    if (typeof ensureLocationIntakeJourney === "function") {
        ensureLocationIntakeJourney("Untitled Journey");
    } else {
        activeJourney = {
            destination: "Untitled Journey",
            destinationName: "",
            destinationAddress: "",
            destinationDetail: "",
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
            startAddress: "",
            startGps: null,
            verifiedStartAddress: "",
            verifiedDestinationAddress: "",
            parkingDescription: "",
            parkingLocation: "",
            parkingLocationAddress: "",
            parkingAddress: "",
            parkingGps: null,
            verifiedParkingAddress: "",
            parkingVerified: false,
            startVerified: false,
            timeline: []
        };
    }
}

if (activeJourney) {

    const parkingDescription =
        getParkingDescriptionForDisplay(
            pendingParkingLocation
        );

    const verifiedParkingAddress =
        String(pendingParkingLocationAddress || "").trim();

    const hasVerifiedParkingAddress =
        Boolean(verifiedParkingAddress);

    const savedParkingText =
        hasVerifiedParkingAddress
            ? verifiedParkingAddress
            : parkingDescription;

    activeJourney.parkingDescription =
        savedParkingText;

    activeJourney.parkingLocation =
        savedParkingText;

    activeJourney.parkingGps =
        pendingParkingGps || null;

    if (hasVerifiedParkingAddress) {
        activeJourney.parkingLocationAddress =
            verifiedParkingAddress;
        activeJourney.parkingAddress =
            verifiedParkingAddress;
        activeJourney.verifiedParkingAddress =
            verifiedParkingAddress;
    } else {
        activeJourney.parkingLocationAddress = "";
        activeJourney.parkingAddress = "";
        activeJourney.verifiedParkingAddress = "";
    }

    activeJourney.parkingVerified =
        hasVerifiedParkingAddress;

    if (
        pendingLocationType === "both" ||
        window.savePhotoAsBoth
    ) {

        activeJourney.startLocation =
            savedParkingText;

        activeJourney.startLocationAddress =
            hasVerifiedParkingAddress
                ? activeJourney.parkingLocationAddress
                : "";
        activeJourney.startAddress =
            activeJourney.startLocationAddress;
        activeJourney.verifiedStartAddress =
            activeJourney.startLocationAddress;

        activeJourney.startGps =
            pendingParkingGps || null;

        activeJourney.startVerified =
            Boolean(activeJourney.startLocationAddress);

        window.savePhotoAsBoth = false;
    }

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    showActiveJourneyBox("journeyLocations");
}

    const savedParkingNavigationHtml =
        activeJourney?.verifiedParkingAddress ||
            activeJourney?.parkingLocationAddress ||
            activeJourney?.parkingAddress ||
            activeJourney?.parkingGps
            ? `
    <button onclick="openGoogleMapsToParkingLocation()">
        🚗 Return To Parking
    </button>

    <br><br>
    `
            : "";

    const savedStartNavigationHtml =
        activeJourney?.verifiedStartAddress ||
            activeJourney?.startLocationAddress ||
            activeJourney?.startAddress ||
            activeJourney?.startGps
            ? `
    <button onclick="openGoogleMapsToStartLocation()">
        Return To Start
    </button>

    <br><br>
    `
            : "";

    pendingParkingLocation = "";
    pendingParkingLocationAddress = "";
    pendingParkingGps = null;
    pendingLocationType = "";

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>🚗 Parking Saved</strong>

    <br><br>

    ${activeJourney?.parkingDescription ||
        activeJourney?.parkingLocation ||
        "Your parking location has been recorded."}

    <br><br>

    ${activeJourney?.parkingVerified
            ? "Verified address saved."
            : `
    <button onclick="verifyParkingLocation()">
        Add / Verify Parking Address
    </button>

    <br><br>
    `}

    ${savedParkingNavigationHtml}

    ${savedStartNavigationHtml}

<button onclick="
showActiveJourneyBox();

document.getElementById(
    'result'
).innerHTML = '';

document.getElementById(
    'questionInput'
).focus();

document.getElementById(
    'questionInput'
).scrollIntoView({
    behavior: 'smooth',
    block: 'center'
});
">
    ⬅ Continue Journey
</button>
</div>
`;
}

async function verifyParkingLocation() {

    const parkingLocation =
        pendingParkingLocation ||
        activeJourney?.parkingDescription ||
        activeJourney?.parkingLocation;

    if (!parkingLocation) {
        alert("No parking location found.");
        return;
    }

    if (!pendingParkingLocation) {
        pendingParkingLocation = parkingLocation;
    }

    if (isVagueParkingDescription(parkingLocation)) {

        window.parkingLookupAddress =
            parkingLocation;

        document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Parking Address Optional</strong>

    <br><br>

    ${parkingLocation}

    <br><br>

    This sounds like a parking note, not a verified street address.

    <br><br>

    <button onclick="savePendingParking()">
        Save Parking Note
    </button>

    <br><br>

    <button onclick="
window.open(
'https://www.google.com/search?q=' +
encodeURIComponent(window.parkingLookupAddress),
'_blank'
);
">
        Look Up Address
    </button>

    <br><br>

    <input
        id="verifiedParkingAddress"
        type="text"
        placeholder="Paste verified parking address here"
        style="width:90%;padding:8px;"
    >

    <br><br>

    <button onclick="
const address =
document.getElementById(
    'verifiedParkingAddress'
).value.trim();

if(address){
    pendingParkingLocationAddress = address;
    if (
        typeof confirmVerifiedLocationIntakeAddress === 'function' &&
        confirmVerifiedLocationIntakeAddress(address)
    ) {
        return;
    }
    savePendingParking();
}
">
        Save Verified Address
    </button>
</div>
`;

        return;
    }

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>🚗 Verifying Parking Location</strong>

    <br><br>

    ${parkingLocation}

    <br><br>

    Please wait...
</div>
`;

    const response = await fetch(
        "/api/findDestinationAddress",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                destination: parkingLocation,
                lookupType: "parking"
            })
        }
    );

    const data = await response.json();

    window.parkingLookupAddress =
        parkingLocation;

    window.suggestedParkingAddress =
        data.suggestion || "";

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📍 Suggested Location</strong>

<br><br>

${data.suggestion || "No suggestion found."}

<br><br>

<strong>
Please verify this is the correct location.
</strong>

<br><br>

<button onclick="
const address =
    window.suggestedParkingAddress || '';

if (address) {
    pendingParkingLocationAddress = address;
}

if (
    address &&
    typeof confirmVerifiedLocationIntakeAddress === 'function' &&
    confirmVerifiedLocationIntakeAddress(address)
) {
    return;
}
savePendingParking();
">
    ✓ Save This Location
</button>

<br><br>

1. If the location looks correct, click ✓ Save This Location.

<br><br>

2. If you want to double-check the address, use 🔍 Look Up Address.

<br><br>

3. If the address is incorrect, use ✏ Enter Address Manually and paste the correct address.

    <br><br>

    <button onclick="
window.open(
'https://www.google.com/search?q=' +
encodeURIComponent(
window.parkingLookupAddress
),
'_blank'
);
">
    🔍 Look Up Address
</button>
    <br><br>

    <input
    id="verifiedParkingAddress"
    type="text"
    placeholder="Paste verified parking address here"
    style="width:90%;padding:8px;"
>

<br><br>

<button onclick="
const address =
document.getElementById(
    'verifiedParkingAddress'
).value.trim();

if(address){

    pendingParkingLocationAddress =
        address;

    if (
        typeof confirmVerifiedLocationIntakeAddress === 'function' &&
        confirmVerifiedLocationIntakeAddress(address)
    ) {
        return;
    }

    savePendingParking();
}
">
    ✓ Save Verified Address
</button>

</div>
`;
}

function saveInformationSearchAsDestination() {

    if (!activeJourney) {
        return;
    }

    activeJourney.destinationDetail =
        pendingDestinationSearch;


    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    showActiveJourneyBox("destination");

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📍 Destination Detail Saved</strong>

    <br><br>

    ${pendingDestinationSearch}

    <br><br>

    I'll use this information for navigation and photo guidance.

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

    pendingDestinationSearch = "";
}

async function verifySavedLocation() {

    const destination =
        activeJourney?.destinationDetail ||
        activeJourney?.destination;

    if (!destination) {
        alert("No destination found.");
        return;
    }
    // const useSuggested = confirm(
    //     "Would you like OurFlow to search for this location?\n\n" +
    //     destination +
    //     "\n\n" +
    //     "Press OK to search.\n" +
    //     "Press Cancel to enter an address manually."
    // );
    //
    // if (!useSuggested) {
    //
    //     const manualAddress = prompt(
    //         "Paste the verified address:"
    //     );
    //
    //     if (!manualAddress) {
    //         return;
    //     }
    //
    //     saveVerifiedDestinationAddress(
    //         manualAddress
    //     );
    //
    //     return;
    // }

    const destinationLookup =
        buildDestinationVerificationLookup(destination);

    window.destinationVerificationSearchQuery =
        destination;

    if (activeJourney) {
        activeJourney.originalDestinationRequest =
            activeJourney.originalDestinationRequest ||
            destination;
    }

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📍 Verify Location</strong>

    <br><br>

    Searching for:

    <br><br>

    <strong>${destination}</strong>

    <br><br>

    Please wait...
</div>
`;

    const response = await fetch(
        "/api/searchDestinationPlace",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                destination:
                    destinationLookup.query,
                originalDestination:
                    destination,
                locationBias:
                    destinationLookup.locationBias
            })
        }
    );

    const data = await response.json();

    const rankedCandidates =
        rankDestinationPlaceCandidates(
            data.candidates || [],
            destination,
            destinationLookup
        );

    window.destinationPlaceCandidates =
        rankedCandidates;

    if (!rankedCandidates.length) {
        showDestinationManualVerificationCard(
            destination,
            data.error
        );
        return;
    }

    const bestMatch =
        rankedCandidates[0];

    const destinationFoundMessage =
        bestMatch.destinationConfidence === "low"
            ? "I couldn't confidently identify your destination."
            : bestMatch.reason;

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📍 Destination Found</strong>

    <br><br>

    You said:

    <br><br>

    <strong>${escapeDestinationPlaceHtml(destination)}</strong>

<br><br>

    <strong>${escapeDestinationPlaceHtml(
        bestMatch.destinationName ||
        "Destination"
    )}</strong>

    <br><br>

    ${escapeDestinationPlaceHtml(
        bestMatch.destinationAddress ||
        "Address not provided"
    )}

    <br><br>

    ${escapeDestinationPlaceHtml(destinationFoundMessage)}

<br><br>

    <button onclick="saveVerifiedDestinationPlace(window.destinationPlaceCandidates[0])">
        ✅ Use This Destination
    </button>

    <br><br>

    <button onclick="openDestinationGooglePlacesSearch()">
        🔍 Search Google Places
    </button>

    ${bestMatch.googleMapsUri
        ? `
    <br><br>

    <button onclick="window.open(window.destinationPlaceCandidates[0].googleMapsUri, '_blank')">
        🗺️ Open Map
    </button>
    `
        : ""}

    <br><br>

    <button onclick="showDestinationManualAddressEntryCard()">
        &#9999;&#65039; Enter Correct Address
    </button>
</div>
`;
}

function escapeDestinationPlaceHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function openDestinationGooglePlacesSearch() {

    const query =
        window.destinationVerificationSearchQuery ||
        activeJourney?.destinationDetail ||
        activeJourney?.destination ||
        "";

    if (!query) {
        return;
    }

    window.open(
        "https://www.google.com/search?q=" +
            encodeURIComponent(query),
        "_blank"
    );
}

function getDestinationVerificationTextValues() {

    const activeValues =
        activeJourney
            ? [
                activeJourney.verifiedDestinationAddress,
                activeJourney.destinationAddress,
                activeJourney.verifiedStartAddress,
                activeJourney.startAddress,
                activeJourney.startLocationAddress,
                activeJourney.startLocation,
                activeJourney.verifiedParkingAddress,
                activeJourney.parkingAddress,
                activeJourney.parkingLocationAddress,
                activeJourney.parkingLocation
            ]
            : [];

    const savedValues =
        Array.isArray(savedJourneys)
            ? savedJourneys
                .slice(-3)
                .flatMap(journey => [
                    journey?.verifiedDestinationAddress,
                    journey?.destinationAddress,
                    journey?.verifiedStartAddress,
                    journey?.startAddress,
                    journey?.verifiedParkingAddress,
                    journey?.parkingAddress
                ])
            : [];

    return [
        ...activeValues,
        ...savedValues
    ].filter(value =>
        value &&
        String(value).trim()
    );
}

function getDestinationVerificationGpsValues() {

    const activeValues =
        activeJourney
            ? [
                activeJourney.currentGps,
                activeJourney.startGps,
                activeJourney.parkingGps,
                activeJourney.destinationGps
            ]
            : [];

    const savedValues =
        Array.isArray(savedJourneys)
            ? savedJourneys
                .slice()
                .reverse()
                .flatMap(journey => [
                    journey?.destinationGps,
                    journey?.startGps,
                    journey?.parkingGps
                ])
            : [];

    return [
        ...activeValues,
        ...savedValues
    ];
}

function normalizeDestinationGps(gps) {

    if (!gps) {
        return null;
    }

    const latitude =
        typeof gps.latitude === "number"
            ? gps.latitude
            : gps.lat;

    const longitude =
        typeof gps.longitude === "number"
            ? gps.longitude
            : gps.lng;

    if (
        typeof latitude !== "number" ||
        typeof longitude !== "number"
    ) {
        return null;
    }

    return {
        latitude,
        longitude
    };
}

function extractDestinationCityStateContext(value) {

    const text =
        String(value || "");

    const statePattern =
        "(?:A[LKSZR]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEHINOST]|N[CDEHJMVY]|O[HKR]|P[AWR]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY]|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)";

    const matches = [];

    const commaParts =
        text.split(",")
            .map(part => part.trim())
            .filter(Boolean);

    commaParts.forEach((part, index) => {
        if (index === 0) {
            return;
        }

        const stateMatch =
            part.match(
                new RegExp(
                    "^(" + statePattern + ")\\b",
                    "i"
                )
            );

        if (!stateMatch) {
            return;
        }

        const city =
            String(commaParts[index - 1] || "")
                .replace(/^\d+\s+/, "")
                .trim();

        const state =
            String(stateMatch[1] || "").trim();

        if (city && state) {
            matches.push(
                [
                    city,
                    state
                ].join(" ")
            );
        }
    });

    const simpleCityStatePattern =
        new RegExp(
            "\\b([A-Za-z][A-Za-z.' -]{1,40})\\s+(" +
                statePattern +
                ")\\b(?:\\s+\\d{5}(?:-\\d{4})?)?",
            "gi"
        );

    let match;

    while ((match = simpleCityStatePattern.exec(text))) {
        const city =
            String(match[1] || "")
                .trim();

        const state =
            String(match[2] || "").trim();

        if (
            city &&
            state &&
            !/\b(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd)\b/i.test(city)
        ) {
            matches.push(
                [
                    city,
                    state
                ].join(" ")
            );
        }
    }

    return matches;
}

function uniqueDestinationContextParts(values) {

    const seen = new Set();

    return values
        .map(value =>
            String(value || "")
                .replace(/\s+/g, " ")
                .trim()
        )
        .filter(value => {
            const key =
                normalizeDestinationMatchText(value);

            if (!key || seen.has(key)) {
                return false;
            }

            seen.add(key);
            return true;
        });
}

function getKnownDestinationInstitution(value) {

    const text =
        normalizeDestinationMatchText(value);

    const institutions = [
        {
            name: "California State University, Chico",
            type: "university",
            patterns: [
                "chico state",
                "csu chico",
                "cal state chico",
                "california state university chico"
            ]
        },
        {
            name: "Enloe Medical Center",
            type: "hospital",
            patterns: [
                "enloe",
                "enloe hospital",
                "enloe medical"
            ]
        },
        {
            name: "Department of Motor Vehicles",
            type: "government agency",
            patterns: [
                "dmv",
                "department of motor vehicles"
            ]
        }
    ];

    return institutions.find(institution =>
        institution.patterns.some(pattern =>
            text.includes(pattern)
        )
    ) || null;
}

function removeDestinationInstitutionPhrase(value, institution) {

    let cleaned =
        String(value || "");

    if (!institution) {
        return cleaned.trim();
    }

    institution.patterns.forEach(pattern => {
        const escapedPattern =
            pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        cleaned =
            cleaned.replace(
                new RegExp("\\b" + escapedPattern + "\\b", "ig"),
                " "
            );
    });

    return cleaned
        .replace(/\b(?:at|in|inside|within|the|my|destination|to)\b/ig, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getActiveJourneyInstitutionContext() {

    if (!activeJourney) {
        return null;
    }

    const contextValues = [
        activeJourney.destinationName,
        activeJourney.destination,
        activeJourney.destinationDetail,
        activeJourney.verifiedDestinationAddress,
        activeJourney.destinationAddress,
        activeJourney.destinationDirectoryNote
    ];

    const knownInstitution =
        contextValues
            .map(getKnownDestinationInstitution)
            .find(Boolean);

    if (knownInstitution) {
        return knownInstitution;
    }

    const destinationText =
        contextValues
            .filter(Boolean)
            .join(" ");

    if (
        /\bcourthouse\b/i.test(destinationText) ||
        /\bsuperior court\b/i.test(destinationText)
    ) {
        return {
            name:
                activeJourney.destinationName ||
                activeJourney.destination ||
                activeJourney.destinationDetail ||
                "Courthouse",
            type: "courthouse",
            patterns: []
        };
    }

    if (
        /\bhospital\b/i.test(destinationText) ||
        /\bmedical center\b/i.test(destinationText)
    ) {
        return {
            name:
                activeJourney.destinationName ||
                activeJourney.destination ||
                activeJourney.destinationDetail,
            type: "hospital",
            patterns: []
        };
    }

    return null;
}

function inferDestinationSubDestination(value, institution) {

    const withoutInstitution =
        removeDestinationInstitutionPhrase(
            value,
            institution
        );

    const text =
        withoutInstitution
            .replace(/\b(?:department|dept|office|clinic|center)\b$/ig, "")
            .replace(/\s+/g, " ")
            .trim();

    if (!text) {
        return "";
    }

    if (/^radiology$/i.test(text)) {
        return "Radiology";
    }

    if (/^anthropology$/i.test(text)) {
        return "Anthropology Department";
    }

    if (/^department\s+/i.test(text)) {
        return text.replace(/^department\s+/i, "Department ");
    }

    if (/\bdepartment\b/i.test(text)) {
        return text;
    }

    if (
        institution &&
        (
            /\bradiology\b/i.test(text) ||
            /\bdepartment\b/i.test(value) ||
            /\boffice\b/i.test(value) ||
            /\broom\b/i.test(value) ||
            /\bsuite\b/i.test(value)
        )
    ) {
        return text;
    }

    return "";
}

function interpretDestinationRequest(destination) {

    const originalDestination =
        String(destination || "").trim();

    const directInstitution =
        getKnownDestinationInstitution(originalDestination);

    const contextInstitution =
        getActiveJourneyInstitutionContext();

    const institution =
        directInstitution ||
        (
            /^(?:department|dept|room|suite|office)\b/i.test(originalDestination)
                ? contextInstitution
                : null
        );

    const subDestination =
        inferDestinationSubDestination(
            originalDestination,
            institution
        );

    const queryParts =
        institution
            ? [
                institution.name,
                subDestination
            ]
            : [
                originalDestination
            ];

    return {
        originalDestination,
        institutionName:
            institution?.name || "",
        institutionType:
            institution?.type || "",
        subDestination,
        query:
            uniqueDestinationContextParts(queryParts).join(" ") ||
            originalDestination
    };
}

function buildDestinationVerificationLookup(destination) {

    const originalDestination =
        String(destination || "").trim();

    const interpretation =
        interpretDestinationRequest(originalDestination);

    const textContext =
        uniqueDestinationContextParts([
            ...extractDestinationCityStateContext(originalDestination),
            ...getDestinationVerificationTextValues()
                .flatMap(extractDestinationCityStateContext)
        ]).filter(contextPart =>
            !normalizeDestinationMatchText(originalDestination)
                .includes(normalizeDestinationMatchText(contextPart))
        );

    const locationBias =
        getDestinationVerificationGpsValues()
            .map(normalizeDestinationGps)
            .find(Boolean) || null;

    const query =
        uniqueDestinationContextParts([
            interpretation.query,
            ...textContext
        ]).join(" ");

    return {
        query:
            query || interpretation.query || originalDestination,
        interpretation,
        contextText:
            textContext.join(" "),
        contextLabel:
            uniqueDestinationContextParts([
                interpretation.institutionName
                    ? "Institution: " +
                    interpretation.institutionName
                    : "",
                interpretation.subDestination
                    ? "Sub-destination: " +
                    interpretation.subDestination
                    : "",
                ...textContext.slice(0, 2)
            ]).join("; "),
        locationBias:
            locationBias
                ? {
                    ...locationBias,
                    radius: 50000
                }
                : null
    };
}

function normalizeDestinationMatchText(value) {

    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getDestinationCandidateText(place) {

    return normalizeDestinationMatchText(
        [
            place?.destinationName,
            place?.destinationAddress
        ].filter(Boolean).join(" ")
    );
}

function getDestinationCandidateGps(place) {

    return normalizeDestinationGps(place?.destinationGps);
}

function getDestinationDistanceMiles(firstGps, secondGps) {

    if (!firstGps || !secondGps) {
        return null;
    }

    const toRadians =
        degrees => degrees * Math.PI / 180;

    const earthRadiusMiles =
        3958.8;

    const latitudeDelta =
        toRadians(secondGps.latitude - firstGps.latitude);

    const longitudeDelta =
        toRadians(secondGps.longitude - firstGps.longitude);

    const firstLatitude =
        toRadians(firstGps.latitude);

    const secondLatitude =
        toRadians(secondGps.latitude);

    const haversine =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(firstLatitude) *
        Math.cos(secondLatitude) *
        Math.sin(longitudeDelta / 2) ** 2;

    return earthRadiusMiles *
        2 *
        Math.atan2(
            Math.sqrt(haversine),
            Math.sqrt(1 - haversine)
        );
}

function getDestinationMatchWords(value) {

    const stopWords =
        new Set([
            "the",
            "and",
            "for",
            "with",
            "from",
            "near",
            "off",
            "going",
            "headed",
            "heading",
            "department",
            "destination"
        ]);

    const queryText =
        normalizeDestinationMatchText(value);

    return queryText
        .split(" ")
        .filter(word =>
            word.length > 2 &&
            !stopWords.has(word)
        );
}

function scoreDestinationPlaceCandidate(
    place,
    destination,
    lookupContext = {}
) {

    const destinationWords =
        getDestinationMatchWords(destination);

    const contextWords =
        getDestinationMatchWords(lookupContext.contextText);

    const candidateText =
        getDestinationCandidateText(place);

    let score = 0;

    let destinationMatches = 0;

    destinationWords.forEach(word => {
        if (candidateText.includes(word)) {
            destinationMatches += 1;
            score += 10;
        }
    });

    contextWords.forEach(word => {
        if (candidateText.includes(word)) {
            score += 15;
        }
    });

    if (
        destinationWords.length &&
        destinationMatches === 0
    ) {
        score -= 50;
    }

    if (
        destinationWords.length &&
        destinationMatches >= Math.min(2, destinationWords.length)
    ) {
        score += 20;
    }

    const contextGps =
        normalizeDestinationGps(lookupContext.locationBias);

    const candidateGps =
        getDestinationCandidateGps(place);

    const distanceMiles =
        getDestinationDistanceMiles(
            contextGps,
            candidateGps
        );

    if (distanceMiles !== null) {
        if (distanceMiles <= 25) {
            score += 40;
        } else if (distanceMiles > 100) {
            score -= 80;
        } else if (distanceMiles > 50) {
            score -= 30;
        }
    }

    return score;
}

function getDestinationCandidateConfidence(place) {

    if (place.matchScore < 20) {
        return "low";
    }

    return "high";
}

function rankDestinationPlaceCandidates(
    candidates,
    destination,
    lookupContext = {}
) {

    return [...candidates]
        .map(place => {
            const matchScore =
                scoreDestinationPlaceCandidate(
                    place,
                    destination,
                    lookupContext
                );

            const destinationConfidence =
                getDestinationCandidateConfidence({
                    ...place,
                    matchScore
                });

            return {
                ...place,
                matchScore,
                destinationConfidence,
                reason:
                    destinationConfidence === "low"
                        ? "I couldn't confidently identify your destination."
                        : "Closest match to your request"
            };
        })
        .sort(
            (first, second) =>
                second.matchScore - first.matchScore
        );
}

function showOtherDestinationMatches() {

    const candidates =
        window.destinationPlaceCandidates || [];

    const otherMatches =
        candidates.slice(1, 3);

    if (!otherMatches.length) {
        return;
    }

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>🔍 Other Matches</strong>

    <br><br>

    These are less likely matches. Choose one only if the recommendation was not right.
</div>

${otherMatches.map(
        (place, index) => `
<div class="card">
    <strong>${escapeDestinationPlaceHtml(
            place.destinationName ||
            "Destination"
        )}</strong>

    <br><br>

    ${escapeDestinationPlaceHtml(
            place.destinationAddress ||
            "Address not provided"
        )}

    <br><br>

    <button onclick="saveVerifiedDestinationPlace(window.destinationPlaceCandidates[${index + 1}])">
        Use This Destination
    </button>
</div>
`
    ).join("")}
`;
}

function showDestinationManualVerificationCard(destination, errorMessage) {

    window.destinationVerificationSearchQuery =
        destination;

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📍 Destination Not Found</strong>

    <br><br>

    ${errorMessage
            ? escapeDestinationPlaceHtml(errorMessage)
            : "No Google Places match was found."}

    <br><br>

    You can look it up or paste a verified address manually.

    <br><br>

    <button onclick="
window.open(
'https://www.google.com/search?q=' +
encodeURIComponent(
activeJourney?.destinationDetail ||
activeJourney?.destination ||
window.destinationVerificationSearchQuery
),
'_blank'
);
">
        🔍 Look Up Address
    </button>

    <br><br>

    <input
        id="verifiedDestinationAddress"
        type="text"
        placeholder="Paste verified address here"
        style="width:90%;padding:8px;"
    >

    <br><br>

    <button onclick="
const address =
document.getElementById(
    'verifiedDestinationAddress'
).value.trim();

if(address){
    saveVerifiedDestinationAddress(
        address
    );
}
">
        ✓ Save Verified Address
    </button>
</div>
`;
}

function showDestinationManualAddressEntryCard() {

    const originalDestination =
        window.destinationVerificationSearchQuery ||
        activeJourney?.originalDestinationRequest ||
        activeJourney?.destinationDetail ||
        activeJourney?.destination ||
        "";

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>&#9999;&#65039; Enter Correct Address</strong>

    <br><br>

    Original request:

    <br><br>

    <strong>${escapeDestinationPlaceHtml(originalDestination)}</strong>

    <br><br>

    <input
        id="manualDestinationAddress"
        type="text"
        placeholder="Paste or enter the full destination address"
        style="width:90%;padding:8px;"
    >

    <br><br>

    <button onclick="saveManualVerifiedDestinationAddressFromCard()">
        &#10003; Save Verified Address
    </button>

    <br><br>

    <button onclick="continueFromDestinationVerified()">
        Return
    </button>
</div>
`;
}

function saveManualVerifiedDestinationAddressFromCard() {

    if (!activeJourney) {
        return;
    }

    const addressInput =
        document.getElementById("manualDestinationAddress");

    const destinationAddress =
        addressInput
            ? addressInput.value.trim()
            : "";

    if (!destinationAddress) {
        alert("Enter a destination address first.");
        return;
    }

    const originalDestination =
        window.destinationVerificationSearchQuery ||
        activeJourney.originalDestinationRequest ||
        activeJourney.destinationDetail ||
        activeJourney.destination ||
        "";

    activeJourney.originalDestinationRequest =
        activeJourney.originalDestinationRequest ||
        originalDestination;

    activeJourney.destinationAddress =
        destinationAddress;

    activeJourney.verifiedDestinationAddress =
        destinationAddress;

    window.destinationPlaceCandidates = [];

    activeJourney.destinationPlaceId =
        "";

    activeJourney.destinationGps =
        null;

    activeJourney.destinationGoogleMapsUri =
        "";

    activeJourney.destinationVerificationSource =
        "manual";

    activeJourney.destinationVerifiedAt =
        new Date().toISOString();

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    showActiveJourneyBox("destination");

    document.getElementById("result").innerHTML = "";

    const questionInput =
        document.getElementById("questionInput");

    if (questionInput) {
        questionInput.focus();
    }
}

function saveVerifiedDestinationPlace(place) {

    if (!place) {
        return;
    }

    const destinationName =
        place.destinationName || "";

    const destinationAddress =
        place.destinationAddress || "";

    activeJourney.destinationName =
        destinationName;

    if (destinationName) {
        activeJourney.destination =
            destinationName;
    }

    if (destinationName || destinationAddress) {
        activeJourney.destinationDetail =
            [
                destinationName,
                destinationAddress
            ].filter(Boolean).join(", ");
    }

    activeJourney.destinationAddress =
        destinationAddress;

    activeJourney.verifiedDestinationAddress =
        destinationAddress;

    activeJourney.destinationPlaceId =
        place.destinationPlaceId || "";

    activeJourney.destinationGps =
        place.destinationGps || null;

    activeJourney.destinationGoogleMapsUri =
        place.googleMapsUri || "";

    activeJourney.destinationVerificationSource =
        "google_places";

    activeJourney.destinationVerifiedAt =
        new Date().toISOString();

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    saveVerifiedDestinationAddress(
        destinationAddress ||
        destinationName
    );
}

function saveDestinationInternalDetails(details) {

    if (!activeJourney || !details) {
        return false;
    }

    activeJourney.destinationBuilding =
        details.destinationBuilding ??
        activeJourney.destinationBuilding ??
        "";

    activeJourney.destinationDepartmentOffice =
        details.destinationDepartmentOffice ??
        activeJourney.destinationDepartmentOffice ??
        "";

    activeJourney.destinationRoomSuite =
        details.destinationRoomSuite ??
        details.destinationInternalLocation ??
        activeJourney.destinationRoomSuite ??
        "";

    activeJourney.destinationInternalLocation =
        [
            activeJourney.destinationBuilding,
            activeJourney.destinationDepartmentOffice,
            activeJourney.destinationRoomSuite
        ].filter(Boolean).join(" • ");

    activeJourney.destinationEntrance =
        details.destinationEntrance ??
        activeJourney.destinationEntrance ??
        "";

    activeJourney.destinationFloor =
        details.destinationFloor ??
        activeJourney.destinationFloor ??
        "";

    activeJourney.destinationContactPerson =
        details.destinationContactPerson ??
        activeJourney.destinationContactPerson ??
        "";

    activeJourney.destinationPhone =
        details.destinationPhone ??
        activeJourney.destinationPhone ??
        "";

    activeJourney.destinationEmail =
        details.destinationEmail ??
        activeJourney.destinationEmail ??
        "";

    activeJourney.destinationSourceUrl =
        details.destinationSourceUrl ??
        activeJourney.destinationSourceUrl ??
        "";

    activeJourney.destinationDirectoryNote =
        details.destinationDirectoryNote ??
        activeJourney.destinationDirectoryNote ??
        "";

    activeJourney.destinationInsideNotes =
        details.destinationInsideNotes ??
        activeJourney.destinationInsideNotes ??
        "";

    activeJourney.destinationCampusZip =
        details.destinationCampusZip ??
        activeJourney.destinationCampusZip ??
        "";

    activeJourney.directories =
        activeJourney.directories || [];

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    showActiveJourneyBox("insideDestination");

    return true;
}

function promptDestinationInternalDetails() {

    if (!activeJourney) {
        return;
    }

    showDestinationInternalDetailsCard();
}

function getDestinationInternalInputValue(id) {

    return document.getElementById(id)?.value.trim() || "";
}

function saveDestinationInternalDetailsFromCard() {

    saveDestinationInternalDetails({
        destinationBuilding:
            getDestinationInternalInputValue("destinationBuilding"),
        destinationDepartmentOffice:
            getDestinationInternalInputValue("destinationDepartmentOffice"),
        destinationRoomSuite:
            getDestinationInternalInputValue("destinationRoomSuite"),
        destinationEntrance:
            getDestinationInternalInputValue("destinationEntrance"),
        destinationFloor:
            getDestinationInternalInputValue("destinationFloor"),
        destinationContactPerson:
            getDestinationInternalInputValue("destinationContactPerson"),
        destinationPhone:
            getDestinationInternalInputValue("destinationPhone"),
        destinationEmail:
            getDestinationInternalInputValue("destinationEmail"),
        destinationInsideNotes:
            getDestinationInternalInputValue("destinationInsideNotes")
    });

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>🏢 Inside Destination Details Saved</strong>

    <br><br>

    I saved those details with this journey.
</div>
`;
}

function showDestinationInternalDetailsCard() {

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>🏢 Add Inside Destination Details</strong>

    <br><br>

    <input id="destinationBuilding" placeholder="Building" value="${escapeDestinationPlaceHtml(activeJourney.destinationBuilding || "")}" style="width:90%;padding:8px;">
    <br><br>
    <input id="destinationDepartmentOffice" placeholder="Department / Office" value="${escapeDestinationPlaceHtml(activeJourney.destinationDepartmentOffice || "")}" style="width:90%;padding:8px;">
    <br><br>
    <input id="destinationRoomSuite" placeholder="Room or Suite" value="${escapeDestinationPlaceHtml(activeJourney.destinationRoomSuite || "")}" style="width:90%;padding:8px;">
    <br><br>
    <input id="destinationEntrance" placeholder="Entrance" value="${escapeDestinationPlaceHtml(activeJourney.destinationEntrance || "")}" style="width:90%;padding:8px;">
    <br><br>
    <input id="destinationFloor" placeholder="Floor" value="${escapeDestinationPlaceHtml(activeJourney.destinationFloor || "")}" style="width:90%;padding:8px;">
    <br><br>
    <input id="destinationContactPerson" placeholder="Contact Person" value="${escapeDestinationPlaceHtml(activeJourney.destinationContactPerson || "")}" style="width:90%;padding:8px;">
    <br><br>
    <input id="destinationPhone" placeholder="Phone" value="${escapeDestinationPlaceHtml(activeJourney.destinationPhone || "")}" style="width:90%;padding:8px;">
    <br><br>
    <input id="destinationEmail" placeholder="Email" value="${escapeDestinationPlaceHtml(activeJourney.destinationEmail || "")}" style="width:90%;padding:8px;">
    <br><br>
    <textarea id="destinationInsideNotes" placeholder="Notes" style="width:90%;padding:8px;min-height:80px;">${escapeDestinationPlaceHtml(activeJourney.destinationInsideNotes || activeJourney.destinationDirectoryNote || "")}</textarea>

    <br><br>

    <button onclick="saveDestinationInternalDetailsFromCard()">
        Save Inside Details
    </button>

    <br><br>

    <button onclick="continueFromDestinationVerified()">
        Continue Journey
    </button>
</div>
`;
}

function saveVerifiedDestinationAddress(address) {

    activeJourney.destinationAddress =
        address;

    activeJourney.verifiedDestinationAddress =
        address;

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    showActiveJourneyBox("destination");

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📬 Destination Verified</strong>

    <br><br>

    ${address}

    <br><br>

    Navigation will now use this verified address.

    <br><br>

    <button onclick="promptDestinationInternalDetails()">
        🏢 Add Inside Destination Details
    </button>

    <br><br>

<button onclick="continueFromDestinationVerified()">
    ⬅ Continue Journey
</button>
</div>
`;
}
