(function () {
  'use strict'

  var gallery = document.querySelector('.feature-gallery')
  var dots = document.querySelector('.feature-dots')
  var slides = Array.prototype.slice.call(gallery.querySelectorAll('.feature-slide'))
  var index = 1
  var timer
  var start

  function schedule() {
    clearTimeout(timer)
    if (slides.length < 2 || document.hidden || !document.getElementById('video-overlay').hidden || !document.getElementById('overlay').hidden || gallery.matches(':hover') || gallery.contains(document.activeElement) || dots.contains(document.activeElement)) return
    timer = setTimeout(function () { show(index + 1) }, 4000)
  }

  function show(next) {
    if (!slides.length) return
    index = (next % slides.length + slides.length) % slides.length
    slides.forEach(function (slide, position) {
      slide.classList.toggle('is-active', position === index)
      slide.classList.toggle('is-prev', slides.length > 2 && position === (index + slides.length - 1) % slides.length)
      slide.classList.toggle('is-next', position === (index + 1) % slides.length)
      slide.hidden = slides.length > 2 && position !== index && position !== (index + 1) % slides.length && position !== (index + slides.length - 1) % slides.length
    })
    dots.querySelectorAll('a').forEach(function (dot, position) {
      var active = position === index
      dot.classList.toggle('is-active', active)
      if (active) dot.setAttribute('aria-current', 'true')
      else dot.removeAttribute('aria-current')
    })
    gallery.setAttribute('aria-label', '游戏特色轮播，第' + (index + 1) + '张，共' + slides.length + '张')
    schedule()
  }

  function setSlides(items) {
    var valid = items.filter(function (item) { return item && typeof item.src === 'string' && item.src })
    if (!valid.length) return
    gallery.replaceChildren()
    dots.replaceChildren()
    valid.forEach(function (item, position) {
      var slide = document.createElement('div')
      slide.className = 'feature-slide'
      slide.dataset.slide = String(position)
      var image = document.createElement('img')
      image.src = item.src
      image.alt = item.alt || '游戏特色图片'
      image.width = item.width || 447
      image.height = item.height || 256
      slide.appendChild(image)
      gallery.appendChild(slide)
      var dot = document.createElement('a')
      dot.className = 'feature-dot'
      dot.href = '#'
      dot.dataset.slide = String(position)
      dot.dataset.track = 'feature_dot_' + (position + 1)
      dot.dataset.trackType = 'btn'
      dot.dataset.trackLabel = '游戏特色第' + (position + 1) + '张'
      dot.setAttribute('aria-label', '第' + (position + 1) + '张游戏特色')
      ;[['dot-idle', 'feature-dot.png', 15, 12], ['dot-active', 'feature-dot-active.png', 18, 16]].forEach(function (part) {
        var icon = document.createElement('img')
        icon.className = part[0]
        icon.src = 'ossweb-img/' + part[1]
        icon.width = part[2]
        icon.height = part[3]
        icon.alt = ''
        dot.appendChild(icon)
      })
      dots.appendChild(dot)
    })
    slides = Array.prototype.slice.call(gallery.querySelectorAll('.feature-slide'))
    show(Math.min(1, slides.length - 1))
  }

  document.querySelector('.feature-arrow-left').addEventListener('click', function (event) { event.preventDefault(); show(index - 1) })
  document.querySelector('.feature-arrow-right').addEventListener('click', function (event) { event.preventDefault(); show(index + 1) })
  dots.addEventListener('click', function (event) {
    var dot = event.target.closest('a[data-slide]')
    if (!dot || !dots.contains(dot)) return
    event.preventDefault()
    show(Number(dot.dataset.slide))
  })
  gallery.addEventListener('pointerdown', function (event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    clearTimeout(timer)
    start = { x: event.clientX, y: event.clientY }
    gallery.setPointerCapture(event.pointerId)
  })
  gallery.addEventListener('pointerup', function (event) {
    if (!start) return
    var x = event.clientX - start.x
    var y = event.clientY - start.y
    start = null
    if (Math.abs(x) > 35 && Math.abs(x) > Math.abs(y)) {
      var direction = x < 0 ? 1 : -1
      show(index + direction)
      window.easReport(direction === 1 ? 'feature_swipe_next' : 'feature_swipe_prev', 'btn', direction === 1 ? '左滑游戏特色' : '右滑游戏特色')
    } else schedule()
  })
  gallery.addEventListener('pointercancel', function () { start = null; schedule() })
  gallery.addEventListener('mouseenter', function () { clearTimeout(timer) })
  gallery.addEventListener('mouseleave', schedule)
  gallery.addEventListener('focusin', function () { clearTimeout(timer) })
  gallery.addEventListener('focusout', schedule)
  dots.addEventListener('focusin', function () { clearTimeout(timer) })
  dots.addEventListener('focusout', schedule)
  document.addEventListener('visibilitychange', schedule)
  document.addEventListener('allstar:modal-change', schedule)
  window.setFeatureSlides = setSlides
  show(index)
}())
