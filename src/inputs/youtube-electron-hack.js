import EE from "wolfy87-eventemitter";
import { BrowserWindow, app } from "electron";
import { resolve } from "path";

export default class YouTubeInput extends EE {
  constructor() {
    super();
    app.on("ready", () => {
      this.start();
    });
  }
  start() {
    global.youtubeEmit = (type, obj) => {
      this.emit(type, obj);
    };
    this.win = new BrowserWindow({
      width: 1200,
      height: 768,
      show: true,
      webPreferences: {
        nodeIntegration: false,
        preload: resolve(__dirname, "youtube-electron-preload.js")
      }
    });
    // this.win.webContents.openDevTools();
    this.win.on("closed", () => {
      this.win = null;
    });

    // Load a remote URL
    this.win.loadURL("https://www.youtube.com/c/StreamKitchenOfficial/live");
  }
}
