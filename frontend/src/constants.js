export const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "ongoing", label: "Ongoing" },
  { value: "resolved", label: "Resolved" },
];

export const DEFAULT_FORM = {
  date: new Date().toISOString().slice(0, 10),
  province: "",
  district: "",
  municipality: "",
  details: "",
  organization_name: "",
  contact_person: "",
  contact_number: "",
  status: "pending",
};

// Location data will be loaded from API
export let LOCATIONS_DATA = {
  provinces: [],
  districts: {},
  municipalities: {},
};

export async function loadLocationsData() {
  try {
    const response = await fetch(`${API_BASE_URL}/locations/`);
    if (response.ok) {
      LOCATIONS_DATA = await response.json();
      return LOCATIONS_DATA;
    }
  } catch (error) {
    console.error("Error loading locations:", error);
  }
  return LOCATIONS_DATA;
}
