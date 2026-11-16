(function () {
  'use strict'
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.news-tab-actions a'))
  tabs.forEach(function (link, index) {
    link.addEventListener('click', function (event) {
      event.preventDefault()
      tabs.forEach(function (tab, position) {
        var active = position === index
        tab.classList.toggle('is-active', active)
        tab.setAttribute('aria-selected', String(active))
      })
      if (window.loadIdeNewsCategory) window.loadIdeNewsCategory(link.dataset.tab)
      else window.setNewsCategory(link.dataset.tab)
    })
  })
}())
