
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


function saveJourneyPhoto() {

    if (!activeJourney || !landmarkImageData) {
        return;
    }

    if (!activeJourney.photos) {
        activeJourney.photos = [];
    }

    activeJourney.photos.push({
        image: landmarkImageData,
        timestamp: new Date().toLocaleString()
    });

    activeJourney.timeline.push(
        "📷 Photo Saved"
    );

    showActiveJourneyBox();

    alert("📷 Photo saved to this journey.");
}



