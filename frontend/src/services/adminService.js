import API from "./api.js";

// OVERVIEW STATS
export const getAdminStats = async () => {
  const response = await API.get("/admin/stats");
  return response.data;
};

// List all modules for the admin dashboard only
export const listModules = async () => {
  const response = await API.get("/admin/modules");
  return response.data;
};

// List all modules for the public-facing module list (no auth required)
export const getModules = async () => {
  const response = await API.get("/modules");
  return response.data;
};

export const createModule = async ({ code, name }) => {
  const response = await API.post("/admin/modules", { code, name });
  return response.data;
};

export const updateModule = async (moduleId, { name, isActive } = {}) => {
  const body = {};
  if (name !== undefined)     body.name = name;
  if (isActive !== undefined) body.is_active = isActive;
 
  const response = await API.patch(`/admin/modules/${moduleId}`, body);
  return response.data;
};

export const deleteModule = async (moduleId) => {
  await API.delete(`/admin/modules/${moduleId}`);
};

// VENUES
// List all venues for the admin dashboard only
export const listVenues = async () => {
  const response = await API.get("/admin/venues");
  return response.data;
};

// List all venues for the public-facing venue list (no auth required)
export const getVenues = async () => {
  const response = await API.get("/venues");
  return response.data;
};

export const createVenue = async ({ name, capacity, isAvailable = true }) => {
  const response = await API.post("/admin/venues", {
    name,
    capacity,
    is_available: isAvailable,
  });
  return response.data;
};

export const updateVenue = async (venueId, { name, capacity, isAvailable } = {}) => {
  const body = {};
  if (name !== undefined)        body.name = name;
  if (capacity !== undefined)    body.capacity = capacity;
  if (isAvailable !== undefined) body.is_available = isAvailable;
 
  const response = await API.patch(`/admin/venues/${venueId}`, body);
  return response.data;
};

export const deleteVenue = async (venueId) => {
  await API.delete(`/admin/venues/${venueId}`);
};

// STUDENTS
export const listStudents = async () => {
  const response = await API.get("/admin/students");
  return response.data;
};

export const getStudent = async (studentId) => {
  const response = await API.get(`/admin/students/${studentId}`);
  return response.data;
};

export const suspendStudent = async (studentId, payload) => {
  const response = await API.patch(`/admin/students/${studentId}/suspend`, payload);
  return response.data;
};

export const unsuspendStudent = async (studentId, payload = {}) => {
  const response = await API.patch(`/admin/students/${studentId}/unsuspend`, payload);
  return response.data;
};

// MODERATION
export const listReports = async (statusFilter) => {
  const params = {};
  if (statusFilter) params.status = statusFilter;
  const response = await API.get("/admin/reports", { params });
  return response.data;
};

export const reviewReport = async (reportId, payload) => {
  const response = await API.patch(`/admin/reports/${reportId}/review`, payload);
  return response.data;
};

export const fileReport = async (payload) => {
  const response = await API.post("/reports", payload);
  return response.data;
};

//AUDIT LOGS
export const getAuditLog = async ({ limit = 50, offset = 0 } = {}) => {
  const response = await API.get("/admin/audit-log", { params: { limit, offset } });
  return response.data;
};

// PUBLIC
export const listPublicModules = async () => {
  const response = await API.get("/modules");
  return response.data;
};

export const listPublicVenues = async () => {
  const response = await API.get("/venues");
  return response.data;
};