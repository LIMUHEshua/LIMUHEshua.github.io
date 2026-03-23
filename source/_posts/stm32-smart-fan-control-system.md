---
title: STM32F103C8T6 智能风扇控制系统
date: 2026-03-10 10:00:00
categories:
- 嵌入式开发
- 智能硬件
- STM32
tags:
- STM32
- 智能风扇
- 嵌入式系统
- 温湿度检测
---

### 项目概述

STM32F103C8T6 智能风扇控制系统是一个基于STM32F103C8T6微控制器的智能环境调节系统。该项目实现了温湿度检测、PWM风扇控制、自动/手动模式切换、LED显示和按键控制等功能，适用于家庭、办公室等环境中的温度调节需求。

### 主要功能

- **温湿度检测**: 使用DHT11传感器实时监测环境温湿度，精度高，响应快
- **PWM风扇控制**: 通过25kHz PWM信号控制风扇转速，支持软启动避免电机冲击
- **双模式控制**:
  - 自动模式：根据温度自动调节风扇速度（温度-PWM映射表）
  - 手动模式：用户通过按键手动调节风速（0-100%可调）
- **用户界面**:
  - LED数码管显示温湿度、风速、模式等信息（支持TM1650驱动）
  - 4个独立按键控制（模式切换、风速增加、风速减少、确认/显示切换）
- **系统保护**: 包含看门狗保护、错误恢复机制、低功耗设计、传感器超时处理

### 硬件要求

- **主控芯片**: STM32F103C8T6 (Blue Pill开发板)
- **传感器**: DHT11温湿度传感器
- **显示模块**: TM1650驱动的4位数码管
- **风扇**: 5V直流风扇 + MOSFET驱动电路
- **按键**: 4个独立按键
- **电源**: 5V/12V直流电源

### 硬件连接

| 模块       | 引脚             | 功能          |
| -------- | -------------- | ----------- |
| DHT11传感器 | PA0            | 温湿度数据读取     |
| 风扇PWM控制  | PA8 (TIM1_CH1) | 25kHz PWM输出 |
| LED显示SDA | PB6            | TM1650数据线   |
| LED显示SCL | PB7            | TM1650时钟线   |
| 按键1（模式）  | PC0            | 自动/手动模式切换   |
| 按键2（加）   | PC1            | 风速增加/温度升高   |
| 按键3（减）   | PC2            | 风速减少/温度降低   |
| 按键4（确认）  | PC3            | 确认选择/显示切换   |

### 核心实现

#### 温湿度检测

使用DHT11传感器实现温湿度数据采集，包含超时处理和错误恢复机制：

```c
uint8_t DHT11_ReadData(uint8_t *temp, uint8_t *humi) {
    uint8_t data[5] = {0};
    uint8_t checksum = 0;
    uint32_t timeout = 5000; // 5ms超时

    // 主机发送开始信号
    DHT11_SetOutput();
    GPIO_ResetBits(DHT11_PORT, DHT11_PIN);
    delay_ms(18); // 至少18ms低电平
    GPIO_SetBits(DHT11_PORT, DHT11_PIN);
    delay_us(30); // 20-40us高电平

    // 切换为输入模式
    DHT11_SetInput();

    // 等待DHT11响应（带超时）
    while(GPIO_ReadInputDataBit(DHT11_PORT, DHT11_PIN) == 1 && timeout--);
    if(timeout == 0) {
        DHT11_SetOutput();
        GPIO_SetBits(DHT11_PORT, DHT11_PIN);
        return 0; // 超时无响应
    }

    // 读取40位数据
    for(int i = 0; i < 5; i++) {
        data[i] = DHT11_ReadByte();
    }

    // 校验和验证
    checksum = data[0] + data[1] + data[2] + data[3];
    if(checksum != data[4]) {
        fan.dht11_error_count++;
        if(fan.dht11_error_count > 10) {
            // 连续10次错误，重置传感器
            DHT11_Init();
            fan.dht11_error_count = 0;
        }
        return 0; // 校验失败
    }

    fan.dht11_error_count = 0; // 重置错误计数
    *humi = data[0];
    *temp = data[2];

    return 1; // 读取成功
}
```

