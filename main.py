# main.py -- 你的业务逻辑代码，类似 Arduino 的 loop() 函数

from machine import Pin
from time import sleep

led = Pin(2, Pin.OUT)

while True:
    led.on()
    print("light on")
    sleep(1)
    led.off()
    print("light off")
    sleep(1)