# CesiumJS Agent Skills

[Original CesiumJS Agent Skills](https://github.com/CesiumGS/cesiumjs-skills)

[Cesium AI Integrations](https://github.com/CesiumGS/cesium-ai-integrations)

精选的 CesiumJS 开发代理技能 —— 涵盖 CesiumJS v1.139 API 表面的 14 个领域技能，约 535 个公共符号。

## 快速开始

### Claude Code

**终端一键安装（推荐）：**

```bash
claude plugin marketplace add CesiumGS/cesiumjs-skills
```

**从 Claude Code 内部安装：**

1. 输入 `/plugin` 并按回车
2. 选择 **添加市场（Add Marketplace）**
3. 输入 `CesiumGS/cesiumjs-skills`
4. 添加市场后，再次输入 `/plugin`
5. 选择 **安装插件（Install Plugin）**
6. 从列表中选择 **cesiumjs-skills**
7. 安装后，运行 `/reload-plugins` 以在当前会话中激活技能

### 任何兼容 Agent Skills 的工具

这些技能遵循 [Agent Skills](https://agentskills.io/) 开放标准。复制或符号链接 `skills/` 目录到您的工作区 —— 技能会自动从 `skills/<name>/SKILL.md` 中发现。

---

## 目录

- [CesiumJS Agent Skills](#cesiumjs-agent-skills)
  - [快速开始](#快速开始)
    - [Claude Code](#claude-code)
    - [任何兼容 Agent Skills 的工具](#任何兼容-agent-skills-的工具)
  - [目录](#目录)
  - [技能目录](#技能目录)
  - [领域映射](#领域映射)
  - [兼容性](#兼容性)
  - [仓库布局](#仓库布局)

## 技能目录

| 技能                             | 激活时机...                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| **cesiumjs-viewer-setup**        | 初始化 CesiumJS 应用、配置小部件、设置 Ion 令牌、引导 3D 地球                                |
| **cesiumjs-camera**              | 定位相机、flyTo 动画、约束导航、实体跟踪                                                     |
| **cesiumjs-entities**            | 添加点/标签/模型/多边形、加载 GeoJSON/KML/CZML/GPX 数据                                      |
| **cesiumjs-3d-tiles**            | 加载 tileset、样式化要素、查询元数据、体素、点云、裁剪                                       |
| **cesiumjs-imagery**             | 添加/切换底图图层、配置影像提供者、分屏比较                                                  |
| **cesiumjs-terrain-environment** | 配置地形、查询高度、大气/天空/雾/光照/阴影、全景                                             |
| **cesiumjs-primitives**          | 性能关键的静态几何体、自定义形状、批处理、billboard/label/point 集合                         |
| **cesiumjs-materials-shaders**   | Fabric 材质、ImageBasedLighting、后处理效果、泛光、色调映射                                  |
| **cesiumjs-custom-shader**       | 为 Model/Cesium3DTileset/VoxelPrimitive 编写 GLSL 着色器体；要素 ID、EXT_structural_metadata |
| **cesiumjs-time-properties**     | 时间动态实体属性、仿真时钟、插值、采样/回调属性                                              |
| **cesiumjs-spatial-math**        | 坐标转换、椭球几何、模型矩阵、相交测试、投影                                                 |
| **cesiumjs-interaction**         | 用户点击地球、实体/要素选择、悬停效果、拖拽交互                                              |
| **cesiumjs-models-particles**    | glTF/GLB 模型加载、动画、粒子效果（火焰、烟雾）                                              |
| **cesiumjs-core-utilities**      | 通过 Resource 进行 HTTP 请求、Color、Event、错误处理、辅助函数                               |

## 领域映射

CesiumJS 中的每个公共类、函数和枚举都分配到恰好一个技能。跨领域所有权规则和完整符号映射记录在 [`docs/DOMAINS.md`](docs/DOMAINS.md) 中。

## 兼容性

[Agent Skills](https://agentskills.io/) 格式是由 Anthropic 最初开发的开源标准，已被包括 Claude Code、GitHub Copilot 在内的主流 AI 开发工具采用。

应广大用户要求，本仓库还提供**Claude Code 插件**版本，包含 SessionStart 钩子和 Chrome DevTools MCP 集成，用于基于浏览器的验证。

## 仓库布局

```
cesiumjs-skills/
├── skills/                          # 核心产品
│   ├── cesiumjs-*/SKILL.md          # 14 个领域技能（CesiumJS v1.139）
│   └── using-cesiumjs-skills/       # 引导定向技能
├── docs/
│   ├── DOMAINS.md                   # 符号所有权映射
│   └── skills-catalog.md            # 技能目录
├── .claude-plugin/
│   ├── plugin.json                  # Claude Code 插件清单
│   └── marketplace.json             # 插件市场目录
├── .mcp.json                        # Chrome DevTools MCP 服务器
├── hooks/                           # SessionStart 钩子 + 运行器
└── LICENSE
```
