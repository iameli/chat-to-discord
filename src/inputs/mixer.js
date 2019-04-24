import EE from "wolfy87-eventemitter";
import * as Mixer from "@mixer/client-node";
import ws from "ws";
import { MIXER_TOKEN } from "../secrets.json";

export default class MixerClass extends EE {
  constructor() {
    super();
    this.start();
  }

  async start() {
    const ws = require("ws");

    const client = new Mixer.Client(new Mixer.DefaultRequestRunner());

    // With OAuth we don't need to log in. The OAuth Provider will attach
    // the required information to all of our requests after this call.
    client.use(
      new Mixer.OAuthProvider(client, {
        tokens: {
          access: MIXER_TOKEN,
          expires: Date.now() + 365 * 24 * 60 * 60 * 1000
        }
      })
    );

    // Gets the user that the Access Token we provided above belongs to.
    const userResponse = await client.request("GET", "users/current");
    const userInfo = userResponse.body;

    // Returns a promise that resolves with our chat connection details.
    const serviceResponse = await new Mixer.ChatService(client).join(
      userResponse.body.channel.id
    );
    const serviceBody = serviceResponse.body;
    await this.createChatSocket(
      userInfo.id,
      userInfo.channel.id,
      serviceBody.endpoints,
      serviceBody.authkey
    );
  }

  async createChatSocket(userId, channelId, endpoints, authkey) {
    const socket = new Mixer.Socket(ws, endpoints).boot();

    // You don't need to wait for the socket to connect before calling
    // methods. We spool them and run them when connected automatically.
    await socket.auth(channelId, userId, authkey);

    console.log("You are now authenticated!");
    // Send a chat message

    // Listen for chat messages. Note you will also receive your own!
    socket.on("ChatMessage", data => {
      this.emit("message", {
        user: data.user_name,
        message: data.message.message[0].text
      });
    });

    // Listen for socket errors. You will need to handle these here.
    socket.on("error", error => {
      console.error("Socket error");
      console.error(error);
    });
  }
}
