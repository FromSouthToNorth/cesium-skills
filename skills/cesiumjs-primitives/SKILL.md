---
name: cesiumjs-primitives
description: "CesiumJS 图元与几何体 - Primitive、GeometryInstance、Appearance、Billboard/Label/PointPrimitive 集合、内置几何形状、地面图元、分类。在渲染性能关键的静态几何体、创建自定义形状、批处理绘制调用或使用低级布告板、标签和点集合时使用。"
---
# CesiumJS 图元与几何体

> **适用于：** CesiumJS v1.139+（ES 模块导入，使用 `??` 替代 `defaultValue`）

## 架构

Primitive API 是 Entity API 之下的低级渲染层，以便利性换取性能。

**核心公式：** `Primitive = GeometryInstance[] + Appearance`

- **GeometryInstance** — 将 Geometry 放置在世界空间中，附带每个实例的属性（颜色、显示）。
- **Geometry** — 描述形状的顶点数据（多边形、盒子、椭球体等）。
- **Appearance** — 对着色几何体进行着色的 GLSL 着色器 + 渲染状态 + 可选的 Material。

图元在**首次渲染后不可变** — 几何体不能更改，但每个实例的属性可通过 `primitive.getGeometryInstanceAttributes(id)` 更新。

## Primitive

```js
import {
  Viewer, Primitive, GeometryInstance, EllipseGeometry,
  EllipsoidSurfaceAppearance, Material, Cartesian3, Math as CesiumMath,
} from "cesium";

const viewer = new Viewer("cesiumContainer");
const scene = viewer.scene;

const primitive = scene.primitives.add(new Primitive({
  geometryInstances: new GeometryInstance({
    geometry: new EllipseGeometry({
      center: Cartesian3.fromDegrees(-100.0, 40.0),
      semiMinorAxis: 250000.0,
      semiMajorAxis: 400000.0,
      rotation: CesiumMath.PI_OVER_FOUR,
      vertexFormat: EllipsoidSurfaceAppearance.VERTEX_FORMAT, // 必须匹配外观
    }),
    id: "myEllipse", // 由 Scene.pick() 返回
  }),
  appearance: new EllipsoidSurfaceAppearance({ material: Material.fromType("Stripe") }),
}));
```

### 关键选项

| 选项 | 默认值 | 用途 |
|---|---|---|
| `geometryInstances` | -- | 单个实例或数组 |
| `appearance` | -- | 着色（Appearance 子类） |
| `show` | `true` | 切换可见性 |
| `modelMatrix` | `Matrix4.IDENTITY` | 变换所有实例 |
| `asynchronous` | `true` | 在 web worker 上构建几何体 |
| `releaseGeometryInstances` | `true` | GPU 上传后释放几何体 |
| `allowPicking` | `true` | `false` 节省 GPU 内存 |
| `shadows` | `ShadowMode.DISABLED` | 投射/接收阴影 |

## 批量处理多个实例

一个 Primitive 中的所有实例共享一个绘制调用。

```js
import {
  Primitive, GeometryInstance, RectangleGeometry, EllipseGeometry,
  PerInstanceColorAppearance, ColorGeometryInstanceAttribute,
  Cartesian3, Rectangle, Color,
} from "cesium";

scene.primitives.add(new Primitive({
  geometryInstances: [
    new GeometryInstance({
      geometry: new RectangleGeometry({
        rectangle: Rectangle.fromDegrees(-140, 30, -100, 40),
        vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
      }),
      id: "rect",
      attributes: { color: ColorGeometryInstanceAttribute.fromColor(Color.RED.withAlpha(0.5)) },
    }),
    new GeometryInstance({
      geometry: new EllipseGeometry({
        center: Cartesian3.fromDegrees(-80, 35),
        semiMinorAxis: 200000.0,
        semiMajorAxis: 300000.0,
        vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
      }),
      id: "ellipse",
      attributes: { color: ColorGeometryInstanceAttribute.fromColor(Color.BLUE.withAlpha(0.5)) },
    }),
  ],
  appearance: new PerInstanceColorAppearance(),
}));
```

## 更新每个实例的属性

```js
import { ColorGeometryInstanceAttribute, ShowGeometryInstanceAttribute } from "cesium";

// 等待异步几何体编译
const removeListener = scene.postRender.addEventListener(() => {
  if (!primitive.ready) return;
  const attrs = primitive.getGeometryInstanceAttributes("rect");
  attrs.color = ColorGeometryInstanceAttribute.toValue(Color.YELLOW);
  attrs.show = ShowGeometryInstanceAttribute.toValue(true);
  removeListener();
});
```

## PrimitiveCollection

可嵌套容器 —— `scene.primitives` 本身就是一个 PrimitiveCollection。

