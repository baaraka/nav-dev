<template>
  <div :style="{ height: 'calc(100vh - 5rem)' }">
    <div class="relative w-full h-full">
      <input
        id="autocomplete"
        type="text"
        placeholder="Search for a location"
        class="absolute top-4 left-4 z-10 p-2 w-80 border border-gray-300 rounded-lg shadow-md"
      />
      <div id="map" class="w-full h-full"></div>
      <div
        id="info"
        class="absolute bottom-4 left-4 z-10 p-2 w-80 border border-gray-300 rounded-lg shadow-md bg-white"
      >
        <p>
          Current Location:
          <span id="current-location">{{ currentLocation }}</span>
        </p>
        <p>
          Destination: <span id="destination">{{ destination }}</span>
        </p>
        <p>
          Distance: <span id="distance">{{ distance }}</span>
        </p>
        <p>
          Time: <span id="duration">{{ duration }}</span>
        </p>
        <div v-if="draggingInfo">
          <p>Drag to Change Location</p>
          <p>
            Distance to Dragged Location:
            <span>{{ draggingInfo.distance }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { getGoogleMapsLoader } from "@/utils/googleMapsLoader";
import { db } from "@/firebase";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";

const routeDoc = doc(db, "routes", "currentRoute");
const riderDoc = doc(db, "riders", "currentRider"); // Assumes this document contains rider's location

const map = ref(null);
const mainDirectionsRenderer = ref(null);
const alternativeRenderers = ref([]);
const draggingInfo = ref(null);
const currentLocation = ref("");
const destination = ref("");
const distance = ref("");
const duration = ref("");
let currentLocationMarker = null;
let destinationMarker = null;
let intervalId = null;

const updateRoute = (origin, destination) => {
  const directionsService = new google.maps.DirectionsService();
  const request = {
    origin,
    destination,
    travelMode: google.maps.TravelMode.DRIVING,
    provideRouteAlternatives: true,
  };

  directionsService.route(request, (result, status) => {
    if (status === google.maps.DirectionsStatus.OK) {
      alternativeRenderers.value.forEach((renderer) => renderer.setMap(null));
      alternativeRenderers.value = [];

      result.routes.forEach((route, index) => {
        const renderer = new google.maps.DirectionsRenderer({
          map: map.value,
          directions: result,
          routeIndex: index,
          polylineOptions: {
            strokeColor: index === 0 ? "#00008B" : "#FFA500",
            strokeOpacity: index === 0 ? 1.0 : 0.6,
            strokeWeight: index === 0 ? 6 : 4,
          },
          suppressMarkers: true,
        });
        if (index > 0) {
          google.maps.event.addListener(renderer, "click", () => {
            mainDirectionsRenderer.value.setDirections(result);
            mainDirectionsRenderer.value.setRouteIndex(index);
            const selectedRoute = result.routes[index].legs[0];
            updateRouteInfo(selectedRoute);
          });
          alternativeRenderers.value.push(renderer);
        } else {
          mainDirectionsRenderer.value = renderer;
        }
      });

      const selectedRoute = result.routes[0].legs[0];
      updateRouteInfo(selectedRoute);
    } else {
      console.error("Directions request failed due to " + status);
    }
  });
};

const updateRouteInfo = (route) => {
  setDoc(routeDoc, {
    origin: route.start_address,
    destination: route.end_address,
    distance: route.distance.text,
    duration: route.duration.text,
  }).catch((error) => {
    console.error("Error writing document: ", error);
  });

  distance.value = route.distance.text;
  duration.value = route.duration.text;
  currentLocation.value = route.start_address;
  destination.value = route.end_address;
};

const getAddress = (location, elementId) => {
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ location }, (results, status) => {
    if (status === "OK" && results[0]) {
      document.getElementById(elementId).innerText =
        results[0].formatted_address;
    } else {
      console.error("Geocode failed due to: " + status);
    }
  });
};

const calculateDistance = (start, end) => {
  const service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [start],
      destinations: [end],
      travelMode: google.maps.TravelMode.DRIVING,
    },
    (response, status) => {
      if (status === google.maps.DistanceMatrixStatus.OK) {
        const distanceValue = response.rows[0].elements[0].distance.text;
        draggingInfo.value = { distance: distanceValue };
      } else {
        console.error("Distance calculation failed due to " + status);
      }
    }
  );
};

