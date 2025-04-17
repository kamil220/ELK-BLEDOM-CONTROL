// Placeholder for future animation functions
// This file will contain various LED animation patterns

const { makeCommand } = require('./commands');
const { calculateRgbWithBrightness } = require('./brightness');

// Helper function to create a delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Pulse animation - smoothly fades in and out
async function pulse(characteristic, r, g, b, brightness = 100, duration = 2000, steps = 20) {
  const stepDelay = duration / (steps * 2);
  
  for (let i = 0; i < steps; i++) {
    const currentBrightness = (i / steps) * brightness;
    const [finalR, finalG, finalB] = calculateRgbWithBrightness(r, g, b, currentBrightness);
    await characteristic.writeAsync(makeCommand(finalR, finalG, finalB), true);
    await delay(stepDelay);
  }
  
  for (let i = steps; i >= 0; i--) {
    const currentBrightness = (i / steps) * brightness;
    const [finalR, finalG, finalB] = calculateRgbWithBrightness(r, g, b, currentBrightness);
    await characteristic.writeAsync(makeCommand(finalR, finalG, finalB), true);
    await delay(stepDelay);
  }
}

// Smooth transition between brightness levels
async function smooth(characteristic, r, g, b, fromBrightness = 0, toBrightness = 100, duration = 2000, steps = 20) {
  const stepDelay = duration / steps;
  
  for (let i = 0; i <= steps; i++) {
    const currentBrightness = fromBrightness + (i / steps) * (toBrightness - fromBrightness);
    const [finalR, finalG, finalB] = calculateRgbWithBrightness(r, g, b, currentBrightness);
    await characteristic.writeAsync(makeCommand(finalR, finalG, finalB), true);
    await delay(stepDelay);
  }
}

// Flash animation - quick on/off
async function flash(characteristic, r, g, b, brightness = 100, count = 5, duration = 200) {
  const [finalR, finalG, finalB] = calculateRgbWithBrightness(r, g, b, brightness);
  const offCommand = makeCommand(0, 0, 0);
  const onCommand = makeCommand(finalR, finalG, finalB);
  
  for (let i = 0; i < count; i++) {
    await characteristic.writeAsync(onCommand, true);
    await delay(duration);
    await characteristic.writeAsync(offCommand, true);
    await delay(duration);
  }
}

// Rainbow animation - cycles through colors
async function rainbow(characteristic, brightness = 100, duration = 5000, steps = 30) {
  const stepDelay = duration / steps;
  
  for (let i = 0; i < steps; i++) {
    const hue = (i / steps) * 360;
    const [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
    const [finalR, finalG, finalB] = calculateRgbWithBrightness(r, g, b, brightness);
    await characteristic.writeAsync(makeCommand(finalR, finalG, finalB), true);
    await delay(stepDelay);
  }
}

// Running light animation - creates a moving light effect through color transitions
async function runningLight(characteristic, r, g, b, brightness = 100, duration = 2000, steps = 20) {
  const stepDelay = duration / steps;
  const [finalR, finalG, finalB] = calculateRgbWithBrightness(r, g, b, brightness);
  
  // Create a sequence of colors that will create a "running" effect
  const colors = [
    [finalR, 0, 0],        // Red
    [0, finalG, 0],        // Green
    [0, 0, finalB],        // Blue
    [finalR, finalG, 0],   // Yellow
    [0, finalG, finalB],   // Cyan
    [finalR, 0, finalB],   // Magenta
    [finalR, finalG, finalB] // White
  ];
  
  // Run through the sequence multiple times
  for (let cycle = 0; cycle < 3; cycle++) {
    for (let i = 0; i < colors.length; i++) {
      const [currentR, currentG, currentB] = colors[i];
      await characteristic.writeAsync(makeCommand(currentR, currentG, currentB), true);
      await delay(stepDelay);
    }
  }
  
  // Return to the original color
  await characteristic.writeAsync(makeCommand(finalR, finalG, finalB), true);
}

// Helper function to convert HSL to RGB
function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

module.exports = {
  pulse,
  smooth,
  flash,
  rainbow,
  runningLight
}; 