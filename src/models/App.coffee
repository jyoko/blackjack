# TODO: Refactor this model to use an internal Game Model instead
# of containing the game logic directly.
class window.App extends Backbone.Model
  initialize: ->
    #@set 'deck', deck = new Deck()
    #@set 'playerHand', deck.dealPlayer()
    #@set 'dealerHand', deck.dealDealer()

    @socket = window.socket
    @socket.on('playerCards', (data) =>
      @makePlayer(data)
    )
    @socket.on('dealerCards', (data) =>
      @makeDealer(data)
    )
    @socket.on('hitBack', (data) =>
      @get('playerHand').getCard(data)
    )
    @deal()

  makePlayer: (cards) ->
    @get('playerHand').reset(null) if @get('playerHand')?
    @set 'playerHand', new Hand([cards[0],cards[1]])

  makeDealer: (cards) ->
    @get('dealerHand').reset(null) if @get('dealerHand')?
    @set 'dealerHand', new Hand([cards[0],cards[1]],true)
    @trigger 'ready'

  deal: =>
    @socket.emit('deal')
