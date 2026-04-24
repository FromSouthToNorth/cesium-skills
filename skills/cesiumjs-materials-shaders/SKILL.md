---
name: cesiumjs-materials-shaders
description: "CesiumJS 材质与后处理 — Material、Fabric JSON、MaterialAppearance、ImageBasedLighting、PostProcessStage、PostProcessStageLibrary、泛光、景深、环境光遮蔽、FXAA、色调映射、BlendingState。在为实体或图元定义 Fabric 材质、配置基于 PBR 的图像照明或添加屏幕空间后处理效果时使用。"
---
# CesiumJS 材质、着色器与后处理

版本基线：CesiumJS 1.139（2026 年 3 月）。所有导入使用 ES 模块风格。

## Material 系统（Fabric JSON）

`Material` 通过名为 Fabric 的 JSON 模式为**图元**定义表面外观。材质编译为 GLSL，由 `MaterialAppearance` 或 `PolylineMaterialAppearance` 使用。

### 内置材质类型

**表面：** `Color`（颜色）、`Image`（图像、重复）、`DiffuseMap`、`AlphaMap`、`SpecularMap`、`EmissionMap`（图像、通道、重复）、`BumpMap`、`NormalMap`（图像、通道、强度、重复）。

**图案：** `Grid`（颜色、单元格透明度、线条数、线条粗细）、`Stripe`（偶色、奇色、重复）、`Checkerboard`（亮色、暗色、重复）、`Dot`（亮色、暗色、重复）。

**效果：** `Water`（基础水色、法线贴图、频率、动画速度）、`RimLighting`（颜色、边缘颜色、宽度）、`Fade`（淡入颜色、淡出颜色、最大距离）。

**地形：** `ElevationContour`（颜色、间距、宽度）、`ElevationRamp`（图像、最小高度、最大高度）。

**折线：** `PolylineArrow`（颜色）、`PolylineDash`（颜色、间隙颜色、虚线长度、虚线图案）、`PolylineGlow`（颜色、发光强度、锥形强度）、`PolylineOutline`（颜色、轮廓颜色、轮廓宽度）。

### 创建材质

```js
import { Material, Color, Cartesian2 } from "cesium";

// 使用 fromType 简写（推荐用于内置类型）
const colorMat = Material.fromType("Color", { color: new Color(1.0, 0.0, 0.0, 0.5) });

// 完整 Fabric 表示法
const gridMat = new Material({
  fabric: {
    type: "Grid",
    uniforms: { color: Color.GREEN, cellAlpha: 0.1, lineCount: new Cartesian2(8, 8) },
  },
});

// 异步加载 -- 在第一帧前等待纹理完成，无闪烁
const imageMat = await Material.fromTypeAsync("Image", { image: "./textures/facade.png" });
```

### 带 GLSL 源代码的自定义 Fabric

使用 `source` 进行内联 GLSL。在 `uniforms` 中声明的统一变量可在着色器中按名称使用。

```js
import { Material, Color } from "cesium";

const pulseMaterial = new Material({
  fabric: {
    uniforms: { color: Color.CYAN, speed: 2.0 },
    source: `czm_material czm_getMaterial(czm_materialInput materialInput) {
      czm_material material = czm_getDefaultMaterial(materialInput);
      float pulse = sin(czm_frameNumber * speed * 0.01) * 0.5 + 0.5;
      material.diffuse = color.rgb;
      material.alpha = color.a * pulse;
      return material;
    }`,
  },
  translucent: true,
});
```

### 将材质应用于图元

```js
import { Primitive, GeometryInstance, RectangleGeometry, Rectangle,
  MaterialAppearance, Material, Color, Cartesian2 } from "cesium";

viewer.scene.primitives.add(new Primitive({
  geometryInstances: new GeometryInstance({
    geometry: new RectangleGeometry({ rectangle: Rectangle.fromDegrees(-100, 30, -90, 40) }),
  }),
  appearance: new MaterialAppearance({
    material: Material.fromType("Checkerboard", {
      lightColor: Color.WHITE, darkColor: Color.BLACK, repeat: new Cartesian2(4, 4),
    }),
  }),
}));
```

### 组合子材质（Fabric `materials` + `components`）

```js
import { Material, Color } from "cesium";

const compositeMat = new Material({ fabric: {
  materials: {
    gridMaterial: { type: "Grid" },
    colorMaterial: { type: "Color", uniforms: { color: Color.BLUE } },
  },
  components: {
    diffuse: "gridMaterial.diffuse + 0.2 * colorMaterial.diffuse",
    alpha: "min(gridMaterial.alpha, colorMaterial.alpha)",
  },
}});
```

## CustomShader

