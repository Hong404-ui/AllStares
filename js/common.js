(function () {
  'use strict'

  var platform = document.documentElement.dataset.platform || 'mobile'
  var message = document.getElementById('site-message')
  var messageTimer
  var globalData = { openid: '', ext1: '', ext2: '' }

  window.easReport = function (action, type, label) {
    try {
      if (window.EAS && typeof window.EAS.SendClick === 'function') {
        window.EAS.SendClick({
          e_c: 'allstarawakening.index.' + platform + '.' + action,
          openid: globalData.openid,
          ext1: type || globalData.ext1 || 'btn',
          ext2: label || globalData.ext2,
          ext3: new URLSearchParams(location.search).get('e_code') || ''
        })
      }
    } catch (error) { console.warn('EAS report failed', error) }
  }

  window.allstarShowMessage = function (text) {
    if (!message) return
    clearTimeout(messageTimer)
    message.textContent = text
    message.hidden = false
    messageTimer = setTimeout(function () { message.hidden = true }, 2600)
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a')
    if (!link) return
    if (link.getAttribute('href') === '#') event.preventDefault()
    if (link.dataset.track) {
      window.easReport(link.dataset.track, link.dataset.trackType || (link.getAttribute('href') === '#' ? 'btn' : 'link'), link.dataset.trackLabel || link.getAttribute('aria-label') || link.textContent.trim())
    }
    if (link.dataset.message) {
      event.preventDefault()
      window.allstarShowMessage(link.dataset.message)
    }
    if (link.dataset.action === 'news-item') {
      var item = window.getVisibleNewsItem && window.getVisibleNewsItem(Number(link.dataset.newsIndex))
      if (!item || !item.url) { event.preventDefault(); window.allstarShowMessage('资讯详情页待接入') }
    }
    if (link.dataset.action === 'more-news' && link.getAttribute('href') === '#') { event.preventDefault(); window.allstarShowMessage('更多资讯页面待接入') }
  })

  function markPublicLinks() {
    var tracks = { '成长守护平台': 'header_guardian', '腾讯公司 版权所有': 'footer_copyright' }
    document.querySelectorAll('a:not([data-track])').forEach(function (link) {
      var track = tracks[link.textContent.trim()]
      if (track) link.dataset.track = track
    })
  }
  window.addEventListener('load', markPublicLinks)
  markPublicLinks()

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
  window.easReport('pv', 'page', '页面浏览')
}())
