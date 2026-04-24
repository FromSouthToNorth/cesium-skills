---
name: cesiumjs-models-particles
description: "CesiumJS 模型、glTF 与粒子效果 - Model、ModelAnimation、ModelNode、ParticleSystem、发射器、GPM 扩展。在加载 glTF/GLB 3D 模型、播放模型动画、定位粒子效果（如火焰或烟雾）或使用地理空间定位元数据时使用。"
---
# CesiumJS 模型、glTF 与粒子效果

## 快速参考

| 类 | 用途 |
|---|---|
| `Model` | 低级 glTF/GLB 图元；通过 `modelMatrix` 定位 |
| `ModelAnimation` | 模型上的活动动画实例 |
| `ModelAnimationCollection` | 位于 `model.activeAnimations` 的集合 |
| `ModelNode` | 具有可修改变换的命名节点 |
| `ModelFeature` | 为要素 ID 模型提供的逐要素样式/拾取 |
| `ParticleSystem` | 基于布告板的粒子管理器（火焰、烟雾、雨） |
| `Particle` | 具有位置、速度、生命周期的单个粒子 |
| `ParticleBurst` | 预定爆发粒子 |
| `BoxEmitter` / `CircleEmitter` | 在盒体/平面圆盘内发射 |
| `ConeEmitter` / `SphereEmitter` | 从锥尖/球体内发射 |

Entity API 通过 `ModelGraphics` 公开模型（参见 cesiumjs-entities）。Primitive API 使用 `Model.fromGltfAsync` 以完全控制 `modelMatrix`、动画和节点变换。

---

## 加载 glTF/GLB 模型

始终使用异步工厂 —— 绝不要直接调用构造函数。

```js
import { Model, Cartesian3, Transforms, HeadingPitchRoll, Math as CesiumMath } from "cesium";

const model = await Model.fromGltfAsync({ url: "path/to/model.glb" });
viewer.scene.primitives.add(model);
```

### 带朝向的定位模型

```js
const position = Cartesian3.fromDegrees(-123.074, 44.050, 5000);
const hpr = new HeadingPitchRoll(CesiumMath.toRadians(135), 0, 0);

const model = await Model.fromGltfAsync({
  url: "CesiumAir.glb",
  modelMatrix: Transforms.headingPitchRollToFixedFrame(position, hpr),
  minimumPixelSize: 128,  // 在屏幕上不小于 128 像素
  maximumScale: 20000,    // minimumPixelSize 放大的上限
  scale: 2.0,             // 统一缩放倍数
});
viewer.scene.primitives.add(model);
```

### 关键 `Model.fromGltfAsync` 选项

| 选项 | 类型 | 默认值 |
|---|---|---|
| `url` | `string|Resource` | 必需 |
| `modelMatrix` | `Matrix4` | `IDENTITY` |
| `scale` | `number` | `1.0` |
| `minimumPixelSize` | `number` | `0.0` |
| `maximumScale` | `number` | -- |
| `show` | `boolean` | `true` |
| `color` / `colorBlendMode` / `colorBlendAmount` | `Color` / `ColorBlendMode` / `number` | -- / `HIGHLIGHT` / `0.5` |
| `silhouetteColor` / `silhouetteSize` | `Color` / `number` | `RED` / `0.0` |
| `shadows` | `ShadowMode` | `ENABLED` |
| `heightReference` | `HeightReference` | `NONE` |
| `customShader` | `CustomShader` | -- |
| `id` | `any` | -- |
| `allowPicking` | `boolean` | `true` |

---

## 就绪状态与生命周期

`fromGltfAsync` 在 glTF JSON 解析完成后解析，但 WebGL 资源可能仍在加载。在访问动画、节点或 `boundingSphere` 前等待 `readyEvent`。

```js
const model = await Model.fromGltfAsync({ url: "robot.glb" });
viewer.scene.primitives.add(model);

model.readyEvent.addEventListener(() => {
  console.log("包围球：", model.boundingSphere);
});
```

