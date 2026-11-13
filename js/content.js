(function () {
  'use strict'

  var content = {}
  var selectedCategory = 'latest'
  var categoryNames = { latest: '最新', news: '新闻', notice: '公告', event: '活动', guide: '攻略' }

  function read(path, source) {
    return path.split('.').reduce(function (value, key) { return value == null ? undefined : value[key] }, source)
  }

  function renderDescription(element, value) {
    var characters = Array.from(value == null ? '' : String(value))
    element.replaceChildren()
    for (var start = 0; start < characters.length; start += 35) {
      var line = document.createElement('span')
      line.className = 'description-line'
      if (characters.length - start < 35) line.classList.add('is-short')
      line.textContent = characters.slice(start, start + 35).join('')
      element.appendChild(line)
    }
  }

  function renderText(element, value) {
    if (element.dataset.content === 'character.description') renderDescription(element, value)
    else element.textContent = value == null ? '' : String(value)
  }

  function visibleNews() {
    var items = Array.isArray(content.news && content.news.items) ? content.news.items : []
    return selectedCategory === 'latest' ? items : items.filter(function (item) {
      return item.categoryCode === selectedCategory || item.category === categoryNames[selectedCategory]
    })
  }

  function renderNews() {
    var items = visibleNews()
    document.querySelectorAll('.news-list li').forEach(function (row, index) {
      var item = items[index]
      row.hidden = !item
      if (!item) return
      row.querySelectorAll('[data-content]').forEach(function (element) {
        renderText(element, read(element.dataset.content.replace(/^news\.items\.\d+/, 'item'), { item: item }))
      })
      var link = row.querySelector('a.row-hit')
      if (link) {
        link.dataset.newsIndex = String(index)
        link.setAttribute('aria-label', '查看资讯：' + (item.title || item.tag || index + 1))
        link.href = item.url || '#'
      }
    })
    var empty = document.querySelector('.news-empty')
    if (empty) empty.hidden = items.length > 0
  }

  window.setNewsCategory = function (category) {
    selectedCategory = categoryNames[category] ? category : 'latest'
    renderNews()
    var moreLink = document.querySelector('.news-more-hit, .news-more[href]')
    if (moreLink && content.news && content.news.moreUrl) {
      moreLink.href = content.news.moreUrl
      moreLink.removeAttribute('data-message')
    }
  }

  window.getVisibleNewsItem = function (index) { return visibleNews()[index] }

  window.renderGameContent = function (data) {
    content = data && typeof data === 'object' ? data : {}
    document.querySelectorAll('[data-content]').forEach(function (element) {
      if (element.dataset.content.indexOf('news.items.') === 0) return
      renderText(element, read(element.dataset.content, content))
    })
    renderNews()
    if (Array.isArray(content.news && content.news.slides) && window.setNewsSlides) window.setNewsSlides(content.news.slides)
    if (Array.isArray(content.featureSlides) && window.setFeatureSlides) window.setFeatureSlides(content.featureSlides)
    if (Array.isArray(content.characters) && window.setCharacters) window.setCharacters(content.characters)
    document.dispatchEvent(new CustomEvent('allstar:content-loaded', { detail: { content: content } }))
  }
}())
