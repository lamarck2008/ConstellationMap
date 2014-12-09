/*
script.js
    javascript functions for constellationMap.html
    
    Requires:
        <script type="text/javascript" src="http://d3js.org/d3.v3.min.js"></script>
        <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js"></script>
*/

/*jslint browser: true, devel: true*/
/*global d3, xScale, yScale, svgObj, w, h, FileReader, menuSet: true, $, brush*/

// HEY, note that all lines that have been commented for the reboot have been labeled "COMMENT"

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
} // END resetClasses

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
} // END intersect

function intersect_mult(array2d) {
    "use strict";
    
    var result = array2d[0].sort(),
        i;
    
    for (i = 1; i < array2d.length; i += 1) {
        result = intersect(result, array2d[i].sort());
    }
    
    return result;
} // END intersect_mult

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
} // END union

function union_mult(array2d) {
    "use strict";
    
    var result = array2d[0].sort(),
        i;
    
    for (i = 1; i < array2d.length; i += 1) {
        result = union(result, array2d[i].sort());
    }
    
    return result;
} // END union_mult

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
} // END intersect_fuzzy

function unique(array1, array2) {
    "use strict";
    
    var outArray = array1.filter(function (n) {
        return array2.indexOf(n) === -1;
    });
    
    return (outArray);
} // END unique

function queryMsigdb(genelist) {
    "use strict";
    var k,
        url;
    
    url = "http://www.broadinstitute.org/gsea/msigdb/annotate.jsp?geneList=";
    for (k = 0; k < genelist.length; k += 1) {
        url += genelist[k];
        url += ",";
    }
    window.open(url);
} // END queryMsigdb

function queryDavid(genelist) {
    "use strict";
    var k,
        url;
    // currently assume that the ids are gene symbols, need change to the real encoding later
    url = "http://david.abcc.ncifcrf.gov/api.jsp?type=OFFICIAL_GENE_SYMBOL&ids=";
    for (k = 0; k < genelist.length; k += 1) {
        url += genelist[k];
        url += ",";
    }
    // hard code the tool as summary
    url += "&tool=summary";
    window.open(url);
} // END queryDavid

function metadataRemove(event) {
    "use strict";
    if (typeof event === "undefined") {
        d3.select("#tableOne").select("tbody").selectAll("tr").remove();
        d3.select("#tableTwo").select("tbody").selectAll("tr").remove();
    } else if (event === 1) {
        d3.select("#tableOne").select("tbody").selectAll("tr").remove();
    } else if (event === 2) {
        d3.select("#tableTwo").select("tbody").selectAll("tr").remove();
    }
} // END metadataRemove

function unhideInfo(event) {
    "use strict";
    // Unhide live text, tables, and buttons
    d3.selectAll(".liveText").classed("hidden", false);
    d3.selectAll(".infoTable").classed("hidden", false);
    d3.selectAll(".infoButton").classed("hidden", false);
    
    // Hide default text
    d3.selectAll(".defaultText").classed("hidden", true);
} // END unhideInfo

function round(value, n) {
    // Round <value> to <n> decimal places
    "use strict";
    var p,
        result;
    
    p = Math.pow(10, n);
    result = Math.round(value * p) / p;
    
    return result;
} // END round

////////////////////////////////////////////////////////////////////////////////
// Functions for brush box
////////////////////////////////////////////////////////////////////////////////

function brushMove(event) {
    "use strict";
    
    resetClasses();
    
    var e = brush.extent(),
        points = svgObj.selectAll(".geneset");
    
    points.classed("selectedNode", function (d) {
        return e[0][0] < xScale(d.x) && xScale(d.x) < e[1][0]
            && e[0][1] < (h - yScale(d.y)) && (h - yScale(d.y)) < e[1][1];
    });
    //points.each(function(d) { d.selected = false; });
}

