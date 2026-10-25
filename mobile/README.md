# CookHero 移动端（PWA）

手机浏览器打开 **`http://<你的服务器IP>:8086/m/`** →「添加到主屏幕」，就是一个独立 App：
全屏无地址栏、有独立图标、断网也能看缓存过的菜谱。

与桌面端共用同一个端口：**根路径 `/` 是桌面版，`/m/` 是手机版**。

## 功能

| Tab | 能做什么 |
| --- | --- |
| 菜谱 | 393 道菜全文速查：搜索菜名/食材、按分类与难度筛选、无限下拉、随机推荐「今天吃点啥」、收藏、最近浏览 |
| 助手 | AI 烹饪对话（SSE 流式输出，可中断）、历史会话列表、快捷提问 |
| 饮食 | 按天看热量与三大营养素、用一句话记一餐（AI 解析）、删除记录 |
| 我的 | 收藏/最近浏览、服务器地址（换 IP/端口时改这里）、深浅色主题、退出登录 |

## 开发

```bash
cd mobile
npm install
npm run dev        # 本地开发，/api 代理到 localhost:8000
npm run build      # 产出 dist/
npm run icons      # 重新生成 public/icons 下的图标
```

技术栈：Vite 7 + React 19 + TypeScript + Tailwind CSS 4 + react-router 7。
代码只依赖同源的 `/api/v1`（默认），**不依赖大模型**的菜谱浏览走 `GET /api/v1/recipes*`。

## 部署

产物放在 nginx 的 `/usr/share/nginx/html/m/`：

```bash
npm run build
# 把 dist/ 内容同步到服务器上的 mobile-dist 目录，例如：
rsync -av --delete dist/ root@192.168.1.100:/mnt/cachea/appdata/cookhero/mobile-dist/
# 然后让 nginx 重新加载（挂载方式无需重建容器）
ssh root@192.168.1.100 'docker exec cookhero_frontend nginx -s reload'
```

nginx 需要为 `/m/` 配置 SPA 回退（`deployments/nginx.conf` 里已经写好）：

```nginx
location = /m { return 301 /m/; }
location /m/ { try_files $uri $uri/ /m/index.html; }
location = /m/sw.js { add_header Cache-Control "no-cache, no-store, must-revalidate"; expires -1; }
```

> Service Worker 与 manifest **必须**不缓存，否则发版后老用户拿不到新版本。

## 目录结构

```
mobile/
├─ index.html              PWA 元信息（theme-color / apple-touch-icon / manifest）
├─ public/
│  ├─ manifest.webmanifest 名称、图标、shortcuts
│  ├─ sw.js                离线壳 + 菜谱接口缓存
│  └─ icons/               192 / 512 / maskable / apple-touch / favicon
├─ src/
│  ├─ App.tsx              路由 + 登录态
│  ├─ lib/api.ts           REST + SSE 封装
│  ├─ lib/store.ts         token / 服务器地址 / 主题 / 收藏
│  ├─ components/          底部导航、内联图标
│  └─ screens/             菜谱、详情、助手、饮食、我的、登录
└─ tools/gen_icons.py      图标生成脚本（需要 Pillow）
```
