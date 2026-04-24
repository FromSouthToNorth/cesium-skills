---
name: cesiumjs-time-properties
description: "CesiumJS 时间、属性与动画 - Clock、JulianDate、TimeInterval、Property、SampledProperty、CallbackProperty、插值、样条、CZML 时序数据。在使实体属性随时间动态变化、配置仿真时钟、随时间插值位置或使用采样与回调属性时使用。"
---

# CesiumJS 时间、属性与动画

版本基线：CesiumJS v1.139.1

涵盖时序数据绑定层：Clock/JulianDate 时间系统、使实体属性随时间变化的 Property 层次结构、插值算法、样条和材质属性。属性（Property）在这里定义（而非与 Entities 一起），因为 SampledProperty 和 CallbackProperty 在没有 Clock/JulianDate 的情况下毫无意义。Material 类（Fabric）属于 cesiumjs-materials-shaders。

## JulianDate —— 时间原语

分别存储整天数和秒的小数部分以保证精度。内部始终使用 TAI。

```js
import { JulianDate } from "cesium";

// 创建：fromIso8601（最常用）、fromDate、now
const date = JulianDate.fromIso8601("2025-06-15T12:00:00Z");
const jd = JulianDate.fromDate(new Date("2025-06-15T12:00:00Z"));
const now = JulianDate.now();

// 转换：toIso8601、toDate、toGregorianDate
const iso = JulianDate.toIso8601(date); // "2025-06-15T12:00:00Z"
const greg = JulianDate.toGregorianDate(date); // {year, month, day, hour, ...}

// 算术运算 —— 都需要 result 参数以避免分配
const r = new JulianDate();
JulianDate.addSeconds(date, 3600, r); // 也包括：addMinutes、addHours、addDays

// 差值与比较
const stop = JulianDate.addHours(date, 24, new JulianDate());
JulianDate.secondsDifference(stop, date); // 86400
JulianDate.lessThan(date, stop);          // true
JulianDate.compare(date, stop);           // 负数（date < stop）
```

## Clock —— 仿真时间控制器

Viewer 会自动创建一个 Clock。配置它以控制播放速度和边界。

```js
import { Viewer, JulianDate, ClockRange, ClockStep } from "cesium";

const viewer = new Viewer("cesiumContainer");
const start = JulianDate.fromIso8601("2025-06-15T00:00:00Z");
const stop = JulianDate.addHours(start, 24, new JulianDate());
viewer.clock.startTime = start.clone();
viewer.clock.stopTime = stop.clone();
viewer.clock.currentTime = start.clone();
viewer.clock.clockRange = ClockRange.LOOP_STOP; // 结束时循环
viewer.clock.multiplier = 60;                   // 60 倍实时
viewer.clock.shouldAnimate = true;
viewer.timeline.zoomTo(start, stop);

viewer.clock.onTick.addEventListener((clock) => { // 每帧回调
  console.log(JulianDate.toIso8601(clock.currentTime));
});
```

| ClockRange | 行为 |
|---|---|
| `UNBOUNDED` | 在两侧无限前进 |
| `CLAMPED` | 在开始/结束时间停止 |
| `LOOP_STOP` | 从结束时间回到开始时间 |

| ClockStep | 行为 |
|---|---|
| `TICK_DEPENDENT` | 每次滴答前进 `multiplier` 秒（帧率相关） |
| `SYSTEM_CLOCK_MULTIPLIER` | 经过的墙上时间 x `multiplier`（默认） |
| `SYSTEM_CLOCK` | 实时；忽略 multiplier |

## TimeInterval 与 TimeIntervalCollection

```js
import { TimeInterval, TimeIntervalCollection, JulianDate } from "cesium";

const interval = TimeInterval.fromIso8601({
  iso8601: "2025-06-15T00:00:00Z/2025-06-16T00:00:00Z",
  data: { phase: "daylight" },  // 附加任意数据
});
TimeInterval.contains(interval, JulianDate.fromIso8601("2025-06-15T12:00:00Z")); // true

// Entity.availability 使用它来剔除时间窗口外的实体
const availability = new TimeIntervalCollection([
  new TimeInterval({
    start: JulianDate.fromIso8601("2025-06-15T00:00:00Z"),
    stop: JulianDate.fromIso8601("2025-06-16T00:00:00Z"),
  }),
]);
```

## 属性系统 —— 时变值

每个实体属性都是一个 Property。CesiumJS 每帧调用 `property.getValue(time)`。

### ConstantProperty

