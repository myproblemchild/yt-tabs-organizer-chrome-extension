var tabs = {};

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('b1').addEventListener('click', function () {
    reorder(true);
  });
  document.getElementById('b2').addEventListener('click', function () {
    reorder(false);
  });
});


function reorder(shortFirst) {
  const sortedTabIds = Object.keys(tabs).sort((a, b) => {
    return (tabs[a].len - tabs[b].len) * (shortFirst ? 1 : -1);
  });

  sortedTabIds.forEach((tabId, newIndex) => {
    chrome.tabs.move(parseInt(tabId), { index: newIndex }, function () {
      if (chrome.runtime.lastError) {
        console.error("Error moving tab:", chrome.runtime.lastError.message);
      } else {
        console.log(`Moved tab ID: ${tabId} to position ${newIndex}`);
      }
    });
  });
}

function formatLen(l) {
  if (l < 0) {
    return '-1';
  }
  var hours = Math.floor(l / 3600);
  l -= hours * 3600;
  var minutes = Math.floor(l / 60);
  l -= minutes * 60;
  var seconds = Math.min(Math.round(l), 59);
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function createLiForTab(v) {
  const li = document.createElement('li');
  var d = document.createElement('div');
  d.innerHTML = `${v.title} - ${formatLen(v.len)}`;
  li.appendChild(d);
  return li;
}

function displayTabs() {
  const displayElement = document.getElementById('tabs');
  displayElement.innerHTML = '';

  const ul = document.createElement('ul');
  const sortedEntries = Object.entries(tabs).sort((a, b) => {
    return a[1].idx - b[1].idx;
  });
  for (var i = 0; i < sortedEntries.length; i++) {
    ul.appendChild(createLiForTab(sortedEntries[i][1]));
  }
  displayElement.appendChild(ul);
}

function processVideoLengthResponse(response, tab, index) {
  tabs[tab.id] = {
    'title': tab.title,
    'len': (response && response.videoLength) ? response.videoLength : -1,
    'idx': index
  };
  displayTabs();
}

function queryVideoLength(tab, index) {
  chrome.tabs.sendMessage(tab.id, { getVideoLength: true }, function (response) {
    if (chrome.runtime.lastError) {
      console.error("Error sending message to tab:", chrome.runtime.lastError);
    } else {
      console.log("Got video length response: ", response, tab, index);
      processVideoLengthResponse(response, tab, index);
    }
  });
}

chrome.tabs.query({}, function (tabs) {
  const youtubeTabs = tabs.filter(tab => tab.url.includes("youtube.com"));
  youtubeTabs.forEach((tab, index) => {
    chrome.tabs.sendMessage(tab.id, { checkScript: true }, function (response) {
      if (!response) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['contentScript.js']
        }, () => {
          queryVideoLength(tab, index);
        });
      } else {
        queryVideoLength(tab, index);
      }
    });
  });
});
