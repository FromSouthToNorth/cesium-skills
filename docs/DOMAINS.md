# CesiumJS 技能领域映射

> **版本基线：** CesiumJS v1.139.1 (2026-03-05)
> **最后更新：** 2026-04-21
> **分配的公开符号总数：** ~535

本文档是 CesiumJS 技能分解的权威来源。CesiumJS 中的每个公开类、函数和枚举都被分配到恰好一个领域。其他领域可能交叉引用某个符号，但只有一个领域**拥有**它。

## 领域摘要

| # | 技能名称 | 条目数 | 描述（被动激活） |
|---|-----------|---------|------------------|
| 1 | `cesiumjs-viewer-setup` | ~70 | CesiumJS viewer 设置 - Viewer、CesiumWidget、控件、Ion 令牌、Scene 配置、SceneMode、工厂辅助函数、地理编码器、平台服务。在初始化 CesiumJS 应用、配置 viewer 控件、设置 Ion 访问令牌、创建默认地形或影像或引导 3D 地球时使用。 |
| 2 | `cesiumjs-camera` | ~10 | CesiumJS 相机控制 - Camera、flyTo、lookAt、setView、ScreenSpaceCameraController、CameraEventAggregator、飞行动画。在定位相机、创建 flyTo 动画、约束用户导航、追踪实体或在屏幕与世界坐标之间转换时使用。 |
| 3 | `cesiumjs-entities` | ~60 | CesiumJS 实体和数据源 - Entity、EntityCollection、DataSource、GeoJsonDataSource、KmlDataSource、CzmlDataSource、Graphics 类型、Visualizer。在向地图添加点、标签、模型、多边形或折线、加载 GeoJSON/KML/CZML/GPX 数据或使用高级 Entity API 时使用。 |
| 4 | `cesiumjs-3d-tiles` | ~45 | CesiumJS 3D Tiles - Cesium3DTileset、样式、元数据、要素拾取、体素、点云、I3S、高斯泼溅、裁剪平面和多边形。在加载 3D Tiles tileset、样式化建筑要素、查询元数据属性、处理体素或点云或裁剪空间数据时使用。 |
| 5 | `cesiumjs-imagery` | ~30 | CesiumJS 影像图层 - ImageryProvider、ImageryLayer、ImageryLayerCollection、WMS、WMTS、Bing、OpenStreetMap、ArcGIS、Mapbox、瓦片丢弃策略。在添加或切换底图图层、配置影像提供者、分层多个地图源或创建分屏影像对比时使用。 |
| 6 | `cesiumjs-terrain-environment` | ~35 | CesiumJS 地形、地球与环境 - TerrainProvider、Globe、sampleTerrain、大气、天空、雾、光照、阴影、全景。在配置地形提供者、查询地形高度、自定义大气或天空渲染、添加全景或调整场景光照和阴影时使用。 |
| 7 | `cesiumjs-primitives` | ~72 | CesiumJS 图元与几何体 - Primitive、GeometryInstance、Appearance、Billboard/Label/PointPrimitive 集合、内置几何形状、地面图元、分类。在渲染性能关键的静态几何体、创建自定义形状、批处理绘制调用或使用低级布告板、标签和点集合时使用。 |
| 8 | `cesiumjs-materials-shaders` | ~20 | CesiumJS 材质与后处理 — Material、Fabric JSON、MaterialAppearance、ImageBasedLighting、PostProcessStage、PostProcessStageLibrary、泛光、景深、环境光遮蔽、FXAA、色调映射、BlendingState。在为实体或图元定义 Fabric 材质、配置 PBR 图像照明或添加屏幕空间后处理效果时使用。 |
| 14 | `cesiumjs-custom-shader` | ~7 | CustomShader 编写 — 针对 VertexInput、FragmentInput、FeatureIds、Metadata、czm_modelMaterial 的 vertexShaderText 和 fragmentShaderText。在读取 EXT_mesh_features 或 EXT_structural_metadata 属性纹理/表、顶点位移或为 VoxelPrimitive 着色时使用。 |
| 9 | `cesiumjs-time-properties` | ~57 | CesiumJS 时间、属性与动画 - Clock、JulianDate、TimeInterval、Property、SampledProperty、CallbackProperty、插值、样条、CZML 时序数据。在使实体属性随时间动态变化、配置仿真时钟、随时间插值位置或使用采样与回调属性时使用。 |
| 10 | `cesiumjs-spatial-math` | ~55 | CesiumJS 空间数学 - Cartesian3、Cartographic、Matrix4、Quaternion、Transforms、Ellipsoid、BoundingSphere、投影、坐标转换。在坐标系间转换、计算椭球体上的位置、执行空间相交测试、构建模型矩阵或处理地理投影时使用。 |
| 11 | `cesiumjs-interaction` | ~8 | CesiumJS 交互与拾取 - ScreenSpaceEventHandler、Scene.pick、Scene.drillPick、Scene.pickPosition、鼠标和触控事件。在处理用户点击地球、选择实体或 3D Tiles 要素、实现悬停效果或构建基于拖拽的交互时使用。 |
| 12 | `cesiumjs-models-particles` | ~20 | CesiumJS 模型、glTF 与粒子效果 - Model、ModelAnimation、ModelNode、ParticleSystem、发射器、GPM 扩展。在加载 glTF/GLB 3D 模型、播放模型动画、定位粒子效果（如火焰或烟雾）或使用地理空间定位元数据时使用。 |
| 13 | `cesiumjs-core-utilities` | ~46 | CesiumJS 核心工具与网络 - Resource、Color、Event、Request、RequestScheduler、错误处理、辅助函数、特性检测。在获取远程数据、管理 HTTP 请求、处理颜色、处理事件、调试错误或使用 defined、clone、buildModuleUrl 等工具函数时使用。 |

