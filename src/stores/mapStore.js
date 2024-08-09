import { defineStore } from "pinia";

export const useMapStore = defineStore("mapStore", {
  state: () => ({
    currentLocation: { lat: null, lng: null },
    destination: null,
    directions: null,
  }),
  actions: {
    setCurrentLocation(location) {
      this.currentLocation = location;
    },
    setDestination(location) {
      this.destination = location;
    },
    setDirections(directions) {
      this.directions = directions;
    },
  },
});
