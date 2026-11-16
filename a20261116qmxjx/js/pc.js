(function () {
  'use strict'

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
  var mapped = 0
  document.querySelectorAll('#afooter .wrap_ieg > p:first-child a').forEach(function (link) {
    var label = link.textContent.trim()
    if (!footerTracks[label]) return
    link.dataset.track = footerTracks[label]
    link.href = footerHrefs[label]
    mapped += 1
  })
  var fallback = document.querySelector('.footer-links-fallback')
  if (mapped === 8 && fallback) fallback.remove()
}())
