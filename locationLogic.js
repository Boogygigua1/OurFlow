
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

        activeJourney.parkingLocation =
            pendingLocationClassification;

        activeJourney.timeline.push(
            "🚗 Parking Saved: " +
            pendingLocationClassification
        );

        saveMessage =
            "Parking location recorded.";
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

        activeJourney.parkingLocation =
            pendingLocationClassification;

        activeJourney.startLocation =
            pendingLocationClassification;

        activeJourney.timeline.push(
            "🚗 Parking Saved: " +
            pendingLocationClassification
        );

        activeJourney.timeline.push(
            "🧭 Starting Location Saved: " +
            pendingLocationClassification
        );

        saveMessage =
            "Starting location and parking location recorded.";
    }

    pendingLocationClassification = "";

    showActiveJourneyBox();

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📍 Location Saved</strong>

    <br><br>

    ${saveMessage}

    <br><br>

    Destination:

    <br><br>

    <strong>
        ${activeJourney.destination}
    </strong>

    <br><br>

    Can I help with directions, notes,
parking reminders, or arrival details?

<br><br>

<button onclick="openGoogleMapsToParkingLocation()">
    🚗 Verify Parking
</button>

<br><br>

<button onclick="openGoogleMapsToStartLocation()">
    🧭 Verify Start
</button>
</div>
`;
}

function savePendingParking() {

    if (!pendingParkingLocation) return;

    if (activeJourney) {
        activeJourney.parkingLocation =
            pendingParkingLocation;
    }

    pendingParkingLocation = "";

    alert("📍 Parking location saved.");
}

function saveInformationSearchAsDestination() {

    if (!activeJourney) {
        return;
    }

    console.log(
        "SAVE DESTINATION:",
        pendingDestinationSearch
    );

    activeJourney.destinationAddress =
        pendingDestinationSearch;

    activeJourney.timeline.push(
        "📍 Destination Detail Saved: " +
        pendingDestinationSearch
    );

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

    function saveVerifiedDestinationAddress() {

    const address = prompt(
        "Paste the verified address:"
    );

    if (!address) {
        return;
    }

    activeJourney.destinationAddress =
        address;

    activeJourney.timeline.push(
        "📬 Verified Address Saved: " +
        address
    );

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    showActiveJourneyBox();

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📬 Verified Address Saved</strong>

    <br><br>

    ${address}

    <br><br>

    Navigation will now use this verified address.
</div>
`;
}
