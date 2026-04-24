---
name: cesiumjs-3d-tiles
description: "CesiumJS 3D Tiles - Cesium3DTileset、样式、元数据、要素拾取、体素、点云、I3S、高斯泼溅、裁剪平面和多边形。在加载 3D Tiles tileset、样式化建筑要素、查询元数据属性、使用体素或点云，或裁剪空间数据时使用。"
---
# CesiumJS 3D Tiles

版本基线：CesiumJS v1.139（ES 模块导入，异步工厂方法）。

## 加载 Tileset

始终使用异步工厂方法 —— 绝不要直接调用构造函数。

```js
import { Cesium3DTileset, HeadingPitchRange, Math as CesiumMath } from "cesium";

// 从 URL 加载
const tileset = await Cesium3DTileset.fromUrl(
  "https://example.com/tileset.json",
  { maximumScreenSpaceError: 16 }, // 值越小 = 质量越高
);
viewer.scene.primitives.add(tileset);
viewer.zoomTo(tileset, new HeadingPitchRange(
  0.0, CesiumMath.toRadians(-25.0), tileset.boundingSphere.radius * 2.0,
));
```

```js
// 从 Cesium ion 加载
const tileset = await Cesium3DTileset.fromIonAssetId(75343);
viewer.scene.primitives.add(tileset);
```

```js
// Google Photorealistic 3D Tiles
import { createGooglePhotorealistic3DTileset } from "cesium";
const google3D = await createGooglePhotorealistic3DTileset({
  onlyUsingWithGoogleGeocoder: true,
});
viewer.scene.primitives.add(google3D);
```

```js
// OSM Buildings
import { createOsmBuildingsAsync } from "cesium";
const osmBuildings = await createOsmBuildingsAsync();
viewer.scene.primitives.add(osmBuildings);
```

## 关键构造函数选项

| 选项 | 默认值 | 用途 |
|---|---|---|
| `maximumScreenSpaceError` | 16 | LOD 质量阈值（像素） |
| `cacheBytes` | 536870912 | 瓦片缓存修剪目标（字节） |
| `maximumCacheOverflowBytes` | 536870912 | 额外缓存空间 |
| `shadows` | ShadowMode.ENABLED | 阴影投射/接收 |
| `modelMatrix` | Matrix4.IDENTITY | 根变换 |
| `clippingPlanes` | undefined | ClippingPlaneCollection |
| `clippingPolygons` | undefined | ClippingPolygonCollection（WebGL 2） |
| `enableCollision` | false | 相机与 tileset 表面的碰撞 |
| `pointCloudShading` | undefined | 点衰减选项对象 |
| `classificationType` | undefined | TERRAIN、CESIUM_3D_TILE 或 BOTH |
| `dynamicScreenSpaceError` | true | 地平线 LOD 优化 |
| `foveatedScreenSpaceError` | true | 屏幕中心瓦片优先级 |
| `preloadFlightDestinations` | true | 预取飞行目标处的瓦片 |
| `featureIdLabel` | "featureId_0" | EXT_mesh_features ID 集合标签 |
| `backFaceCulling` | true | 按 glTF 材质剔除背面 |

## Tileset 事件

```js
tileset.loadProgress.addEventListener((pending, processing) => {
  if (pending === 0 && processing === 0) console.log("已加载");
});
tileset.initialTilesLoaded.addEventListener(() => { /* 首视图就绪 */ });
tileset.allTilesLoaded.addEventListener(() => { /* 所有可见瓦片就绪 */ });
tileset.tileLoad.addEventListener((tile) => { /* 瓦片内容已加载 */ });
tileset.tileUnload.addEventListener((tile) => { /* 瓦片已从缓存中移除 */ });
tileset.tileFailed.addEventListener(({ url, message }) => {
  console.error(`瓦片 ${url}：${message}`);
});
// 每帧手动样式
tileset.tileVisible.addEventListener((tile) => {
  const content = tile.content;
  for (let i = 0; i < content.featuresLength; i++) {
    content.getFeature(i).color = Cesium.Color.fromRandom();
  }
});
```

## 运行时属性

```js
tileset.show = false;                     // 切换可见性
tileset.maximumScreenSpaceError = 8;      // 提高质量
const { center, radius } = tileset.boundingSphere;

import { Matrix4, Cartesian3 } from "cesium";
tileset.modelMatrix = Matrix4.fromTranslation(new Cartesian3(0, 0, 100));
```

## 声明式样式

为 `tileset.style` 分配 `Cesium3DTileStyle`。表达式使用 `${PropertyName}` 引用要素属性。

```js
import { Cesium3DTileStyle } from "cesium";

// 按高度条件着色
tileset.style = new Cesium3DTileStyle({
  color: {
    conditions: [
      ["${Height} >= 100", "color('purple', 0.5)"],
      ["${Height} >= 50",  "color('red')"],
      ["true",             "color('blue')"],
    ],
  },
  show: "${Height} > 0",
});
```

