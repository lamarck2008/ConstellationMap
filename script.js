/*
script.js
    javascript functions for constellationMap.html
    
    Requires:
        <script type="text/javascript" src="http://d3js.org/d3.v3.min.js"></script>
        <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js"></script>
*/

/*jslint browser: true, devel: true*/
/*global d3, xScale, yScale, svgObj, w, h, FileReader, menuSet: true, $, brush*/

////////////////////////////////////////////////////////////////////////////////
// Auxilliary functions
////////////////////////////////////////////////////////////////////////////////

function resetClasses(event) {
    "use strict";
    
    svgObj.selectAll("circle").classed("selectedNode", false);
    svgObj.selectAll("circle").classed("geneset", function (d) {
        if (d.x === 0 && d.y === 0) {
            return false;
        } else {
            return true;
        }
    });
    svgObj.selectAll("line").classed("selectedEdge", false);
}

function intersect(a, b) {
    "use strict";
    
    var ai = 0,
        bi = 0,
        result = [];

    while (ai < a.length && bi < b.length) {
        if (a[ai] < b[bi]) {
            ai += 1;
        } else if (a[ai] > b[bi]) {
            bi += 1;
        } else { /* they're equal */
            result.push(a[ai]);
            ai += 1;
            bi += 1;
        }
    }

    return result;
}


function intersect_mult(array2d) {
    "use strict";
    
    var result = array2d[0].sort(),
        i;
    
    for (i = 1; i < array2d.length; i += 1) {
        result = intersect(result, array2d[i].sort());
    }
    
    return result;
}

function union(a, b) {
    "use strict";
    
    var ai = 0,
        bi = 0,
        result = [];

    while (ai < a.length && bi < b.length) {
        if (a[ai] < b[bi]) {
            result.push(a[ai]);
            ai += 1;
        } else if (a[ai] > b[bi]) {
            result.push(b[bi]);
            bi += 1;
        } else { /* they're equal */
            result.push(a[ai]);
            ai += 1;
            bi += 1;
        }
    }

    if (ai === a.length && bi < b.length) {
        result = result.concat(b.slice(bi, b.length));
    } else if (bi === b.length && ai < a.length) {
        result = result.concat(a.slice(ai, a.length));
    }
    return result;
}

function union_mult(array2d) {
    "use strict";
    
    var result = array2d[0].sort(),
        i;
    
    for (i = 1; i < array2d.length; i += 1) {
        result = union(result, array2d[i].sort());
    }
    
    return result;
}

function intersect_fuzzy(array2d, fuzz) {
    "use strict";
    
    var i,
        j,
        arrayLen = array2d.length,
        unionArray,
        numMatch,
        result = [];
    
    if (fuzz < 2 || fuzz > arrayLen || arrayLen === 1) {
        return;
    }
    
    if (arrayLen === 2 || arrayLen === fuzz) {
        result = intersect_mult(array2d);
    } else {
        unionArray = union_mult(array2d);
        for (i = 0; i < unionArray.length; i += 1) {
            numMatch = 0;
            j = 0;
            while (numMatch < fuzz && j < arrayLen) {
                numMatch = numMatch + (array2d[j].indexOf(unionArray[i]) > -1);
                j += 1;
            }
            
            if (numMatch === fuzz) {
                result.push(unionArray[i]);
            }
        }
    }
    
    return result;
}

function unique(array1, array2) {
    "use strict";
    
    var outArray = array1.filter(function (n) {
        return array2.indexOf(n) === -1;
    });
    
    return (outArray);
}

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
            resetClasses();
            menuOff();
        });
    
    menuSet = 0;
}

////////////////////////////////////////////////////////////////////////////////
// Transitions / animations
////////////////////////////////////////////////////////////////////////////////

function selectedNodeTrans(nodeObj) {
    "use strict";
    var nodeClass = nodeObj.attr("class");
    if (nodeClass === "selectedNode") {
        nodeObj.transition()
            .duration(800)
            //.attr("class", "selectedNode")
            .style("fill", "#d65667")
            .each("end", function () {
                nodeObj.transition()
                    .duration(400)
                    //.attr("class", "geneset")
                    .style("fill", "#0a8166")
                    .each("end", function () { selectedNodeTrans(nodeObj); });
            });
    }
}

