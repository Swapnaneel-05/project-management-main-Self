import axios from "axios";

const api = axios.create({
  baseURL: process.env.RENDER_BASEURL || "http://localhost:5000/"
})

export default api