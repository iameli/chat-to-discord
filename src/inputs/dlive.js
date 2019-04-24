import { Dlive } from "dlive-javascript-sdk";
import EE from "wolfy87-eventemitter";
import { DLIVE_ID, DLIVE_ACCESS_KEY } from "../secrets.json";

export default class DliveInput extends EE {
  constructor() {
    super();
    this.start();
  }

  async start() {
    // Chat cooldown
    const coolDown = 3000; // 3 seconds

    // Parameter 1: Blockchain username
    // Parameter 2: Your access key for sending messages
    let example = new Dlive(DLIVE_ID, DLIVE_ACCESS_KEY); // Joining sampepper

    example.on("ChatText", message => {
      this.emit("message", {
        user: message.sender.displayname,
        message: message.content
      });
      // console.log(`Messages in Channel ${example.getChannel}: ${message.content}`);

      // if (message.content === "!song") {
      //   example
      //     .sendMessage("Currently no track available...")
      //     .then(result => {
      //       console.log("Message sended!");
      //       console.log(result);
      //     })
      //     .catch(error => {
      //       console.log(`Error while sending message! ${error}`);
      //       // Now we can use our function to try to resend, at this point you would directly use our own function. Please do not use this example in productive use, because it is ...
      //       sendMessage("Currently no track available...");
      //     });
      // }
    });

    example.on("ChatFollow", message => {
      // Say thanks to this user for his follow!
      // sendMessage(`Thanks for the follow, @${message.sender.displayname}`);
    });

    example.on("ChatGift", message => {
      // Say thanks to this user for his gift!
      // sendMessage(
      //   `Thanks for ${message.amount}x ${message.gift}, @${
      //     message.sender.displayname
      //   }`
      // );
    });
  }
}