无论时间如何都返回相同的值。CesiumJS 会自动包装原始值，因此显式使用较少见。

```js
import { ConstantProperty, Color } from "cesium";
const prop = new ConstantProperty(Color.RED);
prop.setValue(Color.BLUE); // 触发 definitionChanged 事件
```

### SampledProperty —— 插值时序数据

存储离散样本并进行插值。类型可以是 `Number`、`Cartesian3`、`Color` 或任何实现了 `Packable` 的类型。

```js
import { SampledProperty, JulianDate, LagrangePolynomialApproximation, ExtrapolationType } from "cesium";

const prop = new SampledProperty(Number);
const t0 = JulianDate.fromIso8601("2025-06-15T00:00:00Z");
prop.addSample(t0, 1.0);
prop.addSample(JulianDate.addSeconds(t0, 60, new JulianDate()), 2.5);
prop.addSample(JulianDate.addSeconds(t0, 120, new JulianDate()), 1.0);
prop.getValue(JulianDate.addSeconds(t0, 30, new JulianDate())); // ~1.75

// 默认：LinearApproximation 次数 1。切换到更平滑的 Lagrange：
prop.setInterpolationOptions({ interpolationDegree: 5, interpolationAlgorithm: LagrangePolynomialApproximation });
prop.forwardExtrapolationType = ExtrapolationType.HOLD; // 在范围外保持最后一个值
```

### SampledPositionProperty —— 插值位置

专门用于 Cartesian3 位置。支持参考系（`ReferenceFrame.FIXED` 默认，或 `INERTIAL`）。

```js
import { SampledPositionProperty, JulianDate, Cartesian3, LagrangePolynomialApproximation, ExtrapolationType } from "cesium";

const position = new SampledPositionProperty();
const start = JulianDate.fromIso8601("2025-06-15T00:00:00Z");
for (let i = 0; i <= 360; i += 45) {
  const rad = (i * Math.PI) / 180;
  position.addSample(
    JulianDate.addSeconds(start, i, new JulianDate()),
    Cartesian3.fromDegrees(-112 + 0.045 * Math.cos(rad), 36 + 0.03 * Math.sin(rad), 2000 + Math.random() * 500),
  );
}
position.setInterpolationOptions({ interpolationDegree: 5, interpolationAlgorithm: LagrangePolynomialApproximation });
position.forwardExtrapolationType = ExtrapolationType.HOLD;
```

| 算法 | 最适合 | 次数 |
|---|---|---|
| `LinearApproximation` | 快速分段线性 | 1（固定） |
| `LagrangePolynomialApproximation` | 稀疏样本的平滑曲线 | 1--9 |
| `HermitePolynomialApproximation` | 带速度导数的平滑曲线 | 1--9 |

### CallbackProperty —— 按需计算

每帧评估一个函数。如果值会变化，第二个参数（`isConstant`）必须为 `false`。

```js
import { CallbackProperty, Color, JulianDate } from "cesium";

const startTime = JulianDate.now();
const pulse = new CallbackProperty((time, result) => {
  const s = JulianDate.secondsDifference(time, startTime);
  return Color.RED.withAlpha(0.5 + 0.5 * Math.sin(s * 2), result ?? new Color());
}, false);

// 增长的多边形 —— 修改数组，属性自动更新
const pts = [/* 初始 Cartesian3[] */];
const dynamicPts = new CallbackProperty(() => pts, false);
```

### CompositeProperty —— 随时间拼接属性

为不同的时间范围委托给不同的子属性。每个区间的 `data` 是一个 Property。

```js
import { CompositeProperty, ConstantProperty, SampledProperty, TimeInterval, JulianDate } from "cesium";

const composite = new CompositeProperty();
composite.intervals.addInterval(TimeInterval.fromIso8601({
  iso8601: "2025-06-15T00:00:00Z/2025-06-15T12:00:00Z", data: new ConstantProperty(1.0) }));
const sampled = new SampledProperty(Number);
sampled.addSample(JulianDate.fromIso8601("2025-06-15T12:00:00Z"), 1.0);
sampled.addSample(JulianDate.fromIso8601("2025-06-16T00:00:00Z"), 5.0);
composite.intervals.addInterval(TimeInterval.fromIso8601({
  iso8601: "2025-06-15T12:00:00Z/2025-06-16T00:00:00Z", isStartIncluded: false, data: sampled }));
```

### VelocityOrientationProperty —— 沿路径自动定向

从位置属性的速度计算四元数。车辆和飞行器必不可少。