```js
// 同步检查
if (model.ready) { const bs = model.boundingSphere; }
```

---

## 动画

通过 `model.activeAnimations`（`ModelAnimationCollection`）管理。

### 按名称播放 / 播放全部

```js
model.readyEvent.addEventListener(() => {
  // 单个动画
  const anim = model.activeAnimations.add({
    name: "Walk",                          // glTF 动画名称
    loop: Cesium.ModelAnimationLoop.REPEAT, // NONE | REPEAT | MIRRORED_REPEAT
    multiplier: 1.0,                       // 播放速度（必须 > 0）
  });
  anim.start.addEventListener((m, a) => console.log(`开始：${a.name}`));

  // 或同时播放所有动画
  model.activeAnimations.addAll({
    loop: Cesium.ModelAnimationLoop.REPEAT,
    multiplier: 0.5,
  });
});
```

`add` 的其他选项：`index`、`reverse`、`startTime`、`stopTime`、`delay`、`removeOnStop`、`animationTime`（自定义时间回调）。

### 动画事件

```js
animation.start.addEventListener((model, animation) => { });
animation.update.addEventListener((model, animation, time) => { });
animation.stop.addEventListener((model, animation) => { });
// 集合级别
model.activeAnimations.animationAdded.addEventListener((model, anim) => { });
```

```js
model.activeAnimations.remove(animation); // 移除一个
model.activeAnimations.removeAll();        // 移除全部
```

---

## 模型节点

覆盖命名的节点变换，用于程序性动画（例如炮塔旋转）。

```js
model.readyEvent.addEventListener(() => {
  const node = model.getNode("Turret");
  node.matrix = Cesium.Matrix4.fromScale(
    new Cesium.Cartesian3(5.0, 1.0, 1.0), node.matrix
  );
});
```

属性：`name`（只读）、`id`（只读索引）、`show`（布尔值）、`matrix`（Matrix4 -- 设置为 `undefined` 以恢复原始状态并重新启用 glTF 动画）。

---

## 着色、轮廓和要素拾取

```js
// 色调 + 轮廓
model.color = Cesium.Color.RED.withAlpha(0.5);
model.colorBlendMode = Cesium.ColorBlendMode.MIX;
model.colorBlendAmount = 0.5;
model.silhouetteColor = Cesium.Color.YELLOW;
model.silhouetteSize = 2.0;
```

当 glTF 具有 `EXT_mesh_features` 或 `EXT_structural_metadata` 时，拾取返回 `ModelFeature`：

```js
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction((movement) => {
  const picked = viewer.scene.pick(movement.endPosition);
  if (picked instanceof Cesium.ModelFeature) {
    picked.getPropertyIds().forEach((name) => {
      console.log(`${name}：${picked.getProperty(name)}`);
    });
    picked.color = Cesium.Color.YELLOW;
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
```

---

## 高度参考

```js
// Primitive API -- 高度参考需要 scene
const model = await Model.fromGltfAsync({
  url: "truck.glb",
  heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
  scene: viewer.scene,
});

// Entity API
viewer.entities.add({
  position: Cartesian3.fromDegrees(-75.59, 40.03),
  model: { uri: "truck.glb", heightReference: Cesium.HeightReference.CLAMP_TO_GROUND },
});
```

值：`NONE`、`CLAMP_TO_GROUND`、`RELATIVE_TO_GROUND`、`CLAMP_TO_TERRAIN`、`RELATIVE_TO_TERRAIN`、`CLAMP_TO_3D_TILE`、`RELATIVE_TO_3D_TILE`。

---

## 粒子系统

`ParticleSystem` 渲染基于布告板的效果。使用 `modelMatrix`（世界）和 `emitterModelMatrix`（局部偏移）定位。

### 烟雾轨迹

