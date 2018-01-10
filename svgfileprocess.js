

var Iprocesscount = 0; 
var SVGfileprocess = function(fname, fadivid, bstockdefinitiontype) 
{
    this.fname = fname; 
    this.fadivid = fadivid; 
    this.bstockdefinitiontype = bstockdefinitiontype; 
    this.state = "constructed"; 
    this.bcancelIm = false; 
    this.cutfillcolour = "#0a8"; 
    this.processcountnumber = Iprocesscount++; // used for positioning on drop
    this.currentabsolutescale = 1.0; 
    
    // after importing:
    this.rlistb = [ ];  // all the paths
    this.spnumlist = [ ]; 
    this.spnummap = { }; 
    this.pathgroupings = [ ]; // the actual primary data, returned from ProcessToPathGroupings()
    this.Lgrouppaths = [ ]; // used to hold the sets of paths we drag with (the 0th element is the area, which is not part of the geometry)

    this.elprocessstatus = document.getElementById(this.fadivid).getElementsByClassName("fprocessstatus")[0]; 
}

SVGfileprocess.prototype.jsonObjectSummary = function()
{
    var res = { name:this.fname, state:this.state, currentabsolutescale:this.currentabsolutescale }; 
    res["spnumsselected"] = getspnumsselected(this.fadivid); 
    res["rlistblength"] = this.rlistb.length; 
    res["pathgroupingsinfo"] = [ ]; 
    
    for (var i = 0; i < this.pathgroupings.length; i++) {
        res["pathgroupingsinfo"].push({ pathgroupname:this.pathgroupings[i][0], tstr:this.Lgrouppaths[i][0].transform() }); 
    }
    return res; 
}

SVGfileprocess.prototype.applyObjectSummary = function()
{
}


SVGfileprocess.prototype.scalestrokewidth = function(drawstrokewidth, cutstrokewidth)
{
console.log("strokewidths", this.fadivid, drawstrokewidth, cutstrokewidth); 
    for (var i = 0; i < this.Lgrouppaths.length; i++) {
        var pgroup = this.Lgrouppaths[i][0]; 
        for (var j = 0; j < this.Lgrouppaths[i].length; j++) {
            this.Lgrouppaths[i][j].attr("stroke-width", drawstrokewidth); 
        };
        if (this.pathgroupings[i][0] != "boundrect")
            this.Lgrouppaths[i][0].attr("stroke-width", cutstrokewidth); 
    }
}

function converttomm(s) 
{
    var fac = 1.0; 
    if (s.match(/.*?(mm|\d\.)$/g))
        fac = 1.0; 
    else if (s.match(/.*?(in)$/g))
        fac = 25.4; 
    else if (s.match(/.*?(pt)$/g))
        fac = 25.4/72; 
    else
        console.log("viewBox missing units", s); 
    return parseFloat(s)*fac; // parses what it understands
}


// undo the scale by multiplying by 1/(Dsvgprocess.fsca)*90/25.4

SVGfileprocess.prototype.WorkOutPixelScale = function() 
{
    var svgtitletext = this.tsvg.find("title").text(); 
    this.btunnelxtype = (svgtitletext.match(/TunnelX/) != null); 
    if (this.btunnelxtype) 
        console.log("Detected TunnelX type"); 

    var sheight = this.tsvg.attr("height"); 
    var swidth = this.tsvg.attr("width"); 
    var viewBox = []; // (seemingly unable to lift the viewBox as an attribute, so get by regexp)
    this.txt.replace(/viewBox="(-?\d*\.?\d*(?:e[\-+]?\d+)?)\s+(-?\d*\.?\d*(?:e[\-+]?\d+)?)\s+(-?\d*\.?\d*(?:e[\-+]?\d+)?)\s+(-?\d*\.?\d*(?:e[\-+]?\d+)?)/g, 
        function(a, x, y, w, h) { 
            viewBox.push(parseFloat(x), parseFloat(y), parseFloat(w), parseFloat(h)); 
    }); 

    console.log("facts: svg-width:" + swidth +"  svg-height:" + sheight + "  viewbox:"+viewBox); 
    this.fmmpixwidth = 1.0; 
    this.fmmpixheight = 1.0; 
    if ((viewBox.length != 0) && (sheight != undefined) && (swidth != undefined)) {
        var fmmheight = converttomm(sheight); 
        var fmmwidth = converttomm(swidth); 
        this.fmmpixwidth = viewBox[2]/fmmwidth; 
        this.fmmpixheight = viewBox[3]/fmmheight; 
        console.log("pixscaleX "+this.fmmpixwidth+"  pixscaleY "+this.fmmpixheight); 
    }
    // old pixel width of inkscape forcing, now it's 1mm to 1unit
    //var inkscapedefaultmmpix = 90/25.4; fsca = inkscapedefaultmmpix/this.fmmpixwidth
    this.fsca = 1.0/this.fmmpixwidth; 
}

