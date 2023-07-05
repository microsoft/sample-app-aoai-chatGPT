import axios from 'axios';

const axiosInstance = axios.create({
  // Configure the base URL if you have a common API URL
  // baseURL: 'https://api.example.com',

  // Add custom headers if required
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

export default axiosInstance;