(function () {
  'use strict'
  var gallery = document.querySelector('.feature-gallery')
  var leftImage = gallery.querySelector('.side.left')
  var frontImage = gallery.querySelector('.front')
  var rightImage = gallery.querySelector('.side.right')
  var dots = document.querySelector('.feature-dots')
  var actions = document.querySelector('.feature-dot-actions')
  var overlay = document.getElementById('overlay')
  var slides = [
    { src: '../ossweb-img/pc/feature-left.png', alt: '街机手感，重燃记忆' },
    { src: '../ossweb-img/pc/feature-main.png', alt: '宿命之战再启，全明星登场' },
    { src: '../ossweb-img/pc/feature-right.png', alt: '最初热爱，不知火舞参上' }
  ]
  var featureIndex = 1
  var timer

  function activeArea() {
    return actions.matches(':hover') || actions.contains(document.activeElement) ||
      document.querySelector('.gallery-prev-hit') === document.activeElement ||
      document.querySelector('.gallery-next-hit') === document.activeElement
  }

  function schedule() {
    clearTimeout(timer)
    if (!gallery.classList.contains('is-ready') || slides.length < 2 || document.hidden || !overlay.hidden || activeArea()) return
    timer = setTimeout(function () { showFeature(featureIndex + 1) }, 4000)
  }

  function showFeature(index) {
    if (!slides.length) return
    featureIndex = (index % slides.length + slides.length) % slides.length
    var images = [leftImage, frontImage, rightImage]
    var indexes = [(featureIndex - 1 + slides.length) % slides.length, featureIndex, (featureIndex + 1) % slides.length]
    gallery.classList.add('is-changing')
    images.forEach(function (image, position) {
      image.src = slides[indexes[position]].src
      image.alt = slides[indexes[position]].alt
    })
    frontImage.classList.toggle('is-brightened', featureIndex !== 1)
    requestAnimationFrame(function () { gallery.classList.remove('is-changing') })
    Array.prototype.forEach.call(actions.querySelectorAll('a'), function (link, dotIndex) {
      link.classList.toggle('is-active', dotIndex === featureIndex)
      if (dotIndex === featureIndex) link.setAttribute('aria-current', 'true')
      else link.removeAttribute('aria-current')
    })
    Array.prototype.forEach.call(dots.querySelectorAll('img'), function (dot, dotIndex) {
      dot.src = '../ossweb-img/pc/feature-dot' + (dotIndex === featureIndex ? '-active' : '') + '.png'
      dot.classList.toggle('is-active', dotIndex === featureIndex)
    })
    gallery.setAttribute('aria-label', '游戏特色轮播，第' + (featureIndex + 1) + '张，共' + slides.length + '张')
    schedule()
  }

  function setFeatureSlides(items) {
    var next = (Array.isArray(items) ? items : []).map(function (item) {
      return { src: item && (item.src || item.image), alt: item && (item.alt || item.title) || '游戏特色图片' }
    }).filter(function (item) { return typeof item.src === 'string' && item.src.trim() })
    if (!next.length) { window.setFeatureSlidesStatus('暂无特色内容'); return }
    slides = next
    var dotsLeft = (19.2 - (slides.length * .32 + Math.max(0, slides.length - 1) * .63)) / 2
    dots.style.left = dotsLeft + 'rem'
    actions.style.left = dotsLeft + 'rem'
    dots.replaceChildren()
    actions.replaceChildren()
    slides.forEach(function (slide, index) {
      var dot = document.createElement('img')
      dot.src = '../ossweb-img/pc/feature-dot.png'
      dot.width = 26
      dot.height = 23
      dot.alt = ''
      dots.appendChild(dot)
      var link = document.createElement('a')
      link.href = '#'
      link.dataset.feature = String(index)
      link.dataset.track = 'feature_dot_' + (index + 1)
      link.setAttribute('aria-label', '第' + (index + 1) + '张游戏特色')
      actions.appendChild(link)
      if (window.bindPcVisualPress) window.bindPcVisualPress(link, dot)
    })
    showFeature(Math.min(1, slides.length - 1))
    gallery.classList.add('is-ready')
    gallery.closest('.features').classList.add('has-feature-data')
    gallery.dataset.statusText = ''
    schedule()
  }

  document.querySelectorAll('[data-feature-step]').forEach(function (link) {
    link.addEventListener('click', function () { showFeature(featureIndex + Number(link.dataset.featureStep)) })
    link.addEventListener('blur', schedule)
  })
  actions.addEventListener('click', function (event) {
    var link = event.target.closest('a[data-feature]')
    if (!link) return
    event.preventDefault()
    showFeature(Number(link.dataset.feature))
  })
  ;[actions].forEach(function (area) {
    area.addEventListener('mouseenter', function () { clearTimeout(timer) })
    area.addEventListener('mouseleave', schedule)
    area.addEventListener('focusin', function () { clearTimeout(timer) })
    area.addEventListener('focusout', schedule)
  })
  document.addEventListener('visibilitychange', schedule)
  document.addEventListener('allstar:modal-change', schedule)
  window.addEventListener('resize', schedule)
  gallery.addEventListener('mouseenter', function () { clearTimeout(timer) })
  gallery.addEventListener('mouseleave', schedule)
  window.setFeatureSlides = setFeatureSlides
  window.setFeatureSlidesStatus = function (message) {
    clearTimeout(timer)
    gallery.classList.remove('is-ready')
    gallery.closest('.features').classList.remove('has-feature-data')
    gallery.dataset.statusText = message
  }
  showFeature(featureIndex)
}())
