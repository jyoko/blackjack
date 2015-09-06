/* deck.js
 * creates a deck of cards
 */

module.exports = Deck;

// TODO: track dealt cards
function Deck(size) {
  this.size = size || 1;
  this.cardsInDeck = 52;
  this.cardCount = this.cardsInDeck*this.size;
  this.makeDeck();
}

// make deck of cards
// just pushes Cards into an array,
// i%13 gives a rank for 52 cards
// i/13|0 drops decimal and gives a suit for 52 cards
Deck.prototype.makeDeck = function() {
  this.deck = [];
  for (var i=0;i<this.size;i++) {
    for (var j=0;j<this.cardsInDeck;j++) {
      this.deck.push(new this.Card(j%13,(j/13)|0));
    }
  }
}

// basic Fisher-Yate in-place shuffle function
// modifies current deck
// TODO: needs a proper random shuffle?
Deck.prototype.shuffle =  function() {
  var cI = this.deck.length,
      tV,
      rI;

  while (0 !== cI) {
    rI = Math.floor(Math.random() * cI);
    cI--;
    tV = this.deck[cI];
    this.deck[cI] = this.deck[rI];
    this.deck[rI] = tV;
  }
}

// add pop() for convenience vs myDeck.deck.pop()
Deck.prototype.pop = function() {
  this.cardCount--;
  return this.deck.pop();
}

// deal is almost this.deck.pop()
// but always returns array
// also accepts a number EG:
// myDeck.deal(2) <-- pops 2 cards off the deck
Deck.prototype.deal = function(number) {
  number = number || 1;
  var retCards = [];
  this.cardCount -= number;
  for (var i=0;i<number;i++) {
    retCards.push(this.deck.pop());
  }
  return retCards;
}

// creates a Card object for use in Deck
Deck.prototype.Card = function(rank,suit) {
  this.suitName = ['Spades','Diamonds','Clubs','Hearts'][suit];
  this.rankName = rank;
  if (rank === 0) {
    this.rankName = 'King';
  }
  if (rank === 1) {
    this.rankName = 'Ace';
  }
  if (rank === 11) {
    this.rankName = 'Jack';
  }
  if (rank === 12) {
    this.rankName = 'Queen';
  }
  this.rank = rank;
  this.suit = suit;
};
