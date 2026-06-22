// ========================================
// COLLAPSIBLE SECTIONS
// ========================================

window.showJourneyInfo =
    window.showJourneyInfo ?? false;

window.collapsedSections =
    window.collapsedSections || {

        photos: false,
        directories: false,
        questions: false,
        appointments: false,
        instructions: false,
        notes: false

    };

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

    Destination:
${journey.verifiedDestinationAddress ||
            journey.destinationAddress ||
            journey.destinationDetail ||
            journey.destination ||
            "Not recorded"}

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

    activeJourney = journey;

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

${journey.notes?.length
    ? `<strong>📝 Notes:</strong> ${journey.notes.length}<br>`
    : ""}

${journey.questionsForDoctor?.length
    ? `<strong>❓ Questions:</strong> ${journey.questionsForDoctor.length}<br>`
    : ""}

${journey.medications?.length
    ? `<strong>💊 Medications:</strong> ${journey.medications.length}<br>`
    : ""}

${journey.appointments?.length
    ? `<strong>📅 Appointments:</strong> ${journey.appointments.length}<br>`
    : ""}

${journey.directories?.length
    ? `<strong>🏢 Directories:</strong> ${journey.directories.length}<br>`
    : ""}

${journey.staffInstructions?.length
    ? `<strong>👩‍⚕️ Instructions:</strong> ${journey.staffInstructions.length}<br>`
    : ""}

${journey.photos?.length
    ? `<strong>📷 Photos:</strong> ${journey.photos.length}<br>`
    : ""}

${journey.parkingLocation
    ? `<strong>🚗 Parking:</strong> ${journey.parkingLocation}<br>`
    : ""}

${journey.startLocation
    ? `<strong>🧭 Start:</strong> ${journey.startLocation}<br>`
    : ""}

<strong>📍 Destination:</strong>
${journey.destination}

<br><br>

<hr>
        <strong>Destination:</strong>
        ${journey.destination}

        <br><br>

        <strong>📍 Destination Details:</strong>
        ${journey.destinationDetail ||
        "No destination details recorded"}

        <br><br>

        <strong>📬 Verified Destination:</strong>
        ${journey.verifiedDestinationAddress || "Not verified"}

        <br><br>

<button onclick="openGoogleMapsToDestinationDetails()">
    🧭 Navigate To Destination Details
</button>

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
<br>
${journey.startLocation || "Not recorded"}

${journey.startLocationAddress
            ? `<br>${journey.startLocationAddress}`
            : ""}
    <br><br>

        <strong>Parking:</strong>
        ${journey.parkingLocation || "Not recorded"}

${journey.parkingLocation
            ? `
<br><br>
<button onclick="
openGoogleMapsToParkingLocation();
">
    🚗 Return To Parking
</button>
`
            : ""}

${journey.startLocation
            ? `
<br><br>
<button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                journey.startLocationAddress ||
                journey.startLocation
            )}', '_blank')">
    🧭 Return To Start
</button>
`
            : ""}
<br><br>

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

<button onclick="verifySavedLocation()">
    ${activeJourney?.verifiedDestinationAddress
            ? "✅ Location Verified"
            : "📍 Verify Location"}
</button>

  <br><br>

${activeJourney?.verifiedDestinationAddress
            ? `
<strong>📬 Verified Destination:</strong><br>
${activeJourney.verifiedDestinationAddress}
`
            : `
<strong>⚠️ Destination Not Verified</strong><br>
Verify the location before navigating.
`}

<br><br>

    Here's a map in case you need it.

    <br><br>

    <button onclick="openGoogleMapsForJourney()">
        Open Google Maps
    </button>

    <br><br>

    <button onclick="
window.showJourneyInfo =
    !window.showJourneyInfo;

showActiveJourneyBox();
">
    ${window.showJourneyInfo
        ? "▼"
        : "▶"}
    Active Journey Info
</button>

<br><br>

