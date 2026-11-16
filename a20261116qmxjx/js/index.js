(function () {
  'use strict'

  var overlay = document.getElementById('overlay')
  var loginDialog = document.getElementById('login-dialog')
  var loginStatus = document.getElementById('login-status')
  var siteNav = document.getElementById('site-nav')
  var menuTrigger = document.querySelector('.menu-trigger')
  var previousFocus

  function setMenuOpen(open) {
    siteNav.hidden = !open
    menuTrigger.setAttribute('aria-expanded', String(open))
    menuTrigger.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单')
  }
  menuTrigger.addEventListener('click', function (event) { event.preventDefault(); setMenuOpen(siteNav.hidden) })
  siteNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setMenuOpen(false) })
  })

  function openDialog() {
    previousFocus = document.activeElement
    loginStatus.textContent = ''
    loginDialog.hidden = false
    overlay.hidden = false
    document.documentElement.classList.add('modal-open')
    document.body.classList.add('modal-open')
    document.dispatchEvent(new Event('allstar:modal-change'))
    requestAnimationFrame(function () { if (!overlay.hidden) overlay.classList.add('show') })
    loginDialog.querySelector('a').focus()
  }

  function closeDialog() {
    if (overlay.hidden) return
    overlay.classList.remove('show')
    overlay.hidden = true
    loginDialog.hidden = true
    document.documentElement.classList.remove('modal-open')
    document.body.classList.remove('modal-open')
    document.dispatchEvent(new Event('allstar:modal-change'))
    if (previousFocus && previousFocus.isConnected) previousFocus.focus()
  }

  document.querySelectorAll('.login-trigger, .claim-trigger').forEach(function (link) {
    link.addEventListener('click', function (event) { event.preventDefault(); openDialog() })
  })
  document.querySelectorAll('.login-close').forEach(function (link) {
    link.addEventListener('click', function (event) { event.preventDefault(); closeDialog() })
  })
  document.querySelectorAll('.login-choice').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault()
      var provider = link.dataset.provider
      var request = new CustomEvent('allstar:login-request', { cancelable: true, detail: { provider: provider } })
      window.dispatchEvent(request)
      if (!request.defaultPrevented) loginStatus.textContent = (provider === 'wechat' ? '微信' : 'QQ') + '登录服务暂未接入'
    })
  })
  window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !siteNav.hidden) { setMenuOpen(false); menuTrigger.focus() }
    if (overlay.hidden) return
    if (event.key === 'Escape') { window.easReport('login_escape_close', 'btn', '按 Esc 关闭登录弹窗'); closeDialog() }
    if (event.key !== 'Tab') return
    var links = loginDialog.querySelectorAll('a')
    var first = links[0]
    var last = links[links.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  })
  if (location.hash === '#login') openDialog()
}())
