# ELK-BLEDOM LED Controller

A set of tools for controlling ELK-BLEDOM LED strips via Bluetooth. These scripts allow you to turn on/off LEDs and control their colors.

## Problem & Solution

ELK-BLEDOM LED strips (cheap Chinese LED strips sold on platforms like Temu and controlled by apps like Lotus Lantern) sometimes enter a state where they cannot be turned on again after being turned off. The solution is to use a specific command format that was identified during testing:

```
[0x7E, 0x07, 0x05, 0x03, R, G, B, 0x10, 0xEF]
```

## Installation

1. Clone this repository or download the files
2. Navigate to the project directory
3. Install the required packages:
   ```
   npm install
   ```

## Working Solution

The `led-control.js` script uses the command format that was identified to work during diagnostic tests. Usage:

```
node led-control.js [command]
```

Available commands:
- `on` - turn on LEDs (white color)
- `off` - turn off LEDs
- `red` - set red color
- `green` - set green color
- `blue` - set blue color
- `rgb R G B` - set custom RGB color (e.g., `rgb 255 0 0`)

Usage examples:
```
node led-control.js on      # turn on LEDs
node led-control.js red     # set red color
node led-control.js rgb 255 0 255  # set purple color
node led-control.js off     # turn off LEDs
```

## Compatible Devices

This solution works with cheap Chinese Bluetooth LED controllers that are typically:
- Sold under the ELK-BLEDOM brand
- Available on platforms like Temu, AliExpress, eBay, etc.
- Controlled by mobile apps like Lotus Lantern, DuoCo Strip, or similar
- Use the 0000fff3-0000-1000-8000-00805f9b34fb characteristic for writing commands

## Troubleshooting

If you encounter connection issues:
1. Make sure Bluetooth is turned on
2. Make sure the device is not connected to another application
3. Try physically resetting the device (turn power off and on)
4. Run the script with administrator privileges: `sudo node led-control.js on` 