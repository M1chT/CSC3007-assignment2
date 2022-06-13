//1. get the data
// Defining async function
async function getapi() {

	// Storing response
	const response = await fetch("https://data.gov.sg/api/action/datastore_search?resource_id=83c21090-bd19-4b54-ab6b-d999c251edcf");

	// Storing data in form of JSON
	var data = await response.json();
	//console.log(data);
	return data
}
// calculate the total
function calculateTotal(data) {
	compileData = []

	data.forEach((item, i) => {
		let val = item.level_2

		let index = compileData.findIndex(function (item2, i) {
			return item2.case === val
		});

		if (index === -1) {
			compileData.push({
				'case': val,
				'total': parseInt(item.value)
			})
		} else {
			compileData[index]['total'] += parseInt(item.value)
		}
	});

	return compileData
}
/**
 * Darked/Lighten a color -> For hover affect
 * From https://stackoverflow.com/a/13532993/10468888
 */
function shadeColor(color, percent) {

	var R = parseInt(color.substring(1,3),16);
	var G = parseInt(color.substring(3,5),16);
	var B = parseInt(color.substring(5,7),16);

	R = parseInt(R * (100 + percent) / 100);
	G = parseInt(G * (100 + percent) / 100);
	B = parseInt(B * (100 + percent) / 100);

	R = (R<255)?R:255;  
	G = (G<255)?G:255;  
	B = (B<255)?B:255;  

	var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
	var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
	var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

	return "#"+RR+GG+BB;
}

//draw chart function
function drawChart(dataSet, xScale, yScale, chart, height) {

	//define color for bar graph 
	const bar_color = "#CCCCFF"

	// create tooltip element  
	const tooltip = d3.select("body")
		.append("div")
		.attr("class","d3-tooltip")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden")
		.style("padding", "15px")
		.style("background", "rgba(0,0,0,0.6)")
		.style("border-radius", "5px")
		.style("color", "#fff")
		.text("a simple tooltip");
		
	//xScale domain needs to change based on data set
	chart.select("g .axis-x")
		.transition()
		.duration(1000)
		.call(d3.axisBottom(xScale));

	chart.selectAll("rect")
		.data(dataSet)
		.join(
			enter => enter
			.append("rect")
			.attr("x", d => xScale(d.case))
			.attr("y", d => yScale(d.total))
			.attr("fill", bar_color)
			.attr("width", 0)
			.attr("height", 0)
			.attr("class", "svgRect")
			.on("mouseover", function(d, i) {
				tooltip.html(`Total Case: ${i.total}`).style("visibility", "visible");
				d3.select(this)
				  .attr("fill", shadeColor(bar_color, -15));
			  })
			  .on("mousemove", function(){
				tooltip
				  .style("top", (event.pageY-10)+"px")
				  .style("left",(event.pageX+10)+"px");
			  })
			  .on("mouseout", function() {
				tooltip.html(``).style("visibility", "hidden");
				d3.select(this).attr("fill", bar_color);
			  })
			.call(enter => enter.transition()
				.duration(1000)
				.attr("width", xScale.bandwidth())
				.attr("height", d => height - yScale(d.total))
			),
			update => update
			.call(update => update.transition()
				.duration(1000)
				.attr("x", d => xScale(d.case))
				.attr("y", d => yScale(d.total))
				.attr("width", xScale.bandwidth())
				.attr("height", d => height - yScale(d.total))
			),
			exit => exit
			.call(exit => exit.transition()
				.duration(1000)
				.attr("width", 0)
				.attr("height", 0)
				.remove()
			)
		);
}

//2. prepare data for graph
//set margin
getapi().then(data => {
	dataSet = data.result.records
	console.log(dataSet)
	document.getElementsByClassName("chart")[0].style.display = "block";

	let totalData = calculateTotal(dataSet)

	
	let margin = {
			top: 20,
			right: 20,
			bottom: 40,
			left: 40
		},
		width = 960 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;

	let chart = d3.select("#barGraph")
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	

	// Add scales
	let xScale = d3.scaleBand()
		.domain(totalData.map(function (d) {
			return d.case;
		}))
		.rangeRound([0, width])
		.padding(0.1);

	let yScale = d3.scaleLinear()
		.domain([0, Math.max.apply(Math, totalData.map(function (o) {
			return o.total;
		}))])
		.rangeRound([height, 0]);

	// Add x-axis
	chart.append("g")
		.attr("class", "axis axis-x")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(xScale));

	// Add y-axis
	chart.append("g")
		.attr("class", "axis axis-y")
		.call(d3.axisLeft(yScale).ticks(10))

	
	

	drawChart(totalData, xScale, yScale, chart, height)
})