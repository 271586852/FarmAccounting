# 阿里巴巴矢量图标库（iconfont）使用说明

## 方法一：使用在线字体（推荐）

1. 访问 [iconfont.cn](https://www.iconfont.cn/)
2. 搜索并选择需要的图标：
   - 记账图标：搜索"账单"或"记录"
   - 添加图标：搜索"添加"或"plus"
   - 统计图标：搜索"统计"或"图表"
   - 删除图标：搜索"删除"或"垃圾桶"
   - 日期图标：搜索"日期"或"日历"
3. 将图标添加到项目
4. 在项目设置中，选择"Font class"方式
5. 复制生成的CSS代码
6. 将CSS代码中的 `@font-face` 和 `.iconfont` 样式复制到 `miniprogram/iconfont/iconfont.wxss`
7. 使用方式：`<text class="iconfont icon-xxx"></text>`

## 方法二：使用Unicode字符（简单快速）

如果不想配置在线字体，可以直接使用Unicode字符或Emoji：

- 记账：📝 或 📋
- 添加：➕
- 统计：📊 或 📈
- 删除：🗑️
- 日期：📅

当前代码已使用Emoji作为临时方案，如需使用iconfont，请按照方法一配置。

## 方法三：使用图片图标

1. 在iconfont.cn下载图标为PNG格式
2. 将图片保存到 `miniprogram/iconfont/` 目录
3. 在代码中使用 `<image>` 标签引用

