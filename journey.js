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

function getJourneyRecoveryDestination() {

    const destination =
        activeJourney?.destinationDetail ||
        activeJourney?.destinationAddress ||
        activeJourney?.verifiedDestinationAddress ||
        activeJourney?.destination ||
        "";

    if (
        !destination ||
        destination === "Untitled Journey" ||
        destination === "Photo Memory"
    ) {
        return "Not set yet";
    }

    return destination;
}

function continueActiveJourneyFromRecovery() {

    if (!activeJourney) {
        return;
    }

    showActiveJourneyBox();

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>&#129517; Journey Active</strong>

    <br><br>

    Your current journey is still active.
</div>
`;
}

function showActiveJourneyRecoveryCard() {

    if (!activeJourney) {
        return;
    }

    const result =
        document.getElementById("result");

    if (!result) {
        return;
    }

    result.innerHTML = `
<div class="card">
    <strong>&#129517; Journey in Progress</strong>

    <br><br>

    You have an unfinished journey.

    <br><br>

    Destination:
    ${getJourneyRecoveryDestination()}

    <br><br>

    <button onclick="continueActiveJourneyFromRecovery()">
        &#129517; Continue Journey
    </button>

    <br><br>

    <button onclick="requestEndJourney()">
        &#127937; End Journey
    </button>

    <br><br>

    <button onclick="saveJourney()">
        &#128190; Save Journey
    </button>
</div>
`;
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
        returnToJourney();
        return;
    }

    window.journeyEndActionInProgress = false;

    result.innerHTML = `
<div class="card">
    <strong>&#127937; End Journey?</strong>

    <br><br>

    Choose how to close this journey:

    <br><br>

    <button onclick="saveAndEndJourney()">
        &#128190; Save &amp; End Journey
    </button>

    <br><br>

    <button onclick="saveAndKeepJourneyActive()">
        &#128221; Save / Keep Journey Active
    </button>

    <br><br>

    <button onclick="returnToJourney()">
        &#8617;&#65039; Return to Journey
    </button>

    <br><br>

    <button onclick="endJourneyWithoutSaving()">
        &#128465; End Journey Without Saving
    </button>
</div>
`;

    result.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
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

function saveAndKeepJourneyActive() {

    const result =
        document.getElementById("result");

    if (!activeJourney) {
        return false;
    }

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

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    window.journeySaveInProgress = false;
    window.journeyEndActionInProgress = false;

    showActiveJourneyBox();

    result.innerHTML = `
<div class="card">
    <strong>&#128190; Journey Saved</strong>

    <br><br>

    This journey was saved and is still active.

    <br><br>

    <button onclick="returnToJourney()">
        &#8617;&#65039; Return to Journey
    </button>
</div>
`;

    result.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    return true;
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
    <strong>&#127937; Journey Discarded</strong>

    <br><br>

    This journey was ended without saving.
</div>
`;

    const questionInput =
        document.getElementById("questionInput");

    if (questionInput) {
        questionInput.focus();
    }
}

function returnToJourney() {

    window.journeyEndActionInProgress = false;

    if (!activeJourney) {
        return;
    }

    showActiveJourneyBox();

    document.getElementById("result").innerHTML = "";

    const questionInput =
        document.getElementById("questionInput");

    if (questionInput) {
        questionInput.focus();
    }
}

showActiveJourneyRecoveryCard();

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

    details.innerHTML = `
<div class="journey-saved-detail">
    ${buildJourneySummary(journey)}

    ${buildJourneyPanel(
        "Saved Journey",
        [
            {
                label: "Started",
                value: journey.startTime
            },
            {
                label: "Ended",
                value: journey.endTime
            },
            {
                label: "Duration",
                value:
                    typeof journey.duration !== "undefined"
                        ? `${journey.duration || 0} minute(s)`
                        : ""
            }
        ]
    )}

    ${buildJourneyDestinationPanels(journey)}

    ${buildJourneyLocationPanel(journey, false)}

    ${buildJourneyMemorySections(journey)}

    ${buildJourneyEventSection(journey.timeline)}
</div>
`;

    details.style.display = "block";

    return;

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

