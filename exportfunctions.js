// (also contains importSVGfiles() at the bottom)


function AutoDownloadBlob(stringlist, downloadfilename) 
{
    var a = document.createElement('a');
    a.style = "display: none"; 
    var mimetype = "text/plain"; 
    if (downloadfilename.match("svg$"))
        mimetype = "image/svg+xml"; 
    else if (downloadfilename.match("json$"))
        mimetype = "application/json"; 
    
    var blob = new Blob(stringlist, {'type':mimetype});
    a.href = window.URL.createObjectURL(blob);
    a.download = downloadfilename;
    document.body.appendChild(a); 
    a.onclick = function() { document.body.removeChild(a); }; 
    a.click();
}

function exportSVG()
{
    var xs = new XMLSerializer();
    var data = document.getElementById("paper1").children[0]; // gets the svg element put there by Raphael
    AutoDownloadBlob([xs.serializeToString(data)], "test.svg");
}


var bcancelExIm = false; 
var cosang = 5; 
var cosangdot = Math.cos(cosang*Math.PI/180); 
var TXlinestylespnum = { "subsetarea":0, "Wall":1, "EstW":1, "Detl":2, "symbDetl":2, "CeilB":2, "Pitc":2, "Cent":3, "symbFill":4 }; 
//alert("hi"); 
function exportPLT()
{
//console.log("exportingJSON instead"); 
//return exportJSON(); 

    var svgprocess = svgprocesses[fadividlast]; 
    var rlistb = svgprocess.rlistb; 
    
    var lplt = [ "IN;\n", "WU0;\n" ]; 
    var samplerateunit = 0.9; 
    var fac = 40; // PLT file operates at 40units per pixel
    var ytop = 10000; 
    var i = 0; 
    bcancelExIm = false; 
    document.getElementById("readingcancel").textContent = "exportPLT"; 
    function exportPLTpathR() {
        var path = rlistb[i].path; 
        var d = path.attr("path"); 
        var dtrans = Raphael.mapPath(d, path.matrix); 
        var fpts = PolySorting.flattenpath(dtrans, cosangdot, 0.0) 
        
        // uncomment to plot the flattenpath for debug viewing
        //var Lfpts = [ ]; for (var Di = 0; Di < fpts.length; Di++); Lfpts.push(fpts[Di][0]+","+fpts[Di][1]); 
        //paper1.path("M"+Lfpts.join("L")).attr("stroke", "red");  
        var spnum = rlistb[i].spnum, spnumobj; 
        if (svgprocess.btunnelxtype) {
            spnumobj = svgprocess.spnumlist[spnum]; 
            spnum = TXlinestylespnum[spnumobj.linestyle]; 
        }
        if (spnum !== undefined) {
            lplt.push("SP"+spnum+";\n"); 
            lplt.push("LT;\n"); 
            for (var j = 0; j < fpts.length; j++) {
                lplt.push((j == 0 ? "PU" : "PD")+(fpts[j][0]*fac).toFixed(3)+" "+(ytop-fpts[j][1]*fac).toFixed(3)+"\n"); 
            }
        } else if (spnumobj) {
            console.log(TXlinestylespnum[spnumobj.linestyle]); 
        }
        if (bcancelExIm) {
            return; 
        } else if (++i < rlistb.length) {
            setTimeout(exportPLTpathR, 1); 
        } else {
            lplt.push("SP0;\n"); 
            var a = document.createElement('a');
            AutoDownloadBlob(lplt, "test.plt"); 
        }
        document.getElementById("readingcancel").textContent = (i+"/"+rlist.length); 
    };
    exportPLTpathR(); 
}

