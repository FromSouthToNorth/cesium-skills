---
name: cesiumjs-entities
description: "CesiumJS 实体与数据源 - Entity、EntityCollection、DataSource、GeoJsonDataSource、KmlDataSource、CzmlDataSource、Graphics 类型、Visualizer。在向地图添加点、标签、模型、多边形或折线，加载 GeoJSON/KML/CZML/GPX 数据，或使用高级 Entity API 时使用。"
---
# CesiumJS 实体与数据源

> **版本基线：** CesiumJS 1.139 -- ES 模块导入：`import { ... } from "cesium";`
> **所有权规则：** `*Graphics` 类归属此处；`*Geometry` 类归属 cesiumjs-primitives。属性（SampledProperty、CallbackProperty、MaterialProperty 子类型）归属 cesiumjs-time-properties。

## 架构

Entity API 是 CesiumJS 的高级数据驱动层。实体将位置、朝向和一个或多个 Graphics 类型组合为单一对象，由 EntityCollection 管理。DataSource 加载外部格式（GeoJSON、KML、CZML、GPX）并自动填充 EntityCollection。Visualizer 和 GeometryUpdater 每帧将实体描述转换为图元。

```
DataSource --> EntityCollection --> Entity
                                     |-- position / orientation
                                     |-- billboard / point / label / model / polygon / polyline / ...
                                     |-- properties (PropertyBag)
```

- `viewer.entities` 是默认 DataSource 的 EntityCollection 的快捷方式
- `viewer.dataSources` 保存所有已加载的 DataSource；每个都拥有自己的 `EntityCollection`

## 实体基础

### 点

```javascript
import { Viewer, Cartesian3, Color, HeightReference } from "cesium";

const viewer = new Viewer("cesiumContainer");
const entity = viewer.entities.add({
  id: "my-point",                 // 可选；省略时自动生成 GUID
  name: "示例点",
  position: Cartesian3.fromDegrees(-75.59777, 40.03883),
  point: {
    pixelSize: 10,
    color: Color.YELLOW,
    outlineColor: Color.BLACK,
    outlineWidth: 2,
    heightReference: HeightReference.CLAMP_TO_GROUND,
  },
});
viewer.zoomTo(entity);
```

### 带标注的布告板

```javascript
import { Viewer, Cartesian3, Cartesian2, Color, VerticalOrigin, HeightReference, LabelStyle } from "cesium";

const viewer = new Viewer("cesiumContainer");
viewer.entities.add({
  position: Cartesian3.fromDegrees(-122.4175, 37.7749),
  billboard: {
    image: "/assets/marker.png",
    scale: 0.5,
    verticalOrigin: VerticalOrigin.BOTTOM,
    heightReference: HeightReference.CLAMP_TO_GROUND,
  },
  label: {
    text: "旧金山",
    font: "14px sans-serif",
    fillColor: Color.WHITE,
    outlineColor: Color.BLACK,
    outlineWidth: 2,
    style: LabelStyle.FILL_AND_OUTLINE,
    pixelOffset: new Cartesian2(0, -36),
    heightReference: HeightReference.CLAMP_TO_GROUND,
  },
});
```

### 多边形（平面、拉伸、带洞）

```javascript
import { Viewer, Cartesian3, Color, PolygonHierarchy } from "cesium";

const viewer = new Viewer("cesiumContainer");
// 平面多边形
viewer.entities.add({
  polygon: {
    hierarchy: Cartesian3.fromDegreesArray([-115, 37, -115, 32, -107, 33, -102, 31, -102, 35]),
    material: Color.RED.withAlpha(0.5),
    outline: true,
    outlineColor: Color.BLACK,
  },
});
// 带洞的拉伸多边形
viewer.entities.add({
  polygon: {
    hierarchy: new PolygonHierarchy(
      Cartesian3.fromDegreesArray([-99, 30, -85, 30, -85, 40, -99, 40]),
      [new PolygonHierarchy(Cartesian3.fromDegreesArray([-97, 32, -87, 32, -87, 38, -97, 38]))]
    ),
    extrudedHeight: 300000,
    material: Color.BLUE.withAlpha(0.6),
    closeTop: true,
    closeBottom: true,
  },
});
```

