function showCard(title, body) {
    document.getElementById("result").innerHTML = `
<div class="card">
    <strong>${title}</strong>
    <br><br>
    ${body}
</div>
`;
}

function saveJourneyItem(
    arrayName,
    value,
    timelineLabel
) {
    activeJourney[arrayName].push(
        value
    );

    activeJourney.timeline.push(
        timelineLabel + value
    );

    showActiveJourneyBox();
}

function showJourneyList(
    title,
    items
) {

    if (items.length === 0) {

        result.innerHTML = `
<div class="card">
    <strong>${title}</strong>

    <br><br>

    No items saved for this journey yet.
</div>
`;

        return;
    }

    let listHtml = "";

    items.forEach((item, index) => {

        listHtml += `
${index + 1}. ${item}<br><br>
`;
    });

    result.innerHTML = `
<div class="card">
    <strong>${title}</strong>

    <br><br>

    ${listHtml}
</div>
`;
}

// ========================================
// QUESTION TYPE HELPERS
// ========================================

function isAppointmentRecall(question) {

    const appointmentRecallPhrases = [

        "when is my next appointment",
        "when are my appointments",

        "what is my next appointment",
        "what's my next appointment",

        "what appointments do i have",
        "what are my appointments",

        "do i have any appointments",

        "where is my appointment",
        "where's my appointment",

        "where are my appointments",

        "show appointments",
        "show my appointments"
    ];

    return appointmentRecallPhrases.includes(
        question.toLowerCase().trim()
    );
}

function isQuestionWord(question) {

    const text =
        question.toLowerCase().trim();

    return (

        text.startsWith("where ") ||

        text.startsWith("what ") ||

        text.startsWith("who ") ||

        text.startsWith("when ") ||

        text.startsWith("why ") ||

        text.startsWith("how ")

    );
}

function isInstructionPhrase(question) {

    const text =
        question.toLowerCase().trim();

    return (

        text.startsWith("remember to ") ||

        text.startsWith("don't forget ") ||

        text.startsWith("dont forget ") ||

        text.startsWith("make sure to ") ||

        text.startsWith("be sure to ") ||

        text.startsWith("i should ") ||

        text.startsWith("need to remember ") ||

        text.startsWith("i need to remember ")

    );
}

function isDirectoryPhrase(question) {

    const text =
        question.toLowerCase();

    return (

        text.includes("department") ||
        text.includes("hematology") ||
        text.includes("elevator") ||
        text.includes("directory") ||
        text.includes("check-in") ||
        text.includes("reception") ||
        text.includes("office") ||
        text.includes("room") ||
        text.includes("suite") ||
        text.includes("floor") ||
        text.includes("unit") ||
        text.includes("building")

    );
}

function isInstructionRecall(question) {

    const text =
        question.toLowerCase().trim();

    return (

        text === "show my instructions" ||
        text === "show instructions" ||
        text === "what instructions do i have"

    );
}

function isNoteRecall(question) {

    const text =
        question.toLowerCase().trim();

    return (

        text === "show my notes" ||
        text === "show notes" ||
        text === "what notes do i have"

    );
}

function isQuestionRecall(question) {

    const text =
        question.toLowerCase().trim();

    return (

        text === "show my questions" ||
        text === "show questions" ||
        text === "what questions do i have"

    );
}

function isParkingRecall(question) {

    const text =
        question.toLowerCase();

    return (

        text.includes("where's my ride") ||
        text.includes("where is my ride") ||
        text.includes("find my ride") ||

        text.includes("where's my bike") ||
        text.includes("where is my bike") ||
        text.includes("find my bike") ||

        text.includes("where's my car") ||
        text.includes("where is my car") ||
        text.includes("find my car")

    );
}

function isMedicationRecall(question) {

    const text =
        question.toLowerCase().trim();

    return (

        text === "show my medications" ||
        text === "show medications" ||
        text === "what medications do i have"

    );
}

function isDirectoryRecall(question) {

    const text =
        question.toLowerCase().trim();

    return (

        text === "show directories" ||
        text === "show my directories" ||
        text === "what directories do i have"

    );
}

function isParkingMemoryCommand(question) {

    const text =
        question.toLowerCase();

    return (

        text.includes("i'm parked") ||
        text.includes("im parked") ||
        text.includes("i parked") ||

        text.includes("parked on") ||
        text.includes("parked near") ||
        text.includes("parked at") ||

        text.includes("left my car") ||
        text.includes("i left my car") ||

        text.includes("left my bike") ||
        text.includes("i left my bike") ||

        text.includes("left my bide") ||
        text.includes("my bide is") ||
        text.includes("bike is") ||
        text.includes("bicycle") ||

        text.includes("left my ride") ||
        text.includes("i left my ride") ||
        text.includes("my ride is") ||

        text.includes("where is my ride") ||
        text.includes("find my ride") ||

        text.includes("where's my ride") ||
        text.includes("wheres my ride") ||

        text.includes("where's my bike") ||
        text.includes("wheres my bike") ||

        text.includes("where's my car") ||
        text.includes("wheres my car") ||

        text.includes("my car is parked") ||
        text.includes("my vehicle is parked") ||

        text.includes("where did i park") ||
        text.includes("where am i parked") ||

        text.includes("where did i start") ||

        text.includes("take me back to where i started") ||

        text.includes("take me back") ||
        text.includes("go back") ||
        text.includes("return me") ||

        text.includes("get back there") ||
        text.includes("help me get back") ||
        text.includes("get me back") ||

        text.includes("return me to my starting location") ||

        text === "parking" ||
        text === "start" ||
        text === "both" ||

        text === "yes" ||
        text === "y" ||
        text === "yeah" ||
        text === "yep" ||
        text === "sure" ||
        text === "ok" ||
        text === "okay" ||
        text === "no" ||
        text === "nope" ||

        text.includes("bike is parked")

    );
}