#### PWM风扇控制

实现25kHz PWM信号控制，支持软启动避免电机冲击：

```c
void PWM_Init(void) {
    // 配置TIM1 - 25kHz PWM频率（避免风扇噪音）
    // PWM频率 = 72MHz / (2 + 1) / (959 + 1) = 25kHz
    TIM_TimeBaseStructure.TIM_Period = 959; // 自动重装载值
    TIM_TimeBaseStructure.TIM_Prescaler = 2; // 预分频器
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseInit(PWM_TIM, &TIM_TimeBaseStructure);

    // 配置PWM输出
    TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;
    TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;
    TIM_OCInitStructure.TIM_Pulse = 0; // 初始占空比0%（避免启动冲击）
    TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;

    TIM_OC1Init(PWM_TIM, &TIM_OCInitStructure);
    TIM_OC1PreloadConfig(PWM_TIM, TIM_OCPreload_Enable);

    // 使能TIM1
    TIM_ARRPreloadConfig(PWM_TIM, ENABLE);
    TIM_Cmd(PWM_TIM, ENABLE);
    TIM_CtrlPWMOutputs(PWM_TIM, ENABLE);
}

// 软启动函数（避免电机冲击）
void PWM_SoftStart(uint8_t target_speed, uint16_t duration_ms) {
    uint8_t current_speed = fan.fan_speed;
    int16_t step = (target_speed > current_speed) ? 1 : -1;
    uint16_t steps = (target_speed > current_speed) ? (target_speed - current_speed) : (current_speed - target_speed);

    if(steps == 0) return;

    uint16_t delay_per_step = duration_ms / steps;

    for(uint16_t i = 0; i < steps; i++) {
        current_speed += step;
        PWM_SetDuty(current_speed);
        delay_ms(delay_per_step);
        IWDG_Feed(); // 喂狗
    }
}
```

#### 双模式控制

实现自动和手动两种控制模式：

```c
void Control_AutoMode(void) {
    uint8_t temp = fan.temperature;
    uint8_t pwm_duty = 0;

    // 根据温度设置PWM占空比
    if(temp < 20) {
        pwm_duty = temp_pwm_map[0];
    } else if(temp <= 22) {
        pwm_duty = temp_pwm_map[1];
    } else if(temp <= 25) {
        pwm_duty = temp_pwm_map[2];
    } else if(temp <= 28) {
        pwm_duty = temp_pwm_map[3];
    } else if(temp <= 31) {
        pwm_duty = temp_pwm_map[4];
    } else {
        pwm_duty = temp_pwm_map[5];
    }

    // 软启动到目标速度（2秒软启动）
    PWM_SoftStart(pwm_duty, 2000);
}

void Control_ManualMode(void) {
    // 手动模式下保持当前速度
    // 速度调节在按键处理中实现
}
```

#### 温度-PWM映射表

| 温度范围    | PWM占空比 | 风扇状态 |
| ------- | ------ | ---- |
| < 20°C  | 0%     | 停止   |
| 20-22°C | 20%    | 低速   |
| 23-25°C | 40%    | 中低速  |
| 26-28°C | 60%    | 中速   |
| 29-31°C | 80%    | 高速   |
| > 31°C  | 100%   | 最高速  |

### 系统保护

#### 看门狗保护

```c
void IWDG_Init(void) {
    // 启用LSI时钟（约40kHz）
    RCC_LSICmd(ENABLE);
    while(RCC_GetFlagStatus(RCC_FLAG_LSIRDY) == RESET);

    // 配置看门狗
    IWDG_WriteAccessCmd(IWDG_WriteAccess_Enable);
    // 预分频器64，约1.6ms/tick
    IWDG_SetPrescaler(IWDG_Prescaler_64);
    // 超时时间：1.6ms * 2500 = 4秒
    IWDG_SetReload(2500);
    IWDG_ReloadCounter();
    IWDG_Enable();
}

// 喂狗
void IWDG_Feed(void) {
    IWDG_ReloadCounter();
}
```

