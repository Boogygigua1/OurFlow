var escapeOurFlowHtml =
    typeof escapeOurFlowHtml === "function"
        ? escapeOurFlowHtml
        : function (value) {
            return String(value || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        };

var escapeOurFlowHtmlWithBreaks =
    typeof escapeOurFlowHtmlWithBreaks === "function"
        ? escapeOurFlowHtmlWithBreaks
        : function (value) {
            return escapeOurFlowHtml(value)
                .replace(/\r?\n/g, "<br>");
        };

var getSafeOurFlowImageSrc =
    typeof getSafeOurFlowImageSrc === "function"
        ? getSafeOurFlowImageSrc
        : function (value) {
            const source =
                String(value || "").trim();

            return /^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(source)
                ? escapeOurFlowHtml(source)
                : "";
        };

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

const OURFLOW_ALLOWED_PHOTO_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const OURFLOW_MAX_PHOTO_BYTES =
    4 * 1024 * 1024;

// Keep image data below 3.5 MB, leaving room for the JSON context and a
// final 4,000,000-byte UTF-8 request cap (below Vercel's 4.5 MB limit).
const OURFLOW_MAX_ENCODED_PHOTO_CHARS = 3500000;

function getCurrentPhotoSelectionVersion() {
    return window.ourFlowPhotoSelectionVersion || 0;
}

function isCurrentPhotoSelection(version) {
    return version === getCurrentPhotoSelectionVersion();
}

function resetCurrentPhotoSelection(input) {

    const previousReader = window.ourFlowPhotoReader;
    window.ourFlowPhotoSelectionVersion = getCurrentPhotoSelectionVersion() + 1;
    window.ourFlowPhotoSelectionPending = false;
    window.ourFlowPhotoSelectionPromise = null;
    window.ourFlowPhotoReader = null;

    if (previousReader?.readyState === 1 && typeof previousReader.abort === "function") {
        previousReader.abort();
    }

    landmarkImageData = "";
    landmarkThumbnailData = "";
    window.landmarkThumbnailPromise = null;

    const preview =
        document.getElementById("imagePreview");

    if (preview) {
        preview.replaceChildren();
    }

    if (input) {
        input.value = "";
    }
}

function showPhotoSelectionError(message) {

    if (typeof showOurFlowStatusCard === "function") {
        showOurFlowStatusCard(
            "Photo Not Loaded",
            message,
            {
                role: "alert"
            }
        );
    }

    if (typeof announceOurFlowStatus === "function") {
        announceOurFlowStatus(message);
    }
}

function validateSelectedLandmarkFile(file) {

    if (!file) {
        return {
            valid: false,
            message: ""
        };
    }

    if (!OURFLOW_ALLOWED_PHOTO_TYPES.includes(file.type)) {
        return {
            valid: false,
            message: "Please choose a JPG, PNG, or WebP image."
        };
    }

    if (file.size > OURFLOW_MAX_PHOTO_BYTES) {
        return {
            valid: false,
            message: "The selected photo is too large. Please choose an image under 4 MB."
        };
    }

    return {
        valid: true,
        message: ""
    };
}

function prepareSelectedLandmarkFile(input) {

    const file =
        getSelectedLandmarkFile(input);

    if (!file) {
        return null;
    }

    const validation =
        validateSelectedLandmarkFile(file);

    if (!validation.valid) {
        resetCurrentPhotoSelection(input);

        if (validation.message) {
            showPhotoSelectionError(validation.message);
        }

        return null;
    }

    return file;
}

function refreshActiveJourneyAfterPhotoChange(targetSectionKey = "photos") {

    return;
}

function escapePhotoAriaLabel(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function buildLandmarkThumbnailFromData(imageData) {

    return new Promise(resolve => {

        if (!imageData) {
            resolve("");
            return;
        }

        const img =
            new Image();

        img.onload = function () {

            try {
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

                resolve(
                    canvas.toDataURL(
                        "image/jpeg",
                        0.6
                    )
                );
            } catch (error) {
                resolve("");
            }
        };

        img.onerror = function () {
            resolve("");
        };

        img.src = imageData;
    });
}

function isUsablePhotoThumbnail(thumbnail) {

    return (
        typeof thumbnail === "string" &&
        thumbnail.startsWith("data:image/") &&
        thumbnail !== landmarkImageData
    );
}

async function resolveLandmarkThumbnailForSave() {

    const version = getCurrentPhotoSelectionVersion();
    const imageData = landmarkImageData;
    const stillCurrent = () => isCurrentPhotoSelection(version) &&
        imageData === landmarkImageData && !window.ourFlowPhotoSelectionPending;

    if (!stillCurrent()) return "";

    if (isUsablePhotoThumbnail(landmarkThumbnailData)) {
        return landmarkThumbnailData;
    }

    if (window.landmarkThumbnailPromise) {
        try {
            const thumbnail = await window.landmarkThumbnailPromise;
            if (!stillCurrent()) return "";
            if (isUsablePhotoThumbnail(thumbnail)) {
                landmarkThumbnailData = thumbnail;
                return thumbnail;
            }
        } catch {
            if (!stillCurrent()) return "";
            landmarkThumbnailData = "";
        }
    }

    const retryThumbnail = await buildLandmarkThumbnailFromData(imageData);
    if (!stillCurrent()) return "";

    landmarkThumbnailData = isUsablePhotoThumbnail(retryThumbnail) ? retryThumbnail : "";
    return landmarkThumbnailData;
}

function prepareLandmarkImageData(imageData) {

    if (typeof imageData !== "string" ||
        !/^data:image\/(?:png|jpe?g|webp);base64,/i.test(imageData)) {
        return Promise.reject(new Error("Photo could not be loaded"));
    }

    if (imageData.length <= OURFLOW_MAX_ENCODED_PHOTO_CHARS) {
        return Promise.resolve(imageData);
    }

    // Large accepted source files are resized locally. Only the bounded result
    // becomes the selected AI image; the original is never submitted.
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onerror = () => reject(new Error("Photo could not be resized"));
        image.onload = () => {
            try {
                if (!Number.isFinite(image.width) || !Number.isFinite(image.height) ||
                    image.width <= 0 || image.height <= 0) throw new Error("Invalid image size");

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Image resizing unavailable");
                let scale = Math.min(1, 2048 / Math.max(image.width, image.height));

                for (let attempt = 0; attempt < 5; attempt += 1) {
                    canvas.width = Math.max(1, Math.round(image.width * scale));
                    canvas.height = Math.max(1, Math.round(image.height * scale));
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                    const resized = canvas.toDataURL("image/jpeg", Math.max(0.55, 0.85 - attempt * 0.1));
                    if (/^data:image\/jpeg;base64,/i.test(resized) &&
                        resized.length <= OURFLOW_MAX_ENCODED_PHOTO_CHARS) {
                        resolve(resized);
                        return;
                    }
                    scale *= 0.75;
                }
                throw new Error("Photo remains too large");
            } catch {
                reject(new Error("Photo could not be resized"));
            }
        };
        image.src = imageData;
    });
}