```js
import { PrimitiveCollection, BillboardCollection, LabelCollection } from "cesium";

const group = new PrimitiveCollection();
group.add(new BillboardCollection());
group.add(new LabelCollection());
scene.primitives.add(group);
group.show = false; // 切换所有子项
```

## 内置几何体类型（31 种）

所有几何体都接受形状参数和与 Appearance 匹配的 `vertexFormat`。大多数有配对的 `*OutlineGeometry`。轮廓需要单独的 Primitive。

### 填充 + 轮廓模式

```js
import {
  Primitive, GeometryInstance, PolygonGeometry, PolygonOutlineGeometry,
  PolygonHierarchy, PerInstanceColorAppearance, ColorGeometryInstanceAttribute,
  Cartesian3, Color,
} from "cesium";

const positions = Cartesian3.fromDegreesArray([-115, 37, -115, 32, -107, 33, -102, 35]);

// 填充图元
scene.primitives.add(new Primitive({
  geometryInstances: new GeometryInstance({
    geometry: new PolygonGeometry({
      polygonHierarchy: new PolygonHierarchy(positions),
      vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    attributes: { color: ColorGeometryInstanceAttribute.fromColor(Color.CYAN.withAlpha(0.5)) },
  }),
  appearance: new PerInstanceColorAppearance(),
}));

// 轮廓图元（单独的绘制调用）
scene.primitives.add(new Primitive({
  geometryInstances: new GeometryInstance({
    geometry: new PolygonOutlineGeometry({ polygonHierarchy: new PolygonHierarchy(positions) }),
    attributes: { color: ColorGeometryInstanceAttribute.fromColor(Color.WHITE) },
  }),
  appearance: new PerInstanceColorAppearance({ flat: true }),
}));
```

### 几何体目录

每个 `XxxGeometry` 都有对应的 `XxxOutlineGeometry`（除非另有说明）。

**表面**（与 GroundPrimitive 配合使用）：`CircleGeometry`、`CorridorGeometry`、`EllipseGeometry`、`PolygonGeometry`、`RectangleGeometry`。

**体积**（需要 `modelMatrix`）：`BoxGeometry`（`fromDimensions()`）、`CylinderGeometry`（当 topRadius != bottomRadius 时为圆锥）、`EllipsoidGeometry`、`SphereGeometry`、`FrustumGeometry`、`PlaneGeometry`。

**路径**：`CorridorGeometry`（缓冲路径）、`PolylineVolumeGeometry`（沿路径拉伸的 2D 形状）、`WallGeometry`（垂直幕帘）。

**多边形**：`PolygonGeometry`（通过 `PolygonHierarchy` 支持洞）、`CoplanarPolygonGeometry`（非地球表面）。

**线**（无轮廓）：`PolylineGeometry`（像素宽度）、`SimplePolylineGeometry`（1px）、`GroundPolylineGeometry`（仅 GroundPolylinePrimitive）。

### 定位非表面几何体

盒子、椭球体、圆柱体和视锥体需要在 GeometryInstance 上设置 `modelMatrix`。

```js
import { GeometryInstance, BoxGeometry, PerInstanceColorAppearance,
  ColorGeometryInstanceAttribute, Cartesian3, Matrix4, Transforms, Color } from "cesium";

const modelMatrix = Matrix4.multiplyByTranslation(
  Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(-105, 40)),
  new Cartesian3(0, 0, 250000), new Matrix4(),
);
new GeometryInstance({
  geometry: BoxGeometry.fromDimensions({
    dimensions: new Cartesian3(400000, 300000, 500000),
    vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
  }),
  modelMatrix,
  id: "floatingBox",
  attributes: { color: ColorGeometryInstanceAttribute.fromColor(Color.CORAL) },
});
```

## Appearances（7 种类型）

| Appearance | 用例 | 材质？ |
|---|---|---|
| `PerInstanceColorAppearance` | 每个实例的颜色 | 否 |
| `MaterialAppearance` | 任意几何体 + Material | 是 |
| `EllipsoidSurfaceAppearance` | 表面几何体 + Material（较少属性） | 是 |
| `PolylineColorAppearance` | 每个实例颜色的折线 | 否 |
| `PolylineMaterialAppearance` | 带 Material 的折线 | 是 |
| `DebugAppearance` | 可视化顶点属性 | 否 |
| `Appearance` | 基类 / 自定义着色器 | 可选 |

几何体的 `vertexFormat` **必须**匹配外观。使用外观的静态 `VERTEX_FORMAT`。对于无光照的 `PerInstanceColorAppearance`，使用 `FLAT_VERTEX_FORMAT`。

### MaterialAppearance 示例

