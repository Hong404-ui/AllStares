(function () {
  'use strict'

  var base = 'https://comm.ams.game.qq.com/ide/'
  var actions = {
    column: '?sIdeToken=OeUtNS&iChartId=469530',
    detail: '?sIdeToken=agqFTB&iChartId=469556',
    news: '?sIdeToken=XZcIxe&iChartId=469572'
  }
  var names = { latest: '最新', news: '新闻', notice: '公告', event: '活动', guide: '攻略' }
  var columnDocuments = {}
  var currentCategory = 'latest'
  var requestNumber = 0
  var started = false
  var lastNewsRows = null

  function request(action, data) {
    return new Promise(function (resolve, reject) {
      var done = false
      var timeout = setTimeout(function () { finish(new Error('iDE 接口请求超时')) }, 12000)
      function finish(error, value) {
        if (done) return
        done = true
        clearTimeout(timeout)
        if (error) reject(error)
        else resolve(value)
      }
      try {
        var options = {
          url: base + actions[action],
          data: data || {},
          success: function (response) {
            if (response && ((response.iRet != null && Number(response.iRet) !== 0) || (response.code != null && Number(response.code) !== 0))) {
              finish(new Error(response.sMsg || response.message || 'iDE 接口返回错误'))
            } else finish(null, response)
          },
          fail: function (error) { finish(error instanceof Error ? error : new Error('iDE 接口请求失败')) }
        }
        if (window.Milo && Milo.request && typeof Milo.request.get === 'function') {
          Milo.request.get(options)
        } else {
          var url = new URL(options.url)
          Object.keys(options.data).forEach(function (key) { url.searchParams.set(key, options.data[key]) })
          fetch(url.href, { credentials: 'include' }).then(function (response) {
            if (!response.ok) throw new Error('iDE 接口返回 ' + response.status)
            return response.json()
          }).then(options.success, options.fail)
        }
      } catch (error) { finish(error) }
    })
  }

  function decode(value) {
    if (typeof value !== 'string') return value
    try { return JSON.parse(value) } catch (error) { return value }
  }

  function result(value) {
    value = decode(value)
    for (var i = 0; i < 5 && value && !Array.isArray(value); i++) {
      if (value.jData != null) value = decode(value.jData)
      else if (value.details != null) value = decode(value.details)
      else if (value.data != null) value = decode(value.data)
      else if (value.result != null) value = decode(value.result)
      else break
    }
    return value
  }

  function rows(response) {
    var value = result(response)
    if (Array.isArray(value)) return value
    if (!value || typeof value !== 'object') return []
    var list = value.list || value.rows || value.records || value.items || value.dataList
    return Array.isArray(list) ? list : []
  }

  function field(row, keys) {
    for (var i = 0; i < keys.length; i++) {
      var value = row && row[keys[i]]
      if (value != null && value !== '') return value
    }
    return ''
  }

  function safeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return ''
    try {
      var url = new URL(value, base)
      return /^https?:$/.test(url.protocol) ? url.href : ''
    } catch (error) { return '' }
  }

  function categoryOf(row) {
    var explicit = field(row, ['e_column_name', 'column_name', 'columnName', 'category', 'sColumnName'])
    if (explicit) return String(explicit)
    var assigned = row && row.column_order_info
    if (assigned && typeof assigned === 'object') {
      var documentIds = Object.keys(assigned)
      for (var i = 0; i < documentIds.length; i++) {
        if (columnDocuments[documentIds[i]]) return columnDocuments[documentIds[i]]
      }
    }
    return names[currentCategory]
  }

  function formatDate(value) {
    if (value == null || value === '') return ''
    var text = String(value).trim()
    var millis = /^\d{10,13}$/.test(text) ? Number(text) * (text.length === 10 ? 1000 : 1) : Date.parse(text)
    if (!Number.isNaN(millis)) {
      var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(millis))
      var date = {}
      parts.forEach(function (part) { date[part.type] = part.value })
      return date.year + '/' + date.month + '/' + date.day
    }
    return text.slice(0, 10).replace(/-/g, '/')
  }

  function mapNews(row) {
    var title = String(field(row, ['e_title', 'title', 'sTitle', 'name']))
    var category = categoryOf(row)
    var published = String(field(row, ['e_published_at', 'published_at', 'publishTime', 'date', 'sDate']))
    return {
      id: field(row, ['documentId', 'document_id', 'e_document_id', 'id', 'iId', 'iInfoId', 'e_id', 'sId']),
      category: category,
      tag: String(field(row, ['e_subtitle', 'tag', 'sTag'])) || '【' + category + '】',
      title: title,
      date: formatDate(published),
      url: safeUrl(field(row, ['e_url', 'url', 'sUrl', 'link'])),
      raw: row
    }
  }

  function mapSlide(row) {
    var images = row && Array.isArray(row.images) ? row.images : []
    var image = images.find(function (item) { return item.field === 'cover1' }) || images[0]
    var pc = safeUrl(field(row, ['e_pc_image', 'pcImage', 'pc_image', 'e_cover', 'e_image', 'image', 'sImgUrl', 'pic']) || image && image.url)
    var mobile = safeUrl(field(row, ['e_mobile_image', 'mobileImage', 'mobile_image', 'e_cover_mobile']))
    return {
      src: document.documentElement.dataset.platform === 'pc' ? pc || mobile : mobile || pc,
      alt: String(field(row, ['e_title', 'title', 'sTitle']) || image && image.alternativeText || ''),
      caption: String(field(row, ['e_title', 'title', 'sTitle']))
    }
  }

  function query(columnName, page) {
    return request('news', {
      filter_column_name: columnName === '最新' ? '' : columnName,
      page: page || 1,
      pageSize: 5,
      sort_1: columnName === '最新' ? 'e_published_at:desc' : '',
      filter_content_type: columnName === 'Banner' ? 7 : 5
    })
  }

  window.loadIdeNewsCategory = function (category) {
    currentCategory = names[category] ? category : 'latest'
    lastNewsRows = null
    window.setNewsCategory(currentCategory)
    var serial = ++requestNumber
    return query(names[currentCategory], 1).then(function (response) {
      if (serial !== requestNumber) return
      lastNewsRows = rows(response)
      var items = lastNewsRows.map(mapNews).filter(function (item) { return item.title })
      window.setRemoteNewsItems(items)
    }).catch(function (error) {
      if (serial === requestNumber) window.setRemoteNewsItems(null)
      console.warn('资讯列表接口加载失败', error)
    })
  }

  window.loadIdeNewsDetail = function (item) {
    if (!item || !item.id) return Promise.reject(new Error('资讯缺少详情 ID'))
    return request('detail', { documentId: item.id }).then(function (response) {
      var detail = result(response)
      if (Array.isArray(detail)) detail = detail[0]
      var url = safeUrl(field(detail, ['e_url', 'url', 'sUrl', 'link']))
      if (url) { location.href = url; return }
      var title = field(detail, ['e_title', 'title', 'sTitle']) || item.title
      var body = field(detail, ['e_content', 'content', 'sContent', 'body'])
      if (!body) throw new Error('详情接口未返回正文或链接')
      var dialog = document.getElementById('ide-news-detail')
      if (!dialog) {
        dialog = document.createElement('div')
        dialog.id = 'ide-news-detail'
        dialog.className = 'ide-news-detail'
        dialog.innerHTML = '<div class="ide-news-detail-panel" role="dialog" aria-modal="true" aria-labelledby="ide-news-detail-title"><button type="button" class="ide-news-detail-close" aria-label="关闭资讯详情" data-track="news_detail_close">×</button><h2 id="ide-news-detail-title"></h2><div class="ide-news-detail-body"></div></div>'
        document.body.appendChild(dialog)
        dialog.addEventListener('click', function (event) {
          if (event.target === dialog || event.target.closest('.ide-news-detail-close')) {
            if (event.target.closest('.ide-news-detail-close')) window.easReport('news_detail_close', 'btn', '关闭资讯详情')
            dialog.hidden = true
          }
        })
      }
      dialog.querySelector('h2').textContent = String(title)
      dialog.querySelector('.ide-news-detail-body').textContent = String(body).replace(/<[^>]*>/g, ' ')
      dialog.hidden = false
      dialog.querySelector('button').focus()
    })
  }

  function start() {
    if (started) return
    started = true
    request('column').then(function (response) {
      var columns = rows(response).filter(function (column) { return column && column.name && column.name !== 'Banner' })
      var keys = ['news', 'notice', 'event', 'guide']
      keys.forEach(function (key, index) {
        var column = columns.find(function (item) { return item.name === names[key] }) || columns[index]
        if (!column) return
        names[key] = String(column.name)
        if (column.documentId) columnDocuments[column.documentId] = names[key]
        document.querySelectorAll('[data-tab="' + key + '"], [data-category="' + key + '"]').forEach(function (tab) {
          var label = tab.querySelector('[data-content]')
          if (label) label.textContent = names[key]
          tab.setAttribute('aria-label', names[key])
          if (tab.dataset.trackLabel) tab.dataset.trackLabel = names[key] + '资讯'
        })
      })
      if (lastNewsRows) window.setRemoteNewsItems(lastNewsRows.map(mapNews).filter(function (item) { return item.title }))
    }).catch(function (error) { console.warn('资讯栏目接口加载失败', error) })
    window.loadIdeNewsCategory('latest')
    if (window.setNewsSlidesStatus) window.setNewsSlidesStatus('loading')
    query('Banner', 1).then(function (response) {
      var slides = rows(response).map(mapSlide).filter(function (slide) { return slide.src })
      if (window.setNewsSlides) window.setNewsSlides(slides)
    }).catch(function (error) {
      if (window.setNewsSlides) window.setNewsSlides([])
      if (window.setNewsSlidesStatus) window.setNewsSlidesStatus('error')
      console.warn('Banner 接口加载失败', error)
    })
  }

  document.addEventListener('allstar:content-loaded', start, { once: true })
  document.addEventListener('allstar:content-error', start, { once: true })
  if (window.allstarContentLoaded) start()
}())
