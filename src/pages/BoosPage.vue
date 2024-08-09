<template>
  <div :style="{ height: 'calc(100vh - 5rem)' }">
    <div class="relative w-full h-full">
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
const map = ref(null);
const directionsRenderer = ref(null);
const routeDoc = doc(db, "routes", "currentRoute");

const currentLocation = ref("");
const destination = ref("");
const distance = ref("");
const duration = ref("");

let currentLocationMarker = null;
let destinationMarker = null;

onMounted(() => {
  const loader = new Loader({
    apiKey,
    version: "weekly",
  });

  loader.load().then(() => {
    map.value = new google.maps.Map(document.getElementById("map"), {
      center: { lat: -6.7924, lng: 39.2083 }, // Dar es Salaam
      zoom: 12,
    });

    directionsRenderer.value = new google.maps.DirectionsRenderer({
      polylineOptions: {
        strokeColor: "#00008B", // Dark blue color for main route
        strokeOpacity: 1.0,
        strokeWeight: 6,
      },
      suppressMarkers: true,
      map: map.value,
    });

    // Firestore real-time listener
    onSnapshot(routeDoc, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        currentLocation.value = data.origin;
        destination.value = data.destination;
        distance.value = data.distance;
        duration.value = data.duration;

        // Update map with the route
        const request = {
          origin: data.origin,
          destination: data.destination,
          travelMode: google.maps.TravelMode.DRIVING,
        };
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.value.setDirections(result);
          } else {
            console.error("Directions request failed due to " + status);
          }
        });

        // Set current location and destination markers
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: data.origin }, (results, status) => {
          if (status === "OK" && results[0]) {
            if (currentLocationMarker) {
              currentLocationMarker.setMap(null);
            }
            currentLocationMarker = new google.maps.Marker({
              position: results[0].geometry.location,
              map: map.value,
              title: "Current Location",
              label: {
                text: "Start",
                color: "#000000",
                fontSize: "16px",
                fontWeight: "bold",
              },
            });
          }
        });

        geocoder.geocode({ address: data.destination }, (results, status) => {
          if (status === "OK" && results[0]) {
            if (destinationMarker) {
              destinationMarker.setMap(null);
            }
            destinationMarker = new google.maps.Marker({
              position: results[0].geometry.location,
              map: map.value,
              title: "Destination",
              label: {
                text: "End",
                color: "#FF0000",
                fontSize: "16px",
                fontWeight: "bold",
              },
            });
          }
        });
      } else {
        console.log("No such document!");
      }
    });
  });
});
</script>