```js
import { ParticleSystem, CircleEmitter, Color, Cartesian2, Transforms, Cartesian3 } from "cesium";

const smokeSystem = new ParticleSystem({
  image: "smoke.png",
  startColor: Color.LIGHTGRAY.withAlpha(0.7),
  endColor: Color.WHITE.withAlpha(0.0),
  startScale: 1.0,
  endScale: 5.0,
  emissionRate: 10,
  minimumSpeed: 1.0,
  maximumSpeed: 4.0,
  minimumParticleLife: 1.2,
  maximumParticleLife: 3.0,
  imageSize: new Cartesian2(25, 25), // 像素大小
  emitter: new CircleEmitter(2.0),   // 半径以米为单位
  modelMatrix: Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(-75.157, 39.978)),
  lifetime: 16.0,
  loop: true,
});
viewer.scene.primitives.add(smokeSystem);
```

### 发射器类型

```js
import { BoxEmitter, CircleEmitter, ConeEmitter, SphereEmitter } from "cesium";

new BoxEmitter(new Cesium.Cartesian3(10, 10, 10));  // 3D 盒子，速度向外
new CircleEmitter(2.0);                              // 平面圆盘，速度 +Z 方向
new ConeEmitter(Cesium.Math.toRadians(30));          // 锥尖，速度朝向底部
new SphereEmitter(5.0);                              // 球体，速度辐射向外
```

### 粒子爆发

```js
const firework = new ParticleSystem({
  image: getParticleCanvas(),
  startColor: Color.RED,
  endColor: Color.RED.withAlpha(0.0),
  particleLife: 1.0,
  speed: 100.0,
  imageSize: new Cartesian2(7, 7),
  emissionRate: 0,  // 仅爆发
  emitter: new SphereEmitter(0.1),
  bursts: [
    new Cesium.ParticleBurst({ time: 0.0, minimum: 100, maximum: 200 }),
    new Cesium.ParticleBurst({ time: 2.0, minimum: 50, maximum: 100 }),
    new Cesium.ParticleBurst({ time: 4.0, minimum: 200, maximum: 300 }),
  ],
  lifetime: 6.0,
  loop: false,
  modelMatrix: Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(-75.597, 40.038)),
});
viewer.scene.primitives.add(firework);
```

### 更新回调（重力 / 风力）

`updateCallback` 每个粒子每帧运行，用于施加重力等力。

```js
const gravityScratch = new Cesium.Cartesian3();
function applyGravity(particle, dt) {
  Cesium.Cartesian3.normalize(particle.position, gravityScratch);
  Cesium.Cartesian3.multiplyByScalar(gravityScratch, -9.8 * dt, gravityScratch);
  particle.velocity = Cesium.Cartesian3.add(particle.velocity, gravityScratch, particle.velocity);
}

const system = new ParticleSystem({
  image: "smoke.png",
  emissionRate: 20,
  emitter: new ConeEmitter(Cesium.Math.toRadians(45)),
  updateCallback: applyGravity,
  modelMatrix: Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(-105, 40, 1000)),
});
viewer.scene.primitives.add(system);
```

---

## 将粒子附加到移动模型

通过 `scene.preUpdate` 每帧同步 `modelMatrix`。使用 `emitterModelMatrix` 设置局部偏移（例如排气管）。

```js
const entity = viewer.entities.add({
  position: sampledPosition,
  orientation: new Cesium.VelocityOrientationProperty(sampledPosition),
  model: { uri: "truck.glb", minimumPixelSize: 64 },
});

// 排气管局部偏移
const trs = new Cesium.TranslationRotationScale();
trs.translation = new Cesium.Cartesian3(-4.0, 0.0, 1.4);
const emitterModelMatrix = Cesium.Matrix4.fromTranslationRotationScale(trs, new Cesium.Matrix4());

const exhaust = new ParticleSystem({
  image: "smoke.png",
  startColor: Color.GRAY.withAlpha(0.7),
  endColor: Color.TRANSPARENT,
  emissionRate: 8,
  speed: 2.0,
  particleLife: 1.5,
  imageSize: new Cartesian2(20, 20),
  emitter: new CircleEmitter(0.5),
  emitterModelMatrix: emitterModelMatrix,
});
viewer.scene.primitives.add(exhaust);

viewer.scene.preUpdate.addEventListener((scene, time) => {
  exhaust.modelMatrix = entity.computeModelMatrix(time, new Cesium.Matrix4());
});
```

