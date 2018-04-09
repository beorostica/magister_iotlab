var udp_datagram = require('dgram');
var server       = udp_datagram.createSocket('udp4');

var port = 4000;
server.bind(port);

server.on(
    'message', 
    function(message){
        console.log('UDP message received: ' + message);        
    }
);