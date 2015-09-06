window.socket = io.connect('http://localhost:3000')
new AppView(model: new App()).$el.appendTo 'body'
