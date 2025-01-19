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
	    rememberCredentials?: boolean;
	    autoConnect?: boolean;
	    rconCheckInterval?: number;
	    disableWeatherControlButtons?: boolean;
	    disableRandomButtons?: boolean;
	    disableOtherButtons?: boolean;
	    debugMode?: boolean;
	
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
	        this.rememberCredentials = source["rememberCredentials"];
	        this.autoConnect = source["autoConnect"];
	        this.rconCheckInterval = source["rconCheckInterval"];
	        this.disableWeatherControlButtons = source["disableWeatherControlButtons"];
	        this.disableRandomButtons = source["disableRandomButtons"];
	        this.disableOtherButtons = source["disableOtherButtons"];
	        this.debugMode = source["debugMode"];
	    }
	}
	export class Coordinates {
	    x: number;
	    y: number;
	    z: number;
	
	    static createFrom(source: any = {}) {
	        return new Coordinates(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.x = source["x"];
	        this.y = source["y"];
	        this.z = source["z"];
	    }
	}
	export class Credentials {
	    ip: string;
	    port: string;
	    password: string;
	
	    static createFrom(source: any = {}) {
	        return new Credentials(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.port = source["port"];
	        this.password = source["password"];
	    }
	}
	export class PzOptions {
	    AdminSafehouse: boolean;
	    AllowCoop: boolean;
	    AllowDestructionBySledgehammer: boolean;
	    AllowNonAsciiUsername: boolean;
	    AnnounceDeath: boolean;
	    AntiCheatProtectionType1: boolean;
	    AntiCheatProtectionType2: boolean;
	    AntiCheatProtectionType3: boolean;
	    AntiCheatProtectionType4: boolean;
	    AntiCheatProtectionType5: boolean;
	    AntiCheatProtectionType6: boolean;
	    AntiCheatProtectionType7: boolean;
	    AntiCheatProtectionType8: boolean;
	    AntiCheatProtectionType9: boolean;
	    AntiCheatProtectionType10: boolean;
	    AntiCheatProtectionType11: boolean;
	    AntiCheatProtectionType12: boolean;
	    AntiCheatProtectionType13: boolean;
	    AntiCheatProtectionType14: boolean;
	    AntiCheatProtectionType15: boolean;
	    AntiCheatProtectionType16: boolean;
	    AntiCheatProtectionType17: boolean;
	    AntiCheatProtectionType18: boolean;
	    AntiCheatProtectionType19: boolean;
	    AntiCheatProtectionType20: boolean;
	    AntiCheatProtectionType21: boolean;
	    AntiCheatProtectionType22: boolean;
	    AntiCheatProtectionType23: boolean;
	    AntiCheatProtectionType24: boolean;
	    AntiCheatProtectionType2ThresholdMultiplier: number;
	    AntiCheatProtectionType3ThresholdMultiplier: number;
	    AntiCheatProtectionType4ThresholdMultiplier: number;
	    AntiCheatProtectionType9ThresholdMultiplier: number;
	    AntiCheatProtectionType15ThresholdMultiplier: number;
	    AntiCheatProtectionType20ThresholdMultiplier: number;
	    AntiCheatProtectionType22ThresholdMultiplier: number;
	    AntiCheatProtectionType24ThresholdMultiplier: number;
	    AutoCreateUserInWhiteList: boolean;
	    BackupsCount: number;
	    BackupsOnStart: boolean;
	    BackupsOnVersionChange: boolean;
	    BackupsPeriod: number;
	    BanKickGlobalSound: boolean;
	    BloodSplatLifespanDays: number;
	    CarEngineAttractionModifier: number;
	    ChatStreams: string;
	    ClientActionLogs: string;
	    ClientCommandFilter: string;
	    ConstructionPreventsLootRespawn: boolean;
	    DefaultPort: number;
	    DenyLoginOnOverloadedServer: boolean;
	    DisableRadioAdmin: boolean;
	    DisableRadioGM: boolean;
	    DisableRadioInvisible: boolean;
	    DisableRadioModerator: boolean;
	    DisableRadioOverseer: boolean;
	    DisableRadioStaff: boolean;
	    DisableSafehouseWhenPlayerConnected: boolean;
	    DiscordEnable: boolean;
	    DiscordToken: string;
	    DiscordChannel: string;
	    DiscordChannelID: string;
	    DisplayUserName: boolean;
	    DoLuaChecksum: boolean;
	    DropOffWhiteListAfterDeath: boolean;
	    Faction: boolean;
	    FactionDaySurvivedToCreate: number;
	    FactionPlayersRequiredForTag: number;
	    FastForwardMultiplier: number;
	    GlobalChat: boolean;
	    HidePlayersBehindYou: boolean;
	    HoursForLootRespawn: number;
	    ItemNumbersLimitPerContainer: number;
	    KickFastPlayers: boolean;
	    KnockedDownAllowed: boolean;
	    LoginQueueConnectTimeout: number;
	    LoginQueueEnabled: boolean;
	    Map: string;
	    MapRemotePlayerVisibility: number;
	    MaxAccountsPerUser: number;
	    MaxItemsForLootRespawn: number;
	    MaxPlayers: number;
	    MinutesPerPage: number;
	    Mods: string;
	    MouseOverToSeeDisplayName: boolean;
	    NoFire: boolean;
	    Open: boolean;
	    PVP: boolean;
	    PVPFirearmDamageModifier: number;
	    PVPMeleeDamageModifier: number;
	    PVPMeleeWhileHitReaction: boolean;
	    PauseEmpty: boolean;
	    PerkLogs: boolean;
	    PingLimit: number;
	    PlayerBumpPlayer: boolean;
	    PlayerRespawnWithOther: boolean;
	    PlayerRespawnWithSelf: boolean;
	    PlayerSafehouse: boolean;
	    Public: boolean;
	    PublicDescription: string;
	    PublicName: string;
	    RemovePlayerCorpsesOnCorpseRemoval: boolean;
	    ResetID: number;
	    SafeHouseRemovalTime: number;
	    SafehouseAllowFire: boolean;
	    SafehouseAllowLoot: boolean;
	    SafehouseAllowNonResidential: boolean;
	    SafehouseAllowRespawn: boolean;
	    SafehouseAllowTrepass: boolean;
	    SafehouseDaySurvivedToClaim: number;
	    SafetyCooldownTimer: number;
	    SafetySystem: boolean;
	    SafetyToggleTimer: number;
	    SaveWorldEveryMinutes: number;
	    ServerPlayerID: number;
	    ShowFirstAndLastName: boolean;
	    ShowSafety: boolean;
	    SledgehammerOnlyInSafehouse: boolean;
	    SleepAllowed: boolean;
	    SleepNeeded: boolean;
	    SneakModeHideFromOtherPlayers: boolean;
	    SpawnItems: string;
	    SpawnPoint: string;
	    SpeedLimit: number;
	    SteamScoreboard: boolean;
	    SteamVAC: boolean;
	    TrashDeleteAll: boolean;
	    UDPPort: number;
	    UPnP: boolean;
	    Voice3D: boolean;
	    VoiceEnable: boolean;
	    VoiceMaxDistance: number;
	    VoiceMinDistance: number;
	    WorkshopItems: string;
	    ServerWelcomeMessage: string;
	
	    static createFrom(source: any = {}) {
	        return new PzOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.AdminSafehouse = source["AdminSafehouse"];
	        this.AllowCoop = source["AllowCoop"];
	        this.AllowDestructionBySledgehammer = source["AllowDestructionBySledgehammer"];
	        this.AllowNonAsciiUsername = source["AllowNonAsciiUsername"];
	        this.AnnounceDeath = source["AnnounceDeath"];
	        this.AntiCheatProtectionType1 = source["AntiCheatProtectionType1"];
	        this.AntiCheatProtectionType2 = source["AntiCheatProtectionType2"];
	        this.AntiCheatProtectionType3 = source["AntiCheatProtectionType3"];
	        this.AntiCheatProtectionType4 = source["AntiCheatProtectionType4"];
	        this.AntiCheatProtectionType5 = source["AntiCheatProtectionType5"];
	        this.AntiCheatProtectionType6 = source["AntiCheatProtectionType6"];
	        this.AntiCheatProtectionType7 = source["AntiCheatProtectionType7"];
	        this.AntiCheatProtectionType8 = source["AntiCheatProtectionType8"];
	        this.AntiCheatProtectionType9 = source["AntiCheatProtectionType9"];
	        this.AntiCheatProtectionType10 = source["AntiCheatProtectionType10"];
	        this.AntiCheatProtectionType11 = source["AntiCheatProtectionType11"];
	        this.AntiCheatProtectionType12 = source["AntiCheatProtectionType12"];
	        this.AntiCheatProtectionType13 = source["AntiCheatProtectionType13"];
	        this.AntiCheatProtectionType14 = source["AntiCheatProtectionType14"];
	        this.AntiCheatProtectionType15 = source["AntiCheatProtectionType15"];
	        this.AntiCheatProtectionType16 = source["AntiCheatProtectionType16"];
	        this.AntiCheatProtectionType17 = source["AntiCheatProtectionType17"];
	        this.AntiCheatProtectionType18 = source["AntiCheatProtectionType18"];
	        this.AntiCheatProtectionType19 = source["AntiCheatProtectionType19"];
	        this.AntiCheatProtectionType20 = source["AntiCheatProtectionType20"];
	        this.AntiCheatProtectionType21 = source["AntiCheatProtectionType21"];
	        this.AntiCheatProtectionType22 = source["AntiCheatProtectionType22"];
	        this.AntiCheatProtectionType23 = source["AntiCheatProtectionType23"];
	        this.AntiCheatProtectionType24 = source["AntiCheatProtectionType24"];
	        this.AntiCheatProtectionType2ThresholdMultiplier = source["AntiCheatProtectionType2ThresholdMultiplier"];
	        this.AntiCheatProtectionType3ThresholdMultiplier = source["AntiCheatProtectionType3ThresholdMultiplier"];
	        this.AntiCheatProtectionType4ThresholdMultiplier = source["AntiCheatProtectionType4ThresholdMultiplier"];
	        this.AntiCheatProtectionType9ThresholdMultiplier = source["AntiCheatProtectionType9ThresholdMultiplier"];
	        this.AntiCheatProtectionType15ThresholdMultiplier = source["AntiCheatProtectionType15ThresholdMultiplier"];
	        this.AntiCheatProtectionType20ThresholdMultiplier = source["AntiCheatProtectionType20ThresholdMultiplier"];
	        this.AntiCheatProtectionType22ThresholdMultiplier = source["AntiCheatProtectionType22ThresholdMultiplier"];
	        this.AntiCheatProtectionType24ThresholdMultiplier = source["AntiCheatProtectionType24ThresholdMultiplier"];
	        this.AutoCreateUserInWhiteList = source["AutoCreateUserInWhiteList"];
	        this.BackupsCount = source["BackupsCount"];
	        this.BackupsOnStart = source["BackupsOnStart"];
	        this.BackupsOnVersionChange = source["BackupsOnVersionChange"];
	        this.BackupsPeriod = source["BackupsPeriod"];
	        this.BanKickGlobalSound = source["BanKickGlobalSound"];
	        this.BloodSplatLifespanDays = source["BloodSplatLifespanDays"];
	        this.CarEngineAttractionModifier = source["CarEngineAttractionModifier"];
	        this.ChatStreams = source["ChatStreams"];
	        this.ClientActionLogs = source["ClientActionLogs"];
	        this.ClientCommandFilter = source["ClientCommandFilter"];
	        this.ConstructionPreventsLootRespawn = source["ConstructionPreventsLootRespawn"];
	        this.DefaultPort = source["DefaultPort"];
	        this.DenyLoginOnOverloadedServer = source["DenyLoginOnOverloadedServer"];
	        this.DisableRadioAdmin = source["DisableRadioAdmin"];
	        this.DisableRadioGM = source["DisableRadioGM"];
	        this.DisableRadioInvisible = source["DisableRadioInvisible"];
	        this.DisableRadioModerator = source["DisableRadioModerator"];
	        this.DisableRadioOverseer = source["DisableRadioOverseer"];
	        this.DisableRadioStaff = source["DisableRadioStaff"];
	        this.DisableSafehouseWhenPlayerConnected = source["DisableSafehouseWhenPlayerConnected"];
	        this.DiscordEnable = source["DiscordEnable"];
	        this.DiscordToken = source["DiscordToken"];
	        this.DiscordChannel = source["DiscordChannel"];
	        this.DiscordChannelID = source["DiscordChannelID"];
	        this.DisplayUserName = source["DisplayUserName"];
	        this.DoLuaChecksum = source["DoLuaChecksum"];
	        this.DropOffWhiteListAfterDeath = source["DropOffWhiteListAfterDeath"];
	        this.Faction = source["Faction"];
	        this.FactionDaySurvivedToCreate = source["FactionDaySurvivedToCreate"];
	        this.FactionPlayersRequiredForTag = source["FactionPlayersRequiredForTag"];
	        this.FastForwardMultiplier = source["FastForwardMultiplier"];
	        this.GlobalChat = source["GlobalChat"];
	        this.HidePlayersBehindYou = source["HidePlayersBehindYou"];
	        this.HoursForLootRespawn = source["HoursForLootRespawn"];
	        this.ItemNumbersLimitPerContainer = source["ItemNumbersLimitPerContainer"];
	        this.KickFastPlayers = source["KickFastPlayers"];
	        this.KnockedDownAllowed = source["KnockedDownAllowed"];
	        this.LoginQueueConnectTimeout = source["LoginQueueConnectTimeout"];
	        this.LoginQueueEnabled = source["LoginQueueEnabled"];
	        this.Map = source["Map"];
	        this.MapRemotePlayerVisibility = source["MapRemotePlayerVisibility"];
	        this.MaxAccountsPerUser = source["MaxAccountsPerUser"];
	        this.MaxItemsForLootRespawn = source["MaxItemsForLootRespawn"];
	        this.MaxPlayers = source["MaxPlayers"];
	        this.MinutesPerPage = source["MinutesPerPage"];
	        this.Mods = source["Mods"];
	        this.MouseOverToSeeDisplayName = source["MouseOverToSeeDisplayName"];
	        this.NoFire = source["NoFire"];
	        this.Open = source["Open"];
	        this.PVP = source["PVP"];
	        this.PVPFirearmDamageModifier = source["PVPFirearmDamageModifier"];
	        this.PVPMeleeDamageModifier = source["PVPMeleeDamageModifier"];
	        this.PVPMeleeWhileHitReaction = source["PVPMeleeWhileHitReaction"];
	        this.PauseEmpty = source["PauseEmpty"];
	        this.PerkLogs = source["PerkLogs"];
	        this.PingLimit = source["PingLimit"];
	        this.PlayerBumpPlayer = source["PlayerBumpPlayer"];
	        this.PlayerRespawnWithOther = source["PlayerRespawnWithOther"];
	        this.PlayerRespawnWithSelf = source["PlayerRespawnWithSelf"];
	        this.PlayerSafehouse = source["PlayerSafehouse"];
	        this.Public = source["Public"];
	        this.PublicDescription = source["PublicDescription"];
	        this.PublicName = source["PublicName"];
	        this.RemovePlayerCorpsesOnCorpseRemoval = source["RemovePlayerCorpsesOnCorpseRemoval"];
	        this.ResetID = source["ResetID"];
	        this.SafeHouseRemovalTime = source["SafeHouseRemovalTime"];
	        this.SafehouseAllowFire = source["SafehouseAllowFire"];
	        this.SafehouseAllowLoot = source["SafehouseAllowLoot"];
	        this.SafehouseAllowNonResidential = source["SafehouseAllowNonResidential"];
	        this.SafehouseAllowRespawn = source["SafehouseAllowRespawn"];
	        this.SafehouseAllowTrepass = source["SafehouseAllowTrepass"];
	        this.SafehouseDaySurvivedToClaim = source["SafehouseDaySurvivedToClaim"];
	        this.SafetyCooldownTimer = source["SafetyCooldownTimer"];
	        this.SafetySystem = source["SafetySystem"];
	        this.SafetyToggleTimer = source["SafetyToggleTimer"];
	        this.SaveWorldEveryMinutes = source["SaveWorldEveryMinutes"];
	        this.ServerPlayerID = source["ServerPlayerID"];
	        this.ShowFirstAndLastName = source["ShowFirstAndLastName"];
	        this.ShowSafety = source["ShowSafety"];
	        this.SledgehammerOnlyInSafehouse = source["SledgehammerOnlyInSafehouse"];
	        this.SleepAllowed = source["SleepAllowed"];
	        this.SleepNeeded = source["SleepNeeded"];
	        this.SneakModeHideFromOtherPlayers = source["SneakModeHideFromOtherPlayers"];
	        this.SpawnItems = source["SpawnItems"];
	        this.SpawnPoint = source["SpawnPoint"];
	        this.SpeedLimit = source["SpeedLimit"];
	        this.SteamScoreboard = source["SteamScoreboard"];
	        this.SteamVAC = source["SteamVAC"];
	        this.TrashDeleteAll = source["TrashDeleteAll"];
	        this.UDPPort = source["UDPPort"];
	        this.UPnP = source["UPnP"];
	        this.Voice3D = source["Voice3D"];
	        this.VoiceEnable = source["VoiceEnable"];
	        this.VoiceMaxDistance = source["VoiceMaxDistance"];
	        this.VoiceMinDistance = source["VoiceMinDistance"];
	        this.WorkshopItems = source["WorkshopItems"];
	        this.ServerWelcomeMessage = source["ServerWelcomeMessage"];
	    }
	}
	export class ImportOptionsResponse {
	    options: PzOptions;
	    success: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ImportOptionsResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.options = this.convertValues(source["options"], PzOptions);
	        this.success = source["success"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ItemRecord {
	    itemId: string;
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new ItemRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.itemId = source["itemId"];
	        this.count = source["count"];
	    }
	}
	export class Notification {
	    title: string;
	    message: string;
	    path: string;
	    variant: string;
	    parameters?: {[key: string]: string};
	
	    static createFrom(source: any = {}) {
	        return new Notification(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.message = source["message"];
	        this.path = source["path"];
	        this.variant = source["variant"];
	        this.parameters = source["parameters"];
	    }
	}
	export class Player {
	    name: string;
	    online: boolean;
	    accessLevel: string;
	    banned: boolean;
	    godmode: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Player(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.online = source["online"];
	        this.accessLevel = source["accessLevel"];
	        this.banned = source["banned"];
	        this.godmode = source["godmode"];
	    }
	}
	
	export class RconResponse {
	    response: string;
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new RconResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.response = source["response"];
	        this.error = source["error"];
	    }
	}
	export class ServerMessage {
	    message: string;
	    lineColors: {[key: number]: string};
	
	    static createFrom(source: any = {}) {
	        return new ServerMessage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.message = source["message"];
	        this.lineColors = source["lineColors"];
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

