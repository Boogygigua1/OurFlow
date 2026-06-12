async function askOurFlow() {

    const question =
        document.getElementById("questionInput").value.trim();

    const looksLikeAddress =

        /^\d+/.test(question) &&

        (
            question.includes(",") ||
            question.toLowerCase().includes("ca") ||
            question.toLowerCase().includes("california")
        );

    const questionInfo = analyzeUserQuestion(question);

    if (activeJourney && questionInfo.travelMode !== "unknown") {
        activeJourney.travelMode = questionInfo.travelMode;
    }

    console.log(activeJourney);

    if (
        activeJourney &&
        pendingPhotoMemory &&
        activeJourney.photos &&
        activeJourney.photos.length > 0
    ) {
        const lastPhoto =
            activeJourney.photos[activeJourney.photos.length - 1];

        pendingPhotoClassification = question;

        pendingPhotoMemory = false;

        localStorage.setItem(
            "activeJourney",
            JSON.stringify(activeJourney)
        );

        showActiveJourneyBox();

        document.getElementById("result").innerHTML = `
<div class="card">

<strong>📷 Photo Memory</strong>

<br><br>

${question}

<br><br>

How should I save this?

<br><br>

<button onclick="savePhotoClassification('parking')">
🚗 Parking
</button>

<br><br>

<button onclick="savePhotoClassification('start')">
🧭 Start Location
</button>

<br><br>

<button onclick="savePhotoClassification('both')">
🚗 + 🧭 Both
</button>

<br><br>

<button onclick="savePhotoClassification('note')">
📝 Photo Note Only
</button>

</div>
`;
        document.getElementById("questionInput").value = "";

        return;
    }

    if (
        !activeJourney &&
        (
            question.toLowerCase().startsWith("begin journey to ") ||
            question.toLowerCase().startsWith("start journey to ") ||
            question.toLowerCase().startsWith("start a journey ") ||
            question.toLowerCase().startsWith("start a journey to ") ||
            question.toLowerCase().startsWith("start journey ") ||
            question.toLowerCase().startsWith("starting journey ") ||
            question.toLowerCase().startsWith("starting a journey ") ||
            question.toLowerCase().startsWith("starting my journey to ") ||
            question.toLowerCase().startsWith("i'm going to ") ||
            question.toLowerCase().startsWith("im going to ") ||
            question.toLowerCase().startsWith("going to ") ||
            question.toLowerCase().startsWith("headed to ") ||
            question.toLowerCase().startsWith("heading to ") ||
            question.toLowerCase().startsWith("on my way to ") ||
            question.toLowerCase().startsWith("leaving for ") ||
            question.toLowerCase().startsWith("leave for ") ||
            question.toLowerCase().startsWith("off to ") ||
            question.toLowerCase().startsWith("traveling to ") ||
            question.toLowerCase().startsWith("travelling to ") ||
            looksLikeAddress
        )
    ) {

        activeJourney = {

            destination:
                "Untitled Journey",

            destinationName: "",

            destinationAddress: "",

            destinationDetail: "",

            currentLocation: "",

            travelMode: "",

            journeyStatus: "traveling",

            notes: [],

            photos: [],

            questionsForDoctor: [],

            staffInstructions: [],

            medications: [],

            appointments: [],

            directories: [],

            startTime:
                new Date().toLocaleString(),

            startLocation: "",

            startLocationAddress: "",

            verifiedDestinationAddress: "",

            parkingLocation: "",

            parkingLocationAddress: "",

            arrivalTips: "",

            mapLink: "",

            questions: [],

            answers: [],

            timeline: [],

            endLocation: "",

            endTime: ""
        };
    }

    if (!question) {
        alert("Ask OurFlow a question first 🧭");
        return;
    }

    const result = document.getElementById("result");

    result.innerHTML = `
    <div class="card">
        <strong>🧭 OurFlow</strong><br><br>
        Looking into that...
    </div>
    `;

    try {

        conversationHistory.push(question);

        if (
            question.toLowerCase().startsWith("begin journey to ") ||
            question.toLowerCase().startsWith("start journey to ") ||
            question.toLowerCase().startsWith("start a journey ") ||
            question.toLowerCase().startsWith("start a journey to ") ||
            question.toLowerCase().startsWith("start journey ") ||
            question.toLowerCase().startsWith("starting a journey ") ||
            question.toLowerCase().startsWith("starting journey ") ||
            question.toLowerCase().startsWith("starting journey to ") ||
            question.toLowerCase().startsWith("starting my journey to ") ||
            question.toLowerCase().startsWith("i'm going to ") ||
            question.toLowerCase().startsWith("im going to ") ||
            question.toLowerCase().startsWith("going to ") ||
            question.toLowerCase().startsWith("headed to ") ||
            question.toLowerCase().startsWith("heading to ") ||
            question.toLowerCase().startsWith("on my way to ") ||
            question.toLowerCase().startsWith("leaving for ") ||
            question.toLowerCase().startsWith("leave for ") ||
            question.toLowerCase().startsWith("off to ") ||
            question.toLowerCase().startsWith("traveling to ") ||
            question.toLowerCase().startsWith("travelling to ") ||
            looksLikeAddress


        ) {

            let destination = question;

            destination = destination
                .replace(/start a journey to /i, "")
                .replace(/start journey to /i, "")
                .replace(/starting my journey to /i, "")
                .replace(/starting journey to /i, "")
                .replace(/begin journey to /i, "")

                .replace(/start a journey /i, "")
                .replace(/start journey /i, "")
                .replace(/starting a journey /i, "")
                .replace(/starting journey /i, "")

                .replace(/i'm going to /i, "")
                .replace(/im going to /i, "")
                .replace(/going to /i, "")
                .replace(/headed to /i, "")
                .replace(/heading to /i, "")
                .replace(/on my way to /i, "")
                .replace(/leaving for /i, "")
                .replace(/leave for /i, "")
                .replace(/off to /i, "")
                .replace(/traveling to /i, "")
                .replace(/travelling to /i, "")
                .trim();

            activeJourney = {

                destination:
                    destination,

                destinationAddress: looksLikeAddress ? question : "",

                destinationDetail: "",

                currentLocation: "",

                travelMode: "",

                journeyStatus: "traveling",

                notes: [],

                photos: [],

                questionsForDoctor: [],

                staffInstructions: [],

                medications: [],

                appointments: [],

                directories: [],

                startTime:
                    new Date().toLocaleString(),

                startLocation:
                    "",

                parkingLocation:
                    "",

                arrivalTips: "",

                mapLink: "",

                questions: [],

                answers: [],

                timeline: [],

                endLocation:
                    "",

                endTime:
                    ""
            };


            activeJourney.timeline.push(
                "🧭 Journey Started: " +
                destination
            );

            console.log(activeJourney.timeline);

            showActiveJourneyBox();

            await getArrivalHelp(destination);

            result.innerHTML = "";

            return;

        }

        const endQuestion = question.toLowerCase().trim();

        if (
            activeJourney &&
            (
                endQuestion.includes("i made it") ||
                endQuestion.includes("i've arrived") ||
                endQuestion.includes("ive arrived") ||
                endQuestion.includes("i got here") ||
                endQuestion.includes("i'm here") ||
                endQuestion.includes("i found it") ||
                endQuestion.includes("found it") ||
                endQuestion.includes("got it") ||
                endQuestion.includes("im here")
            )
        ) {

            activeJourney.journeyStatus = "arrived";

            result.innerHTML = `
<div class="card">
    <strong>🧭 Destination Reached</strong>

    <br><br>

    Glad you made it to:

    <br><br>

    <strong>${activeJourney.destination}</strong>

    <br><br>

    What would you like me to remember?

    <br><br>

    ❓ Questions for staff

    <br>

    📝 Notes

    <br>

    📅 Appointments

    <br>

    👩‍⚕️ Instructions

    <br>

    🏢 Directory information

    <br><br>

    Just tell me naturally and I'll save it for this journey.

<br><br>

<button onclick="endJourneyFromArrival()">
    🏁 End Journey
</button>

<br><br>
<button onclick="
showActiveJourneyBox();

document.getElementById('questionInput').focus();

document.getElementById('questionInput').scrollIntoView({
    behavior:'smooth',
    block:'center'
});

document.getElementById('questionInput').placeholder =
    'What would you like me to remember?';
">
    ⬅ Continue Journey
</button>
    </div>
`;

            return;
        }

        if (
            endQuestion === "end journey" ||
            endQuestion.includes("all set") ||
            endQuestion.includes("finished") ||
            endQuestion.includes("that's all") ||
            endQuestion.includes("thats all") ||
            endQuestion.includes("no thanks") ||
            endQuestion.includes("i made it") ||
            endQuestion.includes("made it") ||
            endQuestion.includes("i'm here") ||
            endQuestion.includes("im here") ||
            endQuestion.includes("i am here") ||
            endQuestion.includes("i've arrived") ||
            endQuestion.includes("ive arrived") ||
            endQuestion.includes("i have arrived") ||
            endQuestion.includes("arrived")
        ) {

            /* END JOURNEY BLOCK HERE */



            if (!activeJourney) {

                result.innerHTML = `
        <div class="card">
            <strong>🧭 OurFlow</strong><br><br>
            No active journey to end.
        </div>
        `;

                return;
            }

            activeJourney.endTime =
                new Date().toLocaleString();

            localStorage.setItem(
                "activeJourney",
                JSON.stringify(activeJourney)
            );

            const start = new Date(activeJourney.startTime);
            const end = new Date(activeJourney.endTime);

            const minutes =
                Math.round((end - start) / 60000);

            activeJourney.duration = minutes;

            console.log(
                "END JOURNEY CALLED",
                new Date().toLocaleTimeString()
            );

            activeJourney.timeline.push(
                "🧭 Journey Ended: " +
                activeJourney.destination
            );

            result.innerHTML = `
<div class="card">
    <strong>🧭 Journey Recap</strong>

    <br><br>

    Destination:
    ${activeJourney.destination}

    <br><br>

    ❓ Questions:
    ${activeJourney.questionsForDoctor?.length || 0}

    <br><br>

    📝 Notes:
    ${activeJourney.notes?.length || 0}

    <br><br>

    💊 Medications:
    ${activeJourney.medications?.length || 0}

    <br><br>

    📅 Appointments:
    ${activeJourney.appointments?.length || 0}

    <br><br>

    👩‍⚕️ Instructions:
    ${activeJourney.staffInstructions?.length || 0}

    <br><br>

    🏢 Directories:
    ${activeJourney.directories?.length || 0}

    <br><br>

    ⏱ Duration:
    ${activeJourney.duration} minute(s)

    <br><br>

    📌 Total Events:
    ${activeJourney.timeline?.length || 0}

    <br><br>

    You captured ${activeJourney.timeline?.length || 0} important moments during this journey.

<br><br>

Take a moment to review everything before saving.

<br><br>

Ready to save?

    <br><br>

    Use 💾 Save Journey to store this trip.
</div>
`;

            return;
        }
        const lowerQuestion =
            question.toLowerCase();

        const isUtilityQuestion =

            (
                lowerQuestion.startsWith("where's ") ||
                lowerQuestion.startsWith("where is ") ||
                lowerQuestion.startsWith("wheres ") ||

                lowerQuestion.includes("closest ") ||
                lowerQuestion.includes("nearest ") ||
                lowerQuestion.includes("near me") ||

                lowerQuestion.includes("starbucks") ||
                lowerQuestion.includes("wells fargo") ||
                lowerQuestion.includes("coffee") ||
                lowerQuestion.includes("restaurant") ||
                lowerQuestion.includes("gas station") ||
                lowerQuestion.includes("hotel") ||

                (
                    lowerQuestion.includes("hospital")
                    &&
                    !lowerQuestion.startsWith("start journey")
                    &&
                    !lowerQuestion.startsWith("start a journey")
                    &&
                    !lowerQuestion.startsWith("starting journey")
                    &&
                    !lowerQuestion.startsWith("starting a journey")
                )
            )

            &&

            !lowerQuestion.includes("my ride")
            && !lowerQuestion.includes("my bike")
            && !lowerQuestion.includes("my car");

        const isMemoryCommand =

            lowerQuestion.includes("where's my ride") ||
            lowerQuestion.includes("where is my ride") ||
            lowerQuestion.includes("find my ride") ||

            lowerQuestion.includes("where's my bike") ||
            lowerQuestion.includes("where is my bike") ||
            lowerQuestion.includes("find my bike") ||

            lowerQuestion.includes("where's my car") ||
            lowerQuestion.includes("where is my car") ||
            lowerQuestion.includes("find my car") ||

            lowerQuestion.startsWith("save appointment:") ||

            lowerQuestion === "show my appointments" ||

            lowerQuestion === "show appointments" ||

            lowerQuestion.startsWith("save instruction:") ||

            lowerQuestion === "show my instructions" ||

            lowerQuestion === "show instructions" ||

            lowerQuestion.startsWith("save note:") ||

            lowerQuestion.startsWith("save directory:") ||

            lowerQuestion.startsWith("save question:") ||

            lowerQuestion.startsWith("save medication:") ||

            lowerQuestion === "show my notes" ||

            lowerQuestion === "show notes" ||

            lowerQuestion === "show my questions" ||

            lowerQuestion === "show questions" ||

            lowerQuestion === "show my medications" ||

            lowerQuestion === "show medications" ||

            lowerQuestion.includes("i'm parked") ||

            lowerQuestion.includes("im parked") ||

            lowerQuestion.includes("i parked") ||

            lowerQuestion.includes("parked on") ||

            lowerQuestion.includes("parked near") ||

            lowerQuestion.includes("parked at") ||

            lowerQuestion.includes("left my car") ||

            lowerQuestion.includes("i left my car") ||

            lowerQuestion.includes("left my bike") ||

            lowerQuestion.includes("i left my bike") ||

            lowerQuestion.includes("left my bide") ||
            lowerQuestion.includes("my bide is") ||
            lowerQuestion.includes("bike is") ||
            lowerQuestion.includes("bicycle") ||

            lowerQuestion.includes("left my ride") ||
            lowerQuestion.includes("i left my ride") ||
            lowerQuestion.includes("my ride is") ||
            lowerQuestion.includes("where is my ride") ||
            lowerQuestion.includes("find my ride") ||

            lowerQuestion.includes("where's my ride") ||
            lowerQuestion.includes("wheres my ride") ||

            lowerQuestion.includes("where's my bike") ||
            lowerQuestion.includes("wheres my bike") ||

            lowerQuestion.includes("where's my car") ||
            lowerQuestion.includes("wheres my car") ||

            lowerQuestion.includes("my car is parked") ||

            lowerQuestion.includes("my vehicle is parked") ||

            lowerQuestion.includes("where did i park") ||

            lowerQuestion.includes("where am i parked") ||

            lowerQuestion.includes("where did i start") ||

            lowerQuestion.includes("take me back to where i started") ||

            lowerQuestion.includes("take me back") ||
            lowerQuestion.includes("go back") ||
            lowerQuestion.includes("return me") ||

            lowerQuestion.includes("get back there") ||
            lowerQuestion.includes("help me get back") ||
            lowerQuestion.includes("get me back") ||

            lowerQuestion.includes("return me to my starting location") ||

            lowerQuestion === "parking" ||

            lowerQuestion === "start" ||

            lowerQuestion === "both" ||

            lowerQuestion === "yes" ||
            lowerQuestion === "y" ||
            lowerQuestion === "yeah" ||
            lowerQuestion === "yep" ||
            lowerQuestion === "sure" ||
            lowerQuestion === "ok" ||
            lowerQuestion === "okay" ||
            lowerQuestion === "no" ||
            lowerQuestion === "nope" ||

            lowerQuestion.includes("bike is parked");

        if (activeJourney) {

            const isDirectoryEntry =

                lowerQuestion.includes("department") ||
                lowerQuestion.includes("hematology") ||
                lowerQuestion.includes("elevator") ||
                lowerQuestion.includes("directory") ||
                lowerQuestion.includes("check-in") ||
                lowerQuestion.includes("reception");

            if (
                !isMemoryCommand &&
                !isUtilityQuestion &&
                !isDirectoryEntry
            ) {

                activeJourney.questions.push(question);
            }
        }

        if (
            activeJourney &&
            activeJourney.destination === "Untitled Journey"
        ) {

            const teaMatch =
                question.match(/tea bar/i);

            const chicoMatch =
                question.match(/chico state/i);

            const anthroMatch =
                question.match(/anthropology|anthro lab|anthro|anthro\. dep/i);

            const hospitalMatch =
                question.match(/hospital|hematology|enloe|emergency room|er/i);

            if (teaMatch) {
                activeJourney.destination = "Tea Bar";
                activeJourney.destinationAddress = "Tea Bar";
            }

            if (chicoMatch) {
                activeJourney.destination = "Chico State";
                activeJourney.destinationAddress = "Chico State";
            }

            if (anthroMatch) {
                activeJourney.destination =
                    "Anthropology Lab";

                activeJourney.destinationAddress =
                    "Anthropology Lab";
            }

            if (hospitalMatch) {
                activeJourney.destination =
                    "Hospital Visit";

                activeJourney.destinationAddress =
                    "Hospital Visit";
            }

        }


        const recallQuestion =
            question
                .toLowerCase()
                .replace(/[?.!,]/g, "")
                .trim();

        console.log(
            "RECALL CHECK:",
            recallQuestion
        );

        const noteQuestion = question.toLowerCase();

        if (
            activeJourney &&
            !questionInfo.mentionsParking &&

            !noteQuestion.startsWith("find ") &&
            !noteQuestion.startsWith("search ") &&
            !noteQuestion.includes("department") &&
            !noteQuestion.includes("directory") &&
            (
                noteQuestion.includes("exact location") ||
                noteQuestion.includes("the address is") ||
                noteQuestion.includes("address is") ||
                noteQuestion.includes("this is the address") ||
                noteQuestion.includes("enter at") ||
                noteQuestion.includes("located at") ||
                question.match(/\d{3,}/)
            )
        ) {

            const cleanDestination =
                question
                    .replace(/navigate to\s*/i, "")
                    .replace(/take me to\s*/i, "")
                    .replace(/directions to\s*/i, "")
                    .replace(/go to\s*/i, "")
                    .replace(/head to\s*/i, "")
                    .replace(/headed to\s*/i, "")
                    .trim();

            activeJourney.destinationName =
                cleanDestination;

            activeJourney.destinationAddress =
                cleanDestination;

            activeJourney.timeline.push(
                "📍 Destination Saved: " +
                cleanDestination
            );

            showActiveJourneyBox();

            result.innerHTML = `
<div class="card">
    <strong>📍 Location Detail Saved</strong>

    <br><br>

    ${cleanDestination}

    <br><br>

    I'll remember this as part of the destination details.

    <br><br>

<button onclick="openGoogleMapsToDestinationDetails('walking')">
    🚶 Walk There
</button>

<br><br>

<button onclick="openGoogleMapsToDestinationDetails('bicycling')">
    🚴 Bike There
</button>

<br><br>

<button onclick="openGoogleMapsToDestinationDetails('driving')">
    🚗 Drive There
</button>
</div>
`;

            return;
        }

        if (
            activeJourney &&
            (
                noteQuestion.startsWith("ask about ") ||
                noteQuestion.startsWith("ask doctor about ") ||
                noteQuestion.startsWith("ask counselor about ") ||
                noteQuestion.startsWith("ask if ")
            )
        ) {

            activeJourney.questionsForDoctor.push(
                question
            );

            activeJourney.timeline.push(
                "❓ Question Saved: " +
                question
            );

            showActiveJourneyBox();


            result.innerHTML = `
<div class="card">
    <strong>❓ Question Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        if (
            activeJourney &&
            (
                noteQuestion.startsWith("taking ") ||
                noteQuestion.startsWith("started ") ||
                noteQuestion.startsWith("using ") ||
                noteQuestion.startsWith("prescribed ")
            )
        ) {

            activeJourney.medications.push(
                question
            );

            activeJourney.timeline.push(
                "💊 Medication Saved: " +
                question
            );

            showActiveJourneyBox();


            result.innerHTML = `
<div class="card">
    <strong>💊 Medication Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        if (
            activeJourney &&
            (
                noteQuestion.startsWith("appointment ") ||
                noteQuestion.startsWith("my appointment is ")
            )
        ) {

            activeJourney.appointments.push(
                question
            );

            activeJourney.timeline.push(
                "📅 Appointment Saved: " +
                question
            );

            showActiveJourneyBox();


            result.innerHTML = `
<div class="card">
    <strong>📅 Appointment Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }
        if (
            activeJourney &&
            (
                noteQuestion.startsWith("follow up in ") ||
                noteQuestion.startsWith("return in ") ||
                noteQuestion.startsWith("schedule another ") ||
                noteQuestion.startsWith("monitor ") ||
                noteQuestion.startsWith("continue ")

                || noteQuestion.startsWith("follow-up in ")
                || noteQuestion.startsWith("follow up with ")
                || noteQuestion.startsWith("return for ")
                || noteQuestion.startsWith("come back in ")
                || noteQuestion.startsWith("check back in ")
                || noteQuestion.startsWith("call if ")
                || noteQuestion.startsWith("contact us if ")
            )
        ) {

            activeJourney.staffInstructions.push(
                question
            );

            activeJourney.timeline.push(
                "👩‍⚕️ Instruction Saved: " +
                question
            );

            showActiveJourneyBox();


            result.innerHTML = `
<div class="card">
    <strong>👩‍⚕️ Instruction Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        if (
            activeJourney &&
            (
                noteQuestion.startsWith("need to ") ||
                noteQuestion.startsWith("remember to ") ||
                noteQuestion.startsWith("don't forget to ") ||
                noteQuestion.startsWith("dont forget to ")
            )
        ) {

            activeJourney.notes.push(question);

            activeJourney.timeline.push(
                "📝 Note Saved: " + question
            );

            showActiveJourneyBox();

            result.innerHTML = `
<div class="card">
    <strong>📝 Note Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        if (
            activeJourney &&
            noteQuestion.startsWith("save note:")
        ) {

            const note = question
                .replace(/save note:/i, "")
                .trim();

            activeJourney.notes.push(note);

            activeJourney.timeline.push(
                "📝 Note Saved: " + note
            );

            showActiveJourneyBox();

            result.innerHTML = `
<div class="card">
    <strong>📝 Note Saved</strong>

    <br><br>

    ${note}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        if (
            activeJourney &&
            noteQuestion.startsWith("save question:")
        ) {

            console.log("SAVE QUESTION BLOCK FIRED");

            const doctorQuestion = question
                .replace(/save question:/i, "")
                .trim();

            activeJourney.questionsForDoctor.push(
                doctorQuestion
            );

            activeJourney.timeline.push(
                "❓ Question Saved: " +
                doctorQuestion
            );

            showActiveJourneyBox();

            result.innerHTML = `
<div class="card">
    <strong>❓ Question Saved</strong>

    <br><br>

    ${doctorQuestion}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        if (
            activeJourney &&
            noteQuestion.startsWith("save medication:")
        ) {

            const medication = question
                .replace(/save medication:/i, "")
                .trim();

            activeJourney.medications.push(
                medication
            );

            activeJourney.timeline.push(
                "💊 Medication Saved: " +
                medication
            );

            showActiveJourneyBox();

            result.innerHTML = `
<div class="card">
    <strong>💊 Medication Saved</strong>

    <br><br>

    ${medication}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        if (
            activeJourney &&
            noteQuestion.startsWith("save directory:")
        ) {

            const directory = question
                .replace(/save directory:/i, "")
                .trim();

            activeJourney.directories.push(directory);

            activeJourney.timeline.push(
                "🏢 Directory Saved: " +
                directory
            );

            showActiveJourneyBox();

            result.innerHTML = `
<div class="card">
    <strong>🏢 Directory Saved</strong>

    <br><br>

    ${directory}

    <br><br>

    I'll remember this directory for the journey.
</div>
`;

            return;
        }

        if (
            activeJourney &&
            noteQuestion.startsWith("save appointment:")
        ) {

            const appointment = question
                .replace(/save appointment:/i, "")
                .trim();

            activeJourney.appointments.push(
                appointment
            );

            activeJourney.timeline.push(
                "📅 Appointment Saved: " +
                appointment
            );

            showActiveJourneyBox();

            result.innerHTML = `
<div class="card">
    <strong>📅 Appointment Saved</strong>

    <br><br>

    ${appointment}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        if (
            activeJourney &&
            noteQuestion.startsWith("save instruction:")
        ) {

            const instruction = question
                .replace(/save instruction:/i, "")
                .trim();

            activeJourney.staffInstructions.push(
                instruction
            );

            activeJourney.timeline.push(
                "👩‍⚕️ Instruction Saved: " +
                instruction
            );

            showActiveJourneyBox();

            result.innerHTML = `
<div class="card">
    <strong>👩‍⚕️ Instruction Saved</strong>

    <br><br>

    ${instruction}

    <br><br>

    I'll remember that for this journey.
</div>
`;

            return;
        }

        if (
            activeJourney &&
            noteQuestion.startsWith("save start location:")
        ) {

            const startLocation = question
                .replace(/save start location:/i, "")
                .trim();

            activeJourney.startLocation =
                startLocation;

            activeJourney.timeline.push(
                "🧭 Starting Location Saved: " +
                startLocation
            );

            showActiveJourneyBox();

            result.innerHTML = `
<div class="card">
    <strong>🧭 Start Location Saved</strong>

    <br><br>

    ${startLocation}

    <br><br>

    I'll remember where you started.
</div>
`;

            return;
        }

        if (
            activeJourney &&
            (
                noteQuestion === "show directories" ||
                noteQuestion === "show my directories" ||
                noteQuestion === "what directories do i have"
            )
        ) {

            if (!activeJourney.directories || activeJourney.directories.length === 0) {

                result.innerHTML = `
<div class="card">
    <strong>🏢 Directories</strong>

    <br><br>

    No directories saved for this journey yet.
</div>
`;

                return;
            }

            let directoriesHtml = "";

            activeJourney.directories.forEach((directory, index) => {

                directoriesHtml += `
${index + 1}. ${directory}<br><br>
`;
            });

            result.innerHTML = `
<div class="card">
    <strong>🏢 Saved Directory Information</strong>

    <br><br>

    ${directoriesHtml}
</div>
`;

            return;
        }

        if (
            activeJourney &&
            (
                noteQuestion === "show my notes" ||
                noteQuestion === "show notes" ||
                noteQuestion === "what notes do i have"
            )
        ) {

            if (activeJourney.notes.length === 0) {

                result.innerHTML = `
<div class="card">
    <strong>📝 Notes</strong>

    <br><br>

    No notes saved for this journey yet.
</div>
`;

                return;
            }

            let notesHtml = "";

            activeJourney.notes.forEach((note, index) => {

                notesHtml += `
${index + 1}. ${note}<br><br>
`;
            });

            result.innerHTML = `
<div class="card">
    <strong>📝 Notes</strong>

    <br><br>

    ${notesHtml}
</div>
`;

            return;
        }

        if (
            activeJourney &&
            (
                noteQuestion === "show my questions" ||
                noteQuestion === "show questions" ||
                noteQuestion === "what questions do i have"
            )
        ) {

            if (activeJourney.questionsForDoctor.length === 0) {

                result.innerHTML = `
<div class="card">
    <strong>❓ Saved Questions</strong>

    <br><br>

    No saved questions for this journey yet.
</div>
`;

                return;
            }

            let questionsHtml = "";

            activeJourney.questionsForDoctor.forEach((question, index) => {

                questionsHtml += `
${index + 1}. ${question}<br><br>
`;
            });

            result.innerHTML = `
<div class="card">
    <strong>❓ Saved Questions</strong>

    <br><br>

    ${questionsHtml}
</div>
`;

            return;
        }

        if (
            activeJourney &&
            (
                noteQuestion === "show my medications" ||
                noteQuestion === "show medications" ||
                noteQuestion === "what medications do i have"
            )
        ) {

            if (activeJourney.medications.length === 0) {

                result.innerHTML = `
<div class="card">
    <strong>💊 Medications</strong>

    <br><br>

    No medications saved for this journey yet.
</div>
`;

                return;
            }

            let medicationsHtml = "";

            activeJourney.medications.forEach((medication, index) => {

                medicationsHtml += `
${index + 1}. ${medication}<br><br>
`;
            });

            result.innerHTML = `
<div class="card">
    <strong>💊 Medications</strong>

    <br><br>

    ${medicationsHtml}
</div>
`;

            return;
        }

        if (
            activeJourney &&
            (
                noteQuestion === "show my appointments" ||
                noteQuestion === "show appointments" ||
                noteQuestion === "what appointments do i have"
            )
        ) {

            if (activeJourney.appointments.length === 0) {

                result.innerHTML = `
<div class="card">
    <strong>📅 Appointments</strong>

    <br><br>

    No appointments saved for this journey yet.
</div>
`;

                return;
            }

            let appointmentsHtml = "";

            activeJourney.appointments.forEach((appointment, index) => {

                appointmentsHtml += `
${index + 1}. ${appointment}<br><br>
`;
            });

            result.innerHTML = `
<div class="card">
    <strong>📅 Appointments</strong>

    <br><br>

    ${appointmentsHtml}
</div>
`;

            return;
        }

        if (
            activeJourney &&
            (
                noteQuestion === "show my instructions" ||
                noteQuestion === "show instructions" ||
                noteQuestion === "what instructions do i have"
            )
        ) {

            if (activeJourney.staffInstructions.length === 0) {

                result.innerHTML = `
<div class="card">
    <strong>👩‍⚕️ Instructions</strong>

    <br><br>

    No instructions saved for this journey yet.
</div>
`;

                return;
            }

            let instructionsHtml = "";

            activeJourney.staffInstructions.forEach((instruction, index) => {

                instructionsHtml += `
${index + 1}. ${instruction}<br><br>
`;
            });

            result.innerHTML = `
<div class="card">
    <strong>👩‍⚕️ Instructions</strong>

    <br><br>

    ${instructionsHtml}
</div>
`;

            return;
        }

        if (
            recallQuestion.includes("where did i park") ||
            recallQuestion.includes("take me to my ride") ||
            recallQuestion.includes("where am i parked") ||
            recallQuestion.includes("were did i park") ||
            recallQuestion.includes("where's my car") ||
            recallQuestion.includes("where is my car") ||
            recallQuestion.includes("find my car") ||
            recallQuestion.includes("where is my bike") ||
            recallQuestion.includes("find my bike") ||
            recallQuestion.includes("take me back to my bike") ||



            recallQuestion.includes("where is my ride") ||
            recallQuestion.includes("find my ride") ||

            recallQuestion.includes("where's my ride") ||
            recallQuestion.includes("wheres my ride") ||

            recallQuestion.includes("where's my bike") ||
            recallQuestion.includes("wheres my bike") ||

            recallQuestion.includes("where's my car") ||
            recallQuestion.includes("wheres my car") ||

            recallQuestion.includes("take me back to my ride") ||
            recallQuestion.includes("return me to my ride") ||
            recallQuestion.includes("help me find my ride") ||

            recallQuestion.includes("take me back to my car") ||
            recallQuestion.includes("return me to my car") ||
            recallQuestion.includes("get me back to my car") ||
            recallQuestion.includes("help me find my car") ||

            recallQuestion.includes("return me to my bike") ||
            recallQuestion.includes("help me find my bike") ||

            recallQuestion.includes("i forgot where i parked")
        ) {

            if (activeJourney?.parkingLocation) {


                result.innerHTML = `
<div class="card">
    <strong>🚗 Vehicle Location</strong>

    <br><br>

    Your vehicle is located at:

    <br><br>

    ${activeJourney.parkingLocation}

    <br><br>

    <button onclick="openGoogleMapsToParkingLocation()">
        🚗 Navigate To My Ride
    </button>

    <br><br>

    Can I help you further? 🧭
</div>
`;

                return;
            }



            result.innerHTML = `
<div class="card">
    <strong>📍 Parking Reminder</strong>

    <br><br>

    I don't have a vehicle location recorded for this journey.
</div>
`;

            return;
        }

        if (
            recallQuestion.includes("take me back") ||
            recallQuestion.includes("go back") ||
            recallQuestion.includes("return me") ||
            recallQuestion.includes("get back there") ||
            recallQuestion.includes("help me get back") ||
            recallQuestion.includes("get me back") ||

            recallQuestion.includes("take me back to where i started") ||
            recallQuestion.includes("where did i start") ||
            recallQuestion.includes("return me to my starting location") ||
            recallQuestion.includes("take me back to my starting location")
        ) {

            if (
                recallQuestion.includes("where did i park") ||
                recallQuestion.includes("where is my car") ||
                recallQuestion.includes("take me to my ride") ||
                recallQuestion.includes("take me back to my car") ||
                recallQuestion.includes("return me to my vehicle") ||
                recallQuestion.includes("take me to my vehicle")
            ) {

                if (activeJourney?.parkingLocation) {

                    result.innerHTML = `
<div class="card">
    <strong>🚗 Parking Location</strong>

    <br><br>

    Your vehicle is parked at:

    <br><br>

    ${activeJourney.parkingLocation}

    <br><br>

    <button onclick="openGoogleMapsToParkingLocation()">
        🚗 Navigate To My Ride
    </button>
</div>
`;

                    return;
                }

                result.innerHTML = `
<div class="card">
    <strong>🚗 Parking Reminder</strong>

    <br><br>

    I don't have a parking location recorded for this journey.
</div>
`;

                return;
            }

            if (activeJourney?.startLocation) {

                result.innerHTML = `
<div class="card">
    <strong>🧭 Starting Location</strong>

    <br><br>

    You started at:

    <br><br>

    ${activeJourney.startLocation}

    <br><br>

<button onclick="openGoogleMapsToStartLocation()">
    🧭 Return To Start
</button>

<br><br>

Can I help you get back there?
</div>
`;

                return;
            }

            result.innerHTML = `
<div class="card">
    <strong>🧭 Starting Location</strong>

    <br><br>

    I don't have a starting location recorded for this journey.
</div>
`;

            return;
        }

        if (
            activeJourney &&

            !question.includes("?") &&

            !noteQuestion.startsWith("can ") &&
            !noteQuestion.startsWith("where ") &&
            !noteQuestion.startsWith("find ") &&
            !noteQuestion.startsWith("search ") &&
            !noteQuestion.startsWith("help me find") &&
            !noteQuestion.startsWith("take me to") &&
            !noteQuestion.startsWith("navigate to") &&
            !noteQuestion.startsWith("directions to") &&
            !noteQuestion.startsWith("go to") &&
            !noteQuestion.startsWith("head to") &&
            !noteQuestion.startsWith("headed to") &&

            (
                noteQuestion.includes("department") ||
                noteQuestion.includes("hematology") ||
                noteQuestion.includes("elevator") ||
                noteQuestion.includes("directory") ||
                noteQuestion.includes("check-in") ||
                noteQuestion.includes("reception")
            )
        ) {

            if (
                activeJourney.directories.includes(question)
            ) {

                result.innerHTML = `
<div class="card">
    <strong>🏢 Directory Already Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I already have that directory information.
</div>
`;

                return;
            }

            activeJourney.directories.push(question);

            activeJourney.timeline.push(
                "🏢 Directory Saved: " +
                question
            );

            showActiveJourneyBox();

            result.innerHTML = `
<div class="card">
    <strong>🏢 Directory Info Saved</strong>

    <br><br>

    ${question}

    <br><br>

    I'll remember this for finding the right office or department.
</div>
`;

            return;
        }

        const parkingQuestion = question.toLowerCase();

        console.log(
            "PARKING CHECK:",
            parkingQuestion,
            activeJourney
        );

        if (
            parkingQuestion.startsWith("parking location:") ||
            parkingQuestion.startsWith("save parking:") ||
            parkingQuestion.startsWith("my parking is:") ||
            parkingQuestion.includes("my car is") ||
            parkingQuestion.includes("i left my car") ||
            parkingQuestion.includes("i parked") ||
            parkingQuestion.includes("parked on") ||
            parkingQuestion.includes("parked near") ||
            parkingQuestion.includes("parked by") ||
            parkingQuestion.includes("parked at") ||
            parkingQuestion.includes("my car is parked") ||
            parkingQuestion.includes("my vehicle is parked") ||
            parkingQuestion.includes("i parked") ||
            parkingQuestion.includes("my car is parked") ||
            parkingQuestion.includes("my vehicle is parked") ||
            parkingQuestion.includes("left my bike") ||
            parkingQuestion.includes("i left my bike") ||
            parkingQuestion.includes("left my ride") ||
            parkingQuestion.includes("my ride is ") ||
            recallQuestion.includes("take me back to my ride") ||
            recallQuestion.includes("return me to my ride") ||
            parkingQuestion.includes("i left my ride") ||
            parkingQuestion.includes("my ride's at") ||
            parkingQuestion.includes("my bike is") ||
            parkingQuestion.includes("my bicycle is") ||
            parkingQuestion.includes("my car is at") ||
            parkingQuestion.includes("near the elevator") ||
            parkingQuestion.includes("near elevator") ||
            parkingQuestion.includes("near the stairs") ||
            parkingQuestion.includes("by the stairs") ||
            parkingQuestion.includes("parking structure")
        ) {

            if (activeJourney) {
                pendingLocationClassification = question
                    .replace(/i'?m parked near\s*/i, "")
                    .replace(/i'?m parked at\s*/i, "")
                    .replace(/i parked near\s*/i, "")
                    .replace(/i parked at\s*/i, "")
                    .replace(/parked by\s*/i, "")
                    .replace(/i'?m parked by\s*/i, "")
                    .replace(/my car is at\s*/i, "")
                    .replace(/my ride is at\s*/i, "")
                    .replace(/my ride is near\s*/i, "")
                    .replace(/i'?m at\s*/i, "")
                    .replace(/i'?m by\s*/i, "")
                    .replace(/i'?m near\s*/i, "")
                    .replace(/i'?m\s*/i, "")
                    .replace(/i am at\s*/i, "")
                    .replace(/i am near\s*/i, "")
                    .replace(/i am by\s*/i, "")

                    .replace(/this is where i parked\s*/i, "")
                    .replace(/this is my parking location\s*/i, "")
                    .replace(/this is where my car is\s*/i, "")

                    .trim();


                result.innerHTML = `
<div class="card">
    <strong>📍 Location Found</strong>

    <br><br>

    Should I remember this as?

    <br><br>

    <button onclick="saveLocationType('parking')">
        🚗 Parking
    </button>

    <br><br>

    <button onclick="saveLocationType('start')">
        🧭 Start
    </button>

    <br><br>

    <button onclick="saveLocationType('both')">
        🚗🧭 Both
    </button>
</div>
`;

                return;
            }
        }

        const destinationUpdate =
            question.toLowerCase();

        if (
            activeJourney &&
            (
                destinationUpdate.includes("i'm going here") ||
                destinationUpdate.includes("im going here") ||
                destinationUpdate.includes("the address is") ||
                destinationUpdate.includes("it says") ||
                destinationUpdate.includes("this is the address") ||
                destinationUpdate.includes("found the address") ||
                destinationUpdate.includes("i found the address") ||
                destinationUpdate.includes("located at") ||
                destinationUpdate.includes("265 cohasset") ||
                destinationUpdate.includes("here it is") ||
                destinationUpdate.includes("cohasset rd")

            )
        ) {
            activeJourney.destination = question;

            activeJourney.answers.push(
                "Destination updated."
            );

            result.innerHTML = `
<div class="card">
    <strong>🧭 Destination Updated</strong>
    <br><br>
    I saved this as your journey destination:
    <br><br>
    ${activeJourney.destination}
    <br><br>
    I can use this for the rest of your journey.
</div>
`;

            return;
        }

        const navigationSearch =
            question.toLowerCase();

        console.log(
            "NAVIGATION SEARCH:",
            navigationSearch
        );

        if (
            (
                navigationSearch.includes("directions") ||
                navigationSearch.includes("route") ||
                navigationSearch.includes("fastest route") ||
                navigationSearch.includes("walking to") ||
                navigationSearch.includes("walk to") ||
                navigationSearch.includes("drive to") ||
                navigationSearch.includes("driving to") ||
                navigationSearch.includes("ride to") ||
                navigationSearch.includes("bike to") ||
                navigationSearch.includes("navigate to") ||

                navigationSearch.includes("search for") ||
                navigationSearch.includes("search the") ||
                navigationSearch.startsWith("search ") ||
                navigationSearch.includes("look up") ||
                navigationSearch.includes("find the") ||
                navigationSearch.includes("find ") ||
                navigationSearch.includes("directory") ||
                navigationSearch.includes("department") ||
                navigationSearch.includes("office") ||
                navigationSearch.includes("building") ||

                navigationSearch.includes("go to") ||
                navigationSearch.includes("get to") ||
                navigationSearch.includes("head to") ||
                navigationSearch.includes("travel to") ||
                navigationSearch.includes("on my way to") ||
                navigationSearch.includes("how do i get to") ||
                navigationSearch.includes("take me to")
            )

            &&

!navigationSearch.includes("take me to my ride")

) {

    console.log(
        "SEARCHPLACE TRIGGERED:",
        cleanedSearch
    );

    const isInformationSearch =

                navigationSearch.includes("search") ||
                navigationSearch.includes("look up") ||
                navigationSearch.includes("directory") ||
                navigationSearch.includes("department") ||
                navigationSearch.includes("office") ||
                navigationSearch.includes("building") ||
                navigationSearch.includes("hematology") ||
                navigationSearch.includes("radiology") ||
                navigationSearch.includes("oncology") ||
                navigationSearch.includes("financial aid") ||
                navigationSearch.includes("admissions");

            const cleanedSearch =
                question
                    .replace(
                        /^(search the|search for|search|directory for|go to|find)\s+/i,
                        ""
                    )
                    .trim();

            console.log(
                "SEARCHPLACE TRIGGERED:",
                cleanedSearch
            );

            const placeResponse = await fetch("/api/searchPlace", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query: cleanedSearch
                })
            });

            const placeData = await placeResponse.json();


            if (isInformationSearch) {

                const searchResponse =
                    await fetch(
                        "/api/searchDestinationInfo",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                destination:
                                    activeJourney?.destination || "",
                                question
                            })
                        }
                    );

                const searchData =
                    await searchResponse.json();

                pendingDestinationSearch =
                    question
                        .replace(
                            /^(search the|search for|search|directory for|go to|find)\s+/i,
                            ""
                        )
                        .trim();

                result.innerHTML = `
<div class="card">
    <strong>🔍 Information Search</strong>

    <br><br>

    Search prepared for:

    <br><br>

   ${question}

<br><br>

<strong>Search Domain:</strong>

<br>

${searchData.searchDomain || "No domain found"}

<br><br>

<a
href="https://www.google.com/search?q=${encodeURIComponent(
                    `site:${searchData.searchDomain} ${question}`
                )}"
target="_blank">

    🔍 Search ${activeJourney?.destination || "Site"}

</a>

<br><br>

<button onclick="saveInformationSearchAsDestination()">
    📍 Save As Destination
</button>

<br><br>

<button onclick="saveVerifiedDestinationAddress()">
    📬 Save Verified Address
</button>

<br><br>

After you find the building, office, or department,
copy the full address and paste it here.

Example:

Anthropology Lab
Butte Hall
400 W 1st St
Chico, CA
</div>
`;

                return;
            }

            if (
                questionInfo.mentionsParking &&
                questionInfo.asksRoute
            ) {
                pendingParkingLocation = question;
            }

            result.innerHTML = `
<div class="card">
    <strong>🧭 Verified Map Search</strong>

    ${pendingParkingLocation
                    ? `
            <br><br>
            <strong>📍 Parking location detected.</strong>
            <br><br>
            <button onclick="savePendingParking()">
                Save Parking
            </button>
            `
                    : ""
                }

    <br><br>
    I should not guess exact directions without verified map data.
    <br><br>
    Open this map search:
    <br><br>
    <a href="${placeData.mapUrl}" target="_blank">
        Search Google Maps
    </a>
    <br><br>
    After you open it, come back and tell me what you see.
</div>
`;
            return;
        }

        if (
            activeJourney?.destinationAddress &&
            (
                lowerQuestion.includes("how do i get") ||
                lowerQuestion.includes("directions") ||
                lowerQuestion.includes("navigate") ||
                lowerQuestion.includes("take me there") ||
                lowerQuestion.includes("route to")
            )
        ) {

            result.innerHTML = `
<div class="card">
    <strong>🧭 Navigation Available</strong>

    <br><br>

    Destination:

    <br><br>

    ${activeJourney.destinationAddress}

    <br><br>

    <button onclick="openGoogleMapsToDestinationDetails()">
        🧭 Open Google Maps
    </button>
</div>
`;

            return;
        }

        const response = await fetch("/api/askOurFlow", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question,
                history: conversationHistory.slice(-20),

                destination:
                    activeJourney?.destination || "",

                destinationAddress:
                    activeJourney?.destinationAddress || "",

                parkingLocation:
                    activeJourney?.parkingLocation || "",

                arrivalTips:
                    activeJourney?.arrivalTips || "",

                startLocation:
                    activeJourney?.startLocation || "",

                journeyStatus:
                    activeJourney?.journeyStatus || "",

                landmarkImageData
            })
        });

        const data = await response.json();

        if (
            activeJourney &&
            !isMemoryCommand &&
            !isUtilityQuestion
        ) {

            activeJourney.answers.push(data.answer);
        }

        result.innerHTML = `
<div class="card">
    <strong>🧭 OurFlow</strong><br><br>
    ${data.answer}
</div>
`;

    } catch (error) {

        console.error(error);

        result.innerHTML = `
<div class="card">
    <strong>🧭 OurFlow</strong><br><br>
    Error contacting OurFlow.
</div>
`;
    }
}

