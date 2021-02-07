// @ts-nocheck
import React, { useCallback } from 'react'
import { render } from 'react-dom'
import format from 'date-fns/format'
import { useKey } from 'react-use'

declare global {
  interface Window {
    scrapbox: any
  }
}

const isIframe = window.parent !== window
let iframe
const originalWs = window.WebSocket
let branch = null
let wm = 0
let parentId = ''

let addListenerWs = originalWs.prototype.addEventListener
addListenerWs = addListenerWs.call.bind(addListenerWs)

let sendWs = originalWs.prototype.send
sendWs = sendWs.apply.bind(sendWs)

const dispatch = (payload) => {
  iframe.contentWindow.postMessage({ payload, source: 'roambox' })
}

originalWs.prototype.send = function (data) {
  if (branch === null) {
    branch = this
    this.addEventListener('message', (event) => {
      console.log('rcv', event.data)
      const parsed = /\d+\[(.*)\]/.exec(event.data)
      if (parsed !== null) {
        if (/^{/.test(parsed[1])) {
          const json = JSON.parse(parsed[1])
          if (json.data.commitId) {
            if (isIframe) {
              parentId = json.data.commitId
            } else {
              dispatch({ type: 'commited', id: json.data.commitId })
            }
          }
        }
      }
    })
  }
  const parsed = /42(\d+)\["socket\.io\-request",(.*)\]/.exec(data)
  if (parsed !== null) {
    wm = parseInt(parsed[1])
    console.log('snt', JSON.parse(parsed[2]))
  }
  return sendWs(this, arguments)
}

if (!isIframe) {
  iframe = document.createElement('iframe')
  iframe.src = location.href
  document.body.appendChild(iframe)
} else {
  window.addEventListener('message', async (event) => {
    if (event.data.source === 'roambox') {
      switch (event.data.payload.type) {
        case 'commited': {
          parentId = event.data.payload.id
          break
        }
        case 'send': {
          if (parentId.length === 0) {
            const { commitId } = await fetch(
              `https://scrapbox.io/api/pages/${window.scrapbox.Project.name}/${event.data.payload.Page.title}`
            ).then((res) => res.json())
            parentId = commitId
          }
          const [project, user] = await Promise.all([
            fetch(
              `https://scrapbox.io/api/projects/${window.scrapbox.Project.name}`
            ).then((res) => res.json()),
            fetch('https://scrapbox.io/api/users/me').then((res) => res.json()),
          ])
          branch.send(
            `42${wm + 1}["socket.io-request",${JSON.stringify({
              method: 'commit',
              data: {
                changes: event.data.payload.changes,
                cursor: null,
                freeze: true,
                kind: 'page',
                pageId: event.data.payload.Page.id,
                parentId,
                projectId: project.id,
                userId: user.id,
              },
            })}]`
          )
          break
        }
      }
    }
  })
}

const App = () => {
  const gotoDailyNote = useCallback(() => {
    location.href = `https://scrapbox.io/${
      window.scrapbox.Project.name
    }/${format(new Date().getTime(), 'yyyyMMdd')}`
  }, [])
  useKey(
    (event) => {
      return event.metaKey && event.key === 'Enter'
    },
    async () => {
      const id = document
        .getElementsByClassName('cursor-line')[0]
        .id.replace(/^L/, '')
      const line = window.scrapbox.Page.lines.find((line) => line.id === id)
      let text = ''
      if (line.text.length === 0) {
        text = '[todo]'
      } else if (line.text.indexOf('[todo]') >= 0) {
        text = line.text.replace(/\[todo\]/, '[done]')
      } else if (line.text.indexOf('[done]') >= 0) {
        text = line.text.replace(/\[done\]\s*/, '')
      } else {
        if (line.nodes.type === 'indent') {
          text = `${line.nodes.unit.tag}[todo] ${line.nodes.unit.content}`
        } else {
          text = `[todo] ${line.text}`
        }
      }
      dispatch({
        type: 'send',
        changes: [
          {
            _update: id,
            lines: {
              text,
            },
          },
        ],
        Page: window.scrapbox.Page,
      })
    }
  )
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 10000 }}>
      <button onClick={gotoDailyNote}>Daily Notes</button>
    </div>
  )
}

const container = document.createElement('div')
document.body.appendChild(container)
render(<App></App>, container)
