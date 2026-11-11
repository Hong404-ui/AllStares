(function () {
  'use strict'

  var globalData = { openid: '', ext1: '', ext2: '' }
  var overlay = document.getElementById('overlay')
  var loginDialog = document.getElementById('login-dialog')
  var loginStatus = document.getElementById('login-status')
  var activeDialog = null
  var previousFocus = null
  var siteMessage = document.getElementById('site-message')
  var siteMessageTimer = null
  var siteNav = document.getElementById('site-nav')
  var menuTrigger = document.querySelector('.menu-trigger')

  function easReport(action, type, label) {
    try {
      if (window.EAS && typeof window.EAS.SendClick === 'function') {
        window.EAS.SendClick({
          e_c: 'allstarawakening.index.mobile.' + action,
          openid: globalData.openid,
          ext1: type || globalData.ext1,
          ext2: label || globalData.ext2,
          ext3: new URLSearchParams(location.search).get('e_code') || ''
        })
      }
    } catch (error) {
      console.warn('EAS report failed', error)
    }
  }

  window.easReport = easReport
  easReport('pv', 'page', '页面浏览')

  function showMessage(message) {
    clearTimeout(siteMessageTimer)
    siteMessage.textContent = message
    siteMessage.hidden = false
    siteMessageTimer = setTimeout(function () { siteMessage.hidden = true }, 2600)
  }

  function setMenuOpen(open) {
    siteNav.hidden = !open
    menuTrigger.setAttribute('aria-expanded', open ? 'true' : 'false')
    menuTrigger.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单')
  }

  menuTrigger.addEventListener('click', function (event) {
    event.preventDefault()
    setMenuOpen(siteNav.hidden)
  })
  siteNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setMenuOpen(false) })
  })

  function updateParts() {
    var $ = window.jQuery
    var scrollTop = $(window).scrollTop()
    $.each($('.part'), function () {
      if (scrollTop >= $(this).offset().top - $(window).height() / 1.1) {
        $(this).addClass('show')
      } else {
        $(this).removeClass('show')
      }
    })
  }

  if (window.jQuery) {
    window.jQuery(window).on('load scroll', updateParts)
    window.jQuery(window).on('resize', updateParts)
    updateParts()
  } else {
    function updatePartsWithoutJquery() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop
      document.querySelectorAll('.part').forEach(function (part) {
        var partTop = part.getBoundingClientRect().top + scrollTop
        part.classList.toggle('show', scrollTop >= partTop - window.innerHeight / 1.1)
      })
    }
    window.addEventListener('load', updatePartsWithoutJquery)
    window.addEventListener('scroll', updatePartsWithoutJquery)
    window.addEventListener('resize', updatePartsWithoutJquery)
    updatePartsWithoutJquery()
  }

  function openDialog() {
    previousFocus = document.activeElement
    activeDialog = loginDialog
    loginStatus.textContent = ''
    loginDialog.hidden = false
    overlay.hidden = false
    document.documentElement.classList.add('modal-open')
    document.body.classList.add('modal-open')
    requestAnimationFrame(function () {
      if (!overlay.hidden) overlay.classList.add('show')
    })
    activeDialog.querySelector('a').focus()
  }

  function closeDialog() {
    if (overlay.hidden) return
    overlay.classList.remove('show')
    overlay.hidden = true
    loginDialog.hidden = true
    document.documentElement.classList.remove('modal-open')
    document.body.classList.remove('modal-open')
    activeDialog = null
    if (previousFocus && previousFocus.isConnected) previousFocus.focus()
  }

  document.querySelectorAll('[data-track]').forEach(function (link) {
    link.addEventListener('click', function () {
      easReport(link.dataset.track, link.dataset.trackType, link.dataset.trackLabel)
    })
  })

  document.querySelectorAll('.news-tab').forEach(function (tab) {
    tab.addEventListener('click', function (event) {
      event.preventDefault()
      document.querySelectorAll('.news-tab').forEach(function (item) {
        var selected = item === tab
        item.classList.toggle('is-active', selected)
        if (selected) item.setAttribute('aria-current', 'true')
        else item.removeAttribute('aria-current')
      })
    })
  })

  var newsCarousel = document.querySelector('.news-carousel')
  var newsTrack = document.querySelector('.news-carousel-track')
  var newsImages = Array.prototype.slice.call(newsTrack.querySelectorAll('img'))
  var newsPages = Array.prototype.slice.call(document.querySelectorAll('.news-page'))
  var newsIndex = 2
  var newsPosition = 3
  var newsStart = null

  function newsSlideWidth() {
    return newsCarousel.getBoundingClientRect().width
  }

  function positionNews(distance) {
    newsTrack.style.transform = 'translate3d(' + (-newsPosition * newsSlideWidth() + (distance || 0)) + 'px, 0, 0)'
  }

  function updateNewsImageLabels() {
    newsImages.forEach(function (image, imageIndex) {
      var visible = imageIndex === newsPosition
      image.setAttribute('alt', visible ? '不知火舞卡牌对决新纪元' : '')
      image.setAttribute('aria-hidden', visible ? 'false' : 'true')
    })
  }

  function showNews(index) {
    newsIndex = (index + newsPages.length) % newsPages.length
    newsPosition = index === 4 ? 5 : index === -1 ? 0 : newsIndex + 1
    newsTrack.classList.remove('is-dragging')
    positionNews()
    newsPages.forEach(function (page, pageIndex) {
      var selected = pageIndex === newsIndex
      page.classList.toggle('is-active', selected)
      if (selected) page.setAttribute('aria-current', 'true')
      else page.removeAttribute('aria-current')
    })
    updateNewsImageLabels()
    newsCarousel.setAttribute('aria-label', '游戏资讯海报轮播，第 ' + (newsIndex + 1) + ' 张，共 ' + newsPages.length + ' 张')
  }

  newsTrack.addEventListener('transitionend', function (event) {
    if (event.target !== newsTrack || event.propertyName !== 'transform') return
    if (newsPosition !== 0 && newsPosition !== 5) return
    newsPosition = newsIndex + 1
    newsTrack.classList.add('is-dragging')
    positionNews()
    updateNewsImageLabels()
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { newsTrack.classList.remove('is-dragging') })
    })
  })

  newsPages.forEach(function (page) {
    page.addEventListener('click', function (event) {
      event.preventDefault()
      showNews(Number(page.dataset.slide))
    })
  })

  newsCarousel.addEventListener('pointerdown', function (event) {
    if (event.button !== 0) return
    newsStart = { x: event.clientX, y: event.clientY }
    newsCarousel.setPointerCapture(event.pointerId)
    newsTrack.classList.add('is-dragging')
  })
  newsCarousel.addEventListener('pointermove', function (event) {
    if (!newsStart) return
    var distanceX = event.clientX - newsStart.x
    var distanceY = event.clientY - newsStart.y
    if (Math.abs(distanceX) > Math.abs(distanceY)) positionNews(distanceX)
  })
  newsCarousel.addEventListener('pointerup', function (event) {
    if (!newsStart) return
    var distanceX = event.clientX - newsStart.x
    var distanceY = event.clientY - newsStart.y
    newsStart = null
    if (Math.abs(distanceX) > 35 && Math.abs(distanceX) > Math.abs(distanceY)) {
      var direction = distanceX < 0 ? 1 : -1
      showNews(newsIndex + direction)
      easReport(direction === 1 ? 'news_swipe_next' : 'news_swipe_prev', 'btn', direction === 1 ? '左滑资讯海报' : '右滑资讯海报')
    } else {
      newsTrack.classList.remove('is-dragging')
      positionNews()
    }
  })
  newsCarousel.addEventListener('pointercancel', function () {
    newsStart = null
    newsTrack.classList.remove('is-dragging')
    positionNews()
  })
  window.addEventListener('resize', positionNews)

  var featureGallery = document.querySelector('.feature-gallery')
  var featureSlides = Array.prototype.slice.call(featureGallery.querySelectorAll('.feature-slide'))
  var featureDots = Array.prototype.slice.call(document.querySelectorAll('.feature-dot'))
  var featureIndex = 1
  var featureStart = null

  function showFeature(index) {
    featureIndex = (index + featureSlides.length) % featureSlides.length
    featureSlides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === featureIndex)
      slide.classList.toggle('is-prev', slideIndex === (featureIndex + featureSlides.length - 1) % featureSlides.length)
      slide.classList.toggle('is-next', slideIndex === (featureIndex + 1) % featureSlides.length)
    })
    featureDots.forEach(function (dot, dotIndex) {
      var selected = dotIndex === featureIndex
      dot.classList.toggle('is-active', selected)
      if (selected) dot.setAttribute('aria-current', 'true')
      else dot.removeAttribute('aria-current')
    })
  }

  document.querySelector('.feature-arrow-left').addEventListener('click', function (event) {
    event.preventDefault()
    showFeature(featureIndex - 1)
  })
  document.querySelector('.feature-arrow-right').addEventListener('click', function (event) {
    event.preventDefault()
    showFeature(featureIndex + 1)
  })
  featureDots.forEach(function (dot) {
    dot.addEventListener('click', function (event) {
      event.preventDefault()
      showFeature(Number(dot.dataset.slide))
    })
  })
  featureGallery.addEventListener('pointerdown', function (event) {
    if (event.button !== 0) return
    featureStart = { x: event.clientX, y: event.clientY }
    featureGallery.setPointerCapture(event.pointerId)
  })
  featureGallery.addEventListener('pointerup', function (event) {
    if (!featureStart) return
    var distanceX = event.clientX - featureStart.x
    var distanceY = event.clientY - featureStart.y
    featureStart = null
    if (Math.abs(distanceX) < 35 || Math.abs(distanceX) < Math.abs(distanceY)) return
    var direction = distanceX < 0 ? 1 : -1
    showFeature(featureIndex + direction)
    easReport(direction === 1 ? 'feature_swipe_next' : 'feature_swipe_prev', 'btn', direction === 1 ? '左滑游戏特色' : '右滑游戏特色')
  })
  featureGallery.addEventListener('pointercancel', function () { featureStart = null })

  document.querySelectorAll('.message-link').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault()
      showMessage(link.dataset.message)
    })
  })

  document.querySelectorAll('.login-trigger, .claim-trigger').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault()
      openDialog()
    })
  })

  document.querySelectorAll('.login-close').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault()
      closeDialog()
    })
  })

  document.querySelectorAll('.login-choice').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault()
      var provider = link.dataset.provider
      var request = new CustomEvent('allstar:login-request', {
        cancelable: true,
        detail: { provider: provider }
      })
      window.dispatchEvent(request)
      if (!request.defaultPrevented) {
        loginStatus.textContent = (provider === 'wechat' ? '微信' : 'QQ') + '登录服务暂未接入'
      }
    })
  })

  window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !siteNav.hidden) {
      setMenuOpen(false)
      menuTrigger.focus()
    }
    if (overlay.hidden) return
    if (event.key === 'Escape') {
      easReport('login_escape_close', 'btn', '按 Esc 关闭登录弹窗')
      closeDialog()
    }
    if (event.key === 'Tab') {
      var links = activeDialog.querySelectorAll('a')
      var first = links[0]
      var last = links[links.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  })

  if (location.hash === '#login') openDialog()
}())
