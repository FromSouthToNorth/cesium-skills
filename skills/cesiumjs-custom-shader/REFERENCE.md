# CustomShader 参考

`cesiumjs-custom-shader` 技能的穷举结构体/枚举表及内置 uniform 目录。数据来源：截至 2026-04-21（v1.141 顶端）的 CesiumGS/cesium `main` 分支，目标为 CesiumJS 1.139 公开 API。

---

## Attributes 结构体

根据 glTF 属性为每个图元自动生成。通过 `vsInput.attributes.<name>` 或 `fsInput.attributes.<name>` 访问。

| glTF 属性 | 着色器字段 | GLSL 类型 | 顶点 | 片元 | 说明 |
|---|---|---|---|---|---|---|
| `POSITION` | `positionMC` | `vec3` | 是 | 是 | 模型坐标 |
| `POSITION` | `positionWC` | `vec3` | — | 是 | 世界（ECEF）坐标，低精度 |
| `POSITION` | `positionEC` | `vec3` | — | 是 | 眼坐标 |
| `NORMAL` | `normalMC` | `vec3` | 是 | — | 单位法线，模型坐标 |
| `NORMAL` | `normalEC` | `vec3` | — | 是 | 单位法线，眼坐标 |
| `TANGENT` | `tangentMC` | `vec3` | 是 | — | 双切线计算后 `w` 被剥离 |
| `TANGENT` | `tangentEC` | `vec3` | — | 是 | 同上，眼空间 |
| `NORMAL` + `TANGENT` | `bitangentMC` | `vec3` | 是 | — | 仅当 N + T 同时存在 |
| `NORMAL` + `TANGENT` | `bitangentEC` | `vec3` | — | 是 | 同上 |
| `TEXCOORD_N` | `texCoord_N` | `vec2` | 是 | 是 | N = 0, 1, 2, … |
| `COLOR_N` | `color_N` | `vec4` | 是 | 是 | 缺失时 Alpha 默认为 1 |
| `JOINTS_N` | `joints_N` | `ivec4` | 是 | 是 | 蒙皮关节索引 |
| `WEIGHTS_N` | `weights_N` | `vec4` | 是 | 是 | 蒙皮权重 |

**自定义下划线前缀属性。** 以 `_` 开头的 glTF 属性会转为小写并去除前缀：`_SURFACE_TEMPERATURE` → `fsInput.attributes.surface_temperature`。

**缺失时的回退。** 如果图元缺少请求的属性（例如没有 `TEXCOORD_0`），运行时会合成默认值，或者在没有合理默认值时，仅对该图元禁用自定义着色器阶段。同一模型/瓦片中的其他图元继续使用着色器。

---

## 坐标空间验证错误

`CustomShader` 构造器扫描着色器文本，对不明确或错误阶段的属性名称抛出 `DeveloperError`。错误格式：

> `<name>（<坐标空间>）在<阶段>着色器中不可用。您是指<替代名称>（<坐标空间>）吗？`

后缀展开：`MC` → "（模型坐标）"、`WC` → "（笛卡尔世界坐标）"、`EC` → "（眼坐标）"。裸名称不展开。

| 名称 | 被拒绝在 | 建议替代 |
|---|---|---|
| `position` | 顶点 | `positionMC` |
| `position` | 片元 | `positionEC` |
| `normal` | 顶点 | `normalMC` |
| `normal` | 片元 | `normalEC` |
| `tangent` | 顶点 | `tangentMC` |
| `tangent` | 片元 | `tangentEC` |
| `bitangent` | 顶点 | `bitangentMC` |
| `bitangent` | 片元 | `bitangentEC` |
| `positionWC` | 顶点 | `positionMC` |
| `positionEC` | 顶点 | `positionMC` |
| `normalEC` | 顶点 | `normalMC` |
| `tangentEC` | 顶点 | `tangentMC` |
| `bitangentEC` | 顶点 | `bitangentMC` |
| `normalMC` | 片元 | `normalEC` |
| `tangentMC` | 片元 | `tangentEC` |
| `bitangentMC` | 片元 | `bitangentEC` |

**注意：** `positionMC` **不会**在片元着色器中被拒绝 —— 它在两个阶段中都有效。

---

## 枚举

### CustomShaderMode
冻结字符串枚举。字符串值直接用于 `CUSTOM_SHADER_<MODE>` GLSL 定义。

| JS 常量 | 字符串值 | 管线 |
|---|---|---|
| `MODIFY_MATERIAL`（默认） | `"MODIFY_MATERIAL"` | 材质 → 自定义着色器 → 光照 |
| `REPLACE_MATERIAL` | `"REPLACE_MATERIAL"` | 自定义着色器 → 光照（跳过材质阶段） |

