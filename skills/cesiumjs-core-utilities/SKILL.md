---
name: cesiumjs-core-utilities
description: "CesiumJS 核心工具与网络 - Resource、Color、Event、Request、RequestScheduler、错误处理、辅助函数、特性检测。在获取远程数据、管理 HTTP 请求、处理颜色、处理事件、调试错误或使用 defined、clone、buildModuleUrl 等工具函数时使用。"
---

# CesiumJS 核心工具与网络

版本基线：CesiumJS v1.139+（ES 模块导入，`defaultValue` 在 v1.134 中已移除）

## 破坏性变更：defaultValue 已移除（v1.134）

```js
// 错误（v1.134 中已移除）
const name = defaultValue(options.name, "default");
const opts = defaultValue(options, defaultValue.EMPTY_OBJECT);

// 正确（v1.134+）
import { Frozen } from "cesium";
const name = options.name ?? "default";
const opts = options ?? Frozen.EMPTY_OBJECT;
```

`Frozen.EMPTY_OBJECT` 是 `Object.freeze({})`，`Frozen.EMPTY_ARRAY` 是 `Object.freeze([])`。将它们用作选项对象和数组参数的安全默认值。

## Resource：HTTP 请求与数据获取

`Resource` 是所有 HTTP 操作的统一类。它封装了 URL 构造、查询参数、请求头、代理和重试逻辑。

### 获取数据

```js
import { Resource } from "cesium";

// 静态简写：接受 URL 字符串或选项对象
const jsonData = await Resource.fetchJson({ url: "https://api.example.com/data.json" });

// 基于实例：构造一次，多次获取复用
const resource = new Resource({
  url: "https://api.example.com/features",
  queryParameters: { format: "json", limit: "100" },
  headers: { "Authorization": "Bearer my-token" },
});
const features = await resource.fetchJson();
const text = await resource.fetchText();           // 字符串
const buffer = await resource.fetchArrayBuffer();  // ArrayBuffer
const blob = await resource.fetchBlob();           // Blob
const image = await resource.fetchImage();         // HTMLImageElement 或 ImageBitmap
```

### 派生资源与模板值

```js
import { Resource } from "cesium";

const api = new Resource({
  url: "https://tiles.example.com/{version}/tiles/{z}/{x}/{y}.png",
  templateValues: { version: "v2" },
  headers: { "X-Api-Key": "abc123" },
});

// getDerivedResource 继承请求头、代理和重试设置
const tile = api.getDerivedResource({
  templateValues: { z: "10", x: "512", y: "384" },
});
const tileImage = await tile.fetchImage();

// 修改现有资源的查询参数
resource.setQueryParameters({ access_token: "new-token" });
resource.appendQueryParameters({ extra: "param" });
```

### 重试与代理

```js
import { Resource, DefaultProxy } from "cesium";

// 针对特定 HTTP 状态码重试
const resource = new Resource({
  url: "https://api.example.com/unstable",
  retryAttempts: 3,
  retryCallback: (resource, error) => {
    if (error.statusCode === 429) {
      return new Promise((resolve) => setTimeout(() => resolve(true), 2000));
    }
    return false;
  },
});

// DefaultProxy 将目标 URL 附加为查询参数
const proxied = new Resource({
  url: "https://external-server.com/data.json",
  proxy: new DefaultProxy("/proxy/"),
});
// 请求发送到：/proxy/?https%3A%2F%2Fexternal-server.com%2Fdata.json
```

### POST 和 PUT

```js
import { Resource } from "cesium";

const resource = new Resource({ url: "https://api.example.com/upload" });
const result = await resource.post(JSON.stringify({ name: "test" }), {
  headers: { "Content-Type": "application/json" },
});
// resource.put() 用法相同
```

## Color

RGBA 分量以浮点数 [0.0, 1.0] 表示。超过 140 个命名常量作为冻结静态属性提供（例如 `Color.RED`、`Color.CORNFLOWERBLUE`、`Color.TRANSPARENT`）。

### 创建颜色

```js
import { Color } from "cesium";

const red = Color.RED;                                        // 冻结常量
const custom = new Color(0.2, 0.6, 0.8, 1.0);               // 浮点构造器
const blue = Color.fromCssColorString("#3498db");             // 十六进制字符串
const semiRed = Color.fromCssColorString("rgba(255,0,0,0.5)"); // CSS rgba()
const coral = Color.fromBytes(255, 127, 80, 255);            // 0-255 字节
const hsl = Color.fromHsl(0.58, 0.8, 0.5, 1.0);             // 色相/饱和度/亮度
const bright = Color.fromRandom({                             // 约束随机
  minimumRed: 0.75, minimumGreen: 0.75, minimumBlue: 0.75, alpha: 1.0,
});
```

### 操作与转换