// quick hack to see if we can load into polar graph system
function exportJSON()
{
    var svgprocess = svgprocesses[fadividlast]; 
    var rlistb = svgprocess.rlistb; 
    
    var lplt = [ " " ]; 
    var samplerateunit = 0.9; 
    var fac = 1; 
    var ytop = 0; 
    var i = 0; 
    bcancelExIm = false; 
    document.getElementById("readingcancel").textContent = ("exportPLT"); 
    function exportJSONpathR() {
        var path = rlistb[i].path; 
        var d = path.attr("path"); 
        var dtrans = Raphael.mapPath(d, path.matrix); 
        var fpts = PolySorting.flattenpath(dtrans, cosangdot, 0.0) 
        
        // uncomment to plot the flattenpath for debug viewing
        //var Lfpts = [ ]; for (var Di = 0; Di < fpts.length; Di++); Lfpts.push(fpts[Di][0]+","+fpts[Di][1]); 
        //paper1.path("M"+Lfpts.join("L")).attr("stroke", "red");  
        var spnum = rlistb[i].spnum, spnumobj; 
        if (svgprocess.btunnelxtype) {
            spnumobj = svgprocess.spnumlist[spnum]; 
            spnum = TXlinestylespnum[spnumobj.linestyle]; 
        }
        if (spnum !== undefined) {
            for (var j = 0; j < fpts.length; j++) {
                lplt.push((j == 0 ? "M" : "L")+(200+fpts[j][0]*fac).toFixed(3)+" "+(fpts[j][1]*fac-ytop).toFixed(3)); 
            }
        } else if (spnumobj) {
            console.log(TXlinestylespnum[spnumobj.linestyle]); 
        }
        if (bcancelExIm) {
            return; 
        } else if (++i < rlistb.length) {
            setTimeout(exportJSONpathR, 1); 
        } else {
            lplt.push(""); 
            AutoDownloadBlob(lplt, "test.plt"); 
        }
        document.getElementById("readingcancel").textContent = (i+"/"+rlist.length); 
    };
    exportJSONpathR(); 
}



function updateAvailableThingPositions()   // see jsonThingsPositions for format
{
    // go through and find any svgprocesses that match by name with any unconsumed thingpositions
    var svgprocesseskeys = Object.keys(svgprocesses); 
    for (var i = 0; i < svgprocesseskeys.length; i++) {
        var svgprocess = svgprocesses[svgprocesseskeys[i]]; 
        
        // we should only need to apply it once, because all the positions will be filled in ready in the pathgroupingtstrs array
        if ((svgprocess.elprocessstatus.textContent == "BD") || (svgprocess.elprocessstatus.textContent == "GD")) {
            var jmatchedalready = -1; 
            for (var j = 0; j < mainthingsposition.svgprocesses.length; j++) {
                if (mainthingsposition.svgprocesses[j].matchingprocessfadivid === svgprocess.fadivid) {
                    jmatchedalready = j; 
                    break; 
                }
            }
            if (jmatchedalready !== -1)
                continue; 
            
            for (var j = 0; j < mainthingsposition.svgprocesses.length; j++) {
                if ((mainthingsposition.svgprocesses[j].matchingprocessfadivid === undefined) && (svgprocess.fname == mainthingsposition.svgprocesses[j].fname)) {
                    svgprocess.applyThingsPosition(mainthingsposition.svgprocesses[j]); 
                    mainthingsposition.svgprocesses[j].matchingprocessfadivid = svgprocess.fadivid; 
                    if (svgprocess.elprocessstatus.textContent == "BD")
                        setTimeout(groupingprocess, 1, svgprocess); 
                    break; 
                }
            }
        }
    }

    // put in remaining thing positions
    var elimportedthingpos = document.getElementById("importedthingpos"); 
    while (elimportedthingpos.firstChild)  
        elimportedthingpos.removeChild(elimportedthingpos.firstChild); 
    for (var j = 0; j < mainthingsposition.svgprocesses.length; j++)
        elimportedthingpos.insertAdjacentHTML("beforeend", "<option>"+(mainthingsposition.svgprocesses[j].matchingprocessfadivid ?"["+mainthingsposition.svgprocesses[j].matchingprocessfadivid+"] ":"** ")+mainthingsposition.svgprocesses[j].fname+"</option>"); // can't put colours into option tag
    elimportedthingpos.hidden = (mainthingsposition.svgprocesses.length == 0); 
}

var Df; 
var filecountid = 0; 
function importSVGfiles(files)
{
    for (var i = 0; i < files.length; i++) {
        if (files[i].type == "application/json") {
            var reader = new FileReader(); 
            reader.onload = function(e) {  mainthingsposition = JSON.parse(reader.result);  updateAvailableThingPositions();  }; 
            reader.readAsText(files[i]); 
        } else {
            importSVGfile(i, files[i]);   // this function already kicks off independent loading processes
        }
    }
}