---

## 领域 1：cesiumjs-viewer-setup（约 70 个条目）

### 核心初始化
- Viewer
- CesiumWidget
- Scene

### 平台配置
- Ion
- IonResource
- GoogleMaps
- ITwinPlatform
- ITwinData

### 控件
- Animation
- BaseLayerPicker
- Cesium3DTilesInspector
- CesiumInspector
- FullscreenButton
- Geocoder
- HomeButton
- I3SBuildingSceneLayerExplorer
- InfoBox
- NavigationHelpButton
- PerformanceWatchdog
- ProjectionPicker
- SceneModePicker
- SelectionIndicator
- Timeline
- VoxelInspector
- VRButton
- SvgPathBindingHandler

### ViewModel
- AnimationViewModel
- BaseLayerPickerViewModel
- Cesium3DTilesInspectorViewModel
- CesiumInspectorViewModel
- ClockViewModel
- FullscreenButtonViewModel
- GeocoderViewModel
- HomeButtonViewModel
- I3sBslExplorerViewModel
- InfoBoxViewModel
- NavigationHelpButtonViewModel
- PerformanceWatchdogViewModel
- ProjectionPickerViewModel
- ProviderViewModel
- SceneModePickerViewModel
- SelectionIndicatorViewModel
- ToggleButtonViewModel
- VoxelInspectorViewModel
- VRButtonViewModel

### 控件基础设施
- Command
- createCommand

### Viewer 混入
- viewerCesium3DTilesInspectorMixin
- viewerCesiumInspectorMixin
- viewerDragDropMixin
- viewerPerformanceWatchdogMixin
- viewerVoxelInspectorMixin

### 地理编码服务
- GeocoderService（接口）
- BingMapsGeocoderService
- CartographicGeocoderService
- GoogleGeocoderService
- IonGeocoderService
- OpenCageGeocoderService
- PeliasGeocoderService

### 工厂辅助函数
- createWorldImageryAsync
- createWorldTerrainAsync
- createWorldBathymetryAsync
- createGooglePhotorealistic3DTileset
- createOsmBuildingsAsync

### 鸣谢
- Credit
- CreditDisplay
- FrameRateMonitor