### 折线

```javascript
import { Viewer, Cartesian3, Color, ArcType } from "cesium";

const viewer = new Viewer("cesiumContainer");
viewer.entities.add({
  polyline: {
    positions: Cartesian3.fromDegreesArray([-75, 35, -125, 35]),
    width: 5,
    material: Color.RED,
    arcType: ArcType.GEODESIC,
    clampToGround: true,
  },
});
```

### 3D 模型

```javascript
import { Viewer, Cartesian3, HeadingPitchRoll, Transforms, Math as CesiumMath, Color } from "cesium";

const viewer = new Viewer("cesiumContainer");
const position = Cartesian3.fromDegrees(-123.075, 44.045, 5000);
const hpr = new HeadingPitchRoll(CesiumMath.toRadians(135), 0, 0);

viewer.entities.add({
  position,
  orientation: Transforms.headingPitchRollQuaternion(position, hpr),
  model: {
    uri: "/assets/CesiumAir/Cesium_Air.glb",
    minimumPixelSize: 64,
    maximumScale: 20000,
    silhouetteColor: Color.RED,
    silhouetteSize: 2,
  },
});
```

### 盒子、圆柱体、椭球体、椭圆

```javascript
import { Viewer, Cartesian3, Color } from "cesium";
const viewer = new Viewer("cesiumContainer");

viewer.entities.add({  // 盒子
  position: Cartesian3.fromDegrees(-107, 40, 300000),
  box: { dimensions: new Cartesian3(400000, 300000, 500000), material: Color.BLUE.withAlpha(0.5) },
});
viewer.entities.add({  // 圆柱体（topRadius: 0 时为圆锥）
  position: Cartesian3.fromDegrees(-100, 40, 200000),
  cylinder: { length: 400000, topRadius: 200000, bottomRadius: 200000, material: Color.GREEN.withAlpha(0.5) },
});
viewer.entities.add({  // 椭球体（所有半径相等时为球体）
  position: Cartesian3.fromDegrees(-93, 40, 300000),
  ellipsoid: { radii: new Cartesian3(200000, 200000, 300000), material: Color.RED.withAlpha(0.5) },
});
viewer.entities.add({  // 椭圆（轴相等时为圆）
  position: Cartesian3.fromDegrees(-86, 40),
  ellipse: { semiMajorAxis: 300000, semiMinorAxis: 300000, material: Color.PURPLE.withAlpha(0.5) },
});
```

### 走廊、矩形、墙

```javascript
import { Viewer, Cartesian3, Color, Rectangle, CornerType } from "cesium";
const viewer = new Viewer("cesiumContainer");

viewer.entities.add({  // 走廊：带宽度的路径
  corridor: { positions: Cartesian3.fromDegreesArray([-80, 40, -90, 40, -90, 35]), width: 200000, material: Color.ORANGE.withAlpha(0.6), cornerType: CornerType.ROUNDED },
});
viewer.entities.add({  // 矩形：按地理范围
  rectangle: { coordinates: Rectangle.fromDegrees(-110, 20, -80, 25), material: Color.GREEN.withAlpha(0.5), extrudedHeight: 50000 },
});
viewer.entities.add({  // 墙：垂直幕帘
  wall: { positions: Cartesian3.fromDegreesArrayHeights([-115, 44, 200000, -90, 44, 200000]), minimumHeights: [100000, 100000], material: Color.CYAN.withAlpha(0.7) },
});
```

## EntityCollection 操作

