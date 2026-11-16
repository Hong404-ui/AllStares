(function () {
  'use strict'

  var triggers = document.querySelectorAll('[data-video-id]')
  var overlay = document.getElementById('video-overlay')
  var dialog = document.getElementById('video-dialog')
  var page = document.querySelector('.page')
  var closeButton = document.querySelector('.video-close')
  var container = document.getElementById('video-player')
  var status = document.getElementById('video-status')
  var player = null
  var previousFocus = null
  var videoRequest = 0

  function closeVideo() {
    if (overlay.hidden) return
    videoRequest++
    if (player) {
      try { player.stop() } catch (error) { console.warn('Video stop failed', error) }
      try { player.destroy() } catch (error) { console.warn('Video cleanup failed', error) }
      player = null
    }
    container.textContent = ''
    status.textContent = ''
    overlay.hidden = true
    page.inert = false
    document.documentElement.classList.remove('modal-open')
    document.body.classList.remove('modal-open')
    document.dispatchEvent(new Event('allstar:modal-change'))
    if (previousFocus && previousFocus.isConnected) previousFocus.focus()
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener('click', function (event) {
      event.preventDefault()
      previousFocus = document.activeElement
      var request = ++videoRequest
      status.textContent = '正在加载视频...'
      dialog.setAttribute('aria-label', trigger.getAttribute('aria-label'))
      overlay.hidden = false
      page.inert = true
      document.documentElement.classList.add('modal-open')
      document.body.classList.add('modal-open')
      document.dispatchEvent(new Event('allstar:modal-change'))
      dialog.focus()

      if (typeof window.SuperPlayer !== 'function') {
        status.textContent = '播放器加载失败，请稍后重试'
        return
      }

      try {
        player = new window.SuperPlayer({ container: container })
        Promise.resolve(player.play({ vid: trigger.dataset.videoId })).then(function () {
          if (request === videoRequest && !overlay.hidden) status.textContent = ''
        }).catch(function (error) {
          console.warn('Video playback failed', error)
          if (request === videoRequest && !overlay.hidden) status.textContent = '视频播放失败，请稍后重试'
        })
      } catch (error) {
        console.warn('Video playback failed', error)
        status.textContent = '视频播放失败，请稍后重试'
      }
    })
  })

  closeButton.addEventListener('click', function (event) {
    event.preventDefault()
    closeVideo()
  })
  overlay.addEventListener('click', function (event) {
    if (event.target !== overlay) return
    window.easReport('video_mask_close', 'btn', '点击遮罩关闭视频弹窗')
    closeVideo()
  })

  document.addEventListener('keydown', function (event) {
    if (overlay.hidden) return
    if (event.key === 'Escape') {
      event.preventDefault()
      window.easReport('video_escape_close', 'btn', '按 Esc 关闭宣传视频')
      closeVideo()
    } else if (event.key === 'Tab' && event.shiftKey && document.activeElement === closeButton) {
      event.preventDefault()
      closeButton.focus()
    }
  })
}())
