# Squarance Cropper
--------

A JavaScript cropper written for [Squarance](http://www.squarance.com/).

用于[评方网Squarance](http://www.squarance.com/)的一个截图插件。

## How To USE

第一步： 引入squarance.js文件

第二步： JS代码

```JavaScript
var src = '/img/src/image.png'; // 图片地址
var canvas = document.getElementById('canvas'); // 画布
var squarance = new Squarance(src, canvas, width, height); // 调用参数构造
```

## API

| 函数 | 说明 |
| ------| ------ |
| Squarance(src, canvas, width, height) | 构造函数，参数为 _(图片，画布，画布宽，画布高)_ |
| getCropperHeight() | 获取裁剪区域的高度 |
| getCropperWidth() | 获取裁剪区域的宽度 |
| getCropperStartPixel() | 获取裁剪起始点，返回 `[x , y]` 数组形式 |

## Preview And Feature

![裁剪预览](cropper.gif)

1. 加载动画
2. 拖动裁剪框自动缩放
3. 裁剪辅助线
4. 滚轮缩放
5. 拖动图片调整裁剪位置
6. 拖动时超出裁剪范围自动回移

## Contribution

有任何意见和建议都可以在ISSUE中提出来。

## LICENSE

MIT
