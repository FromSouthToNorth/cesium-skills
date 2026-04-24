---
name: cesiumjs-imagery
description: "CesiumJS 影像图层 - ImageryProvider、ImageryLayer、ImageryLayerCollection、WMS、WMTS、Bing、OpenStreetMap、ArcGIS、Mapbox、瓦片丢弃策略。在添加或切换底图图层、配置影像提供者、分层多个地图源或创建分屏影像对比时使用。"
---
# CesiumJS 影像图层

> CesiumJS v1.139 -- 影像提供者提供在地球仪上渲染或覆盖在 Cesium3DTileset 上的栅格瓦片数据。三个核心抽象为 **ImageryProvider**（获取瓦片）、**ImageryLayer**（显示设置）和 **ImageryLayerCollection**（地球仪上的有序堆叠）。

```
ImageryProvider        （抽象 -- 获取瓦片影像）
  -> ImageryLayer      （包装一个提供者；alpha、亮度、分屏等）
    -> ImageryLayerCollection  （有序堆叠；索引 0 = 底图图层）
      -> Globe / Cesium3DTileset
```

图层从下到上渲染。索引 0 为**底图图层**，即使其矩形未覆盖全球也会拉伸填充地球。

## 快速开始和 ImageryLayer 工厂

在创建用于影像工作的 viewer 时，禁用不需要的小部件，使影像成为视觉焦点。当需要相机立即到位时，使用 `camera.setView`（而非 `flyTo`）—— `flyTo` 有动画效果，可能在代码继续执行前尚未完成。

```js
import { Viewer, ImageryLayer, IonImageryProvider, IonWorldImageryStyle, Math as CesiumMath } from "cesium";

// 简洁的 viewer -- 禁用会分散影像注意力的小部件
const viewer = new Viewer("cesiumContainer", {
  animation: false,
  timeline: false,
  navigationHelpButton: false,
  navigationInstructionsInitiallyVisible: false,
});

// 立即定位相机（无动画）
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(-73.0, 41.0, 1500000),
  orientation: {
    heading: 0.0,
    pitch: CesiumMath.toRadians(-90), // 垂直俯视
    roll: 0.0,
  },
});

// 显式选择底图图层
const viewer2 = new Viewer("cesiumContainer", {
  baseLayer: ImageryLayer.fromWorldImagery(),
});

// fromProviderAsync -- 包装任何异步提供者；立即返回 ImageryLayer
const nightLayer = ImageryLayer.fromProviderAsync(
  IonImageryProvider.fromAssetId(3812), // 夜间地球
);
nightLayer.alpha = 0.5;
nightLayer.brightness = 2.0;
viewer.imageryLayers.add(nightLayer);

// 带样式覆盖的 fromWorldImagery
const roadLayer = ImageryLayer.fromWorldImagery({
  style: IonWorldImageryStyle.ROAD,
});
viewer.imageryLayers.add(roadLayer);
```

### 影像场景的相机高度参考

使用 `camera.setView`，参考以下近似高度：

| 尺度 | 高度（米） | 示例 |
|---|---|---|
| 街道 / 街区 | 500–2,000 | 市中心十字路口 |
| 城市 | 5,000–25,000 | 华盛顿特区、巴黎 |
| 都会区 | 50,000–200,000 | 大伦敦 |
| 地区 / 州 | 300,000–1,500,000 | 佛罗里达、日本 |
| 大陆 | 3,000,000–8,000,000 | 欧洲、北美 |

俯视（地图风格）视图设置 `pitch: CesiumMath.toRadians(-90)`。
倾斜 3D 视图设置 `pitch: CesiumMath.toRadians(-35)` 到 `CesiumMath.toRadians(-60)`。

## ImageryLayerCollection API

通过 `viewer.imageryLayers` 访问（与 `viewer.scene.imageryLayers` 相同）。

```js
const layers = viewer.imageryLayers;

layers.add(myLayer);              // 添加到顶部
layers.add(myLayer, 0);           // 在指定索引添加
layers.addImageryProvider(provider); // 创建图层并添加

layers.raise(myLayer);            // 上移一层
layers.lower(myLayer);            // 下移一层
layers.raiseToTop(myLayer);       // 移到顶层
layers.lowerToBottom(myLayer);    // 移到底层

layers.remove(myLayer);           // 移除并销毁
layers.remove(myLayer, false);    // 移除但不销毁
layers.removeAll();

const count = layers.length;
const base  = layers.get(0);
const idx   = layers.indexOf(myLayer);
const has   = layers.contains(myLayer);
```