function deletesvgprocess()
{
    var elfadiv = this.parentElement;  
    if (fadividlast === elfadiv.id)
        fadividlast = null; 
    svgprocesses[elfadiv.id].removeall(); // kill off the geometry that derived from this file
    delete svgprocesses[elfadiv.id]; 
    elfadiv.remove(); 
}


function groupsvgprocess() 
{
    var elfadiv = this.parentElement; 
    var svgprocess = svgprocesses[elfadiv.id]; 
    if (this.classList.contains("selected")) {
        ; // this.classList.remove("selected"); // should this delete and regroup feature (currently disabled feature)
    } else {
        this.classList.add("selected"); // also done in the groupingprocess

        // disable tunnel code
        //if (svgprocess.svgstate.match(/doneimportsvgr|doneimportsvgrareas/))
        //    svgprocess.groupimportedSVGfordrag((svgprocess.btunnelxtype ? "grouptunnelx" : "groupcontainment")); 
        //else if (svgprocess.svgstate.match(/processimportsvgrareas/))
        //    svgprocess.LoadTunnelxDrawingDetails(); 
        //else 
        //    svgprocess.groupimportedSVGfordrag((svgprocess.btunnelxtype ? "grouptunnelx" : "groupcontainment")); // reprocess again
        
        // normal case
        groupingprocess(svgprocess); 
    }
}


// returns [ {fadivid:fadivid, j:j, bbox:bbox } ]
function GetGroupsoverlayingstock(stockbbox)
{
    // find all pathgroups that overlap this stockbbox
    var groupsoverlayingstock = [ ]; 
    var svgprocesseskeys = Object.keys(svgprocesses); 
    for (var i = 0; i < svgprocesseskeys.length; i++) {
        var svgprocess = svgprocesses[svgprocesseskeys[i]]; 
        if (!svgprocess.bstockdefinitiontype) {
            console.assert(svgprocess.Lgrouppaths.length == svgprocess.pathgroupings.length); 
            
            // boundary only done case (gives option of including this raw without grouping) 
            if (svgprocess.elprocessstatus.textContent == "BD") {
                console.assert(svgprocess.pathgroupings.length == 1); 
                console.assert(svgprocess.pathgroupings[0][0] == "boundrect"); 
                var groupbbox = svgprocess.Lgrouppaths[0][0].getBBox(); 
                if (Raphael.isBBoxIntersect(stockbbox, groupbbox))
                    groupsoverlayingstock.push({fadivid:svgprocess.fadivid, j:0, bbox:groupbbox}); 
                
            // grouped done case
            } else {
                for (var j = 0; j < svgprocess.pathgroupings.length; j++) {
                    if ((svgprocess.pathgroupings[j][0] != "boundrect") && (svgprocess.pathgroupings[j][0] != "unmatchedsinglets")) {
                        var groupbbox = svgprocess.Lgrouppaths[j][0].getBBox(); 
                        if (Raphael.isBBoxIntersect(stockbbox, groupbbox))
                            groupsoverlayingstock.push({fadivid:svgprocess.fadivid, j:j, bbox:groupbbox}); 
                    }
                }
            }
        }
    }
    return groupsoverlayingstock; 
}


// finish 
// returns [ { ptype:cutouter/cutisland/etch, d:dvalue, reversed:true/false, colour:col, tstr:tstr, xtransseq:[], ytransseq:[] } ] 
function GetPathsPensSequences(svgprocess, pgi, pathgrouping, tstr) 
{
    var res = [ ]; 
    for (var i = 1; i < pathgrouping.length; i++) {
        for (var k = 0; k < pathgrouping[i].length; k++) {
            var rres = { ptype:(i == pathgrouping.length - 1 ? "etch" : (i == 1 ? "cutouter" : "cutinner")), tstr:tstr, fadivid:svgprocess.fadivid, pgi:pgi, contnum:i, pgik:k }; 
            var jr; 
            if (rres.ptype == "etch") {
                jr = pathgrouping[i][k]; 
                rres["reversed"] = false; 
            } else {
                jr = pathgrouping[i][k]/2|0; 
                rres["reversed"] = ((pathgrouping[i][k]%2) == 0); 
            }
            rres["rspnum"] = svgprocess.rlistb[jr].spnum; 
            rres["absolutescale"] = svgprocess.currentabsolutescale; 
            rres["cmatrix"] = svgprocess.rlistb[jr].cmatrix; 
            rres["dmi"] = svgprocess.rlistb[jr].dmi; 
            res.push(rres); 
        }
    }
    return res; 
}