### 枚举
- SceneMode
- MapMode2D
- GeocodeType
- IonGeocodeProviderType
- IonWorldImageryStyle

---

## 领域 2：cesiumjs-camera（约 10 个条目）

### 核心
- Camera
- CameraEventAggregator
- ScreenSpaceCameraController
- EntityView

### 调试
- DebugCameraPrimitive

### 类型
- HeadingPitchRange

### 枚举
- CameraEventType
- KeyboardEventModifier

### 关键方法（以模式形式记录）
- Camera.flyTo
- Camera.lookAt
- Camera.setView
- Camera.flyHome
- Camera.flyToBoundingSphere
- Camera.viewBoundingSphere
- Camera.lookAtTransform
- Camera.move / moveForward / moveBackward / moveUp / moveDown / moveLeft / moveRight
- Camera.zoomIn / zoomOut
- Camera.rotate / rotateUp / rotateDown / rotateLeft / rotateRight
- Camera.lookUp / lookDown / lookLeft / lookRight
- ScreenSpaceCameraController.enableTilt / enableZoom / enableRotate
- ScreenSpaceCameraController.minimumZoomDistance / maximumZoomDistance
- ScreenSpaceCameraController.maximumTiltAngle

---

## 领域 3：cesiumjs-entities（约 60 个条目）

### 实体核心
- Entity
- EntityCollection
- EntityCluster
- CompositeEntityCollection

### Graphics 类型（17 个）
- BillboardGraphics
- BoxGraphics
- Cesium3DTilesetGraphics
- CorridorGraphics
- CylinderGraphics
- EllipseGraphics
- EllipsoidGraphics
- LabelGraphics
- ModelGraphics
- PathGraphics
- PlaneGraphics
- PointGraphics
- PolygonGraphics
- PolylineGraphics
- PolylineVolumeGraphics
- RectangleGraphics
- WallGraphics

### 数据源
- DataSource（接口）
- CustomDataSource
- CzmlDataSource
- GeoJsonDataSource
- GpxDataSource
- KmlDataSource

### 数据源基础设施
- DataSourceClock
- DataSourceCollection
- DataSourceDisplay

### KML 辅助函数
- KmlCamera
- KmlFeatureData
- KmlLookAt
- KmlTour
- KmlTourFlyTo
- KmlTourWait

### Visualizer
- Visualizer（接口）
- BillboardVisualizer
- Cesium3DTilesetVisualizer
- GeometryVisualizer
- LabelVisualizer
- ModelVisualizer
- PathVisualizer
- PointVisualizer
- PolylineVisualizer

### GeometryUpdater
- GeometryUpdater（基类）
- GroundGeometryUpdater
- BoxGeometryUpdater
- CorridorGeometryUpdater
- CylinderGeometryUpdater
- EllipseGeometryUpdater
- EllipsoidGeometryUpdater
- PlaneGeometryUpdater
- PolygonGeometryUpdater
- PolylineGeometryUpdater
- PolylineVolumeGeometryUpdater
- RectangleGeometryUpdater
- WallGeometryUpdater

### 函数
- exportKml

### 枚举
- HeightReference
- HorizontalOrigin
- VerticalOrigin
- LabelStyle
- ColorBlendMode
- ShadowMode

### 所有权规则
> `*Graphics` 类属于这里。`*Geometry` 类属于 cesiumjs-primitives。这是 Entity API 与 Primitive API 的分界。

---

## 领域 4：cesiumjs-3d-tiles（约 45 个条目）

### 3D Tiles 核心
- Cesium3DTileset
- Cesium3DTile
- Cesium3DTileContent
- Cesium3DTileFeature
- Cesium3DTilePointFeature
- Cesium3DTileStyle

### 样式表达式
- ConditionsExpression
- Expression
- StyleExpression

### 体素
- VoxelPrimitive
- VoxelProvider（接口）
- Cesium3DTilesVoxelProvider
- VoxelContent
- VoxelCell
- VoxelShapeType（枚举）