```js
import { Primitive, GeometryInstance, WallGeometry, MaterialAppearance, Material, Cartesian3 } from "cesium";

scene.primitives.add(new Primitive({
  geometryInstances: new GeometryInstance({
    geometry: new WallGeometry({
      positions: Cartesian3.fromDegreesArrayHeights([-115, 44, 200000, -110, 44, 200000, -105, 44, 200000]),
      vertexFormat: MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
    }),
  }),
  appearance: new MaterialAppearance({
    material: Material.fromType("Checkerboard"),
    faceForward: true, // 双面着色
  }),
}));
```

## GroundPrimitive

将几何体绘制到地形/3D Tiles 上。支持：`CircleGeometry`、`CorridorGeometry`、`EllipseGeometry`、`PolygonGeometry`、`RectangleGeometry`。

```js
import { GroundPrimitive, GeometryInstance, PolygonGeometry, PolygonHierarchy,
  ColorGeometryInstanceAttribute, ClassificationType, Cartesian3, Color } from "cesium";

scene.groundPrimitives.add(new GroundPrimitive({
  geometryInstances: new GeometryInstance({
    geometry: new PolygonGeometry({
      polygonHierarchy: new PolygonHierarchy(
        Cartesian3.fromDegreesArray([-112, 36, -112, 36.1, -111.9, 36.1]),
      ),
    }),
    id: "groundPolygon",
    attributes: { color: ColorGeometryInstanceAttribute.fromColor(Color.RED.withAlpha(0.5)) },
  }),
  classificationType: ClassificationType.TERRAIN, // TERRAIN、CESIUM_3D_TILE 或 BOTH
}));
```

## GroundPolylinePrimitive

```js
import { GroundPolylinePrimitive, GeometryInstance, GroundPolylineGeometry,
  PolylineColorAppearance, ColorGeometryInstanceAttribute, Cartesian3, Color } from "cesium";

scene.groundPrimitives.add(new GroundPolylinePrimitive({
  geometryInstances: new GeometryInstance({
    geometry: new GroundPolylineGeometry({
      positions: Cartesian3.fromDegreesArray([-112.13, 36.05, -112.09, 36.10, -112.13, 36.17]),
      width: 4.0,
      loop: true,
    }),
    attributes: { color: ColorGeometryInstanceAttribute.fromColor(Color.LIME.withAlpha(0.7)) },
  }),
  appearance: new PolylineColorAppearance(),
}));
```

## ClassificationPrimitive

高亮对地形或 3D Tiles 进行分类的体积。有效：`BoxGeometry`、`CylinderGeometry`、`EllipsoidGeometry`、`PolylineVolumeGeometry`、`SphereGeometry`，以及拉伸的表面几何体。

```js
import { ClassificationPrimitive, GeometryInstance, BoxGeometry, PerInstanceColorAppearance,
  ColorGeometryInstanceAttribute, ClassificationType, Cartesian3, Transforms, Color } from "cesium";

scene.primitives.add(new ClassificationPrimitive({
  geometryInstances: new GeometryInstance({
    geometry: BoxGeometry.fromDimensions({
      dimensions: new Cartesian3(100, 100, 50),
      vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    modelMatrix: Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(-75.59, 40.04, 25)),
    attributes: { color: ColorGeometryInstanceAttribute.fromColor(Color.YELLOW.withAlpha(0.5)) },
  }),
  classificationType: ClassificationType.BOTH,
}));
```

## BillboardCollection

GPU 高效的视口对齐图像 —— 在规模上比实体性能高得多。

```js
import { BillboardCollection, Cartesian3, Color, NearFarScalar,
  HeightReference, HorizontalOrigin, VerticalOrigin } from "cesium";

const billboards = scene.primitives.add(new BillboardCollection({ scene }));
const b = billboards.add({
  position: Cartesian3.fromDegrees(-75.59, 40.04),
  image: "marker.png",
  horizontalOrigin: HorizontalOrigin.CENTER,
  verticalOrigin: VerticalOrigin.BOTTOM,
  heightReference: HeightReference.CLAMP_TO_GROUND,
  scaleByDistance: new NearFarScalar(1000, 1.5, 1e7, 0.3),
});
b.position = Cartesian3.fromDegrees(-75.60, 40.05); // 动态更新
billboards.remove(b);
```

## LabelCollection

```js
import { LabelCollection, Cartesian3, Cartesian2, Color, LabelStyle, VerticalOrigin } from "cesium";

const labels = scene.primitives.add(new LabelCollection({ scene }));
labels.add({
  position: Cartesian3.fromDegrees(-75.59, 40.04, 300),
  text: "费城",
  font: "16px sans-serif",
  fillColor: Color.WHITE,
  outlineColor: Color.BLACK,
  outlineWidth: 2,
  style: LabelStyle.FILL_AND_OUTLINE,
  verticalOrigin: VerticalOrigin.BOTTOM,
  pixelOffset: new Cartesian2(0, -10),
});
```

