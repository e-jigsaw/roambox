import React, { useCallback } from 'react'
import { render } from 'react-dom'
import format from 'date-fns/format'

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
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 10000 }}>
      <button onClick={gotoDailyNote}>Daily Notes</button>
    </div>
  )
}

const container = document.createElement('div')
document.body.appendChild(container)
render(<App></App>, container)
