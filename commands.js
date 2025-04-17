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

module.exports = {
  makeCommand,
  commands
}; 