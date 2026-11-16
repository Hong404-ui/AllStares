(function () {
  'use strict'
  var page = document.querySelector('.page')
  var overlay = document.getElementById('overlay')
  var nav = document.querySelector('.site-nav nav')
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a'))
  var navIndicator = nav.querySelector('.nav-indicator')
  var panelSections = [
    document.querySelector('.site-nav'),
    document.querySelector('.downloads'),
    document.getElementById('character'),
    document.getElementById('features'),
    document.getElementById('community')
  ]
  var navScrollTarget = null
  var scrollFrame = 0
  var scrollLockUntil = 0

  function selectNav(link) {
    navLinks.forEach(function (item) {
      var selected = item === link
      item.classList.toggle('is-active', selected)
      if (selected) item.setAttribute('aria-current', 'page')
      else item.removeAttribute('aria-current')
    })
    navIndicator.style.left = link.offsetLeft + (link.offsetWidth - navIndicator.offsetWidth) / 2 + 'px'
  }

  function updateNavFromScroll() {
    if (navScrollTarget !== null) return

    var position = window.scrollY + 8
    var currentIndex = 0
    panelSections.forEach(function (section, index) {
      if (section && panelTop(index) <= position) currentIndex = index
    })
    selectNav(navLinks[currentIndex])
  }

  function cancelNavScroll() {
    if (!scrollFrame) return
    cancelAnimationFrame(scrollFrame)
    scrollFrame = 0
    navScrollTarget = null
    scrollLockUntil = 0
    updateNavFromScroll()
  }

  function updatePanelLayout() {
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    var viewportHeight = window.innerHeight
    var pageStyle = getComputedStyle(page)
    var scrollLayout = pageStyle.getPropertyValue('--scroll-layout').trim() === '1'
    var fitLayout = pageStyle.getPropertyValue('--fit-layout').trim() === '1' && !scrollLayout
    page.classList.toggle('is-scroll-layout', scrollLayout)
    if (scrollLayout) {
      page.style.setProperty('--hero-scale', 1)
      page.style.setProperty('--hero-inverse-scale', 1)
      page.style.setProperty('--home-top', (.38 * rem) + 'px')
      ;['info', 'character', 'features', 'community'].forEach(function (panel) {
        page.style.setProperty('--scale-' + panel, 1)
      })
      page.style.setProperty('--info-news-offset', (1.7 * rem) + 'px')
      return
    }
    var fullHeroScale = viewportHeight / (8.02 * rem)
    var heroScale = fitLayout ? 1 : fullHeroScale
    page.style.setProperty('--hero-scale', heroScale)
    page.style.setProperty('--hero-inverse-scale', 1 / heroScale)
    page.style.setProperty('--home-top', (.38 * rem * heroScale) + 'px')
    if (fitLayout) {
      var backgroundScale = (viewportHeight + .38 * rem) / (8.4 * rem)
      page.style.setProperty('--hero-bg-scale', backgroundScale)
      page.style.setProperty('--hero-bg-inset', (19.2 * rem * (1 - backgroundScale) / 2) + 'px')
    }
    ;[
      ['info', 10.2],
      ['character', 11.3],
      ['features', 11.9],
      ['community', 9.6]
    ].forEach(function (panel) {
      var scale = viewportHeight / (panel[1] * rem)
      page.style.setProperty('--scale-' + panel[0], scale)
      if (fitLayout) {
        var contentScale = Math.min(1, scale)
        page.style.setProperty('--fit-scale-' + panel[0], contentScale)
        page.style.setProperty('--fit-inset-' + panel[0], (19.2 * rem * (1 - contentScale) / 2) + 'px')
        page.style.setProperty('--fit-offset-' + panel[0], ((viewportHeight - panel[1] * rem * contentScale) / 2) + 'px')
      }
      if (panel[0] === 'info') page.style.setProperty('--info-news-offset', (1.7 * rem * (fitLayout ? Math.min(1, scale) : scale)) + 'px')
    })
  }

  updatePanelLayout()
  var homeTop = document.querySelector('.site-nav').getBoundingClientRect().top + window.scrollY

  function sectionTop(section) {
    return Math.round(section.getBoundingClientRect().top + window.scrollY)
  }

  function panelTop(index) {
    return sectionTop(panelSections[index])
  }

  function animateScrollTo(target) {
    cancelNavScroll()
    target = Math.max(0, Math.min(Math.round(target), document.documentElement.scrollHeight - window.innerHeight))
    var start = window.scrollY
    var distance = target - start
    if (Math.abs(distance) < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(window.scrollX, target)
      updateNavFromScroll()
      return
    }

    navScrollTarget = target
    var duration = Math.abs(distance) < 50 ? 360 : Math.abs(distance) < 300 ? 750 : 1050
    var startedAt = 0
    function step(now) {
      if (!startedAt) startedAt = now
      var progress = Math.min((now - startedAt) / duration, 1)
      var eased = progress < .5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2
      window.scrollTo(window.scrollX, start + distance * eased)
      if (progress < 1) {
        scrollFrame = requestAnimationFrame(step)
      } else {
        scrollFrame = 0
        navScrollTarget = null
        scrollLockUntil = performance.now() + 180
        updateNavFromScroll()
      }
    }
    scrollFrame = requestAnimationFrame(step)
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var target = document.querySelector(link.getAttribute('href'))
      if (!target) return
      event.preventDefault()
      animateScrollTo(panelTop(navLinks.indexOf(link)))
      selectNav(link)
    })
  })
  var resizeFrame = 0
  window.addEventListener('resize', function () {
    cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(function () {
      cancelNavScroll()
      updatePanelLayout()
      homeTop = panelTop(0)
      updateNavFromScroll()
    })
  })
  window.addEventListener('scroll', updateNavFromScroll, { passive: true })
  window.addEventListener('wheel', cancelNavScroll, { passive: true })
  window.addEventListener('touchstart', cancelNavScroll, { passive: true })
  window.addEventListener('pointerdown', cancelNavScroll, { passive: true })
  window.addEventListener('keydown', function (event) {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].indexOf(event.key) !== -1) cancelNavScroll()
  })
  updateNavFromScroll()
  if (!location.hash && window.scrollY < homeTop) window.scrollTo(window.scrollX, homeTop)

}())
