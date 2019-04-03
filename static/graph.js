
var nodes = data[0];

//Object.create() creates an object
var links = data[1];
var query = data[2];
//var links = data.links.map(d => Object.create(d));

//console.log("updated links", links, "nodes", nodes);
//console.log("updated links", data);

var degrees = 'inDegree'; 

var myScale = d3.scaleLinear()
  .domain([0, 20])
  .range([0, 600]);

var color = d3.scaleOrdinal(d3.schemeCategory20)

//console.log("test", links_data);
var margin = {top: 50, right: 50, bottom: 40, left: 30},
    width = 1200 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom,
    padding = 1,
    radius = 6;
//--------------------transforming dates in positions---------------
//The format in the CSV, which d3 will read
var parseDate = d3.timeParse("%Y-%m-%d");
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
      .style("text-anchor", "start")
      .call(d3.axisBottom(scale)
        .tickFormat(d3.timeFormat("%y-%m-%d")))
      .selectAll("text")
        .attr("transform", "rotate(45)")
  // text LABEL for the x axis
  svg.append("text")             
      .attr("transform",
            "translate(" + (width/2) + " ," + 
                           (height-10) + ")")
      .style("text-anchor", "middle")
      .text("Date");

//-------------------toggle buttons, needed later----------------
var options = ["Täter Geschlecht","Angefechtete Staatsanwaltschaft"];

d3.select("#selectButton")
  .selectAll("myOptions")
  .data(options)
  .enter()
  .append("option")
  .text(function (d) { return d; }) // text showed in the menu
  .attr("value", function (d) { return d; })
  
 d3.select("#selectButton").on("change", update);


function update() {
    var selectedOption = d3.select(this).property("value")
     console.log("hello!", selectedOption);
}

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


 nodes.forEach(function(d) {
    d[degrees] = + d[degrees];
    //console.log(d[yVar]);
  });

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
    .on("tick", tickActions)
    .force("collide", d3.forceCollide(7));
  //   .force('x', d3.forceX().x(function(d) {
  // return scale(parseDate(d.date));}));
 
simulation.force("link", d3.forceLink(links).id(d => d.id))

//draw lines for the links 
var link = svg.append("g")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .style("stroke", "#E8E8E8")
    .style("stroke-width", 0.5);

 // Set initial positions
  nodes.forEach(function(d) {
    d.x = scale(parseDate(d.date));
    d.y = y(d[degrees]);
    d.radius = 7;
  });


var node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("a")
        .attr("target", "_blank")
        .style("cursor", "pointer")
        .attr("xlink:href", function(d){return d.link;})
        .append("circle")    
        .attr('r', 7)
        .attr("cx", function(d) { return scale(parseDate(d.date)); })
        .attr("cy", function(d) { return y(d[degrees]); })
        .style("fill", function(d){ return color(d.canton)})
        .style('opacity', 0.5)
        .on('mouseover', mouseOver)
        .on('mouseout', mouseOut);


//-------------------legend----------------

  var legend = svg.append("g")
      .selectAll("g")
      .data(color.domain())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(" + (width-20)+"," + i * 20 + ")"; });

//--------not visible yet------
  legend
      .append("text")
      .attr("dy", "0.32em")
      .attr("x", -10)
      .attr("y", 5) 
      // .attr("x", width-24)
      // .attr("y", 24)
      .style("text-anchor", "end")
      .text(function(d) { console.log(d); return d});

   legend.append("rect")
      // .attr("x", width/2)
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", color);  
  

//collision detection: http://bl.ocks.org/rpgove/10603627


var label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .enter().append("text")
      .style("font-size", "9px")
      .style("visibility", "hidden")
      .attr("transform", function(d) { return "translate (" + d.x +"," + d.y+ ") rotate(45))"})
      .text(function(d) { return d.id; });  

//label.attr("transform", function(d) { return "rotate(45)"})

//-----------------------Hover functionality-------------------

