// Simple geocoder utility
// In production, integrate with a service like Google Maps API or Mapbox

const geocoder = {
  geocode: async (address) => {
    // Mock implementation - returns default coordinates
    // In production, replace with actual geocoding service
    return [
      {
        latitude: 12.9716,
        longitude: 77.5946,
        formattedAddress: address,
        city: 'Bangalore',
        state: 'Karnataka',
        zipcode: '560001',
        country: 'India',
      },
    ];
  },
};

module.exports = geocoder;
