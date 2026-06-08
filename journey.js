
function saveJourney() {


    const result =
        document.getElementById("result");

    if (!activeJourney) return;

    if (savedJourneys.length >= JOURNEY_LIMIT) {

        showJourneyUpgradeBox();

        return;
    }

    const journeyToSave = { ...activeJourney };

    savedJourneys.push(journeyToSave);

    localStorage.setItem(
        "savedJourneys",
        JSON.stringify(savedJourneys)
    );

    result.innerHTML = `
<div class="card">
    <strong>🧭 Journey Saved</strong><br><br>

    Destination:
    ${journeyToSave.destination}

    <br><br>

    Events:
    ${journeyToSave.timeline?.length || 0}

    <br><br>

    Your journey has been saved and closed.

    <br><br>

    Start a new journey anytime by typing:

    <br><br>

    Start journey to [destination]


</div>
`;

    activeJourney = null;

    localStorage.removeItem(
        "activeJourney"
    );

    document.getElementById(
        "activeJourneyBox"
    ).innerHTML = "";

    document.getElementById(
        "questionInput"
    ).value = "";
}

function deleteJourney(index) {

    const confirmDelete =
        confirm("Delete this saved journey?");

    if (!confirmDelete) return;

    savedJourneys.splice(index, 1);

    localStorage.setItem(
        "savedJourneys",
        JSON.stringify(savedJourneys)
    );

    showSavedJourneys();
}

function showJourneyUpgradeBox() {

    alert(
        "🧭 Journey archive full.\n\n" +
        "Upgrade for 25 additional saved journeys."
    );
}

function filterJourneys() {

    const search =
        document.getElementById("journeySearch")
            .value
            .toLowerCase();

    const journeyItems =
        document.querySelectorAll("[data-journey]");

    journeyItems.forEach(item => {

        const index =
            parseInt(
                item.querySelector("button")
                    .getAttribute("onclick")
                    .match(/\d+/)[0]
            );

        const journey =
            savedJourneys[index];

        if (!journey) return;

        const searchableText = `

${journey.destination || ""}

${journey.notes?.join(" ") || ""}

${journey.questionsForDoctor?.join(" ") || ""}

${journey.medications?.join(" ") || ""}

${journey.appointments?.join(" ") || ""}

${journey.staffInstructions?.join(" ") || ""}

${journey.directories?.join(" ") || ""}

`.toLowerCase();

        item.style.display =
            searchableText.includes(search)
                ? "block"
                : "none";
    });
}

function showSavedJourneys() {

    const result =
        document.getElementById("result");

    if (savedJourneys.length === 0) {

        result.innerHTML = `
<div class="card">
    <strong>🧭 Saved Journeys</strong>
    <br><br>
    No journeys saved yet.
</div>
`;

        return;
    }

    let html =
        `<div class="card">

<strong>🧭 Saved Journeys</strong>

<br><br>

<input
    type="text"
    id="journeySearch"
    placeholder="🔍 Find Journey"
    onkeyup="filterJourneys()"
    style="
        width:95%;
        padding:10px;
        margin-bottom:15px;
    "
>

<div id="journeyList">
`;

    savedJourneys.forEach((journey, index) => {

        html += `
<div
    data-journey="${journey.destination}"
    style="
        padding:10px;
        border-bottom:1px solid #ddd;
        cursor:pointer;
    "
    onclick="toggleJourney(${index})"
>
    <strong>
        ${journey.destination}
    </strong>

    <br>

    ${journey.startTime}

    <br>

    Parking:
    ${journey.parkingLocation || "Not recorded"}

    <br>

    Events:
    ${journey.timeline?.length || 0}

    <br>

    <button onclick="event.stopPropagation(); deleteJourney(${index})">
        🗑 Delete Journey
    </button>

    <div
        id="journey-${index}"
        style="display:none; margin-top:10px;"
    >
    </div>

</div>
`;
    });

    html += `
</div>
`;

    result.innerHTML = html;
}

