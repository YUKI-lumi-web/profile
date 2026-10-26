# YU Personal Portfolio

一个无需构建工具的静态个人作品网站，使用原生 HTML、CSS 和 JavaScript。

## 本地预览

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

打开 `http://127.0.0.1:4173`。

## 内容替换

- 在 `index.html` 中替换 `YU`、个人简介、联系邮箱和项目文案。
- 在 `app.js` 顶部的 `projectData` 中替换项目详情。
- 把真实作品图片放进 `assets/`，保持当前文件名或在 HTML、JavaScript 中同步修改路径。
- 如果不需要保留示例项目，可将三个项目替换为自己的真实案例。

## 视觉素材

当前项目视觉位于 `assets/`，由 `art-source/index.html` 生成。
如需重新导出：

```powershell
node art-source/capture.js
```

## 浏览器验收

本地服务启动后运行：

```powershell
node check-site.js
```

脚本会检查桌面、平板和手机布局，并更新 `screenshots/` 中的预览图。
