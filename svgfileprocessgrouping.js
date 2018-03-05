

// move these out
function makelayers() 
{
    console.log("hi there"); 
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