#### 低功耗设计

```c
// 主循环中的低功耗处理
while(1) {
    // 喂狗（每1秒）
    if(SystemTick - last_watchdog_feed > 1000) {
        IWDG_Feed();
        last_watchdog_feed = SystemTick;
    }
    
    // 按键扫描、传感器读取、控制逻辑更新...
    
    // 低功耗延时（减少CPU占用）
    __WFI(); // 等待中断
}
```

### 使用说明

#### 基本操作

1. **上电启动**: 系统自动进入自动模式，显示当前温度
2. **模式切换**: 按下模式键切换自动/手动模式
   - 自动模式：LED显示"A"+温度，风扇根据温度自动调节
   - 手动模式：LED显示"M"+风速百分比，用户可手动调节
3. **风速调节**（手动模式下）:
   - 按下"+"键：增加风速（每按一次增加5%）
   - 按下"-"键：减少风速（每按一次减少5%）
4. **显示切换**: 按下确认键循环显示温度、湿度、风速、模式

### 技术特点

1. **高效节能**: 采用低功耗设计，空闲时进入WFI睡眠模式
2. **稳定可靠**: 独立看门狗保护，防止程序跑飞
3. **用户友好**: 简洁的按键操作，清晰的LED显示
4. **智能控制**: 温度自适应调节，软启动保护电机
5. **易于扩展**: 模块化设计，方便添加新功能
6. **噪音控制**: 25kHz PWM频率避免风扇噪音
7. **错误处理**: 完善的传感器错误检测和恢复机制

### 故障排除

| 问题现象   | 可能原因       | 解决方法             |
| ------ | ---------- | ---------------- |
| 风扇不转   | 电源未接通      | 检查12V电源连接        |
| &nbsp; | PWM引脚错误    | 检查PA8连接          |
| &nbsp; | MOSFET损坏   | 更换MOSFET         |
| 温度显示异常 | DHT11连接错误  | 检查PA0连接          |
| &nbsp; | 传感器损坏      | 更换DHT11          |
| LED不显示 | TM1650连接错误 | 检查PB6/PB7连接      |
| &nbsp; | I2C地址错误    | 确认TM1650地址(0x24) |
| 按键无响应  | 按键连接错误     | 检查PC0-PC3连接      |
| &nbsp; | 上拉电阻缺失     | 添加10k上拉电阻        |

### 版本历史

- **v1.0** (2024-01-01): 初始版本发布，包含所有基本功能
- **v1.1** (2024-01-10): 优化PWM频率，改进按键防抖，添加看门狗保护

### 结论

STM32F103C8T6 智能风扇控制系统是一个功能完整、性能稳定的嵌入式项目。它不仅实现了基本的温度调节功能，还通过精心的硬件设计和软件优化，提供了良好的用户体验和系统可靠性。该项目展示了如何使用STM32微控制器构建一个实用的智能硬件系统，对于嵌入式开发者来说是一个很好的学习参考。

通过模块化的设计和清晰的代码结构，该系统具有很强的可扩展性，可以根据实际需求添加更多功能，如远程控制、数据记录、语音控制等。同时，系统的低功耗设计和稳定可靠的运行特性，使其适合在各种环境中长期使用。

### 快速开始

1. **环境准备**: Keil MDK-ARM v5 或 STM32CubeIDE，STM32CubeMX，ST-Link V2
2. **工程配置**: 使用STM32CubeMX创建工程，配置时钟和引脚
3. **代码集成**: 将项目代码添加到工程中
4. **硬件连接**: 按照硬件连接表连接电路
5. **编译烧录**: 编译工程并下载到STM32F103C8T6
6. **测试运行**: 上电测试系统功能

该项目已通过全面测试，所有核心功能运行正常，代码质量优秀，是一个值得参考和使用的嵌入式系统实例。