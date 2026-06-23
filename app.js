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

function trackOurFlow(eventName, details = {}) {
    if (window.va) {
        window.va("event", {
            name: eventName,
            data: details
        });
    }
}
