---
name: cesiumjs-viewer-setup
description: "CesiumJS 查看器设置 - Viewer、CesiumWidget、小部件、Ion 令牌、场景配置、SceneMode、工厂助手、地理编码器、平台服务。在初始化 CesiumJS 应用、配置查看器小部件、设置 Ion 访问令牌、创建默认地形或影像，或引导 3D 地球时使用。"
---

# CesiumJS Viewer 与场景设置

引导 CesiumJS 应用的参考：Viewer、CesiumWidget、Ion/GoogleMaps/ITwinPlatform 配置、小部件、工厂助手、地理编码器服务、查看器 mixin、Credits 及相关枚举。

## 快速开始

```js
import { Ion, Viewer, Terrain } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// 始终在任何其他 Cesium 调用之前设置您的 Ion 令牌
Ion.defaultAccessToken = "YOUR_CESIUM_ION_ACCESS_TOKEN";

const viewer = new Viewer("cesiumContainer", {
  terrain: Terrain.fromWorldTerrain(),
});
```

所需 HTML：`<div id="cesiumContainer" style="width:100%;height:100vh"></div>`

## Ion 与平台配置

### Cesium Ion

```js
import { Ion } from "cesium";

Ion.defaultAccessToken = "YOUR_TOKEN";  // ion 资产所需
Ion.defaultServer = "https://your-ion-server.example.com/"; // 可选：自托管
```

### IonResource

```js
import { IonResource, Cesium3DTileset } from "cesium";

const resource = await IonResource.fromAssetId(96188);
const tileset = await Cesium3DTileset.fromUrl(resource);
viewer.scene.primitives.add(tileset);
```

### Google Maps 平台

```js
import { GoogleMaps, createGooglePhotorealistic3DTileset, Viewer, IonGeocodeProviderType } from "cesium";

GoogleMaps.defaultApiKey = "YOUR_GOOGLE_MAPS_API_KEY"; // 可选：无密钥时通过 ion 提供服务

const viewer = new Viewer("cesiumContainer", {
  geocoder: IonGeocodeProviderType.GOOGLE, // 使用 Google 3D Tiles 时需要
});

const tileset = await createGooglePhotorealistic3DTileset({
  onlyUsingWithGoogleGeocoder: true,
});
viewer.scene.primitives.add(tileset);
```

### iTwin 平台（实验性）

```js
import { ITwinPlatform, ITwinData } from "cesium";

ITwinPlatform.defaultAccessToken = "YOUR_ITWIN_TOKEN";
const tileset = await ITwinData.createTilesetForIModel(viewer, "imodel-id");
```

## Viewer 构造函数选项

`new Viewer(container, options?)` -- `container` 是 DOM 元素或其字符串 ID。

### 小部件开关

| 选项 | 默认值 | 用途 |
|--------|---------|------|
| `animation` | `true` | 回放控制 |
| `baseLayerPicker` | `true` | 影像/地形切换器 |
| `fullscreenButton` | `true` | 全屏切换 |
| `vrButton` | `false` | WebVR 切换 |
| `geocoder` | `IonGeocodeProviderType.DEFAULT` | 搜索栏（设为 `false` 隐藏） |
| `homeButton` | `true` | 重置到初始视角 |
| `infoBox` | `true` | 实体信息弹窗 |
| `sceneModePicker` | `true` | 2D/3D/哥伦布视图切换 |
| `selectionIndicator` | `true` | 选择十字准线 |
| `timeline` | `true` | 时间轴 |
| `navigationHelpButton` | `true` | 鼠标/触控帮助 |
| `projectionPicker` | `false` | 透视/正交切换 |

### 场景与渲染

| 选项 | 默认值 | 用途 |
|--------|---------|------|
| `sceneMode` | `SceneMode.SCENE3D` | 初始场景模式 |
| `scene3DOnly` | `false` | 锁定为 3D，节省 GPU 内存 |
| `shadows` | `false` | 阴影投射 |
| `terrainShadows` | `ShadowMode.RECEIVE_ONLY` | 地形阴影模式 |
| `requestRenderMode` | `false` | 仅在变化时渲染 |
| `maximumRenderTimeChange` | `0.0` | 渲染最大模拟时间差 |
| `msaaSamples` | `4` | MSAA（设为 1 禁用） |
| `orderIndependentTranslucency` | `true` | 半透明排序 |
| `mapMode2D` | `MapMode2D.INFINITE_SCROLL` | 2D 滚动行为 |

