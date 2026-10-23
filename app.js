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

function clearAllOurFlowDeviceData() {

    const shouldClear =
        confirm(
            "This will permanently remove the journeys, notes, locations, photos, and other OurFlow information stored on this device. This cannot be undone."
        );

    if (!shouldClear) {
        return;
    }

    const ownedStorageKeys = [
        "activeJourney",
        "savedJourneys",
        "journeyLimit",
        "profile",
        "ourflowProfile",
        "profileMemory",
        "ourflowProfileMemory",
        "userProfile"
    ];

    ownedStorageKeys.forEach(key => {
        localStorage.removeItem(key);
    });

    activeJourney = null;
    savedJourneys = [];
    JOURNEY_LIMIT = 5;

    if (typeof resetJourneySessionContext === "function") {
        resetJourneySessionContext();
    }

    const imagePreview =
        document.getElementById("imagePreview");

    if (imagePreview) {
        imagePreview.replaceChildren();
    }

    const activeJourneyBox =
        document.getElementById("activeJourneyBox");

    if (activeJourneyBox) {
        activeJourneyBox.replaceChildren();
    }

    const result =
        document.getElementById("result");

    if (result) {
        result.innerHTML = `
<div class="card">
    <h2 class="card-title" data-card-heading tabindex="-1">OurFlow data cleared</h2>

    Journeys, notes, locations, photos, and other OurFlow information stored on this device have been removed.
</div>
`;
    }

    if (typeof announceOurFlowStatus === "function") {
        announceOurFlowStatus("OurFlow data cleared from this device.");
    }

    if (typeof focusResultCardTarget === "function") {
        focusResultCardTarget("[data-card-heading]");
    }
}

let supportFinalSubmitInProgress = false;

function getSupportReviewFields(form) {
    return [
        {
            label: "Name (optional)",
            value: form.elements.name?.value || ""
        },
        {
            label: "Email or phone (optional)",
            value: form.elements.contact?.value || ""
        },
        {
            label: "Support topic",
            value: form.elements.topic?.value || ""
        },
        {
            label: "Support message (required)",
            value: form.elements.message?.value || ""
        }
    ];
}

function getSupportMessageField() {
    return document.getElementById("supportMessage");
}

function getSupportMessageError() {
    return document.getElementById("supportMessageError");
}

function setSupportMessageError(message) {
    const field = getSupportMessageField();
    const error = getSupportMessageError();

    if (error) {
        error.textContent = message;
    }

    if (field) {
        field.setCustomValidity(message);

        if (message) {
            field.setAttribute("aria-invalid", "true");
        } else {
            field.removeAttribute("aria-invalid");
        }
    }
}

function clearSupportMessageError() {
    const field = getSupportMessageField();

    if (!field || field.value === "" || field.value.trim()) {
        setSupportMessageError("");
    }
}

function validateSupportMessage() {
    const field = getSupportMessageField();

    if (!field) {
        return true;
    }

    if (field.value && !field.value.trim()) {
        setSupportMessageError("Enter a message, not just spaces.");
        field.reportValidity();
        field.focus({ preventScroll: false });
        return false;
    }

    setSupportMessageError("");
    return true;
}

function setSupportFormReviewMode(isReviewing) {
    const form = document.getElementById("supportForm");
    const review = document.getElementById("supportReview");

    if (!form || !review) {
        return;
    }

    form.hidden = isReviewing;
    review.hidden = !isReviewing;
}

function showSupportMessageReview(form) {
    const review = document.getElementById("supportReview");

    if (!review) {
        return;
    }

    const heading = document.createElement("h2");
    heading.id = "supportReviewHeading";
    heading.className = "card-title";
    heading.tabIndex = -1;
    heading.textContent = "Review Your Message";

    const intro = document.createElement("p");
    intro.textContent =
        "Please review the information before sending it.";

    const list = document.createElement("dl");
    list.className = "support-review-list";

    getSupportReviewFields(form).forEach(field => {
        const term = document.createElement("dt");
        term.textContent = field.label;

        const detail = document.createElement("dd");
        detail.textContent =
            field.value.trim() || "Not provided";

        list.append(term, detail);
    });

    const actions = document.createElement("div");
    actions.className = "support-review-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Go Back and Edit";
    editButton.addEventListener(
        "click",
        returnToSupportFormForEditing
    );

    const sendButton = document.createElement("button");
    sendButton.type = "button";
    sendButton.id = "supportSendMessageButton";
    sendButton.textContent = "Send Message";
    sendButton.addEventListener(
        "click",
        sendReviewedSupportMessage
    );

    actions.append(editButton, sendButton);
    review.replaceChildren(heading, intro, list, actions);

    setSupportFormReviewMode(true);

    if (typeof announceOurFlowStatus === "function") {
        announceOurFlowStatus("Review your message before sending.");
    }

    heading.focus({ preventScroll: false });
}

function handleSupportFormSubmit(event) {
    const form = event?.target;

    if (!form || form.id !== "supportForm") {
        return true;
    }

    if (form.dataset.readyToSubmit === "true") {
        return true;
    }

    event.preventDefault();

    if (!validateSupportMessage()) {
        return false;
    }

    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }

    showSupportMessageReview(form);
    return false;
}

function returnToSupportFormForEditing() {
    const form = document.getElementById("supportForm");
    const firstField = document.getElementById("supportName");

    setSupportFormReviewMode(false);

    if (typeof announceOurFlowStatus === "function") {
        announceOurFlowStatus("Edit your message before sending.");
    }

    if (firstField) {
        firstField.focus({ preventScroll: false });
    } else if (form) {
        form.focus({ preventScroll: false });
    }
}

function sendReviewedSupportMessage() {
    if (supportFinalSubmitInProgress) {
        return;
    }

    const form = document.getElementById("supportForm");
    const button =
        document.getElementById("supportSendMessageButton");

    if (!form) {
        return;
    }

    if (!validateSupportMessage()) {
        setSupportFormReviewMode(false);
        return;
    }

    if (!form.checkValidity()) {
        setSupportFormReviewMode(false);
        form.reportValidity();
        return;
    }

    supportFinalSubmitInProgress = true;

    if (button) {
        button.disabled = true;
        button.textContent = "Sending...";
    }

    form.dataset.readyToSubmit = "true";
    form.requestSubmit();
}

function trackOurFlow(eventName) {
    if (window.va) {
        window.va("event", {
            name: eventName
        });
    }
}

function trackOurFlowJourneyStarted() {

    if (!activeJourney) {
        return;
    }

    const contextId =
        activeJourney.contextSessionId ||
        currentJourneyContextId;

    if (!contextId) {
        return;
    }

    window.ourFlowTrackedJourneyStartIds =
        window.ourFlowTrackedJourneyStartIds || {};

    if (window.ourFlowTrackedJourneyStartIds[contextId]) {
        return;
    }

    window.ourFlowTrackedJourneyStartIds[contextId] = true;

    trackOurFlow("journey_started");
}