### LightingModel
冻结数值枚举。从构造器省略时，保留模型的默认光照。

| JS 常量 | 值 | 行为 |
|---|---|---|
| `UNLIT` | `0` | 跳过光照；`material.diffuse` 直接用作输出（仍应用透明度） |
| `PBR` | `1` | 在有 IBL 时基于物理渲染 |

### CustomShaderTranslucencyMode
冻结数值枚举。默认为 `INHERIT`。

| JS 常量 | 值 | 效果 |
|---|---|---|
| `INHERIT` | `0` | 遵循源材质的半透明设置 |
| `OPAQUE` | `1` | 强制不透明渲染通道 |
| `TRANSLUCENT` | `2` | 强制半透明渲染通道 |

### UniformType
冻结字符串枚举。字符串值为 GLSL 类型名称。

| JS 常量 | GLSL 类型 | JS 值类型 |
|---|---|---|
| `FLOAT` | `float` | `Number` |
| `VEC2` | `vec2` | `Cartesian2` |
| `VEC3` | `vec3` | `Cartesian3` |
| `VEC4` | `vec4` | `Cartesian4` |
| `INT` | `int` | `Number` |
| `INT_VEC2` | `ivec2` | `Cartesian2` |
| `INT_VEC3` | `ivec3` | `Cartesian3` |
| `INT_VEC4` | `ivec4` | `Cartesian4` |
| `BOOL` | `bool` | `Boolean` |
| `BOOL_VEC2` | `bvec2` | `Cartesian2` |
| `BOOL_VEC3` | `bvec3` | `Cartesian3` |
| `BOOL_VEC4` | `bvec4` | `Cartesian4` |
| `MAT2` | `mat2` | `Matrix2` |
| `MAT3` | `mat3` | `Matrix3` |
| `MAT4` | `mat4` | `Matrix4` |
| `SAMPLER_2D` | `sampler2D` | `TextureUniform` |
| `SAMPLER_CUBE` | `samplerCube` | **被拒绝** —— 构造时抛出 `DeveloperError("CustomShader does not support samplerCube uniforms")` |

### VaryingType
冻结字符串枚举。仅浮点类型。

| JS 常量 | GLSL 类型 |
|---|---|
| `FLOAT` | `float` |
| `VEC2` | `vec2` |
| `VEC3` | `vec3` |
| `VEC4` | `vec4` |
| `MAT2` | `mat2` |
| `MAT3` | `mat3` |
| `MAT4` | `mat4` |

---

## TextureUniform 选项

```js
new TextureUniform({
  url,                 // string | Resource —— 与 typedArray 互斥
  typedArray,          // Uint8Array —— 与 url 互斥
  width, height,       // 使用 typedArray 时必须
  pixelFormat,         // 默认 PixelFormat.RGBA
  pixelDatatype,       // 默认 PixelDatatype.UNSIGNED_BYTE
  repeat,              // 默认 true → REPEAT；false → CLAMP_TO_EDGE（两个轴）
  minificationFilter,  // 默认 LINEAR
  magnificationFilter, // 默认 LINEAR
  maximumAnisotropy,   // 默认 1.0
});
```

**构造错误：**
- `"必须恰好定义 options.typedArray、options.url 中的一个"`
- `"定义 options.typedArray 时必须同时提供 options.width 和 options.height"`

纹理内存使用行主序存储，采用 WebGL 的自底向上 Y 约定。

---

## FeatureIds 结构体

根据图元的 `featureIds` 数组自动生成。所有值为 GLSL `int`（非 `uint`）。

| 访问方式 | 来源 | 说明 |
|---|---|---|
| `featureId_N` | `EXT_mesh_features` 属性或隐式 | `N` 是 `featureIds` 数组中的位置 |
| `featureId_N` | `EXT_mesh_features` 要素 ID 纹理 | **仅片元着色器** |
| `<label>` | 带有 `"label": "..."` 的 `EXT_mesh_features` | `featureId_N` 的别名，例如 `featureIds.perVertex` |
| `featureId_0` | 3D Tiles 1.0 `BATCH_ID` / `_BATCHID` | 遗留批次 ID 透明映射 |
| `instanceFeatureId_N` | `EXT_instance_features` + `EXT_mesh_gpu_instancing` | 逐实例；实例级别无要素 ID 纹理 |
| `featureId_N` | 遗留 `EXT_feature_metadata` | 串联的 `featureIdAttributes` 和 `featureIdTextures` 数组 |