### 图层与地形

| 选项 | 默认值 | 用途 |
|--------|---------|------|
| `baseLayer` | `ImageryLayer.fromWorldImagery()` | 基础影像（设为 `false` 表示无；需同时设置 `baseLayerPicker: false`） |
| `terrain` | 无 | 异步地形助手（不能与 `terrainProvider` 同时使用） |
| `terrainProvider` | `EllipsoidTerrainProvider` | 同步地形提供者 |
| `globe` | `new Globe()` | 设为 `false` 表示无地球（太空场景） |
| `skyBox` | 自动（WGS84） | 设为 `false` 禁用天空/太阳/月亮 |
| `skyAtmosphere` | 自动（WGS84） | 设为 `false` 禁用地平线辉光 |

### 极简 Viewer（无小部件）

```js
import { Viewer, Ion, Terrain } from "cesium";
Ion.defaultAccessToken = "YOUR_TOKEN";

const viewer = new Viewer("cesiumContainer", {
  animation: false, baseLayerPicker: false, fullscreenButton: false,
  geocoder: false, homeButton: false, infoBox: false,
  sceneModePicker: false, selectionIndicator: false,
  timeline: false, navigationHelpButton: false,
  terrain: Terrain.fromWorldTerrain(),
});
```

## CesiumWidget（轻量替代方案）

无 UI 小部件，无 Knockout 依赖。适用于自定义 UI 或嵌入场景。

```js
import { CesiumWidget, Ion } from "cesium";
Ion.defaultAccessToken = "YOUR_TOKEN";

const widget = new CesiumWidget("cesiumContainer", { shouldAnimate: true });
// 暴露：widget.scene, widget.camera, widget.entities
```

## SceneMode 枚举

| 值 | 描述 |
|-------|-------------|
| `SceneMode.SCENE3D` | 标准 3D 地球（默认） |
| `SceneMode.SCENE2D` | 俯视正交地图 |
| `SceneMode.COLUMBUS_VIEW` | 2.5D 平地图带高度 |
| `SceneMode.MORPHING` | 模式切换过渡 |

```js
import { Viewer, SceneMode } from "cesium";

const viewer = new Viewer("cesiumContainer", { sceneMode: SceneMode.SCENE2D });
viewer.scene.morphTo3D(2.0);          // 动画过渡
viewer.scene.morphToColumbusView(2.0);
```

## 场景配置

```js
const scene = viewer.scene;
scene.globe.depthTestAgainstTerrain = true; // 实体与地形交互
scene.globe.enableLighting = true;          // 基于太阳的光照

// 关键子对象
scene.camera;           // Camera
scene.primitives;       // PrimitiveCollection
scene.groundPrimitives; // PrimitiveCollection（地面钳制）
scene.imageryLayers;    // ImageryLayerCollection
scene.postProcessStages;

scene.requestRender();  // 在 requestRenderMode 下触发帧渲染
```

## 工厂助手

### createOsmBuildingsAsync

```js
import { createOsmBuildingsAsync, Cesium3DTileStyle } from "cesium";

// 默认样式（颜色来自 OSM 标签）
const tileset = await createOsmBuildingsAsync();
viewer.scene.primitives.add(tileset);

// 自定义样式
const styled = await createOsmBuildingsAsync({
  style: new Cesium3DTileStyle({
    color: { conditions: [
      ["${feature['building']} === 'hospital'", "color('#0000FF')"],
      [true, "color('#ffffff')"],
    ]},
  }),
});
```

### createGooglePhotorealistic3DTileset

```js
import { createGooglePhotorealistic3DTileset, IonGeocodeProviderType } from "cesium";

// 必须使用 Google 地理编码器
const viewer = new Viewer("cesiumContainer", { geocoder: IonGeocodeProviderType.GOOGLE });
const tileset = await createGooglePhotorealistic3DTileset({ onlyUsingWithGoogleGeocoder: true });
viewer.scene.primitives.add(tileset);
```

### Terrain.fromWorldTerrain / fromWorldBathymetry

推荐用于 `terrain` 构造函数选项。非阻塞，带错误事件。