${journey.startLocationAddress &&
            !journeyDisplayAlreadyIncludesAddress(
                journey.startLocation,
                journey.startLocationAddress
            )
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

function normalizeJourneyDisplayValue(value) {

    return String(value || "")
        .toLowerCase()
        .replace(/\./g, "")
        .replace(/,/g, "")
        .replace(/\bstreet\b/g, "st")
        .replace(/\bavenue\b/g, "ave")
        .replace(/\broad\b/g, "rd")
        .replace(/\bwest\b/g, "w")
        .replace(/\beast\b/g, "e")
        .replace(/\bnorth\b/g, "n")
        .replace(/\bsouth\b/g, "s")
        .replace(/\s+/g, " ")
        .trim();
}

function journeyDisplayAlreadyIncludesAddress(displayValue, addressValue) {

    const display =
        normalizeJourneyDisplayValue(displayValue);

    const address =
        normalizeJourneyDisplayValue(addressValue);

    return Boolean(
        display &&
        address &&
        display.includes(address)
    );
}

function buildJourneyRows(rows) {

    const seenValues =
        new Set();

    const visibleRows =
        rows.filter(row => {

            if (!row.value) {
                return false;
            }

            const normalizedValue =
                normalizeJourneyDisplayValue(row.value);

            if (seenValues.has(normalizedValue)) {
                return false;
            }

            seenValues.add(normalizedValue);

            return true;
        });

    if (!visibleRows.length) {
        return "";
    }

    return visibleRows
        .map(row => `
<div class="journey-info-row">
    <span>${row.label}</span>
    <strong>${row.value}</strong>
</div>
`)
        .join("");
}

function buildJourneyPanel(title, rows) {

    const sectionKey =
        arguments.length > 2
            ? arguments[2]
            : "";

    const html =
        buildJourneyRows(rows);

    if (!html) {
        return "";
    }

    return `
<section class="journey-panel"${sectionKey ? ` data-journey-section="${sectionKey}"` : ""}>
    <h3>${title}</h3>
    ${html}
</section>
`;
}

function hasInsideDestinationDetails(journey) {

    return Boolean(
        journey?.destinationBuilding ||
        journey?.destinationDepartmentOffice ||
        journey?.destinationRoomSuite ||
        journey?.destinationInternalLocation ||
        journey?.destinationEntrance ||
        journey?.destinationFloor ||
        journey?.destinationContactPerson ||
        journey?.destinationPhone ||
        journey?.destinationEmail ||
        journey?.destinationCampusZip ||
        journey?.destinationInsideNotes ||
        journey?.destinationDirectoryNote
    );
}

function buildInsideDestinationAction(journey) {

    const label =
        hasInsideDestinationDetails(journey)
            ? "Edit Inside Destination Details"
            : "Add Inside Destination Details";

    return `
<div class="journey-secondary-actions">
    <button onclick="promptDestinationInternalDetails()">
        🏢 ${label}
    </button>
</div>
`;
}

function buildInsideDestinationPanel(journey, includeAction = false) {

    const rowsHtml =
        buildJourneyRows([
            {
                label: "Building",
                value: journey?.destinationBuilding
            },
            {
                label: "Department",
                value: journey?.destinationDepartmentOffice
            },
            {
                label: "Room",
                value: getCleanRoomSuite(journey)
            },
            {
                label: "Floor",
                value: journey?.destinationFloor
            },
            {
                label: "Entrance",
                value: journey?.destinationEntrance
            },
            {
                label: "Contact",
                value: journey?.destinationContactPerson
            },
            {
                label: "Phone",
                value: journey?.destinationPhone
            },
            {
                label: "Email",
                value: journey?.destinationEmail
            },
            {
                label: "Campus ZIP",
                value: journey?.destinationCampusZip
            }
        ]);

    if (!rowsHtml && !includeAction) {
        return "";
    }

    return `
<section class="journey-panel" data-journey-section="insideDestination">
    <h3>Inside Destination</h3>
    ${rowsHtml}
    ${includeAction ? buildInsideDestinationAction(journey) : ""}
</section>
`;
}

function getJourneySectionTarget(arrayName) {

    const targets = {
        notes: "notes",
        staffInstructions: "reminders",
        questionsForDoctor: "questions",
        medications: "medications",
        appointments: "appointments",
        directories: "peoplePlace",
        photos: "photos"
    };

    return targets[arrayName] || "";
}

function focusActiveJourneySection(sectionKey) {

    if (!sectionKey) {
        return;
    }

    if (typeof document.querySelector !== "function") {
        return;
    }

    const section =
        document.querySelector(
            `[data-journey-section="${sectionKey}"]`
        );

    if (!section) {
        return;
    }

    if (
        section.tagName &&
        section.tagName.toLowerCase() === "details"
    ) {
        section.open = true;
    }

    section.classList.add(
        "journey-section-highlight"
    );

    section.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    setTimeout(() => {
        section.classList.remove(
            "journey-section-highlight"
        );
    }, 1800);
}

function isActiveJourneyCurrentlyVisible() {

    const activeJourneyBox =
        document.getElementById("activeJourneyBox");

    if (
        !activeJourneyBox ||
        typeof activeJourneyBox.getBoundingClientRect !== "function"
    ) {
        return false;
    }

    const rect =
        activeJourneyBox.getBoundingClientRect();

    const viewportHeight =
        window.innerHeight ||
        document.documentElement?.clientHeight ||
        0;

    return Boolean(
        viewportHeight &&
        rect.bottom > 0 &&
        rect.top < viewportHeight
    );
}

function getJourneyDestinationLabel(journey) {

    return (
        journey?.destinationName ||
        journey?.destination ||
        journey?.destinationDetail ||
        "Not set yet"
    );
}

function getJourneyOriginalDestination(journey) {

    const original =
        journey?.originalDestinationRequest ||
        journey?.destinationDetail ||
        "";

    if (
        original &&
        normalizeJourneyDisplayValue(original) !==
            normalizeJourneyDisplayValue(getJourneyDestinationLabel(journey))
    ) {
        return original;
    }

    return "";
}

function getJourneyVerifiedDestination(journey) {

    return (
        journey?.verifiedDestinationAddress ||
        journey?.destinationAddress ||
        ""
    );
}

function getCleanArrivalGuidance(journey) {

    const guidance =
        String(journey?.arrivalTips || "").trim();

    const verifiedDestination =
        getJourneyVerifiedDestination(journey);

    if (!guidance || !verifiedDestination) {
        return guidance
            .split(/\n+/)
            .map(extractDisplayArrivalGuidance)
            .filter(Boolean)
            .join("\n");
    }

    return guidance
        .split(/\n+/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(extractDisplayArrivalGuidance)
        .filter(Boolean)
        .filter(line => !(
            journeyDisplayAlreadyIncludesAddress(
                line,
                verifiedDestination
            ) ||
            journeyDisplayAlreadyIncludesAddress(
                verifiedDestination,
                line
            )
        ))
        .join("\n");
}

function extractDisplayArrivalGuidance(value) {

    const text =
        String(value || "").trim();

    if (!text) {
        return "";
    }

    const guidanceMatch =
        text.match(/\b(need to use [^.!?\n]*(?:elevator|stairs|entrance|door|hallway|hall|corridor)|use [^.!?\n]*(?:elevator|stairs|entrance|door|hallway|hall|corridor)|turn left|turn right|continue straight|go straight|walk straight|take the elevator|take elevator|take the stairs|take stairs|use the [^.!?\n]*entrance|use [^.!?\n]*entrance|enter through|go past|walk past|head past|turn at|go through|walk through|follow [^.!?\n]*|look for [^.!?\n]*)\b[\s\S]*/i);

    if (guidanceMatch) {
        return guidanceMatch[0]
            .trim()
            .replace(/^[,;:\s]+/, "");
    }

    return "";
}

function getCleanRoomSuite(journey) {

    const room =
        String(journey?.destinationRoomSuite || "").trim();

    if (!room) {
        return "";
    }

    const normalizedRoom =
        normalizeJourneyDisplayValue(room);

    const normalizedDepartment =
        normalizeJourneyDisplayValue(
            journey?.destinationDepartmentOffice
        );

    if (
        normalizedDepartment &&
        (
            normalizedRoom === normalizedDepartment ||
            normalizedRoom === `${normalizedDepartment} department` ||
            normalizedRoom.includes(normalizedDepartment)
        )
    ) {
        return "";
    }

    const looksLikeRoom =
        /\b(room|suite)\s+[a-z0-9-]+\b/i.test(room) ||
        /\b[A-Z]{2,}\s*-?\s*\d{2,4}[A-Z]?\b/.test(room);

    return looksLikeRoom
        ? room
        : "";
}

function getJourneyParkingDisplay(journey) {

    return (
        journey?.parkingLocation ||
        journey?.parkingDescription ||
        journey?.verifiedParkingAddress ||
        journey?.parkingLocationAddress ||
        journey?.parkingAddress ||
        ""
    );
}

function getJourneyParkingAddressLine(journey) {

    const display =
        getJourneyParkingDisplay(journey);

    const address =
        journey?.verifiedParkingAddress ||
        journey?.parkingLocationAddress ||
        journey?.parkingAddress ||
        "";

    if (
        address &&
        !journeyDisplayAlreadyIncludesAddress(display, address)
    ) {
        return address;
    }

    return "";
}

function getJourneyStartDisplay(journey) {

    return (
        journey?.startLocation ||
        journey?.verifiedStartAddress ||
        journey?.startLocationAddress ||
        journey?.startAddress ||
        ""
    );
}

function getJourneyStartAddressLine(journey) {

    const display =
        getJourneyStartDisplay(journey);

    const address =
        journey?.verifiedStartAddress ||
        journey?.startLocationAddress ||
        journey?.startAddress ||
        "";

    if (
        address &&
        !journeyDisplayAlreadyIncludesAddress(display, address)
    ) {
        return address;
    }

    return "";
}

function buildJourneySummary(journey) {

    return `
<section class="journey-summary-grid" aria-label="Journey summary">
    <div>
        <span>Destination</span>
        <strong>${getJourneyDestinationLabel(journey)}</strong>
    </div>
    <div>
        <span>Journey Started</span>
        <strong>${journey?.startTime || "In progress"}</strong>
    </div>
    <div>
        <span>Parking Saved</span>
        <strong>${getJourneyParkingDisplay(journey) ? "Yes" : "No"}</strong>
    </div>
    <div>
        <span>Verified Destination</span>
        <strong>${getJourneyVerifiedDestination(journey) ? "Yes" : "No"}</strong>
    </div>
</section>
`;
}

function buildActiveJourneyActions(journey) {

    const verifyLabel =
        getJourneyVerifiedDestination(journey)
            ? "✅ Location Verified"
            : "📍 Verify Destination";

    return `
<div class="journey-primary-actions" aria-label="Primary journey actions">
    <button onclick="verifySavedLocation()">
        ${verifyLabel}
    </button>
    <button onclick="openGoogleMapsForJourney()">
        🗺 Open Map
    </button>
    <button onclick="requestEndJourney()">
        🏁 End Journey
    </button>
</div>
`;
}

function buildJourneyDestinationPanels(journey) {

    return [
        buildJourneyPanel(
            "Destination",
            [
                {
                    label: "Original request",
                    value: getJourneyOriginalDestination(journey)
                },
                {
                    label: "Verified map address",
                    value: getJourneyVerifiedDestination(journey)
                }
            ],
            "destination"
        ),
        buildInsideDestinationPanel(
            journey,
            journey === activeJourney
        ),
        buildJourneyPanel(
            "Arrival Guidance",
            [
                {
                    label: "Navigation clues",
                    value: getCleanArrivalGuidance(journey)
                }
            ],
            "arrivalGuidance"
        )
    ]
        .filter(Boolean)
        .join("");
}

function buildJourneyLocationPanel(journey, includeActions = false) {

    const parkingDisplay =
        getJourneyParkingDisplay(journey);

    const startDisplay =
        getJourneyStartDisplay(journey);

    const parkingValue =
        [
            parkingDisplay,
            getJourneyParkingAddressLine(journey),
            journey?.parkingVerified ? "✓ Verified Address" : ""
        ]
            .filter(Boolean)
            .join("<br>");

    const startValue =
        [
            startDisplay,
            getJourneyStartAddressLine(journey),
            journey?.startVerified ? "✓ Verified Address" : ""
        ]
            .filter(Boolean)
            .join("<br>");

    const panel =
        buildJourneyPanel(
            "Journey Locations",
            [
                {
                    label: "Starting Location",
                    value: startValue
                },
                {
                    label: "Parking Memory",
                    value: parkingValue
                }
            ],
            "journeyLocations"
        );

    if (!panel) {
        return "";
    }

    const actionHtml =
        includeActions
            ? `
<div class="journey-secondary-actions">
    ${parkingDisplay
                ? `<button onclick="openGoogleMapsToParkingLocation()">🚗 Return To Parking</button>`
                : ""}
    ${startDisplay
                ? `<button onclick="openGoogleMapsToStartLocation()">🧭 Return To Start</button>`
                : ""}
</div>
`
            : "";

    return panel + actionHtml;
}

function buildJourneyListItems(items) {

    return items
        .map((item, index) => `
<li>
    <span>${index + 1}.</span>
    <span>${item}</span>
</li>
`)
        .join("");
}

function getJourneyEventParts(event) {

    if (
        event &&
        typeof event === "object"
    ) {
        const text =
            event.text ||
            event.message ||
            event.value ||
            event.description ||
            "";

        return {
            timestamp:
                event.timestamp ||
                event.time ||
                event.createdAt ||
                event.date ||
                "",
            type:
                event.type ||
                event.category ||
                event.label ||
                "",
            text:
                text ||
                JSON.stringify(event)
        };
    }

    const text =
        String(event || "").trim();

    const typeMatch =
        text.match(/^([^:]{2,40}):\s*(.+)$/);

    return {
        timestamp: "",
        type: typeMatch ? typeMatch[1].trim() : "",
        text: typeMatch ? typeMatch[2].trim() : text
    };
}

function buildJourneyEventItems(events) {

    return events
        .map((event, index) => {

            const parts =
                getJourneyEventParts(event);

            const meta =
                [
                    parts.timestamp,
                    parts.type
                ]
                    .filter(Boolean)
                    .join(" • ");

            return `
<li>
    <span>${index + 1}.</span>
    <span>
        ${meta ? `<strong>${meta}</strong><br>` : ""}
        ${parts.text}
    </span>
</li>
`;
        })
        .join("");
}

function buildJourneyEventSection(events) {

    if (!events || !events.length) {
        return "";
    }

    return `
<details class="journey-compact-section" data-journey-section="events">
    <summary aria-label="Events, ${events.length} item${events.length === 1 ? "" : "s"}. Tap to expand.">
        <span>Events</span>
        <span>${events.length}</span>
    </summary>
    <ol>
        ${buildJourneyEventItems(events)}
    </ol>
</details>
`;
}

function buildJourneyPhotoItems(photos) {

    return photos
        .map((photo, index) => `
<li>
    ${photo.thumbnail
                ? `
<img
    src="${photo.thumbnail}"
    alt=""
    class="journey-photo-thumb"
>
`
                : ""}
    <span>
        ${index + 1}.
        ${photo.note || photo.title || photo.name || "Unnamed Photo"}
    </span>
</li>
`)
        .join("");
}

function buildJourneyMemorySection(title, items, options = {}) {

    if (!items || !items.length) {
        return "";
    }

    const visibleItems =
        items.slice(-5);

    const itemHtml =
        options.type === "photos"
            ? buildJourneyPhotoItems(visibleItems)
            : buildJourneyListItems(visibleItems);

    return `
<details class="journey-compact-section"${options.sectionKey ? ` data-journey-section="${options.sectionKey}"` : ""}>
    <summary aria-label="${title}, ${items.length} item${items.length === 1 ? "" : "s"}. Tap to expand.">
        <span>${title}</span>
        <span>${items.length}</span>
    </summary>
    <ol>
        ${itemHtml}
    </ol>
</details>
`;
}

function isGeneratedDestinationSummary(item) {

    const text =
        String(item || "");

    const normalized =
        normalizeJourneyDisplayValue(text);

    return Boolean(
        text.includes(" | ") &&
        (
            normalized.includes("inside destination") ||
            normalized.includes("department / office") ||
            normalized.includes("room / suite") ||
            normalized.includes("campus zip")
        )
    );
}

function getDisplayDirectories(journey) {

    const structuredValues =
        [
            journey?.destinationBuilding,
            journey?.destinationDepartmentOffice,
            journey?.destinationRoomSuite,
            journey?.destinationEntrance,
            journey?.destinationFloor,
            journey?.destinationContactPerson,
            journey?.destinationPhone,
            journey?.destinationEmail,
            journey?.destinationInsideNotes,
            journey?.destinationDirectoryNote
        ]
            .filter(Boolean)
            .map(normalizeJourneyDisplayValue);

    return (journey?.directories || [])
        .filter(item => {

            if (isGeneratedDestinationSummary(item)) {
                return false;
            }

            const normalizedItem =
                normalizeJourneyDisplayValue(item);

            return !structuredValues.includes(normalizedItem);
        });
}

function buildJourneyMemorySections(journey) {

    return [
        buildJourneyMemorySection(
            "Notes",
            journey?.notes,
            { sectionKey: "notes" }
        ),
        buildJourneyMemorySection(
            "Reminders",
            journey?.staffInstructions,
            { sectionKey: "reminders" }
        ),
        buildJourneyMemorySection(
            "Questions",
            journey?.questionsForDoctor,
            { sectionKey: "questions" }
        ),
        buildJourneyMemorySection(
            "Medications",
            journey?.medications,
            { sectionKey: "medications" }
        ),
        buildJourneyMemorySection(
            "Appointments",
            journey?.appointments,
            { sectionKey: "appointments" }
        ),
        buildJourneyMemorySection(
            "People & Place Details",
            getDisplayDirectories(journey),
            { sectionKey: "peoplePlace" }
        ),
        buildJourneyMemorySection(
            "Photos",
            journey?.photos,
            {
                type: "photos",
                sectionKey: "photos"
            }
        )
    ]
        .filter(Boolean)
        .join("");
}


function showActiveJourneyBox(targetSectionKey = "") {

    const result =
        document.getElementById("activeJourneyBox");

    if (!activeJourney) {
        return;
    }

    const shouldFocusTarget =
        targetSectionKey &&
        isActiveJourneyCurrentlyVisible();

    result.innerHTML = `
<div class="card journey-active-card">
    <div class="journey-card-header">
        <strong>🧭 Active Journey</strong>
    </div>

    ${buildJourneySummary(activeJourney)}

    ${buildActiveJourneyActions(activeJourney)}

    ${buildJourneyDestinationPanels(activeJourney)}

    ${buildJourneyLocationPanel(activeJourney, true)}

    ${buildJourneyMemorySections(activeJourney)}

    <div class="journey-secondary-actions">
        <button onclick="saveJourney()">
            💾 Save Journey
        </button>
    </div>
</div>
`;

    if (shouldFocusTarget) {
        setTimeout(() => {
            focusActiveJourneySection(targetSectionKey);
        }, 150);
    }

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    return;

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

<button onclick="requestEndJourney()">
    &#127937; End Journey
</button>

<br><br>

${window.showJourneyInfo ? `

<strong>Destination:</strong><br>
${activeJourney.destinationName ||
            activeJourney.destination ||
            "No destination saved yet."}

${activeJourney.verifiedDestinationAddress
                ? `<br>✓ Verified map destination: ${activeJourney.verifiedDestinationAddress}`
                : ""}

${activeJourney.destinationInternalLocation ||
            activeJourney.destinationBuilding ||
            activeJourney.destinationDepartmentOffice ||
            activeJourney.destinationRoomSuite ||
            activeJourney.destinationEntrance ||
            activeJourney.destinationFloor ||
            activeJourney.destinationContactPerson ||
            activeJourney.destinationPhone ||
            activeJourney.destinationEmail ||
            activeJourney.destinationInsideNotes
                ? `
<br><br>
<strong>Inside Destination Details:</strong><br>
${[
                    activeJourney.destinationBuilding
                        ? "Building: " +
                        activeJourney.destinationBuilding
                        : "",
                    activeJourney.destinationDepartmentOffice
                        ? "Department / Office: " +
                        activeJourney.destinationDepartmentOffice
                        : "",
                    activeJourney.destinationRoomSuite
                        ? "Room / Suite: " +
                        activeJourney.destinationRoomSuite
                        : "",
                    activeJourney.destinationEntrance
                        ? "Entrance: " +
                        activeJourney.destinationEntrance
                        : "",
                    activeJourney.destinationFloor
                        ? "Floor: " +
                        activeJourney.destinationFloor
                        : "",
                    activeJourney.destinationContactPerson
                        ? "Contact Person: " +
                        activeJourney.destinationContactPerson
                        : "",
                    activeJourney.destinationPhone
                        ? "Phone: " +
                        activeJourney.destinationPhone
                        : "",
                    activeJourney.destinationEmail
                        ? "Email: " +
                        activeJourney.destinationEmail
                        : "",
                    activeJourney.destinationInsideNotes
                        ? "Notes: " +
                        activeJourney.destinationInsideNotes
                        : ""
                ].filter(Boolean).join("<br>")}
`
                : ""}

${activeJourney.destinationDirectoryNote ||
            activeJourney.destinationSourceUrl ||
            activeJourney.destinationCampusZip
                ? `
<br><br>
<strong>Directory note:</strong><br>
${[
                    activeJourney.destinationDirectoryNote,
                    activeJourney.destinationCampusZip
                        ? "Campus ZIP: " +
                        activeJourney.destinationCampusZip
                        : "",
                    activeJourney.destinationSourceUrl
                        ? "Source: " +
                        activeJourney.destinationSourceUrl
                        : ""
                ].filter(Boolean).join("<br>")}
`
                : ""}

<br><br>

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

${activeJourney.startLocationAddress &&
            !journeyDisplayAlreadyIncludesAddress(
                activeJourney.startLocation,
                activeJourney.startLocationAddress
            )
                ? `<br>${activeJourney.startLocationAddress}`
                : ""}

${activeJourney.startVerified
                ? `<br>✓ Verified Address`
                : ""}

<br><br>

<strong>🚗 Parking Memory:</strong><br>

${activeJourney.parkingLocation ||
            activeJourney.parkingDescription ||
            activeJourney.verifiedParkingAddress ||
            activeJourney.parkingLocationAddress ||
            activeJourney.parkingAddress ||
            "No parking location saved yet."}

${activeJourney.parkingLocationAddress &&
            !journeyDisplayAlreadyIncludesAddress(
                activeJourney.parkingLocation ||
                activeJourney.parkingDescription ||
                activeJourney.verifiedParkingAddress ||
                activeJourney.parkingAddress,
                activeJourney.parkingLocationAddress
            )
                ? `<br>${activeJourney.parkingLocationAddress}`
                : ""}

${activeJourney.parkingVerified
                ? `<br>✓ Verified Address`
                : ""}
     
${activeJourney.parkingLocation ||
            activeJourney.parkingDescription ||
            activeJourney.verifiedParkingAddress ||
            activeJourney.parkingLocationAddress ||
            activeJourney.parkingAddress
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
