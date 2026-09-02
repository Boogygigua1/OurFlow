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
        button.setAttribute("aria-expanded", "true");

    } else {

        info.style.display = "none";

        button.innerHTML =
            "▶ New Here? Read Me!";
        button.setAttribute("aria-expanded", "false");
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
    button.setAttribute(
        "aria-expanded",
        isHidden ? "true" : "false"
    );
}

function toggleLegal(button) {

    const text = document.getElementById("legalText");

    const isHidden =
        text.style.display === "none" || text.style.display === "";

    text.style.display = isHidden ? "block" : "none";

    button.innerText = isHidden
        ? "▲ Hide AI, Usage & Platform Information"
        : "▼ AI, Usage & Platform Information";
    button.setAttribute(
        "aria-expanded",
        isHidden ? "true" : "false"
    );
}

function clearNewList() {

    const shouldClear =
        confirm(
            "This will permanently delete all saved journeys. This cannot be undone."
        );

    if (!shouldClear) {
        return;
    }

    savedJourneys = [];

    localStorage.setItem(
        "savedJourneys",
        JSON.stringify(savedJourneys)
    );

    showSavedJourneys();

    document.getElementById("result").innerHTML = `
<div class="card">
    <h2 class="card-title">Journey list cleared.</h2>

    All saved journeys have been deleted.
</div>
` + document.getElementById("result").innerHTML;
}

function trackOurFlow(eventName, details = {}) {
    if (window.va) {
        window.va("event", {
            name: eventName,
            data: details
        });
    }
}
