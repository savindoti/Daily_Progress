export const API_BASE_URL = "http://127.0.0.1:8000/api";

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
