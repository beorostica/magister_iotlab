//Generate a spaning tree:
var N = 10;          //number nodes
var maxEtrunk = 3;   //maximum number of edges per node of the trunk
var maxEbranch = 4;  //maximum number of edges per node of the branches
var E = 15;	     //number edges, from (N-1) to N(N-1)/2
var graph = {node:[], neighbor:{}};

//Auxiliary funcion to get random integers between an interval:
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    //The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Define the nodes:
for (var i = 0; i < N; i++) {
    graph.node[i] = i;
    graph.neighbor[i] = [];
}

//Generate an spanning tree:
for (var i = 1; i < N; i++) {
    var j = getRandomIntInclusive(0,i-1);
    while (graph.neighbor[j].length >= maxEtrunk) {
        j = getRandomIntInclusive(0,i-1);}
    graph.neighbor[i].push(j);
    graph.neighbor[j].push(i);
}
console.log(graph);

//Add the rest of edges:
for (var k = 0; k < (E-N+1); k++) {
    var i = getRandomIntInclusive(0,N-1);
    while (graph.neighbor[i].length >= maxEbranch) {
        i = getRandomIntInclusive(0,N-1);}
    var j = getRandomIntInclusive(0,N-1);
    while((graph.neighbor[j].length >= maxEbranch)||(i == j)){
        j = getRandomIntInclusive(0,N-1);}
    graph.neighbor[i].push(j);
    graph.neighbor[j].push(i);
}
console.log(graph);




