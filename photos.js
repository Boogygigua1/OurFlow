function getSelectedLandmarkFile(input) {

    if (input?.files?.[0]) {
        return input.files[0];
    }

    return (
        document.getElementById("landmarkImage")
            ?.files?.[0] ||
        document.getElementById("landmarkImageLibrary")
            ?.files?.[0]
    );
}

function previewLandmarkImage(input) {

    const file =
        getSelectedLandmarkFile(input);

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

        landmarkImageData = e.target.result;

        const img = new Image();

        img.onload = function () {

            const canvas =
                document.createElement("canvas");

            const ctx =
                canvas.getContext("2d");

            const width = 100;

            const scale =
                width / img.width;

            canvas.width = width;

            canvas.height =
                img.height * scale;

            ctx.drawImage(
                img,
                0,
                0,
                canvas.width,
                canvas.height
            );

            landmarkThumbnailData =
                canvas.toDataURL(
                    "image/jpeg",
                    0.6
                );
        };

        img.src = e.target.result;

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


async function analyzeLandmarkImage(input) {


    previewLandmarkImage(input);


    const file =
        getSelectedLandmarkFile(input);

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

    document.getElementById("result").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function showPhotoSavedCard() {

    const lastPhoto =
        activeJourney?.photos?.[
        activeJourney.photos.length - 1
        ];

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>📷 Photo Saved</strong>

    <br><br>

    ${lastPhoto?.thumbnail
                ? `
    <img
        src="${lastPhoto.thumbnail}"
        style="
            max-width:160px;
            border-radius:8px;
            display:block;
            margin-bottom:12px;
        "
    >
    `
                : ""}

    Saved to this journey.

    <br><br>

    <button onclick="analyzeSavedJourneyPhoto()">
        🔍 Analyze Photo
    </button>

    <br><br>

    <button onclick="
const memory = prompt(
'Enter the memory you would like to save:'
);

if(memory){
    savePhotoMemory(memory);
}
">
        📝 Add Memory
    </button>

    <br><br>

    <button onclick="
showActiveJourneyBox();
document.getElementById('questionInput').focus();
">
        ➡ Continue Journey
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
            "Saving Photo...";
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

        markActiveJourneyContext("new");

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
        analysis: "",
        thumbnail: landmarkThumbnailData
    });

    console.log(
        "THUMBNAIL LENGTH:",
        landmarkThumbnailData.length
    );
    
    activeJourney.timeline.push("📷 Photo Saved");

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    showActiveJourneyBox();

    showPhotoSavedCard();

}

async function analyzeSavedJourneyPhotoLegacy() {

    if (
        !activeJourney ||
        !activeJourney.photos ||
        activeJourney.photos.length === 0
    ) {
        alert("No saved photo to analyze.");
        return;
    }

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Analyzing Photo...</strong>

    <br><br>

    Looking for useful location clues.
</div>
`;

    console.log("STARTING PHOTO AI CALL");

    const response = await fetch("/api/askOurFlow", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(
            buildOurFlowPayload(
                "Look at this image and suggest 3 short practical location memories the user may want to remember. Read all visible signs, names, numbers, suite numbers, building names, landmarks, and notices. Group related visible clues into one useful memory, such as building or place name + number + distinguishing landmark or notice. Do not return a standalone number unless no other useful text is visible. Do not split related clues into unrelated choices. Return only a simple numbered list of memory names, with no explanations.",
                {
                    injectJourneyContext: true
                }
            )
        )
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

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

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
Choose a suggestion above, or click Enter Your Own Memory.
</strong>
    <br><br>

<button onclick="savePhotoMemory(window.photoSuggestions[0])">
    1
</button>

<button onclick="savePhotoMemory(window.photoSuggestions[1])">
    2
</button>

<button onclick="savePhotoMemory(window.photoSuggestions[2])">
    3
</button>

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
    <br><br>
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

<button onclick="savePhotoAsLocation('destination')">
    &#128205; Save As Destination
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

        const lastPhoto =
            activeJourney.photos?.[
            activeJourney.photos.length - 1
            ];

        const savedPhotoText =
            (
                lastPhoto?.note ||
                lastPhoto?.title ||
                lastPhoto?.name ||
                ""
            ).trim();

        const directoryInfo =
            savedPhotoText ||
            prompt(
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
    <strong>🏢 Directory Info Saved</strong>

    <br><br>

    ${directoryInfo}
</div>
`;
    }
}