```js
import { Viewer, Terrain } from "cesium";

// 包含法线和水的世界地形
const viewer = new Viewer("cesiumContainer", {
  terrain: Terrain.fromWorldTerrain({ requestVertexNormals: true, requestWaterMask: true }),
});

// 水深测量（海底地形）
const viewer2 = new Viewer("cesiumContainer", {
  terrain: Terrain.fromWorldBathymetry({ requestVertexNormals: true }),
});
```

### 地形事件处理

```js
import { Terrain, CesiumTerrainProvider } from "cesium";

const terrain = new Terrain(CesiumTerrainProvider.fromUrl("https://my-terrain.example.com"));
viewer.scene.setTerrain(terrain);

terrain.readyEvent.addEventListener((provider) => {
  viewer.scene.globe.enableLighting = true;
});
terrain.errorEvent.addEventListener((error) => console.error("地形加载失败：", error));
```

### createWorldTerrainAsync / createWorldImageryAsync

较低层级：返回原始提供者。当您需要直接使用提供者时使用。

```js
import { createWorldTerrainAsync, createWorldImageryAsync, IonWorldImageryStyle } from "cesium";

const terrainProvider = await createWorldTerrainAsync({ requestVertexNormals: true });
viewer.terrainProvider = terrainProvider;

const imageryProvider = await createWorldImageryAsync({ style: IonWorldImageryStyle.AERIAL_WITH_LABELS });
```

**IonWorldImageryStyle**：`AERIAL`（默认）| `AERIAL_WITH_LABELS` | `ROAD`

## 地理编码器配置

`geocoder` 选项接受 `false`、`IonGeocodeProviderType` 或 `GeocoderService[]`。

**IonGeocodeProviderType**：`DEFAULT` | `GOOGLE`（使用 Google 瓦片时需要）| `BING`

```js
import { Viewer, CartographicGeocoderService, IonGeocoderService, OpenCageGeocoderService } from "cesium";

// 多个服务（按顺序搜索）
const viewer = new Viewer("cesiumContainer", {
  geocoder: [
    new CartographicGeocoderService(), // 接受 "lat, lon" 输入
    new IonGeocoderService({ scene: viewer.scene }),
  ],
});
```

### 自定义 GeocoderService

```js
const myGeocoder = {
  async geocode(input, type) {
    // type: GeocodeType.SEARCH 或 GeocodeType.AUTOCOMPLETE
    const resp = await fetch(`https://api.example.com/search?q=${input}`);
    const data = await resp.json();
    return data.map((item) => ({
      displayName: item.name,
      destination: Cartesian3.fromDegrees(item.lon, item.lat),
    }));
  },
};
const viewer = new Viewer("cesiumContainer", { geocoder: [myGeocoder] });
```

## Viewer Mixin

```js
import { Viewer, viewerDragDropMixin, viewerCesium3DTilesInspectorMixin,
  viewerCesiumInspectorMixin, viewerPerformanceWatchdogMixin, viewerVoxelInspectorMixin } from "cesium";

const viewer = new Viewer("cesiumContainer");

// 拖放加载 CZML/GeoJSON/KML
viewer.extend(viewerDragDropMixin, { dropTarget: "cesiumContainer", clearOnDrop: true });
viewer.dropError.addEventListener((handler, name, error) => console.error(error));

viewer.extend(viewerCesium3DTilesInspectorMixin);    // 3D Tiles 调试面板
viewer.extend(viewerCesiumInspectorMixin);            // 通用场景检查器
viewer.extend(viewerPerformanceWatchdogMixin);        // 低 FPS 警告
viewer.extend(viewerVoxelInspectorMixin);             // 体素调试面板
```

## 关键 Viewer 属性和方法

| 属性 | 类型 |
|----------|------|
| `viewer.scene` | `Scene` |
| `viewer.camera` | `Camera` |
| `viewer.entities` | `EntityCollection` |
| `viewer.dataSources` | `DataSourceCollection` |
| `viewer.imageryLayers` | `ImageryLayerCollection` |
| `viewer.terrainProvider` | `TerrainProvider` |
| `viewer.clock` / `clockViewModel` | `Clock` / `ClockViewModel` |
| `viewer.canvas` | `HTMLCanvasElement` |
| `viewer.screenSpaceEventHandler` | `ScreenSpaceEventHandler` |
| `viewer.selectedEntity` / `trackedEntity` | `Entity` |
| `viewer.shadows` | `boolean` |
| `viewer.resolutionScale` | `number`（默认 1.0） |

```js
await viewer.flyTo(entity, { duration: 3.0, offset: headingPitchRange }); // 动画飞行
await viewer.zoomTo(tileset);   // 立即缩放
viewer.destroy();               // 释放所有资源
```

## Credit 与 FrameRateMonitor

```js
import { Credit, FrameRateMonitor } from "cesium";