const startRoute = () => {
  if (intervalId) {
    clearInterval(intervalId);
  }
  intervalId = setInterval(() => {
    if (currentLocationMarker && destinationMarker) {
      updateRoute(
        currentLocationMarker.getPosition(),
        destinationMarker.getPosition()
      );
    }
  }, 60000); // Update every minute
};

const initializeMap = async () => {
  const loader = getGoogleMapsLoader();

  loader.load().then(async () => {
    map.value = new google.maps.Map(document.getElementById("map"), {
      center: { lat: -6.7924, lng: 39.2083 },
      zoom: 12,
    });

    const input = document.getElementById("autocomplete");
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo("bounds", map.value);

    mainDirectionsRenderer.value = new google.maps.DirectionsRenderer({
      polylineOptions: {
        strokeColor: "#00008B",
        strokeOpacity: 1.0,
        strokeWeight: 6,
      },
      suppressMarkers: true,
    });
    mainDirectionsRenderer.value.setMap(map.value);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const currentLocationPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (!currentLocationMarker) {
          currentLocationMarker = new google.maps.Marker({
            position: currentLocationPosition,
            map: map.value,
            title: "Your Location",
            draggable: true,
            label: {
              text: "Start",
              color: "#000000",
              fontSize: "16px",
              fontWeight: "bold",
            },
          });
        } else {
          currentLocationMarker.setPosition(currentLocationPosition);
        }

        getAddress(currentLocationPosition, "current-location");

        currentLocationMarker.addListener("dragend", (event) => {
          const newLocation = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          };
          getAddress(newLocation, "current-location");
          if (destinationMarker) {
            updateRoute(newLocation, destinationMarker.getPosition());
            calculateDistance(newLocation, destinationMarker.getPosition());
          }
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            console.error("No details available for input: " + place.name);
            return;
          }

          if (!destinationMarker) {
            destinationMarker = new google.maps.Marker({
              position: place.geometry.location,
              map: map.value,
              title: "Destination",
              draggable: true,
              label: {
                text: "End",
                color: "#FF0000",
                fontSize: "16px",
                fontWeight: "bold",
              },
            });
          } else {
            destinationMarker.setPosition(place.geometry.location);
          }

          getAddress(place.geometry.location, "destination");

          destinationMarker.addListener("dragend", (event) => {
            const newDestination = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            };
            getAddress(newDestination, "destination");
            if (currentLocationMarker) {
              updateRoute(currentLocationMarker.getPosition(), newDestination);
              calculateDistance(
                currentLocationMarker.getPosition(),
                newDestination
              );
            }
          });

          updateRoute(currentLocationPosition, place.geometry.location);
        });

        const docSnapshot = await getDoc(routeDoc);
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const savedDestination = new google.maps.LatLng(data.destination);
          updateRoute(currentLocationPosition, savedDestination);
        }
      });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }

    // Real-time listener for route updates
    onSnapshot(routeDoc, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        currentLocation.value = data.origin;
        destination.value = data.destination;
        distance.value = data.distance;
        duration.value = data.duration;

        if (currentLocationMarker && destinationMarker) {
          updateRoute(
            currentLocationMarker.getPosition(),
            destinationMarker.getPosition()
          );
        }
      } else {
        console.error("No such document!");
      }
    });

    // Real-time listener for rider's location updates
    onSnapshot(riderDoc, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const riderData = docSnapshot.data();
        if (riderData.location) {
          const riderLocation = new google.maps.LatLng(
            riderData.location.lat,
            riderData.location.lng
          );
          if (currentLocationMarker) {
            currentLocationMarker.setPosition(riderLocation);
            getAddress(riderLocation, "current-location");
            if (destinationMarker) {
              updateRoute(riderLocation, destinationMarker.getPosition());
              calculateDistance(riderLocation, destinationMarker.getPosition());
            }
          }
        }
      } else {
        console.error("No such document!");
      }
    });

    startRoute();
  });
};

onMounted(() => {
  initializeMap();
});

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<style scoped>
#map {
  height: 100%;
}
</style>
