#include "MeccaBrain.h"

MeccaBrain servo(13);
byte position;

void setup() {
  delay(5000);
  Serial.begin(9600);
  position = 0;
  servo.communicate();
}

void loop() {

  position += 1;
  if (position >= 0xef) {
    position = 0xef;
  }
  servo.setServoPosition(1, position);
  servo.setServotoLIM(2);
  servo.setServotoLIM(3);
  servo.communicate();

  delay(100);

}