function selectedEdgeTrans(edgeObj) {
    "use strict";
    var edgeClass = edgeObj.attr("class");
    if (edgeClass === "selectedEdge") {
        edgeObj.transition()
            .duration(800)
            //.attr("class", "selectedNode")
            .style("stroke", "#d65667")
            .each("end", function () {
                edgeObj.transition()
                    .duration(400)
                    //.attr("class", "geneset")
                    .style("stroke", "#334f6d")
                    .each("end", function () { selectedEdgeTrans(edgeObj); });
            });
    }
}

////////////////////////////////////////////////////////////////////////////////
// Functions for brush box
////////////////////////////////////////////////////////////////////////////////

function brushMove(event) {
    "use strict";
    
    resetClasses();
    
    var e = brush.extent(),
        points = svgObj.selectAll(".geneset");
    
    points.classed("selected", function (d) {
        return e[0][0] < xScale(d.x) && xScale(d.x) < e[1][0]
            && e[0][1] < (h - yScale(d.y)) && (h - yScale(d.y)) < e[1][1];
    });
    //points.each(function(d) { d.selected = false; });
}

function brushStop(event) {
    "use strict";
    
    var selectedPts = svgObj.selectAll(".selected").data(),
        i,
        panelObj,
        ptObj,
        outStr = "",
        geneArray = [],
        geneUnion,
        geneIntersect,
        geneIntersectFuzzy,
        outStr2 = "",
        outStr3 = "",
        outStr4 = "";
    
    if (selectedPts.length !== 0) {
        // Show menu
        if (menuSet === 0) {
            menuOn();
        }
        
        // Hide other info panels and reveal multi-selection info panel
        d3.select("#nodeInfo").classed("hidden", true);
        d3.select("#edgeInfo").classed("hidden", true);
        panelObj = d3.select("#selectionInfo");
        panelObj.classed("hidden", false);
        
        // Populate #gsNames with gene set names
        for (i = 0; i < selectedPts.length; i += 1) {
            ptObj = selectedPts[i];
            geneArray[i] = ptObj.MemberGenes;
            if (i === 0) {
                outStr = ptObj["Gene.Set.Name"];
            } else {
                outStr = outStr + "<br/>" + ptObj["Gene.Set.Name"];
            }
        }
        panelObj.select("#gsNames").html(outStr);
        
        if (geneArray.length === 1) {
            geneUnion = geneArray[0].sort();
            geneIntersect = geneArray[0].sort();
            geneIntersectFuzzy = geneArray[0].sort();
        } else {
            geneUnion = union_mult(geneArray);
            geneIntersect = intersect_mult(geneArray);
            geneIntersectFuzzy = intersect_fuzzy(geneArray, 2);
        }
        
        // Populate #gsUnion with genes in union;
        for (i = 0; i < geneUnion.length; i += 1) {
            if (i === 0) {
                outStr2 = geneUnion[i];
            } else {
                outStr2 = outStr2 + "<br/>" + geneUnion[i];
            }
        }
        panelObj.select("#gsUnion").html(outStr2);
        
        // Populate #gsIntersect with genes in intersect
        if (geneIntersect.length === 0) {
            outStr3 = "[Empty]";
        } else {
            for (i = 0; i < geneIntersect.length; i += 1) {
                if (i === 0) {
                    outStr3 = geneIntersect[i];
                } else {
                    outStr3 = outStr3 + "<br/>" + geneIntersect[i];
                }
            }
        }
        panelObj.select("#gsIntersect").html(outStr3);
        
        // Populate #gsIntersectFuzzy with genes in fuzzy intersect
        if (geneIntersectFuzzy.length === 0) {
            outStr4 = "[Empty]";
        } else {
            for (i = 0; i < geneIntersectFuzzy.length; i += 1) {
                if (i === 0) {
                    outStr4 = geneIntersectFuzzy[i];
                } else {
                    outStr4 = outStr4 + "<br/>" + geneIntersectFuzzy[i];
                }
            }
        }
        panelObj.select("#gsIntersectFuzzy").html(outStr4);
    }
}

