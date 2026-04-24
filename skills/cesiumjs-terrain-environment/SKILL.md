---
name: cesiumjs-terrain-environment
description: "CesiumJS 地形、地球与环境 - TerrainProvider、Globe、sampleTerrain、大气、天空、雾、光照、阴影、全景。在配置地形提供者、查询地形高度、自定义大气或天空渲染、添加全景或调整场景光照和阴影时使用。"
---
# CesiumJS 地形、地球与环境

版本基线：CesiumJS v1.139 | ES 模块导入（`import { ... } from "cesium";`）

## 地形提供者

地形通过 `TerrainProvider` 实现提供。使用异步工厂方法（`fromIonAssetId`、`fromUrl`），不要直接调用构造函数。

### Cesium Ion 世界地形

```js
import { Viewer, Terrain } from "cesium";

const viewer = new Viewer("cesiumContainer", {
  terrain: Terrain.fromWorldTerrain({
    requestVertexNormals: true, // 更平滑的光照
    requestWaterMask: true,     // 海洋水面效果
  }),
});
```

### 来自 Ion 资产/URL 的 CesiumTerrainProvider

```js
import { CesiumTerrainProvider } from "cesium";

// 按 Ion 资产 ID（例如 3956 = Arctic DEM）
const tp = await CesiumTerrainProvider.fromIonAssetId(3956, {
  requestVertexNormals: true,
});
viewer.scene.globe.terrainProvider = tp;

// 按 URL（自托管地形服务器）
const tp2 = await CesiumTerrainProvider.fromUrl(
  "https://my-server.example.com/terrain",
  { requestVertexNormals: true },
);
```

### EllipsoidTerrainProvider（平地球）

```js
import { EllipsoidTerrainProvider } from "cesium";
// 平坦椭球体 —— 无地形数据，适用于 2D/哥伦布视图或测试
viewer.scene.globe.terrainProvider = new EllipsoidTerrainProvider();
```

### CustomHeightmapTerrainProvider（程序式）

```js
import { CustomHeightmapTerrainProvider } from "cesium";

viewer.scene.globe.terrainProvider = new CustomHeightmapTerrainProvider({
  width: 32,
  height: 32,
  callback: function (x, y, level) {
    const buf = new Float32Array(32 * 32);
    for (let r = 0; r < 32; r++) {
      for (let c = 0; c < 32; c++) {
        buf[r * 32 + c] = Math.sin((x + c / 32) * 6.28) * 5000;
      }
    }
    return buf;
  },
});
```

## 采样地形高度

两个函数都会原地修改输入的 `Cartographic[]`（设置 `.height`）并返回解析为同一数组的 Promise。

```js
import { sampleTerrain, sampleTerrainMostDetailed, Cartographic } from "cesium";

const positions = [
  Cartographic.fromDegrees(86.925145, 27.988257), // 珠穆朗玛峰
  Cartographic.fromDegrees(87.0, 28.0),
];

// 固定 LOD 级别 —— 快速，近似
await sampleTerrain(viewer.scene.globe.terrainProvider, 11, positions);

// 最大可用 LOD —— 较慢，最精确
// 需要 provider.availability（例如 CesiumTerrainProvider）
await sampleTerrainMostDetailed(viewer.scene.globe.terrainProvider, positions);
// positions[0].height 现在已填充

// 传入 true 作为第 3 个参数，在瓦片失败时拒绝而非返回 undefined 高度
await sampleTerrainMostDetailed(provider, positions, true);
```

## Globe 配置

通过 `viewer.scene.globe` 访问。控制地形渲染、影像图层、大气和表面视觉属性。

