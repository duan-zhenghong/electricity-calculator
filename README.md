# ⚡ 陕西省居民峰谷电费测算工具

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.4-brightgreen.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen.svg)](https://duan-zhenghong.github.io/electricity-calculator/)

## 🌐 在线使用

**访问地址**：https://duan-zhenghong.github.io/electricity-calculator/

一款专为陕西省居民设计的峰谷电费测算工具，支持阶梯电价、峰谷分时、采暖季政策的完整计算逻辑。帮助您分析用电成本，制定最优用电策略。

> ⚠️ **示例数据声明**：本工具中的示例数据为虚构生成，用于展示功能，不涉及任何真实用户隐私数据。

## 🎯 适用场景

### 已开通峰谷电的用户
- 有完整计费周期（7月1日-次年6月30日）的每月用电量和电费数据
- 系统可自动推算出每月具体的峰谷电用量
- 生成详细的分析报告

### 未开通峰谷电的用户
- 使用手动计算模式，自行估算峰谷比例
- 模拟开通峰谷电后的费用变化
- 评估是否值得开通峰谷电

## ✨ 功能特点

- 📊 **数据推算模式**：输入每月用电量和电费，自动推算峰谷用量
- 🔧 **手动计算模式**：自定义峰谷比例，模拟不同用电场景
- 📋 **完整报告生成**：包含总体统计、阶梯分布、月度明细
- 🔥 **采暖季政策支持**：自动识别采暖季，应用特殊计价规则
- 📱 **响应式设计**：支持PC和移动端访问
- 🖨️ **报告打印**：一键打印分析报告

## 📖 陕西省居民电价规则

### 计费周期
每年 **7月1日** 至 **次年6月30日** 为一个完整阶梯周期

### 峰谷时段
| 时段 | 时间范围 | 时长 |
|------|----------|------|
| 峰段 | 8:00 - 20:00 | 12小时 |
| 谷段 | 20:00 - 次日 8:00 | 12小时 |

### 阶梯电价表

| 档位 | 年用电量 | 基准价 | 峰电价 | 谷电价 |
|------|----------|--------|--------|--------|
| 第一档 | 0 - 1260度 | 0.4983元 | 0.5483元 | **0.2983元** |
| 第二档 | 1261 - 2450度 | 0.5483元 | 0.5983元 | 0.3483元 |
| 第三档 | 2451度以上 | 0.7983元 | 0.8483元 | 0.5983元 |

### 采暖季政策（11月-次年3月）
- 强制按**第一档**计费，无论累计多少度
- 用电量**不计入**年度阶梯累计（冻结）
- 谷电价固定为 **0.2983元/度**，不受高档位影响

### 盈亏平衡点
峰电占比低于 **80%** 时，开通峰谷电就是合算的。

## 🚀 快速开始

### 在线使用
直接访问 https://duan-zhenghong.github.io/electricity-calculator/ 即可使用，无需安装。

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/duan-zhenghong/electricity-calculator.git

# 进入项目目录
cd electricity-calculator

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📁 项目结构

```
electricity-calculator/
├── src/
│   ├── utils/
│   │   └── calculator.ts    # 核心计算逻辑
│   ├── App.vue              # 主应用组件
│   ├── main.ts              # 入口文件
│   └── style.css            # 样式文件
├── public/
│   └── favicon.svg          # 网站图标
├── index.html               # HTML入口
├── vite.config.ts           # Vite配置
├── tsconfig.json            # TypeScript配置
└── package.json             # 项目配置
```

## 🔬 核心算法

### 峰谷电用量反推

已知每月总用电量 Q 和总电费 B，求解峰电量：

```
设峰电比例为 r

方程：Q × [r × 峰价 + (1-r) × 谷价] = B

化简：r = [B - Q × 谷价] ÷ [Q × (峰价 - 谷价)]

结果：
  峰电量 = Q × r
  谷电量 = Q × (1-r)
```

### 跨档月份处理

当某月累计用电量跨越阶梯分界点时：

```
设低档段度数 q1，高档段度数 q2

方程：q1 × [r × P1 + (1-r) × V1] + q2 × [r × P2 + (1-r) × V2] = B

其中 P1/V1 为低档峰谷价，P2/V2 为高档峰谷价
```

## 🛠️ 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite 5
- **样式**: 原生 CSS（无框架依赖）
- **部署**: GitHub Pages

## 📝 数据来源

- 电价政策：国网陕西电力
- 数据依据：陕西省居民用电价格公开政策文件

> ⚠️ 如电价政策有调整，请以官方最新通知为准。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

**如有问题或建议，欢迎提 Issue 讨论！**