// 自定义致谢（显示在屏幕上）
viewer.creditDisplay.addStaticCredit(new Credit("数据来源：Example Corp", true));

// 监控帧率
const monitor = FrameRateMonitor.fromScene(viewer.scene);
monitor.lowFrameRate.addEventListener(() => console.warn("帧率过低"));
monitor.nominalFrameRate.addEventListener(() => console.log("帧率已恢复"));
```

## 常见模式

### 含地形和 OSM 建筑的生产级 Viewer

```js
import { Ion, Viewer, Terrain, createOsmBuildingsAsync, Cartesian3, Math as CesiumMath } from "cesium";

Ion.defaultAccessToken = "YOUR_TOKEN";
const viewer = new Viewer("cesiumContainer", {
  terrain: Terrain.fromWorldTerrain(), animation: false, timeline: false,
});

viewer.scene.primitives.add(await createOsmBuildingsAsync());
viewer.scene.camera.flyTo({
  destination: Cartesian3.fromDegrees(-74.019, 40.6912, 750),
  orientation: { heading: CesiumMath.toRadians(20), pitch: CesiumMath.toRadians(-20) },
});
```

### 太空场景（无地球）

```js
const viewer = new Viewer("cesiumContainer", {
  globe: false, skyAtmosphere: false, baseLayerPicker: false,
});
```

### 显式渲染模式（低功耗）

```js
const viewer = new Viewer("cesiumContainer", {
  requestRenderMode: true, maximumRenderTimeChange: Infinity,
});
// 在编程修改后调用 viewer.scene.requestRender()
```

### 自定义底图

```js
import { Viewer, ImageryLayer, OpenStreetMapImageryProvider } from "cesium";

const viewer = new Viewer("cesiumContainer", {
  baseLayerPicker: false,
  baseLayer: new ImageryLayer(new OpenStreetMapImageryProvider({
    url: "https://tile.openstreetmap.org/",
  })),
});
```

### 带 Web Mercator 的哥伦布视图

```js
import { Viewer, SceneMode, WebMercatorProjection } from "cesium";

const viewer = new Viewer("cesiumContainer", {
  sceneMode: SceneMode.COLUMBUS_VIEW, mapProjection: new WebMercatorProjection(),
});
```

## 性能提示

1. **设置 `requestRenderMode: true`** 用于大多数静态应用。减少 CPU/GPU 和电池消耗。修改后调用 `scene.requestRender()`。
2. **使用 `scene3DOnly: true`** 当不需要 2D/哥伦布视图时。每个几何体实例节省 GPU 内存。
3. **禁用未使用的小部件**（`animation: false`, `timeline: false`）以减少 DOM 开销。
4. **在低功耗设备上设置 `msaaSamples: 1`**。默认值 `4` 平衡质量。
5. **降低 `resolutionScale`**（例如 `0.75`）在 HiDPI 显示器上获得更好帧率。
6. **优先使用 `Terrain.fromWorldTerrain()`** 而非 `await createWorldTerrainAsync()` —— 非阻塞，带错误事件。
7. **启用 `requestVertexNormals: true`** 在地形上以获得正确光照，开销极小。
8. **从 DOM 中移除时调用 `viewer.destroy()`** 以释放 WebGL 上下文。
9. **限制影像图层为 2-3 层**。每层增加每个片段的纹理查找开销。

## 参见

- **cesiumjs-camera** -- 相机定位、flyTo、lookAt、导航约束
- **cesiumjs-entities** -- Entity API、数据源、GeoJSON/KML/CZML 加载
- **cesiumjs-imagery** -- 影像提供者、图层管理、分屏
- **cesiumjs-terrain-environment** -- 地形提供者、Globe、大气、天空、光照