---

## 基于 Canvas 的粒子图像

动态生成粒子纹理，而非加载图像文件。

```js
function createCircleImage() {
  const c = document.createElement("canvas");
  c.width = c.height = 20;
  const ctx = c.getContext("2d");
  ctx.beginPath();
  ctx.arc(10, 10, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  return c;
}

// 直接将 canvas 作为图像传入
new ParticleSystem({ image: createCircleImage(), /* ...其他选项 */ });
```

---

## Entity API 模型（ModelGraphics）

对于更简单的用例，通过 Entity API 添加模型（完整说明参见 cesiumjs-entities）。

```js
const entity = viewer.entities.add({
  name: "飞行器",
  position: Cartesian3.fromDegrees(-123.074, 44.050, 5000),
  orientation: Cesium.Transforms.headingPitchRollQuaternion(
    Cartesian3.fromDegrees(-123.074, 44.050, 5000),
    new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(135), 0, 0)
  ),
  model: {
    uri: "CesiumAir.glb",
    minimumPixelSize: 128,
    maximumScale: 20000,
    silhouetteColor: Color.RED,
    silhouetteSize: 2.0,
  },
});
viewer.trackedEntity = entity;
```

---

## GPM 扩展（NGA_gpm_local）

CesiumJS 实验性支持 NGA 地理空间定位元数据 glTF 扩展。类型：`AnchorPointDirect`、`AnchorPointIndirect`、`CorrelationGroup`、`GltfGpmLocal`、`Spdcf`。加载具有 `NGA_gpm_local` 的 glTF 时自动解析 —— API 是实验性的，可能会更改。

---

## 性能提示

1. **使用 `.glb` 而非 `.gltf`** —— 二进制格式避免额外的 HTTP 请求且传输体积更小。
2. **启用 Draco 压缩**（`KHR_draco_mesh_compression`）以获得 80-90% 的网格体积缩减。
3. **使用 KTX2/Basis 纹理**（`KHR_texture_basisu`）进行 GPU 压缩纹理；保持尺寸为 2 的幂。
4. **谨慎设置 `minimumPixelSize`** —— 大值会强制放大远处模型，增加绘制成本。
5. **限制轮廓使用** —— 每个带轮廓的模型增加额外渲染通道；超过 256 个可能导致模板伪影。
6. **复用草稿 `Matrix4` 对象** —— 避免在每帧同步粒子系统到移动实体时分配新对象。
7. **保持低发射率** —— 每个粒子是一个布告板；超过 200/秒的发射率可能影响帧率。对短效果使用爆发。
8. **优先使用像素大小的粒子**（`sizeInMeters: false`，默认）—— 米级粒子在近距离时开销大。
9. **为粒子系统设置有限的 `lifetime`** —— `Number.MAX_VALUE`（默认）会阻止池清理。
10. **为装饰物禁用拾取** —— 在不需要交互的模型上设置 `allowPicking: false` 以节省 GPU 内存。
11. **完成后销毁** —— `viewer.scene.primitives.remove(model)` 然后 `model.destroy()` 以释放 WebGL 资源。

---

## 参见

- **cesiumjs-custom-shader** -- 为 `Model.customShader` 编写 GLSL（结构体参考、要素 ID、元数据、顶点位移）
- **cesiumjs-materials-shaders** -- ImageBasedLighting、模型的后处理阶段
- **cesiumjs-entities** -- Entity API ModelGraphics、数据源、时间动态属性
- **cesiumjs-3d-tiles** -- Cesium3DTileset（内部使用 Model）、裁剪、样式