```js
const globe = viewer.scene.globe;

globe.show = true;
globe.maximumScreenSpaceError = 2; // 地形 LOD 质量（值越大 = 细节越少）
globe.tileCacheSize = 100;         // 内存中保留的瓦片数

// 光照
globe.enableLighting = true;
globe.dynamicAtmosphereLighting = true;
globe.dynamicAtmosphereLightingFromSun = false; // true = 始终使用太阳方向
globe.lambertDiffuseMultiplier = 0.9;

// 大气
globe.showGroundAtmosphere = true; // 地平线辉光（WGS84 默认为 true）
globe.atmosphereHueShift = 0.0;
globe.atmosphereSaturationShift = 0.0;
globe.atmosphereBrightnessShift = 0.0;

// 表面行为
globe.depthTestAgainstTerrain = false; // true = 实体与地形进行 z 测试
globe.showWaterEffect = true;          // 动态海洋动画（需要水遮罩）
globe.shadows = Cesium.ShadowMode.RECEIVE_ONLY;
globe.baseColor = Cesium.Color.BLUE;   // 未加载影像时的颜色
globe.backFaceCulling = true;
globe.showSkirts = true;
```

### Globe.pick 和 Globe.getHeight

```js
// 射线投射到地球表面
const ray = viewer.camera.getPickRay(windowPosition);
const hit = viewer.scene.globe.pick(ray, viewer.scene);

// 从缓存瓦片同步获取高度（可能返回 undefined）
const h = viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(-105, 40));
```

### 地形夸张

```js
// 在 Scene 上设置，而非 Globe
viewer.scene.verticalExaggeration = 2.0;
viewer.scene.verticalExaggerationRelativeHeight = 0.0; // 相对于海平面
```

## Globe 半透明度

使地球变得透明，用于地下/次表面可视化。

```js
const globe = viewer.scene.globe;
globe.translucency.enabled = true;
globe.translucency.frontFaceAlpha = 0.5;
globe.translucency.backFaceAlpha = 1.0;

// 基于距离的透明度
globe.translucency.frontFaceAlphaByDistance = new Cesium.NearFarScalar(
  1.5e2, 0.5,  // 近：150 米，透明度 0.5
  8.0e6, 1.0,  // 远：8000 公里，透明度 1.0
);

// 限制到地理区域
globe.translucency.rectangle = Cesium.Rectangle.fromDegrees(-120, 30, -80, 50);
```

## 高程带材质

按海拔高度为地球表面着色。

```js
import { createElevationBandMaterial, Color } from "cesium";

viewer.scene.globe.material = createElevationBandMaterial({
  scene: viewer.scene,
  layers: [{
    entries: [
      { height: 0,    color: new Color(0.0, 0.0, 0.5, 1.0) },
      { height: 500,  color: new Color(0.0, 0.8, 0.0, 1.0) },
      { height: 2000, color: new Color(0.6, 0.3, 0.1, 1.0) },
      { height: 5000, color: Color.WHITE },
    ],
  }],
});
```

## SkyAtmosphere

地球边缘的大气辉光环。仅 3D 模式。

```js
const sky = viewer.scene.skyAtmosphere;
sky.show = true;
sky.perFragmentAtmosphere = false;     // true = 更高质量，轻微性能开销
sky.atmosphereLightIntensity = 50.0;
sky.hueShift = 0.0;                    // 0..1
sky.saturationShift = 0.0;             // -1..1
sky.brightnessShift = 0.0;             // -1..1
// 散射系数（高级调优）
sky.atmosphereRayleighCoefficient = new Cesium.Cartesian3(5.5e-6, 13.0e-6, 28.4e-6);
sky.atmosphereMieCoefficient = new Cesium.Cartesian3(21e-6, 21e-6, 21e-6);
sky.atmosphereMieAnisotropy = 0.9;
```

## SkyBox

地球背后的星空立方体贴图。仅 3D 模式。

```js
import { SkyBox } from "cesium";

viewer.scene.skyBox = SkyBox.createEarthSkyBox(); // 默认星空

viewer.scene.skyBox = new SkyBox({
  sources: {
    positiveX: "skybox_px.png", negativeX: "skybox_nx.png",
    positiveY: "skybox_py.png", negativeY: "skybox_ny.png",
    positiveZ: "skybox_pz.png", negativeZ: "skybox_nz.png",
  },
});
```

