

function getspnumsselected(fadivid)
{
    var spnumscp = [ ]; 
    var elcolspans = document.getElementById(fadivid).getElementsByClassName("spnumselected"); 
console.log(elcolspans);    
    for (var i = 0; i < elcolspans.length; i++)
        spnumscp.push(parseInt(elcolspans[i].id.match(/\d+$/g)[0]));  // _spnum(\d+) 
    return spnumscp; 
}



var wingdingtriplesymbols = [ "&#9898;",  // open circle
                              "&#9899;",  // filled circle
                              "&#x2700;", // scissors
                              "&#x270E;", // pencil
                              "&#x2701;", // blade scissors
                              "&#x2B20;" ]; // pentagon
// have to handle the fact that the symbols get converted
var wingdingtriplesymbolsU = [ ]; 
for (var i = 0; i < wingdingtriplesymbols.length; i++) {
    var tmp = document.createElement("span"); 
    tmp.innerHTML = wingdingtriplesymbols[i]; 
    wingdingtriplesymbolsU.push(tmp.textContent); 
}


// this is attached to the select class=dropdownlayerselection object and puts stuff into the layerclasslist
function makelayers(lthis) 
{
    var elfadiv = document.getElementById(lthis.fadivid); 
    var layerselectindex = elfadiv.getElementsByClassName("dropdownlayerselection")[0].selectedIndex; 
    var layerclassdiv = elfadiv.getElementsByClassName("layerclasslist")[0]; 
console.log("makelayers", layerselectindex); 
    if (layerselectindex == 0) {
        layerclassdiv.style.display = "none";
        return; 
    }
    
    // layerselectindex = 1 colour; 2 class; 3 colclass; 4 delete
    layerclassdiv.style.display = "block"; 
    layerclassdiv.innerHTML = "<ul></ul>"; 
    var layerclassul = layerclassdiv.getElementsByTagName("ul")[0]; 
    var rlistb = lthis.rlistb; 

    var splcnamematch = { }; 
    for (var i = 0; i < rlistb.length; i++) {
        var splc = (layerselectindex == 1 ? rlistb[i].col : (layerselectindex == 2 ? rlistb[i].layerclass : (rlistb[i].layerclass+" | "+rlistb[i].col))); 
        if (splcnamematch[splc] == undefined) {
            console.log(splc); 
            var layerblock = ["<li>"]; 
            layerblock.push('<div class="wingding3stoggle">'+wingdingtriplesymbols[1]+"</div>"); 
            layerblock.push('<div class="wingding3stoggle">'+wingdingtriplesymbols[2]+"</div>"); 
            layerblock.push('<div class="wingding3stoggle">'+wingdingtriplesymbols[5]+"</div>"); 
            
            // U+1F5DA increase font size
            // U+1F5DB decrease font size
            
            layerblock.push('<div class="layerclasscol" style="background:'+rlistb[i].col+'"> </div>'); 
            layerblock.push('<div class="layerclassname"><span>'+splc+'</span></div>'); 
            layerblock.push("</li>"); 
            layerclassul.insertAdjacentHTML("beforeend", layerblock.join("")); 
            //document.getElementById(spnumid).onclick = function() { this.classList.toggle("spnumselected"); }; 
            splcnamematch[splc] = 99; 
        }
    }

    // add the toggle feature onto each of these wingdingies
    var wingding3stoggles = layerclassul.getElementsByClassName("wingding3stoggle"); 
    for (var i = 0; i < wingding3stoggles.length; i++) {
        wingding3stoggles[i].onclick = function() { 
            var wdi = wingdingtriplesymbolsU.indexOf(this.textContent); 
            console.log(this.textContent, wdi); 
            this.textContent = wingdingtriplesymbolsU[wdi + ((wdi%2)==0 ? 1 : -1)]; 
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