```js
import { VelocityOrientationProperty, SampledPositionProperty } from "cesium";
const position = new SampledPositionProperty();
// ... 添加样本 ...
viewer.entities.add({
  position, orientation: new VelocityOrientationProperty(position),
  model: { uri: "aircraft.glb", minimumPixelSize: 64 },
});
```

### ReferenceProperty —— 跨实体绑定

通过 ID 字符串（`"entityId#propertyPath"`）将一个实体的属性链接到另一个实体。

```js
import { ReferenceProperty } from "cesium";
viewer.entities.add({ id: "leader", position: Cartesian3.fromDegrees(-75, 40, 1000) });
viewer.entities.add({ id: "follower",
  position: ReferenceProperty.fromString(viewer.entities, "leader#position"),
  point: { pixelSize: 10 } });
```

## 材质属性

控制实体表面外观。所有选项接受原始值或 Property 实例以实现时变行为。表面类型：`ColorMaterialProperty`、`ImageMaterialProperty`、`GridMaterialProperty`、`StripeMaterialProperty`、`CheckerboardMaterialProperty`。折线类型：`PolylineArrowMaterialProperty`、`PolylineDashMaterialProperty`、`PolylineGlowMaterialProperty`、`PolylineOutlineMaterialProperty`。

```js
import { ColorMaterialProperty, SampledProperty, Color, JulianDate } from "cesium";

const solid = new ColorMaterialProperty(Color.RED);

// 通过 SampledProperty 实现时变颜色
const colorProp = new SampledProperty(Color);
const t0 = JulianDate.fromIso8601("2025-06-15T00:00:00Z");
colorProp.addSample(t0, Color.BLUE);
colorProp.addSample(JulianDate.addHours(t0, 6, new JulianDate()), Color.RED);
const animated = new ColorMaterialProperty(colorProp);
```

## 样条 —— 参数化曲线插值

样条使用无量纲参数化时间（而非 JulianDate）来实现平滑动画曲线。

```js
import { HermiteSpline, CatmullRomSpline, Cartesian3 } from "cesium";

// 自然三次样条（C2，自动切线）
const spline = HermiteSpline.createNaturalCubic({
  times: [0, 1.5, 3, 4.5, 6],
  points: [
    new Cartesian3(1235398, -4810983, 4146266), new Cartesian3(1372574, -5345182, 4606657),
    new Cartesian3(-757983, -5542796, 4514323), new Cartesian3(-2821260, -5248423, 4021290),
    new Cartesian3(-2539788, -4724797, 3620093) ],
});
const point = spline.evaluate(2.0); // 在参数化时间 t=2 处求值

// CatmullRom（C1，从控制点自动计算切线）
const catmull = new CatmullRomSpline({ times: [0, 1, 2, 3], points: [p0, p1, p2, p3] });
```

| 样条 | 用途 |
|---|---|
| `LinearSpline` | 分段线性（C0），最便宜 |
| `HermiteSpline` | 带切线的三次样条（C1+）；工厂方法：`createNaturalCubic`、`createClampedCubic`、`createC1` |
| `CatmullRomSpline` | 从控制点自动计算切线（C1） |
| `QuaternionSpline` | 通过 SLERP 进行旋转插值（C1） |
| `ConstantSpline` | 所有时间返回单一值 |
| `SteppedSpline` | 保持值直到下一个控制点 |
| `MorphWeightSpline` | glTF 形态目标权重（C1） |

## CZML 时序数据

CZML 流式传输时变数据。`document` 包设置了时钟；实体包使用 `epoch` + 偏移数组实现紧凑的位置表示。位置格式：`[secondsFromEpoch, lon, lat, alt, ...]`。

```js
import { Viewer, CzmlDataSource } from "cesium";
const czml = [
  { id: "document", version: "1.0", clock: {
      interval: "2025-06-15T00:00:00Z/2025-06-15T06:00:00Z",
      currentTime: "2025-06-15T00:00:00Z", multiplier: 60,
      range: "LOOP_STOP", step: "SYSTEM_CLOCK_MULTIPLIER" } },
  { id: "aircraft", availability: "2025-06-15T00:00:00Z/2025-06-15T06:00:00Z",
    position: { epoch: "2025-06-15T00:00:00Z",
      cartographicDegrees: [0,-75,40,10000, 10800,-88,42,11000, 21600,-118,34,9000],
      interpolationAlgorithm: "LAGRANGE", interpolationDegree: 5 },
    point: { pixelSize: 10, color: { rgba: [255,255,0,255] } } },
];
const ds = await CzmlDataSource.load(czml);
const viewer = new Viewer("cesiumContainer", { shouldAnimate: true });
viewer.dataSources.add(ds);
viewer.zoomTo(ds);
```

