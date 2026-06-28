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

window.journeySaveInProgress =
    window.journeySaveInProgress || false;

window.journeyEndActionInProgress =
    window.journeyEndActionInProgress || false;

function hasMeaningfulJourneyData(journey) {

    if (!journey) {
        return false;
    }

    const destination =
        (journey.destination || "").trim();

    const hasDestination =
        destination &&
        destination !== "Untitled Journey" &&
        destination !== "Photo Memory";

    return Boolean(
        hasDestination ||
        journey.destinationDetail ||
        journey.destinationAddress ||
        journey.verifiedDestinationAddress ||
        journey.parkingDescription ||
        journey.parkingLocation ||
        journey.parkingLocationAddress ||
        journey.startLocation ||
        journey.startLocationAddress ||
        journey.notes?.length ||
        journey.photos?.length ||
        journey.medications?.length ||
        journey.appointments?.length ||
        journey.questionsForDoctor?.length ||
        journey.staffInstructions?.length ||
        journey.directories?.length
    );
}

function clearActiveJourneySession() {

    activeJourney = null;

    resetJourneySessionContext();

    localStorage.removeItem(
        "activeJourney"
    );

    const activeJourneyBox =
        document.getElementById(
            "activeJourneyBox"
        );

    if (activeJourneyBox) {
        activeJourneyBox.innerHTML = "";
    }

    const questionInput =
        document.getElementById(
            "questionInput"
        );

    if (questionInput) {
        questionInput.value = "";
    }
}

