---
name: cesiumjs-camera
description: "CesiumJS 相机控制 - Camera、flyTo、lookAt、setView、ScreenSpaceCameraController、CameraEventAggregator、飞行动画。在定位相机、创建 flyTo 动画、约束用户导航、跟踪实体或在屏幕坐标与世界坐标之间转换时使用。"
---
# CesiumJS 相机与导航

> **版本基线：** CesiumJS v1.139 -- ES 模块导入（`import { ... } from "cesium";`）

## 相机基础

通过 `viewer.camera` 访问。相机具有 `position`（世界坐标中的 Cartesian3）、方向向量（`direction`、`up`、`right`）和视锥体。所有角度均为**弧度**。

只读计算属性：`positionWC`、`positionCartographic`、`directionWC`、`upWC`、`rightWC`、`heading`（0 = 北，顺时针）、`pitch`（负值 = 向下）、`roll`、`transform`、`viewMatrix`、`inverseViewMatrix`。

事件：`moveStart` / `moveEnd` 在移动开始/结束时触发。`changed` 在相机移动超过 `percentageChanged`（默认 0.5）时触发。

> **城市视图需要 3D 建筑。** 对于天际线、街景或城市全景视图，请添加 `Cesium.createOsmBuildingsAsync()`（或 Google Photorealistic 3D Tiles）。没有 3D Tiles，城市将渲染为平坦的卫星影像 —— 没有建筑物，没有天际线轮廓。请在代码注释中包含加载建筑的内容。

### 高度与角度指南

根据要显示的**要素尺度**选择高度和俯仰角：

| 视图类型 | 高度（米） | 俯仰角（度） | 说明 |
|---|---|---|---|
| **地标特写** | 500 -- 1,500 | -25 到 -35 | 单个建筑/结构充满画面。使用 `lookAt` 配合适当范围。 |
| **城市全景 / 天际线** | 800 -- 1,500 | -10 到 -20 | 从河对岸或海湾对面观看天际线。将相机置于侧面，面对城市。**需要 OSM Buildings 或 3D Tiles** 以获得 3D 轮廓。 |
| **城市概览** | 2,000 -- 5,000 | -35 到 -50 | 城市网格、河流和公园清晰可见 |
| **都会 / 区域** | 8,000 -- 20,000 | -60 到 -90 | 整个都会区或地理特征 |
| **峡谷 / 悬崖边缘** | 于边缘上方 50 -- 300 | -15 到 -25 | 使用更陡的俯仰角以显示下方深度。接近水平（-5）在地形上看是平坦的。 |
| **国家 / 大陆** | 500,000 -- 5,000,000 | -90 | 行政边界、海岸线 |

**当提示要求"看城市"或"从城市开始"时**，默认使用**城市概览**范围（2,000-5,000 米），俯仰角约 **-45** 到 **-60** 度，朝向 **0**（北）。这能产生清晰可辨的视图，其中城市布局、河流和地标都能识别。

**俯视图**（`pitch: -90`）最适合地理特征（峡谷、海岸线、河流），俯视角度能揭示其独特形状。对于城市，推荐使用显示 3D 天际线的倾斜视图。

> **万向节锁定：** 绝对不要使用 `pitch: -Math.PI/2`。对于正俯视图，使用 `-(Math.PI / 2 - 0.0001)` 以避免奇点。

> **地面级视图（高度 < 200 米）**需要 3D Tiles。没有它们，CesiumJS 只显示天空和平地。建议使用更高高度的回退方案。

> **天际线全景**（跨越河流/海湾）：800-1,500 米，俯仰角 -10 到 -20。
> **添加 `Cesium.createOsmBuildingsAsync()` 以获得 3D 轮廓。** 在中高度下过于水平（-5）的俯仰角会显示平坦网格，而非天际线。

> **峡谷 / 悬崖边缘视图**：俯仰角 -15 到 -25。接近水平的俯仰角（-5 到 -8）在地形上看是平坦的，看不到垂直落差。

---

## setView -- 即时定位

单帧内将相机瞬移到位 —— 无动画。用于初始视图、模式重置、约束设置。`destination`：`Cartesian3` 或 `Rectangle`。`orientation`：`{ heading, pitch, roll }` 或 `{ direction, up }`。

