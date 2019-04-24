import EE from "wolfy87-eventemitter";
import { TWITCH_USERNAME, TWITCH_PASSWORD } from "../secrets";

export default class Twitch extends EE {
  constructor(env) {
    super();

    const tmi = require("tmi.js");

    // Define configuration options
    const opts = {
      identity: {
        username: TWITCH_USERNAME,
        password: TWITCH_PASSWORD
      },
      channels: ["brunstock"]
    };

    // Create a client with our options
    const client = new tmi.client(opts);

    client.on("connected", onConnectedHandler);

    // Connect to Twitch:
    client.connect();

    // Function called when the "dice" command is issued
    function rollDice() {
      const sides = 6;
      return Math.floor(Math.random() * sides) + 1;
    }

    // Called every time the bot connects to Twitch chat
    function onConnectedHandler(addr, port) {
      console.log(`* Connected to ${addr}:${port}`);
    }
    client.on("message", (target, context, message, self) => {
      if (self) {
        return;
      }

      const user = context["display-name"];

      this.emit("message", { user, message });
    });
  }
}