## Fog（雾）

将远处地形与大气色混合并剔除远处的瓦片。仅 3D 模式。

```js
const fog = viewer.scene.fog;
fog.enabled = true;
fog.renderable = true;          // false = 剔除瓦片但跳过视觉雾效
fog.density = 0.0006;           // 值越高 = 雾越浓，剔除越多
fog.visualDensityScalar = 0.15; // 仅视觉乘数
fog.maxHeight = 800000.0;       // 此高度以上禁用雾（米）
fog.heightFalloff = 0.59;       // 指数衰减（必须 > 0）
fog.screenSpaceErrorFactor = 2.0;
fog.minimumBrightness = 0.03;   // 防止雾效完全变黑
```

## 太阳和月亮

```js
viewer.scene.sun = new Cesium.Sun();
viewer.scene.sun.show = true;
viewer.scene.moon.show = true; // 遵循真实月球星历
```

## 光照

`scene.light` 控制场景光源。默认是 `SunLight`（跟随时钟）。

```js
import { SunLight, DirectionalLight, Cartesian3, Color } from "cesium";

// SunLight -- 基于场景时钟跟随太阳位置
viewer.scene.light = new SunLight({ color: Color.WHITE, intensity: 2.0 });

// DirectionalLight -- 工作室风格照明的固定方向
viewer.scene.light = new DirectionalLight({
  direction: new Cartesian3(0.2, -0.5, -0.8), // 必须非零
  color: Color.WHITE,
  intensity: 1.5,
});

viewer.scene.globe.enableLighting = true; // 光照影响地形所需
```

`DynamicAtmosphereLightingType` 枚举（NONE、SCENE_LIGHT、SUNLIGHT）通过 `globe.enableLighting`、`globe.dynamicAtmosphereLighting` 和 `globe.dynamicAtmosphereLightingFromSun` 标志配置。

## 阴影

来自场景光源的级联阴影贴图。

```js
viewer.shadows = true;
const sm = viewer.shadowMap;
sm.maximumDistance = 5000.0; // 级联范围（米）
sm.softShadows = true;      // PCF 柔化边缘
sm.darkness = 0.3;           // 0 = 不可见，1 = 黑色
sm.fadingEnabled = true;     // 地平线附近淡出

viewer.scene.globe.shadows = Cesium.ShadowMode.RECEIVE_ONLY; // 默认
// ShadowMode：DISABLED、ENABLED、CAST_ONLY、RECEIVE_ONLY
```

## 全景（v1.139+）

场景位置处的 360 度影像。两种格式：等距柱状投影和立方体贴图。

### EquirectangularPanorama

```js
import {
  EquirectangularPanorama, Cartesian3,
  HeadingPitchRoll, Transforms, Math as CesiumMath,
} from "cesium";

const position = Cartesian3.fromDegrees(-75.17, 39.95, 100.0);
const hpr = new HeadingPitchRoll(CesiumMath.toRadians(45), 0, 0);
const transform = Transforms.headingPitchRollToFixedFrame(position, hpr);

viewer.scene.primitives.add(new EquirectangularPanorama({
  transform,
  image: "path/to/equirectangular-360.jpg",
  radius: 100000.0,
}));
```

### CubeMapPanorama

```js
import { CubeMapPanorama, Cartesian3, Transforms, Matrix3, Matrix4 } from "cesium";

const pos = Cartesian3.fromDegrees(-122.42, 37.77, 10.0);
const northDown = Transforms.localFrameToFixedFrameGenerator("north", "down");
const xform = Matrix4.getMatrix3(northDown(pos), new Matrix3());

viewer.scene.primitives.add(new CubeMapPanorama({
  sources: {
    positiveX: "px.jpg", negativeX: "nx.jpg",
    positiveY: "py.jpg", negativeY: "ny.jpg",
    positiveZ: "pz.jpg", negativeZ: "nz.jpg",
  },
  transform: xform,
}));
```