function showPhotoSelectionProcessingCard() {
    document.getElementById("result").innerHTML = `
<div class="card" role="status">
    <h2 class="card-title">Preparing Photo</h2>
    Please wait while your photo is loaded and its preview is prepared.
</div>
`;
}

function previewLandmarkImage(input) {

    const file = prepareSelectedLandmarkFile(input);
    if (!file) return Promise.resolve(false);

    // Invalidate and clear all previous data before the new asynchronous read.
    resetCurrentPhotoSelection();
    const version = getCurrentPhotoSelectionVersion();
    window.ourFlowPhotoSelectionPending = true;
    showPhotoSelectionProcessingCard();

    const task = (async () => {
        try {
            const rawImageData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                window.ourFlowPhotoReader = reader;
                reader.onload = event => resolve(event.target.result);
                reader.onerror = () => reject(new Error("Photo could not be read"));
                reader.onabort = () => resolve("");
                reader.readAsDataURL(file);
            });
            if (!isCurrentPhotoSelection(version)) return false;

            const imageData = await prepareLandmarkImageData(rawImageData);
            if (!isCurrentPhotoSelection(version)) return false;

            const thumbnailTask = buildLandmarkThumbnailFromData(imageData);
            window.landmarkThumbnailPromise = thumbnailTask;
            const thumbnail = await thumbnailTask;
            if (!isCurrentPhotoSelection(version)) return false;

            landmarkImageData = imageData;
            landmarkThumbnailData = isUsablePhotoThumbnail(thumbnail) ? thumbnail : "";
            const previewSource = getSafeOurFlowImageSrc(imageData);
            document.getElementById("imagePreview").innerHTML = `
<img src="${previewSource}" alt="Selected photo preview" style="max-width:300px;margin-top:10px;border-radius:10px;">
`;
            return true;
        } catch {
            if (isCurrentPhotoSelection(version)) {
                resetCurrentPhotoSelection(input);
                showPhotoSelectionError("This photo could not be prepared. Try a smaller JPG, PNG, or WebP image.");
            }
            return false;
        } finally {
            if (isCurrentPhotoSelection(version)) {
                window.ourFlowPhotoSelectionPending = false;
                window.ourFlowPhotoReader = null;
                window.ourFlowPhotoSelectionPromise = null;
            }
        }
    })();

    window.ourFlowPhotoSelectionPromise = task;
    return task;
}

