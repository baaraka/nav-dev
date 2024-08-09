import { Loader } from "@googlemaps/js-api-loader";

let loaderInstance = null;

export const getGoogleMapsLoader = () => {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"],
    });
  }
  return loaderInstance;
};