`CustomShader` 将用户 GLSL 注入 `Model`、`Cesium3DTileset` 和 `VoxelPrimitive` 渲染流程，可访问顶点属性、要素 ID 和 `EXT_structural_metadata`。

**有关着色器编写 — 结构体参考、元数据访问、要素 ID、体素子集、1.139 破坏性变更和七个可运行示例，请参见 `cesiumjs-custom-shader` 技能。** 本技能拥有 `CustomShader` 集成表面；编写深度内容位于该技能中。

最小示例：

```js
import { CustomShader, Model } from "cesium";

const shader = new CustomShader({
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      material.diffuse = vec3(1.0, 0.5, 0.0);
    }
  `,
});
const model = await Model.fromGltfAsync({ url: "./building.glb", customShader: shader });
viewer.scene.primitives.add(model);
```

## ImageBasedLighting

控制 `Model` 和 `Cesium3DTileset` 的 PBR 图像照明。`imageBasedLightingFactor`（Cartesian2）在 0 到 1 之间缩放漫反射（x）和镜面反射（y）。漫反射来自 `sphericalHarmonicCoefficients`（9 个 Cartesian3 数组，L0-L2）。镜面反射来自 `specularEnvironmentMaps`（指向 KTX2 立方体贴图的 URL）。

```js
import { ImageBasedLighting, Cartesian2, Cartesian3 } from "cesium";

const coefficients = [ // L0..L2 波段的 9 个 Cartesian3 值
  new Cartesian3(0.35, 0.35, 0.38), new Cartesian3(0.11, 0.11, 0.11),
  new Cartesian3(0.04, 0.04, 0.04), new Cartesian3(-0.08, -0.08, -0.08),
  new Cartesian3(-0.02, -0.02, -0.02), new Cartesian3(0.04, 0.04, 0.04),
  new Cartesian3(-0.06, -0.06, -0.06), new Cartesian3(0.01, 0.01, 0.01),
  new Cartesian3(-0.03, -0.03, -0.03),
];
const ibl = new ImageBasedLighting({
  imageBasedLightingFactor: new Cartesian2(1.0, 1.0),
  sphericalHarmonicCoefficients: coefficients,
  specularEnvironmentMaps: "./environment/specular.ktx2",
});
const model = await Cesium.Model.fromGltfAsync({ url: "./helmet.glb", imageBasedLighting: ibl });
viewer.scene.primitives.add(model);
// 禁用：model.imageBasedLighting.imageBasedLightingFactor = new Cartesian2(0.0, 0.0);
```

## 后处理

通过 `viewer.scene.postProcessStages`（`PostProcessStageCollection`）的屏幕空间管线。阶段按顺序执行；每个阶段读取 `colorTexture` 和 `depthTexture`。

### 内置效果（PostProcessStageLibrary）

`createBlurStage()`（delta、sigma、stepSize）、`createDepthOfFieldStage()`（focalDistance、delta、sigma、stepSize）、`createEdgeDetectionStage()`（color、length）、`createSilhouetteStage()`（color、length）、`createBlackAndWhiteStage()`（gradations）、`createBrightnessStage()`（brightness）、`createNightVisionStage()`、`createLensFlareStage()`（intensity、distortion、ghostDispersal、haloWidth）。

### 集合阶段（泛光、环境光遮蔽、FXAA、色调映射）

泛光、环境光遮蔽和 FXAA 直接在集合上访问（而非通过库）。色调映射默认为 `PBR_NEUTRAL`。

```js
import { Tonemapper, PostProcessStageLibrary } from "cesium";

// 泛光（Bloom）
viewer.scene.postProcessStages.bloom.enabled = true;
viewer.scene.postProcessStages.bloom.uniforms.contrast = 128.0;
viewer.scene.postProcessStages.bloom.uniforms.brightness = -0.3;

// 环境光遮蔽（HBAO）
viewer.scene.postProcessStages.ambientOcclusion.enabled = true;
viewer.scene.postProcessStages.ambientOcclusion.uniforms.intensity = 3.0;

// FXAA
viewer.scene.postProcessStages.fxaa.enabled = true;

// 色调映射：REINHARD、MODIFIED_REINHARD、FILMIC、ACES、PBR_NEUTRAL（默认）
viewer.scene.postProcessStages.tonemapper = Tonemapper.ACES;
viewer.scene.postProcessStages.exposure = 1.2; // <1 变暗，>1 变亮

// 景深（通过库添加）
const dof = viewer.scene.postProcessStages.add(
  PostProcessStageLibrary.createDepthOfFieldStage()
);
dof.uniforms.focalDistance = 500.0; // 距相机的米数
dof.uniforms.sigma = 3.8;
```

### 自定义 PostProcessStage

自定义阶段接收 `colorTexture`、`depthTexture`（sampler2D）和 `v_textureCoordinates`（vec2）。通过 `out_FragColor` 输出。统一变量可以是常量或函数（每帧重新评估）。

```js
import { PostProcessStage } from "cesium";

