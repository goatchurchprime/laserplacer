


function getspnumCSP(fadivid, layerselectindextype)
{
    var elfadiv = document.getElementById(fadivid); 
    var ellayerclasslist = elfadiv.getElementsByClassName("layerclasslist");
    if (ellayerclasslist.length == 0)
        return null; 
    var spnumCSP = { "layerselectindextype":layerselectindextype, "cutpaths": [ ], "slotpaths": [ ], "penpaths": [ ] }; 
    var elspnumids = ellayerclasslist[0].getElementsByTagName("li"); 
    for (var i = 0; i < elspnumids.length; i++) {
        console.assert(parseInt(elspnumids[i].id.match(/\d+$/g)[0]) == i); // _sspnum(\d+) 
        var wd3sel = elspnumids[i].getElementsByClassName("wingding3stoggle"); 
        var bvisible = (wd3sel[0].textContent == wingdingtriplesymbolsU[1]); 
        var bcuttype = (wd3sel[1].textContent == wingdingtriplesymbolsU[2]); 
        var bslottype = (wd3sel[2].textContent == wingdingtriplesymbolsU[4]); 
        if (bvisible) {
            if (bcuttype && bslottype)
                spnumCSP["slotpaths"].push(i); 
            else if (bcuttype)
                spnumCSP["cutpaths"].push(i); 
            else
                spnumCSP["penpaths"].push(i); 
        }
    }
    return spnumCSP; 
}

function setspnumCSP(fadivid, spnumCSP)
{
    console.log("setspnumCSP", spnumCSP); 
    var elfadiv = document.getElementById(fadivid); 
    //console.assert(spnumCSP.layerselectindex == elfadiv.getElementsByClassName("dropdownlayerselection")[0].selectedIndex); 
    var elspnumids = elfadiv.getElementsByClassName("layerclasslist")[0].getElementsByTagName("li"); 
    for (var i = 0; i < elspnumids.length; i++) {
        var wd3sel = elspnumids[i].getElementsByClassName("wingding3stoggle"); 
        wd3sel[0].textContent = wingdingtriplesymbolsU[0]; // set all not visible
    }
    for (var i = 0; i < spnumCSP.cutpaths.length; i++) {
        var wd3sel = elspnumids[spnumCSP.cutpaths[i]].getElementsByClassName("wingding3stoggle"); 
        wd3sel[0].textContent = wingdingtriplesymbolsU[1]; // visible
        wd3sel[1].textContent = wingdingtriplesymbolsU[2]; // cut
        wd3sel[2].textContent = wingdingtriplesymbolsU[5]; // not slot
    }
    for (var i = 0; i < spnumCSP.slotpaths.length; i++) {
        var wd3sel = elspnumids[spnumCSP.slotpaths[i]].getElementsByClassName("wingding3stoggle"); 
        wd3sel[0].textContent = wingdingtriplesymbolsU[1]; // visible
        wd3sel[1].textContent = wingdingtriplesymbolsU[2]; // cut
        wd3sel[2].textContent = wingdingtriplesymbolsU[4]; // slot
    }
    for (var i = 0; i < spnumCSP.penpaths.length; i++) {
        var wd3sel = elspnumids[spnumCSP.penpaths[i]].getElementsByClassName("wingding3stoggle"); 
        wd3sel[0].textContent = wingdingtriplesymbolsU[1]; // visible
        wd3sel[1].textContent = wingdingtriplesymbolsU[3]; // pen
        wd3sel[2].textContent = wingdingtriplesymbolsU[5]; // not slot
    }
}


var wingdingtriplesymbols = [ "&#9898;",  // open circle (visible)
                              "&#9899;",  // filled circle (hidden) 
                              "&#x2700;", // scissors
                              "&#x270E;", // pencil
                              "&#x2701;", // blade scissors (slot)
                              "&#x2B20;" ]; // pentagon (not slot)
// have to handle the fact that the symbols get converted (quick hack to avoid having non-ascii things in this file)
var wingdingtriplesymbolsU = [ ]; 
for (var i = 0; i < wingdingtriplesymbols.length; i++) {
    var tmp = document.createElement("span"); 
    tmp.innerHTML = wingdingtriplesymbols[i]; 
    wingdingtriplesymbolsU.push(tmp.textContent); 
}

function UpdateWingDingVisibility(spnumid) 
{
    console.log("UpdateWingDingVisibility", spnumid); 
    var spnum = parseInt(spnumid.match(/\d+$/g)[0]); 
    var fadivid = spnumid.match(/^[^_]+/g)[0]; 
    var svgprocess = svgprocesses[fadivid]; 
    var wd3sel = document.getElementById(spnumid).getElementsByClassName("wingding3stoggle"); 
    var bvisible = (wd3sel[0].textContent == wingdingtriplesymbolsU[1]); 
    var bcuttype = (wd3sel[1].textContent == wingdingtriplesymbolsU[2]); 
    var bslottype = (wd3sel[2].textContent == wingdingtriplesymbolsU[4]); 
    console.log(fadivid, spnum, bvisible, bcuttype, bslottype); 
    var rlistb = svgprocess.rlistb; 
    for (var i = 0; i < rlistb.length; i++) {
        if (rlistb[i].spnum === spnum) {
            if (bvisible) {
                rlistb[i].path.show(); 
                rlistb[i].path.attr("stroke-dasharray", (bcuttype ? "" : "-")); 
                rlistb[i].path.attr("stroke", (bslottype ? "#F90" : rlistb[i].col)); 
            } else {
                rlistb[i].path.hide(); 
            }
        }
    }
}