async function analyzeLandmarkImage(input) {

    const task = previewLandmarkImage(input);
    const version = getCurrentPhotoSelectionVersion();
    if (!await task || !isCurrentPhotoSelection(version)) return;

    document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title" data-card-heading tabindex="-1">📸 Photo Ready</h2>
    Your image has been loaded.
    <br><br>
    <button id="saveJourneyButton" onclick="saveJourneyPhoto()">📷 Save To Journey</button>
</div>
`;

    document.getElementById("result").scrollIntoView({
        behavior: typeof getOurFlowScrollBehavior === "function" ? getOurFlowScrollBehavior() : "smooth",
        block: "start"
    });
}


function showPhotoSavedCard() {

    const lastPhoto =
        activeJourney?.photos?.[
        activeJourney.photos.length - 1
        ];

    const thumbnailSrc =
        getSafeOurFlowImageSrc(lastPhoto?.thumbnail);

    document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title" data-card-heading tabindex="-1">📷 Photo Saved</h2>

    ${thumbnailSrc
                ? `
    <img
        src="${thumbnailSrc}"
        alt="Saved photo preview"
        style="
            max-width:160px;
            border-radius:8px;
            display:block;
            margin-bottom:12px;
        "
    >
    `
                : `
    Photo saved, but the preview could not be created.

    <br><br>
    `}

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

    if (typeof announceOurFlowStatus === "function") {
        announceOurFlowStatus("Photo saved.");
    }
}

async function saveJourneyPhoto() {

    if (window.ourFlowPhotoSelectionPending) {
        showPhotoSelectionProcessingCard();
        return false;
    }

    if (!landmarkImageData) {
        showPhotoSelectionError("Choose or take a photo and wait for it to finish loading before saving.");
        return false;
    }

    const version = getCurrentPhotoSelectionVersion();
    const imageData = landmarkImageData;
    if (window.ourFlowPhotoSaveVersion === version) return false;
    window.ourFlowPhotoSaveVersion = version;

    const button = document.getElementById("saveJourneyButton");
    if (button) {
        button.disabled = true;
        button.style.opacity = "0.5";
        button.textContent = "Saving Photo...";
    }

    let saved = false;
    try {
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
            if (typeof trackOurFlowJourneyStarted === "function") {
                trackOurFlowJourneyStarted();
            }
        }

        const journey = activeJourney;
        const savedThumbnail = await resolveLandmarkThumbnailForSave();

        if (!isCurrentPhotoSelection(version) || window.ourFlowPhotoSelectionPending ||
            landmarkImageData !== imageData || activeJourney !== journey) return false;

        if (!journey.photos) journey.photos = [];
        journey.photos.push({
            timestamp: new Date().toLocaleString(),
            title: "",
            analysis: "",
            thumbnail: savedThumbnail
        });
        journey.timeline.push("Photo Added");
        localStorage.setItem("activeJourney", JSON.stringify(journey));
        refreshActiveJourneyAfterPhotoChange("photos");
        showPhotoSavedCard();
        saved = true;
        return true;
    } finally {
        if (window.ourFlowPhotoSaveVersion === version) window.ourFlowPhotoSaveVersion = null;
        if (!saved && isCurrentPhotoSelection(version) && button) {
            button.disabled = false;
            button.style.opacity = "";
            button.textContent = "📷 Save To Journey";
        }
    }
}

async function analyzeSavedJourneyPhotoLegacy() {

    if (window.ourFlowPhotoSelectionPending) {
        showPhotoSelectionProcessingCard();
        return;
    }

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
    <h2 class="card-title">Analyzing Photo...</h2>

    Looking for useful location clues.
</div>
`;

    try {
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

        const data = await response.json();

        if (response.ok === false || typeof data?.answer !== "string" || !data.answer.trim()) {
            throw new Error("AI assistance is temporarily unavailable.");
        }

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

        refreshActiveJourneyAfterPhotoChange("photos");

        document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">📷 Photo Analyzed</h2>

    ${escapeOurFlowHtmlWithBreaks(data.answer)}

    <br><br>

    <strong>
Choose a suggestion above, or click Enter Your Own Memory.
</strong>
    <br><br>

<button
    aria-label="Save photo memory suggestion 1: ${escapePhotoAriaLabel(window.photoSuggestions[0])}"
    onclick="savePhotoMemory(window.photoSuggestions[0])"
>
    1
</button>

<button
    aria-label="Save photo memory suggestion 2: ${escapePhotoAriaLabel(window.photoSuggestions[1])}"
    onclick="savePhotoMemory(window.photoSuggestions[1])"
>
    2
</button>

<button
    aria-label="Save photo memory suggestion 3: ${escapePhotoAriaLabel(window.photoSuggestions[2])}"
    onclick="savePhotoMemory(window.photoSuggestions[2])"
>
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
    } catch (error) {
        showPhotoAnalysisFailedCard(error?.code === "OURFLOW_REQUEST_TOO_LARGE"
            ? "This photo and its context are too large to send. Choose a smaller photo or shorten the request."
            : undefined);
    }

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

    activeJourney.timeline.push("Photo Note Added: " + note);

    pendingPhotoMemory = false;

    localStorage.setItem(
        "activeJourney",
        JSON.stringify(activeJourney)
    );

    refreshActiveJourneyAfterPhotoChange("photos");

    document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">📷 Photo Note Saved</h2>

    ${escapeOurFlowHtmlWithBreaks(note)}

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

        showActiveJourneyBox("destination");

        document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">📬 Verified Location Saved</h2>

    ${escapeOurFlowHtmlWithBreaks(location)}

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

        activeJourney.timeline.push("Directory Added from Photo: " + directoryInfo);

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        showActiveJourneyBox("peoplePlace");

        document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">🏢 Directory Info Saved</h2>

    ${escapeOurFlowHtmlWithBreaks(directoryInfo)}
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

        showActiveJourneyBox("journeyLocations");

        document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">Parking Saved</h2>

    ${escapeOurFlowHtmlWithBreaks(location)}
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

        showActiveJourneyBox("journeyLocations");

        document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">Start Location Saved</h2>

    ${escapeOurFlowHtmlWithBreaks(location)}
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

        showActiveJourneyBox("journeyLocations");

        document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">Parking + Start Location Saved</h2>

    ${escapeOurFlowHtmlWithBreaks(location)}
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

        showActiveJourneyBox("destination");

        document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">Destination Saved</h2>

    ${escapeOurFlowHtmlWithBreaks(location)}
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

    if (window.ourFlowPhotoSelectionPending) {
        showPhotoSelectionProcessingCard();
        return;
    }

    if (
        !activeJourney ||
        !activeJourney.photos ||
        activeJourney.photos.length === 0
    ) {
        if (typeof showOurFlowStatusCard === "function") {
            showOurFlowStatusCard(
                "No Saved Photo",
                "No saved photo is available to analyze yet. Save a photo to the journey first.",
                {
                    role: "alert"
                }
            );
        }
        return;
    }

    if (window.photoAnalysisInProgress) {
        showPhotoAnalysisInProgressCard(
            "Still analyzing photo..."
        );
        return;
    }

    window.photoAnalysisInProgress = true;
    showPhotoAnalysisInProgressCard(
        "Analyzing photo..."
    );

    try {
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

        const data =
            await response.json();

        if (response.ok === false || typeof data?.answer !== "string" || !data.answer.trim()) {
            throw new Error("AI assistance is temporarily unavailable.");
        }

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

        refreshActiveJourneyAfterPhotoChange("photos");

        document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">Photo Analyzed</h2>

    ${escapeOurFlowHtmlWithBreaks(data.answer)}

    <br><br>

    <strong>
Choose a suggestion above, or click Enter Your Own Memory.
</strong>
    <br><br>

<button
    aria-label="Save photo memory suggestion 1: ${escapePhotoAriaLabel(window.photoSuggestions[0])}"
    onclick="savePhotoMemory(window.photoSuggestions[0])"
>
    1
</button>

<button
    aria-label="Save photo memory suggestion 2: ${escapePhotoAriaLabel(window.photoSuggestions[1])}"
    onclick="savePhotoMemory(window.photoSuggestions[1])"
>
    2
</button>

<button
    aria-label="Save photo memory suggestion 3: ${escapePhotoAriaLabel(window.photoSuggestions[2])}"
    onclick="savePhotoMemory(window.photoSuggestions[2])"
>
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
        showPhotoAnalysisFailedCard(error?.code === "OURFLOW_REQUEST_TOO_LARGE"
            ? "This photo and its context are too large to send. Choose a smaller photo or shorten the request."
            : undefined);
    } finally {
        window.photoAnalysisInProgress = false;
    }
}

