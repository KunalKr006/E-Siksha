import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://e-siksha.onrender.com",
  withCredentials: true,
  headers: {
    'Accept': 'application/json'
  }
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = JSON.parse(sessionStorage.getItem("accessToken")) || "";

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Don't set Content-Type for FormData, let the browser set it with boundary
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (err) => Promise.reject(err)
);

export default axiosInstance;
