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
    $("#readingcancel").text("exportPLT"); 
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
        $("#readingcancel").text(i+"/"+rlist.length); 
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
    $("#readingcancel").text("exportPLT"); 
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
        $("#readingcancel").text(i+"/"+rlist.length); 
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
            for (var j = 0; j < mainthingsposition.svgprocesses.length; j++) {
                if ((!mainthingsposition.svgprocesses[j].done) && (svgprocess.fname == mainthingsposition.svgprocesses[j].fname)) {
                    svgprocess.applyThingsPosition(mainthingsposition.svgprocesses[j]); 
                    mainthingsposition.svgprocesses[j].done = true; 
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
        elimportedthingpos.insertAdjacentHTML("beforeend", "<option>"+(mainthingsposition.svgprocesses[j].done?"-- ":"")+mainthingsposition.svgprocesses[j].fname+"</option>"); // can't put colours into option tag
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
function GetPathsPensSequences(svgprocess, pathgrouping, tstr) 
{
    var res = [ ]; 
    for (var i = 1; i < pathgrouping.length; i++) {
        for (var k = 0; k < pathgrouping[i].length; k++) {
            var rres = { ptype:(i == pathgrouping.length - 1 ? "etch" : (i == 1 ? "cutouter" : "cutinner")), tstr:tstr, fadivid:svgprocess.fadivid, pgi:i, pgik:k }; 
            var jr; 
            if (rres.ptype == "etch") {
                jr = pathgrouping[i][k]; 
                rres["reversed"] = false; 
            } else {
                jr = pathgrouping[i][k]/2|0; 
                rres["reversed"] = ((pathgrouping[i][k]%2) == 0); 
            }
            rres["rspnum"] = svgprocess.rlistb[jr].spnum; 
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
    
    var dtrans = Raphael.mapPath(penseq.dmi, penseq.cmatrix); 
    dtrans = Raphael.transformPath(dtrans, penseq.tstr); 
    for (var j = 0; j < dtrans.length; j++) {
        penseq.xtransseq.push(dtrans[j][dtrans[j].length-2])
        penseq.ytransseq.push(dtrans[j][dtrans[j].length-1])
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

function pencutordercompare(a, b)
{
    if (a.ptype == "etch") {
        if (b.ptype != "etch")
            return -1; 
        return (a.xtransseq[0] < b.xtransseq[0]); 
    }
    if (b.ptype == "etch")
        return 1; 
    
    if (a.fadivid != b.fadivid) 
        return (a.fadivid < b.fadivid ? -1 : 1); 
        
    if (a.pgi != b.pgi)
        return (a.pgi - b.pgi);
        
    return (a.pgik - b.pgik);
}


function genpathorderonstock() 
{
    var elfadiv = this.parentElement; 
    var svgstockprocess = svgprocesses[elfadiv.id]; 
    console.assert(svgstockprocess.bstockdefinitiontype); 
    var stockbbox = svgstockprocess.Lgrouppaths[0][0].getBBox(); 

    var groupsoverlayingstock = GetGroupsoverlayingstock(stockbbox); 
console.log("groups we will merge in", groupsoverlayingstock); 
    
    // collect all the penciled edges into the su
    var pencutseqs = [ ]; 
    for (var i = 0; i < groupsoverlayingstock.length; i++) {
        var svgprocess = svgprocesses[groupsoverlayingstock[i].fadivid]; 
        var gj = groupsoverlayingstock[i].j; 
        var pencutseq = GetPathsPensSequences(svgprocess, svgprocess.pathgroupings[gj], svgprocess.pathgroupingtstrs[gj].tstr); 
        pencutseqs = pencutseqs.concat(pencutseq); 
console.log("pencutseq", pencutseq); 
    }
    
    for (var i = 0; i < pencutseqs.length; i++) 
        PenCutSeqToPoints(pencutseqs[i], 0.1);

    console.log("pencutseqs", pencutseqs); 
    pencutseqs.sort(pencutordercompare);   
    console.log("pencutseqsordered", pencutseqs); 

    // all in one go now
    var dseq = [ ]; 
    for (var i = 0; i < pencutseqs.length; i++) {
        for (var j = 0; j < pencutseqs[i].xtransseq.length; j++) 
            dseq.push("L", pencutseqs[i].xtransseq[j], pencutseqs[i].ytransseq[j]); 
    }
    dseq[0] = "M"; 

if (Dpens !== null)
    Dpens.remove(); 
Dpens = paper1.path(dseq); 

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
    var bstockdefinitiontype = f.name.match(/^stockdef/); 

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
    if (bstockdefinitiontype)
        fileblock.push('<input type="button" value="GenPath" class="genpathorder"/>'); 
    
    fileblock.push('</div>'); 
    elfilearea.insertAdjacentHTML("beforeend", fileblock.join("")); 

    // now the actual process (which has links into the control panel just made
    var svgprocess = new SVGfileprocess(f.name, fadivid, bstockdefinitiontype); 
    svgprocesses[fadivid] = svgprocess; 

    var elfadiv = document.getElementById(fadivid); 
    elfadiv.getElementsByClassName("delbutton")[0].onclick = deletesvgprocess; 
    if (bstockdefinitiontype) {
        elfadiv.getElementsByClassName("genpathorder")[0].onclick = genpathorderonstock; 
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
    AutoDownloadBlob([JSON.stringify(res)], "thingpositions.json"); 
}
