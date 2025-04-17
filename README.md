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
- `rgb R G B [B]` - set custom RGB color (0-255) and optional brightness (0-100, default 100)

Usage examples:
```
node led-control.js on      # turn on LEDs
node led-control.js red     # set red color
node led-control.js rgb 255 0 255  # set purple color
node led-control.js off     # turn off LEDs
```

## Discovering Brightness Control

During testing, an interesting behavior was observed: setting the color to `rgb 255 255 255` (supposedly white at maximum brightness) resulted in a dimmer light compared to `rgb 100 100 100`.

This led to the hypothesis that the controller doesn't use the full 0-255 range for each color channel directly for brightness control, or that values above a certain threshold trigger different modes or wrap around.

To investigate this, we performed a series of tests:

1.  **Byte Exploration:** We systematically changed individual non-color bytes in the command structure (e.g., the bytes at indices 1, 2, 3, and 7 in `[0x7E, ?, ?, ?, R, G, B, ?, 0xEF]`) to see if any controlled brightness or modes independently. This helped confirm the core structure was primarily for setting the RGB color.
2.  **Grayscale Brightness Test:** We iterated through grayscale values by sending commands equivalent to `rgb i i i` for `i` from 0 to 255 to observe how brightness changed across the range.

**Findings:**

The grayscale test revealed that the brightness increased steadily from `rgb 1 1 1` up to around `rgb 228 228 228`. Values above this (e.g., `rgb 229 229 229` up to `255 255 255`) seemed to cause the brightness to reset or drop significantly, confirming that the device's effective maximum brightness level for white corresponds to approximately `228` for each channel.

**Solution:**

Based on these findings, an optional fourth parameter for **brightness** (0-100%) was added to the `rgb` command. When provided, the script:
- Takes the user's desired color (R, G, B in 0-255 range) and brightness percentage.
- If brightness is 0, it sends `(0, 0, 0)`.
- Otherwise, it scales the desired color channels into the device's effective brightness range (`1` to `228`), multiplied by the requested brightness percentage.
- This allows for intuitive control over both color and its intensity, mapping the user's 0-100% brightness input to the controller's actual operational range.

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