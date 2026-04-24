---
name: cesiumjs-interaction
description: "CesiumJS 交互与拾取 - ScreenSpaceEventHandler、Scene.pick、Scene.drillPick、Scene.pickPosition、鼠标和触控事件。在处理用户点击地球、选择实体或 3D Tiles 要素、实现悬停效果或构建基于拖拽的交互时使用。"
---
# CesiumJS 交互与拾取

版本基线：CesiumJS v1.139（ES 模块导入，需要 Ion 令牌）。

## ScreenSpaceEventHandler

Cesium 画布上鼠标、触控和指针事件的中央类。

```js
import { ScreenSpaceEventHandler, ScreenSpaceEventType,
  KeyboardEventModifier, defined } from "cesium";

const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

// 注册点击处理器
handler.setInputAction((event) => {
  console.log("点击位置", event.position.x, event.position.y);
}, ScreenSpaceEventType.LEFT_CLICK);

// 带键盘修饰键（Shift+点击）
handler.setInputAction((event) => {
  console.log("Shift+点击位置", event.position);
}, ScreenSpaceEventType.LEFT_CLICK, KeyboardEventModifier.SHIFT);

// 查询或移除操作
const action = handler.getInputAction(ScreenSpaceEventType.LEFT_CLICK);
handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);

// 完成后务必销毁以避免内存泄漏
handler = handler && handler.destroy();
```

Viewer 也有内置处理器，位于 `viewer.screenSpaceEventHandler` —— 在简单情况下使用它以避免创建第二个处理器。

## ScreenSpaceEventType 参考

| 事件 | 回调形状 | 说明 |
|---|---|---|
| `LEFT_DOWN` / `LEFT_UP` / `LEFT_CLICK` | `({ position })` | Cartesian2 屏幕坐标 |
| `LEFT_DOUBLE_CLICK` | `({ position })` | 仅左键 |
| `RIGHT_DOWN` / `RIGHT_UP` / `RIGHT_CLICK` | `({ position })` | |
| `MIDDLE_DOWN` / `MIDDLE_UP` / `MIDDLE_CLICK` | `({ position })` | |
| `MOUSE_MOVE` | `({ startPosition, endPosition })` | 每次指针移动时触发 |
| `WHEEL` | `(delta)` | 正数 = 向上滚动 |
| `PINCH_START` | `({ position1, position2 })` | 双指触控开始 |
| `PINCH_END` | `()` | 双指触控结束 |
| `PINCH_MOVE` | `({ distance, angleAndHeight })` | 双指移动 |

`KeyboardEventModifier`：`SHIFT`、`CTRL`、`ALT` —— `setInputAction` 的可选第三个参数。

## Scene 拾取方法

### pick / pickAsync / drillPick / pickPosition

```js
import { Cartographic, Math as CesiumMath, defined } from "cesium";

// pick -- 同步，返回最上层对象或 undefined
const picked = viewer.scene.pick(event.position);

// pickAsync -- 非阻塞（WebGL2，v1.136+），在 WebGL1 上回退到同步
const picked2 = await viewer.scene.pickAsync(movement.endPosition);

// drillPick -- 位置处的所有对象，从前到后；使用 limit 限制成本
const allPicked = viewer.scene.drillPick(event.position, 5);

// pickPosition -- 从深度缓冲区获取世界 Cartesian3
if (viewer.scene.pickPositionSupported) {
  const cartesian = viewer.scene.pickPosition(event.position);
  if (defined(cartesian)) {
    const c = Cartographic.fromCartesian(cartesian);
    console.log(CesiumMath.toDegrees(c.longitude), CesiumMath.toDegrees(c.latitude), c.height);
  }
}
```

设置 `scene.pickTranslucentDepth = true` 以在 `pickPosition` 中包含半透明图元。

### pickVoxel（实验性）

```js
// 拾取体素单元并读取其属性
const voxelCell = viewer.scene.pickVoxel(event.position);
if (defined(voxelCell)) {
  console.log(voxelCell.getProperty("temperature"));
}
```

### 拾取返回值

