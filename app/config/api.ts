// config/api.ts
const API_BASE_URL = 'http://qubis.pl:4000/api';

export const API_ENDPOINTS = {
  location: {
    update: `${API_BASE_URL}/location/update`,
    all: `${API_BASE_URL}/location/all`,
    latest: (id: number) => `${API_BASE_URL}/location/latest/${id}`,
  },
  firefighters: {
    list: `${API_BASE_URL}/firefighters`,
    byPhone: (phone: string) => `${API_BASE_URL}/firefighters/phone/${encodeURIComponent(phone)}`,
    equipment: (id: number) => `${API_BASE_URL}/firefighters/${id}/equipment`,
  },
  equipment: {
    categories: `${API_BASE_URL}/equipment/categories`,
    items: `${API_BASE_URL}/equipment/items`,
  },
  vehicles: {
    list: () => `${API_BASE_URL}/vehicles`,
    get: (id: number) => `${API_BASE_URL}/vehicles/${id}`,
    create: `${API_BASE_URL}/vehicles`,
    update: (id: number) => `${API_BASE_URL}/vehicles/${id}`,
    delete: (id: number) => `${API_BASE_URL}/vehicles/${id}`,
  },
  stationEquipment: {
    list: () => `${API_BASE_URL}/station-equipment`,
    get: (id: number) => `${API_BASE_URL}/station-equipment/${id}`,
    create: `${API_BASE_URL}/station-equipment`,
    update: (id: number) => `${API_BASE_URL}/station-equipment/${id}`,
    delete: (id: number) => `${API_BASE_URL}/station-equipment/${id}`,
  },
};

export const OSRM = {
  route: (fromLng: number, fromLat: number, toLng: number, toLat: number) =>
    `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
};

export const NOMINATIM = {
  search: (query: string) =>
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
};
