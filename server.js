var mongo = require("mongodb").MongoClient,
    client = require("socket.io").listen(8080).sockets;

mongo.connect('mongodb://127.0.0.1/chat', function(err, db){
    if(err) throw err;
    client.on('connection', function(socket){
        console.log('someone connected');

        var col = db.collection('messages'),
            sendStatus = function(s) { //status check and eventing.
                socket.emit('status', s);
            };

        //Emit all messages when the new client logs into the socket(chat server)
        col.find().limit(100).sort({_id: 1}).toArray(function(err, res){
            if(err) throw err;
            socket.emit('output', res);
        })

        //wait for input //
        socket.on('input', function(data){
            console.log(data);
            var name = data.name,
                message = data.message,
                whitespacePattern = /^\s*$/;

            if(whitespacePattern.test(name) || whitespacePattern.test(message)){
                sendStatus('Name and message is required.')
            } else {
                col.insert({name:name, message:message}, function(){

                    //Emit latest message to ALL clients - when one client types into chat server
                    client.emit('output', [data]); //by using 'client' which is the server itself, data will be emitted to all the individual sockets(users)

                    sendStatus({
                        message: "Message sent",
                        clear: true //defines the 'clearability' of the given data(i.e. text node in textarea.)
                    }); //clear is a flag variable!!!!
            })
            };
        })
    });
});