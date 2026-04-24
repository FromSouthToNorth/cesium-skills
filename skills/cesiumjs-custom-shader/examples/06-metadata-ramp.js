// 06-metadata-ramp.js — 由 EXT_structural_metadata 属性纹理（逐像素）驱动的片元着色器颜色渐变。
// `insulation` 属性为 UINT8 类型且 normalized:true，
// 因此在 GLSL 中以 [0, 1] 范围的 float 形式到达 —— 直接通过颜色渐变映射。
// 资源：CesiumGS/3d-tiles-samples — SimplePropertyTexture（EXT_structural_metadata
// 包含三个 UINT8 标量属性，通过 propertyTextures 提供）。
//   https://raw.githubusercontent.com/CesiumGS/3d-tiles-samples/main/glTF/EXT_structural_metadata/SimplePropertyTexture/tileset.json
//
// 资源说明：携带 EXT_structural_metadata 的公开 .glb 文件较为稀缺。本技能
// 仅在 Cesium3DTileset 上演示此示例；着色器表面在 Model 上完全相同。
//
// 类型说明：在 1.139 (#13135) 之后，无符号元数据保留其有符号性 —— 对于
// 非归一化的 UINT8 属性，如 `insideTemperature`，您需要编写
// `uint t = fsInput.metadata.insideTemperature; float f = float(t) / 255.0;`。`insulation`
// 声明为 `normalized: true`，因此运行时会直接提供一个 [0, 1] 范围的 float。

import { CustomShader, LightingModel, Cesium3DTileset } from "cesium";

const rampShader = new CustomShader({
  lightingModel: LightingModel.UNLIT,
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      float t = fsInput.metadata.insulation;   // 归一化 UINT8 → [0, 1] 范围的 float
      // 冷 → 暖渐变：薄绝缘层 (0) 为冷色/蓝色，厚绝缘层 (1) 为暖色/红色
      material.diffuse = mix(vec3(0.1, 0.3, 0.9), vec3(1.0, 0.3, 0.1), t);
    }
  `,
});

const tileset = await Cesium3DTileset.fromUrl(
  "https://raw.githubusercontent.com/CesiumGS/3d-tiles-samples/main/glTF/EXT_structural_metadata/SimplePropertyTexture/tileset.json",
  { customShader: rampShader },
);
viewer.scene.primitives.add(tileset);
viewer.zoomTo(tileset);