function PenCutSeqToPoints(penseq, ftol)
{
    penseq["xtransseq"] = [ ]; 
    penseq["ytransseq"] = [ ]; 
    
    // we should transform paths across preserving arcs
    var dtrans = Raphael.mapPath(penseq.dmi, penseq.cmatrix); 
    if (penseq.absolutescale !== 1)
        dtrans = Raphael.mapPath(dtrans, Raphael.matrix(penseq.absolutescale, 0, 0, Math.abs(penseq.absolutescale), 0, 0))
    dtrans = Raphael.transformPath(dtrans, penseq.tstr); 
    var pts = PolySorting.flattenpath(dtrans, cosangdot, ftol); 

    // maybe keep as segment objects, not in xtransseq arrays
    for (var j = 0; j < pts.length; j++) {
        penseq.xtransseq.push(pts[j][0])
        penseq.ytransseq.push(pts[j][1])
    }        
}

function PenCutSeqsToPltCode(pencutseqs, stockbbox)
{
    lc = [ "POST: https://bitbucket.org/goatchurch/laserplacer\n" ];  
    lc.push("START\n"); 
    lc.push("'(name of files and entities loaded go here)\n"); 
    lc.push("%4 1000;\n", "%5 1000;\n", "%6 100;\n", "%7 10;\n", "%8 10;\n", "%9 10;\n"); 
    
    var currx, curry, currsp, currvs; 
    var jointol = 0.1; 
    // origin to offset is stockbbox.x, stockbbox.y2-; 
    
    // [ { ptype:cutouter/cutisland/etch, d:dvalue, reversed:true/false, colour:col, tstr:tstr, xtransseq:[], ytransseq:[] } ] 
    for (var i = 0; i < pencutseqs.length; i++) {
        var pencutseq = pencutseqs[i]; 
        var sp = (pencutseq.ptype == "etch" ? 1 : 2); 
        var n = pencutseq.xtransseq.length; 
        var p0x = (pencutseq.reversed ? pencutseq.xtransseq[n-1] : pencutseq.xtransseq[0]); 
        var p0y = (pencutseq.reversed ? pencutseq.ytransseq[n-1] : pencutseq.ytransseq[0]); 
        var bliftpen = ((i == 0) || (Math.hypot(currx - p0x, curry - p0y) > jointol)); 
        var bchangepen = ((i == 0) || (sp != currsp)); 
        if (bliftpen || bchangepen) {
            if (i != 0)
                lc.push("PU;\n"); 
            lc.push("VS 1000;\n"); 
            currvs = 1000; 
            lc.push("PA "+(p0x-stockbbox.x).toFixed(2)+","+(stockbbox.y2-p0y).toFixed(2)+";\n");  // flipping the y
            if (bchangepen)
                lc.push("SP "+sp+";\n"); 
            lc.push("PD;\n"); 
            currsp = sp; 
        }
        var vs = (pencutseq.ptype == "etch" ? 500 : 140); 
        if (vs != currvs) 
            lc.push("VS "+vs+";\n"); 
        currvs = vs;  
        currx = p0x; 
        curry = p0y; 
            
        for (var j = 1; j < n; j++) {
            var rj = (pencutseq.reversed ? n-1-j : j); 
            currx = pencutseq.xtransseq[rj]; 
            curry = pencutseq.ytransseq[rj]; 
            lc.push("PA "+(currx-stockbbox.x).toFixed(2)+","+(stockbbox.y2-curry).toFixed(2)+";\n"); 
        }
    }

    lc.push("PU;\n", "VS 1000;\n", "PU;\n", "PA 0,0;\n", "!PG;\n"); 
    return lc; 
} 



var Dpens = null; 

function pencutordercompare(a, b)   // see GetPathsPensSequences for codes
{
    // all penmarks to happen first
    if (a.ptype == "etch") {
        if (b.ptype != "etch")
            return -1; 
        return (a.xtransseq[0] - b.xtransseq[0]); 
    } else if (b.ptype == "etch")
        return 1; 
    
    // then by each file
    if (a.fadivid != b.fadivid) 
        return (a.fadivid < b.fadivid ? -1 : 1); 
        
    // then by each object
    if (a.pgi != b.pgi)
        return (a.pgi - b.pgi);

    // cut inner types first
    if (a.ptype != b.ptype)
        return (a.ptype = "cutinner" ? -1 : 1); 
    
    // then in order of contours (only applies to inner contours, of which there can be several)
    if (a.contnum != b.contnum)
        return (a.contnum - b.contnum);

    // then sequentially along the contour
    return (a.pgik - b.pgik);
}


