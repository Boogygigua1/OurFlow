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

        "show me my appointments",

        "give me my appointments",

        "show my appointment",

        "what is my appointment",

        "tell me my appointment",

        "list my appointment",

        "when is my appointment",
        "show my appointments",
        "did i save any appointments",

        "did i save any appointment",

        "what appointments do i have",

        "what appointment do i have",

        "what is my appointment",

        "what was my appointment",

        "tell me my appointments"
    ];

    const text = question
        .toLowerCase()
        .replace(/[?.!]/g, "")
        .trim();

    return appointmentRecallPhrases.some(
        phrase => text.includes(phrase)
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

        text.startsWith("i need to remember ") ||

        (
            text.startsWith("i need to ")
            &&
            !text.includes("ask ")
        ) ||

        text.startsWith("i have to ") ||

        text.startsWith("i must ") ||

        text.startsWith("remind me to ") ||

        text.startsWith("remember that ") ||

        text.startsWith("don't let me forget ") ||

        text.startsWith("dont let me forget ") ||

        text.includes("you need to ") ||

        text.includes("you should ") ||

        text.includes("remember to bring") ||

        text.includes("arrive ") ||

        text.includes("check in ")

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
        text.includes("building") ||

        text.includes("hall") ||
        text.includes("lobby") ||
        text.includes("desk") ||
        text.includes("counter") ||
        text.includes("clinic") ||
        text.includes("lab") ||
        text.includes("laboratory") ||
        text.includes("wing") ||
        text.includes("registration") ||
        text.includes("financial aid") ||
        text.includes("admissions") ||
        text.includes("student services") ||

        text.includes("classroom") ||
        text.includes("lecture hall") ||
        text.includes("auditorium") ||
        text.includes("cafeteria") ||
        text.includes("bookstore") ||
        text.includes("nursing station") ||
        text.includes("pharmacy") ||
        text.includes("radiology") ||
        text.includes("oncology") ||
        text.includes("billing") ||
        text.includes("records") ||
        text.includes("human resources") ||
        text.includes("hr") ||
        text.includes("security")

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

        "show me my instructions",

        "give me my instructions",

        "what instructions do i have",
        "what instruction do i have",

        "what are my instructions",
        "what is my instruction",

        "do i have any instructions",

        "list my instructions",

        "read my instructions",

        "tell me my instructions",

        "did i save any instructions",

        "what was i supposed to remember",

        "what did they tell me to do",

        "what was i supposed to bring",

        "what did i need to remember",

        "what do i need to remember",

        "show me my reminders",

        "what reminders do i have"
    ];

    return instructionRecallPhrases.some(
        phrase => text.includes(phrase)
    );
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

        "show me my notes",

        "give me my notes",

        "what notes do i have",

        "what are my notes",

        "do i have any notes",

        "list my notes",

        "tell me my notes",

        "show my note",

        "what is my note",

        "tell me my note",

        "list my note",

        "did i save any notes",

        "did i write anything down",

        "what did i write down",

        "what did i note",

        "what notes did i save",

        "what was in my notes"
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

        "show me my questions",

        "give me my questions",

        "what questions do i have",

        "what are my questions",

        "do i have any questions",

        "list my questions",

        "read my questions",

        "tell me my questions",

        "show my question",

        "what is my question",

        "tell me my question",

        "list my question",

        "did i save any questions",

        "what did i need to ask",

        "what was i going to ask",

        "what did i want to ask",

        "what was i supposed to ask",

        "what questions did i save",

        "show me the questions i saved",

        "what do i need to ask",

        "what was i supposed to ask them",

        "what did i need to ask them",

        "what did i want to ask them",

        "what was my question",

        "what were my questions",

        "did i save a question",

        "did i save any question",

        "remind me what i wanted to ask",

        "remind me what i needed to ask",

        "show me what i wanted to ask"
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

        "show me my medications",

        "give me my medications",

        "show my medication",

        "show me my medication",

        "show my meds",

        "show me my meds",

        "what medications do i have",

        "what are my medications",

        "what is my medication",

        "what medications am i taking",

        "what medication am i taking",

        "what meds am i taking",

        "do i have any medications",

        "list my medications",

        "read my medications",

        "tell me my medications",

        "did i save any medications",

        "did i save any medication",

        "what medications did i save",

        "what meds did i save",

        "what medicine am i taking",

        "what medicines am i taking",

        "do i take any medications",

        "am i taking any medications"
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

        "show me my directories",

        "show directory",
        "show my directory",
        "show me directory",
        "show me my directory",
        "list my directory",
        "read my directory",

        "give me my directory",

        "give me my directories",

        "what directories do i have",

        "what are my directories",

        "what is my directory",

        "do i have any directories",

        "list my directories",

        "read my directories",

        "tell me my directory",

        "tell me my directories",

        "did i save any directories",

        "did i save any directory information",

        "what directory information do i have",

        "what room was i looking for",

        "what office was i looking for",

        "what department was i looking for",

        "what locations did i save",

        "what buildings did i save",

        "where do i need to go",

        "where was i supposed to go",

        "where was i going",

        "where am i supposed to go",

        "where should i go",

        "where is my appointment",

        "where is my advisor",

        "where is the office",

        "where is the department",

        "where is the building",

        "what room number do i have",

        "what room was i given",

        "what room do i need",

        "what office do i need",

        "what office was i given",

        "what building do i need",

        "what building was i given",

        "what floor do i need",

        "what floor was i given",

        "what location did i save",

        "what place did i save",

        "remind me where i need to go",

        "remind me where i was supposed to go",

        "show me where i need to go"
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