// necessaryfor the final splitting of the path by the M values
SVGfileprocess.prototype.processSingleSVGpathFinal = function(dtrans, bMsplits, d, spnum, strokecolour, cmatrix)
{
    var i0 = 0; 
    var mi = 0; 
    while (i0 < dtrans.length) {
        var i1 = i0 + 1; 
        while ((i1 < dtrans.length) && ((dtrans[i1][0] != "M") || !bMsplits))
            i1++; 
        // this is the place to separate out the paths by M positions
        var path = paper1.path(dtrans.slice(i0, i1)); 
        path.attr({stroke:strokecolour, "stroke-width":this.drawstrokewidth}); 
        rlist.push(path); 
        this.rlistb.push({path:path, spnum:spnum, d:d, mi:mi, cmatrix:cmatrix}); 
        
        i0 = i1; 
        mi++; 
    }
}
    
var nostrokecolour = null; 
//nostrokecolour = "#0000A0"; // can override the no stroke, though there's often a good reason it's not stroked (being garbage)
SVGfileprocess.prototype.processSingleSVGpath = function(d, cmatrix, stroke)
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
    this.processSingleSVGpathFinal(dtrans, true, d, spnum, strokecolour, cmatrix); 
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
        this.processSingleSVGpath(d, cmatrix, cstroke); 
    } else if (tag == "circle") {
        var cx = parseFloat(cc.attr("cx"));
        var cy = parseFloat(cc.attr("cy")); 
        var r = parseFloat(cc.attr("r")); 
        var d = "M"+(cx-r)+","+cy+"A"+r+","+r+",0,0,1,"+cx+","+(cy-r)+"A"+r+","+r+",0,1,1,"+(cx-r)+","+cy; 
        this.processSingleSVGpath(d, cmatrix, cstroke); 
    } else if (tag == "line") {
        var x1 = parseFloat(cc.attr("x1"));
        var y1 = parseFloat(cc.attr("y1")); 
        var x2 = parseFloat(cc.attr("x2"));
        var y2 = parseFloat(cc.attr("y2")); 
        var d = "M"+x1+","+y1+"L"+x2+","+y2; 
        this.processSingleSVGpath(d, cmatrix, cstroke); 
    } else if (tag == "rect") {
        var x0 = parseFloat(cc.attr("x"));
        var y0 = parseFloat(cc.attr("y")); 
        var x1 = x0 + parseFloat(cc.attr("width")); 
        var y1 = y0 + parseFloat(cc.attr("height")); 
        var d = "M"+x0+","+y0+"L"+x0+","+y1+" "+x1+","+y1+" "+x1+","+y0+"Z"; 
        if (!this.btunnelxtype)
            this.processSingleSVGpath(d, cmatrix, cstroke); 
    } else if (tag == "path") {
        this.processSingleSVGpath(cc.attr("d"), cmatrix, cstroke); 
    } else {
        this.pstack.push(this.pback); 
        this.pback = { pos:this.cstack.length, raphtranslist:raphtranslist, strokelist:strokelist, cmatrix:cmatrix }; 
        var cs = cc.children(); 
        for (var i = cs.length - 1; i >= 0; i--) 
            this.cstack.push($(cs[i]));   // in reverse order for the stack
    }
    this.elprocessstatus.textContent = (this.rlistb.length+"/"+this.cstack.length); 
    return true; 
}



