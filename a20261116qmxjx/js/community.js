(function () {
  'use strict'

  var cards = Array.prototype.slice.call(document.querySelectorAll('.social-link, .social-actions a'))
  var active = null

  function close() {
    if (!active) return
    active.classList.remove('is-open')
    active.setAttribute('aria-expanded', 'false')
    if (active.closest('li')) active.closest('li').classList.remove('is-open')
    active = null
  }

  cards.forEach(function (card) {
    card.setAttribute('aria-expanded', 'false')
    card.addEventListener('click', function (event) {
      event.preventDefault()
      var wasOpen = active === card
      close()
      if (wasOpen) return
      active = card
      card.classList.add('is-open')
      card.setAttribute('aria-expanded', 'true')
      if (card.closest('li')) card.closest('li').classList.add('is-open')
    })
  })
  document.addEventListener('click', function (event) { if (active && !active.contains(event.target)) close() })
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') close() })
}())
