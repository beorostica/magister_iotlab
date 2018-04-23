//Some parameters:
var timeInterval = 2000;
var numberTimes = 5;

//Seting UDP communication:
var udp_datagram  = require('dgram');
var client = udp_datagram.createSocket('udp6');
var udpPort = 4000;

//Getting the IPaddress of the nodes involved:
var fs = require('fs');
var data = fs.readFileSync("NODES.json");
var dataNodes = JSON.parse(data);
var address = dataNodes.ipv6Address;

//****************************************************************************//
//*** Send UDP datagram to Broadcast *****************************************//
//****************************************************************************//


//Send UDP datagram to the agents, each timeInterval [ms], for numberTimes times:
function send_UDPdatagram(){

    //The message:
    var message = new Buffer("start");

    //For each agent:
    for (var index in address) {

        //Send UDP message: 
        client.send(
            message, 0, message.length, udpPort, address[index],
            function(err,bytes){
                if(err){
                    throw err;
                }
            }
        );

        //Console print for debugging:
        console.log('UDP start signal sended to: ' + address[index]);

    }

}

timer = setInterval(send_UDPdatagram, timeInterval);

function stopTimer() {
    clearInterval(timer);
    process.exit();
}

setTimeout(stopTimer, (numberTimes*timeInterval));
