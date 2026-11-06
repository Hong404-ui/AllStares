(function () {
  'use strict'

  var globalData = { openid: '', ext1: '', ext2: '' }
  var videoUrl = 'https://v.qq.com/txp/iframe/player.html?vid=m3093w4tk4a&autoplay=1'
  var overlay = document.getElementById('overlay')
  var loginDialog = document.getElementById('login-dialog')
  var videoDialog = document.getElementById('video-dialog')
  var videoPlayer = document.getElementById('video-player')
  var loginStatus = document.getElementById('login-status')
  var activeDialog = null
  var previousFocus = null

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

  function updateParts() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop
    var threshold = window.innerHeight / 1.1
    document.querySelectorAll('.page .part').forEach(function (part) {
      part.classList.toggle('show', scrollTop >= part.getBoundingClientRect().top + scrollTop - threshold)
    })
  }

  window.addEventListener('load', updateParts)
  window.addEventListener('scroll', updateParts)
  window.addEventListener('resize', updateParts)
  updateParts()

  function openDialog(kind) {
    previousFocus = document.activeElement
    activeDialog = kind === 'video' ? videoDialog : loginDialog
    loginStatus.textContent = ''
    loginDialog.hidden = activeDialog !== loginDialog
    videoDialog.hidden = activeDialog !== videoDialog
    overlay.hidden = false
    document.documentElement.classList.add('modal-open')
    document.body.classList.add('modal-open')
    if (activeDialog === videoDialog) videoPlayer.src = videoUrl
    requestAnimationFrame(function () {
      if (!overlay.hidden) overlay.classList.add('show')
    })
    activeDialog.querySelector('a').focus()
  }

  function closeDialog() {
    if (overlay.hidden) return
    videoPlayer.removeAttribute('src')
    overlay.classList.remove('show')
    overlay.hidden = true
    loginDialog.hidden = true
    videoDialog.hidden = true
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

  document.querySelectorAll('.login-trigger, .claim-trigger').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault()
      openDialog('login')
    })
  })

  document.querySelector('.play-trigger').addEventListener('click', function (event) {
    event.preventDefault()
    openDialog('video')
  })

  document.querySelectorAll('.login-close, .video-close').forEach(function (link) {
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
    if (overlay.hidden) return
    if (event.key === 'Escape') {
      easReport(activeDialog === loginDialog ? 'login_escape_close' : 'video_escape_close', 'btn', '按 Esc 关闭弹窗')
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

  if (location.hash === '#login') openDialog('login')
  if (location.hash === '#video') openDialog('video')
}())
