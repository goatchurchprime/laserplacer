
// necessary for the final splitting of the path by the M values (we set bMsplits=false only in tunnel importing)
SVGfileprocess.prototype.processSingleSVGpathFinal = function(dtrans, bMsplits, d, spnum, strokecolour, layerclass, cmatrix)
{
    var i0 = 0; 
    var mi = 0; 
    var im0 = 0; 
    while (i0 < dtrans.length) {
        var i1 = i0 + 1; 
        while ((i1 < dtrans.length) && ((dtrans[i1][0] != "M") || !bMsplits))  // only abs M values are in this case
            i1++; 

        console.assert((d[im0] == "M") || (d[im0] == "m")); 
        var dim1 = d.substr(im0+1).search("M"); 
        var dim1m = d.substr(im0+1).search("m"); 
        if ((dim1m != -1) && ((dim1 == -1) || (dim1m < dim1)))
            dim1 = dim1m; 
            
        console.assert((dim1 == -1) == (i1 == dtrans.length)); 
        
        // this is the place to separate out the paths by M positions
        var path = paper1.path(dtrans.slice(i0, i1)); 
        path.attr({stroke:strokecolour, "stroke-width":this.drawstrokewidth}); 
        var rb = {path:path, spnum:spnum, col:strokecolour, layerclass:layerclass, d:d, mi:mi, dmi:(dim1 == -1 ? d.substr(im0) : d.substr(im0, dim1+im0+1)), cmatrix:cmatrix}; 
        if ((d[im0] == "m") && (i0 !== 0)) {
            rb["MX0"] = dtrans[i0-1][dtrans[i0-1].length - 2];  // the previous end point relative to which the next m motion goes from
            rb["MY0"] = dtrans[i0-1][dtrans[i0-1].length - 1];  
        } else {
            if ((im0 === 0) && (d[im0] == "m"))
                console.log("Bad lower-case m at start of path", d);  
            rb["MX0"] = dtrans[i0][dtrans[i0].length - 2];  // the absolute M position here 
            rb["MY0"] = dtrans[i0][dtrans[i0].length - 1];  
        } 
        this.rlistb.push(rb); 
        
        im0 = dim1+im0+1; 
        i0 = i1; 
        mi++; 
    }
}
    
var nostrokecolour = null; 
//nostrokecolour = "#0000A0"; // can override the no stroke, though there's often a good reason it's not stroked (being garbage)
//layerclass is the class put in by the dxf2svg conversion which sets class of each element to the layername
//(which will potentially supercede the generation of spnums)
SVGfileprocess.prototype.processSingleSVGpath = function(d, cmatrix, stroke, layerclass)
{    
    var dtrans = Raphael.mapPath(d, cmatrix); // Raphael.transformPath(d, raphtranslist.join("")); 
    if (dtrans.length <= 1)
        return; 

    var cclass; 
    if ((stroke == "none") || (stroke === undefined) || (stroke === null)) {
        if (nostrokecolour == null) {
            console.log("skipping path with no stroke", d); 
            return; 
        }
        stroke = nostrokecolour; 
    }
    cclass = stroke; 
    
    // convert all to extended classes with these strokes in?
    if (this.spnummap[cclass] === undefined) {
        var strokecolour = stroke; 
        var spnumobj = { spnum:this.spnumlist.length, strokecolour:strokecolour }; 
        var stitle = strokecolour + " (click to exclude from outline)"; 
        this.spnummap[cclass] = spnumobj.spnum; 
        this.spnumlist.push(spnumobj); 
        
        var elspnumcols = document.getElementById(this.fadivid).getElementsByClassName("spnumcols")[0]; 
        var spnumid = this.fadivid+"_spnum"+spnumobj.spnum; 
        elspnumcols.insertAdjacentHTML("beforeend", '<span id="'+spnumid+'" class="spnumselected" title="'+stitle+'" style="background:'+strokecolour+'">'+('X')+'</span>'); 
        document.getElementById(spnumid).onclick = function() { this.classList.toggle("spnumselected"); }; 
    }
    
    var spnum = this.spnummap[cclass]; 
    var spnumobj = this.spnumlist[spnum]; 
    var strokecolour = spnumobj.strokecolour; 
    this.processSingleSVGpathFinal(dtrans, true, d, spnum, strokecolour, layerclass, cmatrix); 
}


