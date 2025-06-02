import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://192.168.100.10:5000';

export const API = axios.create({ baseURL });