```javascript
viewer.entities.getById("my-point");               // 按 ID 检索
viewer.entities.getOrCreateEntity("some-id");       // 获取或创建
viewer.entities.values;                             // Entity[]（只读）
viewer.entities.remove(entity);                     // 按引用移除
viewer.entities.removeById("my-point");             // 按 ID 移除
viewer.entities.removeAll();                        // 清除全部

// 批量更新 -- 暂停事件以便批量添加/移除
viewer.entities.suspendEvents();
for (let i = 0; i < 1000; i++) viewer.entities.add({ /* ... */ });
viewer.entities.resumeEvents();  // 触发一次 collectionChanged 事件

viewer.entities.collectionChanged.addEventListener((collection, added, removed, changed) => {
  console.log(`已添加：${added.length}，已移除：${removed.length}`);
});
```

## 数据源

### GeoJSON / TopoJSON

```javascript
import { Viewer, GeoJsonDataSource, Color } from "cesium";
const viewer = new Viewer("cesiumContainer");

// 从 URL 加载并设置样式选项
const ds = await GeoJsonDataSource.load("/data/counties.geojson", {
  stroke: Color.HOTPINK, fill: Color.PINK.withAlpha(0.5), strokeWidth: 3, clampToGround: true,
});
viewer.dataSources.add(ds);
viewer.zoomTo(ds);

// 加载后样式：遍历并自定义
for (const entity of ds.entities.values) {
  if (entity.polygon) entity.polygon.material = Color.fromRandom({ alpha: 0.8 });
}
```

`GeoJsonDataSource.load()` 也接受内联 GeoJSON 对象代替 URL。

### KML / KMZ

```javascript
import { KmlDataSource } from "cesium";
const ds = await KmlDataSource.load("/data/sample.kml", {
  camera: viewer.scene.camera, canvas: viewer.scene.canvas, clampToGround: true,
});
viewer.dataSources.add(ds);
viewer.flyTo(ds);
```

### CZML

```javascript
import { CzmlDataSource } from "cesium";
const ds = await CzmlDataSource.load("/data/vehicle.czml");
viewer.dataSources.add(ds);
await ds.process("/data/vehicle-update.czml");  // 追加而不清除
```

### GPX

```javascript
import { GpxDataSource } from "cesium";
const ds = await GpxDataSource.load("/data/trail.gpx");
viewer.dataSources.add(ds);
viewer.zoomTo(ds);
```

### CustomDataSource

```javascript
import { CustomDataSource, Cartesian3, Color } from "cesium";

const customDs = new CustomDataSource("sensors");
customDs.entities.add({
  position: Cartesian3.fromDegrees(-95, 40),
  point: { pixelSize: 8, color: Color.LIME },
});
viewer.dataSources.add(customDs);
customDs.show = false;  // 切换整个组的可见性
```

## 实体聚类

```javascript
import { GeoJsonDataSource, Color, VerticalOrigin, PinBuilder } from "cesium";
const ds = await GeoJsonDataSource.load("/data/facilities.geojson");
viewer.dataSources.add(ds);

ds.clustering.enabled = true;
ds.clustering.pixelRange = 40;
ds.clustering.minimumClusterSize = 3;

const pinBuilder = new PinBuilder();
ds.clustering.clusterEvent.addEventListener((entities, cluster) => {
  cluster.label.show = false;
  cluster.billboard.show = true;
  cluster.billboard.verticalOrigin = VerticalOrigin.BOTTOM;
  cluster.billboard.image = pinBuilder.fromText(`${entities.length}`, Color.VIOLET, 48).toDataURL();
});
```

## 父子可见性

设置 `parent.show = false` 会隐藏所有后代，而不改变它们各自的 `show` 标志。

```javascript
const parent = viewer.entities.add({ name: "组" });
viewer.entities.add({ parent, position: Cartesian3.fromDegrees(-90, 35), point: { pixelSize: 6, color: Color.RED } });
viewer.entities.add({ parent, position: Cartesian3.fromDegrees(-91, 36), point: { pixelSize: 6, color: Color.BLUE } });

parent.show = false;  // 两个子项都消失
parent.show = true;   // 两个子项都重新出现
```

## 实体描述和自定义属性

