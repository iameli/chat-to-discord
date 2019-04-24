import * as inputs from "./inputs";
import fetch from "isomorphic-fetch";
import debug from "debug";
import { DISCORD_URL } from "./secrets.json";

const log = debug("chat:message");

for (const [serviceName, Input] of Object.entries(inputs)) {
  const instance = new Input();
  instance.on("message", ({ message, user }) => {
    const username = `[${serviceName}] ${user.toLowerCase()}`;
    log(`${username}: ${message}`);
    fetch(DISCORD_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        content: message,
        username
      })
    });
  });
}
// content	string	the message contents(up to 2000 characters)	one of content, file, embeds
// username	string	override the default username of the webhook	false
// avatar_url	string	override the default avatar of the webhook	false
// tts	boolean	true if this is a TTS message	false
// file	file contents	the contents of the file being sent	one of content, file, embeds
// embeds	array of embed objects	embedded rich content	one of content, file, embeds
// payload_json	string	See message create	multipart / form - data only
