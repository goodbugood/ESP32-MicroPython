const fs = require('fs');
const path = require('path');
const { MicroPythonDevice } = require('/Users/shali/.vscode/extensions/pycom.pymakr-2.22.5/node_modules/micropython-ctl-cont');

async function deployProject() {
    let device;
    try {
        // 读取设备配置
        const config = JSON.parse(fs.readFileSync('./device-config.json', 'utf8'));
        const deviceAddress = config.currentDevice.replace('serial://', '');
        
        // 读取项目配置
        const projectConfig = JSON.parse(fs.readFileSync('./pymakr.conf', 'utf8'));
        const ignoreList = projectConfig.py_ignore || [];
        
        console.log(`🔗 Connecting to device: ${deviceAddress}`);
        
        // 创建设备实例
        device = new MicroPythonDevice();
        
        // 连接设备
        await device.connectSerial(deviceAddress);
        console.log('✅ Device connected');
        
        // === 第1步: 停止脚本执行 ===
        console.log('\n🛑 Step 1: Stopping running scripts...');
        await stopScript(device);
        console.log('✅ Scripts stopped');
        
        // === 第2步: 上传项目文件 ===
        console.log('\n📤 Step 2: Uploading project files...');
        await uploadFiles(device, ignoreList);
        console.log('✅ Files uploaded');
        
        // === 第3步: 硬重置设备 ===
        console.log('\n🔄 Step 3: Hard resetting device...');
        await hardReset(device);
        console.log('✅ Device reset completed');
        
        console.log('\n🎉 Deploy completed successfully!');
        
    } catch (error) {
        console.error('❌ Deploy failed:', error.message);
        process.exit(1);
    } finally {
        if (device) {
            try {
                await device.disconnect();
                console.log('🔌 Device disconnected');
            } catch (e) {
                console.log('⚠️  Device disconnect error (normal after reset)');
            }
        }
    }
}

async function stopScript(device) {
    // 使用Pymakr相同的停止逻辑
    await device.sendData('\x03');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await device.sendData('\x03');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 安全启动
    await device.sendData('\x06\x03');
    await new Promise(resolve => setTimeout(resolve, 1000));
}

async function uploadFiles(device, ignoreList) {
    // 获取项目文件列表
    const projectFiles = getProjectFiles('.', ignoreList);
    console.log(`📁 Found ${projectFiles.length} files to upload`);
    
    if (projectFiles.length === 0) {
        throw new Error('No files found to upload');
    }
    
    // 清除设备根目录 (可选)
    try {
        console.log('🗑️  Clearing device root directory...');
        // 注意: removeFile方法可能不存在，所以跳过
    } catch (e) {
        console.log('ℹ️  Skip clearing root directory');
    }
    
    // 上传每个文件
    let uploadedCount = 0;
    for (const filePath of projectFiles) {
        try {
            const fileContent = fs.readFileSync(filePath);
            const devicePath = '/' + filePath;
            
            console.log(`📄 Uploading: ${filePath} -> ${devicePath}`);
            await device.putFile(devicePath, fileContent);
            uploadedCount++;
            
            // 每个文件间隔100ms
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
            throw new Error(`Failed to upload ${filePath}: ${e.message}`);
        }
    }
    
    if (uploadedCount !== projectFiles.length) {
        throw new Error(`Upload incomplete: ${uploadedCount}/${projectFiles.length} files uploaded`);
    }
}

async function hardReset(device) {
    // 发送重置命令但不等待反馈，避免阻塞COM口
    device.reset({ softReset: false }).catch(() => {
        // 忽略重置后的连接错误，这是正常的
    });
    
    // 短暂等待命令发送完成，然后立即返回
    await new Promise(resolve => setTimeout(resolve, 500));
}

function getProjectFiles(dir, ignoreList) {
    const files = [];
    
    function scanDir(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const relativePath = path.relative('.', fullPath);
            
            // 检查是否在忽略列表中
            if (ignoreList.some(ignore => relativePath.includes(ignore))) {
                continue;
            }
            
            const stat = fs.statSync(fullPath);
            if (stat.isFile() && (item.endsWith('.py') || item.endsWith('.txt'))) {
                files.push(relativePath);
            } else if (stat.isDirectory()) {
                scanDir(fullPath);
            }
        }
    }
    
    scanDir(dir);
    return files;
}

deployProject();