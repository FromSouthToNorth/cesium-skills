// 04-translucent-override.js — 在不透明源模型上强制使用半透明通道。
// 若不设置 translucencyMode: TRANSLUCENT，material.alpha 的写入将被静默忽略
//（INHERIT 遵从源材质，此处为不透明）。
// 资源：Sandcastle SampleData CesiumAir。

import {
  CustomShader,
  CustomShaderTranslucencyMode,
  UniformType,
  Model,
  Cartesian3,
  HeadingPitchRoll,
  Transforms,
} from "cesium";

const xrayShader = new CustomShader({
  translucencyMode: CustomShaderTranslucencyMode.TRANSLUCENT,
  uniforms: {
    u_alpha: { type: UniformType.FLOAT, value: 0.35 },
  },
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      // 冷色调 X 光效果
      material.diffuse = mix(material.diffuse, vec3(0.4, 0.7, 1.0), 0.6);
      material.alpha = u_alpha;
    }
  `,
});

const position = Cartesian3.fromDegrees(-123.0744619, 44.0503706, 5000);
const model = await Model.fromGltfAsync({
  url: "../../SampleData/models/CesiumAir/Cesium_Air.glb",
  modelMatrix: Transforms.headingPitchRollToFixedFrame(position, new HeadingPitchRoll()),
  customShader: xrayShader,
});
viewer.scene.primitives.add(model);
viewer.camera.flyToBoundingSphere(model.boundingSphere, { duration: 0 });
