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

    <button
    id="saveJourneyButton"
    onclick="saveJourneyPhoto()"
>
    📷 Save To Journey
</button>
</div>
`;
}


async function saveJourneyPhoto() {

    const button =
        document.getElementById(
            "saveJourneyButton"
        );

    if (button) {

        button.disabled = true;

        button.style.opacity = "0.5";

        button.innerHTML =
            "⏳ Analyzing Photo...";
    }

    console.log(
        "ACTIVE JOURNEY BEFORE PHOTO:",
        activeJourney
    );

    if (!activeJourney) {

        activeJourney = {
            destination: "Photo Memory",
            startLocation: "",
            parkingLocation: "",
            appointments: [],
            staffInstructions: [],
            notes: [],
            medications: [],
            questionsForDoctor: [],
            directories: [],
            photos: [],
            timeline: []
        };

        console.log(
            "AUTO-CREATED JOURNEY FOR PHOTO"
        );
    }

    if (!landmarkImageData) {
        alert("No image data");
        return;
    }

    if (!activeJourney.photos) {
        activeJourney.photos = [];
    }

    console.log(
        "IMAGE SIZE:",
        landmarkImageData?.length
    );

    activeJourney.photos.push({
        timestamp: new Date().toLocaleString(),
        title: "",
        analysis: ""
    });

    activeJourney.timeline.push("📷 Photo Saved");

    console.log("STARTING PHOTO AI CALL");

    const response = await fetch("/api/askOurFlow", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            question:
                "Look at this image and suggest 3 short location or landmark names the user may want to remember. Return only simple numbered names. Do not include descriptions, explanations, dashes, or extra text.",
            destination: activeJourney?.destination || "",
            parkingLocation: activeJourney?.parkingLocation || "",
            startLocation: activeJourney?.startLocation || "",
            journeyStatus: activeJourney?.journeyStatus || "",
            landmarkImageData
        })
    });

    console.log("PHOTO RESPONSE RECEIVED");

    const data = await response.json();

    console.log("PHOTO JSON RECEIVED", data);

    console.log(
        "PHOTO AI RESPONSE:",
        data.answer
    );

    const lastPhoto =
        activeJourney.photos[
        activeJourney.photos.length - 1
        ];

    lastPhoto.analysis = data.answer;

    const suggestions = data.answer.match(
        /^\d+\.\s(.+)$/gm
    )?.map(
        line => line.replace(/^\d+\.\s/, "")
    ) || [];

    window.photoSuggestions = suggestions;

    pendingPhotoMemory = true;

    showActiveJourneyBox();

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📷 Photo Analyzed</strong>

    <br><br>

    ${data.answer}

    <br><br>

    <strong>
Choose a suggestion above, or click Enter Your Own Memory below.
</strong>
    <br><br>

    <br><br>

<button onclick="
const memory = prompt(
'Enter the memory you would like to save:'
);

if(memory){
    savePhotoMemory(memory);
}
">
    ✏ Enter Your Own Memory
</button>

<button onclick="savePhotoMemory(window.photoSuggestions[0])">
    1
</button>

<button onclick="savePhotoMemory(window.photoSuggestions[1])">
    2
</button>

<button onclick="savePhotoMemory(window.photoSuggestions[2])">
    3
</button>

    <br><br>

    Choose a suggestion above, or enter your own memory in Ask OurFlow.
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


    if (!activeJourney) {
        return;
    }

    const lastPhoto =
        activeJourney.photos[
        activeJourney.photos.length - 1
        ];

    const location = lastPhoto.note;

    if (!location) {
        return;
    }

    if (type === "parking") {

        pendingParkingLocation =
            location;

        verifyParkingLocation();

        return;
    }

    if (type === "start") {

        activeJourney.startLocation =
            location;

        const address = prompt(
            "Paste the verified starting address:"
        );

        if (address) {

            activeJourney.startLocationAddress =
                address;
        }

        activeJourney.timeline.push(
            "🧭 Starting Location Saved From Photo: " +
            location
        );
    }

    if (type === "both") {

        pendingParkingLocation =
            location;

        window.savePhotoAsBoth = true;

        verifyParkingLocation();

        return;
    }

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    showActiveJourneyBox();
}