function mouseOver(d){
  const circle = d3.select(this); //selects circle hovered over
  //console.log("mouseover", d, "link", link);


  node
    .transition(500)
      .style('opacity', o => {
        //console.log("what is o", o)
        const isConnectedValue = isConnected(o, d);
        if (isConnectedValue) {
          return 1.0; // full opacity
        }
          return 0.5 // not connected: reduced opacity
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
    .style('stroke-width', o => (o.source === d || o.target === d ? 2.5 : 0.5));
    //.style('stroke', o => (o.source === d || o.target === d ? "#848383" : "#E8E8E8"))

  $("#stichwort").text(query);
  $("#urteil").text(d.id);
  $("#jahr").text(d.date);
  $("#regeste").text(d.regeste);
  $("#kanton").text(d.canton);
  $("#cit").text(d.inDegree);


} 

function mouseOut() {
  const circle = d3.select(this);

  node
    .transition(500)
    .attr('r', 7); //return ALL circle back to original size

  // link
  //   .transition(500);

  circle
    .transition(500)
    .attr('r',7);


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
          
///-----------------------Update on tick-------------------------              
function tickActions() {
    //update circle positions each tick of the simulation 
    node
        .attr("cx", function(d) { 
          //console.log("date", d.date)
          return scale(parseDate(d.date)); })
        .attr("cy", function(d) { 
          //console.log(d.relevancy)
          return y(d[degrees]); });

    //update link positions 
    //simply tells one end of the line to follow one node around
    //and the other end of the line to follow the other node around
    link
        .attr("x1", function(d) { 
          //console.log("d.source.date", d.source.date)
          return scale(parseDate(d.source.date)); })
        .attr("y1", function(d) { return y(d['source'][degrees]); })
        .attr("x2", function(d) { return scale(parseDate(d.target.date)); })
        .attr("y2", function(d) { return y(d['target'][degrees]); })
        .attr('marker-end','url(#arrowhead)');

    link.attr('d', function (d) {
            return 'M ' + scale(parseDate(d.source.date)) + ' ' + y(d['source'][degrees]) + ' L ' + scale(parseDate(d.target.date)) + ' ' + y(d['target'][degrees]);
        });
    
    label  
        .attr("x", function(d) { return scale(parseDate(d.date))-20; })
        .attr("y", function (d) { return y(d[degrees])-15; });

        // label
        // .attr("x", function(d) { return d.x; })
        // .attr("y", function (d) { return d.y; })
  }


  function tick(d) {
  //console.log(simulation.alpha());

    //node.each(moveTowardDataPosition(simulation.alpha()));

    //node.each(collide(simulation.alpha()));

    //console.log(node);

    node.attr("cx", function(d) { /*console.log(scale(parseDate(d.date)), d.x);*/ return scale(parseDate(d.date)); })
        .attr("cy", function(d) { return d.y; });
  }

    link
        .attr("x1", function(d) { 
          //console.log("d.source.date", d.source.date)
          return scale(parseDate(d.source.date)); })
        .attr("y1", function(d) { return y(d['source'][degrees]); })
        .attr("x2", function(d) { return scale(parseDate(d.target.date)); })
        .attr("y2", function(d) { return y(d['target'][degrees]); });


  function moveTowardDataPosition(alpha) {
    return function(d) {
      d.x += (scale(parseDate(d.date)) - d.x) * 0.1 * alpha;
      d.y += (y(d[degrees]) - d.y) * 0.1 * alpha;
    };
  }

  // Resolve collisions between nodes.
  function collide(alpha) {
    var quadtree = d3.quadtree(nodes);
    //console.log("whats a quadtree", quadtree)
    return function(d) {
      //console.log("that is d here", d);
      var r = 7 + radius + padding,
          nx1 = d.x - r,
          nx2 = d.x + r,
          ny1 = d.y - r,
          ny2 = d.y + r;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        //console.log(quad.point);
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = d.radius + quad.point.radius + (d.color !== quad.point.color) * padding;
          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  }