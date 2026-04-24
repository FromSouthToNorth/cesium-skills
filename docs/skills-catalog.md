# 🌍 Cesium Agent Skills

专为 Cesium 生态系统设计的一系列 [Agent Skills](https://agentskills.io/)。

## 🤖 什么是 Agent Skills？

Agent Skills 是 AI 代理可以发现并使用以更准确、高效执行任务的指令、脚本和资源文件夹。它们为代理提供：

- **领域专业知识**：关于 Cesium 生态系统的专业知识，包括 CesiumJS、Cesium ion、3D Tiles 和地理空间概念
- **过程性知识**：常见 Cesium 平台任务和工作流的分步说明
- **上下文感知指导**：关于使用 Cesium 技术的公司、团队和项目特定信息

Agent Skills 格式是由 Anthropic 最初开发的开源标准，已被包括 VS Code、GitHub Copilot 在内的主流 AI 开发工具采用。

## 💡 为什么需要 Cesium Agent Skills？

Cesium 平台为 3D 地理空间可视化和数据管理提供了强大工具，包括 CesiumJS、Cesium ion、3D Tiles 及相关技术。这些技能帮助 AI 代理：

- 理解 Cesium 平台术语和概念（CesiumJS API、3D Tiles、Cesium ion、CZML、地形、影像等）
- 有效浏览 Cesium 生态系统中的文档
- 遵循 Cesium 在性能、数据优化和视觉质量方面的最佳实践
- 实现 CesiumJS 开发、ion 资产管理和 3D Tiles 工作流中的常见模式
- 排查平台特定问题并有效集成 Cesium 技术

## 可用技能

本目录包含 Cesium 生态系统代理技能，分为两类：

### CesiumJS 领域技能（内置参考）

自包含的领域级技能，当开发者提出 CesiumJS 问题时自动激活。每个技能提供快速入门、API 参考、可运行代码示例、性能提示和交叉引用。基于 CesiumJS v1.139.x。

| # | 技能 | 描述 |
|---|------|------|
| 1 | **[cesiumjs-spatial-math](./cesiumjs-spatial-math/)** | Cartesian3、Matrix4、Transforms、Ellipsoid、BoundingSphere、投影 |
| 2 | **[cesiumjs-core-utilities](./cesiumjs-core-utilities/)** | Resource、Color、Event、RequestScheduler、错误处理、辅助函数 |
| 3 | **[cesiumjs-time-properties](./cesiumjs-time-properties/)** | Clock、JulianDate、Property 系统、SampledProperty、样条、插值 |
| 4 | **[cesiumjs-viewer-setup](./cesiumjs-viewer-setup/)** | Viewer、CesiumWidget、小部件、Ion 令牌、场景配置、工厂助手、地理编码器 |
| 5 | **[cesiumjs-imagery](./cesiumjs-imagery/)** | ImageryProvider 类型、图层、WMS/WMTS、分屏对比 |
| 6 | **[cesiumjs-terrain-environment](./cesiumjs-terrain-environment/)** | TerrainProvider、Globe、大气、天空、雾、光照、阴影、全景 |
| 7 | **[cesiumjs-materials-shaders](./cesiumjs-materials-shaders/)** | Material/Fabric、ImageBasedLighting、PostProcessStage、泛光、色调映射 |
| 8 | **[cesiumjs-custom-shader](./cesiumjs-custom-shader/)** | CustomShader 创作 — Model/Cesium3DTileset/VoxelPrimitive 的 GLSL、要素 ID、EXT_structural_metadata |
| 9 | **[cesiumjs-entities](./cesiumjs-entities/)** | Entity API、Graphics 类型、DataSource（GeoJSON/KML/CZML/GPX）、Visualizer |
| 10 | **[cesiumjs-primitives](./cesiumjs-primitives/)** | Primitive API、GeometryInstance、Appearance、Billboard/Label/Point 集合 |
| 11 | **[cesiumjs-3d-tiles](./cesiumjs-3d-tiles/)** | Cesium3DTileset、样式、元数据、体素、点云、I3S、裁剪 |
| 12 | **[cesiumjs-camera](./cesiumjs-camera/)** | Camera flyTo/lookAt/setView、ScreenSpaceCameraController、飞行动画 |
| 13 | **[cesiumjs-interaction](./cesiumjs-interaction/)** | ScreenSpaceEventHandler、Scene.pick/drillPick、悬停、拖拽交互 |
| 14 | **[cesiumjs-models-particles](./cesiumjs-models-particles/)** | Model/glTF 加载、动画、ParticleSystem、发射器 |

领域映射和类所有权规则记录在 **[DOMAINS.md](./DOMAINS.md)** 中。

## 🚀 使用这些技能

如果您使用支持 Agent Skills 的 AI 助手（如 VS Code 中的 GitHub Copilot），在此工作区中处理 Cesium 相关任务时，这些技能将自动被发现和使用。

技能通常以 `SKILL.md` 文件的形式存储在其各自的目录中，并附有任何支持资源。

## 🤝 贡献新技能

要添加新的 Cesium 代理技能：

1. 在 `skills/` 下创建描述性名称的新目录
2. 按照 [Agent Skills 规范](https://agentskills.io/specification) 创建 `SKILL.md` 文件
3. 包含任何支持资源（示例、文档、脚本）
4. 更新此 README 以列出新技能

## 🔗 资源

- [Agent Skills 首页](https://agentskills.io/)
- [Agent Skills 规范](https://agentskills.io/specification)
- [示例技能仓库](https://github.com/anthropics/skills)
- [Cesium 文档](https://cesium.com/docs/)
- [Cesium ion](https://cesium.com/platform/cesium-ion/)
- [3D Tiles 规范](https://github.com/CesiumGS/3d-tiles)

## 📄 许可证

见本仓库根目录下的 [LICENSE](../LICENSE) 文件。
