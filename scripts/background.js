
function inject (tab) {
  chrome.tabs.sendMessage(tab.id, {message: 'init'}, (res) => {
    if (res) {
      clearTimeout(timeout)
    }
  })

  var timeout = setTimeout(() => {
    chrome.tabs.insertCSS(tab.id, {file: 'libraries/jquery.Jcrop.min.css', runAt: 'document_start'})
    chrome.tabs.insertCSS(tab.id, {file: 'css/content.css', runAt: 'document_start'})

    chrome.tabs.executeScript(tab.id, {file: 'libraries/jquery.min.js', runAt: 'document_start'})
    chrome.tabs.executeScript(tab.id, {file: 'libraries/jquery.Jcrop.min.js', runAt: 'document_start'})
    chrome.tabs.executeScript(tab.id, {file: 'scripts/content.js', runAt: 'document_start'})

    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, {message: 'init'})
    }, 100)
  }, 100)
}

chrome.browserAction.onClicked.addListener((tab) => {
  inject(tab)
})

chrome.commands.onCommand.addListener((command) => {
  if (command === 'take-screenshot') {
    chrome.tabs.getSelected(null, (tab) => {
      inject(tab)
    })
  }
})

chrome.runtime.onMessage.addListener((req, sender, res) => {
  if (req.message === 'capture') {
    chrome.storage.sync.get((config) => {

      chrome.tabs.getSelected(null, (tab) => {

        chrome.tabs.captureVisibleTab(tab.windowId, {format: config.format}, (image) => {

          if (config.method === 'view') {
            if (req.dpr !== 1 && !config.dpr) {
              crop(image, req.area, req.dpr, config.dpr, config.format, (cropped) => {
                res({message: 'image', image: cropped})
              })
            }
            else {
              res({message: 'image', image: image})
            }
          }
          else {
            crop(image, req.area, req.dpr, config.dpr, config.format, (cropped) => {
              res({message: 'image', image: cropped})
            })
          }
        })
      })
    })
  }
  return true
})

function crop (image, area, dpr, preserve, format, done) {
  var top = area.y * dpr
  var left = area.x * dpr
  var width = area.w * dpr
  var height = area.h * dpr
  var w = (dpr !== 1 && preserve) ? width : area.w
  var h = (dpr !== 1 && preserve) ? height : area.h

  var canvas = null
  if (!canvas) {
    canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
  }
  canvas.width = w
  canvas.height = h

  var img = new Image()
  img.onload = () => {
    var context = canvas.getContext('2d')
    context.drawImage(img,
      left, top,
      width, height,
      0, 0,
      w, h
    )

    var cropped = canvas.toDataURL(`image/${format}`)
    done(cropped)
  }
  img.src = image
}
