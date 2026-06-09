
function openGoogleMapsForJourney() {

    if (!activeJourney) {
        alert("No active journey found.");
        return;
    }

    const mapDestination =
        activeJourney.mapLink ||

        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(
            activeJourney.destinationAddress ||
            activeJourney.destination
        );

    window.open(mapDestination, "_blank");
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

    const parkingQuery =
        activeJourney.parkingLocation.match(/\d{3,}.*$/)
            ? activeJourney.parkingLocation.match(/\d{3,}.*$/)[0]
            : activeJourney.parkingLocation;

    const mapUrl =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(parkingQuery);

    window.open(mapUrl, "_blank");
}

function openGoogleMapsToDestinationDetails() {

    if (!activeJourney?.destinationAddress) {
        alert("No destination details recorded.");
        return;
    }

    const mapUrl =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(
            activeJourney.destinationAddress
        );

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