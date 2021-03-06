/////////////////////////////////////////////////////////////
/////////// Get SETUP information: //////////////////////////
/////////////////////////////////////////////////////////////

//Use os and fs modules:
var os = require('os');
var file = require('fs');

//Get IPaddress of the agent:
var ifaces = os.networkInterfaces();
var myIPaddress = ifaces.eth0[1]["address"];

//Read the NODES.json information:
var dataFile = file.readFileSync("NODES.json");
var dataNodes = JSON.parse(dataFile);

//Get the data of the agent setup:
var neighbor       = dataNodes[myIPaddress]["neighbor"];
var initial_value  = dataNodes[myIPaddress]["initValue"];
var timer_interval = dataNodes[myIPaddress]["timeInterval"];


/////////////////////////////////////////////////////////////
/////////// The Non-Topology Information: ///////////////////
/////////////////////////////////////////////////////////////

//Constants for protocol:
var alpha = 0.5;

//UDP variables and objects:
var udp_port     = 4000;
var udp_datagram = require('dgram');
var udp_client   = udp_datagram.createSocket('udp6');
var udp_server   = udp_datagram.createSocket('udp6');

//Agent's neighbors:
var number_neighbors = neighbor.length;

//For collision strategy:
var index_neighbor_chosen = (number_neighbors-1);
var chosenIPaddress = neighbor[index_neighbor_chosen];

//Agent's state:
var zeta    = initial_value;
var sigma   = [];
var estigma = [];

for (var i = 0; i < number_neighbors; i++){
  sigma[i]   = 0;
  estigma[i] = 0;
}

//Operation mode:
var MODE_ON = 0;            //0: OFF,   1:ON

//Elements for debbuging:
var time_start;
var time;

//To write log file:
var file_name = 'DATA_agent_' + myIPaddress.substring(9) + '.txt';



//****************************************************************************//
//*** Send UDP datagram to Someone *******************************************//
//****************************************************************************//

//Let broadcast transmission:
udp_client.bind( function(){ udp_client.setBroadcast(true) } );

//Set timer interval for Tx data:
setInterval(send_UDPdatagram, timer_interval);

//Each step, send UDP datagram:
function send_UDPdatagram(){

    if(MODE_ON == 1){

        //Define a neighbor to generate a collision (collision strategy):
        index_neighbor_chosen = ((index_neighbor_chosen + 1) % number_neighbors);
        chosenIPaddress = neighbor[index_neighbor_chosen];

        //Send actual state to the neighbor chosen:
        var udp_message_Tx_TimerEvent = new Buffer('1;' + zeta + ';' + sigma[index_neighbor_chosen] + ';' + estigma[index_neighbor_chosen]);
        udp_client.send(
            udp_message_Tx_TimerEvent, 0, udp_message_Tx_TimerEvent.length, udp_port, chosenIPaddress, 
            function(err,bytes){
                if(err){
                    throw err;
                }
            }
        );

        //Console and File print for debugging:
        //console.log('Timer event has occured. Transmssion Event to: ' + chosenIPaddress + '   Message Sent: ' + udp_message_Tx_TimerEvent);
        //console.log(zeta + '   ' + sigma + '   ' + estigma);
        time = (new Date() - time_start);
        console.log(time + ';' + zeta);
        file.appendFile(file_name, time + ";" + zeta + '\n');

    }

}


//****************************************************************************//
//*** Receive UDP datagram from Someone **************************************//
//****************************************************************************//

//Bind server port:
udp_server.bind(udp_port);

