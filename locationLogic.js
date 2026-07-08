
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

    showActiveJourneyBox();

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

    showActiveJourneyBox();
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

    showActiveJourneyBox();

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
                destination
            })
        }
    );

    const data = await response.json();

    const candidates =
        data.candidates || [];

    window.destinationPlaceCandidates =
        candidates;

    if (!candidates.length) {
        showDestinationManualVerificationCard(
            destination,
            data.error
        );
        return;
    }

    const candidateButtons =
        candidates.map(
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

    <button onclick="saveVerifiedDestinationPlace(window.destinationPlaceCandidates[${index}])">
        ✓ Save This Destination
    </button>

    ${place.googleMapsUri
                    ? `
    <br><br>

    <button onclick="window.open(window.destinationPlaceCandidates[${index}].googleMapsUri, '_blank')">
        🗺️ Open Map
    </button>
    `
                    : ""}
</div>
`
        ).join("");

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📍 Destination Found</strong>

    <br><br>

    You said:

    <br><br>

    <strong>${escapeDestinationPlaceHtml(destination)}</strong>

<br><br>

    Choose the destination to save:
</div>

${candidateButtons}

<div class="card">
    <button onclick="
window.open(
'https://www.google.com/search?q=' +
encodeURIComponent(
activeJourney?.destinationDetail ||
activeJourney?.destination
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

function escapeDestinationPlaceHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
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

function saveVerifiedDestinationAddress(address) {

    activeJourney.destinationAddress =
        address;

    activeJourney.verifiedDestinationAddress =
        address;

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    showActiveJourneyBox();

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📬 Destination Verified</strong>

    <br><br>

    ${address}

    <br><br>

    Navigation will now use this verified address.

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

<button onclick="continueFromDestinationVerified()">
    ⬅ Continue Journey
</button>
</div>
`;
}