var PenCutAnimation = function(svgstockprocess, pencutseqs) 
{
    this.pencutanimtimeout = null; 
    this.svgstockprocess = svgstockprocess; 
    this.pencutseqs = pencutseqs; 
    this.elstockprocess = document.getElementById(svgstockprocess.fadivid); 
    this.elseqindex = this.elstockprocess.getElementsByClassName("pencutseqindex")[0]; 
    this.seqindex = parseInt(this.elseqindex.value); 
    if (this.seqindex >= this.pencutseqs.length)
        this.seqindex = 0; 
    this.seqseqindex = -1; 
    this.pencutanimtimeout = null; 
    this.svgstockprocess.rjspath = paper1.path("M0,0").attr({stroke:"red", "stroke-width":gcutstrokewidth}); 
    svgstockprocess.rjsnode = paper1.circle(0, 0, 0).attr({fill:"blue", "stroke":"none", "fill-opacity":0.5}); 
    this.rjspath = paper1.path("M0,0").attr({stroke:"red", "stroke-width":gcutstrokewidth}); 
    this.rjslinelink = paper1.path("M0,0").attr({stroke:"yellow", "stroke-width":gcutstrokewidth}); 
    this.rjslinecurr = paper1.path("M0,0").attr({stroke:"cyan", "stroke-width":gcutstrokewidth}); 
    this.rjsnode = paper1.circle(0, 0, gcutstrokewidth*2+20).attr({fill:"blue", "stroke":"none", "fill-opacity":0.5}); 
    this.elstockprocess.getElementsByClassName("pencutseqcount")[0].textContent = this.pencutseqs.length; 
    this.prevx = null; 
    this.prevy = null; 
    this.advancetime = 500; 
}

PenCutAnimation.prototype.pauseAnimation = function() 
{
    if (this.pencutanimtimeout != null)  { 
        clearTimeout(this.pencutanimtimeout); 
        this.pencutanimtimeout = null; 
    }
}

PenCutAnimation.prototype.clearAnimation = function() 
{
    this.pauseAnimation(); 
    this.rjspath.remove(); 
    this.rjsnode.remove(); 
    this.rjslinecurr.remove(); 
    this.rjslinelink.remove(); 
}


PenCutAnimation.prototype.advancenodeD = function() 
{
    var pencutseq = this.pencutseqs[this.seqindex]; 
    this.seqseqindex++; 
    if ((this.seqseqindex == 0) || (this.seqseqindex >= pencutseq.xtransseq.length)) {
        if (this.seqseqindex !== 0)
            this.seqindex++; 
        this.elseqindex.value = this.seqindex; 
        if (this.seqindex == this.pencutseqs.length)
            return false; // no callback
        pencutseq = this.pencutseqs[this.seqindex]; 
        var dseq = [ ]; 
        
        for (var j = 0; j < pencutseq.xtransseq.length; j++) {
            var jr = (pencutseq.reversed ? pencutseq.xtransseq.length - 1 - j : j); 
            dseq.push("L", pencutseq.xtransseq[jr], pencutseq.ytransseq[jr]); 
        }
        dseq[0] = "M"; 
        this.rjspath.attr("path", dseq); 
        this.seqseqindex = 0; 
    }
    
    var ir = (pencutseq.reversed ? pencutseq.xtransseq.length - 1 - this.seqseqindex : this.seqseqindex); 
    var px = pencutseq.xtransseq[ir]; 
    var py = pencutseq.ytransseq[ir]; 
    this.rjsnode.attr({cx:px, cy:py}); 
    if (this.prevx !== null) { 
        var d = ["M", this.prevx, this.prevy, "L", px, py]; 
        this.rjslinecurr.attr("path", d); 
        if (this.seqseqindex === 0) 
            this.rjslinelink.attr("path", d); 
    }
    this.prevx = px; 
    this.prevy = py; 
    return true; 
}


