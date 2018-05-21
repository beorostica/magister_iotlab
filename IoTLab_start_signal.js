//Some parameters:
var timeInterval = 2000;        //2[s]
var numberTimes = 5;
var timeBetweenGroups = 30000;	//30[s] (must be divisible by timeInterval in seconds and greater than numberTimes*timeInterval)
var countBetweenGroups = Math.floor(timeBetweenGroups/timeInterval);

//Seting UDP communication:
var udp_datagram  = require('dgram');
var client = udp_datagram.createSocket('udp6');
var udpPort = 4000;

//Getting the IPaddress of the nodes involved:
var fs = require('fs');
var data = fs.readFileSync("NODES.json");
var dataNodes = JSON.parse(data);
var address = dataNodes.ipv6Address;
var numberGroups = dataNodes.numberGroups;


//Getting the groups:
var numberAgentsGroup = Math.ceil(address.length/numberGroups);
var nodeGroup = {};
for (var i = 0; i < numberGroups; i++) {
    if (i == (numberGroups-1)) {
        nodeGroup[i] = address.slice(numberAgentsGroup*i,address.length);
    }else{
        nodeGroup[i] = address.slice(numberAgentsGroup*i,numberAgentsGroup*(i+1));
    }
}


//****************************************************************************//
//*** Send UDP datagram to Broadcast *****************************************//
//****************************************************************************//


//Send UDP datagram to the agents, each timeInterval [ms], for numberTimes times:
function send_UDPdatagram(addressG){

    //The message:
    var message = new Buffer("start");

    //For each agent:
    for (var index in addressG) {

        //Send UDP message:
        client.send(
            message, 0, message.length, udpPort, addressG[index],
            function(err,bytes){if(err){throw err;}}
        );

        //Console print for debugging:
        console.log('UDP start signal sended to: ' + addressG[index]);

    }

}

//Main function that is reapeated every timeInterval [ms]:
var count = 0;
function main_Sender(){
    var subCount = count%countBetweenGroups;
    if((0 <= subCount)&&(subCount < numberTimes)){
        console.log("Send to group " + Math.floor(count/countBetweenGroups));
        send_UDPdatagram(nodeGroup[Math.floor(count/countBetweenGroups)]);
    }
    count = count + 1;
}

timer = setInterval(main_Sender, timeInterval);

function stopTimer() {
    clearInterval(timer);
    process.exit();
}

setTimeout(stopTimer, (((countBetweenGoups*numberTimes)-1)*timeInterval));
