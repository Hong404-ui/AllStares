(function () {
  'use strict'
  document.querySelectorAll('.news-tab').forEach(function (tab) {
    tab.addEventListener('click', function (event) {
      event.preventDefault()
      document.querySelectorAll('.news-tab').forEach(function (item) {
        var selected = item === tab
        item.classList.toggle('is-active', selected)
        if (selected) item.setAttribute('aria-current', 'true')
        else item.removeAttribute('aria-current')
      })
      if (window.loadIdeNewsCategory) window.loadIdeNewsCategory(tab.dataset.category)
      else window.setNewsCategory(tab.dataset.category)
    })
  })
}())