PenCutAnimation.prototype.advancenodeLooper = function() 
{
    this.pencutanimtimeout = null; 
    if (this.advancenodeD())
        this.pencutanimtimeout = setTimeout(this.advancenodeLooper.bind(this), this.advancetime); 
    else
        this.elstockprocess.getElementsByClassName("pencutseqanimate")[0].classList.remove("selected"); 
}


var pencutanimation_one = null; 
var Dsvgstockprocess = null; 
function pencutseqanimate(svgstockprocess)
{
Dsvgstockprocess = svgstockprocess; 
    if (!svgstockprocess.Dpencutseqs)
        return; 
    var elfadiv = document.getElementById(svgstockprocess.fadivid); 
    var elanimbutt = elfadiv.getElementsByClassName("pencutseqanimate")[0]; 
    elanimbutt.classList.toggle("selected"); 
    
    if (elanimbutt.classList.contains("selected")) {
        if (Dpens !== null)
            Dpens.remove(); 
        Dpens = null; 

        if (pencutanimation_one !== null)
            pencutanimation_one.clearAnimation(); 
        pencutanimation_one = new PenCutAnimation(svgstockprocess, svgstockprocess.Dpencutseqs); 
        pencutanimation_one.advancenodeLooper();   // gets it into the timeout loop
    } else {
        if (pencutanimation_one !== null)
            pencutanimation_one.pauseAnimation(); 
    }
}

function plotpencutseqadvance(svgstockprocess, iadvance)
{
Dsvgstockprocess = svgstockprocess; 
    if (!svgstockprocess.Dpencutseqs)
        return; 
    if (pencutanimation_one !== null) {
        pencutanimation_one.pauseAnimation(); 
        pencutanimation_one.elstockprocess.getElementsByClassName("pencutseqanimate")[0].classList.remove("selected"); 
        if (iadvance == 1) {
            pencutanimation_one.advancenodeD(); 
        } else {
            pencutanimation_one.seqindex--; 
            pencutanimation_one.seqseqindex = -1; 
            this.prevx = null; 
            pencutanimation_one.advancenodeD(); 
        }
    }
}
// maybe these should be members of svgprocess (when process is a stock)
function plotpencutseq(svgstockprocess, iadvance)
{
    if (pencutanimation_one !== null)
        pencutanimation_one.pencutseqclearanimate(); 
    var elstockprocess = document.getElementById(svgstockprocess.fadivid); 
    var elseqindex = elstockprocess.getElementsByClassName("pencutseqindex")[0]; 
    console.log(elseqindex); 
    var i = parseInt(elseqindex.value) + iadvance; 
    elseqindex.value = i; 
    
    var pencutseq = svgstockprocess.Dpencutseqs[i]; 
    var dseq = [ ]; 
    for (var j = 0; j < pencutseq.xtransseq.length; j++) 
        dseq.push("L", pencutseq.xtransseq[j], pencutseq.ytransseq[j]); 
    dseq[0] = "M"; 

    svgstockprocess.rjspath.attr("path", dseq); 
}

function genpathorderonstock() 
{
    var elfadiv = this.parentElement; 
    var svgstockprocess = svgprocesses[elfadiv.id]; 
    console.assert(svgstockprocess.bstockdefinitiontype); 
    var stockbbox = svgstockprocess.Lgrouppaths[0][0].getBBox(); 

    var groupsoverlayingstock = GetGroupsoverlayingstock(stockbbox); 
    
    // collect all the penciled edges into the su
    var pencutseqs = [ ]; 
    for (var i = 0; i < groupsoverlayingstock.length; i++) {
        var svgprocess = svgprocesses[groupsoverlayingstock[i].fadivid]; 
        var gj = groupsoverlayingstock[i].j; 
        var pencutseq = GetPathsPensSequences(svgprocess, gj, svgprocess.pathgroupings[gj], svgprocess.pathgroupingtstrs[gj].tstr); 
        pencutseqs = pencutseqs.concat(pencutseq); 
    }
    
    // make the point sequences for each path and do all etches from left to right
    for (var i = 0; i < pencutseqs.length; i++) {
        PenCutSeqToPoints(pencutseqs[i], 0.5);
        if (pencutseqs[i].ptype == "etch")
            pencutseqs[i].reversed = (pencutseqs[i].xtransseq[0] > pencutseqs[i].xtransseq[pencutseqs[i].xtransseq.length - 1]); 
    }

    console.log("pencutseqs", pencutseqs); 
    pencutseqs.sort(pencutordercompare);   
    console.log("pencutseqsordered", pencutseqs); 


    // all in one go now
    var dseq = [ ]; 
    for (var i = 0; i < pencutseqs.length; i++) {
        var pencutseq = pencutseqs[i]; 
        var pn = pencutseq.xtransseq.length; 
        for (var j = 0; j < pencutseqs[i].xtransseq.length; j++) {
            var jr = (pencutseq.reversed ? pn - 1 - j : j); 
            dseq.push("L", pencutseq.xtransseq[jr], pencutseq.ytransseq[jr]); 
        }
    }
    dseq[0] = "M"; 

if (Dpens !== null)
    Dpens.remove(); 
Dpens = paper1.path(dseq).attr("stroke-width", gcutstrokewidth); 

    svgstockprocess.Dpencutseqs = pencutseqs; 
Dsvgstockprocess = svgstockprocess; 
    elfadiv.getElementsByClassName("pencutseqcount")[0].textContent = pencutseqs.length; 
    
    AutoDownloadBlob(PenCutSeqsToPltCode(pencutseqs, stockbbox), "pencut.anc"); 
}




