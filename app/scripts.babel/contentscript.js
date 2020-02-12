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

function displayTime(timestamp) {
  if (!timestamp) {
    return ''
  }
  const time = new Date(timestamp)
  const year = time.getFullYear();
  const mon = time.getMonth() + 1; //１を足すこと
  const day = time.getDate();
  const hour = time.getHours();
  const min = ('00' + time.getMinutes()).slice(-2); // ゼロ埋め
  const sec = ('00' + time.getSeconds()).slice(-2); // ゼロ埋め

  const s = year + "年" + mon + "月" + day + "日 " + hour + ":" + min
  return s
}

function getViewedUserKey(userID) {
  return 'vw-' + userID
}


function saveTimeStamp(key, newerTime, olderTIme) {
  var storeObj = {}
  storeObj[key] = [newerTime, olderTIme]
  chrome.storage.local.set(storeObj)

}

function storeLastViewed(userID) {
  // 最新の閲覧日時をみて、それが VIEWED_TIME_THRESHOLD 以上経っている場合のみ保存する
  // 最も新しいもの2つを保存する (なぜなら、今見ている時間を保存する必要がありつつ、表示には前回のものを使うため)
  const viewedKey = getViewedUserKey(userID)
  const now = new Date().getTime()
  chrome.storage.local.get([viewedKey], function (result) {
    if (result[viewedKey] !== undefined) {
      const latestTimestamp = result[viewedKey][0]

      if ((now - latestTimestamp) > VIEWED_TIME_THRESHOLD){
        console.log('save: update')
        saveTimeStamp(viewedKey, now, latestTimestamp)
      }
    } else {
      console.log('save: now')
      saveTimeStamp(viewedKey, now, null)
    }
  })
}

function showLastViewed(card, userID) {
  // 前回閲覧した時間を取得
  // 1時間以上前に見た記録に限って取得する
  const now = new Date()
  const key = getViewedUserKey(userID)
  chrome.storage.local.get([key], function (result) {
    if (result[key] !== undefined) {
      console.log("showLastViewed")
      const last = result[key][0]
      const last2 = result[key][1]
      if ((now - last) > VIEWED_TIME_THRESHOLD){
        appendLastViewed(card, last)
      } else {
        appendLastViewed(card, last2)
      }
    }
  })
}

function appendLastViewed(parentElm, timestamp) {
  const text = displayTime(timestamp)
  const lastViewedParentElm = $(parentElm).find('div[class^="UserListItemTypeCard__ScoutButtonContainer"]')
  const isExist = $(lastViewedParentElm).find('span.LastViewed')
  if ($(isExist).length === 0 && text !== '') {
    $(lastViewedParentElm).prepend("<span class='LastViewed' style='font-weight: 400; font-size: 12px; color: rgba(0, 0, 0, 0.4); line-height: 16px;'>最終閲覧日時: " + text + "</span>")
  }
  // TODO: 最後に詳細画面を開いた 「詳細確認日時」を最終閲覧日時の下に出す
  // TODO: <div>で囲って<br>することで2行にして出す
  // TODO: それぞれの言葉の意味はtooltipでだす。(すぐ右のボタンがtooltopを使っている)
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
    showLastViewed(card, userID)
    storeLastViewed(userID)
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
