<template>
  <div id="map" class="h-full w-full rounded-lg"></div>
</template>

<script setup>
import { onMounted, watch, ref } from "vue";
import { Loader } from "@googlemaps/js-api-loader";

const props = defineProps({
  start: {
    type: Object,
    required: true,
  },
  end: {
    type: Object,
    required: true,
  },
});

const map = ref(null);
const directionsService = ref(null);
const directionsRenderer = ref(null);

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const loadGoogleMaps = async () => {
  if (!window.google || !window.google.maps) {
    const loader = new Loader({
      apiKey,
      version: "weekly",
    });
    await loader.load();
  }
};

const initializeMap = () => {
  map.value = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -6.7924, lng: 39.2083 }, // Dar es Salaam coordinates
    zoom: 12,
  });

  directionsService.value = new google.maps.DirectionsService();
  directionsRenderer.value = new google.maps.DirectionsRenderer();
  directionsRenderer.value.setMap(map.value);

  calculateAndDisplayRoute();
};

const calculateAndDisplayRoute = () => {
  directionsService.value.route(
    {
      origin: props.start,
      destination: props.end,
      travelMode: google.maps.TravelMode.DRIVING,
    },
    (response, status) => {
      if (status === "OK") {
        directionsRenderer.value.setDirections(response);
      } else {
        console.error("Directions request failed due to " + status);
      }
    }
  );
};

onMounted(async () => {
  await loadGoogleMaps();
  initializeMap();
});

watch(() => props.start, calculateAndDisplayRoute);
watch(() => props.end, calculateAndDisplayRoute);
</script>

<style scoped>
#map {
  height: 100%;
  width: 100%;
}
</style>
