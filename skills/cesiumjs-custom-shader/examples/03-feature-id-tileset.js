// 03-feature-id-tileset.js — 在 3D Tileset 上按要素 ID 进行分类着色。
// 资源：CesiumGS/3d-tiles-samples — FeatureIdAttributeAndPropertyTable（真实 EXT_mesh_features）。
//   https://raw.githubusercontent.com/CesiumGS/3d-tiles-samples/main/glTF/EXT_structural_metadata/FeatureIdAttributeAndPropertyTable/tileset.json
// 回退：CesiumGS/cesium — BatchedWithBatchTable（旧版 3D Tiles 1.0 BATCH_ID，映射到 featureId_0）。

import { CustomShader, LightingModel, Cesium3DTileset } from "cesium";

const classifyShader = new CustomShader({
  lightingModel: LightingModel.UNLIT,
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      int id = fsInput.featureIds.featureId_0;
      if (id == 0) {
        material.diffuse = vec3(1.0, 0.3, 0.3);  // class 0 — 红色
      } else if (id == 1) {
        material.diffuse = vec3(0.3, 1.0, 0.3);  // class 1 — 绿色
      } else {
        material.diffuse = vec3(0.3, 0.3, 1.0);  // 其他 — 蓝色
      }
    }
  `,
});

const tileset = await Cesium3DTileset.fromUrl(
  "https://raw.githubusercontent.com/CesiumGS/3d-tiles-samples/main/glTF/EXT_structural_metadata/FeatureIdAttributeAndPropertyTable/tileset.json",
  { customShader: classifyShader },
);
viewer.scene.primitives.add(tileset);
viewer.zoomTo(tileset);
