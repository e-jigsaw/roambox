// @ts-nocheck
import React, { useCallback } from 'react'
import { render } from 'react-dom'
import format from 'date-fns/format'
import { useKey } from 'react-use'

const originalWs = window.WebSocket
let branch = null
let wm = 0
let parentId = ''
let addListenerWs = originalWs.prototype.addEventListener
addListenerWs = addListenerWs.call.bind(addListenerWs)
let sendWs = originalWs.prototype.send
sendWs = sendWs.apply.bind(sendWs)
originalWs.prototype.send = function (data) {
  if (branch === null) {
    branch = this
    this.addEventListener('message', (event) => {
      console.log('rcv', event.data)
    })
  }
  const parsed = /42(\d+)\["socket\.io\-request",(.*)\]/.exec(data)
  if (parsed !== null) {
    wm = parseInt(parsed[1])
    console.log('snt', JSON.parse(parsed[2]))
  }
  return sendWs(this, arguments)
}

declare global {
  interface Window {
    scrapbox: any
  }
}

let iframe
if (window.parent === window.top) {
  iframe = document.createElement('iframe')
  iframe.src = location.href
  document.body.appendChild(iframe)
  window.addEventListener('message', async (event) => {
    if (event.data.source === 'roambox') {
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
            changes: [
              {
                _update: event.data.payload.id,
                lines: {
                  text: 'foo',
                },
              },
            ],
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
      iframe.contentWindow.postMessage({
        payload: {
          id,
          Page: window.scrapbox.Page,
        },
        source: 'roambox',
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
