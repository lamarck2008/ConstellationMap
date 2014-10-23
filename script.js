/*
script.js
    javascript functions for constellationMap.html
    
    Requires:
        <script type="text/javascript" src="http://d3js.org/d3.v3.min.js"></script>
        <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js"></script>
*/

/*jslint browser: true, devel: true*/
/*global d3, xScale, yScale, svgObj, w, h, FileReader, menuSet: true*/

////////////////////////////////////////////////////////////////////////////////
// Functions for sliding menu with button
////////////////////////////////////////////////////////////////////////////////

function menuOn(event) {
    "use strict";
    
    d3.select("#menuContainer")
        .transition()
        .duration(750)
        .style("right", "0px");
    d3.select("#menuBtnOn")
        .transition()
        .duration(750)
        .style("opacity", "0");
    d3.select("#menuBtnOn")
        .transition()
        .delay(750)
        .attr("class", "hidden");
    d3.select("#menuBtnOff")
        .classed("hidden", false);
    d3.select("#menuBtnOff")
        .transition()
        .duration(750)
        .style("opacity", "1");
}

function menuOff(event) {
    "use strict";

    d3.select("#menuContainer")
        .transition()
        .duration(750)
        .style("right", "-285px");
    d3.select("#menuBtnOff")
        .transition()
        .duration(750)
        .style("opacity", "0");
    d3.select("#menuBtnOff")
        .transition()
        .delay(750)
        .attr("class", "hidden");
    d3.select("#menuBtnOn")
        .classed("hidden", false);
    d3.select("#menuBtnOn")
        .transition()
        .duration(750)
        .style("opacity", "1");
}

function menuTabOn(event) {
    "use strict";
    
    d3.select("#menuBtnOn")
        .on("click", function (d) {
            menuOn();
        });
    
    menuSet = 1;
}

function menuTabOff(event) {
    "use strict";
    
    d3.select("#menuBtnOff")
        .on("click", function (d) {
            menuOff();
        });
    
    menuSet = 0;
}

////////////////////////////////////////////////////////////////////////////////
// Function for parsing nodes.odf
////////////////////////////////////////////////////////////////////////////////

/*function parseNodes(lines) {
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
                var jo = { "Name":geneSets[i-1] };
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
//                nodes[i].Name = data[0];
                nodes[i].X = data[1];
                nodes[i].Y = data[2];
                nodes[i].Size = data[3];
                nodes[i].URL = data[4];
            }
        }
    }
    return nodes;
}*/


function parseODF(lines) {
    "use strict";
    var numHeaderLines = parseInt(lines[1].split('=')[1], 10),
        metadata = {}, // initialize metadata object
        i,
        singleData,
        arrayData,
        dataitems,
        dataLines,
        data,
        j,
        dataRow,
        k,
        colName,
        colType,
        outObject;
    // get metadata
    for (i = 2; i < 2 + numHeaderLines; i += 1) {
        // check if single item or array
        singleData = lines[i].split('=');
        arrayData = lines[i].split(':');
        if (singleData.length === 2) {
            metadata[singleData[0]] = singleData[1];
        }
        if (arrayData.length === 2) {
            dataitems = arrayData[1].split('\t');
            metadata[arrayData[0]] = dataitems;
        }
    }
    
    dataLines = parseInt(metadata.DataLines, 10);
    
    data = []; // initalize data (array of object)
    //data[0] = { "Phenotype":"" }; 
    
    // get data
    for (j = 0; j < dataLines; j += 1) {
        dataRow = lines[j + 2 + numHeaderLines].split('\t');
        data[j] = {};
        
        for (k = 0; k < dataRow.length; k += 1) {
            colName = metadata.COLUMN_NAMES[k];
            colType = metadata.COLUMN_TYPES[k];
            if (colType === "int") {
                data[j][colName] = parseInt(dataRow[k], 10);
            } else if (colType === "double" || colType === "float" || colType === "long") {
                data[j][colName] = parseFloat(dataRow[k]);
            } else if (colType === "boolean") {
                if (dataRow[k] === "true") {
                    data[j][colName] = true;
                } else if (dataRow[k] === "false") {
                    data[j][colName] = false;
                }
            } else {
                data[j][colName] = dataRow[k];
            }
        }
    }
    
    outObject = {"metadata": metadata,
                     "data": data};
    return outObject;
}

////////////////////////////////////////////////////////////////////////////////
// Function for plotting node data
////////////////////////////////////////////////////////////////////////////////

