---
name: cesiumjs-custom-shader
description: "CustomShader 编写 —— 针对 VertexInput、FragmentInput、FeatureIds、Metadata、czm_modelMaterial 的 vertexShaderText 和 fragmentShaderText。在读取 EXT_mesh_features 或 EXT_structural_metadata 属性纹理/表、顶点位移或为 VoxelPrimitive 着色时使用。"
---

# CesiumJS CustomShader

版本基线：CesiumJS 1.139（包含 1.139.1 补丁）。所有导入使用 ES 模块风格。

`CustomShader` 将用户 GLSL 注入 `Model` / `Cesium3DTileset` / `VoxelPrimitive` 渲染管线。它向逐顶点和逐片元代码暴露 glTF 属性、要素 ID 和 `EXT_structural_metadata`，并通过内置的 `czm_modelVertexOutput` 和 `czm_modelMaterial` 结构体返回值。

使用本技能进行**编写着色器主体**。使用：
- `cesiumjs-materials-shaders` —— Fabric `Material`、`ImageBasedLighting`、`PostProcessStage`（泛光、SSAO、FXAA、色调映射）。
- `cesiumjs-3d-tiles` —— 通过 `Cesium3DTileStyle` 进行声明式逐要素着色，以及 `VoxelPrimitive` 设置/配置。
- `cesiumjs-models-particles` —— `Model.fromGltfAsync`、动画、`ModelFeature.getProperty()`。

## 不涉及范围

- **实体折线/多边形/墙的 Fabric `Material`** —— 参见 `cesiumjs-materials-shaders`。
- **`PostProcessStage`** 屏幕空间效果 —— 参见 `cesiumjs-materials-shaders`。
- **`ImageBasedLighting`** —— 参见 `cesiumjs-materials-shaders`。
- **`Cesium3DTileStyle`** 声明式 JSON 样式 —— 参见 `cesiumjs-3d-tiles`。**不要在同一 tileset 上与 CustomShader 混用。**
- **在 glTF 中编写 `EXT_structural_metadata` / `EXT_mesh_features`** —— 工具链问题，非运行时。

## 最小示例

```js
import { CustomShader, Model } from "cesium";

const shader = new CustomShader({
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      material.diffuse = vec3(1.0, 0.0, 0.0);
      material.alpha = 0.8;
    }
  `,
});

const model = await Model.fromGltfAsync({ url: "./aircraft.glb", customShader: shader });
viewer.scene.primitives.add(model);
```

## 应用 CustomShader

**Model** —— 构造选项或可变属性：

```js
const model = await Model.fromGltfAsync({ url, customShader });
model.customShader = newShader;     // 热替换
model.customShader = undefined;     // 清除
```

**Cesium3DTileset** —— 构造选项或可变属性。仅影响 `Model` 支持的瓦片内容（不影响原生 I3S 或其他格式）：

```js
const tileset = await Cesium3DTileset.fromUrl(url, { customShader });
tileset.customShader = newShader;
```

> 根据 `Cesium3DTileset.customShader` JSDoc：*"在 `Cesium3DTileStyle` 上使用自定义着色器可能导致未定义行为。"* 该属性也标记为 `@experimental` —— 它使用尚未最终确定的 3D Tiles 规范内容，可能在无标准弃用策略的情况下变更。

**VoxelPrimitive** —— 仅片元子集（参见下方"VoxelPrimitive 着色器子集"）：

```js
const voxelPrimitive = new VoxelPrimitive({ provider, customShader });
```

引擎每帧自动调用 `customShader.update(frameState)`。当完成 CustomShader 使用时，调用 `customShader.destroy()` 以释放其 `TextureManager` 拥有的 GPU 纹理资源。

## 构造器参考

```js
new CustomShader({
  mode,                  // CustomShaderMode —— 默认 MODIFY_MATERIAL
  lightingModel,         // LightingModel —— 若省略，保留模型的默认值
  translucencyMode,      // CustomShaderTranslucencyMode —— 默认 INHERIT
  uniforms,              // { [name]: { type: UniformType, value } } —— 默认 {}
  varyings,              // { [name]: VaryingType } —— 默认 {}
  vertexShaderText,      // string 或 undefined
  fragmentShaderText,    // string 或 undefined
});
```

通常需要 `vertexShaderText` 或 `fragmentShaderText` 其中之一。穷举枚举值参见 `REFERENCE.md`。

## 着色器函数签名

运行时会从生成的管线阶段调用这些函数。参数名称是约定的一部分 —— 重命名会破坏着色器。

```glsl
void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) { ... }
void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) { ... }
```

## Uniforms

使用 `{ type, value }` 声明 uniforms。类型为 `UniformType` 值；JS 值类型必须匹配（例如 `VEC3` → `Cartesian3`）。Uniforms 在 GLSL 中通过声明的名称访问。

```js
import { CustomShader, UniformType, TextureUniform, Cartesian3 } from "cesium";