function brushStop(event) {
    "use strict";
    
    var selectedPts = svgObj.selectAll(".selectedNode").data(),
        i,
        tableOneObj,
        tableTwoObj,
        tableThreeObj,
        tableRowObj,
        panelObj,
        ptObj,
        geneArray = [],
        geneUnion,
        geneIntersect;
    
    if (selectedPts.length !== 0) {
        
        // Unhide tables as well as intersect/union form, hide default text
        unhideInfo();
        d3.select(".miniForm").classed("hidden", false);

        // Remove previous metadata in panels
        metadataRemove();
        
        // Populate panel with metadata
        // 1. Gene Set Name(s)
        d3.select("#liveTextOne")
            .text(selectedPts.length + " gene set(s) selected."); // live text
        tableOneObj = d3.select("#tableOne");
        for (i = 0; i < selectedPts.length; i += 1) {
            ptObj = selectedPts[i];
            geneArray[i] = ptObj.MemberGenes;
            
            tableRowObj = tableOneObj.select("tbody").append("tr");
            tableRowObj.append("td").append("a")
                .attr("href", ptObj.url)
                .attr("target", "_blank")
                .text(ptObj["Gene.Set.Name"]);
            tableRowObj.append("td")
                .text(ptObj["gene.set.size"]);
            tableRowObj.append("td")
                .text("(" + round(ptObj.x, 3) + "," + round(ptObj.y, 3) + ")");
        }
        
        // Calculate union, intersect
        if (geneArray.length === 1) {
            geneIntersect = geneArray[0].sort();
            geneUnion = geneArray[0].sort();
        } else {
            geneIntersect = intersect_mult(geneArray);
            geneUnion = union_mult(geneArray);
        }
        
        // 2. Member Genes
        //// Default: intersect (all)
        d3.select("#liveTextTwo")
            .text(geneIntersect.length + " genes shown. " + geneUnion.length + " unique genes in selected geneset(s)"); // live text
        $("#fuzzFactor").val(selectedPts.length); // set intersect fuzz factor to # selected genesets
        $("#fuzzFactor").prop("disabled", false); // enable fuzz factor
        $("#uniInt").val("Intersect"); // set uniInt to intersect
        tableTwoObj = d3.select("#tableTwo");
        if (geneIntersect.length === 0) {
            tableTwoObj.select("tbody").append("tr")
                .append("td")
                .text("No genes in intersect");
        } else {
            for (i = 0; i < geneIntersect.length; i += 1) {
                tableTwoObj.select("tbody").append("tr")
                    .append("td")
                    .text(geneIntersect[i]);
            }
        }
        // 3. Annotation
        d3.select(".msigdbannotation")
            .on("click", function () {
                queryMsigdb(geneIntersect);
            });

        d3.select(".davidannotation")
            .on("click", function () {
                queryDavid(geneIntersect);
            });
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
            var tableOneObj,
                tableTwoObj,
                GeneSetName,
                k,
                clickedNode,
                dataObj;
            
            if (i !== nodelen) {
                // Remove brush
                d3.selectAll(".brush").call(brush.clear());
                
                // Highlight node
                svgObj.selectAll("circle").classed("selectedNode", false);
                svgObj.selectAll("circle").classed("selected", false);
                svgObj.selectAll("line").classed("selectedEdge", false);
                clickedNode = d3.select(this);
                clickedNode.classed("selectedNode", true);
                
                // Unhide tables, hide default text and 
                unhideInfo();
                d3.selectAll(".miniForm").classed("hidden", true);
                
                // Remove previous metadata in panels
                metadataRemove();
                
                // Populate panel with metadata
                // 1. Gene Set Name(s)
                d3.select("#liveTextOne")
                    .text("1 gene set selected."); // live text
                GeneSetName = d["Gene.Set.Name"];
                tableOneObj = d3.select("#tableOne");
                tableOneObj.select("tbody").append("tr").append("td").append("a")
                    .attr("href", d.url)
                    .attr("target", "_blank")
                    .text(GeneSetName);
                tableOneObj.select("tbody").select("tr").append("td")
                    .text(d["gene.set.size"]);
                tableOneObj.select("tbody").select("tr").append("td")
                    .text("(" + round(d.x, 3) + "," + round(d.y, 3) + ")");
                
                // 2. Member Genes
                d3.select("#liveTextTwo")
                    .text(d["gene.set.size"] + " genes shown. " + d["gene.set.size"] + " unique genes in selected geneset(s)."); // live text
                tableTwoObj = d3.select("#tableTwo");
                for (k = 0; k < d.MemberGenes.length; k += 1) {
                    tableTwoObj.select("tbody").append("tr")
                        .append("td")
                        .text(d.MemberGenes[k]);
                }
                
                dataObj = d;
                
                // 3. Annotation
                d3.select(".msigdbannotation")
                    .on("click", function () {
                        queryMsigdb(dataObj.MemberGenes);
                    });

                d3.select(".davidannotation")
                    .on("click", function () {
                        queryDavid(dataObj.MemberGenes);
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

function plotEdges(edges, edgesMeta) {
    "use strict";
    
    var edgeColor = "#C4BB9C",
        selectedEdgeColor = "#ca0020",
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
        edges[j].gsUnion = union(edges[j].gs1Members.sort(), edges[j].gs2Members.sort());
        
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
            var tableOneObj,
                tableTwoObj,
                tableThreeObj,
                tableRowObj,
                clickedEdge,
                GeneSetNames,
                numGenes,
                xcoord,
                ycoord,
                k,
                dataObj;
            
            // Remove brush
            d3.selectAll(".brush").call(brush.clear());
        
            // Highlight edge
            svgObj.selectAll("line").classed("selectedEdge", false);
            svgObj.selectAll("circle").classed("selectedNode", false);
            clickedEdge = d3.select(this);
            clickedEdge.classed("selectedEdge", true);
            
            // Unhide tables, hide default text and miniForm
            unhideInfo();
            d3.selectAll(".miniForm").classed("hidden", true); // COMMENT

            // Remove previous metadata in panels
            metadataRemove();
        
            // Populate panel with metadata
            // 1. Gene Set Name(s)
            d3.select("#liveTextOne")
                .text("1 edge selected (2 gene sets). Jaccard = " + round(d.Jaccard, 3)); // live text
            GeneSetNames = [d.gs1, d.gs2];
            numGenes = [d.gs1Members.length, d.gs2Members.length];
            xcoord = [d.x1, d.x2];
            ycoord = [d.y1, d.y2];
            tableOneObj = d3.select("#tableOne");
            for (k = 0; k < GeneSetNames.length; k += 1) {
                tableRowObj = tableOneObj.select("tbody").append("tr");
                tableRowObj.append("td").append("a")
                    .attr("href", d.url)
                    .attr("target", "_blank")
                    .text(GeneSetNames[k]);
                tableRowObj.append("td")
                    .text(numGenes[k]);
                tableRowObj.append("td")
                    .text("(" + round(xcoord[k], 3) + "," + round(ycoord[k], 3) + ")");
            }

            // 2. Member Genes
            d3.select("#liveTextTwo")
                .text(d.gsIntersect.length + " genes shown. " + d.gsUnion.length + " unique genes in selected geneset(s)."); // live text
            tableTwoObj = d3.select("#tableTwo");
            for (k = 0; k < d.gsIntersect.length; k += 1) {
                tableTwoObj.select("tbody").append("tr")
                    .append("td")
                    .text(d.gsIntersect[k]);
            }

            dataObj = d;
            
            // 3. Annotation
            d3.select(".msigdbannotation")
                .on("click", function () {
                    queryMsigdb(dataObj.gsIntersect);
                });

            d3.select(".davidannotation")
                .on("click", function () {
                    queryDavid(dataObj.gsIntersect);
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

////////////////////////////////////////////////////////////////////////////////
// jQuery ($) functions
////////////////////////////////////////////////////////////////////////////////

// Function to handle #intUni <select>or changes
$(document).on('change', '#uniInt', function () {
    "use strict";
    var selectedPts = svgObj.selectAll(".selectedNode").data(),
        i,
        geneArray = [],
        geneUnion,
        geneIntersect,
        tableTwoObj;
    
    for (i = 0; i < selectedPts.length; i += 1) {
        geneArray[i] = selectedPts[i].MemberGenes;
    }
    geneUnion = union_mult(geneArray);
    
    if (document.getElementById("uniInt").value === "Union") {
        // Disable fuzz factor fields
        $("#fuzzFactor").val(null);
        $("#fuzzFactor").prop("disabled", true);
        d3.select("#fuzzWarning").classed("hidden", true); // remove warning
        
        // Remove "Member Genes" metadata
        metadataRemove(2);
        
        // Display union
        // 2. Member Genes
        d3.select("#liveTextTwo")
            .text(geneUnion.length + " genes shown. " + geneUnion.length + " unique genes in selected geneset(s)"); // live text
        tableTwoObj = d3.select("#tableTwo");
        for (i = 0; i < geneUnion.length; i += 1) {
            tableTwoObj.select("tbody").append("tr")
                .append("td")
                .text(geneUnion[i]);
        }
        
        // 3. Annotation
        d3.select(".msigdbannotation")
            .on("click", function () {
                queryMsigdb(geneUnion);
            });

        d3.select(".davidannotation")
            .on("click", function () {
                queryDavid(geneUnion);
            });
    } else { // === "Intersect"
        // Enable fuzz factor fields
        $("#fuzzFactor").val(selectedPts.length);
        $("#fuzzFactor").prop("disabled", false);
        
        // Remove "Member Genes" metadata
        metadataRemove(2);
        
        // Display intersect
        geneIntersect = intersect_mult(geneArray);
        // 2. Member Genes
        d3.select("#liveTextTwo")
            .text(geneIntersect.length + " genes shown. " + geneUnion.length + " unique genes in selected geneset(s)"); // live text
        tableTwoObj = d3.select("#tableTwo");
        for (i = 0; i < geneIntersect.length; i += 1) {
            tableTwoObj.select("tbody").append("tr")
                .append("td")
                .text(geneIntersect[i]);
        }
        
        // 3. Annotation
        d3.select(".msigdbannotation")
            .on("click", function () {
                queryMsigdb(geneIntersect);
            });

        d3.select(".davidannotation")
            .on("click", function () {
                queryDavid(geneIntersect);
            });
    }
});

// Function to handle fuzzy intersection calls
$(document).on('change', '#fuzzFactor', function () {
    "use strict";
    var selectedPts = svgObj.selectAll(".selectedNode").data(),
        i,
        fuzz = parseInt(document.getElementById("fuzzFactor").value, 10),
        geneArray = [],
        geneUnion,
        geneIntersectFuzzy,
        tableTwoObj;
    
    if (fuzz < 2) {
        // unhide warning
        d3.select("#fuzzWarning").classed("hidden", false);
        d3.select("#fuzzWarningText").text("Warning! Cannot intersect fewer than 2 gene sets.");
    } else if (fuzz > selectedPts.length) {
        // unhide warning
        d3.select("#fuzzWarning").classed("hidden", false);
        d3.select("#fuzzWarningText").text("Warning! Cannot intersect more gene sets than number selected (" + selectedPts.length + ").");
    } else {
        // hide warning
        d3.select("#fuzzWarning").classed("hidden", true);
        
        // Calculate union and fuzzy intersect
        for (i = 0; i < selectedPts.length; i += 1) {
            geneArray[i] = selectedPts[i].MemberGenes;
        }
        geneUnion = union_mult(geneArray);
        geneIntersectFuzzy = intersect_fuzzy(geneArray, fuzz);
        
        // Remove "Member Genes" metadata
        metadataRemove(2);
        
        // Display fuzzy intersect
        // 2. Member Genes
        d3.select("#liveTextTwo")
            .text(geneIntersectFuzzy.length + " genes shown. " + geneUnion.length + " unique genes in selected geneset(s)"); // live text
        tableTwoObj = d3.select("#tableTwo");
        for (i = 0; i < geneIntersectFuzzy.length; i += 1) {
            tableTwoObj.select("tbody").append("tr")
                .append("td")
                .text(geneIntersectFuzzy[i]);
        }
        
        // 3. Annotation
        d3.select(".msigdbannotation")
            .on("click", function () {
                queryMsigdb(geneIntersectFuzzy);
            });

        d3.select(".davidannotation")
            .on("click", function () {
                queryDavid(geneIntersectFuzzy);
            });
    }
});