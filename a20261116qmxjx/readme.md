# 全明星觉醒官网前端

`index.html` 是移动端入口，`index_pc.html` 是 PC 端入口。两个页面共用 `css/`、`js/` 和 `ossweb-img/`，可通过本地静态服务器预览。

页面默认内容保存在 `js/content-data.js`。资讯栏目、列表、海报仍由 `js/ide-news.js` 请求 iDE 接口；如需改用其他内容接口，可在加载 `js/content-api.js` 前设置 `window.ALLSTAR_CONTENT_API_URL`。
