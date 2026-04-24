---
name: using-cesiumjs-skills
description: 在开始任何涉及 CesiumJS 开发的对话时使用 —— 提供可用领域技能及其激活方式的定向说明
---

# CesiumJS 技能定向说明

本插件提供 14 个领域技能，涵盖 CesiumJS v1.139（约 535 个公共符号）。技能通过描述匹配自动激活 —— 无需显式调用。

## 可用技能

| 技能 | 使用时机... |
|---|---|
| `cesiumjs-viewer-setup` | 初始化 CesiumJS 应用、配置小部件、设置 Ion 令牌、引导 3D 地球 |
| `cesiumjs-camera` | 定位相机、flyTo 动画、约束导航、实体跟踪 |
| `cesiumjs-entities` | 添加点/标签/模型/多边形、加载 GeoJSON/KML/CZML/GPX 数据 |
| `cesiumjs-3d-tiles` | 加载 tileset、样式化要素、查询元数据、体素、点云、裁剪 |
| `cesiumjs-imagery` | 添加/切换底图图层、配置影像提供者、分屏比较 |
| `cesiumjs-terrain-environment` | 配置地形、查询高度、大气/天空/雾/光照/阴影、全景 |
| `cesiumjs-primitives` | 性能关键的静态几何体、自定义形状、批处理、billboard/label/point 集合 |
| `cesiumjs-materials-shaders` | Fabric 材质、ImageBasedLighting、后处理效果、泛光、色调映射 |
| `cesiumjs-custom-shader` | 为 Model/Cesium3DTileset/VoxelPrimitive 编写 GLSL 着色器体；读取要素 ID 或结构元数据 |
| `cesiumjs-time-properties` | 时间动态实体属性、仿真时钟、插值、采样/回调属性 |
| `cesiumjs-spatial-math` | 坐标转换、椭球几何、模型矩阵、相交测试、投影 |
| `cesiumjs-interaction` | 用户点击地球、实体/要素选择、悬停效果、拖拽交互 |
| `cesiumjs-models-particles` | glTF/GLB 模型加载、动画、粒子效果（火焰、烟雾） |
| `cesiumjs-core-utilities` | 通过 Resource 进行 HTTP 请求、Color、Event、错误处理、辅助函数 |

## 跨领域问题

当问题涉及多个领域时，请查阅 `docs/DOMAINS.md` —— 这是将所有公共 CesiumJS 类、函数和枚举精确分配到一个技能的所有权映射权威文档。

## 运行时验证

Chrome DevTools MCP 可用于基于浏览器的迭代：控制台错误检查、网络检查、截图和 Lighthouse 审计。
