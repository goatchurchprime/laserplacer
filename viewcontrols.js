var paper1 = null; 
var paper1scale = 1; 
var paper1x0 = 0; 
var paper1y0 = 0; 

var Rmmscalebar = null; 
var fixedscalebar = null;
var fixedscalebartext = null;


function setviewboxfrompaperscale()
{
	paper1.setViewBox(paper1x0*paper1scale, paper1y0*paper1scale, paper1.width*paper1scale, paper1.height*paper1scale); 
	fixedscalebar.transform("t"+(paper1x0*paper1scale+fixedscalebar.attr("x")*(paper1scale-1))+","+(paper1y0*paper1scale+(fixedscalebar.attr("y")+fixedscalebar.attr("height"))*(paper1scale-1))); 
	fixedscalebartext.transform("t"+(paper1x0*paper1scale+fixedscalebartext.attr("x")*(paper1scale-1)+fixedscalebar.attr("width")/2)+","+(paper1y0*paper1scale+(fixedscalebartext.attr("y")-fixedscalebartext.attr("height"))*(paper1scale-1)-8)); 
}

function scalestrokewidth(fss)
{
	for (var fadivid in svgprocesses) {
		if (svgprocesses.hasOwnProperty(fadivid)) {
			if (svgprocesses[fadivid].Lgrouppaths !== undefined)
				svgprocesses[fadivid].scalestrokewidth(fss); 
		}
	}
}

function setraphsize() 
{
    var divpaper1 = document.getElementById("paper1"); 
    var divwholewindow = document.getElementById("wholewindow"); 
    var divpanelheader = document.getElementById("panelheader"); 
    paper1.setSize(divpaper1.offsetWidth, divwholewindow.offsetHeight - divpanelheader.offsetHeight - 7); 
	fixedscalebar.attr("y", paper1.height-20); 
	fixedscalebartext.attr("y", paper1.height-25); 
}

function togglebackgroundcolour() 
{ 
    var c = document.getElementById("paper1").style.background; 
    document.getElementById("paper1").style.background = document.getElementById("togglebackgroundcolour").style.background; 
    document.getElementById("togglebackgroundcolour").style.background = c; 
}

function updatepixwidth()
{ 
    if (Rmmscalebar != null) {
        Rmmscalebar.remove(); 
        Rmmscalebar = null; 
    }
    var mmpixwidth = parseFloat($("#mmpixwidth").val()); 
    var woodwidth = 100; 
    var woodheight = 100; 
    Rmmscalebar = paper1.path("M10,10h"+(woodwidth*mmpixwidth)+"v5 M10,10v"+(woodheight*mmpixwidth)+"h5").attr("stroke", "#888"); 
}


var zoomfuncsobj = {
	ex: 0, 
	ey: 0,
	ed: 0,
    bmd: null, 
    Bpaper1scale: 1, 
	Bpaper1x0: 0,
	Bpaper1y0: 0,
	mousezoompoint: function(scalefactor) {
		var paperelement = document.getElementById("paper1");
		var mx = this.ex - paperelement.offsetLeft - 2; 
		var my = this.ey - paperelement.offsetTop - 2; 
		//console.log(e.originalEvent.deltaY, mx, my, event); 
		var cx = (mx + this.Bpaper1x0)*this.Bpaper1scale; 
		var cy = (my + this.Bpaper1y0)*this.Bpaper1scale; 
		paper1scale = this.Bpaper1scale*scalefactor; 
		paper1x0 = cx/paper1scale - mx; 
		paper1y0 = cy/paper1scale - my; 
		setviewboxfrompaperscale(); 
	},
	mousedownoffshape: function(e) { 
		this.ex = e.clientX; 
		this.ey = e.clientY; 
		this.bmd = (e.ctrlKey ? "" : (e.shiftKey ? "zoom" : "drag")); 
		this.Bpaper1scale = paper1scale; 
		this.Bpaper1x0 = paper1x0; 
		this.Bpaper1y0 = paper1y0; 
		e.stopPropagation(); e.preventDefault(); 
	},
    mousemoveoffshape: function(e) {
		if (this.bmd== "zoom")
			this.mousezoompoint(2**(-(e.clientX - this.ex)/300)); 
		else if (this.bmd == "drag") {
			paper1x0 = this.Bpaper1x0 - (e.clientX - this.ex); 
			paper1y0 = this.Bpaper1y0 - (e.clientY - this.ey); 
			setviewboxfrompaperscale(); 
		}
	},
	mouseupoffshape: function(e) {
		if (this.bmd) {
			this.bmd = null; 
			e.stopPropagation(); e.preventDefault(); 
		}
	},
	scrollwheelzoom: function(e) {
		//console.log(e); 
		if (e.handleObj && (e.handleObj.type == "DOMMouseScroll"))  {// firefox issue
			//console.log(e.originalEvent); 
			this.ex = e.originalEvent.clientX; 
			this.ey = e.originalEvent.clientY; 
			this.ed = (e.originalEvent.detail > 0); 
		} else {
			this.ex = e.clientX; 
			this.ey = e.clientY; 
			this.ed = (e.originalEvent.deltaY > 0); 
		}
		this.Bpaper1scale = paper1scale; 
		this.Bpaper1x0 = paper1x0; 
		this.Bpaper1y0 = paper1y0; 
		this.mousezoompoint(this.ed ? 1.5 : 1/1.5); 
		e.stopPropagation(); e.preventDefault(); 
		return false; 
	}
}


var currbackground = ""; 
function setfiledragoverfunctions(paper1el)
{
    paper1el.ondragover = function(e) {  e.stopPropagation(); e.preventDefault(); }; 
    paper1el.ondragenter = function(e) {
        e.stopPropagation(); e.preventDefault(); 
        currbackground = document.getElementById("paper1").style.background; 
        document.getElementById("paper1").style.background = "#ffa"; 
    };
    paper1el.ondragleave = function(e) {
        e.stopPropagation(); e.preventDefault(); 
        document.getElementById("paper1").style.background = currbackground;
        currbackground = "";  
    }; 
    paper1el.ondrop = function(e) {
        e.stopPropagation(); e.preventDefault(); 
        document.getElementById("paper1").style.background = currbackground;
        currbackground = "";  
        importSVGfiles(e.dataTransfer.files); 
    };
}

