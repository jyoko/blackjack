var http = require('http');
var io = require('socket.io');
var fs = require('fs');
var DIR = __dirname+'/..';
var PORT = 3000;

// basic shuffle function
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

// expose mostly everything for easy access (only available to localhost ATM)
function handleReq(req,res) {
  var filePath = DIR+req.url;
  if (filePath===DIR+'/') {
    filePath+='index.html';
  };
  fs.readFile(filePath, function(err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var server = http.createServer(handleReq);
server.listen(PORT);

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

// make deck of cards!
var getDeck = function() {
  var deck = [];
  var card = {};
  for (var i=0;i<52;i++) {
    card.value = i;
    card.rank = i%13;
    card.suit = (i/13)|0;
    deck.push(makeCard(card));
  }
  return shuffle(deck);
}
var deck,dealer,player;

// get blackjack scores
var handScore = function(cards) {
  var hasAce = 0;
  var score = cards.reduce(function(score,card) {
    if (card.rank===1) hasAce=1;
    return score + ((card.rank>10)?10:card.rank);
  },0);
  return [score,score+(10*hasAce)];
};

var socket = io.listen(server);

socket.on('connection', function(client) {

  client.on('deal', function() {
    // get shuffled deck
    deck = getDeck();

    // set starting cards
    dealer = [deck.pop(),deck.pop()];
    dealer[0].revealed = false;
    player = [deck.pop(),deck.pop()];

    console.log('Dealing!');
    socket.emit('playerCards',player);
    socket.emit('dealerCards',dealer);
  });

  client.on('hitMe', function() {
    console.log('Player hit!');
    player.push(deck.pop());
    var scores = handScore(player);
    var score = (scores[1]<22)?scores[1]:scores[0];
    console.log(score);
    if (score>21) {
      console.log('Player lost!');
    }
    if (score===21) {
      console.log('Player won!');
    }
    socket.emit('hitBack',player[player.length-1]);
  });

  client.on('stand', function() {
    // implement this
  });
  client.on('disconnect',function() {
    //clearInterval(interval);
    console.log('disconnected');
  });

});