//Receive UDP message:
udp_server.on(
    'message',
    function(udp_message_Rx, udp_Rx_info){

        //If external STOP is received, it changes operation mode to OFF:
        if((MODE_ON == 1) && (udp_message_Rx == 'stop')){
            //Change mode:
            MODE_ON = 0;
            //Define the time for debugging:
            time = (new Date() - time_start);
            datalogger_Final();
            //Proccess EXIT:
            process.exit();
        }

        //Receive only if this agent didn't send the datagram and operation mode is ON: (The last condition never happend)
        if((MODE_ON == 1) && (udp_message_Rx != 'start') && (udp_message_Rx != 'stop')){

                //Recognize the agent who sent the message:
                var listenedIPaddress       = udp_Rx_info.address;
                var index_neighbor_listened = neighbor.indexOf(listenedIPaddress);

                //Get states from datagram:
                var string_received = udp_message_Rx.toString();
                var index_reference_1 = string_received.indexOf(";",0);
                var index_reference_2 = string_received.indexOf(";",(index_reference_1+1));
                var index_reference_3 = string_received.indexOf(";",(index_reference_2+1));
                var data_Rx_type    = 1*string_received.substring(0,index_reference_1);
                var data_Rx_zeta    = 1*string_received.substring(index_reference_1+1, index_reference_2);
                var data_Rx_sigma   = 1*string_received.substring(index_reference_2+1, index_reference_3);
                var data_Rx_estigma = 1*string_received.substring(index_reference_3+1);

                //If the message is type 1 (i.e. Rx, Update and Tx):
                if(data_Rx_type == 1){

                    //Manipulated Variable:
                    var zeta_corrected_own = zeta + data_Rx_sigma - estigma[index_neighbor_listened];
                    var zeta_corrected_nei = data_Rx_zeta + sigma[index_neighbor_listened] - data_Rx_estigma;
                    var delta_zeta = alpha*(zeta_corrected_own - zeta_corrected_nei);

                    //Update State:
                    zeta = zeta_corrected_own - delta_zeta;
                    sigma[index_neighbor_listened] = sigma[index_neighbor_listened] + delta_zeta;
                    estigma[index_neighbor_listened] = data_Rx_sigma;

                    //Transmission due to message type 1 was received:
                    var udp_message_Tx_RxEvent = new Buffer('2;' + zeta + ';' + sigma[index_neighbor_listened] + ';' + estigma[index_neighbor_listened]);
                    udp_client.send(
                        udp_message_Tx_RxEvent, 0, udp_message_Tx_RxEvent.length, udp_port, listenedIPaddress, 
                        function(err,bytes){
                            if(err){
                                throw err;
                            }
                        }
                    );

                    //Console and File print for debugging:
                    //console.log('Transmission event has occured to: ' + listenedIPaddress + '. Message Sent: ' + udp_message_Tx_RxEvent);
                    //console.log(zeta + '   ' + sigma + '   ' + estigma);
                    time = (new Date() - time_start);
                    console.log(time + ';' + zeta);
                    file.appendFile(file_name, time + ";" + zeta + '\n');

                }

                //If the message is type 2 (i.e. Rx and Update):
                if(data_Rx_type == 2){

                    //Update State:
                    zeta = zeta + data_Rx_sigma - estigma[index_neighbor_listened];
                    estigma[index_neighbor_listened] = data_Rx_sigma;

                    //Console and File print for debugging:
                    //console.log('Reception event has produced an updated);
                    //console.log(zeta + '   ' + sigma + '   ' + estigma);
                    time = (new Date() - time_start);
                    console.log(time + ';' + zeta);
                    file.appendFile(file_name, time + ";" + zeta + '\n');

                }

        }

        //If external START is received, it changes operation mode to ON:
        if((MODE_ON == 0) && (udp_message_Rx == 'start')){
            //Change mode:
            MODE_ON = 1;
            //Define the time for debugging:
            time_start = new Date();
            time = (new Date() - time_start);
            //Console and File print for debugging:
            datalogger_Initial();
        }

    }
);


//****************************************************************************//
//*** Define auxiliary functions *********************************************//
//****************************************************************************//

function datalogger_Initial(){

    console.log(" ");
    console.log("External Start at: " + time);
    console.log("alpha:" + alpha);
    console.log("timer_interval:" + timer_interval);
    console.log("initial_value:" + initial_value);
    console.log("IP_address:" + myIPaddress);
    console.log("IP_neighbors:");
    for (var i = 0; i < number_neighbors; i++){console.log(neighbor[i]);}
    console.log("FIRST_DATA");
    console.log(time + ';' + zeta);
    file.appendFile(file_name, time + ";" + zeta + '\n');

}


function datalogger_Final(){

    file.appendFile(file_name,"LAST_DATA");
    console.log("LAST_DATA");
    console.log("External Stop at: " + time);
    console.log("alpha:" + alpha);
    console.log("timer_interval:" + timer_interval);
    console.log("initial_value:" + initial_value);
    console.log("IP_address:" + myIPaddress);
    console.log("IP_neighbors:");
    for (var i = 0; i < number_neighbors; i++){console.log(neighbor[i]);}
    console.log(" ");

}


//****************************************************************************//
//*** Initial messages to know if agent is ready *****************************//
//****************************************************************************//

//Initial Print on console and File:
for(var i = 0; i < 100000; i++){};
file.writeFile(file_name,'LOG_FILE:\n');
for(var i = 0; i < 100000; i++){};
file.appendFile(file_name,"alpha:" + alpha + "\n");
file.appendFile(file_name,"timer_interval:" + timer_interval + "\n");
file.appendFile(file_name,"initial_value:" + initial_value + "\n");
file.appendFile(file_name,"IP_address:" + myIPaddress + "\n");
file.appendFile(file_name,"IP_neighbors:" + "\n");
for (var i = 0; i < number_neighbors; i++){file.appendFile(file_name,neighbor[i] + "\n");}
file.appendFile(file_name,'LEGEND:\n');
file.appendFile(file_name,'time[ms];consensus_value\n');
file.appendFile(file_name,"FIRST_DATA\n");

console.log('IPaddress = ' + myIPaddress);
console.log('Neigbors = ' + neighbor);
console.log('initial_value = ' + initial_value);
console.log('timer_interval = ' + timer_interval);
console.log('Waiting ...');
console.log(' ');
