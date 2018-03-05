

function getspnumsselected(fadivid)
{
    var spnumscp = [ ]; 
    var elcolspans = document.getElementById(fadivid).getElementsByClassName("spnumselected"); 
console.log(elcolspans);    
    for (var i = 0; i < elcolspans.length; i++)
        spnumscp.push(parseInt(elcolspans[i].id.match(/\d+$/g)[0]));  // _spnum(\d+) 
    return spnumscp; 
}


function makelayers() 
{
    console.log("hi there"); 

    // we can decide to make layers by col or layerclass
    var elfadiv = this.parentElement; 
    var svgprocess = svgprocesses[elfadiv.id]; 
    svgprocess.fadivid; 
    var layerclassdiv = document.getElementById(svgprocess.fadivid).getElementsByClassName("layerclasslist")[0]; 
    if (layerclassdiv.style.display === "block") {
        layerclassdiv.style.display = "hide";
        return; 
    }

    layerclassdiv.style.display = "block"; 
    layerclassdiv.innerHTML = "<ul></ul>"; 
    var layerclassul = layerclassdiv.getElementsByTagName("ul")[0]; 

    var rlistb = svgprocess.rlistb; 

    // this should be done on the input
    var colcountmap = { }; 
    var layerclasscountmap = { };
    for (var i = 0; i < rlistb.length; i++) {
        colcountmap[rlistb[i].col] = 1; 
        layerclasscountmap[rlistb[i].layerclass] = 1; 
    }
    console.log("layerclasscountmap", layerclasscountmap); 
    console.log("colcountmap", colcountmap); 
    var bcollayers = true; 
    var bclasslayers = false; 
    if ((Object.keys(layerclasscountmap).length >= 2) && (layerclasscountmap[""] === undefined)) {
        bclasslayers = true; 
    }
    
    var splcnamematch = { }; 
    for (var i = 0; i < rlistb.length; i++) {
        var splc = rlistb[i].col; 
        if (bclasslayers) 
            splc = (bcollayers ? rlistb[i].layerclass+"*"+rlistb[i].col :  rlistb[i].layerclass); 
        
        if (splcnamematch[splc] == undefined) {
            console.log(splc); '<select class="dposition"></select>'
            layerclassul.insertAdjacentHTML("beforeend", '<li><select><option>Hide</option><option>Pen</option><option>ContourCut</option><option>SiceCut</option></select>'+splc+'</li>'); 
            //document.getElementById(spnumid).onclick = function() { this.classList.toggle("spnumselected"); }; 
            splcnamematch[splc] = 99; 
        }
    }

/*
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
*/    
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
// do this with a settimeout to get the class selected to be visible?        
        groupingprocess(svgprocess); 
    }
}


var closedistgrouping = 0.2; // should be a setting
function groupingprocess(svgprocess) 
{
    console.log(svgprocess.fadivid, document.getElementById(svgprocess.fadivid)); 
    var elgroupprocess = (svgprocess.bstockdefinitiontype ? null : document.getElementById(svgprocess.fadivid).getElementsByClassName("groupprocess")[0]); 
    if (elgroupprocess != null)
        elgroupprocess.classList.add("working")

    // action this way so as to get the working-green thing lit up so we know it's working
    setTimeout(function() {
        // normal case
        var spnumscp = getspnumsselected(svgprocess.fadivid); 

        // pathgroupings are of indexes into rlistb specifying the linked boundaries and islands (*2+(bfore?1:0)), and engraving lines in the last list (not multiplied)
        svgprocess.elprocessstatus.textContent = "Gstart"; 
        svgprocess.pathgroupings = ProcessToPathGroupings(svgprocess.rlistb, closedistgrouping, spnumscp, svgprocess.fadivid, svgprocess.elprocessstatus); 
        svgprocess.elprocessstatus.textContent = "GD"; 
        svgprocess.updateLgrouppaths(); 
        updateAvailableThingPositions(); 

        if (elgroupprocess != null) {
            elgroupprocess.classList.remove("working"); 
            elgroupprocess.classList.remove("selected"); 
        }
    }, 1); 
}
