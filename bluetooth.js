const noble = require('@abandonware/noble');
const { pulse, smooth, flash, rainbow, runningLight } = require('./animations');

// UUID values
const SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000fff3-0000-1000-8000-00805f9b34fb';

// Delay function
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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

// Main LED control function
async function controlLed(peripheral, command, colorValues) {
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
        await sendCommand(char, colorValues.commands.white, "Turn On (White)");
        break;

      case 'off':
        // Turn off LED
        await sendCommand(char, colorValues.commands.off, "Turn Off");
        break;
        
      case 'red':
        // Set red color
        await sendCommand(char, colorValues.commands.red, "Set Red");
        break;
        
      case 'green':
        // Set green color
        await sendCommand(char, colorValues.commands.green, "Set Green");
        break;
        
      case 'blue':
        // Set blue color
        await sendCommand(char, colorValues.commands.blue, "Set Blue");
        break;
        
      case 'rgb':
        // Set custom RGB color with brightness
        const [finalR, finalG, finalB] = colorValues.calculateRgbWithBrightness(
          colorValues.red,
          colorValues.green,
          colorValues.blue,
          colorValues.brightness
        );
        await sendCommand(
          char,
          colorValues.commands.rgb(finalR, finalG, finalB),
          `Set RGB(${colorValues.red}, ${colorValues.green}, ${colorValues.blue}) @ ${colorValues.brightness}%`
        );
        break;

      case 'pulse':
        await pulse(char, colorValues.red, colorValues.green, colorValues.blue, colorValues.brightness);
        break;

      case 'smooth':
        await smooth(char, colorValues.red, colorValues.green, colorValues.blue, 
          colorValues.fromBrightness || 0, 
          colorValues.toBrightness || colorValues.brightness
        );
        break;

      case 'flash':
        await flash(char, colorValues.red, colorValues.green, colorValues.blue, colorValues.brightness);
        break;

      case 'rainbow':
        await rainbow(char, colorValues.brightness);
        break;

      case 'running':
        await runningLight(char, colorValues.red, colorValues.green, colorValues.blue, colorValues.brightness);
        break;
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
function setupBluetooth(callback) {
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
      callback(peripheral);
    }
  });
}

module.exports = {
  setupBluetooth,
  controlLed,
  cleanup
}; 