### 元数据
- MetadataClass
- MetadataClassProperty
- MetadataEnum
- MetadataEnumValue
- MetadataSchema
- PickedMetadataInfo
- MetadataComponentType（枚举）
- MetadataType（枚举）

### I3S
- I3SDataProvider
- I3SFeature
- I3SField
- I3SGeometry
- I3SLayer
- I3SNode
- I3SStatistics
- I3SSublayer
- I3SSymbology

### 裁剪
- ClippingPlane
- ClippingPlaneCollection
- ClippingPolygon
- ClippingPolygonCollection

### 专用内容
- GaussianSplat3DTileContent
- TimeDynamicPointCloud

### 地形桥接（实验性）
- Cesium3DTilesTerrainData
- Cesium3DTilesTerrainProvider

### 渲染配置
- PointCloudShading
- Cesium3DTileColorBlendMode（枚举）

### 枚举
- ClassificationType

---

## 领域 5：cesiumjs-imagery（约 30 个条目）

### 核心
- ImageryProvider（接口）
- ImageryLayer
- ImageryLayerCollection
- ImageryLayerFeatureInfo

### 提供者（17 个）
- ArcGisMapServerImageryProvider
- ArcGisMapService
- BingMapsImageryProvider
- Google2DImageryProvider
- GoogleEarthEnterpriseImageryProvider
- GoogleEarthEnterpriseMapsProvider
- GridImageryProvider
- IonImageryProvider
- MapboxImageryProvider
- MapboxStyleImageryProvider
- OpenStreetMapImageryProvider
- SingleTileImageryProvider
- TileCoordinatesImageryProvider
- TileMapServiceImageryProvider
- UrlTemplateImageryProvider
- WebMapServiceImageryProvider
- WebMapTileServiceImageryProvider

### 工具
- TimeDynamicImagery
- GetFeatureInfoFormat
- GoogleEarthEnterpriseMetadata

### 丢弃策略
- DiscardEmptyTileImagePolicy
- DiscardMissingTileImagePolicy
- NeverTileDiscardPolicy

### 枚举
- ArcGisBaseMapType
- BingMapsStyle
- SplitDirection

---

## 领域 6：cesiumjs-terrain-environment（约 35 个条目）

### 地形核心
- TerrainProvider（接口）
- TerrainData（接口）
- Terrain（辅助函数）

### 地形提供者
- ArcGISTiledElevationTerrainProvider
- CesiumTerrainProvider
- CustomHeightmapTerrainProvider
- EllipsoidTerrainProvider
- GoogleEarthEnterpriseTerrainProvider
- VRTheWorldTerrainProvider

### 地形数据
- GoogleEarthEnterpriseTerrainData
- HeightmapTerrainData
- QuantizedMeshTerrainData

### 地形工具
- sampleTerrain
- sampleTerrainMostDetailed
- TileAvailability

### 地球
- Globe
- GlobeTranslucency

### 大气与天空
- SkyBox
- SkyAtmosphere
- Atmosphere
- Fog
- DynamicEnvironmentMapManager

### 天体
- Sun
- Moon

### 光照
- SunLight
- DirectionalLight
- Light（接口）
- ShadowMap

### 全景
- Panorama（接口）
- PanoramaProvider（接口）
- EquirectangularPanorama
- CubeMapPanorama
- GoogleStreetViewCubeMapPanoramaProvider

### 函数
- createElevationBandMaterial

### 枚举
- DynamicAtmosphereLightingType
- HeightmapEncoding
- ShadowMode（交叉引用自领域 3）

---

## 领域 7：cesiumjs-primitives（约 72 个条目）

### 图元
- Primitive
- PrimitiveCollection
- ClassificationPrimitive
- GroundPrimitive
- GroundPolylinePrimitive

### 几何体基础设施
- Geometry
- GeometryAttribute
- GeometryAttributes
- GeometryFactory
- GeometryInstance
- GeometryInstanceAttribute
- GeometryPipeline
- VertexFormat

