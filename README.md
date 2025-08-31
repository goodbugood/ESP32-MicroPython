# 使用 visual studio code 开发带有 micropython 固件的 esp32

## 1. 刷机 micropython 固件

打开 micropython 官网，下载响应的固件

- 官网 https://micropython.org/download/

```sh
esptool.py --baud 460800 write_flash 0x1000 /Users/shali/Downloads/ESP32_GENERIC-20250809-v1.26.0.bin
```

- esptool.py 可以通过安装 `ESP-IDF` 扩展获得
- 擦除固件使用命令 esptool.py erase_flash

## 2. 安装 Pymakr 扩展

直接应用商店搜索 Pymakr 即可。

## 3. 使用一键部署功能

- 配置好你当前连接的串口

编辑文件 `device-config.json`。

```json
{
    "currentDevice": "serial://设备串口地址"
}
```

- 一键上传代码

```sh
node deploy-project.js
```

- 一键上传代码，并监视串口

```sh
node deploy-project-monitor.js
```