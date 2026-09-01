import API from "./api.js";

// GET /me/profile
export const getProfile = async () => {
  const response = await API.get("/me/profile");
  return response.data;
};

// PATCH /me/profile
export const updateProfile = async ({ programme, bio }) => {
  const body = {};
  if (programme !== undefined) body.programme = programme;
  if (bio !== undefined)       body.bio = bio;

  const response = await API.patch("/me/profile", body);
  return response.data;
};

// POST /me/modules/{module_id}
export const enrollModule = async (moduleId) => {
  const response = await API.post(`/me/modules/${moduleId}`);
  return response.data;
};

// DELETE /me/modules/{module_id}
export const unenrollModule = async (moduleId) => {
  const response = await API.delete(`/me/modules/${moduleId}`);
  return response.data;
};

// GET /me/groups
export const getMyGroups = async () => {
  const response = await API.get("/me/groups");
  return response.data;
};