import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Request interceptor to add JWT token to Authorization header if it exists
// This ensures that all requests made through this API instance
// will include the token for authentication if the user is logged in.
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// List of all groups, optionally filtered by module_code and study_date
// used by browse groups page and search bar. Returns an array of GroupResponse objects.
export const listGroups = async ({ moduleCode, studyDate } = {}) => {
  const params = {};
  if (moduleCode) params.module_code = moduleCode;
  if (studyDate)  params.study_date  = studyDate;

  const response = await API.get("/groups", { params });
  return response.data; // array of GroupResponse objects
};

// GET SINGLE GROUP
// GET /groups/{id} — full detail for one group
export const getGroup = async (groupId) => {
  const response = await API.get(`/groups/${groupId}`);
  return response.data;
};

// CREATE GROUP
// POST /groups — requires JWT, used by CreateGroupPage
export const createGroup = async (payload) => {
  const response = await API.post("/groups", payload);
  return response.data;
};

// DELETE GROUP
// DELETE /groups/{id} — only the creator can delete their group
export const deleteGroup = async (groupId) => {
  const response = await API.delete(`/groups/${groupId}`);
  return response.data;
};

// GET GROUP MEMBERS
// GET /groups/{id}/members — returns { group_id, members: [user_id, ...] }
export const getGroupMembers = async (groupId) => {
  const response = await API.get(`/groups/${groupId}/members`);
  return response.data;
};

// JOIN GROUP
// This is instant, there is no "pending" approval step in the current backend.
// Joining immediately adds the user as a member.
// Please note, it will be revisited once a request/approval system exists.
export const joinGroup = async (groupId) => {
  const response = await API.post(`/groups/${groupId}/join`);
  return response.data;
};

// LEAVE GROUP
// POST /groups/{id}/leave
export const leaveGroup = async (groupId) => {
  const response = await API.post(`/groups/${groupId}/leave`);
  return response.data;
};

// Since the backend does not support filtering by creator, we fetch all groups and filter
// them on the frontend. This is not efficient for large datasets, but it works for now.
export const getMyCreatedGroups = async (userId) => {
  const allGroups = await listGroups();
  return allGroups.filter((group) => group.created_by === userId);
};

// Checks membership for every group then returns only the groups where the user is a member.
// This is not efficient for large datasets, but it works while no dedicated endpoint exists.
export const getMyJoinedGroups = async (userId) => {
  const allGroups = await listGroups();

  // Use Promise.all to fetch members for all groups in parallel, then filter based on membership
  const results = await Promise.all(
    allGroups.map(async (group) => {
      try {
        const memberData = await getGroupMembers(group.id);
        const isMember = memberData.members.includes(userId);
        return isMember ? group : null;
      } catch {
        return null; // skip groups where member fetch fails
      }
    })
  );

  // Remove nulls and keep only groups where the user is a member
  return results.filter((group) => group !== null);
};