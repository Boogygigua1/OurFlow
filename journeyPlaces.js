function getJourneyPlaces(journey) {

    if (!journey) {
        return [];
    }

    const destinationAddress =
        journey.verifiedDestinationAddress ||
        journey.destinationAddress ||
        "";

    const destinationTitle =
        journey.destination ||
        journey.destinationDetail ||
        destinationAddress;

    const destinationPlace =
        destinationTitle || destinationAddress
            ? {
                id: "destination",
                type: "destination",
                label: "Destination",
                title: destinationTitle,
                detail: journey.destinationDetail || "",
                address: destinationAddress,
                verified: Boolean(journey.verifiedDestinationAddress),
                navigationAction: "destination",
                context: []
            }
            : null;

    const parkingAddress =
        journey.parkingLocationAddress || "";

    const parkingTitle =
        journey.parkingLocation ||
        parkingAddress;

    const parkingPlace =
        parkingTitle || parkingAddress
            ? {
                id: "parking",
                type: "parking",
                label: "Parking",
                title: parkingTitle,
                detail: journey.parkingLocation || "",
                address: parkingAddress,
                verified: Boolean(
                    journey.parkingVerified ||
                    journey.parkingLocationAddress
                ),
                navigationAction: "parking",
                context: []
            }
            : null;

    const startAddress =
        journey.startLocationAddress || "";

    const startTitle =
        journey.startLocation ||
        startAddress;

    const startPlace =
        startTitle || startAddress
            ? {
                id: "start",
                type: "start",
                label: "Starting Location",
                title: startTitle,
                detail: journey.startLocation || "",
                address: startAddress,
                verified: Boolean(
                    journey.startVerified ||
                    journey.startLocationAddress
                ),
                navigationAction: "start",
                context: []
            }
            : null;

    return [
        destinationPlace,
        parkingPlace,
        startPlace
    ].filter(Boolean);
}

function findJourneyPlaceById(placeId) {

    return getJourneyPlaces(activeJourney)
        .find(place => place.id === placeId) ||
        null;
}

function navigateToJourneyPlace(placeId) {

    const place =
        findJourneyPlaceById(placeId);

    if (!place) {
        alert("That remembered place is not available yet.");
        return;
    }

    if (place.navigationAction === "destination") {
        openGoogleMapsToDestination();
        return;
    }

    if (place.navigationAction === "parking") {
        openGoogleMapsToParkingLocation();
        return;
    }

    if (place.navigationAction === "start") {
        openGoogleMapsToStartLocation();
    }
}
