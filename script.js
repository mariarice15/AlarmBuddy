// DOM elements
const connectButton = document.getElementById('connectButton'); // Button to connect to serial port
const setHourButton = document.getElementById('setHourButton'); // Button to set the hour
const setMinuteButton = document.getElementById('setMinuteButton'); // Button to set the minute
const setAlarmButton = document.getElementById('setAlarmButton'); // Button to set the alarm
const alarmAudio = document.getElementById('alarmAudio'); // Audio element for the alarm sound
const clockElement = document.getElementById('clock'); // Element to display the clock

// Variables
let serialPort; // Holds the serial port connection
let settingHour = false; // Flag to indicate if setting the hour
let settingMinute = false; // Flag to indicate if setting the minute
let currentHour = 0; // Current hour value
let currentMinute = 0; // Current minute value
let potValue; // Potentiometer value
let buttonValue; // Button value
let alarmPlaying = false; // Flag to indicate if the alarm is currently playing
let lastButtonClickTime = 0; // Time of the last button click
let alarmActive = false; // Flag to indicate if the alarm is active

// Audio files
const audioFiles = [
    'alarms/alarm1.mp3',
    'alarms/alarm2.mp3',
    'alarms/alarm3.mp3',
    'alarms/alarm4.mp3',
    'alarms/alarm5.mp3'
];

// Initialize clock display
window.addEventListener('DOMContentLoaded', () => {
    clockElement.textContent = '00:00'; // Set initial clock display
});

// Event listeners

// Event listener for connecting to serial port
connectButton.addEventListener('click', async () => {
    try {
        serialPort = await navigator.serial.requestPort(); // Request serial port
        await serialPort.open({ baudRate: 9600 }); // Open serial port
        readData(); // Start reading data from serial port
    } catch (error) {
        console.error('Serial connection error:', error); // Log error if connection fails
    }
});

// Event listener for setting the hour
setHourButton.addEventListener('click', () => {
    if (!settingHour) {
        setHour(); // Start setting the hour
    } else {
        settingHour = false; // Stop setting the hour
        setHourButton.innerText = 'Set Hour'; // Change button text
        sendData(`set_hour ${currentHour}`); // Send command to set the hour
    }
});

// Event listener for setting the minute
setMinuteButton.addEventListener('click', () => {
    if (!settingMinute) {
        setMinute(); // Start setting the minute
    } else {
        settingMinute = false; // Stop setting the minute
        setMinuteButton.innerText = 'Set Minute'; // Change button text
        sendData(`set_minute ${currentMinute}`); // Send command to set the minute
    }
});

// Functions

// Function to handle button click
async function handleButtonClick() {
    const now = Date.now();
    if (buttonValue === 0) {
        if (now - lastButtonClickTime < 5000 && now - lastButtonClickTime > 400) {
            if(alarmActive)
                resetAlarm(); // If alarm is active, reset it
            else 
                activateAlarm(); // If alarm is not active, activate it
        }
        lastButtonClickTime = now;
    }
}

// Function to read data from serial port
async function readData() {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = serialPort.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }

            if (value !== undefined) {
                const [potValueStr, buttonValueStr] = value.trim().split('x');
                potValue = parseInt(potValueStr, 10);
                buttonValue = parseInt(buttonValueStr, 10);
                console.log('Potentiometer value:', potValue);
                console.log('Button value:', buttonValue);
                await handleButtonClick();
            }
        }
    } catch (error) {
        console.error('Serial read error:', error);
    } finally {
        reader.releaseLock();
        await readableStreamClosed.catch(() => {});
    }
}

// Function to map a value from one range to another
function map(value, fromLow, fromHigh, toLow, toHigh) {
    return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
}

// Function to update the clock display
function updateClock() {
    if (!isNaN(currentHour) && !isNaN(currentMinute)) {
        const formattedHours = String(currentHour).padStart(2, '0');
        const formattedMinutes = String(currentMinute).padStart(2, '0');
        clockElement.textContent = `${formattedHours}:${formattedMinutes}`;
    }
}

// Function to set the hour
function setHour() {
    settingHour = true; // Set flag to indicate setting hour
    setHourButton.innerText = 'Confirm Hour'; // Change button text

    // Update current hour based on potentiometer value
    function updateLoop() {
        currentHour = Math.round(map(potValue, 0, 4095, 0, 23));
        updateClock();
        
        if (settingHour) {
            requestAnimationFrame(updateLoop);
        }
    }
    
    updateLoop();
}

// Function to set the minute
function setMinute() {
    settingMinute = true; // Set flag to indicate setting minute
    setMinuteButton.innerText = 'Confirm Minute'; // Change button text

    // Update current minute based on potentiometer value
    function updateLoop() {
        currentMinute = Math.round(map(potValue, 0, 4095, 0, 59));
        updateClock(currentHour, currentMinute);
        
        if (settingMinute) {
            requestAnimationFrame(updateLoop);
        }
    }
    
    updateLoop();
}

// Function to select a random audio file for the alarm
function selectRandomAudio() {
    const randomIndex = Math.floor(Math.random() * audioFiles.length);
    return audioFiles[randomIndex];
}

// Function to check if it's time for the alarm
function checkAlarm() {
    const now = new Date();
    if (now.getHours() === currentHour && now.getMinutes() === currentMinute && !alarmPlaying) {
        clockElement.classList.add('shakeAndFlash'); // Add CSS class for visual effect
        const audioFile = selectRandomAudio();
        alarmAudio.src = audioFile;
        alarmAudio.play(); // Play alarm sound
        alarmPlaying = true; // Set flag to indicate alarm is playing
    } else if (now.getHours() !== currentHour || now.getMinutes() !== currentMinute) {
        clockElement.classList.remove('shakeAndFlash'); // Remove CSS class
        alarmPlaying = false; // Set flag to indicate alarm is not playing
    }
}

// Function to disable buttons
function lockButtons() {
    const buttonsToLock = document.querySelectorAll('.button:not(#resetButton)');
    buttonsToLock.forEach(button => {
        button.disabled = true;
        button.classList.add('disabled'); // Add CSS class
    });
}

// Function to enable buttons
function unlockButtons() {
    const buttonsToUnlock = document.querySelectorAll('.button:not(#resetButton)');
    buttonsToUnlock.forEach(button => {
        button.disabled = false;
        button.classList.remove('disabled'); // Remove CSS class
    });
}

// Function to activate the alarm
function activateAlarm() {
    alarmActive = true; // Set flag to indicate alarm is active
    setInterval(checkAlarm, 1000); // Check alarm every second
    clockElement.classList.toggle('invert'); // Toggle CSS class
    lockButtons(); // Disable buttons
}

// Function to reset the alarm
function resetAlarm() {
    alarmActive = false; // Set flag to indicate alarm is not active
    currentHour = 0;
    currentMinute = 0;
    settingHour = false;
    setHourButton.innerText = 'Set Hour';
    settingMinute = false;
    setMinuteButton.innerText = 'Set Minute';
    alarmPlaying = false;
    clockElement.textContent = '00:00';
    clockElement.classList.remove('shake');
    clockElement.classList.remove('invert');
    alarmAudio.pause(); // Pause alarm sound
    alarmAudio.currentTime = 0; // Reset audio time
    unlockButtons(); // Enable buttons
}
