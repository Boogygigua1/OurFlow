
function analyzeUserQuestion(question) {
    const text = question.toLowerCase();

    return {
        mentionsParking:
            text.includes("i'm parked") ||
            text.includes("im parked") ||
            text.includes("i parked") ||
            text.includes("parked at") ||
            text.includes("parked by") ||
            text.includes("parked near") ||
            text.includes("parked on") ||
            text.includes("my car is") ||
            text.includes("my car is at") ||
            text.includes("my ride is") ||
            text.includes("my ride is at") ||
            text.includes("my vehicle is") ||
            text.includes("left my car") ||
            text.includes("i left my car") ||
            text.includes("parking location:"),

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

function savePendingParking() {
    if (!pendingParkingLocation) return;

    if (activeJourney) {

        activeJourney.parkingLocation =
            pendingParkingLocation;

        if (window.savePhotoAsBoth) {

            activeJourney.startLocation =
                pendingParkingLocation;

            activeJourney.startLocationAddress =
                activeJourney.parkingLocationAddress;

            window.savePhotoAsBoth = false;
        }

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        showActiveJourneyBox();
    }

    pendingParkingLocation = "";

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>🚗 Parking Saved</strong>

    <br><br>

    Your parking location has been recorded.

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

<button onclick="
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

    console.log(
        "VERIFY PARKING CALLED:",
        pendingParkingLocation
    );

    const parkingLocation =
        pendingParkingLocation ||
        activeJourney?.parkingLocation;

    if (!parkingLocation) {
        alert("No parking location found.");
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
                destination: parkingLocation
            })
        }
    );

    const data = await response.json();

    window.parkingLookupAddress =
        parkingLocation;

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
savePendingParking();
">
    ✓ Save This Location
</button>

<br><br>

1. 1. If the location looks correct, click ✓ Save This Location.

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

    <button onclick="
const address = prompt(
'Paste the verified parking address:'
);

if(address){

    activeJourney.parkingLocationAddress =
        address;

    localStorage.setItem(
        'activeJourney',
        JSON.stringify(activeJourney)
    );

    savePendingParking();
}
">
    ✏ Enter Address Manually
</button>

</div>
`;
}

function saveInformationSearchAsDestination() {

    if (!activeJourney) {
        return;
    }

    console.log(
        "PENDING DESTINATION:",
        pendingDestinationSearch
    );

    console.log(
        "SAVE DESTINATION:",
        pendingDestinationSearch
    );

    console.log(
        "SAVING DESTINATION DETAIL:",
        pendingDestinationSearch
    );

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
        "/api/findDestinationAddress",
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

    window.suggestedAddress =
        data.suggestion || "No suggestion found.";

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📍 Suggested Location</strong>

    <br><br>

    ${data.suggestion || "No suggestion found."}

    <br><br>

<button onclick="
saveVerifiedDestinationAddress(
    window.suggestedAddress
);
">
    ✓ Save & Continue
</button>

<br><br>

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

<button onclick="
const address = prompt(
'Enter Address:'
);

if(address){
    saveVerifiedDestinationAddress(
        address
    );
}
">
    ✏ Enter Address Manually
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

<button onclick="
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