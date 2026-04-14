import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.RENDER_BASEURL || "https://project-management-main-self-1.onrender.com"
})

export default api