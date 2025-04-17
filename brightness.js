// Device specific constants based on testing
const MIN_DEVICE_BRIGHTNESS = 1;
const MAX_DEVICE_BRIGHTNESS = 228;

// Helper function for RGB brightness calculation
function calculateRgbWithBrightness(r, g, b, brightnessPercent) {
  if (brightnessPercent <= 0) {
    return [0, 0, 0];
  }
  
  const scale = brightnessPercent / 100;
  const range = MAX_DEVICE_BRIGHTNESS - MIN_DEVICE_BRIGHTNESS;
  
  const calculateChannel = (value) => {
    if (value === 0) return 0;
    // Scale the 0-255 value to the device's effective range based on brightness
    const scaledDeviceValue = (value / 255) * (MIN_DEVICE_BRIGHTNESS + scale * range);
    return Math.max(MIN_DEVICE_BRIGHTNESS, Math.round(scaledDeviceValue)); // Ensure minimum is 1 if original was > 0
  };

  const finalR = calculateChannel(r);
  const finalG = calculateChannel(g);
  const finalB = calculateChannel(b);

  return [finalR, finalG, finalB];
}

module.exports = {
  calculateRgbWithBrightness,
  MIN_DEVICE_BRIGHTNESS,
  MAX_DEVICE_BRIGHTNESS
}; 