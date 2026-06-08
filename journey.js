
        function saveJourney() {


            const result =
                document.getElementById("result");

            if (!activeJourney) return;

            if (savedJourneys.length >= JOURNEY_LIMIT) {

                showJourneyUpgradeBox();

                return;
            }

            const journeyToSave = { ...activeJourney };

            savedJourneys.push(journeyToSave);

            localStorage.setItem(
                "savedJourneys",
                JSON.stringify(savedJourneys)
            );

            result.innerHTML = `
<div class="card">
    <strong>🧭 Journey Saved</strong><br><br>

    Destination:
    ${journeyToSave.destination}

    <br><br>

    Events:
    ${journeyToSave.timeline?.length || 0}

    <br><br>

    Your journey has been saved and closed.

    <br><br>

    Start a new journey anytime by typing:

    <br><br>

    Start journey to [destination]


</div>
`;

            activeJourney = null;

            localStorage.removeItem(
                "activeJourney"
            );

            document.getElementById(
                "activeJourneyBox"
            ).innerHTML = "";

            document.getElementById(
                "questionInput"
            ).value = "";
        }