```js
// 使用 defines 简化重复的子表达式
tileset.style = new Cesium3DTileStyle({
  defines: { material: "${feature['building:material']}" },
  color: {
    conditions: [
      ["${material} === null",    "color('white')"],
      ["${material} === 'glass'", "color('skyblue', 0.5)"],
      ["${material} === 'brick'", "color('indianred')"],
      ["true",                    "color('white')"],
    ],
  },
});
```

```js
// 按属性显示/隐藏
tileset.style = new Cesium3DTileStyle({
  show: "${feature['building']} === 'office'",
});
```

```js
// 点云样式
tileset.style = new Cesium3DTileStyle({
  color: "vec4(${Temperature})",
  pointSize: "${Temperature} * 2.0",
});
```

```js
tileset.style = undefined; // 重置为默认外观
```

### 颜色混合模式

```js
import { Cesium3DTileColorBlendMode } from "cesium";
tileset.colorBlendMode = Cesium3DTileColorBlendMode.REPLACE; // HIGHLIGHT | REPLACE | MIX
tileset.colorBlendAmount = 0.5; // 仅与 MIX 一起使用
```

## 要素拾取和属性

`Scene.pick` 为 3D Tiles 要素返回 `Cesium3DTileFeature`。修改在所属瓦片从缓存中移除前持续有效。

```js
import {
  ScreenSpaceEventHandler, ScreenSpaceEventType,
  Cesium3DTileFeature, Color,
} from "cesium";

const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

// 悬停：读取属性
handler.setInputAction((movement) => {
  const feature = viewer.scene.pick(movement.endPosition);
  if (feature instanceof Cesium3DTileFeature) {
    const ids = feature.getPropertyIds();
    for (const id of ids) console.log(`${id}：${feature.getProperty(id)}`);
    feature.color = Color.YELLOW; // 高亮
  }
}, ScreenSpaceEventType.MOUSE_MOVE);

// 点击：检查单个属性
handler.setInputAction((movement) => {
  const feature = viewer.scene.pick(movement.position);
  if (feature instanceof Cesium3DTileFeature) {
    console.log("高度：", feature.getProperty("Height"));
    feature.setProperty("selected", true); // 写入自定义属性
    feature.show = false;                  // 隐藏单个要素
  }
}, ScreenSpaceEventType.LEFT_CLICK);
```

### 继承元数据（3D Tiles 1.1 / EXT_structural_metadata）

```js
// 搜索顺序：batch table -> content -> tile -> subtree -> group -> tileset
const value = feature.getPropertyInherited("semanticOrPropertyName");
```

## 裁剪平面

`ClippingPlaneCollection` 通过 tileset 局部坐标系中的半空间平面进行裁剪。

```js
import {
  ClippingPlane, ClippingPlaneCollection,
  Cartesian3, Color, Matrix4,
} from "cesium";

const clippingPlanes = new ClippingPlaneCollection({
  planes: [new ClippingPlane(new Cartesian3(0.0, 0.0, -1.0), 0.0)],
  edgeWidth: 1.0,
  edgeColor: Color.WHITE,
  unionClippingRegions: false, // false = 交集（AND）；true = 并集（OR）
});

const tileset = await Cesium3DTileset.fromUrl(url, { clippingPlanes });
// 或者：tileset.clippingPlanes = clippingPlanes;

// 运行时偏移裁剪边界
clippingPlanes.modelMatrix = Matrix4.fromTranslation(new Cartesian3(0, 0, 50));
clippingPlanes.get(0).distance = 25.0;
```

## 裁剪多边形

`ClippingPolygonCollection` 使用任意多边形进行裁剪。**仅 WebGL 2。**

```js
import { ClippingPolygon, ClippingPolygonCollection, Cartesian3 } from "cesium";

const polygon = new ClippingPolygon({
  positions: Cartesian3.fromDegreesArray([
    -105.0077, 39.7519, -105.0095, 39.7504,
    -105.0071, 39.7513, -105.0077, 39.7519,
  ]),
});

tileset.clippingPolygons = new ClippingPolygonCollection({
  polygons: [polygon],
  inverse: false, // false = 裁剪多边形内部；true = 裁剪多边形外部
});

// 也可用于地球
viewer.scene.globe.clippingPolygons = new ClippingPolygonCollection({
  polygons: [polygon],
});
```

## 点云着色

```js
const tileset = await Cesium3DTileset.fromUrl(pointCloudUrl, {
  pointCloudShading: {
    attenuation: true,           // 按几何误差缩放点大小
    geometricErrorScale: 1.0,
    maximumAttenuation: 10,      // 最大像素大小；undefined 时使用 maximumScreenSpaceError
    eyeDomeLighting: true,       // 深度感知边缘增强
    eyeDomeLightingStrength: 1.0,
    eyeDomeLightingRadius: 1.0,
    backFaceCulling: false,      // 需要点数据中有法线
    normalShading: true,
  },
});
viewer.scene.primitives.add(tileset);

// 运行时调整
tileset.pointCloudShading.eyeDomeLightingStrength = 2.0;
```

## 体素图元

`VoxelPrimitive` 从 `Cesium3DTilesVoxelProvider` 渲染体数据。形状：`BOX`、`CYLINDER`、`ELLIPSOID`（见 `VoxelShapeType`）。

