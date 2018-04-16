var udp_datagram  = require('dgram');
var IP_1 = '2001:660:5307:3000::14';
var IP_2 = '2001:660:5307:3000::78';
var IP_3 = '2001:660:3207:0400::28';
var IP_4 = '2001:660:3207:0400::8c';
var IP_5 = '2001:660:4701:f080::2';
var IP_6 = '2001:660:4701:f080::c';
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
    
    client.send(
        message, 0, message.length, 4000, IP_4, 
        function(err,bytes){
            if(err){
                throw err;    
            }
        }
    );
    
    client.send(
        message, 0, message.length, 4000, IP_5, 
        function(err,bytes){
            if(err){
                throw err;    
            }
        }
    );
    
    client.send(
        message, 0, message.length, 4000, IP_6, 
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