## EasingFunction —— 相机飞行曲线

用于 `camera.flyTo` 计时的常量（而非 Property 插值）。常用值：`LINEAR_NONE`、`CUBIC_IN_OUT`、`QUADRATIC_IN_OUT`。完整集合包括 `QUARTIC`、`QUINTIC`、`SINUSOIDAL`、`EXPONENTIAL`、`CIRCULAR`、`ELASTIC`、`BACK`、`BOUNCE` 变体（各有 `_IN`、`_OUT`、`_IN_OUT`）。

```js
import { EasingFunction, Cartesian3 } from "cesium";
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(-75, 40, 50000),
  duration: 3.0,
  easingFunction: EasingFunction.CUBIC_IN_OUT,
});
```

## 整合示例：动画飞行

结合了 Clock、SampledPositionProperty、VelocityOrientationProperty 和 availability。

```js
import {
  Viewer, JulianDate, ClockRange, SampledPositionProperty, VelocityOrientationProperty,
  TimeIntervalCollection, TimeInterval, Cartesian3, LagrangePolynomialApproximation,
} from "cesium";

const viewer = new Viewer("cesiumContainer", { shouldAnimate: true });
const start = JulianDate.fromIso8601("2025-06-15T16:00:00Z");
const stop = JulianDate.addSeconds(start, 360, new JulianDate());
viewer.clock.startTime = start.clone();
viewer.clock.stopTime = stop.clone();
viewer.clock.currentTime = start.clone();
viewer.clock.clockRange = ClockRange.LOOP_STOP;
viewer.clock.multiplier = 10;
viewer.timeline.zoomTo(start, stop);

const position = new SampledPositionProperty();
for (let i = 0; i <= 360; i += 45) {
  const r = (i * Math.PI) / 180;
  position.addSample(JulianDate.addSeconds(start, i, new JulianDate()),
    Cartesian3.fromDegrees(-112 + 0.045 * Math.cos(r), 36 + 0.03 * Math.sin(r), 2000));
}
position.setInterpolationOptions({ interpolationDegree: 5, interpolationAlgorithm: LagrangePolynomialApproximation });

viewer.trackedEntity = viewer.entities.add({
  availability: new TimeIntervalCollection([new TimeInterval({ start, stop })]),
  position, orientation: new VelocityOrientationProperty(position),
  model: { uri: "aircraft.glb", minimumPixelSize: 64 },
  path: { resolution: 1, width: 10 },
});
```

## 性能提示

1. 位置方面优先使用 `SampledPositionProperty` 而非 `CallbackProperty` —— 二分查找比每帧回调更快。
2. 保持 `interpolationDegree` 在 5 或以下；更高次数在稀疏数据上存在龙格现象风险。
3. 在循环中复用 `JulianDate` 的 result 参数以避免 GC 压力。
4. 设置实体的 `availability` 以剔除当前时间窗口外的实体。
5. 在 `CallbackProperty` 中返回 `result` 对象以避免分配。
6. 通过 `CzmlDataSource` 加载大量时序数据 —— 针对批量样本插入进行了优化。
7. 使用 `ExtrapolationType.HOLD` 代替重复的尾部样本。
8. 确定性回放使用 `ClockStep.TICK_DEPENDENT`；`SYSTEM_CLOCK_MULTIPLIER` 随帧率变化。
9. 尽量减少 `CallbackProperty` 数量 —— 每个都会在每帧运行其函数。

## 关键枚举

`ClockRange`：UNBOUNDED、CLAMPED、LOOP_STOP。`ClockStep`：TICK_DEPENDENT、SYSTEM_CLOCK_MULTIPLIER、SYSTEM_CLOCK。`ExtrapolationType`：NONE、HOLD、EXTRAPOLATE。`TimeStandard`：UTC、TAI。`ReferenceFrame`：FIXED、INERTIAL。`TrackingReferenceFrame`（v1.124+）：AUTODETECT、ECI、ECEF、INERTIAL、ENU。

## 参见

- **cesiumjs-entities** —— Entity、Graphics 类型、DataSources（属性的消费者）
- **cesiumjs-viewer-setup** —— Viewer、ClockViewModel、Timeline 控件
- **cesiumjs-models-particles** —— Model、ModelAnimation（使用时间系统进行回放）