function savePhotoAsLocationLegacy(type) {


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

        activeJourney.parkingLocation =
            location;

        activeJourney.parkingVerified =
            Boolean(activeJourney.parkingLocationAddress);

        activeJourney.timeline.push(
            "Parking Saved From Photo: " +
            location
        );

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        showActiveJourneyBox();

        document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Parking Saved</strong>

    <br><br>

    ${location}
</div>
`;

        return;
    }

    if (type === "start") {

        activeJourney.startLocation =
            location;

        activeJourney.timeline.push(
            "Starting Location Saved From Photo: " +
            location
        );

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        showActiveJourneyBox();

        document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Start Location Saved</strong>

    <br><br>

    ${location}
</div>
`;

        return;
    }

    if (type === "both") {

        activeJourney.parkingLocation =
            location;

        activeJourney.parkingVerified =
            Boolean(activeJourney.parkingLocationAddress);

        activeJourney.startLocation =
            location;

        activeJourney.startVerified =
            Boolean(activeJourney.startLocationAddress);

        activeJourney.timeline.push(
            "Parking + Start Location Saved From Photo: " +
            location
        );

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        showActiveJourneyBox();

        document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Parking + Start Location Saved</strong>

    <br><br>

    ${location}
</div>
`;

        return;
    }

    if (type === "destination") {

        activeJourney.destination =
            location;

        activeJourney.destinationDetail =
            location;

        activeJourney.timeline.push(
            "Destination Saved From Photo: " +
            location
        );

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        showActiveJourneyBox();

        document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Destination Saved</strong>

    <br><br>

    ${location}
</div>
`;

        return;
    }
}

function extractVerifiedAddressFromPhotoLocation(location) {

    const text =
        String(location || "").trim();

    if (!text) {
        return "";
    }

    const streetAddressPattern =
        /\b\d{1,6}\s+(?:[NSEW]\.?\s+)?(?:[A-Za-z0-9.'-]+\s+){0,7}(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Ct|Court|Pl|Place|Cir|Circle|Pkwy|Parkway)\b(?:\s*,?\s*[A-Za-z .'-]+)?(?:\s*,?\s*[A-Z]{2})?(?:\s+\d{5}(?:-\d{4})?)?/i;

    const parts =
        text.split("+")
            .map(part => part.trim())
            .filter(Boolean);

    for (let index = parts.length - 1; index >= 0; index--) {
        const partMatch =
            parts[index].match(streetAddressPattern);

        if (partMatch) {
            return partMatch[0].trim();
        }
    }

    const match =
        text.match(streetAddressPattern);

    return match
        ? match[0].trim()
        : "";
}

function applyPhotoParkingFields(location, verifiedAddress) {

    activeJourney.parkingDescription =
        location;

    activeJourney.parkingLocation =
        location;

    if (verifiedAddress) {
        activeJourney.parkingLocationAddress =
            verifiedAddress;
        activeJourney.parkingAddress =
            verifiedAddress;
        activeJourney.verifiedParkingAddress =
            verifiedAddress;
    }

    activeJourney.parkingVerified =
        Boolean(
            activeJourney.verifiedParkingAddress ||
            activeJourney.parkingLocationAddress ||
            activeJourney.parkingAddress
        );
}

function applyPhotoStartFields(location, verifiedAddress) {

    activeJourney.startLocation =
        location;

    if (verifiedAddress) {
        activeJourney.startLocationAddress =
            verifiedAddress;
        activeJourney.startAddress =
            verifiedAddress;
        activeJourney.verifiedStartAddress =
            verifiedAddress;
    }

    activeJourney.startVerified =
        Boolean(
            activeJourney.verifiedStartAddress ||
            activeJourney.startLocationAddress ||
            activeJourney.startAddress
        );
}

