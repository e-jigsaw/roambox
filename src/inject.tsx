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
      const cursor = document.getElementById('text-input')
      const endEvent = document.createEvent('Events')
      endEvent.initEvent('keydown', true, true)
      endEvent.keyCode = 39 // ArrowRight
      endEvent.metaKey = true
      cursor.dispatchEvent(endEvent)
      const selectEvent = document.createEvent('Events')
      selectEvent.initEvent('keydown', true, true)
      selectEvent.keyCode = 37 // ArrowLeft
      selectEvent.shiftKey = true
      selectEvent.metaKey = true
      cursor.dispatchEvent(selectEvent)
      cursor.dispatchEvent(selectEvent)
      cursor.value = text
      const event = document.createEvent('Event')
      event.initEvent('input', true, true)
      cursor.dispatchEvent(event)
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
