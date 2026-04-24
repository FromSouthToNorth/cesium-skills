---
name: cesiumjs-spatial-math
description: "CesiumJS 空间数学 - Cartesian3、Cartographic、Matrix4、Quaternion、Transforms、Ellipsoid、BoundingSphere、投影、坐标转换。在坐标系间转换、计算椭球体上的位置、执行空间相交测试、构建模型矩阵或处理地理投影时使用。"
---

# CesiumJS 空间数学与变换

版本基线：CesiumJS v1.139（2026-03-05）

每个 CesiumJS 应用的数学基础：坐标类型、单位转换、椭球几何、参考系变换、包围体、相交测试和投影。

## 核心概念

CesiumJS 使用右手坐标系、地心地固（ECEF）坐标系：

- **Cartesian3** —— ECEF（x, y, z），单位为米。所有 3D 位置的内部表示形式。
- **Cartographic** ——（经度、纬度、高度）。角度为**弧度**，高度为椭球体上方米数。

核心数学中所有角度值均为弧度。使用 `Math.toRadians()` / `Math.toDegrees()`。数学类型使用**带 result 参数的静态方法**模式：传入 `result` 参数以复用分配。

## Cartesian3 —— 位置与向量

```js
import { Cartesian3, Math as CesiumMath } from "cesium";

// 从经纬度度数创建 —— 最常用的入口点
const pos = Cartesian3.fromDegrees(-105.0, 40.0);
const elevated = Cartesian3.fromDegrees(-105.0, 40.0, 1500.0); // 带高度

// 批量创建：[lon, lat, lon, lat, ...]
const ring = Cartesian3.fromDegreesArray([-105, 40, -100, 40, -100, 35]);

// 带高度：[lon, lat, h, lon, lat, h, ...]
const wall = Cartesian3.fromDegreesArrayHeights([-105, 40, 500, -100, 40, 1000]);

// 从原始 ECEF 或从弧度创建
const raw = new Cartesian3(-1275096.0, -4797180.0, 4075270.0);
const fromRad = Cartesian3.fromRadians(-1.8326, 0.6981, 1500.0);

// 常量
Cartesian3.ZERO;   // (0,0,0)
Cartesian3.UNIT_X; // (1,0,0)
Cartesian3.UNIT_Y; // (0,1,0)
Cartesian3.UNIT_Z; // (0,0,1)
```

### 向量运算

```js
const a = new Cartesian3(1.0, 2.0, 3.0);
const b = new Cartesian3(4.0, 5.0, 6.0);
const r = new Cartesian3(); // 可复用的临时变量

Cartesian3.add(a, b, r);                // a + b
Cartesian3.subtract(a, b, r);           // a - b
Cartesian3.multiplyByScalar(a, 2.0, r); // a * 2
Cartesian3.negate(a, r);                // -a
Cartesian3.cross(a, b, r);              // 叉积
Cartesian3.normalize(a, r);             // 单位向量
Cartesian3.lerp(a, b, 0.5, r);         // 线性插值
Cartesian3.midpoint(a, b, r);           // 中点

const dot = Cartesian3.dot(a, b);       // 点积
const len = Cartesian3.magnitude(a);    // ||a||
const dist = Cartesian3.distance(a, b); // 欧几里得距离
const distSq = Cartesian3.distanceSquared(a, b); // 比较时更快
const angle = Cartesian3.angleBetween(a, b);     // 弧度
```

## Cartographic —— 地理坐标

```js
import { Cartographic, Cartesian3, Math as CesiumMath } from "cesium";

const carto = Cartographic.fromDegrees(-105.0, 40.0, 1500.0);
const cartoRad = Cartographic.fromRadians(-1.8326, 0.6981, 1500.0);

// Cartesian3 <-> Cartographic
const position = Cartesian3.fromDegrees(-105.0, 40.0, 1500.0);
const geo = Cartographic.fromCartesian(position);
const lonDeg = CesiumMath.toDegrees(geo.longitude); // -105.0
const latDeg = CesiumMath.toDegrees(geo.latitude);  // 40.0
const backToCart = Cartographic.toCartesian(geo);
```

## CesiumMath 工具函数