${window.showJourneyInfo ? `

    <strong>Arrival Help:</strong><br>
${activeJourney.arrivalTips || "No arrival tips yet."}

<br><br>

<strong>📍 Destination Details:</strong><br>
${activeJourney.destinationDetail ||
        "No destination details saved yet."}
<br><br>
<strong>🧭 Starting Location:</strong><br>
${activeJourney.startLocation ||
        "No starting location saved yet."}

${activeJourney.startLocationAddress
            ? `<br>${activeJourney.startLocationAddress}`
            : ""}
    <br><br>

<strong>🚗 Parking Memory:</strong><br>
${activeJourney.parkingLocation ||
        "No parking location saved yet."}

${activeJourney.parkingLocationAddress
            ? `<br>${activeJourney.parkingLocationAddress}`
            : ""}
     
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

<strong>📅 Appointments:</strong><br>
${activeJourney.appointments?.length
            ? activeJourney.appointments
                .slice(-3)
                .map(
                    (item, index) =>
                        `${index + 1}. ${item}`
                )
                .join("<br>")
            : "No appointments saved yet."}

<br><br>

<strong>👩‍⚕️ Instructions:</strong><br>
${activeJourney.staffInstructions?.length
            ? activeJourney.staffInstructions
                .slice(-3)
                .map(
                    (item, index) =>
                        `${index + 1}. ${item}`
                )
                .join("<br>")
            : "No instructions saved yet."}

<br><br>

<strong>📝 Notes:</strong><br>
${activeJourney.notes?.length
            ? activeJourney.notes
                .slice(-3)
                .map(
                    (item, index) =>
                        `${index + 1}. ${item}`
                )
                .join("<br>")
            : "No notes saved yet."}

<br><br>

<strong>💊 Medications:</strong><br>
${activeJourney.medications?.length
            ? activeJourney.medications
                .slice(-3)
                .map(
                    (item, index) =>
                        `${index + 1}. ${item}`
                )
                .join("<br>")
            : "No medications saved yet."}

<br><br>

<strong>❓ Questions:</strong><br>
${activeJourney.questionsForDoctor?.length
            ? activeJourney.questionsForDoctor
                .slice(-3)
                .map(
                    (item, index) =>
                        `${index + 1}. ${item}`
                )
                .join("<br>")
            : "No questions saved yet."}

<br><br>

<strong>📷 Photos:</strong><br>

${activeJourney.photos?.length
            ? activeJourney.photos
                .slice(-3)
                .map(
                    (item, index) =>
                        `${index + 1}. ${item.note ||
                        item.title ||
                        item.name ||
                        "Unnamed Photo"
                        }`
                )
                .join("<br>")
            : "No photos saved yet."}

<br><br>

` : ""}

<strong>🏢 Directory Memory:</strong><br>
${activeJourney.directories?.length
            ? activeJourney.directories
                .slice(-3)
                .map(
                    (item, index) =>
                        `${index + 1}. ${item}`
                )
                .join("<br>")
            : "No directory information saved yet."}
    <br><br>

    <button onclick="saveJourney()">
        Save Journey
    </button>
</div>
`;

setTimeout(() => {

    document.getElementById("result")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

}, 150);

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );
}

function endJourneyFromArrival() {

    document.getElementById("questionInput").value =
        "end journey";

    askOurFlow();
}

function showArrivalMode() {

    if (!activeJourney) {
        return;
    }

    document.getElementById("result").innerHTML = `
<div class="card">

    <strong>🏁 Arrival Mode</strong>

    <br><br>

    Welcome to:

    <br><br>

    <strong>
        ${activeJourney.destination}
    </strong>

    <br><br>

    <strong>📍 Destination Details:</strong>

    <br><br>

    ${activeJourney.destinationDetail ||
        "No destination details recorded."}

    <br><br>

    <strong>📬 Verified Destination:</strong>

    <br><br>

    ${activeJourney.verifiedDestinationAddress ||
        "Not verified"}

<br><br>

<button onclick="startArrivalPhoto()">
    📷 Save Arrival Photo
</button>

<br><br>

<button onclick="openGoogleMapsToParkingLocation()">
    🚗 Return To Parking
</button>

    <br><br>

    <button onclick="endJourneyFromArrival()">
        🏁 End Journey
    </button>

</div>
`;
}

function startArrivalPhoto() {

    pendingPhotoMemory = true;

    document.getElementById("result").innerHTML = `
<div class="card">

    <strong>📷 Arrival Photo</strong>

    <br><br>

    Take a photo of:

    <br><br>

    • Building Entrance

    <br>

    • Room Number

    <br>

    • Directory Sign

    <br>

    • Landmark

    <br><br>

    After uploading the photo, I'll help save it.

</div>
`;
}