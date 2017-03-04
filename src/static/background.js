// Listens for browser action clicks and loads the main
// application page when the icon is clicked.

chrome.browserAction.onClicked.addListener(tab => {
  return chrome.tabs.create({
    url: 'main.html'
  })
})
