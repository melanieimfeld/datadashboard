

//console.log("test", links_data);
var margin = {top: 50, right: 30, bottom: 40, left: 30},
    width = 600 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom,
    padding = 1,
    radius = 7;


var nodes = data[0],
  links = data[1],
  query = data[2],
  degrees = "inDegree";


var color = d3.scaleOrdinal(d3.schemeCategory20);

//console.log(data[0]);
//console.log("width", width, "height", height);

//-------------Value translation-----------
var parseDate = d3.timeParse("%Y-%m-%d");
//var minDate = d3.min()

var array = Object.values(nodes);
//console.log("min", d3.min(array, function(d){ return parseDate(d.date)}), "max", d3.max(array, function(d){ return parseDate(d.date)}))

var scale  = d3.scaleTime()
  //.domain([new Date(2000, 0, 1), new Date(2019, 0, 2)]) //still needs to be made dynamically
  .domain([d3.min(array, function(d){ return parseDate(d.date)}), d3.max(array, function(d){ return parseDate(d.date)})])
  .range([margin.left, width]); //range of x axis will be 1000px

console.log(array, nodes);
var yscale = d3.scaleLinear()
  .domain([0,d3.max(array, function(d) {
    //console.log("gimme the degree", d[degrees]);
    return d[degrees]})]) //set max domain dynamically
  .range([height,margin.top])

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
                           (height+50) + ")")
      .style("text-anchor", "middle")
      .text("Date");

//-------------------y-axis----------------
  // Add the y Axis
  svg.append("g")
      .attr("transform", "translate(" + margin.left + ",0)")
      .attr("class", "axis")
      .call(d3.axisLeft(yscale)
        .ticks(1)
        );
  //text LABEL for the y axis
  svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y",margin.left-20)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Number of citations"); 



d3.json("static/cantons4.geojson", function(error, ch) {
  if (error) throw error;

//-------------simulation-------------------
var link_force =  d3.forceLink(links)
                        .id(function(d) { return d.id; });


var simulation = d3.forceSimulation(data[0])
  .force('charge', d3.forceManyBody().strength(5))
  .force('x', d3.forceX().x(function(d){ return scale(parseDate(d.date))}).strength(6))
  //.force('y', d3.forceY().y(function(d) {return height/2;}))
  .force('y', d3.forceY().y(function(d) {return yscale(d[degrees]);}).strength(4))
  .force('collision', d3.forceCollide().radius(function(d) {return (d[degrees]*2+5)+1}))
  .force('link', link_force)
  .on('tick', ticked);


//simulation.force("link", d3.forceLink(links).id(d => d.id))

  function ticked() {
    addLinks();

    var u = d3.select("svg")
    // .attr("transform", "translate(0," + height + ")")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .selectAll('circle')
    .data(nodes)

    u.enter()
    .append("a")
    .attr("target", "_blank")
    .style("cursor", "pointer")
    .attr("xlink:href", function(d){return d.link;})
    .append("circle")
    .attr("r", function(d){
      return d[degrees]*2+5;
    })
    .style("fill", function(d){ return color(d.canton)})
    .style('opacity', 0.5)
    .on('mouseover', mouseOver)
    .on('mouseout', mouseOut)
    .merge(u)
    .attr('cx', function(d) {
      return d.x
    })
    .attr('cy', function(d) {
      return d.y
    })


    //u.exit().remove();

    var node = d3.selectAll('a');
  //console.log("colordomain", color.domain());


  }

  function addLinks() {
    var u = d3.select('svg')
      .selectAll('line')
      .data(links)
  //console.log("links", u);

  u.enter()
    .append('line')
    .merge(u)
    .style("stroke", "#c9c9c9")
    .style("stroke-width", 0.5)
    .attr('x1', function(d) {
      return d.source.x
    })
    .attr('y1', function(d) {
      return d.source.y
    })
    .attr('x2', function(d) {
      return d.target.x
    })
    .attr('y2', function(d) {
      return d.target.y
    })

  //u.exit().remove()
  }


//-----------------------Hover functionality-------------------

function mouseOver(d){
  const circle = d3.select(this); //selects circle hovered over
  //console.log("mouseover", d, "link", link);
  var node = d3.selectAll("circle");
  var link = d3.selectAll("line");
  //simulation.force('collision', d3.forceCollide().radius(function(d) {return (d[degrees]*2+5)+20}))
  //console.log("circle", circle.data()[0].canton);

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

  
  d3.selectAll(".canton").style("fill", function(d){
        //console.log("filtered features in mouse over",d.properties.NAME);
        if(d.properties.NAME == circle.data()[0].canton){
          return color(d.properties.NAME);
        } else{
          return "#c9c9c9";
        }
  });

  //console.log("filtered features in mouse over", filteredFeatures2);


  link
    .style('stroke-width', o => (o.source === d || o.target === d ? 2.5 : 0.5));
  //   //.style('stroke', o => (o.source === d || o.target === d ? "#848383" : "#E8E8E8"))

  $("#stichwort").text(query);
  $("#urteil").text(d.id);
  $("#jahr").text(d.date);
  $("#regeste").text(d.regeste);
  $("#kanton").text(d.canton);
  $("#cit").text(d.inDegree);


} 

function mouseOut() {
  const circle = d3.select(this);
  var node = d3.selectAll("circle");
  simulation.force('collision', d3.forceCollide().radius(function(d) {return (d[degrees]*2+5)+1}))

  node
    .transition(500)
    .attr('r', function(d){ return d[degrees]*2+5}); //return ALL circle back to original size

  // link
  //   .transition(500);

  circle
    .transition(500)
    .attr('r',function(d){ return d[degrees]*2+5});


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
// var zoom_handler = d3.zoom()
//     .on("zoom", zoom_actions);

// zoom_handler(svg);

// //Zoom functions 
// function zoom_actions(){
//     svg.attr("transform", d3.event.transform)
// }

///-----------------------map-------------------------

  var svg2 = d3.select("#map")
    .attr('width', width + margin.left + margin.right) //size including margin
    .attr('height', height + margin.top + margin.bottom);


//-------------------legend----------------

let result = nodes.map(a => a.canton)

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

var colDom = result.filter( onlyUnique ); // returns ['a', 1, 2, '1']
 
  
  var legend = svg2.append("g")
      .selectAll("g")
      .data(colDom)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(" + (width+10)+"," + i * 15 + ")"; });

//--------not visible yet------
  legend
      .append("text")
      .attr("dy", "0.32em")
      .attr("x", -10)
      .attr("y", 5) 
      // .attr("x", width-24)
      // .attr("y", 24)
      .style("text-anchor", "end")
      .text(function(d) { return d});

   legend.append("rect")
      // .attr("x", width/2)
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", color); 

  var g2 = svg2.append("g");
  var offset = [width/2+50, height/2+100];

    //https://d3js.org/us-10m.v1.json
  // d3.json("static/cantons4.geojson", function(error, ch) {
  // if (error) throw error;

  var center = d3.geoCentroid(ch)
  var projection = d3.geoMercator()
    .center(center)
    .scale(7000)
    .translate(offset);;

    var path = d3.geoPath()
    .projection(projection)


   g2.selectAll("path")
      .data(ch.features)
      .enter()
      .append("path")
      .style("fill", "#c9c9c9")
      .style("stroke", "white")
      .attr("class", "canton")
      .attr("d", path)
   
});