**WebGL 1 精度：** 通过浮点后备，整数精度为 24 位；ID 超过 2^24（约 1600 万）会丢失精度。WebGL 2 允许 `uint` 但 CustomShader 不暴露它。

---

## Metadata 结构体

可通过 `vsInput.metadata.<prop>` 和 `fsInput.metadata.<prop>` 寻址。1.139 中支持的来源：

1. **属性属性（Property attributes）** —— 逐顶点（顶点和片元）。
2. **属性纹理（Property textures）** —— 逐纹素（**仅片元**）。
3. **属性表（Property tables）** —— 逐要素，由要素 ID 键控（在 1.139 中通过 #13124 添加）。

### 类型支持矩阵

| 元数据类型 | WebGL 1 | WebGL 2 |
|---|---|---|
| `UINT8`（标量/向量） | 支持 | 支持 |
| 其他整数类型（`INT8`、`INT16`、`UINT16`、`INT32`、`UINT32`） | 不支持 | 支持（1.139 后保留有符号性） |
| `FLOAT32` | 有限支持 | 支持 |
| `FLOAT64`、`INT64`、`UINT64` | 1.139 中不可用 | 1.139 中不可用（1.140 中通过 #13323 添加向下转换支持） |
| `BOOLEAN` | — | — |
| `STRING` | — | — |
| `ENUM` | 支持（作为整数） | 支持 |
| 变长数组 | — | — |
| 矩阵类型 | — | — |
| 大于 4 字节的项 | — | — |

### 归一化值 + 偏移/缩放

如果类模式声明了 `"normalized": true`，则值在着色器中作为 `float`（或浮点向量）到达，范围为 `[0, 1]`（无符号）或 `[-1, 1]`（有符号）。如果还声明了 `offset` 和 `scale`，则它们在**归一化之后**应用：存储为 UINT32，带有 `normalized: true, offset: 32, scale: 180` 时，作为 `[32, 212]` 范围内的浮点数到达。

### 属性 ID 清理

GLSL 标识符受限。处理流程：

1. 非字母数字序列折叠为单个 `_`。
2. 前导 `gl_` 前缀被去除（GLSL 保留）。
3. 如果结果以数字开头，前缀 `_`。

| 源名称 | 清理后 | 访问方式 |
|---|---|---|
| `temperature ℃` | `temperature_` | `fsInput.metadata.temperature_` |
| `custom__property` | `custom_property` | `fsInput.metadata.custom_property` |
| `gl_customProperty` | `customProperty` | `fsInput.metadata.customProperty` |
| `12345` | `_12345` | `fsInput.metadata._12345` |
| `temperature ℃` + `temperature ℉` | 均变为 `temperature_` | **未定义行为（冲突）** |
| `✖️✖️✖️` | 空字符串 | **未定义行为** |

### 1.139 破坏性变更 (#13135)

无符号整数元数据不再转换为有符号 `int`。使用 `int x = fsInput.metadata.myUintProperty;` 的现有着色器在 1.139 中停止编译。请切换到匹配的无符号类型（例如 `uint x = ...;`）或显式转换。

---

## MetadataClass 结构体

每个属性对应一个子结构体。通过 `vsInput.metadataClass.<prop>.<field>` 访问。

| 字段 | 类型 | 描述 |
|---|---|---|
| `noData` | 与属性相同 | 表示无数据的值 |
| `defaultValue` | 与属性相同 | 默认值（GLSL 保留了 `default`——字段名为 `defaultValue`） |
| `minValue` | 与属性相同 | 模式声明的最小值（GLSL 保留了 `min`——字段名为 `minValue`） |
| `maxValue` | 与属性相同 | 模式声明的最大值 |

名为 `temperature` 的 `FLOAT32` 属性的 GLSL 示例：
```glsl
struct floatMetadataClass {
  float noData; float defaultValue; float minValue; float maxValue;
};
struct MetadataClass { floatMetadataClass temperature; };
// 访问：vsInput.metadataClass.temperature.minValue
```

---

## MetadataStatistics 结构体

仅当父 tileset 的 `tileset.json` 携带了 `statistics` 对象时才填充。通过 `fsInput.metadataStatistics.<prop>.<field>` 访问。

| 字段 | 类型 | 描述 |
|---|---|---|
| `minValue` | 与属性相同 | 观测到的最小值 |
| `maxValue` | 与属性相同 | 观测到的最大值 |
| `median` | 与属性相同 | 中位数 |
| `sum` | 与属性相同 | 总和 |
| `mean` | 同维度的浮点 | 平均值 |
| `standardDeviation` | 同维度的浮点 | 标准差 σ |
| `variance` | 同维度的浮点 | 方差 σ² |

