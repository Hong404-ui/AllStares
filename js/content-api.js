(function () {
  'use strict'

  var isPc = document.documentElement.dataset.platform === 'pc'
  var projectRoot = new URL(isPc ? '../' : './', document.baseURI)
  var endpoint = window.ALLSTAR_CONTENT_API_URL || new URL('data/content.json', projectRoot).href

  function imageUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return ''
    try {
      var url = new URL(value, projectRoot)
      return /^https?:$/.test(url.protocol) ? url.href : ''
    } catch (error) { return '' }
  }

  function linkUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return ''
    try {
      var url = new URL(value, projectRoot)
      return /^https?:$/.test(url.protocol) ? url.href : ''
    } catch (error) { return '' }
  }

  function prepareSlides(slides) {
    if (!Array.isArray(slides)) return []
    return slides.map(function (slide) {
      return { src: imageUrl(isPc ? slide.pcImage || slide.image : slide.mobileImage || slide.image), alt: slide.alt || '', caption: slide.caption || '', width: slide.width, height: slide.height }
    }).filter(function (slide) { return slide.src })
  }

  window.loadGameContent = function (url) {
    return fetch(url || endpoint, { credentials: 'same-origin' }).then(function (response) {
      if (!response.ok) throw new Error('内容接口返回 ' + response.status)
      return response.json()
    }).then(function (payload) {
      var data = payload && payload.data && !payload.news ? payload.data : payload
      if (!data || typeof data !== 'object') throw new Error('内容接口数据格式错误')
      data.news = data.news || {}
      data.news.moreUrl = linkUrl(data.news.moreUrl)
      if (Array.isArray(data.news.items)) data.news.items.forEach(function (item) { item.url = linkUrl(item.url) })
      data.news.slides = prepareSlides(data.news.slides)
      data.featureSlides = prepareSlides(data.featureSlides)
      window.renderGameContent(data)
      return data
    }).catch(function (error) {
      console.warn('Content API failed', error)
      if (window.setFeatureSlidesStatus) window.setFeatureSlidesStatus('特色内容加载失败')
      document.dispatchEvent(new Event('allstar:content-error'))
      if (window.allstarShowMessage) window.allstarShowMessage('内容加载失败，请稍后重试')
      throw error
    })
  }

  window.loadGameContent().catch(function () {})
}())
