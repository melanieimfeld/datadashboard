var data2 = {
  'nodes': 
    [{"id": "BGE 95 IV 162", "x":"1969-12-5", "y":208.992345},
    {"id": "BGE 80 IV 238", "x":"1969-9-4", "y":208.992345},
    {"id": "BGE 80 IV 240", "x":"1961-9-4", "y":208.992345},
    {"id": "BGE 82 IV 8", "x":"1960-1-3", "y":308.992345}],
  'links': 
    [{"source":'BGE 95 IV 162', "target":'BGE 80 IV 238'},
    {"source":'BGE 95 IV 162', "target":'BGE 80 IV 240'},
    {"source":'BGE 95 IV 162', "target":'BGE 82 IV 8'}]
}
var data3 = {
  'nodes': 
    [{"id": "BGE 95 IV 162", "date":"1969-12-5", "relevancy":10},
    {"id": "BGE 80 IV 238", "date":"1969-9-4", "relevancy":9},
    {"id": "BGE 80 IV 240", "date":"1961-9-4", "relevancy":7},
    {"id": "BGE 82 IV 8", "date":"1960-1-3", "relevancy":4}],
  'links': 
    [{"source":0, "target":1},
    {"source":0, "target":2},
    {"source":0, "target":3}]
}
//https://bl.ocks.org/rsk2327/2ebd7f00d43b492e64eee14f35babeac

// function test() {
//   $.getJSON("./nodes.json", function(json) {
//     console.log(json); // this will show the info it in firebug console
//   });
// }

// test();


// var pyTest= {{ d | safe }};

// console.log("this is data from python", pyTest);
//extract nodes and links
var nodes = data.nodes

//Object.create() creates an object
var links = data.links;
//var links = data.links.map(d => Object.create(d));

//console.log(links, links2);

var degrees = 'outDegree'; 

//console.log("test", links_data);
var margin = {top: 40, right: 50, bottom: 40, left: 20},
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;
//--------------------transforming dates in positions---------------
//The format in the CSV, which d3 will read
var parseDate = d3.timeParse("%Y-%m-%d");
//console.log("parse", parseDate(data2["nodes"][3]))
// Object.keys(data["nodes"]).forEach(function(key, index) {
//     console.log(key, index, data["nodes"][index].x);
//     test = parseDate.parse(data["nodes"][index].x);
//     console.log("date", test);
// });
var startDate = new Date();
var scale  = d3.scaleTime()
  .domain([new Date(2000, 0, 1), new Date(2018, 0, 2)]) //still needs to be made dynamically
  .range([margin.left, width]); //range of x axis will be 1000px

//--------------------x-axis---------------
//https://stackoverflow.com/questions/49785479/force-layout-dragging-objects-are-far-away-from-the-correct-position
var svg = d3.select('svg')
    .attr('width', width + margin.left + margin.right) //size including margin
    .attr('height', height + margin.top + margin.bottom);
  // Add the x Axis
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .attr("class", "axis")
      .call(d3.axisBottom(scale)
        .tickFormat(d3.timeFormat("%Y-%m-%d")))
      .selectAll("text")
        .attr("transform", "rotate(45)")
  // text LABEL for the x axis
  svg.append("text")             
      .attr("transform",
            "translate(" + (width/2) + " ," + 
                           (height-10) + ")")
      .style("text-anchor", "middle")
      .text("Date");

//-------------------toggle buttons----------------
 var areas = ["P","Q", "R"],
    area = "P";
 var body = d3.select("#viz");
         var buttons = body.append("div")
              .attr("class", "buttons-container")
              .selectAll("div").data(areas)
           .enter().append("div")
              .text(function(d) { return d; })
              .attr("class", function(d) {
                   if(d == areas)
                        return "button selected";
                   else
                        return "button";
              });
//-------------------y-axis----------------
var array = Object.values(nodes); //transform object to array
var y = d3.scaleLinear()
  .domain([0,d3.max(array, function(d) {
    //console.log("gimme the degree", d[degrees]);
    return d[degrees]})]) //set max domain dynamically
  .range([height,margin.top])
  // Add the y Axis
  svg.append("g")
      .attr("transform", "translate(" + margin.left + ",0)")
      .attr("class", "axis")
      .call(d3.axisLeft(y)
        .ticks(10)
        );
  //text LABEL for the y axis
  svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y",margin.left+10)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(degrees);   
//--------------------network graph---------------
//set up the simulation 
//nodes only for now 
var simulation = d3.forceSimulation()
          //add nodes
          .nodes(nodes); 
                    
