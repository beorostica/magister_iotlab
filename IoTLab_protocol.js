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
var file_name = 'RESULTS_' + myIPaddress.substring(9) + '.txt';
file.writeFile(file_name,'');

//var dataObject = { dnsLAN : dataNodes[myIPaddress]["dnsLAN"],
//                   siteLAN : dataNodes[myIPaddress]["site"],
//                   idLAN : dataNodes[myIPaddress]["idLAN"],
//                   ipv6PUB : dataNodes[myIPaddress]["ipv6Addr"],
//                   timerInterval : dataNodes[myIPaddress]["timeInterval"],
//                   neighbor : dataNodes[myIPaddress]["neighbor"],
//                   initialValue : dataNodes[myIPaddress]["initValue"],
//                   finalValue : dataNodes[myIPaddress]["initValue"],
//                   alpha : alpha,
//                   legend : ""};

//var legendLine = "time[ms];zeta;";
//for (var i = 0; i < number_neighbors; i++){legendLine = legendLine + "sigma_" + i + ";estigma_" + i + ";";}
//legendLine = legendLine.slice(0,-1) + '\n';
//dataObject.legend = legendLine;


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

        //Write into log file:
        time = (new Date() - time_start);
        dataloggerWriteLine();

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
            //Write into log file:
            time = (new Date() - time_start);
            dataloggerWriteLine();
            //Write the dataObject on a .json file:
            //dataObject.finalValue = zeta;
            //file.writeFile('INFO_' + myIPaddress.substring(9) + '.json', JSON.stringify(dataObject, null, 4));
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

                    //Write into log file:
                    time = (new Date() - time_start);
                    dataloggerWriteLine();

                }

                //If the message is type 2 (i.e. Rx and Update):
                if(data_Rx_type == 2){

                    //Update State:
                    zeta = zeta + data_Rx_sigma - estigma[index_neighbor_listened];
                    estigma[index_neighbor_listened] = data_Rx_sigma;

                    //Write into log file:
                    time = (new Date() - time_start);
                    dataloggerWriteLine();

                }

        }

        //If external START is received, it changes operation mode to ON:
        if((MODE_ON == 0) && (udp_message_Rx == 'start')){
            //Change mode:
            MODE_ON = 1;
            //Define the time for debugging:
            time_start = new Date();
            //Write into log file:
            time = (new Date() - time_start);
            dataloggerWriteLine();
        }

    }
);


//****************************************************************************//
//*** Define auxiliary functions *********************************************//
//****************************************************************************//

function dataloggerWriteLine(){

    var dataLine = time + ";" + zeta + ";";
    for (var i = 0; i < number_neighbors; i++){dataLine = dataLine + sigma[i] + ";" + estigma[i] + ";";}
    dataLine = dataLine.slice(0,-1) + '\n';
    file.appendFile(file_name, dataLine);

}



