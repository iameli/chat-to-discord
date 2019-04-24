const remote = require("electron").remote;

const delay = ms => new Promise(r => setTimeout(r, ms));

const queryContainer = () => {
  const chatframe = document.querySelector("#chatframe");
  if (!chatframe) {
    return null;
  }
  return chatframe.contentDocument.querySelector(
    ".yt-live-chat-item-list-renderer"
  );
};

const getContainer = async () => {
  let elem = queryContainer();
  while (!elem) {
    console.log("polling");
    await delay(500);
    elem = queryContainer();
  }
  console.log("found it");
  return elem;
};

window.addEventListener("DOMContentLoaded", async () => {
  const emit = remote.getGlobal("youtubeEmit");

  const targetNode = await getContainer();

  // Options for the observer (which mutations to observe)
  var config = { attributes: false, childList: true, subtree: true };

  // Callback function to execute when mutations are observed
  const callback = (mutationsList, observer) => {
    for (var mutation of mutationsList) {
      if (mutation.type == "childList") {
        for (const node of mutation.addedNodes) {
          const { tagName, innerText } = node;
          if (tagName !== "YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER") {
            continue;
          }
          const [user, message] = innerText
            .trim()
            .split("\n")
            .map(x => x.trim());
          // console.log(`${user}: ${message}`);
          emit("message", { user, message });
        }
      }
    }
  };

  // Create an observer instance linked to the callback function
  var observer = new MutationObserver(callback);

  // Wait three seconds for the already-there messages to settle
  setTimeout(() => {
    observer.observe(targetNode, config);
  }, 3000);

  // Later, you can stop observing
  // observer.disconnect();
});

function callback(mutationList, observer) {
  for (const mutation of mutationList) {
    console.log(mutation);
  }
}
