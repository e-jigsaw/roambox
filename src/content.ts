const el = document.createElement('script')
el.src = chrome.extension.getURL('inject.js')
document.head.appendChild(el)
