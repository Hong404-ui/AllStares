(function () {
  'use strict'

  var section = document.querySelector('.character')
  var picker = section && section.querySelector('.character-picker')
  if (!picker) return

  var links = Array.prototype.slice.call(picker.querySelectorAll('[data-character-index]'))
  var visuals = picker.querySelectorAll('.portrait-visual').length
    ? Array.prototype.slice.call(picker.querySelectorAll('.portrait-visual'))
    : links.map(function (link) { return link.querySelector('img') })
  var pending = section.querySelector('.character-pending')
  var pendingImage = pending.querySelector('img')
  var pendingText = pending.querySelector('p')
  var characters = [
    { name: '角色一', available: false },
    { name: '橘右京', available: true },
    { name: '角色三', available: false },
    { name: '角色四', available: false }
  ]
  var selected = 1

  function select(index) {
    selected = (index % links.length + links.length) % links.length
    var current = characters[selected] || {}
    var hasContent = current.available === true
    links.forEach(function (link, position) {
      var active = position === selected
      link.classList.toggle('is-selected', active)
      var name = characters[position] && characters[position].name || '角色'
      link.setAttribute('aria-label', name + (active ? '，当前角色' : '，查看角色'))
      if (active) link.setAttribute('aria-current', 'true')
      else link.removeAttribute('aria-current')
      if (link.dataset.trackLabel) link.dataset.trackLabel = name + (active ? '，当前角色' : '，查看角色')
      visuals[position].classList.toggle('is-selected', active)
      if (visuals[position].alt) visuals[position].alt = name + (active ? '，当前展示' : '头像')
    })
    pendingImage.src = visuals[selected].src
    pendingText.textContent = current.pendingText || (current.name || '角色') + '资料待开放'
    section.classList.toggle('is-pending', !hasContent)
    section.setAttribute('aria-label', hasContent ? '角色展示：' + current.name : '角色展示：' + current.name + '，资料待开放')
    section.dispatchEvent(new CustomEvent('allstar:character-change', {
      detail: { index: selected, hasContent: hasContent }
    }))
  }

  picker.addEventListener('click', function (event) {
    var link = event.target.closest('a[data-character-index], a[data-character-step]')
    if (!link || !picker.contains(link)) return
    event.preventDefault()
    if (link.dataset.characterIndex !== undefined) select(Number(link.dataset.characterIndex))
    else select(selected + Number(link.dataset.characterStep))
  })

  window.selectCharacter = select
  window.setCharacters = function (items) {
    if (!Array.isArray(items) || items.length !== links.length) return
    characters = items
    select(selected)
  }
  select(selected)
}())