```js
import { Math as CesiumMath } from "cesium";

// 度/弧度转换
const rad = CesiumMath.toRadians(90.0);    // PI/2
const deg = CesiumMath.toDegrees(Math.PI); // 180

// 常量：PI、TWO_PI、PI_OVER_TWO、PI_OVER_FOUR、RADIANS_PER_DEGREE
// EPSILON1 (0.1) 到 EPSILON21 (1e-21)

const clamped = CesiumMath.clamp(value, 0.0, 1.0);
const interp = CesiumMath.lerp(0.0, 100.0, 0.5);          // 50
const norm = CesiumMath.negativePiToPi(angle);              // [-PI, PI]
const pos = CesiumMath.zeroToTwoPi(angle);                  // [0, 2*PI]
const safeLon = CesiumMath.convertLongitudeRange(angle);    // [-PI, PI)
const eq = CesiumMath.equalsEpsilon(a, b, CesiumMath.EPSILON7); // 浮点数比较
```

## Ellipsoid

```js
import { Ellipsoid, Cartesian3, Cartographic } from "cesium";

// 内置椭球体
Ellipsoid.WGS84;       // 地球（默认）
Ellipsoid.UNIT_SPHERE;  // 半径 1
Ellipsoid.MOON;         // 月球球体
Ellipsoid.MARS;         // 火星（v1.133+）

// 更改默认值（影响所有地方的 Ellipsoid.default）
Ellipsoid.default = Ellipsoid.MOON;

// 在特定椭球体上的转换
const cart = Ellipsoid.WGS84.cartographicToCartesian(
  Cartographic.fromDegrees(-75.0, 40.0, 100.0),
);
const carto = Ellipsoid.WGS84.cartesianToCartographic(cart);

// 位置处的表面法线
const normal = Ellipsoid.WGS84.geodeticSurfaceNormal(cart, new Cartesian3());

// 将点投影到椭球体表面
const onSurface = Ellipsoid.WGS84.scaleToGeodeticSurface(cart, new Cartesian3());
```

## Transforms —— 参考系

`Transforms` 构建将局部坐标系关联到 ECEF 的 4x4 矩阵。最常用的函数是 `eastNorthUpToFixedFrame`。

### 东-北-上（ENU）

ENU：X = 东，Y = 北，Z = 上。将模型放置在地球上的标准坐标系。

```js
import { Cartesian3, Transforms, Matrix4 } from "cesium";

const origin = Cartesian3.fromDegrees(-105.0, 40.0);
const enuMatrix = Transforms.eastNorthUpToFixedFrame(origin);
// 列：[east, north, up, origin] 在 ECEF 中
```

### 航向-俯仰-翻滚模型矩阵

定位和定向 3D 模型的标准方式。

```js
import { Cartesian3, Transforms, HeadingPitchRoll, Math as CesiumMath } from "cesium";

const position = Cartesian3.fromDegrees(-105.0, 40.0, 0.0);
const hpr = new HeadingPitchRoll(
  CesiumMath.toRadians(90.0), // 航向：东偏 90 度
  0.0,                         // 俯仰：水平
  0.0,                         // 翻滚：无
);
const modelMatrix = Transforms.headingPitchRollToFixedFrame(position, hpr);

// 仅方向四元数（例如用于 Entity.orientation）
const orientation = Transforms.headingPitchRollQuaternion(position, hpr);
```

### HeadingPitchRoll

航向 = 绕 -Z 轴旋转（罗盘方位，顺时针）。俯仰 = 绕 -Y 轴。翻滚 = 绕 +X 轴。弧度。

```js
import { HeadingPitchRoll, Math as CesiumMath } from "cesium";
const hpr = new HeadingPitchRoll(CesiumMath.toRadians(45.0), CesiumMath.toRadians(-10.0), 0.0);
const hprDeg = HeadingPitchRoll.fromDegrees(45.0, -10.0, 0.0); // 便捷方法
```

### 其他局部坐标系

