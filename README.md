# Interactive-employability-chart

This repository contains the development of an interactive web visualisation based on a Sankey diagram, using the D3.js library and its d3-sankey extension

## Setting Up the Environment

To see the Sankey diagram locally, you need to download this project and run by using local server. To run your local server. you need to run following commands.

```
#install http-server globally
npm install -g http-server

#go to the directory of your D3 files
cd /Users/ChiHuang/Documents/d3

#activate the http-server
http-server &
```

You should see link to the local servers now. Go to that link to see the project.

## JSON data format

Data that are used for Sankey Diagram has to be in a JSON format and consist two objects `nodes` and `links`.

`nodes` is an array of objects. The example of data

```
"nodes": [
    {"name": "Node1", "category": "Category1"},
    {"name": "Node2", "category": "Category2"},
    {"name": "Node3", "category": "Category3"},
],
```

In case `category` key is absent it will be counted as data from `name`. `name` field is a necessity.

`links` is an array of objects. The example of data

```
"nodes": [
    {"source":0,"target":1,"value":124},
    {"source":"Node2","target":2,"value":30},
    {"source":"Node1","target":"Node3","value":15},
],
```

All field is necessity. `source` and `target` fields can be referred by a name of the node or an index.

## Integration with an external API

To integrate with an external API put a link of you data at the script.js file at the URL variable

## Result

![alt text](<result.png>) ![alt text](<result1.png>)