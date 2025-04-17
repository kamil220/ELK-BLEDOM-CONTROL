# ELK-BLEDOM LED Controller

A set of tools for controlling ELK-BLEDOM LED strips via Bluetooth. These scripts allow you to turn on/off LEDs, control their colors, and create various lighting effects.

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

Animation commands:
- `pulse R G B [B]` - smooth fade in/out effect
- `smooth R G B [FROM] [TO]` - smooth transition between brightness levels
- `flash R G B [B]` - quick on/off blinking
- `rainbow [B]` - cycle through rainbow colors
- `running R G B [B]` - moving light effect through color transitions

Usage examples:
```
node led-control.js on      # turn on LEDs
node led-control.js red     # set red color
node led-control.js rgb 255 0 255  # set purple color
node led-control.js off     # turn off LEDs

# Animation examples
node led-control.js pulse 255 0 0 50  # red pulsing at 50% brightness
node led-control.js smooth 0 255 0 0 100  # green smooth transition from 0% to 100%
node led-control.js flash 0 0 255 75  # blue flashing at 75% brightness
node led-control.js rainbow 100  # rainbow effect at full brightness
node led-control.js running 255 255 255  # running white light effect
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

## Animation Details

The controller supports several animation effects:

1. **Pulse** - Smoothly fades the selected color in and out. The animation takes 2 seconds by default and uses 20 steps for smooth transitions.

2. **Smooth** - Creates a smooth transition between two brightness levels for the selected color. Useful for creating gradual lighting changes. By default transitions from 0% to 100% brightness over 2 seconds.

3. **Flash** - Creates a quick on/off blinking effect with the selected color. By default performs 5 flashes, each lasting 200ms.

4. **Rainbow** - Cycles through all colors of the rainbow. The animation takes 5 seconds to complete a full cycle by default.

5. **Running Light** - Creates a moving light effect by transitioning through different colors. The sequence includes primary colors (red, green, blue) and their combinations (yellow, cyan, magenta, white).

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