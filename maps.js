
function openGoogleMapsForJourney() {

    if (!activeJourney) {
        alert("No active journey found.");
        return;
    }

    const mapDestination =
        activeJourney.mapLink ||
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(activeJourney.destination);

    window.open(mapDestination, "_blank");
}

function analyzeUserQuestion(question) {
    const text = question.toLowerCase();

    return {
        mentionsParking:
            text.includes("i'm parked") ||
            text.includes("i parked") ||
            text.includes("my car is") ||
            text.includes("parking location:"),

        asksRoute:
            text.includes("directions") ||
            text.includes("route") ||
            text.includes("fastest route") ||
            text.includes("walking to") ||
            text.includes("walk to") ||
            text.includes("drive to") ||
            text.includes("driving to") ||
            text.includes("ride to") ||
            text.includes("bike to") ||
            text.includes("navigate to") ||
            text.includes("go to") ||
            text.includes("get to") ||
            text.includes("head to") ||
            text.includes("travel to") ||
            text.includes("on my way to") ||
            text.includes("take me to") ||
            text.includes("how do i get to"),

        travelMode:
            text.includes("walking") || text.includes("walk to") ? "walking" :
                text.includes("driving") || text.includes("drive to") ? "driving" :
                    text.includes("bike") || text.includes("ride to") ? "biking/riding" :
                        "unknown"
    };
}

function openGoogleMapsToStartLocation() {


    if (!activeJourney?.startLocation) {
        alert("No starting location recorded.");
        return;
    }

    const mapUrl =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(activeJourney.startLocation);

    window.open(mapUrl, "_blank");
}

function openGoogleMapsToParkingLocation() {

    if (!activeJourney?.parkingLocation) {
        alert("No parking location recorded.");
        return;
    }

    const mapUrl =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(activeJourney.parkingLocation);

    window.open(mapUrl, "_blank");
}



async function getArrivalHelp(destination) {

    if (!activeJourney) {
        return;
    }

    activeJourney.arrivalTips =
        "Searching for arrival tips...";

    showActiveJourneyBox();

    const placeResponse = await fetch("/api/searchPlace", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query: destination + " entrance parking directions"
        })
    });

    const placeData = await placeResponse.json();

    activeJourney.arrivalTips =
        placeData.arrivalTip ||
        "Map search ready. Open Google Maps and check Street View, reviews, parking, and entrance details before leaving.";

    activeJourney.timeline.push(
        "🚪 Arrival Help Saved: " +
        activeJourney.arrivalTips
    );

    activeJourney.mapLink =
        placeData.mapUrl;

    showActiveJourneyBox();
}