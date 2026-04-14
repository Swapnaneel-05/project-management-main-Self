import axios from "axios";

const api = axios.create({
  baseURL: "https://project-management-main-self-1.onrender.com"
})

export default api