| 拾取对象 | 返回形状 | 关键属性 |
|---|---|---|
| Entity | `{ primitive, id }` | `id` 是 `Entity` 实例 |
| Cesium3DTileFeature | `Cesium3DTileFeature` | `.getProperty(name)`、`.getPropertyIds()`、`.color` |
| Billboard/Label（集合） | `{ primitive, id }` | `id` 是用户设置的 id |
| Primitive（几何体） | `{ primitive, id }` | `id` 是 `GeometryInstance` 的 id |
| 地球表面 | `undefined` | 使用 `camera.pickEllipsoid()` 或 `pickPosition()` |

## 配方

### 1. 点击选择实体

```js
handler.setInputAction((event) => {
  const picked = viewer.scene.pick(event.position);
  if (defined(picked) && defined(picked.id)) {
    viewer.selectedEntity = picked.id; // 显示 InfoBox
  } else {
    viewer.selectedEntity = undefined;
  }
}, ScreenSpaceEventType.LEFT_CLICK);
```

### 2. 3D Tiles 要素拾取和属性检查

```js
import { Cesium3DTileFeature, Color } from "cesium";

handler.setInputAction((event) => {
  const picked = viewer.scene.pick(event.position);
  if (picked instanceof Cesium3DTileFeature) {
    // 读取属性
    const ids = picked.getPropertyIds();
    ids.forEach((id) => console.log(`${id}：${picked.getProperty(id)}`));
    picked.color = Color.YELLOW; // 高亮
  }
}, ScreenSpaceEventType.LEFT_CLICK);
```

### 3. 地形位置拾取（从点击获取经度/纬度）

```js
handler.setInputAction((event) => {
  const cartesian = viewer.camera.pickEllipsoid(
    event.position, viewer.scene.globe.ellipsoid);
  if (defined(cartesian)) {
    const c = Cartographic.fromCartesian(cartesian);
    console.log(`经度：${CesiumMath.toDegrees(c.longitude).toFixed(6)}`);
    console.log(`纬度：${CesiumMath.toDegrees(c.latitude).toFixed(6)}`);
  }
}, ScreenSpaceEventType.LEFT_CLICK);
```

对于 3D 内容的高度，使用 `scene.pickPosition`（见上文）。

### 4. 使用 drillPick 的多重拾取

```js
import { EntityCollection, CallbackProperty, ColorMaterialProperty, Color } from "cesium";

const pickedEntities = new EntityCollection();
const highlightColor = Color.YELLOW.withAlpha(0.5);

// 使实体材质对选择状态做出反应
function makePickable(entity, baseColor) {
  entity.polygon.material = new ColorMaterialProperty(
    new CallbackProperty((time, result) => {
      return pickedEntities.contains(entity)
        ? highlightColor.clone(result) : baseColor.clone(result);
    }, false));
}

handler.setInputAction((movement) => {
  const all = viewer.scene.drillPick(movement.endPosition);
  pickedEntities.removeAll();
  for (const p of all) {
    if (defined(p.id)) pickedEntities.add(p.id);
  }
}, ScreenSpaceEventType.MOUSE_MOVE);
```

### 5. 使用 MOUSE_MOVE 的悬停高亮

```js
import { Color } from "cesium";

const highlighted = { feature: undefined, originalColor: new Color() };

handler.setInputAction((movement) => {
  if (defined(highlighted.feature)) {
    highlighted.feature.color = highlighted.originalColor;
    highlighted.feature = undefined;
  }
  const picked = viewer.scene.pick(movement.endPosition);
  if (defined(picked) && defined(picked.color)) {
    highlighted.feature = picked;
    Color.clone(picked.color, highlighted.originalColor);
    picked.color = Color.YELLOW;
  }
}, ScreenSpaceEventType.MOUSE_MOVE);
```

### 6. 基于拖拽的绘制和测量

