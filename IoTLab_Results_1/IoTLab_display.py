#!/usr/bin/python

#Importing modules:
import os
import json
import matplotlib.pyplot as plt

#Declaring some global variables:
timeFinal = 0
boolFirst = True

#Selecting each file in the folder RESULTS:
for fileName in os.listdir("RESULTS/"):

    #Opening a file:
    fp = open('RESULTS/' + fileName, 'r')

    #Declaring de variables time and zeta of the agent:
    time = []
    zeta = []

    #Reading the whole file line by line:
    cnt = 0
    line = fp.readline()
    while line:
        data = line.split(";")
        time.append(float(data[0])/1000)
        zeta.append(float(data[1]))
        line = fp.readline()
        cnt += 1

    #Closing the file:
    fp.close()

    #Saving the plot:
    plt.step(time, zeta)

    #Save the length of the time:
    if boolFirst:
        boolFirst = False
        timeFinal = time[-1]

#Reading NODES.json:
fp = open("NODES.json")
nodesData = json.load(fp)
zetaReal = nodesData["realAverage"]

#Saving the plot of the real average:
plt.step([0, timeFinal],[zetaReal, zetaReal],'k', label='Real Average')
plt.legend()

#Ploting the Results:
#plt.yticks([])
#plt.xticks([])
plt.xlabel('Time (s)')
plt.title('Results France IoTLab. ' + str(len(nodesData["ipv6Address"])) + ' Nodes')
plt.ylabel('Value')
plt.show()
