// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {main} from '../models';

export function AddItems(arg1:Array<string>,arg2:Array<main.ItemRecord>):Promise<void>;

export function AddPlayer(arg1:string):Promise<void>;

export function AddPlayerToWhitelist(arg1:string,arg2:string):Promise<void>;

export function AddVehicle(arg1:string,arg2:Array<string>,arg3:main.Coordinates):Promise<void>;

export function AddXp(arg1:Array<string>,arg2:Array<string>,arg3:number):Promise<void>;

export function Alarm():Promise<void>;

export function BanUsers(arg1:Array<string>,arg2:string,arg3:boolean):Promise<void>;

export function CheckForUpdate():Promise<main.UpdateInfo>;

export function CheckModsNeedUpdate():Promise<void>;

export function Chopper():Promise<void>;

export function ConnectRcon(arg1:main.Credentials):Promise<boolean>;

export function CreateHorde(arg1:Array<string>,arg2:number):Promise<void>;

export function DeleteCredentials():Promise<boolean>;

export function DisconnectRcon():Promise<boolean>;

export function Format(arg1:string,arg2:Array<any>):Promise<string>;

export function GetConfig():Promise<main.Config>;

export function GetConfigField(arg1:string):Promise<any>;

export function GetLoadConfigPath():Promise<string>;

export function GetPlayers():Promise<Array<main.Player>>;

export function GetVersion():Promise<string>;

export function GodMode(arg1:Array<string>,arg2:boolean):Promise<void>;

export function Gunshot():Promise<void>;

export function IsRconConnected():Promise<boolean>;

export function KickUsers(arg1:Array<string>,arg2:string):Promise<void>;

export function Lightning(arg1:Array<string>):Promise<void>;

export function LoadCredentials():Promise<main.Credentials>;

export function LoadItemsDialog():Promise<Array<main.ItemRecord>>;

export function LoadMessageDialog():Promise<main.ServerMessage>;

export function OpenFileInExplorer(arg1:string):Promise<void>;

export function RandomLightning():Promise<void>;

export function RandomThunder():Promise<void>;

export function ReadConfig(arg1:string):Promise<void>;

export function RemovePlayersFromWhitelist(arg1:Array<string>,arg2:boolean):Promise<number>;

export function RestartApplication(arg1:Array<string>):Promise<void>;

export function SaveConfigDialog():Promise<void>;

export function SaveCredentials(arg1:main.Credentials):Promise<boolean>;

export function SaveItemsDialog(arg1:Array<main.ItemRecord>):Promise<void>;

export function SaveMessagesDialog(arg1:main.ServerMessage):Promise<void>;

export function SaveWorld():Promise<void>;

export function SendNotification(arg1:main.Notification):Promise<void>;

export function SendRconCommand(arg1:string):Promise<main.RconResponse>;

export function SendWindowsNotification(arg1:main.Notification):Promise<void>;

export function ServerMsg(arg1:string):Promise<void>;

export function SetAccessLevel(arg1:Array<string>,arg2:string):Promise<void>;

export function SetConfigField(arg1:string,arg2:any):Promise<void>;

export function StartRain(arg1:number):Promise<void>;

export function StartStorm(arg1:number):Promise<void>;

export function StopRain():Promise<void>;

export function StopServer():Promise<boolean>;

export function StopWeather():Promise<void>;

export function TeleportToCoordinates(arg1:Array<string>,arg2:main.Coordinates):Promise<void>;

export function TeleportToUser(arg1:Array<string>,arg2:string):Promise<void>;

export function Thunder(arg1:Array<string>):Promise<void>;

export function UnbanUsers(arg1:Array<string>):Promise<void>;

export function Update(arg1:string):Promise<void>;

export function UpdatePzOptions(arg1:main.PzOptions):Promise<boolean>;