```js
import { VoxelPrimitive, Cesium3DTilesVoxelProvider, CustomShader } from "cesium";

const provider = await Cesium3DTilesVoxelProvider.fromUrl("voxel/tileset.json");

const voxelPrimitive = new VoxelPrimitive({
  provider,
  customShader: new CustomShader({
    fragmentShaderText: `void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      material.diffuse = fsInput.metadata.a.rgb;
      material.alpha = fsInput.metadata.a.a;
    }`,
  }),
});
viewer.scene.primitives.add(voxelPrimitive);
voxelPrimitive.nearestSampling = true;
viewer.camera.flyToBoundingSphere(voxelPrimitive.boundingSphere, { duration: 0 });

// 关于体素着色器编写 — 结构体可用性、光线步进语义、元数据
// 访问 — 请参见 cesiumjs-custom-shader 技能。本技能涵盖 VoxelPrimitive 设置。

// 可选检查器小部件
viewer.extend(Cesium.viewerVoxelInspectorMixin);
viewer.voxelInspector.viewModel.voxelPrimitive = voxelPrimitive;
```

## I3S 数据提供者

加载 Esri I3S 场景图层（3D Objects、IntegratedMesh、Building Scene Layer）。

```js
import { I3SDataProvider, ArcGISTiledElevationTerrainProvider, Ellipsoid, Rectangle } from "cesium";

const geoidService = await ArcGISTiledElevationTerrainProvider.fromUrl(
  "https://tiles.arcgis.com/tiles/.../EGM2008/ImageServer",
);
const i3sProvider = await I3SDataProvider.fromUrl(
  "https://tiles.arcgis.com/tiles/.../SceneServer/layers/0",
  { geoidTiledTerrainProvider: geoidService },
);
viewer.scene.primitives.add(i3sProvider);

const center = Rectangle.center(i3sProvider.extent);
center.height = 5000.0;
viewer.camera.setView({
  destination: Ellipsoid.WGS84.cartographicToCartesian(center),
});
```

## 高斯泼溅（Gaussian Splats）

作为标准 3D Tiles 加载；CesiumJS 自动处理 `KHR_gaussian_splatting`。

```js
const splats = await Cesium3DTileset.fromIonAssetId(3667783);
viewer.scene.primitives.add(splats);
viewer.zoomTo(splats);
```

## 分类（Classification）

将 tileset 几何体作为分类覆盖层绘制在地形或其他 tileset 上。

```js
import { Cesium3DTileset, ClassificationType } from "cesium";
const classified = await Cesium3DTileset.fromUrl(url, {
  classificationType: ClassificationType.BOTH, // TERRAIN | CESIUM_3D_TILE | BOTH
});
viewer.scene.primitives.add(classified);
```

## 调整 Tileset 高度

```js
import { Cartographic, Cartesian3, Matrix4 } from "cesium";
const cartographic = Cartographic.fromCartesian(tileset.boundingSphere.center);
const surface = Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
const offset = Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
const translation = Cartesian3.subtract(offset, surface, new Cartesian3());
tileset.modelMatrix = Matrix4.fromTranslation(translation);
```

## 性能提示

1. 将 `maximumScreenSpaceError` 保持在可接受的高值（默认 16；移动端 32+）。
2. 对于包含大型 tileset 的街景视图，保持 `dynamicScreenSpaceError: true`。
3. 保持 `foveatedScreenSpaceError: true` 以优先处理屏幕中心瓦片。
4. 根据设备内存调整 `cacheBytes` 和 `maximumCacheOverflowBytes` 的大小（各默认 512 MB）。
5. 使用 `preloadFlightDestinations: true` 在相机飞行目标处预取瓦片。
6. 对于大型替换细化 tileset，启用 `skipLevelOfDetail: true` 以减少内存。
7. 避免将 `maximumScreenSpaceError` 设置到 4 以下 —— 收益递减，瓦片请求量大增。
8. 对于点云，启用 `attenuation` 和 `eyeDomeLighting` 以填补间隙并增加深度。
9. 除非需要相机碰撞或瓦片上的 CLAMP_TO_GROUND，否则保持 `enableCollision: false`。
10. 使用 `show: false` 和 `preloadWhenHidden: true` 预加载隐藏的 tileset。
11. 尽可能避免透明样式 —— 它们会增加渲染通道并禁用优化。
12. 监听 `tileFailed` 以记录错误；大幅相机跳转后调用 `trimLoadedTiles()`。

## 参见

- **cesiumjs-custom-shader** -- 为 `Cesium3DTileset.customShader` 和 `VoxelPrimitive.customShader` 编写 GLSL（结构体参考、要素 ID、元数据）
- **cesiumjs-materials-shaders** -- ImageBasedLighting、tileset 的后处理阶段
- **cesiumjs-interaction** -- Scene.pick、drillPick、用于要素选择的 ScreenSpaceEventHandler
- **cesiumjs-terrain-environment** -- Globe、地形提供者、大气、光照、阴影
