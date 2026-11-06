(function () {
  'use strict'

  var html = document.documentElement
  var script = document.getElementById('screenFix')
  var designWidth = Number(script && script.getAttribute('data-size')) || 750
  html.style.fontSize = '100px'
  var probe = document.createElement('div')
  probe.style.cssText = 'width:1rem;position:absolute;visibility:hidden;pointer-events:none;'
  document.body.appendChild(probe)
  var measuredRem = probe.offsetWidth
  document.body.removeChild(probe)

  var baseRem = measuredRem && measuredRem !== 100 ? 100 * (100 / measuredRem) : 100

  function setFont() {
    html.style.fontSize = html.clientWidth / designWidth * baseRem + 'px'
  }

  setFont()
  document.addEventListener('DOMContentLoaded', setFont, false)
  window.addEventListener('resize', setFont, false)
  window.addEventListener('load', setFont, false)
}())