```js
import { Cartesian3, Math as CesiumMath } from "cesium";

// 城市概览：3000 米高度，面向北的倾斜视图
viewer.camera.setView({
  destination: Cartesian3.fromDegrees(-0.1276, 51.5074, 3000.0),
  orientation: {
    heading: CesiumMath.toRadians(0.0),   // 北
    pitch: CesiumMath.toRadians(-50.0),    // 向下倾斜 -- 清晰显示城市布局
    roll: 0.0,
  },
});
```

```js
import { Cartesian3, Math as CesiumMath } from "cesium";

// 峡谷边缘视角：略高于边缘，俯视峡谷
// 俯仰角 -20 揭示深度；接近水平（-5）看起来是平的
viewer.camera.setView({
  destination: Cartesian3.fromDegrees(-112.14, 36.06, 2400.0),
  orientation: {
    heading: CesiumMath.toRadians(0.0),
    pitch: CesiumMath.toRadians(-20.0),    // 更陡的俯仰角以显示峡谷深度
    roll: 0.0,
  },
});
```

```js
// 俯视地理视图 -- 使用安全俯仰角避免万向节锁定
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(-112.14, 36.06, 50000.0),
  orientation: { heading: 0.0, pitch: -(Math.PI / 2 - 0.0001), roll: 0.0 },
});

// 矩形形式（俯视图，方向默认为北/下）
viewer.camera.setView({
  destination: Cesium.Rectangle.fromDegrees(-77.0, 38.0, -72.0, 42.0),
});
```

---

## flyTo -- 动画飞行

平滑地动画移动相机。不返回 Promise；使用 `complete` 回调。选项：`destination`、`orientation`、`duration`（秒）、`complete`/`cancel`、`maximumHeight`、`pitchAdjustHeight`、`flyOverLongitude`。

```js
import { Cartesian3, Math as CesiumMath } from "cesium";

// 飞到地标：1500 米可清晰看到周边区域
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(2.2945, 48.8584, 1500.0),
  orientation: {
    heading: CesiumMath.toRadians(0.0),
    pitch: CesiumMath.toRadians(-35.0),
    roll: 0.0,
  },
  duration: 3,
});
```

```js
import { Cartesian3, Math as CesiumMath } from "cesium";

// 使用 complete 回调链式飞行（flyTo 不返回 Promise）
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(-74.0445, 40.6892, 800.0),
  orientation: {
    heading: CesiumMath.toRadians(0.0),
    pitch: CesiumMath.toRadians(-35.0),
    roll: 0.0,
  },
  duration: 3,
  complete() {
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(-73.9857, 40.758, 600.0),
      orientation: {
        heading: CesiumMath.toRadians(0.0),
        pitch: CesiumMath.toRadians(-40.0),
        roll: 0.0,
      },
      duration: 2,
    });
  },
});
```

> **浏览高度提示**：保持每个停靠点在 **600 米以上**以让瓦片和影像加载。低于 400 米时，快速连续飞行会出现模糊瓦片。

```js
// 远距离飞行：洛杉矶到东京途经欧洲
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(139.815, 35.714, 20000.0),
  duration: 20,
  flyOverLongitude: Cesium.Math.toRadians(60.0), // 经欧洲向东
  pitchAdjustHeight: 1000, // 高海拔时俯视
});
```

通过 `completeFlight()`（跳转到结束状态）和 `cancelFlight()`（保持在当前位置）控制正在进行的飞行。

---

## flyHome

飞到默认视图。可通过 `Camera.DEFAULT_VIEW_RECTANGLE` 覆盖。

```js
import { Camera, Rectangle } from "cesium";

Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(-10.0, 35.0, 40.0, 60.0);
viewer.camera.flyHome(2.0); // 持续时间以秒为单位；省略则使用自动
```

> **限制：** `flyHome()` 始终产生俯视、朝北的视图 —— 无法控制方向。解决方法：拦截 `viewer.homeButton.viewModel.command.beforeExecute`，取消它，然后调用 `flyTo` 并传入自定义方向。

---

## lookAt -- 锁定相机到目标

定位相机以从偏移量（`HeadingPitchRange` 或 `Cartesian3`）查看目标。**锁定相机直到 `lookAtTransform(Matrix4.IDENTITY)`。**

