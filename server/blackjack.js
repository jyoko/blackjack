var http = require('http');
var io = require('socket.io');
var fs = require('fs');
var DIR = __dirname+'/..';
var PORT = 3000;

// basic Fisher-Yate in-place shuffle function
function shuffle(arr) {
  var cI = arr.length, tV, rI;
  while (0 !== cI) {
    rI = Math.floor(Math.random() * cI);
    cI--;
    tV = arr[cI];
    arr[cI] = arr[rI];
    arr[rI] = tV;
  }
  return arr;
}

// make deck of cards
// supporting multiple decks now!
// _ALWAYS_ returns shuffled
var getDeck = function(size) {
  size = size || 1; //assume 1 deck
  size *= 52;
  var deck = [];
  var card = {};
  for (var i=0;i<size;i++) {
    card.value = i;
    card.rank = i%13;
    card.suit = (i/13)|0;
    deck.push(makeCard(card));
  }
  return shuffle(deck);
}

// this mimics the Card model on the client
// even the awkward naming :-D
var makeCard = function(params) {
  var ret = {};
  ret.revealed = true;
  ret.suitName = ['Spades','Diamonds','Clubs','Hearts'][params.suit];
  ret.rankName = params.rank;
  if (params.rank === 0) {
    ret.rankName = 'King';
  }
  if (params.rank === 1) {
    ret.rankName = 'Ace';
  }
  if (params.rank === 11) {
    ret.rankName = 'Jack';
  }
  if (params.rank === 12) {
    ret.rankName = 'Queen';
  }
  ret.rank = params.rank;
  ret.suit = params.suit;
  ret.value = params.value;
  return ret;
};

// get blackjack score given a hand (array) of ^^ cards ^^
var handScore = function(cards) {
  var hasAce = 0;
  var score = cards.reduce(function(score,card) {
    if (card.rank===1) hasAce=1;
    return score + ((!card.rank || card.rank>10)?10:card.rank);
  },0);
  var scores = [score,score+(10*hasAce)];
  // If there's an ace above then scores[1] is the high chance
  // we default to that one until the hand is a bust, then use the lower
  return (scores[1]<22)?scores[1]:scores[0];
};

// expose mostly everything for easy access (only available to localhost ATM)
// don't put this live (AFAIK http doesn't block directory traversal)
function handleReq(req,res) {
  var filePath = DIR+req.url;
  if (filePath===DIR+'/') {
    filePath+='index.html';
  };
  fs.readFile(filePath, function(err, data) {
    if (err) {
      // every error returns 500 - oh well
      res.writeHead(500);
      return res.end('Error loading');
    }

    res.writeHead(200);
    res.end(data);
  });
}
var server = http.createServer(handleReq);
server.listen(PORT);


// Use these vars inside the connection
var deck,dealer,player;
var socket = io.listen(server);
socket.on('connection', function(client) {

  // Was using same deck, but irritating to run out of cards while testing
  // should probably abstract the whole game out to a separate object
  // Also differentiate between next deal (same deck) and
  // new deal (start or fresh deck)
  client.on('deal', function() {
    // get shuffled deck
    deck = getDeck();

    // set starting cards
    dealer = [deck.pop(),deck.pop()];
    dealer[0].revealed = false;
    player = [deck.pop(),deck.pop()];

    console.log('Dealing!');
    if (handScore(player)===21) console.log('Player won!');
    socket.emit('playerCards',player);
    socket.emit('dealerCards',dealer);
  });

  client.on('hitMe', function() {
    console.log('Player hit!');
    player.push(deck.pop());
    var score = handScore(player);
    if (score>21) {
      console.log('Player lost!');
    }
    if (score===21) {
      console.log('Player won!');
    }
    socket.emit('playerHit',player[player.length-1]);
  });

  client.on('stand', function() {
    console.log('Player stays!');
    var dealerScore = handScore(dealer);
    var playerScore = handScore(player);
    if (dealerScore>playerScore) {
      console.log('Dealer wins!');
    } else {
      while (dealerScore<17) {
        dealer.push(deck.pop());
        socket.emit('dealerHit',dealer[dealer.length-1]);
        dealerScore = handScore(dealer);
      }
      if (dealerScore>21) {
        console.log('Dealer busts!');
      } else if (dealerScore>playerScore) {
        console.log('Dealer wins!');
      } else if (dealerScore<playerScore) {
        console.log('Player wins!');
      } else if (dealerScore===playerScore) {
        console.log('Push!');
      }
    }
    // socket.emit(endgame)
  });
  client.on('disconnect',function() {
    //clearInterval(interval);
    console.log('disconnected');
  });

});
