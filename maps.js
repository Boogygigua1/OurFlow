
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
        "https://www.google.com/maps/dir/?api=1" +
        "&destination=" +
        encodeURIComponent(
            activeJourney.startLocation
        );

    window.open(mapUrl, "_blank");
}

function openGoogleMapsToParkingLocation() {

    if (!activeJourney?.parkingLocation) {
        alert("No parking location recorded.");
        return;
    }

    const mapUrl =
        "https://www.google.com/maps/dir/?api=1" +
        "&destination=" +
        encodeURIComponent(
            activeJourney.parkingLocation
        );

    window.open(mapUrl, "_blank");
}

function openGoogleMapsToDestinationDetails(mode = "driving") {

    if (!activeJourney?.destinationAddress) {
        alert("No destination details recorded.");
        return;
    }

    const mapUrl =
        "https://www.google.com/maps/dir/?api=1" +
        "&destination=" +
        encodeURIComponent(
            activeJourney.destinationAddress
        ) +
        "&travelmode=" +
        mode;

    window.open(mapUrl, "_blank");
}