### 几何体类型（31 个）
- BoxGeometry / BoxOutlineGeometry
- CircleGeometry / CircleOutlineGeometry
- CoplanarPolygonGeometry / CoplanarPolygonOutlineGeometry
- CorridorGeometry / CorridorOutlineGeometry
- CylinderGeometry / CylinderOutlineGeometry
- EllipseGeometry / EllipseOutlineGeometry
- EllipsoidGeometry / EllipsoidOutlineGeometry
- FrustumGeometry / FrustumOutlineGeometry
- GroundPolylineGeometry
- PlaneGeometry / PlaneOutlineGeometry
- PolygonGeometry / PolygonOutlineGeometry
- PolylineGeometry
- PolylineVolumeGeometry / PolylineVolumeOutlineGeometry
- RectangleGeometry / RectangleOutlineGeometry
- SimplePolylineGeometry
- SphereGeometry / SphereOutlineGeometry
- WallGeometry / WallOutlineGeometry

### 辅助函数
- PolygonHierarchy

### Appearance
- Appearance
- DebugAppearance
- EllipsoidSurfaceAppearance
- MaterialAppearance
- PerInstanceColorAppearance
- PolylineColorAppearance
- PolylineMaterialAppearance

### 实例属性
- ColorGeometryInstanceAttribute
- DistanceDisplayConditionGeometryInstanceAttribute
- ShowGeometryInstanceAttribute

### 图元集合
- BillboardCollection
- LabelCollection
- PolylineCollection
- PointPrimitiveCollection
- CloudCollection

### 图元项
- Billboard
- Label
- Polyline
- PointPrimitive
- CumulusCloud

### 调试
- DebugModelMatrixPrimitive
- ViewportQuad

### 函数
- createTangentSpaceDebugPrimitive

### 枚举
- ArcType
- CornerType
- PrimitiveType
- CloudType
- StripeOrientation
- WindingOrder

---

## 领域 8：cesiumjs-materials-shaders（约 20 个条目）

### 材质系统
- Material
- MaterialSupport

### 基于图像的光照
- ImageBasedLighting

### 后处理
- PostProcessStage
- PostProcessStageCollection
- PostProcessStageComposite
- PostProcessStageLibrary

### 后处理枚举
- PostProcessStageSampleMode
- Tonemapper

### 渲染状态
- BlendingState

### 渲染状态枚举
- BlendEquation
- BlendFunction
- BlendOption
- CullFace
- DepthFunction
- StencilFunction
- StencilOperation

### 纹理配置
- CompressedTextureBuffer
- TextureMagnificationFilter
- TextureMinificationFilter

### 函数
- createElevationBandMaterial（交叉引用自领域 6）
- srgbToLinear

### 所有权规则
> **Material（Fabric）：** 主要归属。由图元上的 `MaterialAppearance` 和通过 `Material*Property`（领域 9）的 Entity `*Graphics` 消费。
> **ImageBasedLighting：** 主要归属。由 `Model.imageBasedLighting` 和 `Cesium3DTileset.imageBasedLighting` 使用。
> **PostProcessStage/Library：** 主要归属。应用于 `Scene.postProcessStages`。
> **CustomShader、TextureUniform 和着色器枚举：** 移至领域 14（cesiumjs-custom-shader）。仅交叉引用。

---

## 领域 9：cesiumjs-time-properties（约 57 个条目）

### 时间核心
- Clock
- JulianDate
- GregorianDate
- TimeInterval
- TimeIntervalCollection
- LeapSecond
- Iso8601

### 属性接口
- Property
- PositionProperty
- MaterialProperty

### 值属性
- ConstantProperty
- ConstantPositionProperty
- SampledProperty
- SampledPositionProperty
- CallbackProperty
- CallbackPositionProperty
- CompositeProperty
- CompositePositionProperty
- CompositeMaterialProperty
- ReferenceProperty
- TimeIntervalCollectionProperty
- TimeIntervalCollectionPositionProperty
- PropertyArray
- PositionPropertyArray
- PropertyBag
- NodeTransformationProperty