//add forces
//we're going to add a charge to each node 
//also going to add a centering force
simulation
    .force("charge_force", d3.forceManyBody())
    .force("center_force", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX().x(function(d) {
    return scale(parseDate(d.date));
    }))
    .force("y", d3.forceY().y(function(d) {
    return y(d[degrees]);
    }));
//draw circles for the nodes 

//draw lines for the links 
var link = svg.append("g")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .style("stroke", "#E8E8E8")
    .style("stroke-width", 0.5);

var node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr('r', 10)
        .style('fill', function(d){ 
        	if (d.level == 1){
        		return '#8a15ff';
        	} else if (d.level == 2) {
        		return '#0202ff';
        	} else {
        		return '#158aff';
        	}
        })
        .style('opacity', 0.2)
        .on('mouseover', mouseOver)
        .on('mouseout', mouseOut)


//add tick instructions: 
simulation.on("tick", tickActions);
//var link_force =  d3.forceLink(links)
//Add a links force to the simulation
//Specify links  in d3.forceLink argument   

//simulation.force("links",link_force)
simulation.force("link", d3.forceLink(links).id(d => d.id))


var label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .enter().append("text")
      .style("font-size", "12px")
      .style("visibility", "hidden")
      .text(function(d) { return d.id + " Degrees: " + d[degrees]; });  

//-----------------------Hover functionality-------------------

function mouseOver(d){
  const circle = d3.select(this); //selects circle hovered over
  console.log("mouseover", d, "link", link);

  node
    .transition(500)
      .style('opacity', o => {
        //console.log("what is o", o)
        const isConnectedValue = isConnected(o, d);
        if (isConnectedValue) {
          return 1.0; // full opacity
        }
          return 0.2 // not connected: reduced opacity
      });

  circle
    .transition(500)
    .style('opacity', 1.0)
    .attr('r', 20) //expand this specific circle ONLY

  label
      .transition(500)
      .style("visibility", o => {
        const isConnectedValue = isConnected(o, d);
        if (isConnectedValue) {
          return "visible"; // if connected, elements are visible
        }
          return "hidden" // not connected: reduced opacity
      });

  link
    .style('stroke-width', o => (o.source === d || o.target === d ? 1.5 : 0.5))
    .style('stroke', o => (o.source === d || o.target === d ? "#0202ff" : "#E8E8E8"))

} 

function mouseOut() {
  console.log("mouseout");
  const circle = d3.select(this);

  node
    .transition(500)
    .attr('r', 10); //return ALL circle back to original size

  // link
  //   .transition(500);

  circle
    .transition(500)
    .attr('r',10);


}


let linkedByIndex = {};
links.forEach((d) => {
  linkedByIndex[`${d.source.index},${d.target.index}`] = true;
});

function isConnected(a,b){
  //console.log("is linked as source",isConnectedAsSource(a,b), "is linked as target", isConnectedAsTarget(a,b))
  return isConnectedAsSource(a,b) || isConnectedAsTarget(a,b);
}

function isConnectedAsSource(a, b) {
  //console.log()
  return linkedByIndex[`${a.index},${b.index}`];
}

function isConnectedAsTarget(a, b) {
  return linkedByIndex[`${b.index},${a.index}`];
}


///-----------------------zoom capabilities-------------------------
//add zoom capabilities 
var zoom_handler = d3.zoom()
    .on("zoom", zoom_actions);

zoom_handler(svg);

//Zoom functions 
function zoom_actions(){
    svg.attr("transform", d3.event.transform)
}
          
                
function tickActions() {
    //update circle positions each tick of the simulation 
    node
        .attr("cx", function(d) { 
          //console.log("date", d.date)
          return scale(parseDate(d.date)); })
        .attr("cy", function(d) { 
          //console.log(d.relevancy)
          return y(d[degrees]); });

        //  node
        // .attr("cx", function(d) { 
        //   //console.log("date", d.date)
        //   return d.x; })
        // .attr("cy", function(d) { 
        //   //console.log(d.relevancy)
        //   return d.y; });
    
    //update link positions 
    //simply tells one end of the line to follow one node around
    //and the other end of the line to follow the other node around
    link
        .attr("x1", function(d) { 
          //console.log("d.source.date", d.source.date)
          return scale(parseDate(d.source.date)); })
        .attr("y1", function(d) { return y(d['source'][degrees]); })
        .attr("x2", function(d) { return scale(parseDate(d.target.date)); })
        .attr("y2", function(d) { return y(d['target'][degrees]); });
    
    label  
        .attr("x", function(d) { return scale(parseDate(d.date))-20; })
        .attr("y", function (d) { return y(d[degrees])-15; });

        // label
        // .attr("x", function(d) { return d.x; })
        // .attr("y", function (d) { return d.y; })
  }