function plotNodes(nodes, nodesMeta) {
    "use strict";
    
    var padding = 100,
        radius = 8,
        selectedRadius = 10,   //the radius when mouse over
        align = 10,
    //var phenColor = "#847985";
    //var nodeColor = "#0a8166";
    // var legendWidth = 100;
        arc1,
        arc2,
        arc3,
        nodelen = nodes.length,
        j;
    
    for (j = 0; j < nodelen; j += 1) {
        nodes[j].MemberGenes = nodesMeta[nodes[j]["Gene.Set.Name"]];
    }
    
    nodes[nodelen] = { "Phenotype": nodesMeta["Target Class"] };
    nodes[nodelen].direction = nodesMeta.Direction;
    nodes[nodelen].x = 0;
    nodes[nodelen].y = 0;

    xScale.domain([d3.min(nodes, function (d) { return (d.x); }),
                                    d3.max(nodes, function (d) { return (d.x); })]);
    xScale.range([ padding, w - padding]);


    yScale.domain([d3.min(nodes, function (d) { return (d.y); }),
                                    d3.max(nodes, function (d) { return (d.y); })]);
    yScale.range([ padding, h - padding]);

    // Plot concentric circle grid
    arc1 = d3.svg.arc()
        .innerRadius(50)
        .outerRadius(52)
        .startAngle(0) //converting from degs to radians
        .endAngle(360 * (Math.PI / 180)); //just radians

    arc2 = d3.svg.arc()
        .innerRadius(150)
        .outerRadius(152)
        .startAngle(0) //converting from degs to radians
        .endAngle(360 * (Math.PI / 180)); //just radians
    arc3 = d3.svg.arc()
        .innerRadius(250)
        .outerRadius(252)
        .startAngle(0) //converting from degs to radians
        .endAngle(360 * (Math.PI / 180)); //just radians
    
    svgObj.append("path")
        .attr("d", arc1)
        .attr("transform", "translate(" + xScale(0) + "," + yScale(0) + ")")
        .attr("class", "arc");
    svgObj.append("path")
        .attr("d", arc2)
        .attr("transform", "translate(" + xScale(0) + "," + yScale(0) + ")")
        .attr("class", "arc");
    svgObj.append("path")
        .attr("d", arc3)
        .attr("transform", "translate(" + xScale(0) + "," + yScale(0) + ")")
        .attr("class", "arc");
    
    // plot nodes
    svgObj.selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            return xScale(d.x);
        })
        .attr("cy", function (d) {
            return yScale(d.y);
        })
        .attr("r", radius)
        .attr("class", function (d, i) {
            if (i === nodelen) {
                return "phen";
            } else {
                return "geneset";
            }
        })
        .on("mouseover", function (d, i) {
            var xOffset = (window.innerWidth - w) / 2,
                yOffset = (window.innerHeight - h) / 2,
                xPosition = parseFloat(d3.select(this).attr("cx")) + align + xOffset,
                yPosition = parseFloat(d3.select(this).attr("cy")) + align + yOffset;

            d3.select(this).attr("r", selectedRadius);
            d3.select(this).classed("selectedNode", true);
            
            if (i === nodelen) {
                d3.select("#phenTooltip")
                    .style("left", xPosition + "px")
                    .style("top", yPosition + "px")
                    .select("#phenotype")
                    .text(d.Phenotype);
                
                d3.select("#phenTooltip")
                    //.style("left", xPosition + "px")
                    //.style("top", yPosition + "px")
                    .select("#direction")
                    .text(d.direction);
                
                d3.select("#phenTooltip").classed("hidden", false);
            } else {
                d3.select("#tooltip")
                    .style("left", xPosition + "px")
                    .style("top", yPosition + "px")
                    .select("#name")
                    .text(d["Gene.Set.Name"]);

                d3.select("#tooltip")
                    //.style("left", xPosition + "px")
                    //.style("top", yPosition + "px")
                    .select("#size")
                    .text(d["gene.set.size"]);

                d3.select("#tooltip")
                    //.style("left", xPosition + "px")
                    //.style("top", yPosition + "px")
                    .select("#url")
                    .text("Placeholder");

                d3.select("#tooltip").classed("hidden", false);
            }
        })
        .on("mouseout", function (d, i) {
            d3.select(this).attr("r", radius);
            d3.select(this).classed("selectedNode", false);
            if (i === nodelen) {
                d3.select("#phenTooltip").select("svg").remove();
                d3.select("#phenTooltip").classed("hidden", true);
            } else {
                d3.select("#tooltip").select("svg").remove();
                d3.select("#tooltip").classed("hidden", true);
            }
        })
        .on("click", function (d, i) {
            var panelObj,
                GeneSetName,
                k;
        
            if (menuSet === 0) {
                menuOn();
            }
            if (i !== nodelen) {
                GeneSetName = d["Gene.Set.Name"];
                panelObj = d3.select("#nodeInfo");
                panelObj.classed("hidden", false);
                panelObj.select("#textTitle").select("span")
                    .text(GeneSetName);
                panelObj.select("#MemberGenes").select("span")
                    .text("Member Genes (" + d["gene.set.size"] + ")");
                panelObj.select("#textURL").select("a")
                    .attr("href", d.url)
                    .attr("target", "_blank");
                // Set coordinates; may not want this
                panelObj.select("#textX").select("span")
                    .text("X: " + d.x);
                panelObj.select("#textY").select("span")
                    .text("Y: " + d.y);
                
                panelObj.select("#ulGenes").selectAll("li").remove();
                for (k = 0; k < d.MemberGenes.length; k += 1) {
                    panelObj.select("#ulGenes")
                        .append("li")
                        .text(d.MemberGenes[k]);
                }
                var dataObj = d;

                panelObj.select("#msigdbannotation")
                        .on("click", function() {
                            var url = "http://www.broadinstitute.org/gsea/msigdb/annotate.jsp?geneList="
                            for (k = 0; k < dataObj.MemberGenes.length; k += 1) {
                                url += dataObj.MemberGenes[k]
                                url += ","
                            }
                            window.open(url);
                        })

                panelObj.select("#davidannotation")
                        .on("click", function() {
                            // currently assume that the ids are gene symbols, need change to the real encoding later
                            var url = "http://david.abcc.ncifcrf.gov/api.jsp?type=OFFICIAL_GENE_SYMBOL&ids="
                            for (k = 0; k < dataObj.MemberGenes.length; k += 1) {
                                url += dataObj.MemberGenes[k]
                                url += ","
                            }
                            // hard code the tool as summary
                            url += "&tool=summary"
                            window.open(url);
                        })
            }
        });

}

