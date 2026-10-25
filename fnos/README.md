# 把 CookHero 放上飞牛（fnOS）桌面

目标：飞牛桌面上出现 CookHero 图标，点击直接打开手机端页面。

- **服务地址**：`http://192.168.1.100:8086/m/`（CookHero 跑在 Unraid `192.168.1.100` 上）
- **桌面端地址**：`http://192.168.1.100:8086/`（同一个端口，桌面版在根路径）
- 本目录的 `cookhero-fnos.png` 就是图标（512×512，橙色底 + 白色厨师帽）

> 说明：飞牛本身**不需要**跑 CookHero 的容器（那台 VM 只有 2G 内存，装不下 milvus/postgres 全家桶）。
> 这里只是给飞牛桌面加一个「网页应用入口」，点开就跳到 Unraid 上的服务。

---

## 方式 A：DockFN（推荐，最省事）

DockFN 支持把**局域网里其它机器**的 Web 服务注册成飞牛桌面应用，正好适合本场景。

1. 下载 DockFN 的 `.fpk`：https://github.com/lviaa/dockfn/releases
   （x86 / arm 选对自己 NAS 的架构）
2. 飞牛 → **应用中心** → 右上角 **手动安装** → 上传 `.fpk` → 装完打开 DockFN
3. DockFN → **新增应用** → 选择「手动填写」，按下面填：

| 字段 | 值 |
| --- | --- |
| 标题 | `CookHero` |
| 协议 | `http` |
| 默认地址 | `192.168.1.100` |
| 端口 | `8086` |
| 访问路径 | `/m/` |
| 打开方式 | `页内打开`（在飞牛窗口里打开）或 `新窗打开`（独立标签页） |
| 图标 | 上传 `cookhero-fnos.png`，或填 `http://192.168.1.100:8086/m/icons/icon-512.png` |

4. 保存 → 等「入口校验」通过 → 回到飞牛桌面刷新，图标就在了。

> 若 DockFN 没自动扫到，就在「新增应用」里手动填上面那张表，一样能建。

## 方式 B：fn-docker-to-desktop

项目：https://github.com/67373net/fn-docker-to-desktop/releases

同样手动安装 `.fpk`，它自带「**将任意网页快捷方式放置到飞牛桌面**」和「局域网服务反向代理」，
在添加入口时填 `http://192.168.1.100:8086/m/` 即可，图标用 `cookhero-fnos.png`。

## 方式 C：fndesk（飞牛桌面管理神器）

1. https://github.com/IMGZCQ/fndesk 下载对应架构的 `.fpk`，应用中心手动安装
2. 打开 fndesk → **图标 & 文件夹管理** → 左上角 `+`
3. 类型选「原创图标 / 网页快捷方式」，填：
   - 标题：`CookHero`
   - 地址：`http://192.168.1.100:8086/m/`
   - 打开方式：页内 / 新窗
   - 图标：上传 `cookhero-fnos.png`
4. 保存并生效 → 刷新桌面

## 方式 D：以后把整套服务搬进飞牛（可选）

如果哪天真要在飞牛本机跑 CookHero，给 compose 加上 WatchCow 标签，重启容器后飞牛桌面会自动出现图标：

```yaml
services:
  frontend:
    image: cookhero_frontend
    container_name: cookhero_frontend
    restart: unless-stopped
    ports:
      - '8086:80'
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./mobile-dist:/usr/share/nginx/html/m:ro
    labels:
      watchcow.enable: 'true'
      watchcow.appname: 'CookHero'
      watchcow.service_port: '8086'
      watchcow.protocol: 'http'
      watchcow.path: '/m/'
      watchcow.icon: 'file:///vol1/1000/docker/icons/cookhero-fnos.png'
```

⚠️ 飞牛那台 VM 只有 2G 内存，跑 postgres + redis + etcd + minio + milvus + 前后端会非常吃紧，
只建议内存 ≥ 8G 的机器这么干。

---

## 常见问题

**Q：图标点开是白屏 / 打不开？**
先确认飞牛那台机器能访问 `http://192.168.1.100:8086/m/`（在飞牛的浏览器里直接输地址试）。
手机连的是家里 WiFi 时同理。

**Q：手机怎么装成 App？**
手机浏览器打开 `http://192.168.1.100:8086/m/` →
- iPhone：Safari 底部分享 → 「添加到主屏幕」
- 安卓：Chrome 右上角菜单 → 「添加到主屏幕 / 安装应用」

装完就是一个独立图标，全屏无地址栏，离线还能看缓存过的菜谱。

**Q：能不能在外网用？**
可以，用飞牛的 FN Connect / 内网穿透，或者 WireGuard 回家再访问；本服务只监听局域网。