### 速度属性
- VelocityOrientationProperty
- VelocityVectorProperty

### 材质属性
- ColorMaterialProperty
- ImageMaterialProperty
- GridMaterialProperty
- StripeMaterialProperty
- CheckerboardMaterialProperty
- PolylineArrowMaterialProperty
- PolylineDashMaterialProperty
- PolylineGlowMaterialProperty
- PolylineOutlineMaterialProperty

### 样条
- Spline（基类）
- CatmullRomSpline
- HermiteSpline
- LinearSpline
- QuaternionSpline
- ConstantSpline
- SteppedSpline
- MorphWeightSpline

### 插值
- HermitePolynomialApproximation
- LagrangePolynomialApproximation
- LinearApproximation
- PackableForInterpolation

### 动画辅助函数
- EasingFunction
- VideoSynchronizer

### 枚举
- ClockRange
- ClockStep
- TimeStandard
- ExtrapolationType
- TrackingReferenceFrame
- ReferenceFrame

### 设计决策
> 属性放在这里（而非与 Entities 一起），因为它们是时序数据绑定层。SampledProperty 和 CallbackProperty 在没有 Clock/JulianDate 的情况下毫无意义。MaterialProperty（ColorMaterialProperty 等）是随时间变化的 Property 子类。`Material` 类（用于图元的 Fabric 系统）属于 cesiumjs-materials-shaders。

---

## 领域 10：cesiumjs-spatial-math（约 55 个条目）

### 向量与点
- Cartesian2
- Cartesian3
- Cartesian4
- Cartographic
- Spherical

### 矩阵
- Matrix2
- Matrix3
- Matrix4

### 旋转/朝向
- Quaternion
- HeadingPitchRoll

### 变换
- Transforms
- SceneTransforms
- TranslationRotationScale

### 椭球体与大地测量
- Ellipsoid
- EllipsoidGeodesic
- EllipsoidRhumbLine
- EllipsoidTangentPlane

### 包围体
- BoundingRectangle
- BoundingSphere
- AxisAlignedBoundingBox
- OrientedBoundingBox
- CullingVolume

### 几何图元
- Plane
- Ray
- Rectangle
- NearFarScalar
- Interval
- Occluder

### 投影与瓦片方案
- GeographicProjection
- GeographicTilingScheme
- MapProjection（接口）
- WebMercatorProjection
- WebMercatorTilingScheme
- TilingScheme（接口）

### 视锥体
- PerspectiveFrustum
- PerspectiveOffCenterFrustum
- OrthographicFrustum
- OrthographicOffCenterFrustum

### 相交测试
- IntersectionTests
- Intersections2D

### 数学工具
- Math（CesiumMath）

### 多项式求解器
- CubicRealPolynomial
- QuadraticRealPolynomial
- QuarticRealPolynomial
- TridiagonalSystemSolver

### 专用
- HilbertOrder
- Simon1994PlanetaryPositions
- Stereographic

### 枚举
- Axis
- Intersect
- Visibility
- ComponentDatatype
- IndexDatatype

---

## 领域 11：cesiumjs-interaction（约 8 个条目）

### 事件处理
- ScreenSpaceEventHandler
- ScreenSpaceEventType（枚举）

### 函数
- addDrillPickedResults
- computePickingDrawingBufferRectangle

### 场景拾取方法（以模式形式记录）
- Scene.pick()
- Scene.drillPick()
- Scene.pickPosition()
- Scene.pickVoxel()
- Scene.pickAsync()

### 拾取返回的类型（交叉引用）
- Cesium3DTileFeature（领域 4）
- ModelFeature（领域 12）
- Entity（领域 3）
- PickedMetadataInfo（领域 4）

### 需记录的关键模式
- 通过点击处理器选择实体
- 3D Tiles 要素拾取和属性检查
- 地形位置拾取（从点击获取经纬度/高度）
- 使用 drillPick 的多重拾取
- 使用鼠标移动的悬停高亮
- 基于拖拽的绘制和测量
- 点击时的坐标显示
- 基于拾取对象类型的条件行为

