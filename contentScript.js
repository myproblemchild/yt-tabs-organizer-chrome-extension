chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.checkScript) {
        sendResponse({ scriptInjected: true });
    }

    if (message.getVideoLength) {
        const video = document.querySelector('video');

        if (video) {
            const videoLength = video.duration;
            sendResponse({ videoLength: videoLength });
        } else {
            sendResponse({ error: "No video found" });
        }
    }

    return true;
});