枚举属性说明：`occurrence` 字段在 TODO 中有文档记录（1.139 中尚未实现）。

---

## czm_modelVertexOutput

来源：`packages/engine/Source/Shaders/Builtin/Structs/modelVertexOutput.glsl`。

```glsl
struct czm_modelVertexOutput {
  vec3 positionMC;    // 初始化为 vsInput.attributes.positionMC。修改以位移顶点。
  float pointSize;    // 覆盖点图元的 gl_PointSize；覆盖 Cesium3DTileStyle 的点大小。
};
```

没有 `#ifdef` 守卫的字段。

**注意：** 修改 `positionMC` **不会**更新图元的包围球。大量位移的顶点即使在视觉上位于屏幕上也可能被视锥体裁剪。

---

## czm_modelMaterial

来源：`packages/engine/Source/Shaders/Builtin/Structs/modelMaterial.glsl`。

```glsl
struct czm_modelMaterial {
  vec4 baseColor;      // 材质的基色。
  vec3 diffuse;        // 均匀散射的入射光。
  float alpha;         // 0.0 完全透明，1.0 完全不透明。
  vec3 specular;       // f0 —— 法线入射时的反射光（PBR）。
  float roughness;     // 0.0 光泽，1.0 粗糙。
  vec3 normalEC;       // 眼坐标中的表面法线（用于法线映射）。
  float occlusion;     // 环境光遮蔽（1.0 完全照亮，0.0 完全遮蔽）。
  vec3 emissive;       // 向所有方向均匀发射的光。
#ifdef USE_SPECULAR
  float specularWeight;
#endif
#ifdef USE_ANISOTROPY
  vec3 anisotropicT;
  vec3 anisotropicB;
  float anisotropyStrength;
#endif
#ifdef USE_CLEARCOAT
  float clearcoatFactor;
  float clearcoatRoughness;
  vec3 clearcoatNormal;
  // 实现 KHR_materials_ior 时添加 clearcoatF0
#endif
};
```

**所有颜色值均为线性 RGB** —— 包括 `UNLIT` 着色器。除非 `scene.highDynamicRange === true`，否则 sRGB 转换在管线后发生。

条件字段仅当图元上激活了相应的 glTF 扩展时出现：`KHR_materials_specular` → `USE_SPECULAR`、`KHR_materials_anisotropy` → `USE_ANISOTROPY`、`KHR_materials_clearcoat` → `USE_CLEARCOAT`。不要无条件依赖这些字段。

---

## 内置 czm_* 自动 uniforms

无需声明即可在自定义着色器中使用。完整列表位于 `packages/engine/Source/Renderer/AutomaticUniforms.js`。对 CustomShader 最有用的子集：

### 帧与动画
`czm_frameNumber`、`czm_morphTime`、`czm_pixelRatio`、`czm_pass`、`czm_passTranslucent`

### 矩阵
`czm_model`、`czm_inverseModel`、`czm_view`、`czm_inverseView`、`czm_view3D`、`czm_inverseView3D`、`czm_projection`、`czm_inverseProjection`、`czm_infiniteProjection`、`czm_modelView`、`czm_modelView3D`、`czm_inverseModelView`、`czm_inverseModelView3D`、`czm_modelViewProjection`、`czm_modelViewProjectionRelativeToEye`、`czm_modelViewRelativeToEye`、`czm_viewProjection`、`czm_inverseViewProjection`、`czm_normal`、`czm_normal3D`、`czm_inverseNormal`、`czm_inverseNormal3D`、`czm_modelToWindowCoordinates`、`czm_enuToModel`、`czm_modelToEnu`、`czm_viewportTransformation`

### 视口与相机
`czm_viewport`、`czm_viewerPositionWC`、`czm_encodedCameraPositionMCHigh`、`czm_encodedCameraPositionMCLow`、`czm_eyeHeight`、`czm_eyeHeight2D`、`czm_currentFrustum`、`czm_entireFrustum`、`czm_frustumPlanes`、`czm_globeDepthTexture`、`czm_packDepth`、`czm_unpackDepth`、`czm_orthographicIn3D`

### 场景模式
`czm_sceneMode`、`czm_sceneMode2D`、`czm_sceneMode3D`、`czm_sceneModeColumbusView`、`czm_sceneModeMorphing`、`czm_columbusViewMorph`

### 光照与环境
`czm_lightColor`、`czm_lightColorHdr`、`czm_lightDirectionEC`、`czm_lightDirectionWC`、`czm_sunDirectionEC`、`czm_sunDirectionWC`、`czm_sunPositionWC`、`czm_moonDirectionEC`、`czm_environmentMap`、`czm_specularEnvironmentMaps`、`czm_specularEnvironmentMapsMaximumLOD`、`czm_sphericalHarmonicCoefficients`、`czm_brdfLut`、`czm_gamma`、`czm_backgroundColor`

