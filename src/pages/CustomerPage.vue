<template>
  <div :style="{ height: 'calc(100vh - 5rem)' }">
    <div class="relative w-full h-full">
      <div id="map" class="w-full h-full"></div>
      <div
        id="info"
        class="absolute bottom-4 left-4 z-10 p-2 w-80 border border-gray-300 rounded-lg shadow-md bg-white"
      >
        <p>
          Rider's Current Location:
          <span id="rider-location">{{ riderLocation }}</span>
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
        <p>
          Estimated Arrival Time:
          <span id="arrival-time">{{ arrivalTime }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Loader } from "@googlemaps/js-api-loader";
import { db } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const routeDoc = doc(db, "routes", "currentRoute");
const riderDoc = doc(db, "riders", "currentRider"); // Assumes this document contains rider's location

const map = ref(null);
const mainDirectionsRenderer = ref(null);
const riderMarker = ref(null);
const destinationMarker = ref(null);

const riderLocation = ref("");
const destination = ref("");
const distance = ref("");
const duration = ref("");
const arrivalTime = ref("");

// Function to update the route
const updateRoute = (origin, destination) => {
  const directionsService = new google.maps.DirectionsService();
  directionsService.route(
    {
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
    },
    (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        mainDirectionsRenderer.value.setDirections(result);
        const routeData = result.routes[0].legs[0];
        distance.value = routeData.distance.text;
        duration.value = routeData.duration.text;
        arrivalTime.value = calculateArrivalTime(routeData.duration.text);
      } else {
        console.error("Directions request failed due to " + status);
      }
    }
  );
};

// Function to calculate estimated arrival time
const calculateArrivalTime = (duration) => {
  const now = new Date();
  const durationInMinutes = parseDuration(duration);
  const arrival = new Date(now.getTime() + durationInMinutes * 60000);
  return arrival.toLocaleTimeString();
};

// Function to parse duration text into minutes
const parseDuration = (duration) => {
  const timeParts = duration.split(" ");
  let totalMinutes = 0;
  for (let i = 0; i < timeParts.length; i += 2) {
    const value = parseInt(timeParts[i]);
    if (timeParts[i + 1].includes("hour")) {
      totalMinutes += value * 60;
    } else if (timeParts[i + 1].includes("min")) {
      totalMinutes += value;
    }
  }
  return totalMinutes; // Return minutes
};

onMounted(() => {
  const loader = new Loader({
    apiKey,
    version: "weekly",
    libraries: ["places"],
  });

  loader.load().then(() => {
    map.value = new google.maps.Map(document.getElementById("map"), {
      center: { lat: -6.7924, lng: 39.2083 }, // Dar es Salaam
      zoom: 12,
    });

    mainDirectionsRenderer.value = new google.maps.DirectionsRenderer({
      polylineOptions: {
        strokeColor: "#00008B",
        strokeOpacity: 1.0,
        strokeWeight: 6,
      },
      suppressMarkers: false,
    });
    mainDirectionsRenderer.value.setMap(map.value);

    // Firestore real-time listener for route updates
    onSnapshot(routeDoc, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        destination.value = data.destination;

        // Update the route on the map
        if (riderMarker.value) {
          const riderPosition = {
            lat: parseFloat(data.origin.lat),
            lng: parseFloat(data.origin.lng),
          };
          riderMarker.value.setPosition(riderPosition);
        }

        updateRoute(data.origin, data.destination);

        // Place a marker for the destination
        if (destinationMarker.value) {
          destinationMarker.value.setMap(null);
        }

        destinationMarker.value = new google.maps.Marker({
          position: {
            lat: parseFloat(data.destination.lat),
            lng: parseFloat(data.destination.lng),
          },
          map: map.value,
          title: "Destination",
          label: {
            text: "End",
            color: "#FF0000",
            fontSize: "16px",
            fontWeight: "bold",
          },
        });
      } else {
        console.log("No such document!");
      }
    });

    // Firestore real-time listener for rider's location updates
    onSnapshot(riderDoc, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const riderData = docSnapshot.data();
        if (riderData.location) {
          const riderPosition = new google.maps.LatLng(
            riderData.location.lat,
            riderData.location.lng
          );
          if (!riderMarker.value) {
            riderMarker.value = new google.maps.Marker({
              position: riderPosition,
              map: map.value,
              title: "Rider",
              label: {
                text: "Rider",
                color: "#0000FF",
                fontSize: "16px",
                fontWeight: "bold",
              },
            });
          } else {
            riderMarker.value.setPosition(riderPosition);
          }

          // Update rider location in the UI
          riderLocation.value = `${riderData.location.lat}, ${riderData.location.lng}`;
        }
      } else {
        console.log("No such document!");
      }
    });
  });
});
</script>

<style scoped>
/* You can add your CSS styles here */
</style>