function toggleJourney(index) {

    const details =
        document.getElementById(`journey-${index}`);

    const journey =
        savedJourneys[index];

    if (details.style.display === "block") {

        details.style.display = "none";

        return;
    }

    let html = `
<div style="
    background:#f8f8f8;
    padding:10px;
    border-radius:8px;
    margin-bottom:10px;
">
    <strong>🧭 Journey Summary</strong>

    <br><br>

    Destination:
    ${journey.destination}

    <br>

    Duration:
    ${journey.duration || 0} minute(s)

    <br>

    Events:
${journey.timeline?.length || 0}
</div>

<br><br>

<strong>🧭 Quick Summary</strong>

<br><br>

${journey.notes &&
            journey.notes.length
            ? `<strong>📝 Notes:</strong><br>${journey.notes.map(n => `• ${n}<br>`).join("")}<br>`
            : ""}

${journey.questionsForDoctor &&
            journey.questionsForDoctor.length
            ? `<strong>❓ Questions:</strong><br>${journey.questionsForDoctor.map(q => `• ${q}<br>`).join("")}<br>`
            : ""}

${journey.medications &&
            journey.medications.length
            ? `<strong>💊 Medications:</strong><br>${journey.medications.map(m => `• ${m}<br>`).join("")}<br>`
            : ""}

${journey.appointments &&
            journey.appointments.length
            ? `<strong>📅 Appointments:</strong><br>${journey.appointments.map(a => `• ${a}<br>`).join("")}<br>`
            : ""}

${journey.parkingLocation
            ? `<strong>🚗 Parking:</strong><br>• ${journey.parkingLocation}<br><br>`
            : ""}

${journey.startLocation
            ? `<strong>🧭 Starting Location:</strong><br>• ${journey.startLocation}<br><br>`
            : ""}  

${journey.directories &&
            journey.directories.length
            ? `<strong>🏢 Directories:</strong><br>${journey.directories.map(d => `• ${d}<br>`).join("")}<br>`
            : ""}    
                                      

${journey.staffInstructions &&
            journey.staffInstructions.length
            ? `<strong>👩‍⚕️ Instructions:</strong><br>${journey.staffInstructions.map(i => `• ${i}<br>`).join("")}<br>`
            : ""}

<hr>

        <strong>Destination:</strong>
        ${journey.destination}

        <br><br>

        <strong>📍 Destination Details:</strong>
        ${journey.destinationAddress || "No destination details recorded"}

        <br><br>

        <strong>Started:</strong>
        ${journey.startTime}

        <br><br>

        <strong>Ended:</strong>
        ${journey.endTime || "Not recorded"}

        <br><br>

        <strong>Duration:</strong>
        ${journey.duration || 0} minute(s)

        <br><br>

        <strong>🧭 Starting Location:</strong>
        ${journey.startLocation || "Not recorded"}

        <br><br>

        <strong>Parking:</strong>
        ${journey.parkingLocation || "Not recorded"}

        <br><br>

        ${journey.parkingLocation
            ? `
<br><br>
<button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(journey.parkingLocation)}', '_blank')">
    🚗 Return To Parking
</button>
`
            : ""}

        <strong>Journey Details</strong>

        <br><br>
    `;

    if (
        !journey.timeline ||
        journey.timeline.length === 0
    ) {

        html += `
No journey events recorded.
<br><br>
`;
    }

    else {

        journey.timeline.forEach(event => {

            html += `
${event}
<br><br>
`;
        });

        if (journey.photos && journey.photos.length) {

            html += `
    <br>

    <strong>📷 Saved Photos</strong>

    <br><br>

    ${journey.photos.map(photo => `
        <img
            src="${photo.image}"
            style="
                max-width:200px;
                border-radius:8px;
                margin-bottom:10px;
                display:block;
            "
        >
    `).join("")}
    `;
        }

        details.innerHTML = html;

        details.style.display = "block";

    }

}


function showActiveJourneyBox() {

    const result =
        document.getElementById("activeJourneyBox");

    if (!activeJourney) {
        return;
    }

    result.innerHTML = `
<div class="card">

    <strong>🧭 Journey Started</strong>

    <br><br>

    I see you're starting a journey to:

    <br><br>

    <strong>
        ${activeJourney.destination || "Not set yet"}
    </strong>

    <br><br>

    Here's a map in case you need it.

    <br><br>

    <button onclick="openGoogleMapsForJourney()">
        Open Google Maps
    </button>

    <br><br>

    <strong>Active Journey Info:</strong>
    <br><br>


    <strong>Arrival Help:</strong><br>
${activeJourney.arrivalTips || "No arrival tips yet."}

<br><br>

<strong>📍 Destination Details:</strong><br>
${activeJourney.destinationAddress ||
        "No destination details saved yet."}

<br><br>

<strong>🧭 Starting Location:</strong><br>
${activeJourney.startLocation ||
        "No starting location saved yet."}

<br><br>

<strong>🚗 Parking Memory:</strong><br>
${activeJourney.parkingLocation ||
        "No parking location saved yet."}

${activeJourney.parkingLocation
            ? `
<br><br>
<button onclick="openGoogleMapsToParkingLocation()">
    🚗 Return To Parking
</button>
`
            : ""}

${activeJourney.startLocation
            ? `
<br><br>
<button onclick="openGoogleMapsToStartLocation()">
    🧭 Return To Start
</button>
`
            : ""}

<br><br>

<strong>📷 Photos:</strong><br>
${activeJourney.photos?.length || 0}

<br><br>

<strong>🏢 Directory Memory:</strong><br>
${activeJourney.directories?.length
            ? "• " + activeJourney.directories.slice(-3).join("<br>• ")
            : "No directory information saved yet."}
    <br><br>

    <button onclick="saveJourney()">
        Save Journey
    </button>
</div>
`;

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );
}