// this is because firefox returns "none" for cc.css("stroke")
function ColNoneToNull(col)
{
    if (col === undefined)
        return null; 
    if (col === "none")
        return null; 
    if (col === "")
        return null; 
    return col; 
}
// we get fill codes that shouldn't be set (for fonts) on firefox
function ColNoneToNullF(col)
{
    if (col === "rgb(0, 0, 0)")
        return null; 
    return ColNoneToNull(col); 
}

SVGfileprocess.prototype.importSVGpathR = function() 
{
    while (this.cstack.length == this.pback.pos) 
        this.pback = this.pstack.pop(); 
    if (this.cstack.length == 0) {
        return false; 
    }
    var cc = this.cstack.pop(); 
    var tag = cc.prop("tagName").toLowerCase(); 
    var raphtranslist = this.pback.raphtranslist; 
    var cmatrix = this.pback.cmatrix; 
    
    if (cc.attr("transform")) {
        raphtranslist = raphtranslist.slice(); 
        raphtranslist.push(cc.attr("transform").replace(/([mtrs])\w+\s*\(([^\)]*)\)/gi, function(a, b, c) { return b.toLowerCase()+c+(b.match(/s/i) ? ",0,0" : ""); } )); 
        cmatrix = paper1.path().transform(raphtranslist.join("")).matrix; 
    }
    var strokelist = this.pback.strokelist; 

    // decode case where multiple classes in same field
    var cclass = cc.attr("class"); 
    
    var lstyle = { }; 
    if (cc.attr("style")) {   // taken from parser in InitiateLoadingProcess
        cc.attr("style").replace(/([^:;]*):([^:;]*)/gi, function(a1, b1, c1) { 
            var c11 = c1.trim(); 
            if ((c11.length != 0) && (c11[0] == '"') && (c11[c11.length-1] == '"'))
                c11 = c11.slice(1, -1); 
            lstyle[b1.trim().toLowerCase()] = c11; 
        });
    }
    var cstroke = ColNoneToNull(cc.attr("stroke")) || ColNoneToNull(cc.css("stroke")) || ColNoneToNull(lstyle["stroke"]); 
    var cfill = ColNoneToNullF(cc.attr("fill")) || ColNoneToNullF(cc.css("fill")) || ColNoneToNullF(lstyle["fill"]); 
    var ocfill = cfill; 

    if ((cstroke === null) && cclass) {
        var lcclasss = cclass.split(" "); 
        for (var k = 0; k < lcclasss.length; k++) { 
            var lcclass = lcclasss[k]; 
            if (lcclass) {
                var lstroke = this.mclassstyle[lcclass] && this.mclassstyle[lcclass]["stroke"]; 
                var lfill = this.mclassstyle[lcclass] && this.mclassstyle[lcclass]["fill"]; 
                cstroke = ColNoneToNull(lstroke) || ColNoneToNull(cstroke);  // prioritized getting colour from somewhere
                if (!ocfill)
                    cfill = lfill || cfill; 
            }
        }
    }
    
    if (!cstroke || (cstroke === null))  // use fill if stroke not there
        cstroke = cfill;  // strictly because there is a strokelist stack but no filllist stack, this will mask any lower fills anyway
    
    if (cstroke) {
        strokelist = strokelist.slice(); 
        strokelist.push(cstroke); 
    } else {
        cstroke = strokelist[strokelist.length - 1]; 
    }
    
    var layerclass = cc.attr("class") || ""; 
    if (tag == "pattern") {
        console.log("skip pattern"); 
    } else if (tag == "clippath") {
        console.log("skip clippath"); // will deploy Raphael.pathIntersection(path1, path2) eventually
        // <clipPath id="cp1"> <path d="M497.7 285.2 Z"/></clipPath>
        // then clippath="url(#cp1)" in a path for a trimmed symbol type
    } else if ((tag == "polygon") || (tag == "polyline")) {
        var ppts = cc.attr("points").split(/\s+|,/);
        var x0 = ppts.shift(); 
        var y0 = ppts.shift();
        var d = 'M'+x0+','+y0+'L'+ppts.join(' ')+(tag == "polygon" ? "Z" : ""); 
        this.processSingleSVGpath(d, cmatrix, cstroke, layerclass); 
    } else if (tag == "circle") {
        var cx = parseFloat(cc.attr("cx"));
        var cy = parseFloat(cc.attr("cy")); 
        var r = parseFloat(cc.attr("r")); 
        var d = "M"+(cx-r)+","+cy+"A"+r+","+r+",0,0,1,"+cx+","+(cy-r)+"A"+r+","+r+",0,1,1,"+(cx-r)+","+cy; 
        this.processSingleSVGpath(d, cmatrix, cstroke, layerclass); 
    } else if (tag == "line") {
        var x1 = parseFloat(cc.attr("x1"));
        var y1 = parseFloat(cc.attr("y1")); 
        var x2 = parseFloat(cc.attr("x2"));
        var y2 = parseFloat(cc.attr("y2")); 
        var d = "M"+x1+","+y1+"L"+x2+","+y2; 
        this.processSingleSVGpath(d, cmatrix, cstroke, layerclass); 
    } else if (tag == "rect") {
        var x0 = parseFloat(cc.attr("x"));
        var y0 = parseFloat(cc.attr("y")); 
        var x1 = x0 + parseFloat(cc.attr("width")); 
        var y1 = y0 + parseFloat(cc.attr("height")); 
        var d = "M"+x0+","+y0+"L"+x0+","+y1+" "+x1+","+y1+" "+x1+","+y0+"Z"; 
        if (!this.btunnelxtype)
            this.processSingleSVGpath(d, cmatrix, cstroke, layerclass); 
    } else if (tag == "path") {
        this.processSingleSVGpath(cc.attr("d"), cmatrix, cstroke, layerclass); 
    } else {
        this.pstack.push(this.pback); 
        this.pback = { pos:this.cstack.length, raphtranslist:raphtranslist, strokelist:strokelist, cmatrix:cmatrix }; 
        var cs = cc.children(); 
        for (var i = cs.length - 1; i >= 0; i--) 
            this.cstack.push($(cs[i]));   // in reverse order for the stack
    }
    this.elprocessstatus.textContent = ("L"+this.rlistb.length+"/"+this.cstack.length); 
    return true; 
}