const shader = new CustomShader({
  uniforms: {
    u_tint:   { type: UniformType.VEC3,      value: new Cartesian3(1.0, 0.5, 0.2) },
    u_time:   { type: UniformType.FLOAT,     value: 0.0 },
    u_detail: { type: UniformType.SAMPLER_2D, value: new TextureUniform({ url: "./detail.png", repeat: true }) },
  },
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      vec3 d = texture(u_detail, fsInput.attributes.texCoord_0).rgb;
      material.diffuse = mix(material.diffuse, u_tint, d.r + 0.1 * sin(u_time));
    }
  `,
});

// 运行时更新。对于 Cartesian/Matrix 值，setUniform 会克隆到现有存储中。
shader.setUniform("u_time", performance.now() / 1000);
```

`TextureUniform` 接受 `url`（字符串或 `Resource`）或 `typedArray` + `width` + `height` —— **仅限其一**（否则构造器抛出异常）。其他选项：`repeat`（默认 `true`）、`pixelFormat`、`pixelDatatype`、`minificationFilter`、`magnificationFilter`、`maximumAnisotropy`。

**`SAMPLER_CUBE` 在 `UniformType` 上声明但在构造时被拒绝** —— 抛出 `DeveloperError("CustomShader does not support samplerCube uniforms")`。仅支持 `SAMPLER_2D`。

## Varyings

声明的 varying 会在顶点着色器中输出为 `out <type> <name>`，在片元着色器中输入为 `in <type> <name>`。在顶点中写入，在片元中读取。

```js
import { CustomShader, VaryingType } from "cesium";

const shader = new CustomShader({
  varyings: { v_worldHeight: VaryingType.FLOAT },
  vertexShaderText: `
    void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
      v_worldHeight = vsInput.attributes.positionMC.z;
    }
  `,
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      float t = clamp(v_worldHeight / 100.0, 0.0, 1.0);
      material.diffuse = mix(vec3(0.2,0.4,0.8), vec3(1.0,0.8,0.2), t);
    }
  `,
});
```

`VaryingType` 支持 `FLOAT`、`VEC2`–`VEC4`、`MAT2`–`MAT4`。不支持 `INT`/`BOOL`/`SAMPLER` 变体。

## 模式与光照

**`CustomShaderMode`：**
- `MODIFY_MATERIAL`（默认）—— 在材质阶段之后、光照之前运行。`czm_modelMaterial` 已填充 PBR/纹理结果；着色器进行细化调整。
- `REPLACE_MATERIAL` —— 完全跳过材质阶段。着色器程序化设置每个字段。当不需要源材质时性能更优。

**`LightingModel`：**
- `UNLIT` —— 跳过光照；`material.diffuse` 直接作为最终颜色（仍应用透明度）。平面着色。
- `PBR` —— 基于物理的渲染，在有 IBL 时使用。
- *省略* —— 保留模型的默认光照。除非有意覆盖，否则省略。

配对使用 `REPLACE_MATERIAL` + `UNLIT` 实现纯程序化平面着色（无材质采样，无光照）。

## 透明度

`CustomShaderTranslucencyMode` 控制 alpha 写入如何与渲染通道交互：

- `INHERIT`（默认）—— 仅当源材质为半透明时才处理 alpha。
- `OPAQUE` —— 强制不透明通道。
- `TRANSLUCENT` —— 强制半透明通道。

**陷阱：** 在不透明模型上使用 `INHERIT` 模式写入 `material.alpha` 会静默无效。设置 `translucencyMode: CustomShaderTranslucencyMode.TRANSLUCENT` 以使 alpha 写入生效。参见 `examples/04-translucent-override.js`。

## Attributes

`vsInput.attributes` 和 `fsInput.attributes` 暴露 glTF 顶点属性。名称区分大小写且需要坐标空间后缀 —— 构造器拒绝裸的 `position`/`normal`/`tangent`/`bitangent`。

常见字段（完整表格见 `REFERENCE.md`）：
- `positionMC` —— 模型坐标，在 VS 和 FS 中均有效
- `positionWC` —— 世界（ECEF）坐标，**仅片元**，低精度
- `positionEC` —— 眼坐标，**仅片元**
- `normalMC` / `normalEC` —— 顶点 / 片元
- `tangentMC` / `tangentEC`、`bitangentMC` / `bitangentEC`
- `texCoord_N`、`color_N`、`joints_N`、`weights_N`

> **坐标空间验证。** 构造器扫描着色器文本，对无效组合抛出 `DeveloperError("<name> is not available in the <stage> shader. Did you mean <alt> instead?")`。例如：顶点中的 `positionEC`、片元中的 `normalMC`。

自定义下划线前缀的 glTF 属性（`_FEATURE_ID_0`、`_SURFACE_TEMP`）会转为小写并去除前缀：`fsInput.attributes.surface_temp`。

## FeatureIds

`vsInput.featureIds` / `fsInput.featureIds` 将三个 glTF 来源统一为一个结构体：

- `featureId_N` —— 来自 `EXT_mesh_features` 的要素 ID 属性和隐式属性（N 是图元 `featureIds` 数组中的索引）。也包括要素 ID **纹理**，仅片元着色器可用。
- `instanceFeatureId_N` —— 来自 `EXT_instance_features` + `EXT_mesh_gpu_instancing` 的逐实例要素 ID。
- 命名别名 —— 如果 glTF 指定了 `"label": "perVertex"`，则 `featureIds.perVertex` 也可用。
- 遗留 3D Tiles 1.0 `BATCH_ID` / `_BATCHID` —— 透明重命名为 `featureId_0`。

GLSL 类型始终为 `int`。WebGL 1 在 2^24 以上会丢失精度。

```glsl
void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
  int id = fsInput.featureIds.featureId_0;
  if (id == 0)      material.diffuse = vec3(1.0, 0.2, 0.2);  // 屋顶
  else if (id == 1) material.diffuse = vec3(0.2, 0.8, 0.2);  // 墙
}
```

参见 `examples/03-feature-id-tileset.js`。

## Metadata

`EXT_structural_metadata` 提供三种来源类型（自 1.139 起均可从着色器寻址）：

- **属性属性（Property attributes）** —— 逐顶点。顶点和片元着色器。
- **属性纹理（Property textures）** —— 逐纹素。**仅片元。**
- **属性表（Property tables）** —— 逐要素，由要素 ID 键控。**在 1.139 (#13124) 中添加。**

```glsl
void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
  float t = fsInput.metadata.temperature;
  float tMin = fsInput.metadataStatistics.temperature.minValue;
  float tMax = fsInput.metadataStatistics.temperature.maxValue;
  float v = (t - tMin) / (tMax - tMin);
  material.diffuse = vec3(v, 0.0, 1.0 - v);
}
```

**属性 ID 清理**（GLSL 标识符规则）：
- 非字母数字序列 → 单个 `_`（`temperature ℃` → `temperature_`）
- 前导 `gl_` 去除（`gl_custom` → `custom`）
- 前导数字前缀 `_`（`12345` → `_12345`）
- 清理后冲突 → 未定义行为

**兄弟结构体：** `metadataClass.<prop>.noData | defaultValue | minValue | maxValue`（类模式边界）和 `metadataStatistics.<prop>.minValue | maxValue | mean | median | standardDeviation | variance | sum`（仅当 `tileset.json` 声明了 `statistics` 时填充）。

> **1.139 破坏性变更 (#13135)：** 无符号整数元数据不再转换为有符号整数。将 `UINT` 属性赋值给 GLSL `int`（`int x = fsInput.metadata.myUint;`）不再能编译。请使用匹配的无符号类型。

**`.glb` 上未携带 `EXT_structural_metadata` 的公开资源很少** —— 大多数真实世界元数据存在于 3D Tiles 上。参见 `examples/06-metadata-ramp.js`（Cesium3DTileset 目标）。

## czm_modelVertexOutput 与 czm_modelMaterial

**`czm_modelVertexOutput`**（顶点着色器的 `inout vsOutput`）：
```glsl
struct czm_modelVertexOutput {
  vec3 positionMC;    // 初始化为 vsInput.attributes.positionMC
  float pointSize;    // 覆盖 gl_PointSize 和 Cesium3DTileStyle 点大小
};
```

> **注意：** 修改 `positionMC` 会位移顶点，但**不会**更新图元的包围球。大量位移的顶点可能被视锥体裁剪。

**`czm_modelMaterial`**（片元着色器的 `inout material`）。所有颜色为线性 RGB。条件字段 `specularWeight` / `anisotropic*` / `clearcoatFactor`... 仅当图元上激活了 `KHR_materials_specular` / `_anisotropy` / `_clearcoat` 时出现（完整 `#ifdef` 守卫结构体见 `REFERENCE.md`）：