```js
import { Color } from "cesium";

const base = Color.fromCssColorString("#3498db");
const translucent = base.withAlpha(0.5);                // 带透明度的新 Color
const lighter = base.brighten(0.3, new Color());        // 需要 result 参数
const darker = base.darken(0.3, new Color());
const css = base.toCssColorString();                    // "rgb(52,152,219)"
const hex = base.toCssHexString();                      // "#3498db"
const bytes = base.toBytes();                           // [52, 152, 219, 255]
const equal = Color.RED.equals(new Color(1.0, 0.0, 0.0, 1.0)); // true
```

## 事件系统

`Event` 是 CesiumJS 中使用的发布-订阅机制。类暴露 Event 属性，如 `Viewer.selectedEntityChanged` 和 `Cesium3DTileset.tileLoad`。

### 基本用法

```js
import { Event } from "cesium";

const onDataReceived = new Event();

// addEventListener 返回一个移除函数
const removeListener = onDataReceived.addEventListener((data) => {
  console.log("收到:", data);
});

onDataReceived.raiseEvent({ id: 1, value: "test" }); // 调用所有监听器
removeListener(); // 取消订阅
```

### EventHelper 批量清理

```js
import { EventHelper } from "cesium";

const helper = new EventHelper();
helper.add(viewer.selectedEntityChanged, (entity) => {
  console.log("选中:", entity?.name);
});
helper.add(viewer.clock.onTick, (clock) => { /* 每帧逻辑 */ });
helper.add(viewer.scene.globe.tileLoadProgressEvent, (queueLength) => {
  console.log("加载中的瓦片数:", queueLength);
});

// 一次移除所有监听器（例如在销毁方法中）
helper.removeAll();
```

## RequestScheduler 配置

`RequestScheduler` 是一个管理并发请求限制的单例。`Request` 对象表示单个 HTTP 请求，带有优先级和限流（主要内部使用）。

```js
import { RequestScheduler } from "cesium";

RequestScheduler.maximumRequests = 64;            // 全局最大数（默认：50）
RequestScheduler.maximumRequestsPerServer = 12;   // 每服务器最大数（默认：18）

// 覆盖已知的 HTTP/2 服务器
RequestScheduler.requestsByServer = {
  "api.cesium.com:443": 32,
  "assets.cesium.com:443": 32,
};
```

## 错误处理

- **DeveloperError** —— 调用代码中的 bug（无效参数）。仅在调试构建中抛出；修复代码，不要捕获。
- **RuntimeError** —— 运行时失败（网络、着色器编译）。在生产中捕获。

```js
import { RuntimeError, formatError, Cesium3DTileset } from "cesium";

try {
  const tileset = await Cesium3DTileset.fromUrl("https://example.com/tileset.json");
  viewer.scene.primitives.add(tileset);
} catch (error) {
  if (error instanceof RuntimeError) {
    console.error("加载 tileset 失败:", error.message);
  } else {
    console.error(formatError(error)); // 提取名称、消息、堆栈
  }
}
```

## 辅助函数

### defined、clone、combine

```js
import { defined, clone, combine } from "cesium";

// defined：如果值既不是 null 也不是 undefined 则返回 true
if (defined(entity.billboard)) {
  entity.billboard.scale = 2.0;
}

// clone：默认为浅拷贝，传入 true 进行深拷贝
const obj = clone({ a: 1, nested: { b: 2 } }, true);

// combine：合并对象，第一个参数的键优先
const merged = combine({ size: 20 }, { size: 10, color: "red" });
// { size: 20, color: "red" }
```

### createGuid、buildModuleUrl

```js
import { createGuid, buildModuleUrl } from "cesium";

const id = createGuid(); // "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"

// 解析相对于 Cesium 安装路径的路径
const iconUrl = buildModuleUrl("Assets/Textures/maki/marker.png");
```

### URL 工具

```js
import { objectToQuery, queryToObject, getExtensionFromUri, getBaseUri } from "cesium";

const qs = objectToQuery({ key1: "value 1", key2: ["x", "y"] });
// "key1=value%201&key2=x&key2=y"

const parsed = queryToObject("key1=value%201&key2=x&key2=y");
// { key1: "value 1", key2: ["x", "y"] }

getExtensionFromUri("https://example.com/model.glb?v=2"); // "glb"
getBaseUri("https://example.com/data/model.glb");          // "https://example.com/data/"
```

### destroyObject

将对象上的所有方法替换为抛出 `DeveloperError` 的函数，并将 `isDestroyed()` 设置为返回 `true`。持有本地资源的对象的标准清理模式。

```js
import { destroyObject } from "cesium";

class MyWidget {
  constructor(viewer) {
    this._handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
  }
  isDestroyed() { return false; }
  destroy() {
    this._handler.destroy();
    return destroyObject(this);
  }
}
```

