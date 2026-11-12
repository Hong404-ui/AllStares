(function () {
  'use strict'

  var overlay = document.getElementById('overlay')
  var page = document.querySelector('.page')
  var loginDialog = document.getElementById('login-dialog')
  var videoDialog = document.getElementById('video-dialog')
  var message = document.getElementById('site-message')
  var messageTimer
  var previousFocus
  var activeDialog
  var player
  var playerScript
  var videoRequest = 0

  function easReport(action, type, label) {
    try {
      if (window.EAS && typeof window.EAS.SendClick === 'function') {
        window.EAS.SendClick({
          e_c: 'allstarawakening.index.pc.' + action,
          ext1: type || 'btn',
          ext2: label || '',
          ext3: new URLSearchParams(location.search).get('e_code') || ''
        })
      }
    } catch (error) {
      console.warn('EAS report failed', error)
    }
  }

  window.easReport = easReport
  easReport('pv', 'page', '页面浏览')

  var footerTracks = {
    '腾讯互动娱乐': 'footer_tencent',
    '服务条款': 'footer_terms',
    '隐私保护指引': 'footer_privacy',
    '儿童隐私保护指引': 'footer_children_privacy',
    '腾讯游戏招聘': 'footer_careers',
    '腾讯游戏客服': 'footer_support',
    '游戏列表': 'footer_games',
    '广告服务及商务合作': 'footer_partnership'
  }
  var footerHrefs = {
    '腾讯互动娱乐': 'https://ieg.tencent.com/2023/index.html',
    '服务条款': 'https://game.qq.com/contract.shtml',
    '隐私保护指引': 'https://game.qq.com/privacy_guide.shtml?ADTAG=gamepcbottom',
    '儿童隐私保护指引': 'https://game.qq.com/privacy_guide_children.shtml?ADTAG=gamepcbottom',
    '腾讯游戏招聘': 'https://careers.tencent.com/',
    '腾讯游戏客服': 'https://kf.qq.com/',
    '游戏列表': 'https://game.qq.com/web201910/introduce.html?ADTAG=gamepcbottom',
    '广告服务及商务合作': 'https://www.tencent.com/zh-cn/partnership.html'
  }
  var footerComponentLinks = document.querySelectorAll('#afooter .wrap_ieg > p:first-child a')
  var mappedFooterLinks = 0
  footerComponentLinks.forEach(function (link) {
    var label = link.textContent.trim()
    var track = footerTracks[label]
    if (!track) return
    link.dataset.track = track
    link.href = footerHrefs[label]
    mappedFooterLinks += 1
  })
  if (mappedFooterLinks === 8) document.querySelector('.footer-links-fallback').remove()

  document.querySelectorAll('[data-track]').forEach(function (item) {
    item.addEventListener('click', function () {
      easReport(item.dataset.track, item.tagName === 'A' ? 'link' : 'btn', item.getAttribute('aria-label') || item.textContent.trim())
    })
  })

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
    var activeIndex = navLinks.findIndex(function (link) { return link.classList.contains('is-active') })
    var showPlatformStrip = window.scrollY < homeTop - 2
    var atFooter = window.scrollY > panelTop(4) + 2
    cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(function () {
      cancelNavScroll()
      updatePanelLayout()
      homeTop = panelTop(0)
      var destination = showPlatformStrip ? 0 : atFooter
        ? document.documentElement.scrollHeight - window.innerHeight
        : panelTop(Math.max(0, activeIndex))
      window.scrollTo(window.scrollX, destination)
      updateNavFromScroll()
    })
  })
  window.addEventListener('scroll', updateNavFromScroll, { passive: true })
  window.addEventListener('wheel', function (event) {
    if (!overlay.hidden || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
    if (page.classList.contains('is-scroll-layout')) {
      cancelNavScroll()
      return
    }
    event.preventDefault()
    if (scrollFrame || performance.now() < scrollLockUntil || !event.deltaY) return
    var positions = [0].concat(panelSections.map(function (section, index) { return panelTop(index) }))
    var footerTop = document.documentElement.scrollHeight - window.innerHeight
    if (footerTop > positions[positions.length - 1] + 2) positions.push(footerTop)
    var current = window.scrollY
    var index = 0
    positions.forEach(function (position, positionIndex) {
      if (position <= current + 2) index = positionIndex
    })
    var next
    if (event.deltaY > 0) {
      next = positions[index + 1]
    } else {
      next = current > positions[index] + 2 ? positions[index] : positions[index - 1]
    }
    if (next !== undefined) animateScrollTo(next)
  }, { passive: false })
  window.addEventListener('touchstart', cancelNavScroll, { passive: true })
  window.addEventListener('pointerdown', cancelNavScroll, { passive: true })
  window.addEventListener('keydown', function (event) {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].indexOf(event.key) !== -1) cancelNavScroll()
  })
  updateNavFromScroll()
  if (!location.hash && window.scrollY < homeTop) window.scrollTo(window.scrollX, homeTop)

  function bindVisualHover(button, visual) {
    if (!button || !visual) return
    visual.classList.add('hover-visual')
    button.addEventListener('mouseenter', function () { visual.classList.add('is-hovered') })
    button.addEventListener('mouseleave', function () { visual.classList.remove('is-hovered') })
  }

  [
    ['.play-hit', '.hero .play'],
    ['.download-qr-hit', '.download-options img:nth-child(1)'],
    ['.download-android-hit', '.download-options img:nth-child(2)'],
    ['.download-pc-hit', '.download-options img:nth-child(3)'],
    ['.claim-hit', '.claim'],
    ['.news-more-hit', '.news-more'],
    ['.effect-hit', '.effect'],
    ['.voice-hit', '.voice'],
    ['.gallery-prev-hit', '.gallery-left'],
    ['.gallery-next-hit', '.gallery-right']
  ].forEach(function (pair) {
    bindVisualHover(document.querySelector(pair[0]), document.querySelector(pair[1]))
  })
  document.querySelectorAll('.character-picker .picker-hit').forEach(function (button, index) {
    bindVisualHover(button, document.querySelector('.character-picker > img:nth-child(' + (index + 1) + ')'))
  })
  document.querySelectorAll('.social-actions button').forEach(function (button, index) {
    bindVisualHover(button, document.querySelector('.social-list li:nth-child(' + (index + 1) + ') img'))
  })
  document.querySelectorAll('.news-tab-actions button').forEach(function (button, index) {
    bindVisualHover(button, document.querySelector('.news-tabs img:nth-child(' + (index + 1) + ')'))
  })
  document.querySelectorAll('.news-list .row-hit').forEach(function (button) {
    bindVisualHover(button, button.parentElement)
  })
  document.querySelectorAll('.feature-dot-actions button').forEach(function (button, index) {
    bindVisualHover(button, document.querySelector('.feature-dots img:nth-child(' + (index + 1) + ')'))
  })

  function showMessage(text) {
    clearTimeout(messageTimer)
    message.textContent = text
    message.hidden = false
    messageTimer = setTimeout(function () { message.hidden = true }, 2600)
  }

  function updateParts() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop
    document.querySelectorAll('.part').forEach(function (part) {
      var top = part.getBoundingClientRect().top + scrollTop
      part.classList.toggle('show', scrollTop >= top - window.innerHeight / 1.1)
    })
  }
  window.addEventListener('load', updateParts)
  window.addEventListener('scroll', updateParts, { passive: true })
  window.addEventListener('resize', updateParts)
  updateParts()

  function loadPlayerScript() {
    if (window.SuperPlayer) return Promise.resolve()
    if (playerScript) return playerScript
    playerScript = new Promise(function (resolve, reject) {
      var script = document.getElementById('superplayer-sdk')
      if (script && script.dataset.failed === 'true') {
        script.remove()
        script = null
      }
      if (!script) {
        script = document.createElement('script')
        script.id = 'superplayer-sdk'
        script.src = 'https://vm.gtimg.cn/thumbplayer/superplayer/superplayer.js'
        document.head.appendChild(script)
      }
      var timeout = setTimeout(function () { reject(new Error('播放器加载超时')) }, 10000)
      script.addEventListener('load', function () { clearTimeout(timeout); resolve() }, { once: true })
      script.addEventListener('error', function () {
        clearTimeout(timeout)
        script.dataset.failed = 'true'
        reject(new Error('播放器加载失败'))
      }, { once: true })
    })
    return playerScript
  }

  function openDialog(kind) {
    previousFocus = document.activeElement
    activeDialog = kind === 'video' ? videoDialog : loginDialog
    loginDialog.hidden = activeDialog !== loginDialog
    videoDialog.hidden = activeDialog !== videoDialog
    overlay.hidden = false
    page.inert = true
    document.documentElement.classList.add('modal-open')
    if (typeof scheduleNews === 'function') scheduleNews()
    activeDialog.querySelector('button').focus()
    if (kind !== 'video') return

    var request = ++videoRequest
    var status = document.getElementById('video-status')
    status.hidden = false
    status.textContent = '正在加载视频...'
    loadPlayerScript().then(function () {
      if (activeDialog !== videoDialog || request !== videoRequest) return
      player = new window.SuperPlayer({ container: '#super-player' })
      status.hidden = true
      return player.play({ vid: 'm3093w4tk4a' })
    }).then(function () {
      if (activeDialog === videoDialog && request === videoRequest) status.hidden = true
    }).catch(function () {
      if (activeDialog === videoDialog && request === videoRequest) {
        status.hidden = false
        status.textContent = '视频加载失败，请稍后重试'
      }
      playerScript = null
      var failedScript = document.getElementById('superplayer-sdk')
      if (failedScript && !window.SuperPlayer) failedScript.remove()
    })
  }

  function closeDialog() {
    if (overlay.hidden) return
    videoRequest++
    if (player) {
      try { player.stop() } catch (error) { console.warn('Video stop failed', error) }
      try { player.destroy() } catch (error) { console.warn('Video destroy failed', error) }
      player = null
    }
    document.getElementById('super-player').replaceChildren()
    overlay.hidden = true
    page.inert = false
    loginDialog.hidden = true
    videoDialog.hidden = true
    document.documentElement.classList.remove('modal-open')
    if (typeof scheduleNews === 'function') scheduleNews()
    activeDialog = null
    if (previousFocus && previousFocus.isConnected) previousFocus.focus()
  }

  document.querySelectorAll('[data-action]').forEach(function (button) {
    button.addEventListener('click', function () {
      var action = button.dataset.action
      if (action === 'login') openDialog('login')
      else if (action === 'video') openDialog('video')
      else if (action === 'community') showMessage(button.getAttribute('aria-label') + '入口待提供')
      else if (action === 'news-item' || action === 'more-news') showMessage('资讯详情页待接入')
      else if (action === 'character-current') showMessage('当前展示角色：橘右京')
      else if (action.indexOf('character-') === 0) showMessage('更多角色资料敬请期待')
      else if (action === 'effect' || action === 'voice') showMessage('角色内容敬请期待')
      else showMessage(button.getAttribute('aria-label') + '入口待提供')
    })
  })

  document.querySelectorAll('.dialog-close').forEach(function (button) {
    button.addEventListener('click', closeDialog)
  })
  document.querySelectorAll('.login-choice').forEach(function (button) {
    button.addEventListener('click', function () {
      var provider = button.dataset.provider
      var request = new CustomEvent('allstar:login-request', { cancelable: true, detail: { provider: provider } })
      window.dispatchEvent(request)
      if (!request.defaultPrevented) document.getElementById('login-status').textContent = (provider === 'wechat' ? '微信' : 'QQ') + '登录服务暂未接入'
    })
  })
  overlay.addEventListener('click', function (event) {
    if (event.target === overlay && activeDialog === videoDialog) {
      easReport('video_mask_close', 'btn', '点击遮罩关闭视频弹窗')
      closeDialog()
    }
  })
  document.addEventListener('keydown', function (event) {
    if (overlay.hidden) return
    if (event.key === 'Escape') {
      event.preventDefault()
      if (activeDialog === videoDialog) {
        easReport('video_escape_close', 'btn', '按 Esc 关闭视频弹窗')
        closeDialog()
      }
    }
    if (event.key !== 'Tab') return
    var buttons = activeDialog.querySelectorAll('button')
    var first = buttons[0]
    var last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  })

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.news-tab-actions button'))
  var tabImages = Array.prototype.slice.call(document.querySelectorAll('.news-tabs img'))
  var tabNames = ['latest', 'news', 'notice', 'event', 'guide']
  tabs.forEach(function (button, index) {
    button.addEventListener('click', function () {
      tabs.forEach(function (tab, tabIndex) {
        var active = tabIndex === index
        tab.classList.toggle('is-active', active)
        tab.setAttribute('aria-selected', String(active))
        tabImages[tabIndex].src = '../ossweb-img/pc/tab-' + tabNames[tabIndex] + (active ? (tabIndex ? '-selected' : '') : (tabIndex ? '' : '-unselected')) + '.png'
      })
      document.querySelector('.news-list').hidden = index !== 0
      document.querySelector('.news-empty').hidden = index === 0
    })
  })

  var newsCarousel = document.querySelector('.news-carousel')
  var newsTrack = document.querySelector('.news-carousel-track')
  var newsPages = Array.prototype.slice.call(document.querySelectorAll('.news-pages button'))
  var newsImages = Array.prototype.slice.call(newsTrack.querySelectorAll('img'))
  var newsIndex = 2
  var newsPosition = 3
  var newsTimer
  var dragStart = null

  function positionNews(distance) {
    newsTrack.style.transform = 'translate3d(' + (-newsPosition * newsCarousel.clientWidth + (distance || 0)) + 'px,0,0)'
  }

  function scheduleNews() {
    clearTimeout(newsTimer)
    if (document.hidden || !overlay.hidden || newsCarousel.matches(':hover') || newsCarousel.contains(document.activeElement)) return
    newsTimer = setTimeout(function () { showNews(newsIndex + 1) }, 4000)
  }

  function showNews(index) {
    var total = newsPages.length
    newsIndex = (index + total) % total
    newsPosition = index === total ? total + 1 : index === -1 ? 0 : newsIndex + 1
    newsTrack.classList.remove('is-dragging')
    positionNews()
    newsPages.forEach(function (button, pageIndex) {
      var selected = pageIndex === newsIndex
      button.classList.toggle('is-active', selected)
      if (selected) button.setAttribute('aria-current', 'true')
      else button.removeAttribute('aria-current')
    })
    document.querySelector('.news-active-bar').style.left = ['2.35rem', '2.95rem', '3.55rem', '4.14rem'][newsIndex]
    newsImages.forEach(function (image, imageIndex) {
      image.alt = imageIndex === newsPosition ? '不知火舞，格斗家集结' : ''
    })
    newsCarousel.setAttribute('aria-label', '游戏资讯海报轮播，第' + (newsIndex + 1) + '张，共' + total + '张')
    scheduleNews()
  }

  newsTrack.addEventListener('transitionend', function (event) {
    if (event.target !== newsTrack || event.propertyName !== 'transform') return
    if (newsPosition !== 0 && newsPosition !== newsPages.length + 1) return
    newsPosition = newsIndex + 1
    newsTrack.classList.add('is-dragging')
    positionNews()
    newsImages.forEach(function (image, imageIndex) {
      image.alt = imageIndex === newsPosition ? '不知火舞，格斗家集结' : ''
    })
    requestAnimationFrame(function () { requestAnimationFrame(function () { newsTrack.classList.remove('is-dragging') }) })
  })

  newsPages.forEach(function (button) {
    button.addEventListener('click', function () { showNews(Number(button.dataset.page)) })
  })
  newsCarousel.addEventListener('pointerdown', function (event) {
    if (event.button !== 0) return
    clearTimeout(newsTimer)
    dragStart = { x: event.clientX, y: event.clientY }
    newsCarousel.setPointerCapture(event.pointerId)
    newsTrack.classList.add('is-dragging')
  })
  newsCarousel.addEventListener('pointermove', function (event) {
    if (!dragStart) return
    var distanceX = event.clientX - dragStart.x
    if (Math.abs(distanceX) > Math.abs(event.clientY - dragStart.y)) positionNews(distanceX)
  })
  newsCarousel.addEventListener('pointerup', function (event) {
    if (!dragStart) return
    var distanceX = event.clientX - dragStart.x
    var distanceY = event.clientY - dragStart.y
    dragStart = null
    if (Math.abs(distanceX) > 35 && Math.abs(distanceX) > Math.abs(distanceY)) {
      var direction = distanceX < 0 ? 1 : -1
      showNews(newsIndex + direction)
      easReport(direction === 1 ? 'news_swipe_next' : 'news_swipe_prev', 'btn', direction === 1 ? '左滑资讯海报' : '右滑资讯海报')
    } else {
      newsTrack.classList.remove('is-dragging')
      positionNews()
      scheduleNews()
    }
  })
  newsCarousel.addEventListener('pointercancel', function () {
    dragStart = null
    newsTrack.classList.remove('is-dragging')
    positionNews()
    scheduleNews()
  })
  newsCarousel.addEventListener('mouseenter', function () { clearTimeout(newsTimer) })
  newsCarousel.addEventListener('mouseleave', scheduleNews)
  newsPages.forEach(function (button) {
    button.addEventListener('focus', function () { clearTimeout(newsTimer) })
    button.addEventListener('blur', scheduleNews)
  })
  window.addEventListener('resize', positionNews)
  document.addEventListener('visibilitychange', scheduleNews)
  scheduleNews()

  var gallery = document.querySelector('.feature-gallery')
  var leftImage = gallery.querySelector('.side.left')
  var frontImage = gallery.querySelector('.front')
  var rightImage = gallery.querySelector('.side.right')
  var featureImages = ['feature-left.png', 'feature-main.png', 'feature-right.png']
  var featureLabels = ['街机手感，重燃记忆', '宿命之战再启，全明星登场', '最初热爱，不知火舞参上']
  var featureIndex = 1

  function showFeature(index) {
    featureIndex = (index + 3) % 3
    var images = [leftImage, frontImage, rightImage]
    var indexes = [(featureIndex + 2) % 3, featureIndex, (featureIndex + 1) % 3]
    gallery.classList.add('is-changing')
    images.forEach(function (image, position) {
      image.src = '../ossweb-img/pc/' + featureImages[indexes[position]]
      image.alt = featureLabels[indexes[position]]
    })
    frontImage.classList.toggle('is-brightened', featureIndex !== 1)
    requestAnimationFrame(function () { gallery.classList.remove('is-changing') })
    document.querySelectorAll('.feature-dot-actions button').forEach(function (button, dotIndex) {
      button.classList.toggle('is-active', dotIndex === featureIndex)
      if (dotIndex === featureIndex) button.setAttribute('aria-current', 'true')
      else button.removeAttribute('aria-current')
    })
    document.querySelectorAll('.feature-dots img').forEach(function (dot, dotIndex) {
      dot.src = '../ossweb-img/pc/feature-dot' + (dotIndex === featureIndex ? '-active' : '') + '.png'
      dot.classList.toggle('is-active', dotIndex === featureIndex)
    })
  }
  document.querySelectorAll('[data-feature-step]').forEach(function (button) {
    button.addEventListener('click', function () { showFeature(featureIndex + Number(button.dataset.featureStep)) })
  })
  document.querySelectorAll('[data-feature]').forEach(function (button) {
    button.addEventListener('click', function () {
      var index = Number(button.dataset.feature)
      if (index > 2) showMessage('更多游戏特色敬请期待')
      else showFeature(index)
    })
  })
}())
