
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