// this operates the settimeout loop (done this way because some files we've tried are very very large)
function importSVGpathRR(lthis)  
{
    if (lthis.bcancelIm) {
        this.elprocessstatus.textContent = ("CANCELLED"); 
        
    // this is the timeout loop
    } else if (lthis.btunnelxtype ? lthis.importSVGpathRtunnelx() : lthis.importSVGpathR()) {
        setTimeout(importSVGpathRR, lthis.timeoutcyclems, lthis); 
        
    // the final step when done
    } else {
        if (false) { // lthis.svgstate == "donedetailsloading") {
            this.elprocessstatus.textContent = "LD"; 
            lthis.processdetailSVGtunnelx(); 
            
        // this is the standard path (making a bounding box)
        } else  {
            lthis.elprocessstatus.textContent = "LD"; 
            lthis.ProcessPathsToBoundingRect();  
            lthis.elprocessstatus.textContent = "BD"; 
            lthis.updateLgrouppaths(); 
            updateAvailableThingPositions();  // apply any JSON code to this
            if (lthis.bstockdefinitiontype)
                setTimeout(groupingprocess, 1, lthis); 
        }
    }
}



SVGfileprocess.prototype.InitiateLoadingProcess = function(txt) 
{
    // NB "stroke" actually means colour in SVG lingo
    this.txt = txt; 
    
// this is the last place jquery is used, for the parsing ofthe svg text.  
// there must be a way using 
//   this.Dtsvg = document.createElement("div"); 
//   this.Dtsvg.innerHTML = txt; 
// would also need a rewrite on the cstack using nodename and node value, and find out what .find does
// to get it all done
//console.log(txt);   
    this.tsvg = $($(txt).children()[0]).parent(); // seems not to work directly as $(txt).find("svg")
//console.log(this.tsvg);   
    this.WorkOutPixelScale();  // sets the btunnelxtype
    
    // find the class definitions for style (using the replace function to look up all of them)
    this.mclassstyle = { }; 
    var mclassstyle = this.mclassstyle; 
    this.tsvg.find("style").text().replace(/\.([\w\d\-]+)\s*\{([^}]*)/gi, function(a, b, c) { 
        mclassstyle[b] = { }; 
        c.replace(/([^:;]*):([^:;]*)/gi, function(a1, b1, c1) { 
            var c11 = c1.trim(); 
            if ((c11.length != 0) && (c11[0] == '"') && (c11[c11.length-1] == '"'))
                c11 = c11.slice(1, -1); 
            mclassstyle[b][b1.trim().toLowerCase()] = c11; 
        }); 
    }); 
    console.log("mclassstyle", mclassstyle); 

    // autorun the group process (should distinguish easy cases)
    //if (txt.length < 10000)
    //    $("div#"+this.fadivid+" .groupprocess").addClass("selected"); 

    this.rlistb = [ ];  // list of type [ {path       : paper1.path (raphaelJS object), 
                        //                 spnum      : pen number object indexinginto spnumobj list
                        //                 layerclass : classname from svg object, from layername in dxf
                        //                 col        : stroke colour
                        //                 d          : original path d definition string, 
                        //                 mi         : index of M move within d-string, 
                        //                 dmi        : sub d definition path string, 
                        //                 cmatrix    : concatenated transform derived from svg grouping objects   } ]
                        // quickest shortcut is to use d = path.attr("path")
                        // also functions useful are: Raphael.mapPath(d, cmatrix) and PolySorting.flattenpath()
                        
    this.spnumlist = [ ]; 
    this.spnummap = { }; // maps into the above from concatenations of subset and strokecolour
    
    this.Lgrouppaths = [ ]; // used to hold the sets of paths we drag with
    //this.pathgroupings = [ ]; // the actual primary data, returned from ProcessToPathGroupings()

    // these control the loop importSVGpathRR runs within
    var imatrix = Raphael.matrix(this.fsca, 0, 0, this.fsca, 0, 0); 
    this.pback = {pos:-1, raphtranslist:[imatrix.toTransformString()], strokelist:[undefined], cmatrix:imatrix };
    this.pstack = [ ]; 
    this.cstack = [ this.tsvg ]; 
    
    this.timeoutcyclems = 4; 
    importSVGpathRR(this); 
}


