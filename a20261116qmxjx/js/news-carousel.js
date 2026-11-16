(function () {
  'use strict'

  var carousel = document.querySelector('.news-carousel')
  var track = carousel && carousel.querySelector('.news-carousel-track')
  var pagination = document.querySelector('.news-pagination') || document.querySelector('.news-pages')
  if (!track || !pagination) return

  var isPc = document.documentElement.dataset.platform === 'pc'
  var overlays = [document.getElementById('overlay'), document.getElementById('video-overlay')].filter(Boolean)
  var template = document.createElement('img')
  template.width = isPc ? 706 : 598
  template.height = isPc ? 411 : 348
  var status = document.querySelector('.news-carousel-status')
  var slides = []
  var index = 0
  var position = 1
  var timer
  var pointerStart

  function width() { return carousel.getBoundingClientRect().width }
  function positionTrack(distance) { track.style.transform = 'translate3d(' + (-position * width() + (distance || 0)) + 'px,0,0)' }

  function updateControls() {
    var current = slides[index]
    if (!current) return
    pagination.querySelectorAll('a').forEach(function (link, pageIndex) {
      var active = pageIndex === index
      link.classList.toggle('is-active', active)
      if (active) link.setAttribute('aria-current', 'true')
      else link.removeAttribute('aria-current')
    })
    var caption = document.querySelector('.news-caption')
    if (caption) {
      caption.textContent = current.caption || ''
      caption.title = current.caption || ''
      carousel.parentElement.classList.toggle('has-caption', Boolean(current.caption))
    }
    track.querySelectorAll('img').forEach(function (image, imageIndex) {
      image.alt = imageIndex === position ? current.alt : ''
      image.setAttribute('aria-hidden', imageIndex === position ? 'false' : 'true')
    })
    carousel.setAttribute('aria-label', '游戏资讯海报轮播，第' + (index + 1) + '张，共' + slides.length + '张')
  }

  function schedule() {
    clearTimeout(timer)
    if (slides.length < 2 || document.hidden || overlays.some(function (overlay) { return !overlay.hidden }) || carousel.matches(':hover') || carousel.contains(document.activeElement)) return
    timer = setTimeout(function () { show(index + 1) }, 4000)
  }

  function show(next) {
    if (!slides.length || !Number.isFinite(next)) return
    index = (next % slides.length + slides.length) % slides.length
    position = next === slides.length ? slides.length + 1 : next === -1 ? 0 : index + 1
    track.classList.remove('is-dragging')
    positionTrack()
    updateControls()
    schedule()
  }

  function setSlides(items) {
    var nextSlides = Array.isArray(items) ? items.filter(function (item) { return item && typeof item.src === 'string' && item.src }) : []
    clearTimeout(timer)
    if (!nextSlides.length) {
      slides = []
      track.replaceChildren()
      pagination.querySelectorAll('a').forEach(function (link) { link.remove() })
      carousel.classList.remove('is-ready')
      carousel.parentElement.classList.remove('is-ready')
      carousel.setAttribute('aria-busy', 'false')
      if (status) { status.textContent = '暂无海报'; status.hidden = false }
      var caption = document.querySelector('.news-caption')
      if (caption) { caption.textContent = ''; caption.title = '' }
      carousel.parentElement.classList.remove('has-caption')
      return
    }
    slides = nextSlides
    track.replaceChildren()
    ;[slides[slides.length - 1]].concat(slides, [slides[0]]).forEach(function (slide) {
      var image = template.cloneNode(false)
      image.src = slide.src
      image.alt = ''
      track.appendChild(image)
    })
    track.style.width = (slides.length + 2) * width() + 'px'
    pagination.querySelectorAll('a').forEach(function (link) { link.remove() })
    slides.forEach(function (slide, pageIndex) {
      var link = document.createElement('a')
      link.href = '#'
      link.className = isPc ? '' : 'news-page'
      link.dataset.newsPage = String(pageIndex)
      link.dataset.track = 'news_slide_' + (pageIndex + 1)
      link.dataset.trackType = 'btn'
      link.dataset.trackLabel = '资讯海报第' + (pageIndex + 1) + '张'
      link.setAttribute('aria-label', '第' + (pageIndex + 1) + '张资讯海报')
      link.style.left = (isPc ? 2.35 + (4 - slides.length) * .3 + pageIndex * .6 : 1.98 + (4 - slides.length) * .25 + pageIndex * .5) + 'rem'
      pagination.appendChild(link)
    })
    index = Math.min(2, slides.length - 1)
    position = index + 1
    track.classList.add('is-dragging')
    positionTrack()
    updateControls()
    carousel.classList.add('is-ready')
    carousel.parentElement.classList.add('is-ready')
    carousel.setAttribute('aria-busy', 'false')
    if (status) status.hidden = true
    requestAnimationFrame(function () { track.classList.remove('is-dragging') })
    schedule()
  }

  pagination.addEventListener('click', function (event) {
    var link = event.target.closest('a[data-news-page]')
    if (!link || !pagination.contains(link)) return
    event.preventDefault()
    show(Number(link.dataset.newsPage))
  })
  track.addEventListener('transitionend', function (event) {
    if (event.target !== track || event.propertyName !== 'transform' || (position !== 0 && position !== slides.length + 1)) return
    position = index + 1
    track.classList.add('is-dragging')
    positionTrack()
    updateControls()
    requestAnimationFrame(function () { requestAnimationFrame(function () { track.classList.remove('is-dragging') }) })
  })
  carousel.addEventListener('pointerdown', function (event) {
    if (!slides.length) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    clearTimeout(timer)
    pointerStart = { x: event.clientX, y: event.clientY }
    carousel.setPointerCapture(event.pointerId)
    track.classList.add('is-dragging')
  })
  carousel.addEventListener('pointermove', function (event) {
    if (!pointerStart) return
    var x = event.clientX - pointerStart.x
    if (Math.abs(x) > Math.abs(event.clientY - pointerStart.y)) positionTrack(x)
  })
  carousel.addEventListener('pointerup', function (event) {
    if (!pointerStart) return
    var x = event.clientX - pointerStart.x
    var y = event.clientY - pointerStart.y
    pointerStart = null
    if (Math.abs(x) > 35 && Math.abs(x) > Math.abs(y)) {
      var direction = x < 0 ? 1 : -1
      show(index + direction)
      window.easReport(direction === 1 ? 'news_swipe_next' : 'news_swipe_prev', 'btn', direction === 1 ? '左滑资讯海报' : '右滑资讯海报')
    } else { track.classList.remove('is-dragging'); positionTrack(); schedule() }
  })
  carousel.addEventListener('pointercancel', function () { pointerStart = null; track.classList.remove('is-dragging'); positionTrack(); schedule() })
  carousel.addEventListener('mouseenter', function () { clearTimeout(timer) })
  carousel.addEventListener('mouseleave', schedule)
  pagination.addEventListener('focusin', function () { clearTimeout(timer) })
  pagination.addEventListener('focusout', schedule)
  document.addEventListener('visibilitychange', schedule)
  document.addEventListener('allstar:modal-change', schedule)
  window.addEventListener('resize', function () { track.style.width = (slides.length + 2) * width() + 'px'; positionTrack() })
  window.setNewsSlides = setSlides
  window.setNewsSlidesStatus = function (state) {
    if (state === 'loading') {
      carousel.classList.remove('is-ready')
      carousel.parentElement.classList.remove('is-ready')
      carousel.setAttribute('aria-busy', 'true')
    }
    if (status) {
      status.textContent = state === 'error' ? '海报加载失败，请稍后重试' : state === 'empty' ? '暂无海报' : '海报加载中…'
      status.hidden = false
    }
  }
  window.allstarScheduleNews = schedule
}())