async function analyzeSavedJourneyPhoto() {

    if (
        !activeJourney ||
        !activeJourney.photos ||
        activeJourney.photos.length === 0
    ) {
        alert("No saved photo to analyze.");
        return;
    }

    if (window.photoAnalysisInProgress) {
        showPhotoAnalysisInProgressCard(
            "Still analyzing photo..."
        );
        return;
    }

    window.photoAnalysisInProgress = true;
    window.photoAnalysisDismissed = false;

    const analysisId = Date.now();
    window.activePhotoAnalysisId = analysisId;

    showPhotoAnalysisInProgressCard(
        "Analyzing photo..."
    );

    const timeoutMs =
        Number(window.photoAnalysisTimeoutMs) ||
        30000;

    const controller =
        typeof AbortController !== "undefined"
            ? new AbortController()
            : null;

    let timeoutId;

    const timeoutPromise =
        new Promise(function (_resolve, reject) {
            timeoutId = setTimeout(
                function () {
                    if (controller) {
                        controller.abort();
                    }

                    reject(
                        new Error("Photo analysis timed out.")
                    );
                },
                timeoutMs
            );
        });

    try {
        const response = await Promise.race([
            fetch("/api/askOurFlow", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                signal: controller?.signal,
                body: JSON.stringify(
                    buildOurFlowPayload(
                        "Look at this image and suggest 3 short practical location memories the user may want to remember. Read all visible signs, names, numbers, suite numbers, building names, landmarks, and notices. Group related visible clues into one useful memory, such as building or place name + number + distinguishing landmark or notice. Do not return a standalone number unless no other useful text is visible. Do not split related clues into unrelated choices. Return only a simple numbered list of memory names, with no explanations.",
                        {
                            injectJourneyContext: true
                        }
                    )
                )
            }),
            timeoutPromise
        ]);

        const data =
            await response.json();

        const lastPhoto =
            activeJourney.photos[
            activeJourney.photos.length - 1
            ];

        lastPhoto.analysis =
            data.answer;

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        const suggestions =
            data.answer.match(/^\d+\.\s(.+)$/gm)
                ?.map(line => line.replace(/^\d+\.\s/, "")) ||
            [];

        window.photoSuggestions =
            suggestions;

        pendingPhotoMemory = true;

        showActiveJourneyBox();

        if (
            window.photoAnalysisDismissed ||
            window.activePhotoAnalysisId !== analysisId
        ) {
            return;
        }

        document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Photo Analyzed</strong>

    <br><br>

    ${data.answer}

    <br><br>

    <strong>
Choose a suggestion above, or click Enter Your Own Memory.
</strong>
    <br><br>

<button onclick="savePhotoMemory(window.photoSuggestions[0])">
    1
</button>

<button onclick="savePhotoMemory(window.photoSuggestions[1])">
    2
</button>

<button onclick="savePhotoMemory(window.photoSuggestions[2])">
    3
</button>

<button onclick="
const memory = prompt(
'Enter the memory you would like to save:'
);

if(memory){
    savePhotoMemory(memory);
}
">
    Enter Your Own Memory
</button>
    <br><br>
</div>
`;
    } catch (error) {
        if (
            !window.photoAnalysisDismissed &&
            window.activePhotoAnalysisId === analysisId
        ) {
            showPhotoAnalysisFallbackCard();
        }
    } finally {
        clearTimeout(timeoutId);

        if (window.activePhotoAnalysisId === analysisId) {
            window.photoAnalysisInProgress = false;
        }
    }
}

function showPhotoAnalysisInProgressCard(title) {

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>${title}</strong>

    <br><br>

    Looking for useful location clues.

    <br><br>

    <button onclick="continueJourneyDuringPhotoAnalysis()">
        Continue Journey
    </button>
</div>
`;
}

function showPhotoAnalysisFallbackCard() {

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Photo Analysis Taking Too Long</strong>

    <br><br>

    You can continue your journey and try photo analysis again later.

    <br><br>

    <button onclick="analyzeSavedJourneyPhoto()">
        Try Again
    </button>

    <button onclick="continueJourneyDuringPhotoAnalysis()">
        Continue Journey
    </button>
    <br><br>
</div>
`;
}

function continueJourneyDuringPhotoAnalysis() {

    window.photoAnalysisDismissed = true;
    showActiveJourneyBox();
}

function savePhotoAsLocation(type) {

    if (!activeJourney) {
        return;
    }

    const lastPhoto =
        activeJourney.photos[
        activeJourney.photos.length - 1
        ];

    const location =
        lastPhoto.note;

    if (!location) {
        return;
    }

    const verifiedAddress =
        extractVerifiedAddressFromPhotoLocation(location);

    if (type === "parking") {
        applyPhotoParkingFields(
            location,
            verifiedAddress
        );

        activeJourney.timeline.push(
            "Parking Saved From Photo: " +
            location
        );

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        showActiveJourneyBox();

        document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Parking Saved</strong>

    <br><br>

    ${location}
</div>
`;

        return;
    }

    if (type === "start") {
        applyPhotoStartFields(
            location,
            verifiedAddress
        );

        activeJourney.timeline.push(
            "Starting Location Saved From Photo: " +
            location
        );

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        showActiveJourneyBox();

        document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Start Location Saved</strong>

    <br><br>

    ${location}
</div>
`;

        return;
    }

    if (type === "both") {
        applyPhotoParkingFields(
            location,
            verifiedAddress
        );

        applyPhotoStartFields(
            location,
            verifiedAddress
        );

        activeJourney.timeline.push(
            "Parking + Start Location Saved From Photo: " +
            location
        );

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        showActiveJourneyBox();

        document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Parking + Start Location Saved</strong>

    <br><br>

    ${location}
</div>
`;

        return;
    }

    if (type === "destination") {
        activeJourney.destination =
            location;

        activeJourney.destinationDetail =
            location;

        activeJourney.timeline.push(
            "Destination Saved From Photo: " +
            location
        );

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        showActiveJourneyBox();

        document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Destination Saved</strong>

    <br><br>

    ${location}
</div>
`;
    }
}