const sepia = viewer.scene.postProcessStages.add(new PostProcessStage({
  fragmentShader: `
    uniform sampler2D colorTexture; in vec2 v_textureCoordinates; uniform float intensity;
    void main() {
      vec4 c = texture(colorTexture, v_textureCoordinates);
      float gray = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      out_FragColor = vec4(mix(c.rgb, gray * vec3(1.2, 1.0, 0.8), intensity), c.a);
    }`,
  uniforms: { intensity: () => 0.8 }, // 函数统一变量，每帧重新评估
}));
```

### 选中要素高亮

在片元着色器中使用 `czm_selected()`，并将要素分配给 `stage.selected`。

```js
import { PostProcessStage, Color } from "cesium";

const highlight = viewer.scene.postProcessStages.add(new PostProcessStage({
  fragmentShader: `
    uniform sampler2D colorTexture; in vec2 v_textureCoordinates; uniform vec4 highlight;
    void main() {
      vec4 color = texture(colorTexture, v_textureCoordinates);
      if (czm_selected()) {
        out_FragColor = vec4(mix(color.rgb, highlight.rgb, highlight.a), 1.0);
      } else { out_FragColor = color; }
    }`,
  uniforms: { highlight: () => new Color(1.0, 1.0, 0.0, 0.5) },
}));
highlight.selected = [pickedFeature];
```

### PostProcessStageComposite

```js
import { PostProcessStage, PostProcessStageComposite, PostProcessStageLibrary } from "cesium";

const blur = PostProcessStageLibrary.createBlurStage();
const combine = new PostProcessStage({
  fragmentShader: `
    uniform sampler2D colorTexture; uniform sampler2D blurTexture;
    in vec2 v_textureCoordinates;
    void main() {
      vec4 orig = texture(colorTexture, v_textureCoordinates);
      vec4 blurred = texture(blurTexture, v_textureCoordinates);
      out_FragColor = mix(orig, blurred, 0.5);
    }`,
  uniforms: { blurTexture: blur.name }, // 按名称引用其他阶段的输出
});
viewer.scene.postProcessStages.add(new PostProcessStageComposite({
  stages: [blur, combine],
  inputPreviousStageTexture: false, // 两者都读取原始场景纹理
}));
```

### 管理阶段

```js
viewer.scene.postProcessStages.remove(sepia); // 移除特定阶段
dof.enabled = false;                          // 禁用而不移除
viewer.scene.postProcessStages.removeAll();   // 移除所有自定义阶段
```

## BlendingState

图元上 `Appearance.renderState` 的预定义混合预设。

| 预设 | 行为 |
|---|---|
| `BlendingState.DISABLED` | 无混合 |
| `BlendingState.ALPHA_BLEND` | 标准透明度：`src*srcA + dst*(1-srcA)` |
| `BlendingState.PRE_MULTIPLIED_ALPHA_BLEND` | 预乘透明度：`src + dst*(1-srcA)` |
| `BlendingState.ADDITIVE_BLEND` | 相加混合：`src*srcA + dst` |

```js
import { MaterialAppearance, BlendingState, Material, Color } from "cesium";

const appearance = new MaterialAppearance({
  material: Material.fromType("Color", { color: Color.RED.withAlpha(0.5) }),
  renderState: { depthTest: { enabled: true }, blending: BlendingState.ALPHA_BLEND },
});
```

## 性能提示

1. 内置材质优先使用 `Material.fromType()` —— 缓存的着色器程序避免重新编译。
2. 纹理材质使用 `Material.fromTypeAsync()` 以防止默认纹理闪烁。
3. 将 `PostProcessStage.textureScale` 设置到 1.0 以下（例如 0.5）以减少昂贵阶段的像素处理量。
4. 禁用未使用的内置阶段（`bloom.enabled = false`）—— 启用的阶段消耗 GPU 资源。
5. 在 `PostProcessStageComposite` 中组合效果以减少中间纹理分配。
6. 尽量减少 `PostProcessStage` 数量 —— 每个都需要全屏绘制调用和帧缓冲。

## 参见

- **cesiumjs-custom-shader** -- 为 `Model.customShader`、`Cesium3DTileset.customShader`、`VoxelPrimitive.customShader` 编写 GLSL（结构体参考、元数据、要素 ID）
- **cesiumjs-primitives** -- Geometry、Appearances 和 Primitive API 对象上的 Material 应用
- **cesiumjs-3d-tiles** -- Cesium3DTileset 加载和样式
- **cesiumjs-models-particles** -- 模型加载和 glTF