## AssociativeArray

O(1) 键查找，带有实时 `values` 数组，用于渲染循环中的无分配迭代。

```js
import { AssociativeArray } from "cesium";

const items = new AssociativeArray();
items.set("building-1", { height: 50 });
items.set("building-2", { height: 80 });

items.get("building-1");       // { height: 50 }
items.contains("building-1");  // true

// 无每帧分配迭代
const values = items.values;
for (let i = 0; i < values.length; i++) { /* 处理 values[i] */ }

items.remove("building-1");
items.removeAll();
```

## PinBuilder

生成地图大头针 canvas 元素，支持颜色、文本、maki 图标或自定义图像。

```js
import { PinBuilder, Color, Cartesian3, VerticalOrigin } from "cesium";

const pin = new PinBuilder();
const redPin = pin.fromColor(Color.RED, 48);                         // 纯色
const textPin = pin.fromText("A", Color.BLUE, 48);                   // 文本标签
const iconPin = await pin.fromMakiIconId("hospital", Color.GREEN, 48); // maki 图标
const urlPin = await pin.fromUrl("/icons/custom.png", Color.YELLOW, 48);

viewer.entities.add({
  position: Cartesian3.fromDegrees(-75.17, 39.95),
  billboard: {
    image: pin.fromText("1", Color.ROYALBLUE, 48),
    verticalOrigin: VerticalOrigin.BOTTOM,
  },
});
```

## DistanceDisplayCondition

根据相机距离控制实体/布告板/标签的可见性。

```js
import { DistanceDisplayCondition, Cartesian3, Color } from "cesium";

viewer.entities.add({
  position: Cartesian3.fromDegrees(-75.17, 39.95),
  billboard: {
    image: "/icons/marker.png",
    distanceDisplayCondition: new DistanceDisplayCondition(100.0, 50000.0),
  },
});
```

## 特性检测与全屏

```js
import { FeatureDetection, Fullscreen } from "cesium";

if (FeatureDetection.supportsWebAssembly()) { /* WASM 工作线程可用 */ }
if (FeatureDetection.supportsTypedArrays()) { /* TypedArrays 可用 */ }

if (Fullscreen.supportsFullscreen()) {
  Fullscreen.requestFullscreen(viewer.container);
}
```

## TaskProcessor

封装 Web Worker 用于后台计算。Worker 在首次 `scheduleTask` 时惰性创建。

```js
import { TaskProcessor, defined } from "cesium";

const processor = new TaskProcessor("myWorkerModule");
const promise = processor.scheduleTask({ data: largeArray, op: "simplify" });

if (!defined(promise)) {
  // 活动任务过多；下一帧重试
} else {
  const result = await promise;
}
processor.destroy(); // 完成时释放 worker
```

## TrustedServers

凭据（cookie、认证头）仅发送给已注册的服务器。

```js
import { TrustedServers } from "cesium";

TrustedServers.add("secure-tiles.example.com", 443);
TrustedServers.contains("https://secure-tiles.example.com/tileset.json"); // true
TrustedServers.remove("secure-tiles.example.com", 443);
```

## 性能提示

1. **复用 Resource 实例** —— `getDerivedResource` 继承代理、请求头和重试配置，无需重新解析 URL。
2. **为 HTTP/2 调整 RequestScheduler** —— 通过 `requestsByServer` 增加 `maximumRequests` 和每服务器限制，加快瓦片加载速度。
3. **使用 `Frozen.EMPTY_OBJECT` 作为默认值** —— 避免在热路径上的每次调用中分配新的 `{}`。
4. **优先使用 `defined()` 而非真值检查** —— 正确区分 `0`、`""` 和 `false` 与 `null`/`undefined`。
5. **在渲染循环中使用 AssociativeArray** —— 其 `values` 数组避免每次 `Object.keys()` 分配。
6. **保守设置 retryAttempts** —— 通过 `retryCallback` 仅在特定状态码（401、429、503）上重试。
7. **完成后销毁 TaskProcessor** —— 空闲 worker 仍消耗内存。
8. **绝不要修改冻结的 Color 常量** —— 先调用 `.clone()` 或 `.withAlpha()`。
9. **在 catch 块中使用 `formatError`** —— 从任何错误类型中提取名称、消息和堆栈。
10. **缓存 PinBuilder 输出** —— 在跨帧生成许多相同的大头针时存储 canvas 引用。

## 参见

- **cesiumjs-viewer-setup** —— Viewer 初始化、Ion 令牌、场景配置
- **cesiumjs-imagery** —— 使用 `Resource` 进行瓦片获取的影像提供者
- **cesiumjs-entities** —— 使用 `Color`、`DistanceDisplayCondition` 和 `PinBuilder` 的 Entity API
