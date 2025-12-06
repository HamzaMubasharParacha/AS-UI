export const MARKER_ICONS = {
  // Original icons
  default: {
    name: "Default Pin",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#00ff41"/>
    </svg>`,
    color: "#00ff41"
  },
  warning: {
    name: "Warning",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="#ff9900"/>
      <circle cx="12" cy="15.5" r="0.5" fill="black"/>
    </svg>`,
    color: "#ff9900"
  },
  target: {
    name: "Target",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="6" stroke="#ff4444" stroke-width="2" fill="none"/>
      <circle cx="12" cy="12" r="3" fill="#ff4444"/>
      <circle cx="12" cy="12" r="10" stroke="#ff4444" stroke-width="1" fill="none"/>
    </svg>`,
    color: "#ff4444"
  },
  info: {
    name: "Information",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill="#3498db"/>
      <path d="M12 8V8.01V8ZM12 11V16V16.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="19" r="1" fill="white"/>
    </svg>`,
    color: "#3498db"
  },
  check: {
    name: "Check Point",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill="#2ecc71"/>
      <path d="M7 12L11 16L17 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    color: "#2ecc71"
  },
  star: {
    name: "Star",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#f39c12"/>
    </svg>`,
    color: "#f39c12"
  },
  flag: {
    name: "Flag",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.4 6L14 4H5V21H7V14H12.6L13 16H20V6H14.4Z" fill="#9b59b6"/>
    </svg>`,
    color: "#9b59b6"
  },
  circle: {
    name: "Circle",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#e74c3c"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>`,
    color: "#e74c3c"
  },
  square: {
    name: "Square",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="12" height="12" fill="#1abc9c"/>
      <rect x="9" y="9" width="6" height="6" fill="white"/>
    </svg>`,
    color: "#1abc9c"
  },
  triangle: {
    name: "Triangle",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 22H22L12 2Z" fill="#e67e22"/>
      <path d="M12 6L6 18H18L12 6Z" fill="white"/>
    </svg>`,
    color: "#e67e22"
  },
  
  // -------------------------------------------------------------------
  // 1. Drone Related Icons
  // -------------------------------------------------------------------
  enemyDrone: {
    name: "🛸 Enemy Drone",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L9 9H15L12 3Z" fill="#ff4444"/>
      <circle cx="12" cy="15" r="4" fill="#ff4444"/>
      <path d="M8 15H16M12 11V19" stroke="white" stroke-width="2"/>
    </svg>`,
    color: "#ff4444"
  },
  friendlyDrone: {
    name: "🚁 Friendly Drone",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L9 9H15L12 3Z" fill="#2ecc71"/>
      <circle cx="12" cy="15" r="4" fill="#2ecc71"/>
      <path d="M8 15H16M12 11V19" stroke="white" stroke-width="2"/>
    </svg>`,
    color: "#2ecc71"
  },
  suspiciousDrone: {
    name: "🔴 Suspicious Drone",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#ff4444"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
      <circle cx="12" cy="12" r="3" fill="#ff4444"/>
      <path d="M6 6L18 18" stroke="white" stroke-width="2"/>
    </svg>`,
    color: "#ff4444"
  },
  droneAlert: {
    name: "⚠️ Drone Alert",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L3 21H21L12 3Z" fill="#ff9900"/>
      <circle cx="12" cy="17" r="1" fill="white"/>
      <path d="M12 7V13" stroke="white" stroke-width="2"/>
    </svg>`,
    color: "#ff9900"
  },
  targetLock: {
    name: "🎯 Target Lock",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#ff4444" stroke-width="2"/>
      <circle cx="12" cy="12" r="6" stroke="#ff4444" stroke-width="2"/>
      <circle cx="12" cy="12" r="2" fill="#ff4444"/>
      <path d="M12 2V22M2 12H22" stroke="#ff4444" stroke-width="1"/>
    </svg>`,
    color: "#ff4444"
  },
  signalStrength: {
    name: "📡 Signal Strength",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 20L20 4L4 4L12 20Z" fill="#3498db"/>
      <path d="M12 16L16 8L8 8L12 16Z" fill="#2980b9"/>
      <path d="M12 12L14 9L10 9L12 12Z" fill="#1f6394"/>
    </svg>`,
    color: "#3498db"
  },
  trackPoint: {
    name: "✈️ Track Point",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 16V8C21 6.9 20.1 6 19 6H14L12 4H8C6.9 4 6 4.9 6 6V8H3V10H6V14H3V16H6V18C6 19.1 6.9 20 8 20H19C20.1 20 21 19.1 21 18V16H19V18H8V6H12.17L14.17 8H19V16H21Z" fill="#9b59b6"/>
      <path d="M12 9L9 13H15L12 9Z" fill="white"/>
    </svg>`,
    color: "#9b59b6"
  },
  
  // -------------------------------------------------------------------
  // 2. Radar & Sensor Icons
  // -------------------------------------------------------------------
  radarStation: {
    name: "📡 Radar Station",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#2c3e50"/>
      <path d="M12 2L20 12L12 22L4 12L12 2Z" fill="#34495e"/>
      <circle cx="12" cy="12" r="6" fill="#3498db"/>
      <path d="M12 6L18 12L12 18L6 12L12 6Z" fill="#2980b9"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
    </svg>`,
    color: "#3498db"
  },
  rfSensor: {
    name: "🛰️ RF Sensor",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#16a085"/>
      <circle cx="12" cy="12" r="7" fill="#1abc9c"/>
      <circle cx="12" cy="12" r="4" fill="#2fe2bf"/>
      <path d="M12 2V22M2 12H22" stroke="white" stroke-width="1"/>
    </svg>`,
    color: "#16a085"
  },
  signalTower: {
    name: "📶 Signal Tower",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="11" y="4" width="2" height="16" fill="#7f8c8d"/>
      <rect x="9" y="20" width="6" height="2" fill="#95a5a6"/>
      <circle cx="12" cy="8" r="2" fill="#3498db"/>
      <circle cx="12" cy="12" r="2" fill="#3498db"/>
      <circle cx="12" cy="16" r="2" fill="#3498db"/>
    </svg>`,
    color: "#3498db"
  },
  directionFinder: {
    name: "🔍 Direction Finder",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#f39c12"/>
      <path d="M12 2V22M2 12H22" stroke="white" stroke-width="2"/>
      <path d="M12 12L19 5M12 12L19 19M12 12L5 5M12 12L5 19" stroke="white" stroke-width="1"/>
      <circle cx="12" cy="12" r="3" fill="#e74c3c"/>
    </svg>`,
    color: "#f39c12"
  },
  jammer: {
    name: "🎛️ Jammer Device",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" rx="2" fill="#e74c3c"/>
      <circle cx="12" cy="12" r="6" fill="#c0392b"/>
      <path d="M8 8L16 16M16 8L8 16" stroke="white" stroke-width="2"/>
    </svg>`,
    color: "#e74c3c"
  },
  satelliteLink: {
    name: "🛰️ Satellite Link",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" fill="#3498db"/>
      <path d="M4 20L12 12L20 20" stroke="#2980b9" stroke-width="2"/>
      <circle cx="12" cy="20" r="2" fill="#2980b9"/>
    </svg>`,
    color: "#3498db"
  },
  coverageCircle: {
    name: "📍 Coverage Circle",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#3498db" fill-opacity="0.3"/>
      <circle cx="12" cy="12" r="7" stroke="#2980b9" stroke-width="2" fill="none"/>
      <circle cx="12" cy="12" r="2" fill="#e74c3c"/>
    </svg>`,
    color: "#3498db"
  },
  
  // -------------------------------------------------------------------
  // 3. Threat Level Icons
  // -------------------------------------------------------------------
  highThreat: {
    name: "🟥 High Threat",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#e74c3c"/>
      <path d="M12 8V12M12 16H12.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    color: "#e74c3c"
  },
  mediumThreat: {
    name: "🟧 Medium Threat",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#e67e22"/>
      <path d="M12 8V12M12 16H12.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    color: "#e67e22"
  },
  lowThreat: {
    name: "🟨 Low Threat",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#f1c40f"/>
      <path d="M12 8V12M12 16H12.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    color: "#f1c40f"
  },
  friendlyUnit: {
    name: "🟦 Friendly Unit",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#3498db"/>
      <path d="M7 13L10 16L17 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    color: "#3498db"
  },
  engagedTarget: {
    name: "🔥 Engaged Target",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#ff4444"/>
      <path d="M8 12H16M12 8V16" stroke="white" stroke-width="2"/>
      <path d="M8 8L16 16M16 8L8 16" stroke="white" stroke-width="1"/>
    </svg>`,
    color: "#ff4444"
  },
  neutralized: {
    name: "❌ Neutralized",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#95a5a6"/>
      <path d="M8 8L16 16M16 8L8 16" stroke="white" stroke-width="2"/>
    </svg>`,
    color: "#95a5a6"
  },
  
  // -------------------------------------------------------------------
  // 4. Area / Zone Icons
  // -------------------------------------------------------------------
  noFlyZone: {
    name: "🚫 No Fly Zone",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#e74c3c" fill-opacity="0.3"/>
      <circle cx="12" cy="12" r="8" stroke="#e74c3c" stroke-width="2" fill="none"/>
      <path d="M8 8L16 16" stroke="#e74c3c" stroke-width="3"/>
      <circle cx="12" cy="12" r="2" fill="#e74c3c"/>
    </svg>`,
    color: "#e74c3c"
  },
  restrictedZone: {
    name: "🔵 Restricted Zone",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#3498db" fill-opacity="0.3"/>
      <circle cx="12" cy="12" r="8" stroke="#3498db" stroke-width="2" fill="none" stroke-dasharray="4 4"/>
      <circle cx="12" cy="12" r="2" fill="#3498db"/>
    </svg>`,
    color: "#3498db"
  },
  dangerZone: {
    name: "🟥 Danger Zone",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#ff4444" fill-opacity="0.3"/>
      <path d="M12 2L22 22H2L12 2Z" fill="#ff4444" fill-opacity="0.5"/>
      <path d="M12 6L6 18H18L12 6Z" fill="#ff4444"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
    </svg>`,
    color: "#ff4444"
  },
  protectedZone: {
    name: "🛡️ Protected Zone",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#2ecc71" fill-opacity="0.3"/>
      <path d="M12 2L4 7V12C4 16.4 7.6 20 12 20C16.4 20 20 16.4 20 12V7L12 2Z" fill="#2ecc71" fill-opacity="0.5"/>
      <circle cx="12" cy="12" r="2" fill="#2ecc71"/>
    </svg>`,
    color: "#2ecc71"
  },
  boundaryPoint: {
    name: "🏁 Boundary Point",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#9b59b6"/>
      <rect x="8" y="8" width="8" height="8" fill="white"/>
      <circle cx="12" cy="12" r="2" fill="#9b59b6"/>
    </svg>`,
    color: "#9b59b6"
  },
  polygonNode: {
    name: "📦 Polygon Node",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#f39c12"/>
      <polygon points="12,4 20,12 12,20 4,12" fill="#e67e22"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
    </svg>`,
    color: "#f39c12"
  },
  
  // -------------------------------------------------------------------
  // 5. Vehicle / Security Team Icons
  // -------------------------------------------------------------------
  securityVehicle: {
    name: "🚔 Security Vehicle",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="16" height="6" rx="2" fill="#3498db"/>
      <circle cx="8" cy="18" r="2" fill="#2c3e50"/>
      <circle cx="16" cy="18" r="2" fill="#2c3e50"/>
      <rect x="8" y="8" width="8" height="2" fill="#2980b9"/>
      <circle cx="12" cy="9" r="1" fill="#e74c3c"/>
    </svg>`,
    color: "#3498db"
  },
  patrolJeep: {
    name: "🚓 Patrol Jeep",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 14L8 10H16L20 14V18H4V14Z" fill="#e74c3c"/>
      <circle cx="7" cy="18" r="2" fill="#2c3e50"/>
      <circle cx="17" cy="18" r="2" fill="#2c3e50"/>
      <rect x="10" y="12" width="4" height="2" fill="white"/>
    </svg>`,
    color: "#e74c3c"
  },
  securityPersonnel: {
    name: "🧍‍♂️ Security Personnel",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7" r="3" fill="#95a5a6"/>
      <path d="M12 10V20" stroke="#7f8c8d" stroke-width="2"/>
      <path d="M8 14L16 14" stroke="#7f8c8d" stroke-width="2"/>
      <path d="M10 18L14 18" stroke="#7f8c8d" stroke-width="2"/>
      <circle cx="12" cy="5" r="1" fill="#3498db"/>
    </svg>`,
    color: "#3498db"
  },
  responseTeam: {
    name: "🚨 Response Team",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3" fill="#e74c3c"/>
      <path d="M12 11V20" stroke="#e74c3c" stroke-width="2"/>
      <path d="M8 15L16 15" stroke="#e74c3c" stroke-width="2"/>
      <path d="M10 19L14 19" stroke="#e74c3c" stroke-width="2"/>
      <path d="M12 4L12 6" stroke="#f1c40f" stroke-width="2"/>
      <circle cx="12" cy="4" r="1" fill="#f1c40f"/>
    </svg>`,
    color: "#e74c3c"
  },
  militaryUnit: {
    name: "🪖 Military Unit",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3" fill="#27ae60"/>
      <path d="M12 11V20" stroke="#27ae60" stroke-width="2"/>
      <path d="M8 15L16 15" stroke="#27ae60" stroke-width="2"/>
      <path d="M10 19L14 19" stroke="#27ae60" stroke-width="2"/>
      <path d="M12 5L12 7" stroke="#2c3e50" stroke-width="2"/>
      <polygon points="10,4 14,4 13,2 11,2" fill="#2c3e50"/>
    </svg>`,
    color: "#27ae60"
  },
  
  // -------------------------------------------------------------------
  // 6. Station & Infrastructure Icons
  // -------------------------------------------------------------------
  controlCenter: {
    name: "🏠 Control Center",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20H20V8H4V20Z" fill="#3498db"/>
      <path d="M4 8L12 2L20 8" fill="#2980b9"/>
      <rect x="9" y="12" width="6" height="4" fill="#2c3e50"/>
      <circle cx="7" cy="14" r="1" fill="#f1c40f"/>
      <circle cx="17" cy="14" r="1" fill="#f1c40f"/>
    </svg>`,
    color: "#3498db"
  },
  commandRoom: {
    name: "🏢 Command Room",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" fill="#2c3e50"/>
      <rect x="8" y="8" width="8" height="8" fill="#34495e"/>
      <circle cx="12" cy="12" r="2" fill="#3498db"/>
      <rect x="6" y="6" width="2" height="2" fill="#f1c40f"/>
      <rect x="16" y="6" width="2" height="2" fill="#f1c40f"/>
    </svg>`,
    color: "#2c3e50"
  },
  baseStation: {
    name: "🏭 Base Station",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="8" width="12" height="12" fill="#7f8c8d"/>
      <rect x="8" y="4" width="8" height="4" fill="#95a5a6"/>
      <rect x="10" y="12" width="4" height="8" fill="#34495e"/>
      <circle cx="12" cy="10" r="1" fill="#f1c40f"/>
    </svg>`,
    color: "#7f8c8d"
  },
  powerUnit: {
    name: "⚡ Power Unit",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="4" width="8" height="16" fill="#f39c12"/>
      <path d="M12 8V12L15 9" stroke="#2c3e50" stroke-width="2"/>
      <circle cx="12" cy="18" r="2" fill="#e74c3c"/>
    </svg>`,
    color: "#f39c12"
  },
  server: {
    name: "💾 Server / Data Center",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" fill="#34495e"/>
      <rect x="6" y="6" width="12" height="4" fill="#2c3e50"/>
      <rect x="6" y="12" width="12" height="4" fill="#2c3e50"/>
      <circle cx="8" cy="8" r="1" fill="#2ecc71"/>
      <circle cx="8" cy="14" r="1" fill="#2ecc71"/>
      <circle cx="12" cy="8" r="1" fill="#3498db"/>
      <circle cx="12" cy="14" r="1" fill="#3498db"/>
    </svg>`,
    color: "#34495e"
  },
  
  // -------------------------------------------------------------------
  // 7. Map Utility Icons
  // -------------------------------------------------------------------
  geopoint: {
    name: "📍 Geo-location",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#3498db"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
      <path d="M12 4V8M12 16V20M4 12H8M16 12H20" stroke="white" stroke-width="1"/>
    </svg>`,
    color: "#3498db"
  },
  targetPoint: {
    name: "🎯 Target Point",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#e74c3c" stroke-width="2"/>
      <circle cx="12" cy="12" r="6" stroke="#e74c3c" stroke-width="2"/>
      <circle cx="12" cy="12" r="2" fill="#e74c3c"/>
      <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="#e74c3c" stroke-width="1"/>
    </svg>`,
    color: "#e74c3c"
  },
  settings: {
    name: "🔧 Settings / Tools",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#95a5a6"/>
      <path d="M12 4L12 8" stroke="white" stroke-width="2"/>
      <path d="M12 16L12 20" stroke="white" stroke-width="2"/>
      <path d="M4 12L8 12" stroke="white" stroke-width="2"/>
      <path d="M16 12L20 12" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="2" fill="#34495e"/>
      <path d="M15 9L18 6M9 15L6 18M15 15L18 18M9 9L6 6" stroke="#34495e" stroke-width="1"/>
    </svg>`,
    color: "#95a5a6"
  },
  timeMarker: {
    name: "⏱️ Time Marker",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#9b59b6"/>
      <circle cx="12" cy="12" r="8" fill="white"/>
      <circle cx="12" cy="12" r="1" fill="#9b59b6"/>
      <path d="M12 4L12 8" stroke="#9b59b6" stroke-width="2"/>
      <path d="M12 12L16 9" stroke="#9b59b6" stroke-width="2"/>
    </svg>`,
    color: "#9b59b6"
  },
  refresh: {
    name: "🔄 Refresh / Loop",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#3498db"/>
      <path d="M17 8L15 6C13.8 4.8 12.2 4 10.5 4C6.4 4 3 7.4 3 11.5C3 15.6 6.4 19 10.5 19C13.1 19 15.3 17.6 16.5 15.5" stroke="white" stroke-width="2"/>
      <path d="M21 8V4H17" stroke="white" stroke-width="2"/>
      <path d="M17 4L21 8" stroke="white" stroke-width="2"/>
    </svg>`,
    color: "#3498db"
  },
  surveillance: {
    name: "👁️ Surveillance",
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#2c3e50"/>
      <circle cx="12" cy="12" r="8" fill="#34495e"/>
      <circle cx="12" cy="12" r="4" fill="#3498db"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
      <path d="M4 4L8 8M20 4L16 8M4 20L8 16M20 20L16 16" stroke="#f1c40f" stroke-width="1"/>
    </svg>`,
    color: "#2c3e50"
  }
};
