export namespace main {
	
	export class Config {
	    theme?: string;
	    colorScheme?: string;
	    useSystemTitleBar?: boolean;
	    enableLogging?: boolean;
	    enableTrace?: boolean;
	    enableDebug?: boolean;
	    enableInfo?: boolean;
	    enableWarn?: boolean;
	    enableError?: boolean;
	    enableFatal?: boolean;
	    maxLogFiles?: number;
	    language?: string;
	    saveWindowStatus?: boolean;
	    windowStartState?: number;
	    windowStartPositionX?: number;
	    windowStartPositionY?: number;
	    windowStartSizeX?: number;
	    windowStartSizeY?: number;
	    windowScale?: number;
	    opacity?: number;
	    windowEffect?: number;
	    checkForUpdates?: boolean;
	    lastUpdateCheck?: number;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.colorScheme = source["colorScheme"];
	        this.useSystemTitleBar = source["useSystemTitleBar"];
	        this.enableLogging = source["enableLogging"];
	        this.enableTrace = source["enableTrace"];
	        this.enableDebug = source["enableDebug"];
	        this.enableInfo = source["enableInfo"];
	        this.enableWarn = source["enableWarn"];
	        this.enableError = source["enableError"];
	        this.enableFatal = source["enableFatal"];
	        this.maxLogFiles = source["maxLogFiles"];
	        this.language = source["language"];
	        this.saveWindowStatus = source["saveWindowStatus"];
	        this.windowStartState = source["windowStartState"];
	        this.windowStartPositionX = source["windowStartPositionX"];
	        this.windowStartPositionY = source["windowStartPositionY"];
	        this.windowStartSizeX = source["windowStartSizeX"];
	        this.windowStartSizeY = source["windowStartSizeY"];
	        this.windowScale = source["windowScale"];
	        this.opacity = source["opacity"];
	        this.windowEffect = source["windowEffect"];
	        this.checkForUpdates = source["checkForUpdates"];
	        this.lastUpdateCheck = source["lastUpdateCheck"];
	    }
	}
	export class UpdateInfo {
	    updateAvailable: boolean;
	    currentVersion: string;
	    latestVersion: string;
	    name: string;
	    releaseNotes: string;
	    downloadUrl: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.updateAvailable = source["updateAvailable"];
	        this.currentVersion = source["currentVersion"];
	        this.latestVersion = source["latestVersion"];
	        this.name = source["name"];
	        this.releaseNotes = source["releaseNotes"];
	        this.downloadUrl = source["downloadUrl"];
	    }
	}

}