```js
import { Cartographic, EllipsoidGeodesic, Ellipsoid, Color } from "cesium";

const positions = [];

handler.setInputAction((event) => {
  const cartesian = viewer.camera.pickEllipsoid(
    event.position, viewer.scene.globe.ellipsoid);
  if (!defined(cartesian)) return;
  positions.push(cartesian);

  if (positions.length === 2) {
    viewer.entities.add({
      polyline: { positions: positions.slice(), width: 3,
        material: Color.RED, clampToGround: true },
    });
    const start = Cartographic.fromCartesian(positions[0]);
    const end = Cartographic.fromCartesian(positions[1]);
    const geodesic = new EllipsoidGeodesic(start, end, Ellipsoid.WGS84);
    console.log(`距离：${(geodesic.surfaceDistance / 1000).toFixed(2)} 公里`);
    positions.length = 0;
  }
}, ScreenSpaceEventType.LEFT_CLICK);
```

### 7. 鼠标移动时的坐标读出

```js
import { HorizontalOrigin, VerticalOrigin, Cartesian2 } from "cesium";

const coordLabel = viewer.entities.add({
  label: { show: false, showBackground: true, font: "14px monospace",
    horizontalOrigin: HorizontalOrigin.LEFT, verticalOrigin: VerticalOrigin.TOP,
    pixelOffset: new Cartesian2(15, 0) },
});

handler.setInputAction((movement) => {
  const cartesian = viewer.camera.pickEllipsoid(
    movement.endPosition, viewer.scene.globe.ellipsoid);
  if (defined(cartesian)) {
    const c = Cartographic.fromCartesian(cartesian);
    coordLabel.position = cartesian;
    coordLabel.label.show = true;
    coordLabel.label.text =
      `经度：${CesiumMath.toDegrees(c.longitude).toFixed(4)}\n` +
      `纬度：${CesiumMath.toDegrees(c.latitude).toFixed(4)}`;
  } else {
    coordLabel.label.show = false;
  }
}, ScreenSpaceEventType.MOUSE_MOVE);
```

### 8. 基于拾取对象类型的条件行为

```js
import { Cesium3DTileFeature } from "cesium";

handler.setInputAction((event) => {
  const picked = viewer.scene.pick(event.position);
  if (!defined(picked)) {
    console.log("未拾取到对象");
  } else if (picked instanceof Cesium3DTileFeature) {
    console.log("3D Tile 要素：", picked.getProperty("name"));
  } else if (defined(picked.id) && defined(picked.id.position)) {
    viewer.selectedEntity = picked.id; // Entity
  } else if (defined(picked.primitive)) {
    console.log("图元：", picked.primitive.constructor.name);
  }
}, ScreenSpaceEventType.LEFT_CLICK);
```

### 9. 非阻塞悬停的 pickAsync（v1.136+）

```js
const highlighted = { feature: undefined, originalColor: new Color() };

handler.setInputAction(async (movement) => {
  if (defined(highlighted.feature)) {
    highlighted.feature.color = highlighted.originalColor;
    highlighted.feature = undefined;
  }
  const picked = await viewer.scene.pickAsync(movement.endPosition);
  if (defined(picked) && defined(picked.color)) {
    highlighted.feature = picked;
    Color.clone(picked.color, highlighted.originalColor);
    picked.color = Color.YELLOW;
  }
}, ScreenSpaceEventType.MOUSE_MOVE);
```

### 10. 带轮廓的悬停 + 选择（完整模式）

```js
import { PostProcessStageLibrary, Color } from "cesium";

const scene = viewer.scene;
const silhouetteHover = PostProcessStageLibrary.createEdgeDetectionStage();
silhouetteHover.uniforms.color = Color.BLUE;
silhouetteHover.uniforms.length = 0.01;
silhouetteHover.selected = [];

const silhouetteSelect = PostProcessStageLibrary.createEdgeDetectionStage();
silhouetteSelect.uniforms.color = Color.LIME;
silhouetteSelect.uniforms.length = 0.01;
silhouetteSelect.selected = [];

scene.postProcessStages.add(
  PostProcessStageLibrary.createSilhouetteStage([silhouetteHover, silhouetteSelect]));

let selectedFeature;

viewer.screenSpaceEventHandler.setInputAction((movement) => {
  silhouetteHover.selected = [];
  const picked = scene.pick(movement.endPosition);
  if (defined(picked) && picked !== selectedFeature) {
    silhouetteHover.selected = [picked];
  }
}, ScreenSpaceEventType.MOUSE_MOVE);

viewer.screenSpaceEventHandler.setInputAction((event) => {
  silhouetteSelect.selected = [];
  const picked = scene.pick(event.position);
  if (defined(picked)) {
    selectedFeature = picked;
    silhouetteSelect.selected = [picked];
    silhouetteHover.selected = [];
  } else {
    selectedFeature = undefined;
  }
}, ScreenSpaceEventType.LEFT_CLICK);
```

