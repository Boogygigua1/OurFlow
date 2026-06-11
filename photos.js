
function previewLandmarkImage() {

    const file =
        document.getElementById("landmarkImage")
            .files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

        landmarkImageData = e.target.result;

        document.getElementById("imagePreview")
            .innerHTML = `
<img
    src="${e.target.result}"
    style="
        max-width:300px;
        margin-top:10px;
        border-radius:10px;
    "
>
`;
    };

    reader.readAsDataURL(file);
}





async function analyzeLandmarkImage() {

    previewLandmarkImage();

    const file =
        document.getElementById("landmarkImage")
            .files[0];

    if (!file) return;

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📸 Photo Ready</strong>

    <br><br>

    Your image has been loaded.

    <br><br>

    <button onclick="saveJourneyPhoto()">
        📷 Save To Journey
    </button>
</div>
`;
}


async function saveJourneyPhoto() {

    if (!activeJourney || !landmarkImageData) {
        return;
    }

    if (!activeJourney.photos) {
        activeJourney.photos = [];
    }

    activeJourney.photos.push({
        image: landmarkImageData,
        timestamp: new Date().toLocaleString(),
        note: ""
    });

    activeJourney.timeline.push("📷 Photo Saved");

    const response = await fetch("/api/askOurFlow", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            question:
                "Look at this image and suggest 3 short memory options the user may want to save. Return simple numbered options only.",
            history: [],
            destination: activeJourney?.destination || "",
            parkingLocation: activeJourney?.parkingLocation || "",
            startLocation: activeJourney?.startLocation || "",
            journeyStatus: activeJourney?.journeyStatus || "",
            landmarkImageData
        })
    });

    const data = await response.json();

    pendingPhotoMemory = true;

    showActiveJourneyBox();

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📷 Photo Analyzed</strong>

    <br><br>

    ${data.answer}

    <br><br>

    What should I remember about this photo?

    <br><br>

    <button onclick="savePhotoMemory('Photo memory option 1')">
        Save Option 1
    </button>

    <br><br>

    <button onclick="savePhotoMemory('Photo memory option 2')">
        Save Option 2
    </button>

    <br><br>

    <button onclick="savePhotoMemory('Photo memory option 3')">
        Save Option 3
    </button>

    <br><br>

    Or type your own note below and press Ask OurFlow.
</div>
`;
}

function savePhotoMemory(note) {

    if (
        !activeJourney ||
        !activeJourney.photos ||
        activeJourney.photos.length === 0
    ) {
        return;
    }

    const lastPhoto =
        activeJourney.photos[activeJourney.photos.length - 1];

    lastPhoto.note = note;

    activeJourney.timeline.push(
        "📝 Photo Note Saved: " + note
    );

    pendingPhotoMemory = false;

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    showActiveJourneyBox();

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📷 Photo Note Saved</strong>

    <br><br>

    ${note}

    <br><br>

    I'll remember this with your most recent photo.<br><br>

<strong>
How should I use this location?
</strong>

<br><br>

<button onclick="savePhotoAsLocation('parking')">
    🚗 Save As Parking
</button>

<br><br>

<button onclick="savePhotoAsLocation('start')">
    🧭 Save As Start Location
</button>

<br><br>

<button onclick="savePhotoAsLocation('both')">
    🚗🧭 Save As Both
</button>

<br><br>

<button onclick="savePhotoClassification('verified')">
    📬 Save As Verified Location
</button>

<br><br>

<button onclick="savePhotoClassification('directory')">
    🏢 Save As Directory
</button>

<br><br>

<button onclick="
showActiveJourneyBox();
document.getElementById('questionInput').focus();
">
    ⬅ Continue Journey
</button>


</div>
`;
}

function savePhotoClassification(type) {

    if (!activeJourney) {
        return;
    }

    if (type === "verified") {

        const location = prompt(
            "What location should I verify from this photo?"
        );

        if (!location) {
            return;
        }

        activeJourney.verifiedDestinationAddress =
            location;

        activeJourney.destinationAddress =
            location;

        activeJourney.timeline.push(
            "📬 Verified Location From Photo: " +
            location
        );

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        showActiveJourneyBox();

        document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📬 Verified Location Saved</strong>

    <br><br>

    ${location}

    <br><br>

    Navigation will now use this location.
</div>
`;
    }

    if (type === "directory") {

        const directoryInfo = prompt(
            "What directory information should I save from this photo?"
        );

        if (!directoryInfo) {
            return;
        }

        if (!activeJourney.directories) {
            activeJourney.directories = [];
        }

        activeJourney.directories.push(
            directoryInfo
        );

        activeJourney.timeline.push(
            "🏢 Directory Saved From Photo: " +
            directoryInfo
        );

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        showActiveJourneyBox();

        document.getElementById("result").innerHTML = `
<div class="card">
    <strong>🏢 Directory Saved</strong>

    <br><br>

    ${directoryInfo}
</div>
`;
    }
}

function savePhotoAsLocation(type) {

    const location = prompt(
        "What location should I save from this photo?"
    );

    if (!location || !activeJourney) {
        return;
    }

    if (type === "parking") {

        activeJourney.parkingLocation =
            location;

        activeJourney.timeline.push(
            "🚗 Parking Saved From Photo: " +
            location
        );
    }

    if (type === "start") {

        activeJourney.startLocation =
            location;

        activeJourney.timeline.push(
            "🧭 Starting Location Saved From Photo: " +
            location
        );
    }

    if (type === "both") {

        activeJourney.parkingLocation =
            location;

        activeJourney.startLocation =
            location;

        activeJourney.timeline.push(
            "🚗🧭 Parking & Start Location Saved From Photo: " +
            location
        );
    }

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    showActiveJourneyBox();
}