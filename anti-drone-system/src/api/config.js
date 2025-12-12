// src/api/config.js

export const BASE_URL = "http://192.168.100.102:8080/api";
export const TOKEN_acess = "ab17c39f-e6bf-4a69-936d-8f40a9a6341c";
export const command_center = `${BASE_URL}/df/sensors`;
export const cone_angle = `${BASE_URL}/jammer/1/status`;
export const drone_data = `${BASE_URL}/df/drones`;
export const logout = `${BASE_URL}/auth/logout`;
export const login = `${BASE_URL}/auth/login`;
export const azimuth = `${BASE_URL}/jammer/1/command`;
export const df_connectivity = `${BASE_URL}/df/connectivity`;

 
export const hardwareSystemId = 1;
export const sensorId = 1;
export const freqStart = 30000;
export const freqStop = 6000000;
export const spanPoints = 910;
 
export const subscribe = `http://192.168.100.102:8084/api/websocket/start-continuous-reception?sensorId=${sensorId}&freqStart=${freqStart}&freqStop=${freqStop}&spanPoints=${spanPoints}`;
// export const simulate = `${BASE_URL}/df/${hardwareSystemId}/simulate`;
export const spectrum_data = "http://192.168.100.102:8084/api/decoded/data/all";
 




