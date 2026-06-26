function escapeOrientationHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getOrientationDestination(journey) {

    return {
        name:
            journey?.destination ||
            "Destination",
        detail:
            journey?.destinationDetail || "",
        verifiedAddress:
            journey?.verifiedDestinationAddress || "",
        address:
            journey?.destinationAddress || ""
    };
}

function getOrientationPhotos(journey) {

    return (journey?.photos || [])
        .filter(photo =>
            photo?.thumbnail ||
            photo?.note ||
            photo?.title ||
            photo?.name
        );
}

function getOrientationDirectoryInfo(journey) {

    return journey?.directories || [];
}

function getOrientationNotes(journey) {

    return journey?.notes || [];
}

function getOrientationEntranceInfo(journey) {

    const entranceTerms =
        /(entrance|lobby|front desk|rear|side door|door|elevator|stairs|floor|suite|office|check in|check-in)/i;

    return getOrientationNotes(journey)
        .filter(note => entranceTerms.test(note));
}

function getOrientationAccessibilityInfo(journey) {

    const accessibilityNotes =
        journey?.accessibilityNotes || [];

    const accessibilityTerms =
        /(accessible|accessibility|wheelchair|ramp|elevator|stairs|mobility|walker|cane|handicap|disabled)/i;

    const noteMatches =
        getOrientationNotes(journey)
            .filter(note => accessibilityTerms.test(note));

    return [
        ...accessibilityNotes,
        ...noteMatches
    ];
}

function renderOrientationList(items) {

    if (!items || items.length === 0) {
        return "";
    }

    return items
        .map(item =>
            `&bull; ${escapeOrientationHtml(item)}`
        )
        .join("<br>");
}

function renderOrientationPhotos(photos) {

    if (!photos || photos.length === 0) {
        return "";
    }

    return photos
        .slice(-3)
        .map((photo, index) => {
            const title =
                photo.note ||
                photo.title ||
                photo.name ||
                `Photo ${index + 1}`;

            return `
<div style="margin-bottom:12px;">
    <strong>${escapeOrientationHtml(title)}</strong>

    ${photo.thumbnail
                    ? `
    <br><br>
    <img
        src="${escapeOrientationHtml(photo.thumbnail)}"
        style="
            max-width:120px;
            border-radius:8px;
            display:block;
        "
    >
    `
                    : ""}
</div>
`;
        })
        .join("");
}

function renderOrientationSection(title, content) {

    if (!content) {
        return "";
    }

    return `
<br>
<strong>${title}</strong>

<br><br>

${content}

<br>
`;
}

function focusOrientationNoteInput(prefix) {

    const input =
        document.getElementById("questionInput");

    if (!input) {
        return;
    }

    input.value =
        prefix || "save note: ";

    input.focus();

    input.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function showOrientationPhotos() {

    const result =
        document.getElementById("result");

    const photos =
        getOrientationPhotos(activeJourney);

    result.innerHTML = `
<div class="card">
    <strong>&#128247; Saved Photos</strong>

    <br><br>

    ${photos.length
                ? renderOrientationPhotos(photos)
                : "No saved photos for this journey yet."}

    <br><br>

    <button onclick="showOrientationHub()">
        Back to Orientation Hub
    </button>
</div>
`;
}

function renderOrientationActions(photos) {

    return `
<br><br>

<strong>Orientation Actions</strong>

<br><br>

${photos.length
            ? `
<button onclick="showOrientationPhotos()">
    &#128247; View Photos
</button>

<br><br>
`
            : ""}

<button onclick="openGoogleMapsToDestination()">
    &#129517; Open Destination in Google Maps
</button>

<br><br>

<button onclick="focusOrientationNoteInput('save note: ')">
    &#128221; Add Journey Note
</button>

<br><br>

<button onclick="focusOrientationNoteInput('save note: Entrance: ')">
    &#128682; Add Entrance Note
</button>

<br><br>

<button onclick="focusOrientationNoteInput('save note: Accessibility: ')">
    &#9855; Add Accessibility Note
</button>
`;
}

function showOrientationHub() {

    const result =
        document.getElementById("result");

    if (!activeJourney) {
        result.innerHTML = `
<div class="card">
    <strong>Orientation Hub</strong>

    <br><br>

    No active journey is available yet.
</div>
`;
        return;
    }

    const destination =
        getOrientationDestination(activeJourney);

    const photos =
        getOrientationPhotos(activeJourney);

    const entranceInfo =
        getOrientationEntranceInfo(activeJourney);

    const directoryInfo =
        getOrientationDirectoryInfo(activeJourney);

    const accessibilityInfo =
        getOrientationAccessibilityInfo(activeJourney);

    const notes =
        getOrientationNotes(activeJourney);

    const sections = [
        renderOrientationSection(
            "Saved Photos",
            renderOrientationPhotos(photos)
        ),
        renderOrientationSection(
            "Entrance / Arrival Clues",
            renderOrientationList(entranceInfo)
        ),
        renderOrientationSection(
            "Directory Information",
            renderOrientationList(directoryInfo)
        ),
        renderOrientationSection(
            "Accessibility Notes",
            renderOrientationList(accessibilityInfo)
        ),
        renderOrientationSection(
            "Journey Notes",
            renderOrientationList(notes)
        )
    ].join("");

    const hasOrientationContext =
        sections.trim().length > 0;

    result.innerHTML = `
<div class="card">
    <strong>&#129517; Orientation Hub</strong>

    <br><br>

    Here's what I already know about this place:

    <br><br>

    <strong>${escapeOrientationHtml(destination.name)}</strong>

    ${destination.detail &&
                destination.detail !== destination.name
                ? `<br>${escapeOrientationHtml(destination.detail)}`
                : ""}

    <br><br>

    ${destination.verifiedAddress
                ? `
    <strong>Verified Address:</strong><br>
    ${escapeOrientationHtml(destination.verifiedAddress)}
    `
                : ""}

    ${hasOrientationContext
                ? sections
                : ""}

    ${renderOrientationActions(photos)}

    <br><br>

    <button onclick="showArrivalMode()">
        Back to Arrival
    </button>
</div>
`;
}