```glsl
struct czm_modelMaterial {
  vec4 baseColor; vec3 diffuse; float alpha;
  vec3 specular;  float roughness;
  vec3 normalEC;  float occlusion;  vec3 emissive;
  // + 条件性 PBR 扩展字段
};
```

## 内置 `czm_*` 自动 uniforms

无需声明即可使用。对 CustomShader 最有用：`czm_frameNumber`、`czm_pi`、`czm_model`、`czm_view`、`czm_projection`、`czm_modelView`、`czm_normal`、`czm_lightDirectionEC`、`czm_sunDirectionWC`、`czm_eyeHeight`、`czm_sceneMode`、`czm_viewerPositionWC`、`czm_splitPosition`。完整目录见 `REFERENCE.md`。

## VoxelPrimitive 着色器子集

仅片元。在视线方向上的每个光线步进步骤执行；最终像素合成所有步进结果。提供 `vertexShaderText` 会被静默忽略。

减少的结构体可用性：
- `fsInput.attributes` —— 仅 `positionEC` 和 `normalEC`。
- `fsInput.featureIds` —— **不存在**。
- `fsInput.metadata` —— 完全支持。
- `fsInput.metadataClass` —— **不存在**。
- `fsInput.metadataStatistics` —— 仅 `minValue` 和 `maxValue`。

