const { setupBluetooth, controlLed } = require('./bluetooth');
const { commands } = require('./commands');
const { calculateRgbWithBrightness } = require('./brightness');

// Parse arguments
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase() || 'status';

// Color values for RGB mode
let red = 255, green = 0, blue = 0;
let brightness = 100; // Default brightness
let fromBrightness = 0;
let toBrightness = 100;

if (command === 'rgb' || command === 'pulse' || command === 'flash' || command === 'running' || command === 'smooth') {
  if (args.length < 4) {
    console.error('Error: This command requires 3 color values (R G B). Example: rgb 255 0 0');
    console.error('Tip: Optionally add a 4th argument for brightness (0-100). Example: rgb 0 255 0 50');
    process.exit(1);
  }
  red = parseInt(args[1], 10);
  green = parseInt(args[2], 10);
  blue = parseInt(args[3], 10);
  
  if (command === 'smooth') {
    if (args.length >= 5) {
      fromBrightness = parseInt(args[4], 10);
      if (isNaN(fromBrightness)) {
        console.error('Error: Invalid from brightness value. Use a number between 0-100.');
        process.exit(1);
      }
      fromBrightness = Math.min(100, Math.max(0, fromBrightness));
    }
    
    if (args.length >= 6) {
      toBrightness = parseInt(args[5], 10);
      if (isNaN(toBrightness)) {
        console.error('Error: Invalid to brightness value. Use a number between 0-100.');
        process.exit(1);
      }
      toBrightness = Math.min(100, Math.max(0, toBrightness));
    }
  } else if (args.length >= 5) {
    brightness = parseInt(args[4], 10);
    if (isNaN(brightness)) {
      console.error('Error: Invalid brightness value. Use a number between 0-100.');
      process.exit(1);
    }
    brightness = Math.min(100, Math.max(0, brightness));
  }

  if (isNaN(red) || isNaN(green) || isNaN(blue)) {
    console.error('Error: Invalid RGB values. Use numbers between 0-255.');
    process.exit(1);
  }
  
  red = Math.min(255, Math.max(0, red));
  green = Math.min(255, Math.max(0, green));
  blue = Math.min(255, Math.max(0, blue));
}

if (command === 'status') {
  console.log('ELK-BLEDOM LED Controller');
  console.log('Available commands:');
  console.log('  on           - turn on LEDs (white color)');
  console.log('  off          - turn off LEDs');
  console.log('  red          - set red color');
  console.log('  green        - set green color');
  console.log('  blue         - set blue color');
  console.log('  rgb R G B [B] - set custom RGB color (0-255) and optional brightness (0-100)');
  console.log('                Example: rgb 255 0 0 50 (red at 50% brightness)');
  console.log('\nAnimation commands:');
  console.log('  pulse R G B [B] - smooth fade in/out effect');
  console.log('  smooth R G B [FROM] [TO] - smooth transition between brightness levels');
  console.log('                    Example: smooth 255 0 0 0 100 (red from 0% to 100%)');
  console.log('  flash R G B [B] - quick on/off blinking');
  console.log('  rainbow [B]     - cycle through rainbow colors');
  console.log('  running R G B [B] - moving light effect');
  process.exit(0);
}

// Prepare color values object
const colorValues = {
  commands,
  calculateRgbWithBrightness,
  red,
  green,
  blue,
  brightness,
  fromBrightness,
  toBrightness
};

// Setup Bluetooth and control LED
setupBluetooth((peripheral) => {
  controlLed(peripheral, command, colorValues);
}); 