var gdrawstrokewidth = 1.0; 
var gcutstrokewidth = 0.8; 
function scalestrokewidths(fss)
{
    gdrawstrokewidth *= fss; 
    gcutstrokewidth *= fss; 
    var fadivids = Object.keys(svgprocesses); 
    for (var i = 0; i < fadivids.length; i++) 
        svgprocesses[fadivids[i]].scalestrokewidth(gdrawstrokewidth, gcutstrokewidth); 
}


// called when a return happens in the scale input
function rescalefileabs(elfadiv)
{
    var newabsolutescale = parseFloat(elfadiv.getElementsByClassName("tfscale")[0].value); 
    var svgprocess = svgprocesses[elfadiv.id]; 
    var relativescale = newabsolutescale/svgprocess.currentabsolutescale; // abs on yscale means -1 will reflect
    var rlistb = svgprocess.rlistb; 
    
    // rescaling the input values 
    for (var i = 0; i < rlistb.length; i++) {
        rlistb[i].path.attr("path", Raphael.mapPath(rlistb[i].path.attr("path"), Raphael.matrix(relativescale, 0, 0, Math.abs(relativescale), 0, 0))); 
    }
    
    // rescaling the groups can move them around because each is done to its centre
    for (var i = 0; i < svgprocess.Lgrouppaths.length; i++)
        svgprocess.Lgrouppaths[i][0].attr("path", Raphael.mapPath(svgprocess.Lgrouppaths[i][0].attr("path"), Raphael.matrix(relativescale, 0, 0, Math.abs(relativescale), 0, 0))); 
    svgprocess.currentabsolutescale = newabsolutescale; 
}


function importSVGfile(i, f)
{ 
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
    
    fileblock.push('<span class="fprocessstatus">VV</span>'); 
    if (!bstockdefinitiontype)
        fileblock.push('<span class="groupprocess" title="Group geometry">Group</span>'); 
    fileblock.push('<select class="dposition"></select>'); 
    if (bstockdefinitiontype) {
        fileblock.push('<input type="button" value="GenPath" class="genpathorder"/>'); 
        fileblock.push('<input type="text" class="pencutseqindex" value="0"/>/<span class="pencutseqcount">1</span>'); 
        fileblock.push('<input type="button" value="<<<" class="pencutseqback" title="go back one path"/>'); 
        fileblock.push('<input type="button" value=">" class="pencutseqadvance" title="advance on segment"/>'); 
        fileblock.push('<input type="button" value="A" class="pencutseqanimate" title="animate"/>'); 
    }
    
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


function exportThingPositions()
{
    // build up a list of thing positions for each file included
    var res = { "datecreated":new Date().toISOString() }; 
    res["svgprocesses"] = [ ]; 
    var svgprocesseskeys = Object.keys(svgprocesses); 
    for (var i = 0; i < svgprocesseskeys.length; i++) {
        var svgprocess = svgprocesses[svgprocesseskeys[i]]; 
        res["svgprocesses"].push(svgprocess.jsonThingsPositions()); 
    }
    AutoDownloadBlob([JSON.stringify(res, null, 2)], "thingpositions.json"); 
}
