type RadioStatus = "online" | "warning" | "error";

interface RadioData {
  key: string;
  name: string;
  sector: string;
  status: RadioStatus;
  signalStrength: string;
  battery: string;
  frequency: string;
  location: string;
  lastSeen: string;
  lat: number;
  lon: number;
}

type ThreatLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface DroneData {
  id: string;
  image: string;
  position: [number, number, number];
  threat_level: ThreatLevel;
  distance: number;
  speed: number;
  heading: number;
  detected_at: string;
}


const statusToThreatLevel = (status: RadioStatus): ThreatLevel => {
  switch (status) {
    case "online":
      return "LOW";
    case "warning":
      return "MEDIUM";
    case "error":
      return "HIGH";
    default:
      return "LOW";
  }
};

const lastSeenToISO = (lastSeen: string): string => {
  const now = new Date();

  if (lastSeen.includes("min")) {
    const mins = parseInt(lastSeen);
    now.setMinutes(now.getMinutes() - mins);
  } else if (lastSeen.includes("hr")) {
    const hrs = parseInt(lastSeen);
    now.setHours(now.getHours() - hrs);
  }

  return now.toISOString();
};

const randomInRange = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;


export const mapRadiosToDrones = (radios: RadioData[]): DroneData[] => {
  return radios.map((radio, index) => ({
    id: `${String(index + 1).padStart(3, "0")}`,
    image: `https://via.placeholder.com/150?text=${encodeURIComponent(
      radio.name
    )}`,
    position: [
      radio.lat,
      radio.lon,
      randomInRange(800, 2000), // altitude
    ],
    threat_level: statusToThreatLevel(radio.status),
    distance: randomInRange(800, 5000),
    speed: randomInRange(40, 150),
    heading: randomInRange(0, 360),
    detected_at: lastSeenToISO(radio.lastSeen),
  }));
};