```js
import { Transforms, Cartesian3 } from "cesium";
const origin = Cartesian3.fromDegrees(-105.0, 40.0);

Transforms.northEastDownToFixedFrame(origin);  // NED（航空）
Transforms.northUpEastToFixedFrame(origin);     // NUE

// 从 east|north|up|west|south|down 的任意组合创建自定义坐标系
const customFn = Transforms.localFrameToFixedFrameGenerator("north", "west");
const matrix = customFn(origin);

// 从现有模型矩阵恢复航向/俯仰/翻滚
const hpr = Transforms.fixedFrameToHeadingPitchRoll(modelMatrix);
```

## Matrix4 —— 4x4 变换

列主序存储（WebGL 约定）。构造器为可读性采用行主序。

```js
import { Matrix4, Matrix3, Cartesian3, Quaternion } from "cesium";

// 工厂方法
Matrix4.fromTranslation(new Cartesian3(10, 20, 30));
Matrix4.fromRotationTranslation(Matrix3.fromRotationZ(Math.PI / 4), new Cartesian3(100, 0, 0));
Matrix4.fromTranslationQuaternionRotationScale(
  new Cartesian3(0, 0, 0), Quaternion.IDENTITY, new Cartesian3(2, 2, 2),
);
Matrix4.fromUniformScale(5.0);

// 组合、变换、求逆
const combined = Matrix4.multiply(matA, matB, new Matrix4());
const worldPt = Matrix4.multiplyByPoint(enuMatrix, new Cartesian3(100, 0, 0), new Cartesian3());
const inv = Matrix4.inverseTransformation(enuMatrix, new Matrix4()); // 仅刚体

// 分解
Matrix4.getTranslation(enuMatrix, new Cartesian3());
Matrix4.getMatrix3(enuMatrix, new Matrix3());
Matrix4.getScale(enuMatrix, new Cartesian3());
```

## Quaternion —— 旋转

```js
import { Quaternion, Cartesian3, HeadingPitchRoll, Math as CesiumMath, Matrix3 } from "cesium";

Quaternion.IDENTITY; // (0, 0, 0, 1)
const q1 = Quaternion.fromAxisAngle(Cartesian3.UNIT_Z, CesiumMath.toRadians(45.0));
const q2 = Quaternion.fromHeadingPitchRoll(new HeadingPitchRoll(CesiumMath.toRadians(90), 0, 0));
const q3 = Quaternion.fromRotationMatrix(Matrix3.fromRotationZ(Math.PI / 2));
const mid = Quaternion.slerp(q1, q2, 0.5, new Quaternion());       // 插值
const composed = Quaternion.multiply(q1, q2, new Quaternion());     // 组合
```

## 测地线距离

```js
import { Cartographic, EllipsoidGeodesic, Cartesian3 } from "cesium";

// 表面距离（通过 Vincenty 算法的大圆距离）
const geodesic = new EllipsoidGeodesic(
  Cartographic.fromDegrees(-73.985, 40.758),  // 纽约
  Cartographic.fromDegrees(-0.1276, 51.5074), // 伦敦
);
const surfaceDist = geodesic.surfaceDistance;              // ~5,570 km
const midCarto = geodesic.interpolateUsingFraction(0.5);  // 表面中点

// 弦（直线）距离
const chord = Cartesian3.distance(Cartesian3.fromDegrees(-105, 40), Cartesian3.fromDegrees(-104, 40));
```

## BoundingSphere

```js
import { BoundingSphere, Cartesian3 } from "cesium";

const sphere = BoundingSphere.fromPoints(
  Cartesian3.fromDegreesArray([-105, 40, -100, 40, -100, 35]),
); // sphere.center（Cartesian3），sphere.radius（数字）

const inside = Cartesian3.distance(sphere.center, Cartesian3.fromDegrees(-102, 37.5)) <= sphere.radius;
```

## 射线与相交测试

