'use strict';

const VIEWED_TIME_THRESHOLD = 1000 * 60 // 1時間 (これ以上経過していない閲覧履歴は表示しない)

window.addEventListener("load", main, false);

function main(e) {
  addCounter()
};

// 検索画面下に件数出す部分の用意
function addCounter() {
  $('div[class^="SearchForm__InputBase"]').append("<div style='text-align: right; padding-right: 27px; margin-top: 7px;'><p id='viewed-count'></p></div>")
}

function displayTime(time) {
  if (!time) {
    return ''
  }
  const year = time.getFullYear();
  const mon = time.getMonth() + 1; //１を足すこと
  const day = time.getDate();
  const hour = time.getHours();
  const min = time.getMinutes();
  const sec = time.getSeconds();

  const s = year + "年" + mon + "月" + day + "日" + hour + "時" + min + "分"
  return s
}

function getViewedUserKey(userID) {
  return 'vw-' + userID
}

function storeLastViewed(userID) {
  // 最新の閲覧日時をみて、それが1時間以上経っている場合のみ保存する
  // 最も新しいもの2つを保存する (なぜなら、今見ている時間を保存する必要がありつつ、表示には前回のものを使うため)
  const key = getViewedUserKey(userID)
  const latestTimestamp = _getLatestViewedTimestamp(key)
  const now = new Date().getTime()
  console.log('compare: ' + now + ' vs ' + latestTimestamp)
  console.log('sub: ' + (now - latestTimestamp))
  if ((now - latestTimestamp) > VIEWED_TIME_THRESHOLD){
    var storeObj = {}
    storeObj[key] = [now, latestTimestamp]
    console.log('save: ')
    console.log(storeObj)
    chrome.storage.local.set(storeObj)
  }
}

function _getLatestViewedTimestamp(viewedKey) {
  // 最も新しい閲覧時間を取得
  var latestTimestamp = null
  chrome.storage.local.get([viewedKey], function (result) {
    if (result[viewedKey]) {
      latestTimestamp = result[viewedKey][0]
      console.log('_getLatestViewedTimestamp 1: ' + latestTimestamp)
    }
  })
  console.log('_getLatestViewedTimestamp 2: ' + latestTimestamp)
  return latestTimestamp
}

function getLastViewed(userID) {
  // 前回閲覧した時間を取得
  // 1時間以上前に見た記録に限って取得する
  var latestTimestamp = null
  const now = new Date()
  const key = getViewedUserKey(userID)
  chrome.storage.local.get([key], function (result) {
    if (result[key]) {
      const last = result[key][0]
      const last2 = result[key][1]
      if ((now - last) > VIEWED_TIME_THRESHOLD){
        latestTimestamp = last
      } else {
        latestTimestamp = last2
      }
    }
  })
  return latestTimestamp
}

// 最初の要素は値がズレがちでIDとして扱うとバグるので、最初の5つ(<4000)は固定でいれる
var cardsList = [740, 740 * 2, 740 * 3, 740 * 4, 740 * 5]

$(window).scroll(function(){
  var cards = $('div[class="ReactVirtualized__Grid__innerScrollContainer"]').children()
  $(cards).each(function(i, card){
    const cardTop = $(card).css('top')
    const cardID = Number(cardTop.slice(0, -2))
    if (cardID > 4000 && !cardsList.includes(cardID)) {
      const lastID = cardsList[cardsList.length - 1]
      // 値がズレやすい部分の対応
      if (cardID > lastID) {
        cardsList.push(cardID);
      }
    }
    // カードのIDに `UserListItem-18411406` が入っているのでUserIDだけ抜き出す
    const userID = $(card).children('div').first().attr('id').slice(13, -1)
    const lastViewTimestamp = getLastViewed(userID)
    storeLastViewed(userID)

    const a = displayTime(lastViewTimestamp)
    console.log(a)
  })

  var denom = $('p[class^="UserListContainer__HeadingNumberLabel"]').text()
  const YOffset = window.pageYOffset
  // カードの座標と比較するため
  const scrollValue = YOffset + 560

  var cardsScrolled = 0
  cardsList.forEach(function(top, i) {
    if (scrollValue > top) {
      cardsScrolled = i + 1
      return false
    }
  })
  if (!($('p#viewed-count').length)) {
    addCounter()
  }
  $('p#viewed-count').text(cardsScrolled + '/' + denom)
})