---

## 领域 12：cesiumjs-models-particles（约 20 个条目）

### 模型核心
- Model
- ModelAnimation
- ModelAnimationCollection
- ModelFeature
- ModelNode

### 粒子系统
- ParticleSystem
- Particle
- ParticleBurst
- ParticleEmitter（基类）
- BoxEmitter
- CircleEmitter
- ConeEmitter
- SphereEmitter

### GPM 扩展
- AnchorPointDirect
- AnchorPointIndirect
- CorrelationGroup
- GltfGpmLocal
- Spdcf

### 枚举
- ModelAnimationLoop

### 交叉引用
- CustomShader（主要归属：领域 8）
- ImageBasedLighting（主要归属：领域 8）
- ClippingPlane/ClippingPolygon（主要归属：领域 4）
- ModelGraphics（主要归属：领域 3）

---

## 领域 13：cesiumjs-core-utilities（约 46 个条目）

### 网络
- Resource
- Request
- RequestScheduler
- RequestErrorEvent
- DefaultProxy
- Proxy（接口）
- TrustedServers

### 工作线程处理
- TaskProcessor

### 颜色与显示
- Color
- DistanceDisplayCondition
- PinBuilder

### 事件
- Event
- EventHelper

### 错误类型
- DeveloperError
- RuntimeError

### 数据结构
- AssociativeArray
- Queue

### 检测与状态
- FeatureDetection
- Fullscreen
- Frozen

### 全局函数
- defined
- clone
- combine
- createGuid
- buildModuleUrl
- formatError
- destroyObject
- getAbsoluteUri
- getBaseUri
- getExtensionFromUri
- getFilenameFromUri
- getImagePixels
- getTimestamp
- isLeapYear
- mergeSort
- objectToQuery
- queryToObject
- binarySearch
- subdivideArray
- writeTextToCanvas
- srgbToLinear（交叉引用自领域 8）
- barycentricCoordinates
- pointInsideTriangle

### 枚举
- RequestState
- RequestType
- PixelDatatype
- PixelFormat
- WebGLConstants

### 说明
- `defaultValue` 在 v1.134 中已移除 — 改用 `??` 运算符
- `Frozen.EMPTY_OBJECT` 和 `Frozen.EMPTY_ARRAY` 替代 `defaultValue.EMPTY_OBJECT`（v1.128）

---

## 领域 14：cesiumjs-custom-shader（约 7 个条目）

### CustomShader 核心
- CustomShader
- TextureUniform

### CustomShader 枚举
- CustomShaderMode
- CustomShaderTranslucencyMode
- LightingModel
- UniformType
- VaryingType

### 所有权规则
> **CustomShader：** 主要归属。应用于 `Model.customShader`、`Cesium3DTileset.customShader` 和 `VoxelPrimitive.customShader`（仅片元子集）。模型/tileset/体素的**设置**分别属于领域 12/4/4；**着色器编写**在这里。
> **TextureUniform：** 主要归属。唯一消费者是 `UniformType.SAMPLER_2D` 的 `CustomShader` uniforms。
> **UniformType、VaryingType、LightingModel、CustomShaderMode、CustomShaderTranslucencyMode：** 主要归属。全部五个均由 `CustomShader` 独占消费。
> **Cesium3DTileStyle + CustomShader：** 根据上游 JSDoc 为未定义行为。每个 tileset 选择其一。