```js
import { Cartesian3, Math as CesiumMath, HeadingPitchRange } from "cesium";

// 从南边看，面向北（heading 0 = 面向北 = 相机在南边）
const target = Cartesian3.fromDegrees(2.2945, 48.8584, 300.0);
viewer.camera.lookAt(
  target,
  new HeadingPitchRange(
    CesiumMath.toRadians(0.0),   // heading 0 = 面向北
    CesiumMath.toRadians(-20.0), // pitch -- 向下 20 度
    1500.0,                      // 范围以米为单位
  ),
);
```

```js
import { Cartesian3, Math as CesiumMath, HeadingPitchRange } from "cesium";

// 从东边看，面向西（heading 270 = 面向西 = 相机在东边）
const target = Cartesian3.fromDegrees(-73.9857, 40.7484, 200.0);
viewer.camera.lookAt(
  target,
  new HeadingPitchRange(
    CesiumMath.toRadians(270.0), // heading -- 西
    CesiumMath.toRadians(-25.0), // pitch -- 向下 25 度
    800.0,                       // 范围以米为单位
  ),
);
```

**`lookAt` heading 方向参考：**

| 从...方向观看 | 相机面向... | Heading（度） | Heading（弧度） |
|---|---|---|---|
| **南方** | 北 | 0 | `0` |
| **西方** | 东 | 90 | `Math.PI / 2` |
| **北方** | 南 | 180 | `Math.PI` |
| **东方** | 西 | 270 | `3 * Math.PI / 2` |

Heading = 相机**面向**的方向。相机位于目标**相反**方向。

```js
import { Matrix4 } from "cesium";

// 完成后务必释放 lookAt 锁定以恢复自由导航
viewer.camera.lookAtTransform(Matrix4.IDENTITY);
```

> **陷阱：** 每个 `lookAt` 调用必须有一个匹配的 `lookAtTransform(Matrix4.IDENTITY)`。没有释放操作，鼠标/触控/键盘导航将被永久禁用。使用 `setTimeout`、`complete` 回调或事件来触发释放。

---

## lookAtTransform -- 自定义参考系

相对于任意变换矩阵设置相机位置。

```js
import { Cartesian3, Transforms, HeadingPitchRange, Math as CesiumMath } from "cesium";

// 在以点为中心的东北天参考系中查看
const center = Cartesian3.fromDegrees(-75.598, 40.039);
const transform = Transforms.eastNorthUpToFixedFrame(center);
viewer.camera.lookAtTransform(
  transform,
  new HeadingPitchRange(0.0, CesiumMath.toRadians(-45.0), 5000.0),
);
```

对于 ICRF（惯性）参考系：在 `postUpdate` 监听器中使用 `Transforms.computeIcrfToFixedMatrix(time)`，通过 `lookAtTransform(Matrix4.fromRotationTranslation(icrfToFixed), offset)` 应用。

---

## flyToBoundingSphere / viewBoundingSphere

将相机框围绕一个 `BoundingSphere`。范围为 0 时自动计算。

```js
import { BoundingSphere, Cartesian3, HeadingPitchRange, Math as CesiumMath } from "cesium";

const sphere = new BoundingSphere(Cartesian3.fromDegrees(-117.16, 32.71), 1000.0);

// 动画
viewer.camera.flyToBoundingSphere(sphere, {
  offset: new HeadingPitchRange(0.0, CesiumMath.toRadians(-45.0), 0.0),
  duration: 2.0,
});

// 即时
viewer.camera.viewBoundingSphere(sphere);
```

---

## 移动、旋转、观察和缩放方法

**移动**（按米平移位置，默认 `defaultMoveAmount` = 100 公里）：
`moveForward`、`moveBackward`、`moveUp`、`moveDown`、`moveLeft`、`moveRight`、`move(direction, amount)`。

**旋转**（围绕参考系中心轨道运动，保持距离不变，默认 `defaultRotateAmount` = PI/3600 弧度）：`rotateUp`、`rotateDown`、`rotateLeft`、`rotateRight`、`rotate(axis, angle)`。

**观察**（第一人称原地旋转，默认 `defaultLookAmount` = PI/60 弧度）：`lookUp`、`lookDown`、`lookLeft`、`lookRight`、`look(axis, angle)`、`twistLeft`、`twistRight`。

**缩放**（沿视线方向，默认 `defaultZoomAmount` = 100 公里）：`zoomIn(amount)`、`zoomOut(amount)`。

```js
// 移动速度按高度缩放，以获得自然手感
const height = viewer.scene.globe.ellipsoid
  .cartesianToCartographic(viewer.camera.position).height;
const speed = height / 100.0;
viewer.camera.moveForward(speed);
```

