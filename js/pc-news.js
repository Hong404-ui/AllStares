(function () {
  'use strict'
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.news-tab-actions a'))
  var images = Array.prototype.slice.call(document.querySelectorAll('.news-tabs img'))
  var names = ['latest', 'news', 'notice', 'event', 'guide']
  tabs.forEach(function (link, index) {
    link.addEventListener('click', function (event) {
      event.preventDefault()
      tabs.forEach(function (tab, position) {
        var active = position === index
        tab.classList.toggle('is-active', active)
        tab.setAttribute('aria-selected', String(active))
        images[position].src = '../ossweb-img/pc/tab-' + names[position] + (active ? (position ? '-selected' : '') : (position ? '' : '-unselected')) + '.png'
      })
      window.setNewsCategory(link.dataset.tab)
    })
  })
}())