## PointPrimitiveCollection

```js
import { PointPrimitiveCollection, Cartesian3, Color, NearFarScalar } from "cesium";

const points = scene.primitives.add(new PointPrimitiveCollection());
points.add({
  position: Cartesian3.fromDegrees(-75.59, 40.04),
  pixelSize: 10,
  color: Color.YELLOW,
  outlineColor: Color.BLACK,
  outlineWidth: 2,
  scaleByDistance: new NearFarScalar(1000, 1.0, 1e7, 0.1),
});
```

## CloudCollection 和 PolylineCollection

```js
import { CloudCollection, PolylineCollection, Cartesian3, Cartesian2, Color, Material } from "cesium";

// 程序式积云
const clouds = scene.primitives.add(new CloudCollection());
clouds.add({
  position: Cartesian3.fromDegrees(-75.59, 40.04, 1500),
  scale: new Cartesian2(40, 12),
  maximumSize: new Cartesian3(40, 12, 15),
  slice: 0.36,
});

// 低级折线集合
const polylines = scene.primitives.add(new PolylineCollection());
polylines.add({
  positions: Cartesian3.fromDegreesArray([-75, 40, -70, 42, -65, 38]),
  width: 3.0,
  material: Material.fromType("Color", { color: Color.AQUA }),
});
```

## 通过 Primitive 使用折线

```js
import { Primitive, GeometryInstance, PolylineGeometry, PolylineColorAppearance,
  ColorGeometryInstanceAttribute, Cartesian3, Color, ArcType } from "cesium";

scene.primitives.add(new Primitive({
  geometryInstances: new GeometryInstance({
    geometry: new PolylineGeometry({
      positions: Cartesian3.fromDegreesArray([0, 0, 5, 0]),
      width: 10.0,
      vertexFormat: PolylineColorAppearance.VERTEX_FORMAT,
      arcType: ArcType.GEODESIC, // GEODESIC、RHUMB 或 NONE
    }),
    attributes: { color: ColorGeometryInstanceAttribute.fromColor(Color.WHITE) },
  }),
  appearance: new PolylineColorAppearance({ translucent: false }),
}));
```

## 枚举

| 枚举 | 值 | 使用者 |
|---|---|---|
| `ArcType` | `GEODESIC`、`RHUMB`、`NONE` | PolylineGeometry、PolygonGeometry |
| `CornerType` | `ROUNDED`、`MITERED`、`BEVELED` | CorridorGeometry、PolylineVolumeGeometry |
| `ClassificationType` | `TERRAIN`、`CESIUM_3D_TILE`、`BOTH` | GroundPrimitive、ClassificationPrimitive |
| `PrimitiveType` | `POINTS`、`LINES`、`TRIANGLES` 等 | 低级 Geometry |
| `CloudType` | `CUMULUS` | CloudCollection |

## 性能提示

1. **积极批处理。** 将数千个 GeometryInstance 组合到一个 Primitive 中，以实现单一绘制调用。
2. **使用 `PerInstanceColorAppearance`** 当每个实例只需要不同颜色时。
3. **当不需要光照时在 PerInstanceColorAppearance 上设置 `flat: true`**；使用 `FLAT_VERTEX_FORMAT`。
4. **在永远不会被拾取的图元上设置 `allowPicking: false`** 以节省 GPU 内存。
5. **保持 `asynchronous: true`**（默认）。在访问实例属性前检查 `primitive.ready`。
6. **对于布告板、标签和点图元，优先使用更少但更大的集合。** 按更新频率分组。
7. **当所有项都不透明时，在 BillboardCollection/PointPrimitiveCollection 上使用 `BlendOption.OPAQUE`**（最高可提升 2 倍性能）。
8. **使用 GroundPrimitive 进行地形绘制**，而不是实体的 `heightReference`。
9. **将填充和轮廓分离到两个图元中** —— 它们无法共享同一个绘制调用。
10. **精确匹配 `vertexFormat` 到外观** 以跳过未使用的顶点属性计算。
11. **表面几何体优先使用 `EllipsoidSurfaceAppearance` 而非 `MaterialAppearance`** —— 顶点属性更少。

## 参见

- **cesiumjs-entities** -- 高级 Entity API，使用时间动态属性包装图元。
- **cesiumjs-materials-shaders** -- Appearance 和后期处理使用的 Material（Fabric）系统。
- **cesiumjs-spatial-math** -- Cartesian3、Matrix4、Transforms、用于定位几何体的坐标转换。