设置 `customShader = undefined` 会回退到 `VoxelPrimitive.DefaultCustomShader`。参见 `examples/07-voxel-shader.js`。有关 `VoxelPrimitive` 设置（provider、shape、modelMatrix、nearestSampling），请参见 `cesiumjs-3d-tiles`。

> **1.130 破坏性变更 (#12636)：** `fsInput.voxel.positionUv | positionShapeUv | positionLocal` 已被移除。请改用 `fsInput.attributes.positionEC`。`fsInput.voxel.surfaceNormal` → `fsInput.attributes.normalEC`。

## 常见模式

| 文件 | 目标 | 演示内容 |
|---|---|---|
| `examples/01-diffuse-tint.js` | Model | 时间 uniform 驱动 `material.diffuse` |
| `examples/02-texture-swap.js` | Model | `TextureUniform`、`SAMPLER_2D`、`setUniform` |
| `examples/03-feature-id-tileset.js` | Cesium3DTileset | `fsInput.featureIds.featureId_0` 分类着色 |
| `examples/04-translucent-override.js` | Model（不透明源） | `CustomShaderTranslucencyMode.TRANSLUCENT` |
| `examples/05-vertex-displacement.js` | Model | `vsOutput.positionMC` + 法线偏移 |
| `examples/06-metadata-ramp.js` | Cesium3DTileset | `fsInput.metadata.<prop>` + `metadataStatistics` 归一化 |
| `examples/07-voxel-shader.js` | VoxelPrimitive | 仅 FS 子集，逐体素元数据 |

## CesiumJS 1.139 版本说明

逐字来自上游 `CHANGES.md`：

**破坏性变更（1.139, #13135）：**
> 依赖 `EXT_structural_metadata` 扩展派生元数据的自定义着色器不再将无符号整数元数据类型转换为有符号整数。任何将 UINT 类型元数据赋值给本地整数的自定义着色器（例如 `int myMetadata = vsInput.metadata.myUintMetadata`）将不再编译。

**破坏性变更（1.139, #13170）：** 修复了在自定义片元着色器中访问点云属性的精度问题。

**新增（1.139, #13124）：** 可从属性表访问元数据（之前仅属性和纹理）。

**新增（1.139, #13135）：** 通过属性纹理支持更多元数据类型。

**修复（1.139, #13231）：** 元数据变量正则表达式扩展至 `metadataClass` 和 `metadataStatistics`。

**修复（1.139.1, #13247）：** NGA-GPM 局部扩展 + 自定义着色器回归修复。

**破坏性变更（1.130, #12636）：** Voxel `FragmentInput` 重构（参见 VoxelPrimitive 章节）。

**前瞻（1.140）：** #13258 当类定义携带属性时，停止在缺少元数据的图元上禁用自定义着色器；#13323 通过向下转换添加有限的双精度元数据支持。两者在 1.139 中均不可用。

## 注意事项与陷阱

1. **需要坐标空间后缀。** 顶点中的 `positionEC`、片元中的 `normalMC` 或任何裸 `position`/`normal`/`tangent`/`bitangent` 会在构造时抛出 `DeveloperError` 并提示替代名称。
2. **`positionMC` 在片元着色器中有效** —— 尽管有 `MC` 后缀。仅 `normalMC`/`tangentMC`/`bitangentMC` 在 FS 中被拒绝。
3. **顶点位移不会更新包围球。** 位移后的顶点可能意外被视锥体裁剪。
4. **`Cesium3DTileStyle` + CustomShader = 未定义行为。** 根据上游 JSDoc。每个 tileset 选择其一。
5. **`SAMPLER_CUBE` 在构造时被拒绝。** 仅使用 `SAMPLER_2D`。
6. **参数名称约定。** `vsInput`、`vsOutput`、`fsInput`、`material` 通过正则表达式扫描 —— 重命名会破坏代码生成。
7. **`TextureUniform` URL 与 typedArray 二选一。** 同时提供或都不提供会抛出异常。`typedArray` 需要 `width` + `height`。
8. **在不透明模型上的 alpha 写入在 `INHERIT` 下被静默忽略。** 设置 `translucencyMode: TRANSLUCENT`。
9. **需要调用 `customShader.destroy()`。** 在销毁持有纹理 uniform 的着色器时调用 —— 否则其 `TextureManager` 会泄漏 GPU 资源。
10. **`vsOutput.pointSize` 会覆盖 `Cesium3DTileStyle` 的点大小。** 除非有意为之，否则不要设置。
11. **元数据属性 ID 会被清理。** 非字母数字 → `_`；前导 `gl_` 去除；冲突为未定义行为。
12. **UINT 元数据现在保留有符号性（1.139+, #13135）。** 使用 `uint x = fsInput.metadata.prop;`，而不是 `int x = ...`。
13. **`Cesium3DTileset` 上的 `customShader` 是 `@experimental`。** 可能在无标准弃用策略的情况下变更。
14. **Tileset：仅 `Model` 支持的瓦片内容使用 CustomShader。** 原生 I3S 和其他格式不受影响。

## 性能提示

- `REPLACE_MATERIAL` 跳过材质阶段（不采样纹理、PBR 输入）。
- `LightingModel.UNLIT` 跳过光照计算 —— 与 `REPLACE_MATERIAL` 结合实现纯程序化平面着色。
- 在顶点中写入 varyings 而非在片元中重新计算。
- 避免每帧 `setUniform` 设置 `SAMPLER_2D` —— 会触发异步纹理重新加载。使用 `url` 一次并持有引用。
- 在销毁时调用 `customShader.destroy()` 以释放 GPU 纹理资源。

## 参见

- **`REFERENCE.md`** —— 完整结构体表格（`Attributes`、`FeatureIds`、`Metadata`/`Class`/`Statistics`）、枚举值表格、内置 `czm_*` uniform 目录、坐标空间验证错误参考。
- **`examples/`** —— 七个经过编译测试的代码片段。`examples/_sandcastle-template.html` 是内部脚手架；`examples/README.md` 记录了布局。
- **`cesiumjs-materials-shaders`** —— Fabric `Material`、`ImageBasedLighting`、`PostProcessStage`。
- **`cesiumjs-3d-tiles`** —— `Cesium3DTileStyle`、`Cesium3DTileset` 设置、`VoxelPrimitive` 实例化。
- **`cesiumjs-models-particles`** —— `Model.fromGltfAsync`、`ModelFeature.getProperty()`、动画。
- **`cesiumjs-primitives`** —— 经典 Primitive 几何体的 Appearances 上的 Fabric。
- **CesiumJS Custom Shader 指南** —— `CesiumGS/cesium` `main` 分支上的 `Documentation/CustomShaderGuide/README.md`。
