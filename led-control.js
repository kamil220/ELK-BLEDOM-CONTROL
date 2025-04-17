const noble = require('@abandonware/noble');

// UUID values
const SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000fff3-0000-1000-8000-00805f9b34fb';

// Device specific constants based on testing
const MIN_DEVICE_BRIGHTNESS = 1;
const MAX_DEVICE_BRIGHTNESS = 228;

// Delay function
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Parse arguments
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase() || 'status';

// Color values for RGB mode
let red = 255, green = 0, blue = 0;
let brightness = 100; // Default brightness

// Test configuration

if (command === 'rgb') {
  if (args.length < 4) {
    console.error('Error: rgb command requires 3 color values (R G B). Example: rgb 255 0 0');
    console.error('Tip: Optionally add a 4th argument for brightness (0-100). Example: rgb 0 255 0 50');
    process.exit(1);
  }
  red = parseInt(args[1], 10);
  green = parseInt(args[2], 10);
  blue = parseInt(args[3], 10);
  
  if (args.length >= 5) {
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

// Cleanup function
async function cleanup(peripheral) {
  try {
    if (peripheral && peripheral.state === 'connected') {
      await peripheral.disconnectAsync();
    }
  } catch (err) {
    console.error('Error during disconnect:', err.message);
  }
  process.exit(0);
}

// Command format that worked during testing
// Data: [0x7e, 0x07, 0x05, 0x03, 0xff, 0x00, 0x00, 0x10, 0xef]
function makeCommand(r, g, b) {
  return Buffer.from([0x7E, 0x07, 0x05, 0x03, r, g, b, 0x10, 0xEF]);
}

// Command definitions
const commands = {
  red: makeCommand(255, 0, 0),
  green: makeCommand(0, 255, 0),
  blue: makeCommand(0, 0, 255),
  white: makeCommand(255, 255, 255),
  off: makeCommand(0, 0, 0),
  rgb: (r, g, b) => makeCommand(r, g, b)
};

// Function to send command to device
async function sendCommand(characteristic, command, description) {
  try {
    await characteristic.writeAsync(command, true);
    return true;
  } catch (err) {
    try {
      await characteristic.writeAsync(command, false);
      return true;
    } catch (err2) {
      console.error(`Error sending command '${description}': ${err2.message}`);
      return false;
    }
  }
}

// Main LED control function
async function controlLed(peripheral) {
  try {
    // Connect to device
    await peripheral.connectAsync();
    
    // Discover characteristics
    const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
      [SERVICE_UUID],
      [CHARACTERISTIC_UUID]
    );
    
    if (!characteristics || characteristics.length === 0) {
      throw new Error('Required characteristic not found');
    }
    
    const char = characteristics[0];
    
    // Execute appropriate operation based on command
    switch (command) {
      case 'on':
        // Turn on white light
        await sendCommand(char, commands.white, "Turn On (White)");
        break;

      case 'off':
        // Turn off LED
        await sendCommand(char, commands.off, "Turn Off");
        break;
        
      case 'red':
        // Set red color
        await sendCommand(char, commands.red, "Set Red");
        break;
        
      case 'green':
        // Set green color
        await sendCommand(char, commands.green, "Set Green");
        break;
        
      case 'blue':
        // Set blue color
        await sendCommand(char, commands.blue, "Set Blue");
        break;
        
      case 'rgb':
        // Set custom RGB color with brightness
        const [finalR, finalG, finalB] = calculateRgbWithBrightness(red, green, blue, brightness);
        await sendCommand(
          char,
          commands.rgb(finalR, finalG, finalB),
          `Set RGB(${red}, ${green}, ${blue}) @ ${brightness}%`
        );
        break;
        
      case 'status':
      default:
        console.log('ELK-BLEDOM LED Controller');
        console.log('Available commands:');
        console.log('  on           - turn on LEDs (white color)');
        console.log('  off          - turn off LEDs');
        console.log('  red          - set red color');
        console.log('  green        - set green color');
        console.log('  blue         - set blue color');
        console.log('  rgb R G B [B] - set custom RGB color (0-255) and optional brightness (0-100)');
        console.log('                Example: rgb 255 0 0 50 (red at 50% brightness)');
        await cleanup(peripheral);
        return;
    }
    
    // Wait a moment before disconnecting
    await delay(500);
    
    // Disconnect
    await cleanup(peripheral);
    
  } catch (err) {
    console.error('Operation failed:', err);
    await cleanup(peripheral);
  }
}

// BLE setup
noble.on('stateChange', async (state) => {
  if (state === 'poweredOn') {
    await noble.startScanningAsync([], false);
  } else {
    console.error(`Bluetooth unavailable: ${state}`);
    await noble.stopScanningAsync();
  }
});

noble.on('discover', async (peripheral) => {
  const name = peripheral.advertisement.localName;
  if (name && name.startsWith('ELK')) {
    await noble.stopScanningAsync();
    await controlLed(peripheral);
  }
});

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