function isAppointmentPhrase(question) {

    const text =
        question.toLowerCase().trim();

    return (

        text.startsWith("i have an appointment") ||

        text.startsWith("my appointment") ||

        text.startsWith("appointment at") ||

        text.startsWith("meeting with") ||

        text.startsWith("i'm meeting") ||

        text.startsWith("im meeting") ||

        text.startsWith("i am meeting") ||

        text.includes("appointment") ||

        text.includes("meeting")
    );
}

function isNotePhrase(question) {

    const text =
        question.toLowerCase().trim();

    return (

        text.startsWith("note that ") ||

        text.startsWith("note ") ||

        text.startsWith("i wrote down ") ||

        text.startsWith("write down ") ||

        text.startsWith("for my notes ") ||

        text.startsWith("remember this note ") ||

        text.startsWith("note to self ")
    );
}

function isMedicationPhrase(question) {

    const text =
        question.toLowerCase().trim();

    return (

        text.startsWith("taking ") ||

        text.startsWith("started ") ||

        text.startsWith("using ") ||

        text.startsWith("prescribed ") ||

        text.startsWith("i need to take ") ||

        text.startsWith("need to take ") ||

        text.startsWith("i take ") ||

        text.startsWith("i'm taking ") ||

        text.startsWith("im taking ") ||

        text.startsWith("i am taking ")
    );
}

function isQuestionPhrase(question) {

    const text =
        question.toLowerCase().trim();

    return (

        text.startsWith("ask about ") ||

        text.startsWith("ask doctor about ") ||

        text.startsWith("ask counselor about ") ||

        text.startsWith("ask if ") ||

        text.startsWith("i need to ask ") ||

        text.startsWith("i need to ask about ") ||

        text.startsWith("i want to ask ") ||

        text.startsWith("ask whether ") ||

        text.startsWith("ask why ") ||
        text.startsWith("ask when ") ||
        text.startsWith("ask where ") ||
        text.startsWith("ask how ") ||
        text.startsWith("ask what ") ||

        text.includes(" ask about ")

    );
}

function isDestinationLocationPhrase(question) {

    const text =
        question.toLowerCase();

    return (

        text.includes("office") ||
        text.includes("room") ||
        text.includes("suite") ||
        text.includes("floor") ||
        text.includes("building") ||
        text.includes("hall") ||
        text.includes("lobby") ||
        text.includes("wing")
    );
}

function isJourneySummaryRecall(question) {

    const text =
        question
            .toLowerCase()
            .replace(/[?.!,]/g, "")
            .trim();

    return (

        text === "journey summary" ||

        text === "show journey summary" ||

        text === "show summary" ||

        text === "journey recap" ||

        text === "show journey recap"

    );
}
