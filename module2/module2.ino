const int potPin = 2; // Potentiometer pin
const int buttonPin = 22; // Button pin

void setup() {
  Serial.begin(9600);
  delay(1000);
}

void loop() {
  pinMode(buttonPin, INPUT_PULLUP);

  // Read potentiometer value
  int potValue = analogRead(potPin);

  // Read button value
  int buttonValue = digitalRead(buttonPin);

  // Send potentiometer value and button value over serial
  String message = String(potValue) + 'x' + String(buttonValue);
  Serial.println(message);
  delay(100);
}