////////////////////////////////////////////////////////////////////////////////
// Function for parsing nodes.odf
////////////////////////////////////////////////////////////////////////////////

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
        .attr("transform", "translate(" + xScale(0) + "," + (h - yScale(0)) + ")")
        .attr("class", "arc");
    svgObj.append("path")
        .attr("d", arc2)
        .attr("transform", "translate(" + xScale(0) + "," + (h - yScale(0)) + ")")
        .attr("class", "arc");
    svgObj.append("path")
        .attr("d", arc3)
        .attr("transform", "translate(" + xScale(0) + "," + (h - yScale(0)) + ")")
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
            return h - yScale(d.y);
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
            //var xOffset = (window.innerWidth - w) / 2,
            //    yOffset = (window.innerHeight - h) / 2,
            var xOffset = parseInt($("svg.canvas").css("margin-left"), 10),
                yOffset = document.getElementById("svgContainer").getBoundingClientRect().top,
                xPosition = parseFloat(d3.select(this).attr("cx")) + align + xOffset,
                yPosition = parseFloat(d3.select(this).attr("cy")) + align + yOffset;

            d3.select(this).attr("r", selectedRadius);
            //d3.select(this).classed("selectedNode", true);
            
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
            //d3.select(this).classed("selectedNode", false);
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
                k,
                clickedNode,
                dataObj;
            
            // Show menu
            if (menuSet === 0) {
                menuOn();
            }
            
            if (i !== nodelen) {
                // Remove brush
                d3.selectAll(".brush").call(brush.clear());
                
                // Animate node
                svgObj.selectAll("circle").classed("selectedNode", false);
                svgObj.selectAll("circle").classed("selected", false);
                svgObj.selectAll("line").classed("selectedEdge", false);
                clickedNode = d3.select(this);
                clickedNode.attr("class", "selectedNode");
                selectedNodeTrans(clickedNode);
                
                // Populate menu with metadata
                d3.select("#edgeInfo").classed("hidden", true);
                d3.select("#selectionInfo").classed("hidden", true);
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
                
                panelObj.select("#nodeGenes").selectAll("li").remove();
                for (k = 0; k < d.MemberGenes.length; k += 1) {
                    panelObj.select("#nodeGenes")
                        .append("li")
                        .text(d.MemberGenes[k]);
                }
                
                dataObj = d;

                panelObj.select(".msigdbannotation")
                    .on("click", function () {
                        var url = "http://www.broadinstitute.org/gsea/msigdb/annotate.jsp?geneList=";
                        for (k = 0; k < dataObj.MemberGenes.length; k += 1) {
                            url += dataObj.MemberGenes[k];
                            url += ",";
                        }
                        window.open(url);
                    });

                panelObj.select(".davidannotation")
                    .on("click", function () {
                        // currently assume that the ids are gene symbols, need change to the real encoding later
                        var url = "http://david.abcc.ncifcrf.gov/api.jsp?type=OFFICIAL_GENE_SYMBOL&ids=";
                        for (k = 0; k < dataObj.MemberGenes.length; k += 1) {
                            url += dataObj.MemberGenes[k];
                            url += ",";
                        }
                        // hard code the tool as summary
                        url += "&tool=summary";
                        window.open(url);
                    });
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

/*function parseEdges(lines) {
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
}*/

function plotEdges(edges, edgesMeta) {
    "use strict";
    
    var edgeColor = "#334f6d",
        selectedEdgeColor = "#d65667",
        jmin,
        jmax,
        j,
        gsNames,
        gs1,
        gs2;
    
    // find the thickness factor
    jmin = d3.min(edges, function (d) {
        return d.Jaccard;
    });
    jmax = d3.max(edges, function (d) {
        return d.Jaccard;
    });
    
    // Add gene set names and common member genes
    for (j = 0; j < edges.length; j += 1) {
        gsNames = edgesMeta["Gene Set Names"];
        gs1 = gsNames[edges[j].Index1 - 1];
        gs2 = gsNames[edges[j].Index2 - 1];
        edges[j].gs1 = gs1;
        edges[j].gs2 = gs2;
        
        edges[j].gs1Members = edgesMeta[gs1];
        edges[j].gs2Members = edgesMeta[gs2];
        edges[j].gsIntersect = intersect(edges[j].gs1Members.sort(), edges[j].gs2Members.sort());
        
        edges[j].gs1Unique = unique(edges[j].gs1Members, edges[j].gs2Members);
        edges[j].gs2Unique = unique(edges[j].gs2Members, edges[j].gs1Members);
    }
    
    svgObj.selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .attr("x1", function (d) { return xScale(d.x1); })
        .attr("y1", function (d) { return h - yScale(d.y1); })
        .attr("x2", function (d) { return xScale(d.x2); })
        .attr("y2", function (d) { return h - yScale(d.y2); })
        .attr("stroke", edgeColor)
        .attr("stroke-width", function (d) { return (d.Jaccard - jmin) * 5 / (jmax - jmin) + 1;  })
        .on("mouseover", function (d) {
            var xPosition = parseInt($("svg.canvas").css("margin-left"), 10) + w,
                yPosition = document.getElementById("svgContainer").getBoundingClientRect().top,
                genelistObj = d3.select("#genelists"),
                k,
                kmax;
            
            d3.select(this).attr("stroke", selectedEdgeColor);
        
            genelistObj.style("left", xPosition + "px")
                .style("top", yPosition + "px")
                .select("#name1")
                .text(d.gs1);
        
            genelistObj.select("#name2")
                .text(d.gs2);
        
            genelistObj.select("#edgeGenes")
                .selectAll("li")
                .remove();
            if (d.gsIntersect.length < 15) {
                kmax = d.gsIntersect.length;
            } else {
                kmax = 15;
            }
            for (k = 0; k < kmax; k += 1) {
                genelistObj.select("#edgeGenes")
                    .append("li")
                    .text(d.gsIntersect[k]);
            }
            genelistObj.select("#edgeGenes")
                    .append("li")
                    .text("...");
            
            d3.select("#genelists").classed("hidden", false);
        })
        .on("mouseout", function (d) {
            d3.select(this).attr("stroke", edgeColor);
            d3.select("#genelists").classed("hidden", true);
        })
        .on("click", function (d) {
            var panelObj,
                clickedEdge,
                GeneSetName1,
                GeneSetName2,
                k,
                dataObj;
            
            // Show menu
            if (menuSet === 0) {
                menuOn();
            }
            
            // Animate edge
            svgObj.selectAll("line").classed("selectedEdge", false);
            svgObj.selectAll("circle").classed("selectedNode", false);
            clickedEdge = d3.select(this);
            clickedEdge.attr("class", "selectedEdge");
            selectedEdgeTrans(clickedEdge);
        
            // Populate menu with metadata
            d3.select("#nodeInfo").classed("hidden", true);
            GeneSetName1 = d.gs1;
            GeneSetName2 = d.gs2;
            panelObj = d3.select("#edgeInfo");
            panelObj.classed("hidden", false);
            panelObj.select("#textTitle1").select("span")
                .text(GeneSetName1);
            panelObj.select("#textTitle2").select("span")
                .text(GeneSetName2);
            panelObj.select("#Jaccard").select("span")
                .text("Jaccard Index = " + d.Jaccard);
        
            panelObj.select("#commonGenes").selectAll("li").remove();
            for (k = 0; k < d.gsIntersect.length; k += 1) {
                panelObj.select("#commonGenes")
                    .append("li")
                    .text(d.gsIntersect[k]);
            }
        
            dataObj = d;
            
            panelObj.select(".msigdbannotation")
                .on("click", function () {
                    console.log("foo bar");
                    var url = "http://www.broadinstitute.org/gsea/msigdb/annotate.jsp?geneList=";
                    for (k = 0; k < dataObj.gsIntersect.length; k += 1) {
                        url += dataObj.gsIntersect[k];
                        url += ",";
                    }
                    window.open(url);
                });

            panelObj.select(".davidannotation")
                .on("click", function () {
                    // currently assume that the ids are gene symbols, need change to the real encoding later
                    var url = "http://david.abcc.ncifcrf.gov/api.jsp?type=OFFICIAL_GENE_SYMBOL&ids=";
                    for (k = 0; k < dataObj.gsIntersect.length; k += 1) {
                        url += dataObj.gsIntersect[k];
                        url += ",";
                    }
                    // hard code the tool as summary
                    url += "&tool=summary";
                    window.open(url);
                });
        });
}

function edgeLoaded(event) {
    "use strict";
    
    //alert("File Loaded Successfully");
    var lines = event.target.result.split('\n'),
        odfObj = parseODF(lines);
    plotEdges(odfObj.data, odfObj.metadata);
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
    
    svgObj.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.event);
}