### 11. 带自定义逻辑的滚轮缩放

```js
handler.setInputAction((delta) => {
  // delta > 0 = 向上滚动（放大），delta < 0 = 向下滚动（缩小）
  const zoomAmount = delta > 0 ? 0.9 : 1.1;
  viewer.camera.zoomIn(viewer.camera.positionCartographic.height * (1 - zoomAmount));
}, ScreenSpaceEventType.WHEEL);
```

### 12. 右键上下文菜单

```js
viewer.scene.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

handler.setInputAction((event) => {
  const picked = viewer.scene.pick(event.position);
  if (defined(picked) && defined(picked.id)) {
    showContextMenu(event.position, picked.id); // 您的应用逻辑
  }
}, ScreenSpaceEventType.RIGHT_CLICK);
```

### 13. 拖拽交互（移动实体）

```js
let draggedEntity = null;
const sscc = viewer.scene.screenSpaceCameraController;

handler.setInputAction((event) => {
  const picked = viewer.scene.pick(event.position);
  if (defined(picked) && defined(picked.id)) {
    draggedEntity = picked.id;
    sscc.enableRotate = false;
    sscc.enableTranslate = false;
  }
}, ScreenSpaceEventType.LEFT_DOWN);

handler.setInputAction((movement) => {
  if (!defined(draggedEntity)) return;
  const cartesian = viewer.camera.pickEllipsoid(
    movement.endPosition, viewer.scene.globe.ellipsoid);
  if (defined(cartesian)) draggedEntity.position = cartesian;
}, ScreenSpaceEventType.MOUSE_MOVE);

handler.setInputAction(() => {
  draggedEntity = null;
  sscc.enableRotate = true;
  sscc.enableTranslate = true;
}, ScreenSpaceEventType.LEFT_UP);
```

## 性能提示

1. **在 MOUSE_MOVE 上优先使用 `pickAsync` 而非 `pick`** —— 同步 pick 会停止 GPU 管线；`pickAsync` 让出 GPU 并在下一帧解析（WebGL2，v1.136+）。
2. **使用带 `limit` 的 `drillPick`** —— 没有限制时，它会为每个重叠对象重新渲染场景。
3. **当仅需要点击拾取时，避免在 MOUSE_MOVE 中使用 `pick`** —— MOUSE_MOVE 在每次指针移动时触发并触发拾取渲染通道。
4. **启用 `depthTestAgainstTerrain`** 以在地形上获得准确的 `pickPosition` 结果。
5. **销毁未使用的处理器** —— 每个处理器都会注册 DOM 监听器，不清理会泄漏内存。
6. **限制昂贵的悬停逻辑** —— 对于简单高亮以外的操作，防抖到 50-100ms。
7. **在使用 `pickPosition` 前检查 `scene.pickPositionSupported`** —— 在不支持的 GPU 上回退到 `camera.pickEllipsoid`。
8. **仅在需要时设置 `scene.pickTranslucentDepth = true`** —— 会增加一个额外的渲染通道。
9. **复用结果对象** —— 向 `pickPosition` 传入一个草稿 `Cartesian3` 以避免 MOUSE_MOVE 中的 GC 压力。
10. **使用 `scene.requestRenderMode = true`** 配合拾取以避免不必要的渲染；仅在状态变化时调用 `scene.requestRender()`。

## 参见

- **cesiumjs-entities** -- Entity API、Graphics 类型、DataSource
- **cesiumjs-3d-tiles** -- Cesium3DTileset、Cesium3DTileFeature、样式、元数据
- **cesiumjs-camera** -- Camera.pickEllipsoid、ScreenSpaceCameraController、flyTo
