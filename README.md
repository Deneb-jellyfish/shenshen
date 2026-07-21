# 深闺极限二选一歌单

一个适配手机端的前端小网页，用来给 64 首歌曲做互动淘汰赛。

## 功能

- 64 强到冠军的点击晋级
- 最多 3 次重抽分组
- 支持回改上一轮结果，后续轮次会自动同步
- 冠军弹窗展示，并尝试联网搜索歌曲封面
- 纯静态前端，适合直接部署到 GitHub Pages

## 本地打开

直接打开 `index.html` 就能看，也可以用静态服务器：

```powershell
py -3 -m http.server 4173
```

然后访问 `http://localhost:4173`

## GitHub Pages

这个项目不需要构建，推到 GitHub 仓库后：

1. 进入仓库 `Settings`
2. 打开 `Pages`
3. 在 `Build and deployment` 里选择 `Deploy from a branch`
4. Branch 选 `main`，目录选 `/ (root)`
5. 保存后等待部署完成

之后就会得到一个公开访问链接。