function saveJourney() {


    const result =
        document.getElementById("result");

    if (!activeJourney) return false;

    if (window.journeySaveInProgress) {
        return false;
    }

    window.journeySaveInProgress = true;

    if (savedJourneys.length >= JOURNEY_LIMIT) {

        window.journeySaveInProgress = false;

        showJourneyUpgradeBox();

        return false;
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

    clearActiveJourneySession();

    window.journeySaveInProgress = false;
    window.journeyEndActionInProgress = false;

    return true;
}

function requestEndJourney() {

    const result =
        document.getElementById("result");

    if (!activeJourney) {
        result.innerHTML = `
<div class="card">
    <strong>OurFlow</strong><br><br>
    No active journey to end.
</div>
`;
        return;
    }

    if (!hasMeaningfulJourneyData(activeJourney)) {
        endJourneyWithoutSaving();
        return;
    }

    window.journeyEndActionInProgress = false;

    result.innerHTML = `
<div class="card">
    <strong>&#127937; End Journey?</strong>

    <br><br>

    Would you like to save this journey before ending it?

    <br><br>

    <button onclick="saveAndEndJourney()">
        &#128190; Save &amp; End Journey
    </button>

    <br><br>

    <button onclick="endJourneyWithoutSaving()">
        &#127937; End Without Saving
    </button>
</div>
`;
}

function saveAndEndJourney() {

    if (window.journeyEndActionInProgress) {
        return;
    }

    window.journeyEndActionInProgress = true;

    const didSave =
        saveJourney();

    if (!didSave) {
        window.journeyEndActionInProgress = false;
    }
}

function endJourneyWithoutSaving() {

    if (window.journeyEndActionInProgress) {
        return;
    }

    window.journeyEndActionInProgress = true;

    clearActiveJourneySession();

    window.journeyEndActionInProgress = false;

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>&#127937; Journey Ended</strong>

    <br><br>

    This journey was ended without saving.
</div>
`;
}

function isJourneyEndSwipeSurface(target) {

    const result =
        document.getElementById("result");

    if (!result || !target || !result.contains(target)) {
        return false;
    }

    const text =
        result.textContent || "";

    return (
        text.includes("Destination Reached") ||
        text.includes("End Journey") ||
        text.includes("Quick Summary")
    );
}

function handleJourneySwipeEnd(deltaX, deltaY, startTarget) {

    if (!activeJourney) {
        return;
    }

    if (!isJourneyEndSwipeSurface(startTarget)) {
        return;
    }

    const isSwipeUp =
        deltaY < -80 &&
        Math.abs(deltaX) < 70;

    if (!isSwipeUp) {
        return;
    }

    requestEndJourney();
}

function setupJourneySwipeEndHandler() {

    if (window.journeySwipeEndHandlerReady) {
        return;
    }

    window.journeySwipeEndHandlerReady = true;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTarget = null;

    document.addEventListener(
        "touchstart",
        event => {
            const touch =
                event.touches?.[0];

            if (!touch) {
                return;
            }

            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTarget = event.target;
        },
        { passive: true }
    );

    document.addEventListener(
        "touchend",
        event => {
            const touch =
                event.changedTouches?.[0];

            if (!touch) {
                return;
            }

            handleJourneySwipeEnd(
                touch.clientX - touchStartX,
                touch.clientY - touchStartY,
                touchStartTarget
            );

            touchStartTarget = null;
        },
        { passive: true }
    );
}

setupJourneySwipeEndHandler();

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

<strong>🗂 Journey Archive</strong>

<br><br>

${savedJourneys.length} / ${JOURNEY_LIMIT} Journeys Used

${savedJourneys.length >= JOURNEY_LIMIT
? `
<br><br>

<div class="card">
    <strong>📦 Archive Full</strong>

    <br><br>

    You've used all
    ${JOURNEY_LIMIT}
    available journey slots.

    <br><br>

    Delete older journeys
    or expand your archive.

    <br><br>

<button onclick="showJourneyUpgradeBox()">
    ⭐ Expand Archive
</button>

</div>
`
: ""}

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

Photos:
${journey.photos?.length || 0}

<br>

Notes:
${journey.notes?.length || 0}

<br>

    <button onclick="event.stopPropagation(); restoreJourney(${index})">
        Restore Journey
    </button>

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

    ${journey.photos.map((photo, index) => `
        <strong>📷 Photo ${index + 1}</strong>

        <br>

        ${photo.note || photo.title || photo.name || "Unnamed Photo"}

        <br><br>

        <img
            src="${photo.thumbnail}"
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

function restoreJourney(index) {

    const journey =
        savedJourneys[index];

    if (!journey) return;

    resetJourneySessionContext();

    activeJourney =
        JSON.parse(JSON.stringify(journey));

    markActiveJourneyContext("new");

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    showActiveJourneyBox();

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Journey Restored</strong>

    <br><br>

    ${activeJourney.destination || "Untitled Journey"}

    <br><br>

    This saved journey is active again.
</div>
`;
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
<br><br>

<strong>🧭 Starting Location:</strong><br>

${activeJourney.startLocation ||
            "No starting location saved yet."}

${activeJourney.startLocationAddress
                ? `<br>${activeJourney.startLocationAddress}`
                : ""}

${activeJourney.startVerified
                ? `<br>✓ Verified Address`
                : ""}

<br><br>

<strong>🚗 Parking Memory:</strong><br>

${activeJourney.parkingLocation ||
            "No parking location saved yet."}

${activeJourney.parkingLocationAddress
                ? `<br>${activeJourney.parkingLocationAddress}`
                : ""}

${activeJourney.parkingVerified
                ? `<br>✓ Verified Address`
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
                            `
${item.thumbnail ? `
<img
    src="${item.thumbnail}"
    style="
        width:60px;
        height:auto;
        border-radius:8px;
        margin-right:8px;
        vertical-align:middle;
        cursor:pointer;
    "
>
` : ""}

${index + 1}. ${item.note ||
                            item.title ||
                            item.name ||
                            "Unnamed Photo"}
`
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

    requestEndJourney();
}

function showQuickJourneySummaryFromArrival() {

    showQuickJourneySummary();
}

function continueJourneyFromArrival() {

    const input =
        document.getElementById("questionInput");

    input.value = "";

    input.focus();

    input.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function getQuickSummaryEntranceNotes(journey) {

    const entranceTerms =
        /(entrance|lobby|front desk|rear|side door|door|elevator|stairs|floor|suite|office|check in|check-in)/i;

    return (journey?.notes || [])
        .filter(note => entranceTerms.test(note));
}

function getQuickSummaryAccessibilityNotes(journey) {

    const accessibilityTerms =
        /(accessible|accessibility|wheelchair|ramp|elevator|stairs|mobility|walker|cane|handicap|disabled)/i;

    const savedAccessibilityNotes =
        Array.isArray(journey?.accessibilityNotes)
            ? journey.accessibilityNotes
            : journey?.accessibilityNotes
                ? [journey.accessibilityNotes]
                : [];

    return [
        ...savedAccessibilityNotes,
        ...(journey?.notes || [])
            .filter(note => accessibilityTerms.test(note))
    ];
}

function addJourneyNoteFromQuickSummary() {

    const input =
        document.getElementById("questionInput");

    input.value = "save note: ";

    input.focus();

    input.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function showQuickSummaryPhotos() {

    const photos =
        activeJourney?.photos || [];

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>&#128247; Saved Photos</strong>

    <br><br>

    ${photos.length
                ? photos
                    .map((photo, index) => `
<div style="margin-bottom:12px;">
    <strong>&#128247; Photo ${index + 1}</strong>

    <br>

    ${photo.note || photo.title || photo.name || "Unnamed Photo"}

    ${photo.thumbnail
                        ? `
    <br><br>
    <img
        src="${photo.thumbnail}"
        style="
            max-width:120px;
            border-radius:8px;
            display:block;
        "
    >
    `
                        : ""}
</div>
`)
                    .join("")
                : "No saved photos for this journey yet."}

    <br><br>

    <button onclick="showQuickJourneySummary()">
        &larr; Back
    </button>
</div>
`;
}

function showQuickJourneySummary() {

    if (!activeJourney) {
        return;
    }

    const destinationAddress =
        activeJourney.verifiedDestinationAddress ||
        activeJourney.destinationAddress ||
        "";

    const entranceNotes =
        getQuickSummaryEntranceNotes(activeJourney);

    const accessibilityNotes =
        getQuickSummaryAccessibilityNotes(activeJourney);

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>&#129517; Quick Summary</strong>

    <br><br>

    <strong>&#128205; ${activeJourney.destination || "Destination"}</strong>

    ${destinationAddress
                ? `<br>${destinationAddress}`
                : ""}

    <br><br>

    <strong>Journey Memory</strong>

    <br><br>

    &#128247; Photos:
    ${activeJourney.photos?.length || 0}

    <br>

    &#128221; Notes:
    ${activeJourney.notes?.length || 0}

    <br>

    &#128682; Entrance Notes:
    ${entranceNotes.length}

    <br>

    &#9855; Accessibility Notes:
    ${accessibilityNotes.length}

    <br><br>

    <strong>Actions</strong>

    <br><br>

    <button onclick="openGoogleMapsToDestination()">
        &#128205; Open in Google Maps
    </button>

    <br><br>

    <button onclick="showQuickSummaryPhotos()">
        &#128247; View Photos
    </button>

    <br><br>

    <button onclick="addJourneyNoteFromQuickSummary()">
        &#10133; Add Note
    </button>

    <br><br>

    <button onclick="showArrivalMode()">
        &larr; Back
    </button>
</div>
`;
}

function getArrivalReturnButton() {

    const hasParking =
        Boolean(activeJourney?.parkingLocation);

    const hasStart =
        Boolean(activeJourney?.startLocation);

    if (hasParking && hasStart) {

        return `
<button onclick="openGoogleMapsToParkingLocation()">
    &#128260; Return To Start / Parking
</button>

<br><br>
`;
    }

    if (hasParking) {

        return `
<button onclick="openGoogleMapsToParkingLocation()">
    &#128663; Return To Parking
</button>

<br><br>
`;
    }

    if (hasStart) {

        return `
<button onclick="openGoogleMapsToStartLocation()">
    &#129517; Return To Start
</button>

<br><br>
`;
    }

    return "";
}

function showArrivalMode() {

    if (!activeJourney) {
        return;
    }

    document.getElementById("result").innerHTML = `
<div class="card">

    <strong>&#129517; Destination Reached</strong>

    <br><br>

    Glad you made it to:

    <br><br>

    <strong>${activeJourney.destination || "your destination"}</strong>

    <br><br>

    What would you like to do now?

    <br><br>

    <button onclick="showQuickJourneySummaryFromArrival()">
        &#129517; View Quick Summary
    </button>

    <br><br>

    ${getArrivalReturnButton()}

    <button onclick="continueJourneyFromArrival()">
        &#8617;&#65039; Continue Journey
    </button>

    <br><br>

    <button onclick="endJourneyFromArrival()">
        &#127937; End Journey
    </button>

</div>
`;
}
function startArrivalPhoto() {

    pendingPhotoMemory = true;

    document.getElementById("result").innerHTML = `
<div class="card">

    <strong>&#128247; Arrival Photo</strong>

    <br><br>

    Add a photo for this journey.

    <br><br>

    <label for="landmarkImage" class="photo-picker-button" role="button" tabindex="0" onkeydown="
if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    document.getElementById('landmarkImage').click();
}
">
        &#128247; Take Photo
    </label>

    <label for="landmarkImageLibrary" class="photo-picker-button" role="button" tabindex="0" onkeydown="
if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    document.getElementById('landmarkImageLibrary').click();
}
">
        &#128444;&#65039; Choose From Library
    </label>
</div>
`;
}
