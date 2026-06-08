
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

    I'll remember this with your most recent photo.
</div>
`;
}


