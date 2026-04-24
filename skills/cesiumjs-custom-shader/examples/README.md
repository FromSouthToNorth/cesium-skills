# 自定义着色器示例

从 `../SKILL.md` 引用的可编译测试代码片段。

## 目录结构

- `0N-<名称>.js` — **面向用户的代码片段**。从 `cesium` 导入，创建 `CustomShader`，并展示附加调用方式。不含 Viewer 样板代码。这些是技能文档链接到的文件。
- `_sandcastle-template.html` — 内部脚手架，**仅编译测试时使用**。将每个 `.js` 代码片段注入此模板并在 Sandcastle 中打开，以验证其渲染时不出现 GLSL 错误。下划线前缀标记其为非产品工具。

## 资源

所有资源均从公共 `raw.githubusercontent.com` URL 获取 —— 无需 Ion 令牌。每个示例使用的具体数据集在代码片段开头的注释中有说明。

## 本地运行

1. 打开 `https://sandcastle.cesium.com/`。
2. 将 `_sandcastle-template.html` 粘贴到 HTML 标签页。
3. 将其中一个 `0N-*.js` 代码片段粘贴到 JS 标签页中标记的 `// <-- snippet -->` 区域。
4. 点击 **运行**（Run）。
