'use strict';

window.addEventListener("load", main, false);

function main(e) {
  addCounter()
};

// 検索画面下に件数出す部分の用意
function addCounter() {
  $('div[class^="SearchForm__InputBase"]').append("<div style='text-align: right; padding-right: 27px; margin-top: 7px;'><p id='viewed-count'></p></div>")
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