SVGfileprocess.prototype.spnummapGetCreate = function(cclass, mcs, strokecolour)
{
    // convert all to extended classes with these strokes in?
    if (this.spnummap[cclass] === undefined) {
        var fillcolour = Raphael.getColor(1.0); 
        var spnumobj = { spnum:this.spnumlist.length, strokecolour:strokecolour, fillcolour:fillcolour, subsetname:mcs.dsubsetname, linestyle:mcs.dlinestyle }; 
        var stitle = spnumobj.subsetname+"-"+spnumobj.linestyle; 
        this.spnummap[cclass] = spnumobj.spnum; 
        this.spnumlist.push(spnumobj); 
        if (spnumobj.linestyle == "Wall") {
            $('div#'+this.fadivid+' .spnumcols').append($('<span class="spnum'+spnumobj.spnum+'" title="'+stitle+'">'+('X')+'</span>').css("background", fillcolour||strokecolour)); 
            $('div#'+this.fadivid+' .spnumcols span.spnum'+spnumobj.spnum).click(function() {
                if ($(this).hasClass("selected")) 
                    $(this).removeClass("selected"); 
                else
                    $(this).addClass("selected"); 
            });
        }
    }
}


// this operates the settimeout loop (done this way because some files we've tried are very very large)
function importSVGpathRR(lthis)  
{
    if (lthis.bcancelIm) {
        this.elprocessstatus.textContent = ("CANCELLED"); 
        lthis.state = "cancelled"+lthis.state; 
    } else if (lthis.btunnelxtype ? lthis.importSVGpathRtunnelx() : lthis.importSVGpathR()) {
        setTimeout(importSVGpathRR, lthis.timeoutcyclems, lthis); 
        
    // the final step when done
    } else {
        lthis.state = "done"+lthis.state; // "importsvgrareas" : "importsvgr"
        if (lthis.state == "donedetailsloading")
            lthis.processdetailSVGtunnelx(); 
        else 
            lthis.groupimportedSVGfordrag("groupboundingrect"); 
    }
}



SVGfileprocess.prototype.InitiateLoadingProcess = function(txt) 
{
    // NB "stroke" actually means colour in SVG lingo
    this.state = "loading"; 
    this.txt = txt; 
    this.tsvg = $($(txt).children()[0]).parent(); // seems not to work directly as $(txt).find("svg")
    this.WorkOutPixelScale();  // sets the btunnelxtype
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

    this.rlistb = [ ];  // list of type [ {path:paper1.path, spnum:spnum, d:org-d-value, mi:index-to-m cutoff, cmatrix:cmatrix} ]
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
    
    this.state = (this.btunnelxtype ? "importsvgrareas" : "importsvgr"); 
    this.timeoutcyclems = 4; 
    importSVGpathRR(this); 
}


function DcolourPathSubGrouping(rlistb, splist, pathpoly, strokecolour) 
{
    for (var ii = 0; ii < pathpoly.length; ii++) {
        var rp = rlistb[pathpoly[ii]/2|0]; 
        rp.path.attr("stroke", (strokecolour ? strokecolour : splist[rp.spnum].strokecolour)); 
    }
}

function DcolourPathGrouping(rlistb, splist, pathgrouping, strokecolour, strokeengcolour) 
{
    for (var i = 1; i < pathgrouping.length - 1; i++) {
        DcolourPathSubGrouping(rlistb, splist, pathgrouping[i], strokecolour);  
    }
    DcolourPathSubGrouping(rlistb, splist, pathgrouping[pathgrouping.length - 1], strokeengcolour);   
}


function CopyPathListOfColour(rlistb, spnum)
{
    var dlist = [ ]; 
    var npathsc = 0; 
    for (var i = 0; i < rlistb.length; i++) {
        if ((spnum === null) || ((rlistb[i].spnum == spnum) && (rlistb[i].path.getTotalLength() != 0)))
            dlist.push(rlistb[i].path.attr("path")); 
        else
            dlist.push(null); 
        npathsc++; 
    }
    return dlist; 
}

function MakeContourcurvesFromSequences(dlist, jdseqs) 
{
    var jdgeos = [ ]; 
    for (var i = 0; i < jdseqs.length; i++) {
        jdgeos.push(PolySorting.JDgeoseq(jdseqs[i], dlist)); // concatenated sequences of paths forming the boundaries
    }
    return jdgeos; 
}