### 说明
- 1.139 破坏性变更 (#13135)：UINT 元数据不再在着色器中转换为有符号整数。
- 1.130 破坏性变更 (#12636)：`VoxelPrimitive` `FragmentInput` 重构 — `fsInput.voxel.*` 替换为 `fsInput.attributes.positionEC`/`normalEC`。
- `Cesium3DTileset.customShader` 标记为 `@experimental` — 可能在无标准弃用策略的情况下变更。

---

## 跨领域所有权规则

这些规则防止激活冲突（多个技能为同一提示触发）：

| 概念 | 主要领域 | 交叉引用自 | 规则 |
|---------|---------------|--------------------|------|
| `*Graphics` 类 | 3（entities） | 7（primitives） | Entity API = `*Graphics`；Primitive API = `*Geometry` |
| `*Geometry` 类 | 7（primitives） | 3（entities） | 同一边界，另一个方向 |
| CustomShader | 14（custom-shader） | 4（3d-tiles）、8（materials-shaders）、12（models） | 着色器编写是与模型/tileset 加载或材质/后处理不同的技能 |
| ImageBasedLighting | 8（materials-shaders） | 4（3d-tiles）、12（models） | PBR 光照是一个渲染概念 |
| ClippingPlane/Polygon | 4（3d-tiles） | 6（terrain-env）、12（models） | 最常见的用途是 3D Tiles 裁剪 |
| Material（Fabric） | 8（materials-shaders） | 7（primitives） | 图元通过 Appearance 消费 Material |
| Material*Property | 9（time-properties） | 3（entities） | Property 子类（时序）与 Material 类（Fabric） |
| Ion/IonResource | 1（viewer-setup） | 5（imagery） | 设置时配置与提供者使用 |
| createOsmBuildingsAsync | 1（viewer-setup） | 4（3d-tiles） | 工厂辅助函数与 tileset 配置 |
| EntityView | 2（camera） | 3（entities） | 相机追踪 = 相机关注点 |
| ShadowMap | 6（terrain-env） | 8（materials-shaders） | 场景级渲染配置 |
| SceneTransforms | 10（spatial-math） | 1（viewer-setup） | 坐标变换工具 |

---

## 最近添加的 API（v1.120-v1.139）

| 版本 | 新增 | 领域 |
|---------|----------|-------|
| v1.122 | CallbackPositionProperty | 9 |
| v1.123 | maximumTiltAngle（Camera） | 2 |
| v1.124 | TrackingReferenceFrame、Entity.trackingReferenceFrame | 9、3 |
| v1.124 | ITwinPlatform | 1 |
| v1.128 | ITwinData、Frozen | 1、13 |
| v1.128 | Frozen.EMPTY_OBJECT、Frozen.EMPTY_ARRAY | 13 |
| v1.133 | Ellipsoid.MARS | 10 |
| v1.134 | Google2DImageryProvider | 5 |
| v1.134 | `defaultValue` 已移除（使用 `??`） | 13 |
| v1.135 | Cesium3DTilesTerrainProvider（实验性） | 4 |
| v1.136 | Scene.pickAsync | 11 |
| v1.139 | EquirectangularPanorama | 6 |
| v1.139 | CubeMapPanorama | 6 |
| v1.139 | GoogleStreetViewCubeMapPanoramaProvider | 6 |

---

## 技能文件参见交叉引用

| 技能 | 参见 |
|-------|-------|
| cesiumjs-viewer-setup | camera、entities、imagery、terrain-environment |
| cesiumjs-camera | spatial-math、interaction、entities |
| cesiumjs-entities | time-properties、primitives、interaction |
| cesiumjs-3d-tiles | custom-shader、interaction、terrain-environment |
| cesiumjs-imagery | viewer-setup、terrain-environment |
| cesiumjs-terrain-environment | viewer-setup、imagery、spatial-math |
| cesiumjs-primitives | entities、materials-shaders、spatial-math |
| cesiumjs-materials-shaders | custom-shader、primitives、3d-tiles、models-particles |
| cesiumjs-time-properties | entities、viewer-setup、models-particles |
| cesiumjs-spatial-math | camera、primitives、terrain-environment |
| cesiumjs-interaction | entities、3d-tiles、camera |
| cesiumjs-models-particles | custom-shader、materials-shaders、entities、3d-tiles |
| cesiumjs-core-utilities | viewer-setup、imagery、entities |
| cesiumjs-custom-shader | materials-shaders、3d-tiles、models-particles |