```javascript
// InfoBox HTML：用户点击实体时显示
viewer.entities.add({
  name: "阿尔法站",
  position: Cartesian3.fromDegrees(-75.17, 39.95),
  point: { pixelSize: 12, color: Color.CYAN },
  description: `<table class="cesium-infoBox-defaultTable"><tr><th>状态</th><td>活跃</td></tr></table>`,
  properties: { population: 500000, category: "metro" },
});
// 读取自定义属性
// entity.properties.population.getValue()  --> 500000
```

## 导出为 KML

```javascript
import { exportKml } from "cesium";

const result = await exportKml({ entities: viewer.entities, kmz: true });
// result.kmz 是 Blob；result.kml 在 kmz: false 时为字符串
const url = URL.createObjectURL(result.kmz);
```

## 所有 17 种 Graphics 类型

| Graphics | 关键属性 |
|----------|----------|
| `PointGraphics` | pixelSize、color、outlineColor、outlineWidth |
| `BillboardGraphics` | image、scale、rotation、sizeInMeters、heightReference |
| `LabelGraphics` | text、font、fillColor、style、showBackground |
| `ModelGraphics` | uri、scale、silhouetteColor、runAnimations、colorBlendMode |
| `PolygonGraphics` | hierarchy、height、extrudedHeight、material、perPositionHeight |
| `PolylineGraphics` | positions、width、material、clampToGround、arcType |
| `EllipseGraphics` | semiMajorAxis、semiMinorAxis、rotation、extrudedHeight |
| `RectangleGraphics` | coordinates（Rectangle）、height、extrudedHeight |
| `BoxGraphics` | dimensions（Cartesian3）、material、outline |
| `CylinderGraphics` | length、topRadius、bottomRadius |
| `EllipsoidGraphics` | radii（Cartesian3） |
| `CorridorGraphics` | positions、width、cornerType |
| `WallGraphics` | positions、minimumHeights、maximumHeights |
| `PolylineVolumeGraphics` | positions、shape（Cartesian2[]） |
| `PlaneGraphics` | plane（Plane）、dimensions（Cartesian2） |
| `PathGraphics` | resolution、leadTime、trailTime、width |
| `Cesium3DTilesetGraphics` | uri |

## 关键枚举

| 枚举 | 值 |
|---|---|
| `HeightReference` | NONE、CLAMP_TO_GROUND、RELATIVE_TO_GROUND |
| `HorizontalOrigin` | LEFT、CENTER、RIGHT |
| `VerticalOrigin` | TOP、CENTER、BOTTOM、BASELINE |
| `LabelStyle` | FILL、OUTLINE、FILL_AND_OUTLINE |
| `ColorBlendMode` | HIGHLIGHT、REPLACE、MIX |
| `ShadowMode` | DISABLED、ENABLED、CAST_ONLY、RECEIVE_ONLY |

## 性能提示

1. **使用 `suspendEvents()`/`resumeEvents()`** 批量添加实体时批量变更通知。
2. **静态数据优先使用常量属性** —— CesiumJS 会优化未变化的实体。
3. **使用 `DistanceDisplayCondition`** 隐藏超出有效范围的实体。
4. **对 1 万以上的静态形状切换为 Primitives**；Primitives 避免每个实体的开销。
5. **在包含许多点状实体的 DataSource 上启用聚类**。
6. **在布告板/标注上设置 `disableDepthTestDistance`** 以防止地形遮挡。
7. **尽量减少地面钳制多边形的轮廓** —— 需要额外的渲染通道。
8. **仅在必要时使用 `clampToGround`** —— 需要适应地形的细分。
9. **批量 CZML 更新使用 `process()` 追加**，而不是会替换全部的 `load()`。
10. **缓存 PinBuilder 画布** —— 复用结果以避免重新生成相同图像。

## 参见

- **cesiumjs-time-properties** -- 用于时间动态实体属性的 SampledProperty、CallbackProperty、MaterialProperty 类型
- **cesiumjs-primitives** -- 用于性能关键的静态几何体的低级 Primitive API（`*Geometry` 类）
- **cesiumjs-interaction** -- ScreenSpaceEventHandler、Scene.pick、实体选择和悬停模式
