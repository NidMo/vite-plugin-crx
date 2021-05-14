export interface Options extends Omit<Manifest,"background" | "content_scripts"> {
    /**
     * dev server的host
     * @description 不是vite的开发服务器，是插件特有的web socket
     */
    host?: string;
    /**
     * dev server的port
     * @description 不是vite的开发服务器，是插件特有的web socket
     */
    port?: number;
    /**
     * 扩展background的入口
     * @description 详细文档 https://developer.chrome.com/docs/extensions/mv2/background_pages/
     */
    background?: BackgroundOpts;
    /**
     * 扩展content-script的入口
     * @description 详细文档 https://developer.chrome.com/docs/extensions/mv2/content_scripts/
     */
    content?: ContentOpts;
}



export interface ResolvedOptions extends Options {
    root: string;
}

export type BackgroundOpts =  string | string[] | Background;

export type ContentOpts = string | string[] | ContentScript[];

/**
 * 后台脚本
 */
export interface Background {
    /**
     * 扩展后台常驻页面
     */
    page?: string;
    /**
     * 扩展后台常驻js
     */
    scripts?: string[];
}

/**
 * 内容脚本
 */
export interface ContentScript {
    /**
     * 内容脚本被注入到哪些页面的匹配规则
     */
    matches: string[] |  ["<all_urls>"];
    /**
     * 注入的css文件列表
     */
    css?: string[];
    /**
     * 注入的js文件列表
     */
    js?: string[];
    /**
     * 脚本是否应注入到about:blank
     */
    match_about_blank?: boolean;
    /**
     * 排除本内容脚本将被注入的页面
     */
    exclude_matches?: string[];
    /**
     * 包含与该glob匹配的URL
     */
    include_globs?: string[];
    /**
     * 排除与该glob匹配的URL
     */
    exclude_globs?: string[];
    /**
     * 内容脚本执行时机
     */
    run_at?: "document_idle" | "document_start" | "document_end",
    /**
     * 是否将内容脚本注入到所有frame
     */
    all_frames?: boolean;
}

export type Permission =
    | "debugger"
    | "declarativeNetRequest"
    | "contextMenus"
    | "tabs"
    | "notifications"
    | "webRequest"
    | "webRequestBlocking"
    | "storage"
    | "http://*/*"
    | "https://*/*"
    | "<all_urls>"
    | "devtools"
    | "proxy";

export interface Manifest {
    /**
     * 扩展清单文件版本
     * @description 暂时只支持版本为2
     */
    manifest_version?: 2 | 3;
    /**
     * 扩展名称
     */
    name: string;
    /**
     * 扩展版本号
     */
    version: string;
    /**
     * 扩展描述
     */
    description?: string;
    /**
     * 扩展icons
     * @example
     * "icons": { "16": "icon16.png", "48": "icon48.png", "128": "icon128.png" }
     * "icons:" "icon.png"
     */
    icons?: ExtensionIcons;
    /**
     * 始终显示的扩展按钮
     */
    browser_action?: Action;
    /**
     * 只在特定页面显示的扩展按钮
     */
    page_action?: Action;
    /**
     * 扩展background的入口
     * @description 详细文档 https://developer.chrome.com/docs/extensions/mv2/background_pages/
     */
    background?: Background;
    /**
     * 扩展content-script的入口
     * @description 详细文档 https://developer.chrome.com/docs/extensions/mv2/content_scripts/
     */
    content_scripts?: ContentScript[]
    /**
     * 扩展权限列表
     */
    permissions?: Permission[] | string[];
    /**
     * 普通页面能够直接访问扩展的资源列表
     */
    web_accessible_resources?: string | string[];
}

export type ExtensionIcons = Record<string, string> | string;

/**
 * 扩展图标按钮
 * @description 位于地址栏的右侧
 * @description `brower_action`和`page_action`两个属性只能同时存在一个
 * @description 详细文档 https://developer.chrome.com/docs/extensions/reference/browserAction/
 */
export interface Action {
    /**
     * 扩展图标
     */
    default_action?: ExtensionIcons;
    /**
     * 鼠标悬停到扩展图标上显示的标题
     */
    default_title?: string;
    /**
     * 点击扩展图标弹出的页面
     */
    default_popup?: string;
}
