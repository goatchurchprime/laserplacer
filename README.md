# README #

Process and join up polygons and shapes (and etched lines) from an SVG file so they can be moved and placed on the bed for a laser cutter


### Implementation notes

FileArea tracks each file import.  
spnumcols are the layers or colours that you can select

SVGprocesses is an array of SVGfileprocess recording the current state of the file, whether it has been loaded or grouped yet.
Select a process from it as k SVGprocesses["fa0"]

Now you can look at its contents.
SVGprocess.spnummap maps from colours to colour numbers.  
SVGprocess.spnumlist maps colour numbers back to colours, but also provides an index for rlistb elements via spnum

processSingleSVGpath() sorts out the colours, then calls processSingleSVGpathfinal() which slices up the path code at every M-code in the sequence so they can be treated separately.



tells about the colours you have.  which colours are selected