function showPhotoAnalysisInProgressCard(title) {

    document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">${escapeOurFlowHtml(title)}</h2>

    Looking for useful location clues.

    <br><br>

    <button onclick="continueJourneyDuringPhotoAnalysis()">
        Continue Journey
    </button>
</div>
`;
}

function showPhotoAnalysisFailedCard(message = "You can continue your journey and try again later.") {

    document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">Photo Analysis Did Not Finish</h2>

    ${escapeOurFlowHtmlWithBreaks(message)}

    <br><br>

    <button onclick="continueJourneyDuringPhotoAnalysis()">
        Continue Journey
    </button>
    <br><br>
</div>
`;
}

function continueJourneyDuringPhotoAnalysis() {

    window.photoAnalysisInProgress = false;
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

        showActiveJourneyBox("journeyLocations");

        document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">Parking Saved</h2>

    ${escapeOurFlowHtmlWithBreaks(location)}
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

        showActiveJourneyBox("journeyLocations");

        document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">Start Location Saved</h2>

    ${escapeOurFlowHtmlWithBreaks(location)}
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

        showActiveJourneyBox("journeyLocations");

        document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">Parking + Start Location Saved</h2>

    ${escapeOurFlowHtmlWithBreaks(location)}
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

        showActiveJourneyBox("destination");

        document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">Destination Saved</h2>

    ${escapeOurFlowHtmlWithBreaks(location)}
</div>
`;
    }
}