---

## ScreenSpaceCameraController

处理默认鼠标/触控输入。通过 `viewer.scene.screenSpaceCameraController` 访问。

### 约束导航

设置约束时，**同时调用 `setView`** 以使初始视图遵循约束。

```js
import { Cartesian3, Math as CesiumMath } from "cesium";

const ctrl = viewer.scene.screenSpaceCameraController;

ctrl.minimumZoomDistance = 500;       // 距离地表的米数
ctrl.maximumZoomDistance = 50000;
ctrl.maximumTiltAngle = Math.PI / 2; // 防止低于地平线

// 禁用特定交互
ctrl.enableRotate = false;
ctrl.enableTilt = false;
ctrl.enableZoom = false;
ctrl.enableTranslate = false; // 仅 2D / 哥伦布视图
ctrl.enableLook = false;
ctrl.enableInputs = false;    // 同时禁用所有

// 在城市概览高度设置初始视图，以获得清晰的起始点
viewer.camera.setView({
  destination: Cartesian3.fromDegrees(-0.1276, 51.5074, 3000.0),
  orientation: {
    heading: CesiumMath.toRadians(0.0),
    pitch: CesiumMath.toRadians(-50.0),
    roll: 0.0,
  },
});
```

> **注意：** 当 `enableCollisionDetection = false` 时，`maximumZoomDistance` 会被静默忽略。在实现地下视角后重新启用碰撞，或者在 `clock.onTick` 中手动强制执行缩放限制。

其他属性：`inertiaSpin`、`inertiaZoom`、`inertiaTranslate`（0 = 无惯性，0.9 = 默认），`enableCollisionDetection`（设置为 `false` 允许相机进入地下）。

### 重映射输入事件

```js
import { CameraEventType, KeyboardEventModifier } from "cesium";

const ctrl = viewer.scene.screenSpaceCameraController;
ctrl.rotateEventTypes = CameraEventType.RIGHT_DRAG;
ctrl.tiltEventTypes = {
  eventType: CameraEventType.LEFT_DRAG,
  modifier: KeyboardEventModifier.CTRL,
};
ctrl.zoomEventTypes = CameraEventType.WHEEL;
```

`CameraEventType` 值：`LEFT_DRAG`、`RIGHT_DRAG`、`MIDDLE_DRAG`、`WHEEL`、`PINCH`。结合 `KeyboardEventModifier`：`SHIFT`、`CTRL`、`ALT`。

---

## 自定义第一人称控制

禁用默认控制器，使用 `ScreenSpaceEventHandler` 实现鼠标视角，使用 `keydown`/`keyup` 实现 WASD。在 `clock.onTick` 中应用。速度按高度缩放。

```js
import { ScreenSpaceEventHandler, ScreenSpaceEventType, Cartesian3 } from "cesium";
const ctrl = viewer.scene.screenSpaceCameraController;
ctrl.enableRotate = ctrl.enableTranslate = ctrl.enableZoom = false;
ctrl.enableTilt = ctrl.enableLook = false;

const canvas = viewer.canvas;
canvas.setAttribute("tabindex", "0");
let looking = false, startPos, mousePos;
const handler = new ScreenSpaceEventHandler(canvas);
handler.setInputAction((m) => { looking = true; startPos = mousePos = Cartesian3.clone(m.position); }, ScreenSpaceEventType.LEFT_DOWN);
handler.setInputAction((m) => { mousePos = m.endPosition; }, ScreenSpaceEventType.MOUSE_MOVE);
handler.setInputAction(() => { looking = false; }, ScreenSpaceEventType.LEFT_UP);

const flags = {};
document.addEventListener("keydown", (e) => { flags[e.code] = true; });
document.addEventListener("keyup", (e) => { flags[e.code] = false; });
viewer.clock.onTick.addEventListener(() => {
  const cam = viewer.camera;
  if (looking) {
    cam.lookRight((mousePos.x - startPos.x) / canvas.clientWidth * 0.05);
    cam.lookUp(-(mousePos.y - startPos.y) / canvas.clientHeight * 0.05);
  }
  const spd = viewer.scene.globe.ellipsoid.cartesianToCartographic(cam.position).height / 100;
  if (flags.KeyW) cam.moveForward(spd);  if (flags.KeyS) cam.moveBackward(spd);
  if (flags.KeyA) cam.moveLeft(spd);     if (flags.KeyD) cam.moveRight(spd);
  if (flags.KeyQ) cam.moveUp(spd);       if (flags.KeyE) cam.moveDown(spd);
});
```

