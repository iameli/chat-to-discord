import EE from "wolfy87-eventemitter";
import express from "express";
import open from "open";
import fs from "fs-extra";
import path from "path";
import os from "os";
import debug from "debug";
import ms from "ms";
import { google } from "googleapis";
import { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET } from "../secrets.json";

const log = debug("chat:input:youtube");

const CLIENT_ID = YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = YOUTUBE_CLIENT_SECRET;

const TOKEN_DIR = path.resolve(os.homedir(), ".chat");
const TOKEN_FILE = path.resolve(TOKEN_DIR, "youtube.json");
const youtube = google.youtube("v3");

export default class YouTube extends EE {
  constructor() {
    super();
    this.start();
  }

  async start() {
    await fs.ensureDir(TOKEN_DIR);
    const OAuth2 = google.auth.OAuth2;
    const redirectURI = "http://localhost:3333/";
    // Permissions needed to view and submit live chat comments

    this.auth = new OAuth2(CLIENT_ID, CLIENT_SECRET, redirectURI);
    let ready = false;
    try {
      if (await fs.pathExists(TOKEN_FILE)) {
        const tokens = JSON.parse(await fs.readFile(TOKEN_FILE, "utf8"));
        this.auth.setCredentials(tokens);
        ready = true;
      }
    } catch (e) {
      log(e);
    }
    if (!ready) {
      try {
        const tokens = await this.oauth();
        this.auth.setCredentials(tokens);
        ready = true;
      } catch (e) {
        log(e);
      }
    }
    if (!ready) {
      throw new Error("unable to start YouTube");
    }

    await this.getChatId();
    setInterval(() => this.getChatId(), ms("15 seconds"));
    // await this.getChats();
    // setInterval(() => this.getChats(), ms("2.5 seconds"));
  }

  async getChats() {
    if (!this.liveChatId) {
      this.nextPage = null;
      return;
    }
    const response = await youtube.liveChatMessages.list({
      auth: this.auth,
      part: "authorDetails,snippet",
      liveChatId: this.liveChatId,
      pageToken: this.nextPage
    });
    const { data } = response;
    setTimeout(() => this.getChats(), data.pollingIntervalMillis);
    const newMessages = data.items;
    // Discard the first page of stale results, only post new messsages
    if (this.nextPage) {
      data.items.forEach(item => {
        this.emit("message", {
          message: item.snippet.displayMessage,
          user: item.authorDetails.displayName
        });
      });
    }
    this.nextPage = data.nextPageToken;
    // console.log('Total Chat Messages:', chatMessages.length)
  }

  async getChatId() {
    const response = await youtube.liveBroadcasts.list({
      auth: this.auth,
      part: "snippet",
      // mine: "true",
      broadcastType: "all",
      broadcastStatus: "active"
    });
    if (!response.data.items[0] || !response.data.items[0].snippet.liveChatId) {
      this.liveChatId = null;
      this.nextPage = null;
      return log("couldn't find currently active chat");
    }
    const { liveChatId } = response.data.items[0].snippet;
    if (liveChatId === this.liveChatId) {
      return;
    }
    this.liveChatId = response.data.items[0].snippet.liveChatId;
    this.nextPage = null;
    log(`found live chat id ${this.liveChatId}`);
    this.getChats();
  }

  async oauth() {
    const scope = [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.force-ssl"
    ];
    const app = express();
    const authProm = new Promise((resolve, reject) => {
      app.get("/", async (req, res) => {
        try {
          const { code } = req.query;
          const credentials = await this.auth.getToken(code);
          const { tokens } = credentials;
          this.auth.setCredentials(tokens);
          log("youtube Successfully set credentials");
          await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens), "utf8");
          res.end("looks good. you can close this window now.");
        } catch (e) {
          res.status(500);
          res.end(e.message);
          reject(e);
        }
      });
    });
    const authUrl = this.auth.generateAuthUrl({
      access_type: "offline",
      scope
    });
    let listener;
    await new Promise(resolve => {
      listener = app.listen(3333, err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
    open(authUrl);
    await authProm;
    listener.close();
  }
}