// may need to be in callback type to spread the load and make the processstatus appear
function ProcessToPathGroupings(rlistb, closedist, spnumscp, fadivid, elprocessstatus)
{
    // form the closed path sequences per spnum
    var jdseqs = [ ];  // indexes dlist
    for (var ispnum = 0; ispnum < spnumscp.length; ispnum++) {
        var spnum = spnumscp[ispnum]; 
        elprocessstatus.textContent = ("joining spnum="+spnum); 
        var ljdseqs = PolySorting.FindClosedPathSequencesD(CopyPathListOfColour(rlistb, spnum), closedist, false); 
        var npathsleft = 0; 
        for (var i = 0; i < ljdseqs.length; i++)
            npathsleft += ljdseqs[i].length; 
        //console.log("ljdseqs", spnum, "joined", npathsc, "left", npathsleft);  // could use not-joined paths as a guess of which colours to filter as engravings
        jdseqs = jdseqs.concat(ljdseqs); 
    }
    // jdseqs = [ [i1, i2, i3,...] sequence of dlist[ii/2|0], bfore=((ii%2)==1 ]

    // list of paths not included in any cycle
    elprocessstatus.textContent = ("getsingletlist"); 
    var singletslist = PolySorting.GetSingletsList(jdseqs, rlistb.length); // (why isn't dlist defined outside of the loop?)  

    // build the dlist without any holes parallel to rlistb to use for groupings
    elprocessstatus.textContent = ("concat JDgeoseqs"); 
    var dlist = CopyPathListOfColour(rlistb, null); 
    var jdgeos = MakeContourcurvesFromSequences(dlist, jdseqs); 

    // groups of jdsequences forming outercontour, islands, singlets 
    elprocessstatus.textContent = ("FindAreaGroupingsD"); 
    var res = [ ]; 
    var cboundislands = PolySorting.FindAreaGroupingsD(jdgeos); 
    
    elprocessstatus.textContent = ("oriented islands"); 
    for (var j = 0; j < cboundislands.length; j++) {
        var lres = [ fadivid+"cb"+j ]; 
        var cboundisland = cboundislands[j]; 
        for (var ci = 0; ci < cboundisland.length; ci++) {
            var i = cboundisland[ci]; 
            var jdgeo = jdgeos[i]; 
            var bfore = PolySorting.FindPathOrientation(jdgeo); 
            var jdseq = (((ci == 0) == bfore) ? jdseqs[i] : PolySorting.RevJDseq(jdseqs[i])); 
            lres.push(jdseq); 
        }
        lres.push([ ]); // the slot for the list of singlet paths
        res.push(lres); 
    }
    
    elprocessstatus.textContent = ("singlets to groupings"); 
    var unmatchedsinglets = [ ]; 
    for (var i = 0; i < singletslist.length; i++) {
        var ic = singletslist[i]; 
        var dpath = dlist[ic]; 
        var j = PolySorting.SingletsToGroupingsD(dpath, cboundislands, jdgeos); 
        if (j != -1)
            res[j][res[j].length-1].push(ic); 
        else
            unmatchedsinglets.push(ic); 
    }

    if (unmatchedsinglets.length != 0)
        res.push(["unmatchedsinglets", unmatchedsinglets ]); 
    console.log("unmatched", unmatchedsinglets); 
    console.log("pathgroupings", res); 
    return res; 
}



// pgrouparea is the filled object that we click in, and lpaths are all the paths that should be dragged with it (including pgrouparea as first element)
SVGfileprocess.prototype.applygroupdrag = function(pgrouparea, lpaths, grouptransform) 
{
    console.assert(lpaths[0] === pgrouparea); 

        // closured values shared between the drag functions
    var blockedmode = false; 
    var brotatemode = false;  
    var cx = 0, cy = 0; 
    var tstr; 
    var groupcolour = pgrouparea.attr("fill"); // original colour before coloured to highlight it is being dragged
    var elfadividphi = document.getElementById(grouptransform.fadividphi); 
    
    pgrouparea.drag(
        function(dx, dy, x, y, e) { // drag
            e.stopPropagation(); e.preventDefault(); 
            if (blockedmode)
                return; 
            else if (brotatemode)
                tstr = "r"+(dx*0.34)+","+cx+","+cy+grouptransform.transform; 
            else
                tstr = "t"+(dx*paper1scale)+","+(dy*paper1scale)+grouptransform.transform; 
            tstr = pgrouparea.transform(tstr).transform(); // compose and extract the simplified transform
            for (var k = 1; k < lpaths.length; k++) 
                lpaths[k].transform(tstr); 
            elfadividphi.textContent = "t"+pgrouparea._.dx.toFixed()+","+pgrouparea._.dy.toFixed()+"r"+pgrouparea._.deg.toFixed(); 
        }, 
        function(x, y, e)  {  // mouse down
            blockedmode = elfadividphi.classList.contains("locked"); 
            brotatemode = e.ctrlKey; 
            pathselected = pgrouparea; // this is only a remnant of the collision testing stuff
            elfadividphi.classList.add("moving"); 
                
            //basematrix = pgrouparea.matrix.toTransformString(); 
            basematrix = pgrouparea.transform(); 
            groupcolour = pgrouparea.attr("fill"); 
            pgrouparea.attr("fill", "#fa0"); 
            if (brotatemode) {
                var bbox = pgrouparea.getBBox(); 
                cx = (bbox.x + bbox.x2)/2;  // this is where we could try rotate round point down
                cy = (bbox.y + bbox.y2)/2; 
            }
            e.stopPropagation(); e.preventDefault(); 
        },  
        function(e) {    // mouse up
            if (!blockedmode)
                grouptransform.transform = tstr;  
            elfadividphi.classList.remove("moving"); 
            pgrouparea.attr("fill", groupcolour); 
            e.stopPropagation(); e.preventDefault(); 
        }
    ); 
}


