// 07-voxel-shader.js — 在 VoxelPrimitive 上仅使用片元着色器的自定义着色器。
// 简化结构可用性：仅 attributes.positionEC 和 attributes.normalEC，
// 无 FeatureIds，无 MetadataClass，metadataStatistics 仅有 min/max。
// 资源：CesiumGS/cesium Specs — VoxelBox3DTiles（SCALAR FLOAT32 属性 `a`）。
//   https://raw.githubusercontent.com/CesiumGS/cesium/main/Specs/Data/Cesium3DTiles/Voxel/VoxelBox3DTiles/tileset.json

import { CustomShader, Cesium3DTilesVoxelProvider, VoxelPrimitive } from "cesium";

const voxelShader = new CustomShader({
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      float v = fsInput.metadata.a;
      // 冷 → 暖渐变，半透明以便光线步进累积
      material.diffuse = mix(vec3(0.1, 0.2, 0.8), vec3(1.0, 0.6, 0.1), v);
      material.alpha = 0.3 * v;
    }
  `,
});

const provider = await Cesium3DTilesVoxelProvider.fromUrl(
  "https://raw.githubusercontent.com/CesiumGS/cesium/main/Specs/Data/Cesium3DTiles/Voxel/VoxelBox3DTiles/tileset.json",
);

const voxelPrimitive = new VoxelPrimitive({ provider, customShader: voxelShader });
viewer.scene.primitives.add(voxelPrimitive);
voxelPrimitive.nearestSampling = true;
viewer.camera.flyToBoundingSphere(voxelPrimitive.boundingSphere, { duration: 0 });