---

## 相机事件

```js
const off = viewer.camera.moveStart.addEventListener(() => console.log("移动中"));
viewer.camera.moveEnd.addEventListener(() => console.log("已停止"));
// off(); // 调用返回值可取消订阅

viewer.camera.percentageChanged = 0.1; // 变化检测阈值
viewer.camera.changed.addEventListener((pct) => console.log(`已变化 ${(pct*100).toFixed(1)}%`));
```

---

## pickEllipsoid -- 屏幕到地球

```js
import { Cartesian2 } from "cesium";

const center = new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
const worldPos = viewer.camera.pickEllipsoid(center);
if (worldPos) {
  const carto = viewer.scene.globe.ellipsoid.cartesianToCartographic(worldPos);
  console.log(Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude));
}
```

---

## 实体跟踪

```js
// 跟踪实体（设置相机自动跟随）
viewer.trackedEntity = viewer.entities.getById("vehicle");

// 自定义默认跟踪偏移
import { Camera, HeadingPitchRange, Math as CesiumMath } from "cesium";
Camera.DEFAULT_OFFSET = new HeadingPitchRange(
  CesiumMath.toRadians(90.0), CesiumMath.toRadians(-25.0), 500.0,
);

viewer.trackedEntity = undefined; // 停止跟踪
```

调试：`viewer.scene.primitives.add(new Cesium.DebugCameraPrimitive({ camera: viewer.camera, color: Cesium.Color.YELLOW, updateOnChange: true }));`

---

## 性能提示

1. **优先使用 `setView` 而非 `flyTo` 加 `duration: 0`** —— 避免补间开销。
2. **避免每帧读取 `heading`/`pitch`/`roll`** —— 每次都会计算 ENU 变换。缓存或使用 `direction`/`up` 向量。
3. **限制 `changed` 事件频率** —— 提高 `percentageChanged`（例如 0.5）。
4. **始终释放 `lookAt` 锁定** —— `lookAtTransform(Matrix4.IDENTITY)`。
5. **为短距离飞行设置 `maximumHeight`** —— 防止缩放到太空。
6. **按高度缩放移动速度** —— 除以相机高度以获得自然速度。
7. **地下视角后重新启用碰撞** —— `enableCollisionDetection = true`。
8. **游览停靠点使用 600 米以上高度** —— 避免连续飞行时出现模糊瓦片。

---

## 常见模式速查

| 任务 | 方法 | 关键细节 |
|---|---|---|
| 跳转到城市 | `setView` | 2,000-5,000 米，俯仰角 -50，朝向 0 |
| 动画到地标 | `flyTo` | 1,000-2,000 米，俯仰角 -30 到 -40，设置 `duration` |
| 城市天际线 / 全景 | `setView` 或 `flyTo` | 800-1,500 米，俯仰角 -10 到 -20。将相机置于河/海湾对面，面对城市。**加载 OSM Buildings。** |
| 俯视 / 地图视图 | `setView` 或 `flyTo` | 俯仰角 `-(Math.PI/2 - 0.0001)`，高度匹配要素大小 |
| 峡谷 / 悬崖边缘 | `setView` 或 `flyTo` | 边缘上方 50-300 米，俯仰角 -15 到 -25 以显示深度 |
| 锁定目标 | `lookAt` | **必须**使用 `lookAtTransform(Matrix4.IDENTITY)` 释放 |
| 相机游览（多站） | `flyTo` 链式 | 使用 `complete` 回调，保持高度 600 米以上 |
| 地面 / 街景 | `setView` | **需要 3D Tiles**（OSM Buildings 或 Google Photorealistic）。没有它们，只能看到天空和平地。 |
| 约束用户导航 | `screenSpaceCameraController` | 设置最小/最大缩放、倾斜角度；同时调用 `setView` 以设置初始位置 |

---

## 参见

- **cesiumjs-spatial-math** -- Cartesian3、Cartographic、Matrix4、Transforms、坐标转换
- **cesiumjs-interaction** -- ScreenSpaceEventHandler、Scene.pick、鼠标/触控事件
- **cesiumjs-entities** -- Entity、trackedEntity、EntityCollection、数据源
