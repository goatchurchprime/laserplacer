# README #

Process and join up polygons and shapes (and etched lines) from an SVG file so they can be moved and placed on the bed for a laser cutter


### Implementation notes

FileArea tracks each file import.  
spnumcols are the layers or colours that you can select

SVGprocesses is an array of SVGfileprocess recording the current state of the file, whether it has been loaded or grouped yet.
Select a process from it as k = SVGprocesses["fa0"]

This uses the function importSVGpathR() that is called-back recursively and uses a cstack and pstack to keep track of how much is left to do and how deep the transformation values go.

Now you can look at its contents.
SVGprocess.spnummap maps from colours to colour numbers.  
SVGprocess.spnumlist maps colour numbers back to colours, but also provides an index for rlistb elements via spnum

Each rlistb element is of form {path:raphaeljspath, spnum:spnum, d:original-d-code, mi:move-number (how many Ms deep), cmatrix:transform-matrix}

processSingleSVGpath() sorts out the colours, then calls processSingleSVGpathfinal() which slices up the path code at every M-code in the sequence so they can be treated separately.

-----

Second stage is to click on GGoup that groups these paths by contours and engravings for individual component drag.  You can reselect the X labels on the colours to control which are the cut types and click on GGoup a second time

Function that groups is called groupimportedSVGfordrag()

This calls ProcessToPathGroupings() and then applies the drag and move capabilities to each of the path components

tells about the colours you have.  which colours are selected

The colours that are not selected (white X) are included in the list spnumscp and used for ProcessToPathGroupings() and in 


To run the components of the polygon sorting from the javascript console, we have this sequence of functions:

k = SVGprocesses["fa0"]
s = PolySorting.FindClosedPathSequencesD(CopyPathListOfColour(k.rlistb, 1), 2, false); 
j = MakeContourcurvesFromSequences(CopyPathListOfColour(k.rlistb, null), s); 




