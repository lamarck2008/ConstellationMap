/*
script.js
Requires:
    <script type="text/javascript" src="http://d3js.org/d3.v3.min.js"></script>
	<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js"></script>
*/

function startReadNodeFile(event) {
    var file = document.getElementById('nodeFile').files[0];
    if (file) {
        // alert("Name: " + file.name + "\n" + "Last Modified Date: " + file.lastModifiedDate); 
        getAsText(file, "node");
    }
}

function getAsText(readFile, fileType) {
    var reader = new FileReader();
    reader.readAsText(readFile, "UTF-8");

    if (fileType == "node") {
        reader.onload = nodeLoaded;
    } else if (fileType == "edge") {
        reader.onload = edgeLoaded;
    }

}

function parseNodes(lines) {
    var headerLine = 'HeaderLines';
    var dataLine = 'DataLines';
    var gsNames = "Gene Set Names:";
    var nodes = [];
    var numOfGs = 0;

    nodes[0] = { "Name":"Phenotype" };
    nodes[0].X = 0;
    nodes[0].Y = 0;
    nodes[0].Size = "NA";
    nodes[0].URL = "NA";

    for(var line = 0; line < lines.length; line++) {
        var data = lines[line];
        if (data.substring(0, gsNames.length) == gsNames) {
            var geneSets = data.split(':')[1];
            geneSets = geneSets.split('\t');
            numOfGs = geneSets.length;
            for(var i = 1; i <= numOfGs; i++) {
                var jo = { "Name":geneSets[i] };
                nodes[i] = jo;
            }


            for(var i = 1; i <= numOfGs; i++) {
                line++;
                var data = lines[line];
                data = data.split(":")[1];
                var genes = data.split("\t");
                nodes[i].genes = genes;
            }
        }

        if (data.substring(0, dataLine.length) == dataLine) {

            for(var i = 1; i <= numOfGs; i++) {
                line++;
                data = lines[line].split("\t");
                nodes[i].X = data[1];
                nodes[i].Y = data[2];
                nodes[i].Size = data[3];
                nodes[i].URL = data[4];
            }
        }
    }
    return nodes;
}

function plotNodes(nodes) {
    var padding = 100;
    var radius = 8;
    var selectedRadius = 10;   //the radius when mouse over
    var align = 10;
    // var legendWidth = 100;
    xScale.domain([d3.min(nodes, function(d) {return parseFloat(d.X);}),
                                    d3.max(nodes, function(d) {return parseFloat(d.X) ;})]);
    xScale.range([ padding, w - padding]);


    yScale.domain([d3.min(nodes, function(d) {return parseFloat(d.Y); }),
                                    d3.max(nodes, function(d) {return parseFloat(d.Y) ;})]);
    yScale.range([ padding, h - padding]);  

    svg.selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return xScale(d.X);
        })
        .attr("cy", function(d) {
            return yScale(d.Y);
        })
        .attr("r", radius)
        .attr("fill", function(d, i) {
            if (i == 0) {
                return "red";
            } else {
                return "blue";
            }
        })
        .on("mouseover", function(d) {
            var xOffset = (window.innerWidth - w) / 2;
            var yOffset = (window.innerHeight - h) / 2;
            var xPosition = parseFloat(d3.select(this).attr("cx")) + align + xOffset;
            var yPosition = parseFloat(d3.select(this).attr("cy")) + align + yOffset;

            d3.select(this).attr("r", selectedRadius);

            d3.select("#tooltip")
                .style("left", xPosition + "px")
                .style("top", yPosition + "px")
                .select("#name")
                .text(d.Name);

            d3.select("#tooltip")
                .style("left", xPosition + "px")
                .style("top", yPosition + "px")
                .select("#size")
                .text(d.Size);

            d3.select("#tooltip")
                .style("left", xPosition + "px")
                .style("top", yPosition + "px")
                .select("#url")
                .text("Placeholder");

            d3.select("#tooltip").classed("hidden", false);
        })
        .on("mouseout", function(d) {
            d3.select(this).attr("r", radius);
            d3.select("#tooltip").select("svg").remove();
            d3.select("#tooltip").classed("hidden", true);
        });

        var arc1 = d3.svg.arc()
            .innerRadius(50)
            .outerRadius(52)
            .startAngle(0 * (Math.PI/180)) //converting from degs to radians
            .endAngle(360 * (Math.PI/180)) //just radians

        var arc2 = d3.svg.arc()
            .innerRadius(150)
            .outerRadius(152)
            .startAngle(0 * (Math.PI/180)) //converting from degs to radians
            .endAngle(360 * (Math.PI/180)) //just radians
        var arc3 = d3.svg.arc()
            .innerRadius(250)
            .outerRadius(252)
            .startAngle(0 * (Math.PI/180)) //converting from degs to radians
            .endAngle(360 * (Math.PI/180)) //just radians

        svg.append("path")
            .attr("d", arc1)
            .attr("transform", "translate("+xScale(0) + "," + yScale(0) +")");
        svg.append("path")
            .attr("d", arc2)
            .attr("transform", "translate("+xScale(0) + "," + yScale(0) +")");
        svg.append("path")
            .attr("d", arc3)
            .attr("transform", "translate("+xScale(0) + "," + yScale(0) +")");
}

function nodeLoaded(event) {
    alert("File Loaded Successfully");
    var lines = this.result.split('\n');

    var nodes = parseNodes(lines);
    plotNodes(nodes);
}	


function startReadEdgeFile(event) {
    var file = document.getElementById('edgeFile').files[0];
    if (file) {
        // alert("Name: " + file.name + "\n" + "Last Modified Date: " + file.lastModifiedDate); 
        getAsText(file, "edge");
    }
}

function parseEdges(lines) {
    var headerLine = 'HeaderLines';
    var dataLine = 'DataLines';
    var edges = [];
    var numOfEdges = 0;

    for(var line = 1; line < lines.length; line++) {
        var data = lines[line];
        numOfEdges = data.split("=")[1];

        if (data.substring(0, dataLine.length) == dataLine) {

            for(var i = 0; i < numOfEdges; i++) {
                line++;
                data = lines[line].split("\t");
                console.log(data);
                edges[i] = {"Name":"edges" + i};
                edges[i].Start = data[0]
                edges[i].X1 = data[1];
                edges[i].Y1 = data[2];
                edges[i].End = data[3];
                edges[i].X2 = data[4];
                edges[i].Y2 = data[5];
                edges[i].jaccard = data[6];
            }
        }
    }
    return edges;
}

function plotEdges(edges) {

    // find the thickness factor
    var jmin = d3.min(edges, function(d){
        return parseFloat(d.jaccard);
    });
    var jmax = d3.max(edges, function(d){
        return parseFloat(d.jaccard);
    });

    svg.selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .attr("x1", function(d) { return xScale(d.X1); })
        .attr("y1", function(d) { return yScale(d.Y1); })
        .attr("x2", function(d) { return xScale(d.X2); })
        .attr("y2", function(d) { return yScale(d.Y2); })
        .attr("stroke", "green")
        .attr("stroke-width", function(d) { return (d.jaccard - jmin)*5 / (jmax - jmin) + 1;  } )
        .on("mouseover", function(d) {
            d3.select(this).attr("stroke", "red");
            d3.select("#genelists").classed("hidden", false);
        })
        .on("mouseout", function(d) {
            d3.select(this).attr("stroke", "green");
            d3.select("#genelists").classed("hidden", true);
        });
}

function edgeLoaded(event) {
    alert("File Loaded Successfully");
    var lines = this.result.split('\n');

    var edges = parseEdges(lines);
    plotEdges(edges);
}