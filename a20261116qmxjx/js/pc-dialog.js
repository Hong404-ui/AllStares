(function () {
  'use strict'
  var overlay = document.getElementById('overlay')
  var page = document.querySelector('.page')
  var loginDialog = document.getElementById('login-dialog')
  var videoDialog = document.getElementById('video-dialog')
  var previousFocus
  var activeDialog
  var player
  var playerScript
  var videoRequest = 0
  var easReport = window.easReport
  var showMessage = window.allstarShowMessage
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

  function openDialog(kind, trigger) {
    previousFocus = document.activeElement
    activeDialog = kind === 'video' ? videoDialog : loginDialog
    loginDialog.hidden = activeDialog !== loginDialog
    videoDialog.hidden = activeDialog !== videoDialog
    overlay.hidden = false
    page.inert = true
    document.documentElement.classList.add('modal-open')
    document.dispatchEvent(new Event('allstar:modal-change'))
    activeDialog.querySelector('a').focus()
    if (kind !== 'video') return

    videoDialog.setAttribute('aria-label', trigger.getAttribute('aria-label') || '全明星觉醒视频')

    var request = ++videoRequest
    var status = document.getElementById('video-status')
    status.hidden = false
    status.textContent = '正在加载视频...'
    loadPlayerScript().then(function () {
      if (activeDialog !== videoDialog || request !== videoRequest) return
      player = new window.SuperPlayer({ container: '#super-player' })
      status.hidden = true
      return player.play({ vid: trigger.dataset.videoId || 'm3093w4tk4a' })
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
    document.dispatchEvent(new Event('allstar:modal-change'))
    activeDialog = null
    if (previousFocus && previousFocus.isConnected) previousFocus.focus()
  }

  document.querySelectorAll('[data-action]').forEach(function (link) {
    link.addEventListener('click', function () {
      var action = link.dataset.action
      if (action === 'login') openDialog('login', link)
      else if (action === 'video' || action === 'effect' || action === 'voice') openDialog('video', link)
      else if (action === 'community' || action === 'news-item' || action === 'more-news') return
      else if (action.indexOf('character-') === 0) return
      else showMessage(link.getAttribute('aria-label') + '入口待提供')
    })
  })

  document.querySelectorAll('.dialog-close').forEach(function (link) {
    link.addEventListener('click', closeDialog)
  })
  document.querySelectorAll('.login-choice').forEach(function (link) {
    link.addEventListener('click', function () {
      var provider = link.dataset.provider
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
      easReport(activeDialog === videoDialog ? 'video_escape_close' : 'login_escape_close', 'btn', '按 Esc 关闭弹窗')
      closeDialog()
    }
    if (event.key !== 'Tab') return
    var links = activeDialog.querySelectorAll('a')
    var first = links[0]
    var last = links[links.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  })

}())