事件：`layerAdded(layer, index)`、`layerRemoved(layer, index)`、`layerMoved(layer, newIndex, oldIndex)`、`layerShownOrHidden(layer, index, show)`。

## ImageryLayer 显示属性

属性接受数值或逐瓦片回调 `(frameState, layer, x, y, level) => value`。

| 属性 | 默认值 | 说明 |
|---|---|---|
| `alpha` | 1.0 | 0 = 透明，1 = 不透明 |
| `brightness` | 1.0 | < 1 变暗，> 1 变亮 |
| `contrast` | 1.0 | < 1 对比度降低，> 1 对比度提高 |
| `hue` | 0.0 | 色相偏移（弧度） |
| `saturation` | 1.0 | < 1 去饱和，> 1 过饱和 |
| `gamma` | 1.0 | 伽马校正 |
| `show` | true | 可见性切换 |
| `splitDirection` | `SplitDirection.NONE` | LEFT、RIGHT 或 NONE |
| `nightAlpha` / `dayAlpha` | 1.0 | 需要 `Globe.enableLighting` |

其他选项：`rectangle`、`minimumTerrainLevel` / `maximumTerrainLevel`、`cutoutRectangle`、`colorToAlpha` / `colorToAlphaThreshold`、`minificationFilter` / `magnificationFilter`（默认为 LINEAR，或 NEAREST）。

```js
// 运行时调整外观
layer.alpha = 0.7;
layer.brightness = 1.3;
layer.contrast = 1.5;
layer.saturation = 0.5;
layer.gamma = 1.2;
```

## 切换底图图层

移除默认底图图层并在索引 0 处替换。替换图层成为新的底图图层，拉伸以填充地球。

```js
import { ImageryLayer, OpenStreetMapImageryProvider } from "cesium";

// 移除默认 Bing 航空影像
viewer.imageryLayers.remove(viewer.imageryLayers.get(0));

// 在索引 0 处添加 OSM 作为新底图图层
const osmLayer = new ImageryLayer(
  new OpenStreetMapImageryProvider({
    url: "https://tile.openstreetmap.org/",
    maximumLevel: 19,
    credit: "OpenStreetMap 贡献者",
  }),
);
viewer.imageryLayers.add(osmLayer, 0);
```

## 影像提供者

### IonImageryProvider

```js
// 始终使用 fromAssetId（异步工厂）；不要直接调用构造函数
const layer = ImageryLayer.fromProviderAsync(
  IonImageryProvider.fromAssetId(3812),
);
viewer.imageryLayers.add(layer);
```

### OpenStreetMapImageryProvider

扩展 UrlTemplateImageryProvider 用于 Slip 瓦片服务器。

```js
const osm = new OpenStreetMapImageryProvider({
  url: "https://tile.openstreetmap.org/",
  maximumLevel: 19,
  credit: "OpenStreetMap 贡献者",
  // retinaTiles: true,  // 请求 @2x 瓦片
});
viewer.imageryLayers.addImageryProvider(osm);
```

### UrlTemplateImageryProvider

最灵活的提供者。占位符：`{x}`、`{y}`、`{z}`、`{s}`、`{reverseX/Y/Z}`、`{west/south/east/northDegrees}`、`{west/south/east/northProjected}`、`{width}`、`{height}`。

```js
import { UrlTemplateImageryProvider, GeographicTilingScheme, buildModuleUrl } from "cesium";

// TMS 风格的地理切片
const tms = new UrlTemplateImageryProvider({
  url: buildModuleUrl("Assets/Textures/NaturalEarthII") + "/{z}/{x}/{reverseY}.jpg",
  tilingScheme: new GeographicTilingScheme(),
  maximumLevel: 5,
});
viewer.imageryLayers.addImageryProvider(tms);

// Carto Positron 带子域名
const positron = new UrlTemplateImageryProvider({
  url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  subdomains: "abcd",
  credit: "地图瓦片由 CartoDB 提供，遵循 CC BY 3.0。数据由 OpenStreetMap 提供，遵循 ODbL。",
});

// 随时间变化数据的自定义标签
const custom = new UrlTemplateImageryProvider({
  url: "https://yourserver/{Time}/{z}/{y}/{x}.png",
  customTags: {
    Time: (imageryProvider, x, y, level) => "20240101",
  },
});
```

### WebMapServiceImageryProvider（WMS）

