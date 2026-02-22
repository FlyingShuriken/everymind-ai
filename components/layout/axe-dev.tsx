'use client'
import React from 'react'
import ReactDOM from 'react-dom'
import { useEffect } from 'react'

export function AxeDev() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      import('@axe-core/react').then(({ default: axe }) => {
        axe(React, ReactDOM, 1000)
      })
    }
  }, [])
  return null
}
