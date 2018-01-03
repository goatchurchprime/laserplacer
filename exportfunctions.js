// (also contains importSVGfiles() at the bottom)


function exportSVG()
{
    var xs = new XMLSerializer();
    var data = document.getElementById("paper1").children[0]; // gets the svg element put there by Raphael
    var a = document.createElement('a');
    a.style = "display: none"; 
    var blob = new Blob([xs.serializeToString(data)], {'type':"image/svg+xml"});
    a.href = window.URL.createObjectURL(blob);
    a.download = "test.svg";
    document.body.appendChild(a); 
    a.onclick = function() { 
		document.body.removeChild(a); 
	}; 
    a.click();
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
            var blob = new Blob(lplt, {'type':"text/plain"});
            a.href = window.URL.createObjectURL(blob);
            a.style = "display: none"; 
            a.download = "test.plt";
			document.body.appendChild(a); 
			a.onclick = function() { 
				document.body.removeChild(a); 
			}; 
			a.click();
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
            var a = document.createElement('a');
            a.style = "display: none"; 
            var blob = new Blob(lplt, {'type':"text/plain"});
            a.href = window.URL.createObjectURL(blob);
            a.download = "test.plt";
			document.body.appendChild(a); 
			a.onclick = function() { 
				document.body.removeChild(a); 
			}; 
            a.click();
        }
        $("#readingcancel").text(i+"/"+rlist.length); 
    };
    exportJSONpathR(); 
}


// this works from a position of no processing or re-ordering, like was done to the cutting paths for the laser
// (we need to lightly reorder it)
function exportANC()
{
	var machinekitstats = {"xlo":-620, "xhi":520, "ylo":-190, "yhi":600, "estop":0, "enabled":1, "homed":[1, 1, 1] }; 

    var svgprocess = svgprocesses[fadividlast]; 
    var rlistb = svgprocess.rlistb; 
    
    var samplerateunit = 0.9; 
    var fac = 1.0; 
    var xtopmm = machinekitstats.xlo; 
    var ytopmm = machinekitstats.yhi; 
    var thinningtolerancemm = 1.1; 
    var breorder = true; 
    
    var rlfptseqs = [ ]; 
    var i = 0; 
    bcancelExIm = false; 
    var lgcode = undefined; 
    var ptlink = [ -xtopmm/fac, ytopmm/fac ]; // page origin
    var finalx = (machinekitstats.xlo+machinekitstats.xhi)/2; 
    
    $("#readingcancel").text("processinggcode"); 
    function exportGCODEpathR() {
        if (bcancelExIm)
            return; 
            
        if (lgcode == undefined) {
            var path = rlistb[rlfptseqs.length].path; 
            var d = path.attr("path"); 
            var dtrans = Raphael.mapPath(d, path.matrix); 
            var fpts = PolySorting.flattenpath(dtrans, cosangdot, thinningtolerancemm*fac) 
            rlfptseqs.push(fpts); 
            
            // next phase
            if (rlfptseqs.length == rlistb.length) {
                $("#readingcancel").text("ordersendinggcode"); 
                lgcode = [ "START\n", "SP 1\n" ]; 
            }
            setTimeout(exportGCODEpathR, 1); 
            return; 
        }
        
        var fpts; 
        var ddistlink = 100 + thinningtolerancemm*fac*2; 
        if (breorder) {
            var ilink = -1; 
            var ibreverse; 
            for (var i = 0; i < rlfptseqs.length; i++) {
                var lfpts = rlfptseqs[i]; 
                var ddistfront = Math.abs(lfpts[0][0] - ptlink[0]) + Math.abs(lfpts[0][1] - ptlink[1]); 
                var ddistback = Math.abs(lfpts[lfpts.length-1][0] - ptlink[0]) + Math.abs(lfpts[lfpts.length-1][1] - ptlink[1]); 
                if ((ilink == -1) || (ddistfront < ddistlink)) {
                    ddistlink = ddistfront; 
                    ilink = i; 
                    ibreverse = false; 
                }
                if (ddistback < ddistlink) {
                    ddistlink = ddistback; 
                    ilink = i; 
                    ibreverse = true; 
                }
            }
            var fpts = rlfptseqs[ilink]; 
            if (ilink != rlfptseqs.length - 1) {
                rlfptseqs[ilink] = rlfptseqs.pop(); 
            } else {
                rlfptseqs.pop(); 
            }
            if (ibreverse)
                fpts.reverse(); 
            ptlink = fpts[fpts.length - 1]; 
        } else {
            fpts = rlfptseqs.pop(); 
        }

        // uncomment to plot the flattenpath for debug viewing
        //var Lfpts = [ ]; for (var Di = 0; Di < fpts.length; Di++); Lfpts.push(fpts[Di][0]+","+fpts[Di][1]); 
        //paper1.path("M"+Lfpts.join("L")).attr("stroke", "red");  
        
        var spnum = 1; //rlistb[i].spnum;   // what's this comma clause doing???!
        if (spnum !== undefined) {
            for (var j = 0; j < fpts.length; j++) {
                var bretract = ((j == 0) && ((lgcode.length <= 4) || (ddistlink >= thinningtolerancemm*fac*2))); 
                if (bretract) {
                    lgcode.push("PU;\n"); 
                    lgcode.push("VS 1000;\n"); 
                }
                lgcode.push("PA " + (xtopmm+fpts[j][0]*fac).toFixed(2) + "," + (ytopmm-fpts[j][1]*fac).toFixed(2) + "\n"); 
                finalx = xtopmm+fpts[j][0]*fac; 
                if (bretract) {
                    lgcode.push("PD;\n"); 
                    lgcode.push("VS 500;\n"); 
                }
            }
        } else if (spnumobj) {
            console.log(TXlinestylespnum[spnumobj.linestyle]); 
        }
        
        // end or callback
        if (rlfptseqs.length != 0) {
            setTimeout(exportGCODEpathR, 1); 
        } else {
            var movex = (finalx > 0 ? finalx-100 : finalx+100);
            lgcode.push("PU;\nPA 0,0\n!PG"); 
			var a = document.createElement('a');
			var blob = new Blob(lgcode, {'type':"text/plain"});
			a.href = window.URL.createObjectURL(blob);
			a.download = "test.ngc";
            document.body.appendChild(a); 
            a.onclick = function() { 
                document.body.removeChild(a); 
            }; 
            a.click();

        }
        $("#readingcancel").text((rlist.length-rlfptseqs.length)+"/"+rlist.length); 
    };
    
    exportGCODEpathR(); 
}