```js
import { WebMapServiceImageryProvider, ImageryLayer, Rectangle } from "cesium";

const wms = new WebMapServiceImageryProvider({
  url: "https://basemap.nationalmap.gov:443/arcgis/services/USGSHydroCached/MapServer/WMSServer",
  layers: "0",
  rectangle: Rectangle.fromDegrees(-180, -90, 180, 90),
  // parameters: { transparent: true, format: "image/png" },
  // crs: "EPSG:4326",  // WMS >= 1.3.0
  // srs: "EPSG:4326",  // WMS 1.1.x
});
viewer.imageryLayers.add(new ImageryLayer(wms));
```

### WebMapTileServiceImageryProvider（WMTS）

必要选项：`url`、`layer`、`style`、`tileMatrixSetID`。

```js
import { WebMapTileServiceImageryProvider, Credit } from "cesium";

const wmts = new WebMapTileServiceImageryProvider({
  url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS",
  layer: "USGSShadedReliefOnly",
  style: "default",
  format: "image/jpeg",
  tileMatrixSetID: "default028mm",
  maximumLevel: 19,
  credit: new Credit("美国地质调查局"),
});
viewer.imageryLayers.addImageryProvider(wmts);
```

### ArcGisMapServerImageryProvider

```js
import { ArcGisMapServerImageryProvider, ArcGisMapService, ArcGisBaseMapType, ImageryLayer } from "cesium";

ArcGisMapService.defaultAccessToken = "<YOUR_ARCGIS_TOKEN>";

// 通过底图类型枚举：SATELLITE、OCEANS、HILLSHADE
const arcgis = ImageryLayer.fromProviderAsync(
  ArcGisMapServerImageryProvider.fromBasemapType(ArcGisBaseMapType.SATELLITE),
);
viewer.imageryLayers.add(arcgis);

// 通过特定 MapServer URL
const streets = ImageryLayer.fromProviderAsync(
  ArcGisMapServerImageryProvider.fromUrl(
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer",
  ),
);
```

### BingMapsImageryProvider

```js
import { BingMapsImageryProvider, BingMapsStyle, ImageryLayer } from "cesium";

const bing = ImageryLayer.fromProviderAsync(
  BingMapsImageryProvider.fromUrl("https://dev.virtualearth.net", {
    key: "<YOUR_BING_KEY>",
    mapStyle: BingMapsStyle.AERIAL_WITH_LABELS_ON_DEMAND,
  }),
);
viewer.imageryLayers.add(bing);
```

样式：`AERIAL`、`AERIAL_WITH_LABELS_ON_DEMAND`、`ROAD_ON_DEMAND`、`CANVAS_DARK`、`CANVAS_LIGHT`、`CANVAS_GRAY`。

### MapboxStyleImageryProvider

```js
import { MapboxStyleImageryProvider, ImageryLayer } from "cesium";

const mapbox = new MapboxStyleImageryProvider({
  styleId: "streets-v11",
  accessToken: "<YOUR_MAPBOX_TOKEN>",
  // tilesize: 512, scaleFactor: true  // retina
});
viewer.imageryLayers.add(new ImageryLayer(mapbox));
```

### SingleTileImageryProvider

```js
import { SingleTileImageryProvider, ImageryLayer, Rectangle } from "cesium";

const logo = ImageryLayer.fromProviderAsync(
  SingleTileImageryProvider.fromUrl("/images/overlay.png", {
    rectangle: Rectangle.fromDegrees(-75.0, 28.0, -67.0, 29.75),
  }),
);
viewer.imageryLayers.add(logo);
```

## 分屏对比

```js
import { ImageryLayer, IonImageryProvider, SplitDirection } from "cesium";

// 添加仅显示在分屏左侧的叠加层
const nightLayer = ImageryLayer.fromProviderAsync(IonImageryProvider.fromAssetId(3812));
nightLayer.splitDirection = SplitDirection.LEFT;
viewer.imageryLayers.add(nightLayer);

viewer.scene.splitPosition = 0.5; // 视口宽度的 0-1 分数
```

`SplitDirection`：`LEFT`（-1）、`NONE`（0）、`RIGHT`（1）。

## 挖空矩形

```js
import { Rectangle } from "cesium";

const cutout = Rectangle.fromDegrees(-90, 20, -70, 40);

// 在底图图层上挖一个洞以显示下方的影像
const base = viewer.imageryLayers.get(0);
base.cutoutRectangle = cutout;
```

## 颜色转透明度