SVGfileprocess.prototype.removeall = function() 
{
    for (var i = 0; i < this.Lgrouppaths.length; i++) {
        var pgroup = this.Lgrouppaths[i][0]; 
        pgroup.undrag(); 
        pgroup.remove(); 
        for (var j = 1; j < this.Lgrouppaths[i].length; j++) {
            this.Lgrouppaths[i][j].remove(); 
        };
    }
    this.Lgrouppaths = [ ]; 
}



var Dlengpaths; 

function getspnumsselected(fadivid)
{
    var spnumscp = [ ]; 
    var elcolspans = document.getElementById(fadivid).getElementsByClassName("spnumselected"); 
console.log(elcolspans);    
    for (var i = 0; i < elcolspans.length; i++)
        spnumscp.push(parseInt(elcolspans[i].id.match(/\d+$/g)[0]));  // _spnum(\d+) 
    return spnumscp; 
}

// could this be converted into a callback function if it takes too long
SVGfileprocess.prototype.groupimportedSVGfordrag = function(grouptype)
{
    var closedist = 0.2; // should be a setting
    var spnumscp = getspnumsselected(this.fadivid); 
console.log("hghghg", grouptype, spnumscp); 
    
    // pathgroupings are of indexes into rlistb specifying the linked boundaries and islands (*2+(bfore?1:0)), and engraving lines in the last list (not multiplied)
    if (grouptype == "grouptunnelx")
        this.pathgroupings = ProcessToPathGroupingsTunnelX(this.rlistb, this.spnumlist); 
    else if (grouptype == "groupcontainment")
        this.pathgroupings = ProcessToPathGroupings(this.rlistb, closedist, spnumscp, this.fadivid, this.elprocessstatus); 
    else { 
        console.assert(grouptype == "groupboundingrect"); 
        var groupall = [ ]; 
        for (var i = 0; i < this.rlistb.length; i++) 
            groupall.push(i); 
        this.pathgroupings = [ [ "boundrect", groupall ] ]; 
    }

    this.state = "process"+this.state.slice(4); 
    this.elprocessstatus.textContent = (""); 

    // remove old groups if they exist (mapping across the transforms that were originally applied when dragging the boundingrect)
    var tstr = (this.Lgrouppaths.length != 0 ? this.Lgrouppaths[0][0].transform() : "t0,0"); 
    for (var i = 0; i < this.Lgrouppaths.length; i++) {
        var pgroup = this.Lgrouppaths[i][0]; 
        pgroup.undrag(); 
        pgroup.remove(); 
        /*for (var j = 1; j < this.Lgrouppaths[i].length; j++) {
            var path = this.Lgrouppaths[i][j]; 
            if (path.matrix.toTransformString() != "") {
                path.attr("path", Raphael.mapPath(path.attr("path"), path.matrix)); 
                path.transform("t0,0"); 
            }
        };*/
    }

    // shift area to top left corner wherever it starts out landing
// we don't have the bounding box at this point
/*    if ((this.pathgroupings.length == 1) && (this.pathgroupings[0][0] == "boundrect")) {
        var basematrix = pgroup.matrix.toTransformString(); 
        var dx = -bbox.x + 30 + this.processcountnumber*10; 
        var dy = -bbox.y + 30 + this.processcountnumber*10; 
        var tstr = "t"+(dx*paper1scale)+","+(dy*paper1scale)+basematrix; 
console.log("moving boundrect needs fixing", tstr); 
        pgroup.transform(tstr);         
        for (var k = 0; k < lpaths.length; k++) {
            lpaths[k].transform(tstr); 
        }; 
    }
*/

    var eldpositions = document.getElementById(this.fadivid).getElementsByClassName("dposition")[0]; 
    while (eldpositions.firstChild)  
        eldpositions.removeChild(eldpositions.firstChild); 
    this.grouptransforms = [ ]; 
    
    // this.Lgrouppaths is the parallel arrays of actual pathgroupings and containing area (the first element of each is the derived outline or box, and not in the list
    // this.grouptransforms = [ { transform:tstr, fadividphi:fadividpgi } ]
    
    // first copy out the path properties from the rlistb thing
    var dlist = [ ]; 
    for (var i = 0; i < this.rlistb.length; i++) 
        dlist.push(this.rlistb[i].path.attr("path")); 

    this.Lgrouppaths = [ ];  // [ [pgroup, path, path, path], [pgroup, path, ...], ... ]
    for (var k = 0; k < this.pathgroupings.length; k++) {
        var pathgrouping = this.pathgroupings[k]; 
        // [ "id", [outerpathlist], [innerpathlist1], [innerpathlist2], ..., [engpathlist(unorderedindexes)] ]
        
        // form the area object from the directed cut paths and the engraved paths (whose direction is not encoded)
        var dgroup = [ ]; 
        var fillcolour = (this.btunnelxtype ? this.spnumlist[this.rlistb[pathgrouping[1][0]/2|0].spnum].fillcolour : this.cutfillcolour); 
        for (var j = 1; j < pathgrouping.length - 1; j++) {
            if (pathgrouping[j].length != 0)
                dgroup = dgroup.concat(PolySorting.JDgeoseq(pathgrouping[j], dlist)); 
        }
        var engpaths = pathgrouping[pathgrouping.length - 1]; 
        var lengpaths = [ ]
        for (var i = 0; i < engpaths.length; i++)
            lengpaths = lengpaths.concat(dlist[engpaths[i]]); 
        var pgroup; 
        if ((pathgrouping[0] == "boundrect") || (pathgrouping[0] == "unmatchedsinglets")) {
            var bbox = Raphael.pathBBox(lengpaths); 
            pgroup = paper1.path("M"+bbox.x+","+bbox.y+"H"+bbox.x2+"V"+bbox.y2+"H"+bbox.x+"Z"); 
            pgroup.attr({stroke:"none", fill:(pathgrouping[0] == "boundrect" ? "#aae" : "#e99"), "fill-opacity":"0.16"}); 
        } else {   // pathgrouping[0] is the id of this component
            pgroup = paper1.path(dgroup); 
            pgroup.attr({stroke:(this.btunnelxtype ? "black" : "white"), "stroke-width": gcutstrokewidth, fill:fillcolour, "fill-opacity":"0.1", "stroke-linejoin":"round"}); 
            pgroup[0].style["fillRule"] = "evenodd"; // hack value in as this cannot be implemented via Raphaeljs interface (till we get the orientations right)
        }
        
        var grouptransform = { transform:tstr, fadividphi:this.fadivid+"_pg"+k }; 
        this.grouptransforms.push(grouptransform); 

        pgroup.transform(grouptransform.transform); 
        eldpositions.insertAdjacentHTML("beforeend", '<span id="'+grouptransform.fadividphi+'" title="group'+k+'">'+"t"+pgroup._.dx.toFixed()+","+pgroup._.dy.toFixed()+"r"+pgroup._.deg.toFixed()+'</span>'); 
        document.getElementById(grouptransform.fadividphi).onclick = function() { this.classList.toggle("locked"); }; 

        var eldposition = document.getElementById(this.fadivid).getElementsByClassName("dposition")[0]; 
        
        // form the list of all paths belonging to this area object
        var lpaths = [ pgroup ];  // first element has to be the area object itself
        for (var j = 1; j < pathgrouping.length - 1; j++) {
            for (var i = 0; i < pathgrouping[j].length; i++) {
                lpaths.push(this.rlistb[pathgrouping[j][i]/2|0].path); 
            }
        }
        for (var i = 0; i < engpaths.length; i++)
            lpaths.push(this.rlistb[engpaths[i]].path); 
        this.Lgrouppaths.push(lpaths); 

        this.applygroupdrag(pgroup, lpaths, grouptransform); 
    }; 
}

