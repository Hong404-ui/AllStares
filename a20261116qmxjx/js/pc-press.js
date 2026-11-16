(function () {
  'use strict'
  var pressedVisual = null

  function releaseVisual() {
    if (!pressedVisual) return
    pressedVisual.classList.remove('is-pressed')
    pressedVisual = null
  }

  function bindVisualPress(link, visual) {
    if (!link || !visual) return
    visual.classList.add('press-visual')
    link.addEventListener('pointerdown', function () {
      releaseVisual()
      pressedVisual = visual
      visual.classList.add('is-pressed')
    })
    link.addEventListener('pointerleave', releaseVisual)
    link.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return
      releaseVisual()
      pressedVisual = visual
      visual.classList.add('is-pressed')
    })
    link.addEventListener('keyup', releaseVisual)
    link.addEventListener('blur', releaseVisual)
  }

  window.bindPcVisualPress = bindVisualPress

  window.addEventListener('pointerup', releaseVisual)
  window.addEventListener('pointercancel', releaseVisual)

  ;[
    ['.play-hit', '.hero .play'],
    ['.download-qr-hit', '.download-option-qr'],
    ['.download-android-hit', '.download-option-android'],
    ['.download-pc-hit', '.download-option-pc'],
    ['.claim-hit', '.claim'],
    ['.news-more-hit', '.news-more'],
    ['.effect-hit', '.effect'],
    ['.voice-hit', '.voice'],
    ['.gallery-prev-hit', '.gallery-left'],
    ['.gallery-next-hit', '.gallery-right']
  ].forEach(function (pair) {
    bindVisualPress(document.querySelector(pair[0]), document.querySelector(pair[1]))
  })
  document.querySelectorAll('.character-picker .picker-hit').forEach(function (link, index) {
    bindVisualPress(link, document.querySelector('.character-picker > img:nth-child(' + (index + 1) + ')'))
  })
  document.querySelectorAll('.social-actions a').forEach(function (link, index) {
    bindVisualPress(link, document.querySelector('.social-list li:nth-child(' + (index + 1) + ') img'))
  })
  document.querySelectorAll('.news-tab-actions a').forEach(function (link) {
    bindVisualPress(link, link)
  })
  document.querySelectorAll('.news-list .row-hit').forEach(function (link) {
    bindVisualPress(link, link.parentElement)
  })
  document.querySelectorAll('.feature-dot-actions a').forEach(function (link, index) {
    bindVisualPress(link, document.querySelector('.feature-dots img:nth-child(' + (index + 1) + ')'))
  })

}())
