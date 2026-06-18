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

        "what time is my appointment",
        "what time are my appointments",

        "what appointments do i have",
        "what are my appointments",

        "do i have any appointments",

        "where is my appointment",
        "where's my appointment",

        "where are my appointments",

        "show appointments",
        "show my appointments"
    ];

    const text = question
        .toLowerCase()
        .replace(/[?.!]/g, "")
        .trim();

    return appointmentRecallPhrases.includes(
        text
    );
}

function isQuestionWord(question) {

    const text =
        question
            .toLowerCase()
            .replace(/[?.!]/g, "")
            .trim();

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
        question
            .toLowerCase()
            .replace(/[?.!,]/g, "")
            .trim();

    const instructionRecallPhrases = [

        "show my instructions",
        "show instructions",

        "what instructions do i have",
        "what instruction do i have",

        "what are my instructions",
        "what is my instruction",

        "do i have any instructions",

        "list my instructions",

        "read my instructions",

        "tell me my instructions"
    ];

    return instructionRecallPhrases.includes(text);
}

function isNoteRecall(question) {

    const text =
        question
            .toLowerCase()
            .replace(/[?.!,]/g, "")
            .trim();

    const noteRecallPhrases = [

        "show my notes",
        "show notes",

        "what notes do i have",

        "what are my notes",

        "do i have any notes",

        "list my notes",

        "read my notes",

        "tell me my notes"
    ];

    return noteRecallPhrases.includes(text);
}

function isQuestionRecall(question) {

    const text =
        question
            .toLowerCase()
            .replace(/[?.!,]/g, "")
            .trim();

    const questionRecallPhrases = [

        "show my questions",
        "show questions",

        "what questions do i have",

        "what are my questions",

        "do i have any questions",

        "list my questions",

        "read my questions",

        "tell me my questions"
    ];

    return questionRecallPhrases.includes(text);
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
        question
            .toLowerCase()
            .replace(/[?.!,]/g, "")
            .trim();

    const medicationRecallPhrases = [

        "show my medications",
        "show medications",

        "what medications do i have",

        "what are my medications",

        "do i have any medications",

        "list my medications",

        "read my medications",

        "tell me my medications"
    ];

    return medicationRecallPhrases.includes(text);
}

function isDirectoryRecall(question) {

    const text =
        question
            .toLowerCase()
            .replace(/[?.!,]/g, "")
            .trim();

    const directoryRecallPhrases = [

        "show directories",
        "show my directories",

        "what directories do i have",

        "what are my directories",

        "what is my directory",

        "do i have any directories",

        "list my directories",

        "read my directories",

        "tell me my directories"
    ];

    return directoryRecallPhrases.includes(text);
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