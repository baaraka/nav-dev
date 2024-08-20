<template>
  <div :style="{ height: 'calc(100vh - 5rem)' }">
    <div class="relative w-full h-full">
      <div id="map" class="w-full h-full"></div>
      <div
        id="info"
        class="absolute bottom-4 left-4 z-10 p-2 w-80 border border-gray-300 rounded-lg shadow-md bg-white"
      >
        <!-- <p>
          Rider's Current Location:
          <span id="rider-location">{{ riderLocation }}</span>
        </p> -->
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
const riderDoc = doc(db, "riders", "currentRider");

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

  if (!origin || !destination) {
    console.error("Invalid origin or destination for directions request.");
    return;
  }

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
  return totalMinutes;
};

onMounted(() => {
  const loader = new Loader({
    apiKey,
    version: "weekly",
    libraries: ["places"],
  });

  loader
    .load()
    .then(() => {
      map.value = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -6.7924, lng: 39.2083 },
        zoom: 12,
      });

      mainDirectionsRenderer.value = new google.maps.DirectionsRenderer({
        polylineOptions: {
          strokeColor: "#00008B",
          strokeOpacity: 1.0,
          strokeWeight: 6,
        },
        suppressMarkers: true,
      });
      mainDirectionsRenderer.value.setMap(map.value);

      onSnapshot(routeDoc, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log("Route Data:", data); // Debugging line
          destination.value = `${data.destination.lat}, ${data.destination.lng}`;

          const origin = new google.maps.LatLng(
            data.origin.lat,
            data.origin.lng
          );
          const dest = new google.maps.LatLng(
            data.destination.lat,
            data.destination.lng
          );

          updateRoute(origin, dest);

          if (!riderMarker.value) {
            riderMarker.value = new google.maps.Marker({
              position: origin,
              map: map.value,
              label: "Rider",
            });
          } else {
            riderMarker.value.setPosition(origin);
          }

          if (destinationMarker.value) {
            destinationMarker.value.setPosition(dest);
          } else {
            destinationMarker.value = new google.maps.Marker({
              position: dest,
              map: map.value,
              label: "Destination",
            });
          }
        } else {
          console.error("No such document! Document path:", routeDoc.path);
        }
      });

      onSnapshot(riderDoc, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const riderData = docSnapshot.data();
          console.log("Rider Data:", riderData); // Debugging line
          if (riderData.location) {
            const riderPosition = new google.maps.LatLng(
              riderData.location.lat,
              riderData.location.lng
            );

            if (riderMarker.value) {
              riderMarker.value.setPosition(riderPosition);
            } else {
              riderMarker.value = new google.maps.Marker({
                position: riderPosition,
                map: map.value,
                label: "Rider",
              });
            }

            riderLocation.value = `${riderPosition.lat()}, ${riderPosition.lng()}`;
          } else {
            console.error("No location data found for rider.");
          }
        } else {
          console.error("No such document! Document path:", riderDoc.path);
        }
      });
    })
    .catch((error) => {
      console.error("Failed to load Google Maps:", error);
    });
});
</script>

<style scoped>
#map {
  width: 100%;
  height: 100%;
}
</style>