### 大气与雾
`czm_atmosphereAnisotropy`、`czm_atmosphereDynamicLighting`、`czm_atmosphereHsbShift`、`czm_atmosphereLightIntensity`、`czm_atmosphereMieAnisotropy`、`czm_atmosphereMieCoefficient`、`czm_atmosphereMieScaleHeight`、`czm_atmosphereRayleighCoefficient`、`czm_atmosphereRayleighScaleHeight`、`czm_fog`、`czm_fogDensity`、`czm_fogMinimumBrightness`、`czm_fogVisualDensityScalar`

### 椭球体
`czm_ellipsoidRadii`、`czm_ellipsoidInverseRadii`、`czm_eyeEllipsoidCurvature`、`czm_eyeEllipsoidNormalEC`

### 后处理与分割
`czm_edgeColorTexture`、`czm_edgeDepthTexture`、`czm_edgeIdTexture`、`czm_invertClassificationColor`、`czm_splitPosition`、`czm_geometricToleranceOverMeter`

### 数学常量
`czm_pi`、`czm_twoPi`、`czm_piOverTwo`、`czm_piOverThree`、`czm_piOverFour`、`czm_piOverSix`、`czm_oneOverPi`、`czm_oneOverTwoPi`、`czm_radiansPerDegree`、`czm_degreesPerRadian`、`czm_epsilon1`..`czm_epsilon7`

内置 GLSL 函数的完整库位于 `packages/engine/Source/Shaders/Builtin/Functions/`。

---

## CustomShader 公开 API 表面

构造器：参见技能 SKILL.md § "构造器参考"。

公开实例方法：

| 方法 | 描述 |
|---|---|
| `setUniform(name, value)` | 更新声明的 uniform。Cartesian/Matrix 值通过 `value.clone(uniform.value)` 克隆到现有存储中。`SAMPLER_2D` 值通过内部 `TextureManager` 触发异步纹理重新加载。如果 `name` 未声明则抛出 `DeveloperError`。 |
| `update(frameState)` | 由 `Model` / `Cesium3DTileset` / `VoxelPrimitive` 每帧调用。应用程序不直接调用此方法。 |
| `isDestroyed()` | `destroy()` 后返回 `true`；否则返回 `false`。 |
| `destroy()` | 释放 `TextureManager` 及其 GPU 资源。在丢弃拥有纹理 uniform 的 CustomShader 时调用。 |

只读实例字段：`mode`、`lightingModel`、`translucencyMode`、`uniforms`、`varyings`、`vertexShaderText`、`fragmentShaderText`、`uniformMap`（管线阶段的私有连接）。

---

## 变量使用检测正则表达式

`CustomShader` 扫描用户着色器文本以预先计算哪些属性/要素 ID/元数据/材质字段被引用。正则表达式（来自 `findUsedVariables`）：

```
[vf]sInput\.attributes\.(\w+)
[vf]sInput\.featureIds\.(\w+)
[vf]sInput\.(?:metadata|metadataClass|metadataStatistics)\.(\w+)
material\.(\w+)
```

通过别名局部变量访问这些结构体会绕过检测 —— 优化将不会包含该字段，且着色器可能在链接时失败。直接访问 `vsInput`/`fsInput`/`material`，而不是通过局部引用传递它们。

---

## 源材料

本参考中的所有内容均来自以下 `main` 分支文件：

- `packages/engine/Source/Scene/Model/CustomShader.js`
- `packages/engine/Source/Scene/Model/CustomShaderMode.js`
- `packages/engine/Source/Scene/Model/CustomShaderTranslucencyMode.js`
- `packages/engine/Source/Scene/Model/LightingModel.js`
- `packages/engine/Source/Scene/Model/UniformType.js`
- `packages/engine/Source/Scene/Model/VaryingType.js`
- `packages/engine/Source/Scene/Model/TextureUniform.js`
- `packages/engine/Source/Shaders/Builtin/Structs/modelMaterial.glsl`
- `packages/engine/Source/Shaders/Builtin/Structs/modelVertexOutput.glsl`
- `packages/engine/Source/Renderer/AutomaticUniforms.js`
- `packages/engine/Source/Scene/Cesium3DTileset.js`（`@experimental` + 样式交互 JSDoc）
- `Documentation/CustomShaderGuide/README.md`（规范指南）
- `CHANGES.md`（版本说明）
