function handleKey(event) {
    if (event.key === "Enter") {
        askOurFlow();
    }
}

function toggleReadMore(button) {

    const moreText = document.getElementById("moreText");

    const isHidden = moreText.style.display === "none" || moreText.style.display === "";

    moreText.style.display = isHidden ? "inline" : "none";
    button.innerText = isHidden ? "Read less" : "Read more";
}

function toggleNewUserInfo(button) {

    const info =
        document.getElementById("newUserInfo");

    if (info.style.display === "none") {

        info.style.display = "block";

        button.innerHTML =
            "▼ New Here? Read Me!";

    } else {

        info.style.display = "none";

        button.innerHTML =
            "▶ New Here? Read Me!";
    }
}

function togglePhilosophy(button) {

    const text = document.getElementById("philosophyText");

    const isHidden =
        text.style.display === "none" || text.style.display === "";

    text.style.display = isHidden ? "block" : "none";

    button.innerText = isHidden
        ? "Hide Philosophy"
        : "✨ Our Philosophy";
}

function toggleLegal(button) {

    const text = document.getElementById("legalText");

    const isHidden =
        text.style.display === "none" || text.style.display === "";

    text.style.display = isHidden ? "block" : "none";

    button.innerText = isHidden
        ? "▲ Hide AI, Usage & Platform Information"
        : "▼ AI, Usage & Platform Information";
}

function clearNewList() {

    const hasActiveJourney =
        Boolean(activeJourney);

    const hasVisibleOutput =
        Boolean(
            document.getElementById("result")
                ?.innerHTML
                ?.trim()
        );

    if (!hasActiveJourney && !hasVisibleOutput) {
        document.getElementById("result").innerHTML = `
<div class="card">
    <strong>Nothing to clear</strong>

    <br><br>

    There is no active journey list to clear right now.
</div>
`;
        return;
    }

    const shouldClear =
        confirm(
            "Clear the current active journey list? Saved journeys will stay in your archive."
        );

    if (!shouldClear) {
        return;
    }

    activeJourney = null;
    pendingPhotoMemory = false;
    pendingPhotoClassification = "";
    landmarkImageData = "";
    landmarkThumbnailData = "";
    pendingParkingLocation = "";
    pendingParkingLocationAddress = "";
    pendingLocationClassification = "";
    pendingLocationType = "";
    pendingDestinationSearch = "";

    localStorage.removeItem("activeJourney");

    document.getElementById("questionInput").value = "";
    document.getElementById("imagePreview").innerHTML = "";
    document.getElementById("activeJourneyBox").innerHTML = "";

    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>List Cleared</strong>

    <br><br>

    The current journey list has been cleared. Saved journeys were not changed.
</div>
`;
}

function trackOurFlow(eventName, details = {}) {
    if (window.va) {
        window.va("event", {
            name: eventName,
            data: details
        });
    }
}