function importSVGfile(i, f)
{
    console.log("importSVGfile", f.name); 
    var beps = f.type.match('image/x-eps'); 
    var bsvg = f.type.match('image/svg\\+xml'); 
    var bsvgizedtext = f.type.match('svgizedtext');  // this is the letters case
    var bdxf = f.type.match('image/vnd\\.dxf'); 
    
    if (!beps && !bsvg && !bdxf && !bsvgizedtext) {
        alert(f.name+" not SVG, EPS or DXF file: "+f.type); 
        return;
    }
    if (dropsvgherenote !== null) {
        dropsvgherenote.remove(); 
        dropsvgherenote = null; 
    }

    // create the new unique id and the process behind it
    var fadivid = 'fa'+filecountid; 
    filecountid++; 
    filenamelist[fadivid] = f.name; 
    var bstockdefinitiontype = (f.name.match(/^stockdef/) ? true : false); 

    // create the control panel and functions for this process
    var elfilearea = document.getElementById("filearea"); 
    var fileblock = ['<div id="'+fadivid+'"><span class="delbutton" title="Delete geometry">&times;</span>' ]; 
    if (!bstockdefinitiontype) 
        fileblock.push('<input class="tfscale" type="text" name="fscale" value="1.0" title="Apply scale"/>'); 
    fileblock.push('<b class="fname">'+f.name+'</b>'); 

// shouldn't have numcols in     stockdef kind
    //if (!bstockdefinitiontype)
        fileblock.push(': <span class="spnumcols"></span>'); 
    if (!bstockdefinitiontype)
        fileblock.push('<span class="makelayers">Layers</span>'); 
        
    fileblock.push('<span class="fprocessstatus">VV</span>'); 
    if (!bstockdefinitiontype)
        fileblock.push('<span class="groupprocess" title="Group geometry">Group</span>'); 
    fileblock.push('<select class="dposition"></select>'); 
    if (bstockdefinitiontype) {
        fileblock.push('<input type="button" class="genpathorder" value="GenPath"/>'); 
        fileblock.push('<input type="text" class="genpathftol" value="0.5" title="Path thinning tolerance"/>'); 
        fileblock.push('<input type="text" class="pencutseqindex" value="0" title="Path index"/>/<span class="pencutseqcount" title="Total path count">1</span>'); 
        fileblock.push('<input type="button" value="<<<" class="pencutseqback" title="go back one path"/>'); 
        fileblock.push('<input type="button" value=">" class="pencutseqadvance" title="advance on segment"/>'); 
        fileblock.push('<input type="button" value="A" class="pencutseqanimate" title="animate"/>'); 
    }
    
    if (!bstockdefinitiontype)
        fileblock.push('<div class="layerclasslist">Yooo!!!</div>'); 
    
    fileblock.push('</div>'); 
    elfilearea.insertAdjacentHTML("beforeend", fileblock.join("")); 

    // now the actual process (which has links into the control panel just made
    var svgprocess = new SVGfileprocess(f.name, fadivid, bstockdefinitiontype); 
    svgprocesses[fadivid] = svgprocess; 

    var elfadiv = document.getElementById(fadivid); 
    elfadiv.getElementsByClassName("delbutton")[0].onclick = deletesvgprocess; 
    if (bstockdefinitiontype) {
        elfadiv.getElementsByClassName("genpathorder")[0].onclick = genpathorderonstock; 
        elfadiv.getElementsByClassName("pencutseqadvance")[0].onclick = function() { plotpencutseqadvance(svgprocess, 1) }; 
        elfadiv.getElementsByClassName("pencutseqback")[0].onclick = function() { plotpencutseqadvance(svgprocess, -1) }; 
        elfadiv.getElementsByClassName("pencutseqanimate")[0].onclick = function() { pencutseqanimate(svgprocess) }; 
    } else {
        elfadiv.getElementsByClassName("fprocessstatus")[0].onclick = function() { svgprocess.bcancelIm = true; }; 
        elfadiv.getElementsByClassName("makelayers")[0].onclick = makelayers; 
        elfadiv.getElementsByClassName("groupprocess")[0].onclick = groupsvgprocess; 
        elfadiv.getElementsByClassName("tfscale")[0].onkeydown = function(e) { if (e.keyCode == 13)  { e.preventDefault(); rescalefileabs(elfadiv) }; }; 
    }
    
    fadividlast = fadivid; 
Dsvgprocess = svgprocess; 
Df = f;  

    if (bsvgizedtext) {
        svgprocess.InitiateLoadingProcess(f.svgtext); 
    } else if (bsvg) {
        var reader = new FileReader(); 
        reader.onload = (function(e) { svgprocess.InitiateLoadingProcess(reader.result); }); 
        reader.readAsText(f); 
    } else {
        alert("not svg type: "+f.name); 
        elfadiv.getElementsByClassName("fname")[0].style.background = "red"; 
    }
}

//if (svgprocess.svgstate.match(/doneimportsvgr|doneimportsvgrareas/))
//    svgprocess.groupimportedSVGfordrag((svgprocess.btunnelxtype ? "grouptunnelx" : "groupcontainment")); 

