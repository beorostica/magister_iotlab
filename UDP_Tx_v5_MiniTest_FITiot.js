

var udp_datagram  = require('dgram');
var IP_broadcast = '10.0.15.255';
var client       = udp_datagram.createSocket('udp4');


//****************************************************************************//
//*** Send UDP datagram to Broadcast *****************************************//
//****************************************************************************//

//Let broadcast transmission:
client.bind( 
    function(){ 
        client.setBroadcast(true) 
    } 
);

//Each step, send UDP datagram:
function send_UDPdatagram(){
    
    var message = new Buffer("start");
    
    client.send(
        message, 0, message.length, 4000, IP_broadcast, 
        function(err,bytes){
            if(err){
                throw err;    
            }
        }
    );
    
    //Console print for debugging:
    console.log('UDP message sent: ' + message);

}

setInterval(send_UDPdatagram, 2000);

//****************************************************************************//
