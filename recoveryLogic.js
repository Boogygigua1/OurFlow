function isRecoveryIntent(question) {

    const text =
        String(question || "")
            .toLowerCase()
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201B\u2032\u02BC\uFF07\u0060\u00B4]/g, "'")
            .trim()
            .replace(/[?.!,]+$/g, "")
            .replace(/\s+/g, " ")
            .trim();

    return (
        text === "i'm lost" ||
        text === "im lost" ||
        text === "i am lost" ||
        text === "i feel lost" ||
        text === "i'm confused" ||
        text === "im confused" ||
        text === "i am confused" ||
        text === "i need to get back" ||
        text === "help me get back" ||
        text === "what was i doing" ||
        text === "where was i going"
    );
}

function isReturnIntent(question) {

    const text =
        String(question || "")
            .toLowerCase()
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[’‘]/g, "'")
            .trim()
            .replace(/[?.!,]+$/g, "")
            .replace(/\s+/g, " ")
            .trim();

    const normalizedText =
        text.replace(/[\u201B\u2032\u02BC\uFF07\u0060\u00B4]/g, "'");

    return (
        normalizedText === "i'm back" ||
        normalizedText === "im back" ||
        normalizedText === "i am back" ||
        normalizedText === "i've returned" ||
        normalizedText === "ive returned" ||
        normalizedText === "i have returned" ||
        normalizedText === "i'm here" ||
        normalizedText === "im here" ||
        normalizedText === "i am here"
    );
}

function showRecoveryChoices() {

    const result =
        document.getElementById("result");

    if (!activeJourney) {
        result.innerHTML = `
<div class="card">
    <strong>Journey Recovery</strong>

    <br><br>

    I don't have an active journey to recover yet.
</div>
`;
        return;
    }

    const places =
        getJourneyPlaces(activeJourney);

    if (places.length === 0) {
        result.innerHTML = `
<div class="card">
    <strong>Journey Recovery</strong>

    <br><br>

    I don't have remembered places for this journey yet.
</div>
`;
        return;
    }

    const placeButtons =
        places.map(place => `
<div style="margin-bottom:16px;">
    <strong>${place.label}</strong>

    <br>

    ${place.title || "Unnamed place"}

    ${place.address
                ? `<br>${place.address}`
                : ""}

    ${place.verified
                ? `<br>Verified address`
                : ""}

    <br><br>

    <button onclick="navigateToJourneyPlace('${place.id}')">
        Open ${place.label} in Google Maps
    </button>
</div>
`).join("");

    result.innerHTML = `
<div class="card">
    <strong>Journey Recovery</strong>

    <br><br>

    I found these remembered places from this journey:

    <br><br>

    ${placeButtons}

    <br>

    Google Maps will handle live location and directions.
</div>
`;
}