```js
import { Color } from "cesium";

const baseLayer = viewer.imageryLayers.get(0);
baseLayer.colorToAlpha = new Color(0.0, 0.016, 0.059); // 深蓝色海洋
baseLayer.colorToAlphaThreshold = 0.2; // 容差（0-1）
```

## 在 3D Tiles 上覆盖影像

```js
import { Cesium3DTileset, ImageryLayer, IonImageryProvider } from "cesium";

const tileset = await Cesium3DTileset.fromUrl("/path/to/tileset.json");
viewer.scene.primitives.add(tileset);

const labelLayer = ImageryLayer.fromProviderAsync(
  IonImageryProvider.fromAssetId(2411391),
);
tileset.imageryLayers.add(labelLayer); // 覆盖在 tileset 上，而非地球
labelLayer.show = false; // 关闭切换
```

## 调试提供者

```js
import { TileCoordinatesImageryProvider, GridImageryProvider, ImageryLayer, Color } from "cesium";

// 在每个瓦片上显示 x/y/level 标签
viewer.imageryLayers.add(new ImageryLayer(
  new TileCoordinatesImageryProvider({ color: Color.YELLOW }),
));
// 线框网格叠加
viewer.imageryLayers.add(new ImageryLayer(new GridImageryProvider()));
```

## 瓦片丢弃策略

| 策略 | 行为 |
|---|---|
| `DiscardEmptyTileImagePolicy` | 丢弃零字节图像（Bing Maps 默认） |
| `DiscardMissingTileImagePolicy` | 将像素与已知的"缺失"瓦片对比 |
| `NeverTileDiscardPolicy` | 永不丢弃（当服务器始终返回有效瓦片时使用） |

```js
import { NeverTileDiscardPolicy, UrlTemplateImageryProvider } from "cesium";

const provider = new UrlTemplateImageryProvider({
  url: "https://my-server/{z}/{x}/{y}.png",
  tileDiscardPolicy: new NeverTileDiscardPolicy(),
});
```

## 错误处理

```js
const layer = ImageryLayer.fromProviderAsync(IonImageryProvider.fromAssetId(3812));
viewer.imageryLayers.add(layer);

// 提供者创建失败
layer.errorEvent.addEventListener((error) => {
  console.error("图层创建失败：", error);
});

// 提供者已解析 -- 监听逐瓦片错误
layer.readyEvent.addEventListener((provider) => {
  provider.errorEvent.addEventListener((tileError) => {
    console.warn("瓦片错误：", tileError.message);
  });
});
```

## 时间动态 WMTS

传入 `clock` 和 `times`（一个 `TimeIntervalCollection`）以实现随时间变化的图层。

```js
import { WebMapTileServiceImageryProvider, TimeIntervalCollection, JulianDate, Credit } from "cesium";

const times = TimeIntervalCollection.fromIso8601({
  iso8601: "2015-07-30/2017-06-16/P1D",
  dataCallback: (interval) => ({ Time: JulianDate.toIso8601(interval.start) }),
});
const weather = new WebMapTileServiceImageryProvider({
  url: "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/AMSR2_Snow_Water_Equivalent/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
  layer: "AMSR2_Snow_Water_Equivalent",  style: "default",
  tileMatrixSetID: "2km",  maximumLevel: 5,  format: "image/png",
  clock: viewer.clock,  times: times,
  credit: new Credit("NASA 全球影像浏览服务 for EOSDIS"),
});
viewer.imageryLayers.addImageryProvider(weather);
```

## 性能提示

1. **限制同时图层数量** -- 通常 2-3 层；每层都会成倍增加瓦片请求和 GPU 纹理内存。
2. **在不透明提供者上设置 `hasAlphaChannel: false`** 以减少内存和上传时间。
3. **使用 `minimumTerrainLevel` / `maximumTerrainLevel`** 跳过无关缩放级别的瓦片获取。
4. **优先使用 `ImageryLayer.fromProviderAsync`** 而非手动 await —— 避免提供者加载期间地球空白。
5. **在区域提供者上设置严格的 `rectangle` 边界** 以防止超出范围的瓦片请求。
6. **复用提供者实例** —— 使用 `destroy: false` 移除并重新添加，而非重新创建。
7. **当瓦片始终有效时使用 `NeverTileDiscardPolicy`** —— 像素比较会增加开销。
8. **仅对分类栅格数据选择 NEAREST 滤波**；LINEAR（默认）更快。

## 参见

- **cesiumjs-viewer-setup** -- Viewer 构造函数、Ion 令牌、`createWorldImageryAsync`
- **cesiumjs-terrain-environment** -- Globe、地形提供者、大气、光照