```js
import { Ray, IntersectionTests, Plane, Cartesian3, Ellipsoid } from "cesium";

const ray = new Ray(new Cartesian3(0, 0, 6378137), new Cartesian3(0, 0, -1)); // 自动归一化
const ptOnRay = Ray.getPoint(ray, 1000.0, new Cartesian3());

// 射线-平面：返回 Cartesian3 或 undefined
const plane = Plane.fromPointNormal(Cartesian3.ZERO, Cartesian3.UNIT_Z);
const hit = IntersectionTests.rayPlane(ray, plane);

// 射线-椭球体：返回 Interval {start, stop} 或 undefined
const camRay = new Ray(new Cartesian3(0, 0, 20000000), new Cartesian3(0, 0, -1));
const interval = IntersectionTests.rayEllipsoid(camRay, Ellipsoid.WGS84);
if (interval) {
  const nearPt = Ray.getPoint(camRay, interval.start, new Cartesian3());
}

// 射线-三角形：返回参数 t 或 undefined
const t = IntersectionTests.rayTriangleParametric(ray, p0, p1, p2, true);
```

## SceneTransforms —— 世界到屏幕

```js
import { SceneTransforms, Cartesian3 } from "cesium";
// 世界 -> 像素坐标（Cartesian2，若在屏幕外则为 undefined）
const winPos = SceneTransforms.worldToWindowCoordinates(viewer.scene, Cartesian3.fromDegrees(-105, 40));
// 高 DPI 感知变体
const bufPos = SceneTransforms.worldToDrawingBufferCoordinates(viewer.scene, worldPos);
```

## 地理投影

```js
import { GeographicProjection, WebMercatorProjection, Cartographic, Ellipsoid } from "cesium";
const carto = Cartographic.fromDegrees(-105.0, 40.0);

// 等距圆柱投影：Cartographic 和 Cartesian3 之间的投影/反投影
const geoProj = new GeographicProjection(Ellipsoid.WGS84);
const xy = geoProj.project(carto);           // Cartesian3
const back = geoProj.unproject(xy);          // Cartographic

// Web Mercator（EPSG:3857）
const merc = new WebMercatorProjection(Ellipsoid.WGS84);
const mercXY = merc.project(carto);
```

## 常见模式

### 在局部 ENU 中偏移位置

```js
import { Cartesian3, Transforms, Matrix4 } from "cesium";

const origin = Cartesian3.fromDegrees(-105.0, 40.0, 0.0);
const enu = Transforms.eastNorthUpToFixedFrame(origin);
// 在局部坐标系中向东移动 500m，向北 200m，向上 100m
const worldPt = Matrix4.multiplyByPoint(enu, new Cartesian3(500, 200, 100), new Cartesian3());
```

### 带容差的位置比较

```js
import { Cartesian3, Math as CesiumMath } from "cesium";
const a = Cartesian3.fromDegrees(-105.0, 40.0);
const b = Cartesian3.fromDegrees(-105.0001, 40.0001);
Cartesian3.equalsEpsilon(a, b, CesiumMath.EPSILON7); // 优先于 ===
if (Cartesian3.distance(a, b) < 10.0) { /* 10 米以内 */ }
```

## 性能提示

1. **复用临时变量。** 在循环外预分配 `result` 对象以避免 GC 暂停。
2. **比较时使用 `distanceSquared`** 代替 `distance` —— 避免 `Math.sqrt`。
3. **优先使用 `Cartesian3.fromDegrees`** 而非手动创建 Cartographic 再转换。
4. **缓存模型矩阵。** 如果位置是静态的，只调用一次 `Transforms.eastNorthUpToFixedFrame`。
5. **刚体变换使用 `Matrix4.inverseTransformation`** —— 比 `inverse` 更快更稳定。
6. **批量创建位置**，使用 `fromDegreesArray` / `fromDegreesArrayHeights` 而非循环调用 `fromDegrees`。
7. **对 `Cartesian3.normalize` 进行防护** —— 零长度向量会抛出异常。先检查模长。
8. **浮点比较使用 `equalsEpsilon`。** `CesiumMath.EPSILON7` 是一个不错的默认容差。
9. **在渲染循环外预计算 HPR。** 仅当朝向变化时转换为四元数/矩阵。
10. **选择正确的距离。** `Cartesian3.distance` = 穿过地球的弦。`EllipsoidGeodesic.surfaceDistance` = 大圆距离。

## 参见

- **cesiumjs-camera** —— 使用这些坐标类型的相机定位和飞行动画
- **cesiumjs-primitives** —— 使用来自 Transforms 的模型矩阵的几何体和 Primitive API
- **cesiumjs-terrain-environment** —— 地形高度查询和地球表面交互