function nodeLoaded(event) {
//    alert("File Loaded Successfully");
    "use strict";
    var lines = event.target.result.split('\n'),
        odfObj = parseODF(lines);
    
    plotNodes(odfObj.data, odfObj.metadata);
}

////////////////////////////////////////////////////////////////////////////////
// Functions for parsing edges.odf and plotting dge data
////////////////////////////////////////////////////////////////////////////////	

function parseEdges(lines) {
    "use strict";
    
    var headerLine = 'HeaderLines',
        dataLine = 'DataLines',
        edges = [],
        numOfEdges = 0,
        line,
        data,
        i;

    for (line = 1; line < lines.length; line += 1) {
        data = lines[line];
        numOfEdges = data.split("=")[1];

        if (data.substring(0, dataLine.length) === dataLine) {

            for (i = 0; i < numOfEdges; i += 1) {
                line += 1;
                data = lines[line].split("\t");
                edges[i] = {"Name": "edges" + i};
                edges[i].Start = data[0];
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
    "use strict";
    
    var edgeColor = "#334f6d",
        selectedEdgeColor = "red",
        jmin,
        jmax;
    
    // find the thickness factor
    jmin = d3.min(edges, function (d) {
        return parseFloat(d.jaccard);
    });
    jmax = d3.max(edges, function (d) {
        return parseFloat(d.jaccard);
    });
    
    svgObj.selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .attr("x1", function (d) { return xScale(d.X1); })
        .attr("y1", function (d) { return yScale(d.Y1); })
        .attr("x2", function (d) { return xScale(d.X2); })
        .attr("y2", function (d) { return yScale(d.Y2); })
        .attr("stroke", edgeColor)
        .attr("stroke-width", function (d) { return (d.jaccard - jmin) * 5 / (jmax - jmin) + 1;  })
        .on("mouseover", function (d) {
            d3.select(this).attr("stroke", selectedEdgeColor);
            d3.select("#genelists").classed("hidden", false);
        })
        .on("mouseout", function (d) {
            d3.select(this).attr("stroke", edgeColor);
            d3.select("#genelists").classed("hidden", true);
        });
}

function edgeLoaded(event) {
    "use strict";
    
    //alert("File Loaded Successfully");
    var lines = event.target.result.split('\n'),
        edges = parseEdges(lines);
    plotEdges(edges);
}

////////////////////////////////////////////////////////////////////////////////
// Initial File Readers (wrapper functions)
////////////////////////////////////////////////////////////////////////////////

function getAsText(readFile, fileType) {
    "use strict";
    
    var reader = new FileReader();
    reader.readAsText(readFile, "UTF-8");

    if (fileType === "node") {
        reader.onload = nodeLoaded;
    } else if (fileType === "edge") {
        reader.onload = edgeLoaded;
    }

}

function startReadNodeFile(nodeFile) {
    // wrapper function, called on initial file load
    //var file = document.getElementById('nodeFile').files[0];
    "use strict";
    
    if (nodeFile) {
        // alert("Name: " + file.name + "\n" + "Last Modified Date: " + file.lastModifiedDate); 
        getAsText(nodeFile, "node");
    }
}

function startReadEdgeFile(edgeFile) {
    // wrapper function, called on initial file load
    //var file = document.getElementById('edgeFile').files[0];
    "use strict";
    
    if (edgeFile) {
        // alert("Name: " + file.name + "\n" + "Last Modified Date: " + file.lastModifiedDate); 
        getAsText(edgeFile, "edge");
    }
}

function startPlot(event) {
    "use strict";
    
    // top level wrapper function, calls functions to read Edges and Nodes
    var nodeFile = document.getElementById('nodeFile').files[0],
        edgeFile = document.getElementById('edgeFile').files[0];
    
    if (nodeFile && edgeFile) {
        startReadNodeFile(nodeFile);
        startReadEdgeFile(edgeFile);
    } else {
        if (!nodeFile) {
            alert("No Node file found. Please load an appropriate file.");
        }
        if (!edgeFile) {
            alert("No Edge file found. Please load an appropriate file.");
        }
    }
}

function davidAnnotation(event) {
    var panelObj = d3.select("#nodeInfo");
    var data = panelObj.select("#davidannotation").enter()
    // window.location.href = "http://";
}
