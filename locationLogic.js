
function analyzeUserQuestion(question) {
    const text = question.toLowerCase();

    return {
        mentionsParking:
            text.includes("i'm parked") ||
            text.includes("i parked") ||
            text.includes("my car is") ||
            text.includes("parking location:"),

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
