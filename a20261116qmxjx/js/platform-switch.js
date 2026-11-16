(function () {
  'use strict'

  var link = document.querySelector('[data-platform-switch]')
  if (!link) return

  var target = new URL(link.getAttribute('href'), document.baseURI)
  target.search = location.search
  target.searchParams.set('preview', link.dataset.platformSwitch)
  target.hash = location.hash
  link.href = target.href
}())