### GoogleStreetViewCubeMapPanoramaProvider

```js
import { GoogleStreetViewCubeMapPanoramaProvider, Cartographic } from "cesium";

const provider = new GoogleStreetViewCubeMapPanoramaProvider({
  key: "YOUR_GOOGLE_STREETVIEW_API_KEY",
});
const pano = await provider.loadPanorama({
  cartographic: Cartographic.fromDegrees(-122.42, 37.77, 0),
});
viewer.scene.primitives.add(pano);
```

## 地形提供者事件

```js
viewer.scene.globe.terrainProviderChanged.addEventListener((newProvider) => {
  console.log("地形已更改：", newProvider.constructor.name);
});
```

## 性能提示

1. **将 `maximumScreenSpaceError` 从 `2` 增加到 `4`+** 在移动端 —— 单一最大的地形性能旋钮。
2. **保持雾效启用**（默认） —— 剔除远处瓦片，减少绘制调用。
3. **避免每帧更改 `verticalExaggeration`** —— 会强制地形瓦片重新加载。
4. **仅在启用光照时设置 `requestVertexNormals: true`** —— 瓦片大小翻倍。
5. **当 `showWaterEffect` 关闭时跳过 `requestWaterMask`**（默认 false）。
6. **当近似高度足够时优先使用 `sampleTerrain` 而非 `sampleTerrainMostDetailed`** —— 解析更快，瓦片请求更少。
7. **批量地形采样** —— 将所有位置传入一个数组以共享瓦片加载。
8. **调整 `tileCacheSize`** —— 增加用于缩放密集型工作流，减少以节省内存。
9. **在非地球椭球体上禁用 `showGroundAtmosphere`** 以避免伪影。
10. **保持 `depthTestAgainstTerrain = false`**（默认）以避免标签和布告板靠近表面时 z 冲突。

## 快速参考

| 类 / 函数 | 用途 |
|---|---|
| `CesiumTerrainProvider.fromIonAssetId(id, opts)` | Ion 地形资产 |
| `CesiumTerrainProvider.fromUrl(url, opts)` | 自托管地形 |
| `EllipsoidTerrainProvider` | 平坦椭球体（无地形） |
| `CustomHeightmapTerrainProvider` | 程序/回调地形 |
| `ArcGISTiledElevationTerrainProvider` | ArcGIS 高程服务 |
| `sampleTerrain(provider, level, positions)` | 固定 LOD 高度 |
| `sampleTerrainMostDetailed(provider, positions)` | 最大 LOD 高度 |
| `Globe` | 表面渲染、地形、大气 |
| `GlobeTranslucency` | 用于地下视图的透明地球 |
| `createElevationBandMaterial` | 按海拔着色表面 |
| `SkyAtmosphere` | 大气边缘辉光 |
| `SkyBox` / `SkyBox.createEarthSkyBox()` | 星空立方体贴图 |
| `Fog` | 距离雾和地形剔除 |
| `Sun` / `Moon` | 天体渲染 |
| `SunLight` | 跟随太阳的光源 |
| `DirectionalLight` | 固定方向光源 |
| `ShadowMap` | 级联阴影贴图 |
| `EquirectangularPanorama` | 360 度全景 |
| `CubeMapPanorama` | 立方体贴图全景 |
| `GoogleStreetViewCubeMapPanoramaProvider` | Google 街景全景 |
| `DynamicAtmosphereLightingType` | 枚举：NONE、SCENE_LIGHT、SUNLIGHT |
| `ShadowMode` | 枚举：DISABLED、ENABLED、CAST_ONLY、RECEIVE_ONLY |

## 参见

- **cesiumjs-viewer-setup** -- Viewer 初始化、Ion 令牌、场景配置
- **cesiumjs-imagery** -- 影像提供者和图层管理
- **cesiumjs-spatial-math** -- Cartesian3、Cartographic、Transforms、坐标数学
