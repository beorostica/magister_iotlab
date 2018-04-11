var udp_datagram  = require('dgram');
var IP_1 = '2001:660:5307:3000::5f';
var IP_2 = '2001:660:5307:3000::60';
var IP_3 = '2001:660:5307:3000::64';
var client       = udp_datagram.createSocket('udp6');


//****************************************************************************//
//*** Send UDP datagram to Broadcast *****************************************//
//****************************************************************************//


//Each step, send UDP datagram:
function send_UDPdatagram(){
    
    var message = new Buffer("start");
    
    client.send(
        message, 0, message.length, 4000, IP_1, 
        function(err,bytes){
            if(err){
                throw err;    
            }
        }
    );
    
    client.send(
        message, 0, message.length, 4000, IP_2, 
        function(err,bytes){
            if(err){
                throw err;    
            }
        }
    );
    
    client.send(
        message, 0, message.length, 4000, IP_3, 
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