function wingding3stogglesclick()
{
    var wdi = wingdingtriplesymbolsU.indexOf(this.textContent); 
    this.textContent = wingdingtriplesymbolsU[wdi + ((wdi%2)==0 ? 1 : -1)]; 
    UpdateWingDingVisibility(this.parentElement.id); 
}


// this is attached to the select class=dropdownlayerselection object and puts stuff into the layerclasslist
// It is also used to invoke delete and makegroupings
function makelayers(lthis) 
{
    var elfadiv = document.getElementById(lthis.fadivid); 
    var layerselectindex = elfadiv.getElementsByClassName("dropdownlayerselection")[0].selectedIndex; 
    var layerclassdiv = elfadiv.getElementsByClassName("layerclasslist")[0]; 
console.log("makelayers", layerselectindex); 

    if (layerselectindex == 0) {
        layerclassdiv.style.display = "none";
        if (lthis.layerselectindextype !== null)
            lthis.spnumCSP = getspnumCSP(lthis.fadivid, lthis.layerselectindextype);  // back up the spnumCSP
        return; 
    }
    if (layerselectindex == 4) {
        layerclassdiv.style.display = "none";
        groupingprocess(lthis.fadivid);
        return; 
    }
    if (layerselectindex == 5) {
        deletesvgprocess(lthis.fadivid);
        return; 
    }
    
    // layerselectindex = 1 colour; 2 class; 3 colclass; 
    lthis.layerselectindextype = (layerselectindex == 1 ? "color" : (layerselectindex == 2 ? "class" : "colclass")); 
    layerclassdiv.style.display = "block"; 
    layerclassdiv.innerHTML = "<ul></ul>"; 
    var layerclassul = layerclassdiv.getElementsByTagName("ul")[0]; 
    var rlistb = lthis.rlistb; 

    var splcnamematch = { }; 
    lthis.nspnumcols = 0; 
    
    for (var i = 0; i < rlistb.length; i++) {
        var splc = (layerselectindex == 1 ? rlistb[i].col : (layerselectindex == 2 ? rlistb[i].layerclass : (rlistb[i].layerclass+" | "+rlistb[i].col))); 
        if (splcnamematch[splc] == undefined) {
            console.log(splc); 
            var spnumid = lthis.fadivid+"_sspnum"+lthis.nspnumcols; 
            var layerblock = ['<li id="'+spnumid+'">']; 
            layerblock.push('<div class="wingding3stoggle">'+wingdingtriplesymbols[1]+"</div>"); 
            layerblock.push('<div class="wingding3stoggle">'+wingdingtriplesymbols[2]+"</div>"); 
            layerblock.push('<div class="wingding3stoggle">'+wingdingtriplesymbols[5]+"</div>"); 
            
            layerblock.push('<div class="layerclasscol" style="background:'+rlistb[i].col+'"> </div>'); 
            layerblock.push('<div class="layerclassname"><span>'+splc+'</span></div>'); 
            layerblock.push("</li>"); 
            layerclassul.insertAdjacentHTML("beforeend", layerblock.join("")); 
            splcnamematch[splc] = lthis.nspnumcols++; 
        }
        rlistb[i].spnum = splcnamematch[splc]; // fill it in
    }
    console.assert(Object.keys(splcnamematch).length == lthis.nspnumcols); 

    // now apply any backed up spnumCSP
    if (lthis.spnumCSP === null) {
        lthis.spnumCSP = getspnumCSP(lthis.fadivid, lthis.layerselectindextype); 
        console.assert(lthis.spnumCSP.cutpaths.length == lthis.nspnumcols); 
    } else {
        console.log("jjkj", layerselectindex, lthis.spnumCSP.layerselectindextype); 
        if (lthis.layerselectindextype === lthis.spnumCSP.layerselectindextype) 
            setspnumCSP(lthis.fadivid, lthis.spnumCSP); 
        lthis.spnumCSP = getspnumCSP(lthis.fadivid, lthis.layerselectindextype); 
        var elspnumids = elfadiv.getElementsByClassName("layerclasslist")[0].getElementsByTagName("li"); 
        for (var i = 0; i < elspnumids.length; i++) 
            UpdateWingDingVisibility(elspnumids[i].id); // we also need to reset the line types from whatever state it's in if it's been changed
    }

    // add the toggle feature onto each of these wingdingies
    var wingding3stoggles = layerclassul.getElementsByClassName("wingding3stoggle"); 
    for (var i = 0; i < wingding3stoggles.length; i++) 
        wingding3stoggles[i].onclick = wingding3stogglesclick; 
}


var closedistgrouping = 0.2; // should be a setting
function groupingprocess(fadivid) 
{
    console.log(fadivid, document.getElementById(fadivid)); 
    var svgprocess = svgprocesses[fadivid]; 
    var elgroupprocess = null; 
    
    // action this way so as to get the working-green thing lit up so we know it's working
    setTimeout(function() {
        // normal case
//        if (!svgprocess.bstockdefinitiontype) 
//            svgprocess.spnumCSP = getspnumCSP(fadivid, lthis.layerselectindextype); 
        
        // pathgroupings are of indexes into rlistb specifying the linked boundaries and islands (*2+(bfore?1:0)), and engraving lines in the last list (not multiplied)
        svgprocess.elprocessstatus.textContent = "Gstart"; 
        svgprocess.pathgroupings = ProcessToPathGroupings(svgprocess.rlistb, closedistgrouping, svgprocess.spnumCSP, svgprocess.fadivid, svgprocess.elprocessstatus); 
        svgprocess.elprocessstatus.textContent = "GD"; 
        svgprocess.updateLgrouppaths(); 
        updateAvailableThingPositions(); 

        if (elgroupprocess != null) {
            elgroupprocess.classList.remove("working"); 
            elgroupprocess.classList.remove("selected"); 
        }
    }, 1); 
}
