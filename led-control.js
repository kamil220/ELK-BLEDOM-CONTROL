const noble = require('@abandonware/noble');

// UUID values
const SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000fff3-0000-1000-8000-00805f9b34fb';

// Delay function
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Parse arguments
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase() || 'status';

// Color values for RGB mode
let red = 255, green = 0, blue = 0;

if (command === 'rgb' && args.length >= 4) {
  red = parseInt(args[1], 10);
  green = parseInt(args[2], 10);
  blue = parseInt(args[3], 10);
  
  if (isNaN(red) || isNaN(green) || isNaN(blue)) {
    console.error('❌ Nieprawidłowe wartości RGB. Użyj liczb 0-255.');
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
      console.log('🔌 Rozłączono z urządzeniem.');
    }
  } catch (err) {
    console.log('⚠️ Problem z rozłączeniem:', err.message);
  }
  process.exit(0);
}

// Format komendy, który zadziałał podczas testów
// 📦 Dane: [0x7e, 0x07, 0x05, 0x03, 0xff, 0x00, 0x00, 0x10, 0xef]
function makeCommand(r, g, b) {
  return Buffer.from([0x7E, 0x07, 0x05, 0x03, r, g, b, 0x10, 0xEF]);
}

// Definicje komend
const commands = {
  red: makeCommand(255, 0, 0),
  green: makeCommand(0, 255, 0),
  blue: makeCommand(0, 0, 255),
  white: makeCommand(255, 255, 255),
  off: makeCommand(0, 0, 0),
  rgb: (r, g, b) => makeCommand(r, g, b)
};

// Funkcja wysyłająca komendę do urządzenia
async function sendCommand(characteristic, command, description) {
  console.log(`🧪 ${description}...`);
  console.log(`📦 Dane: [${Array.from(command).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
  
  try {
    // Próba bez odpowiedzi - ten tryb zadziałał podczas testów
    await characteristic.writeAsync(command, true);
    console.log(`✅ ${description} - komenda wysłana!`);
    return true;
  } catch (err) {
    console.log(`⚠️ Błąd przy wysyłaniu: ${err.message}`);
    
    // Próba z odpowiedzią jako alternatywa
    try {
      await characteristic.writeAsync(command, false);
      console.log(`✅ ${description} - komenda wysłana (tryb z odpowiedzią)!`);
      return true;
    } catch (err2) {
      console.log(`❌ ${description} - nie udało się wysłać komendy: ${err2.message}`);
      return false;
    }
  }
}

// Główna funkcja kontrolująca LED
async function controlLed(peripheral) {
  try {
    // Łączymy się z urządzeniem
    await peripheral.connectAsync();
    console.log('🔗 Połączono z urządzeniem!');
    
    // Odkrywamy charakterystyki
    const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
      [SERVICE_UUID],
      [CHARACTERISTIC_UUID]
    );
    
    if (!characteristics || characteristics.length === 0) {
      throw new Error('Nie znaleziono wymaganej charakterystyki');
    }
    
    const char = characteristics[0];
    console.log('✅ Znaleziono charakterystykę');
    
    // Wykonujemy odpowiednią operację w zależności od komendy
    switch (command) {
      case 'on':
        // Włączamy białe światło
        await sendCommand(char, commands.white, "Włączanie (białe światło)");
        break;
        
      case 'off':
        // Wyłączamy LED
        await sendCommand(char, commands.off, "Wyłączanie LED");
        break;
        
      case 'red':
        // Ustawiamy czerwony kolor
        await sendCommand(char, commands.red, "Ustawianie koloru czerwonego");
        break;
        
      case 'green':
        // Ustawiamy zielony kolor
        await sendCommand(char, commands.green, "Ustawianie koloru zielonego");
        break;
        
      case 'blue':
        // Ustawiamy niebieski kolor
        await sendCommand(char, commands.blue, "Ustawianie koloru niebieskiego");
        break;
        
      case 'rgb':
        // Ustawiamy własny kolor RGB
        await sendCommand(
          char,
          commands.rgb(red, green, blue),
          `Ustawianie koloru RGB(${red}, ${green}, ${blue})`
        );
        break;
        
      case 'status':
      default:
        console.log('ℹ️ LED ELK-BLEDOM Kontroler');
        console.log('ℹ️ Dostępne komendy:');
        console.log('   on       - włącz LEDy (biały kolor)');
        console.log('   off      - wyłącz LEDy');
        console.log('   red      - ustaw kolor czerwony');
        console.log('   green    - ustaw kolor zielony');
        console.log('   blue     - ustaw kolor niebieski');
        console.log('   rgb R G B - ustaw własny kolor RGB (np. rgb 255 0 0)');
        await cleanup(peripheral);
        return;
    }
    
    // Czekamy chwilę przed rozłączeniem
    console.log('⏱️ Czekam 2 sekundy przed rozłączeniem...');
    await delay(2000);
    
    // Rozłączamy się
    console.log('✅ Operacja zakończona!');
    await cleanup(peripheral);
    
  } catch (err) {
    console.error('❌ Błąd podczas wykonywania operacji:', err);
    await cleanup(peripheral);
  }
}

// BLE setup
noble.on('stateChange', async (state) => {
  if (state === 'poweredOn') {
    console.log('🟢 BLE włączone. Rozpoczynam skanowanie...');
    await noble.startScanningAsync([], false);
  } else {
    console.log(`🔴 BLE niedostępne: ${state}`);
    await noble.stopScanningAsync();
  }
});

noble.on('discover', async (peripheral) => {
  const name = peripheral.advertisement.localName || '[brak nazwy]';
  console.log(`📡 Znaleziono: ${name} | ID: ${peripheral.id}`);

  if (name && name.startsWith('ELK')) {
    console.log('✅ Znaleziono urządzenie ELK-BLEDOM!');
    await noble.stopScanningAsync();
    await controlLed(peripheral);
  }
});

// Start with info message
console.log('🔍 ELK-BLEDOM LED CONTROLLER 🔍');

// If command requires device connection
if (command !== 'status') {
  console.log(`Wykonuję komendę: ${command}`);
  console.log('Szukam urządzenia ELK-BLEDOM...');
} 