var Df; 
var filecountid = 0; 
function importSVGfiles(files)
{
    for (var i = 0; i < files.length; i++) 
        importSVGfile(i, files[i]); // this function already kicks off independent loading processes
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
        this.classList.remove("selected"); 
    } else {
        this.classList.add("selected"); 
        if (svgprocess.state.match(/doneimportsvgr|doneimportsvgrareas/))
            svgprocess.groupimportedSVGfordrag((svgprocess.btunnelxtype ? "grouptunnelx" : "groupcontainment")); 
        else if (svgprocess.state.match(/processimportsvgrareas/))
            svgprocess.LoadTunnelxDrawingDetails(); 
        else 
            svgprocess.groupimportedSVGfordrag((svgprocess.btunnelxtype ? "grouptunnelx" : "groupcontainment")); // reprocess again
    }
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
    var svgprocess = new SVGfileprocess(f.name, fadivid, (fadividlast === null ? 1.0 : svgprocesses[fadividlast].drawstrokewidth)); 
    svgprocesses[fadivid] = svgprocess; 

    // create the control panel and functions for this process
    var elfilearea = document.getElementById("filearea"); 
    var fileblock = ['<div id="'+fadivid+'"><span class="delbutton" title="Delete geometry">&times;</span>', 
                       '<input class="tfscale" type="text" name="fscale" value="1.0" title="Apply scale"/>', 
                       '<b class="fname">'+f.name+'</b>: <span class="spnumcols"></span>', 
                       '<span class="fprocessstatus">VV</span>', 
                       '<span class="groupprocess" title="Group geometry">GGoup</span>', 
                     '</div>'].join(""); 
    elfilearea.insertAdjacentHTML("beforeend", fileblock); 
    var elfadiv = document.getElementById(fadivid); 
    elfadiv.getElementsByClassName("delbutton")[0].onclick = deletesvgprocess; 
    elfadiv.getElementsByClassName("fprocessstatus")[0].onclick = function() { svgprocess.bcancelIm = true; }; 
    elfadiv.getElementsByClassName("groupprocess")[0].onclick = groupsvgprocess; 
    elfadiv.getElementsByClassName("tfscale")[0].onkeydown = function(e) { if (e.keyCode == 13)  { e.preventDefault(); rescalefileabs(elfadiv) }; }; 

    
    fadividlast = fadivid; 
Dsvgprocess = svgprocess; 
Df = f;  

    var reader = new FileReader(); 
    if (bsvgizedtext) {
        svgprocess.InitiateLoadingProcess(f.svgtext); 
    } else if (bsvg) {
        reader.onload = (function(e) { svgprocess.InitiateLoadingProcess(reader.result); }); 
        reader.readAsText(f); 
    } else {
        alert("not svg type"); 
    }
}

