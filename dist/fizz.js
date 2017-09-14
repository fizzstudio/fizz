var filename = null;
var draw = null;


function match_element( obj ) { 
  return obj.element === this;
}

function match_id( obj ) { 
  return obj.id === this;
}

function match_treeitem( obj ) { 
  return obj.tree_item.element === this;
}


function generate_unique_id( base_id ) {
  var i = 0;
  var uid = base_id + "-" + i;
  while ( null != document.getElementById( uid ) ) {
    uid = base_id + "-" + ++i;
  }
  return uid;
}


window.onload = function() {
  var svgroot = document.getElementById("fizz");
  draw = new fizz(svgroot);
  draw.init();
}

function update_text( event ) {
  // console.log( event.target.value );
  // console.log( "update_text" );
  // if ( draw.selected_title ) {
  //   // console.log( "update_text" );
  //   // console.log("textContent 0");
  //   draw.selected_title.textContent = event.target.value;
  // }

  var target_el = event.target;
  var targetId = target_el.id;
  var text = target_el.value;
  if ( "title-input" == targetId ) {
    draw.update_title( text );
  } else if ( "desc-input" == targetId ) {
    draw.update_desc( text );
  }
}


function update_inputs( input_type, text ) {
  var input_el = document.getElementById( input_type + "-input" );
  input_el.value = text;
}


function update_link( event ) {
  var target_el = event.target;
  var target_id = target_el.id;

  if ( "title-input" == target_id ) {
    var link_target_value = document.querySelector("input[name=link_target]:checked").value;
    draw.add_link( target_el.value, link_target_value );
  } else {
    var link_input_el = document.getElementById( "link-url-input" );
    draw.add_link( link_input_el.value, target_el.value );
  }
}

function update_link_settings( url_value, link_target_value ) {
  document.getElementById( "link-url-input" ).value = url_value;
  document.getElementById( link_target_value ).checked = true;
}



function set_zoom( event ) {
  var zoomVal = event.target.value;
  document.getElementById("zoomValLabel").innerHTML = zoomVal;
  if ( draw.selected_el ) {
    draw.selected_el.setAttribute("data-zoom", zoomVal);
  }
}


function createSave_link() {
  var image_area = document.getElementById( "image-area" );
  // uses HTML5 features: the ‘Blob’ object and the ‘download’ attribute of the <a> element 
  var blob = new Blob([image_area.innerHTML], {type:"image/svg+xml"});
  // var download_link = document.getElementById("download");
  var download_link = document.getElementById( "download-button" );
  download_link.download = filename.replace(/\..*/, ".svg");
  download_link.href = window.URL.createObjectURL(blob);
  // document.getElementById('new-filesize').innerHTML = '(revised: ' + byteSized( blob.size ) + ')';
}



function setFileInfo ( name, filesize, lastMod ) {
  document.getElementById("file-name").innerHTML = "<strong title='last modified: " 
    + lastMod
    + "'>" + escape(name) + "</strong>";
  document.getElementById("filesize").textContent = filesize;
} 



/*
// Drawing
*/


function fizz( svgroot ) {
  this.root = svgroot;
  this.backdrop = this.root.getElementById("backdrop");
  this.canvas = this.root.getElementById("canvas");
  this.scaffolds = this.root.getElementById("scaffolds");
  this.treeview = document.getElementById("treeview");
  
  this.elements = []; // array of object for all graphical elements in the document
  this.connectors = [];

  this.active_el = null;
  this.active_obj = null;
  this.active_tree_entry = null;
  this.active_connector = null;

  this.active_scaffold = null;
  this.active_handle = null;

  this.selection_marquee = null;
  this.selected_el_list = [];

  // this.selected_el = null;
  this.selected_title = null;
  this.selected_desc = null;
  this.points = null;

  this.placeholder_text = null;

  this.layout_selections = [];

  this.buttons = null;
  this.mode = "draw-dot";

  this.pane_switch = null;
  this.pane_switch_buttons = null;
  this.panes = null;

  // file upload variables

  this.file = null;
  this.file_type = null;
  this.file_reader = null;  
  this.file_input_button = document.getElementById( "file_input" );
  this.file_save_button = document.getElementById( "file_save_button" );

  // coordinate variables
  this.coords = this.root.createSVGPoint();
  this.originpoint = this.root.createSVGPoint();

  // styles

  // TODO: add all styles to this object, rather than individual obje
  this.styles = {

  };

  this.default_style = {
    "fill": "#ffff33",
    "stroke": "#377eb8",
    "stroke-width": "1px"
  };

  this.default_text_style = {
    "fill": "black",
    "stroke": "none",
    "font-family": "Verdana, sans-serif",
    "font-size": "20px"
  };

  this.placeholder_text_style = {
    "fill": "gray",
    "stroke": "none",
    "font-family": "Verdana, sans-serif"
  };

  this.scaffold_style = {
    "fill": "none",
    "stroke": "blue",
    "stroke-width": "3px",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "stroke-dasharray": "0.5 10",
    "marker": "url(#handle)"
  };

  this.selection_marquee_style = {
    "fill": "cornflowerblue",
    "fill-opacity": "0.25"
  };

  this.handle_style = {
    "fill": "none",
    "stroke": "blue",
    "stroke-width": "2px",
    "pointer-events": "all"
  };

  this.connector_style = {
    "fill": "none",
    "stroke": "blue",
    "stroke-width": "8px",
    "stroke-linecap": "round",
    "marker-end": "url(#endArrow)"
  };

  this.hilitestyles = {
    "fill": "lime",
    "stroke": "green",
    "stroke-width": "3px",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "stroke-dasharray": "3 5"
  };

  this.active_style = this.default_style;  
  this.active_text_style = this.default_text_style;  

  this.values = {
    "symbol": "person"
  };

  // constants
  this.svgns = "http://www.w3.org/2000/svg";
  this.xlinkns = "http://www.w3.org/1999/xlink";
}

fizz.prototype.init = function () {
  // this.root.addEventListener("click", bind(this, this.draw), false );

  this.root.addEventListener("mousedown", bind(this, this.grab), false );
  this.root.addEventListener("mousemove", bind(this, this.drag), false );
  this.root.addEventListener("mouseup", bind(this, this.drop), false );
  this.root.parentNode.addEventListener("input", bind(this, this.handle_text_input), false );

  this.treeview.addEventListener("keyup", bind(this, this.handle_keys), false );
  this.treeview.addEventListener("keydown", bind(this, this.handle_keys), false );

  this.buttons = document.querySelectorAll("button");
  for (var b = 0, bLen = this.buttons.length; bLen > b; ++b) {
    var eachButton = this.buttons[b];
    eachButton.addEventListener("click", bind(this, this.handle_buttons), false );
  }

  this.listboxes = document.querySelectorAll("[role=listbox]");
  for (var l = 0, lLen = this.listboxes.length; lLen > l; ++l) {
    var eachListbox = this.listboxes[l];
    eachListbox.addEventListener("click", bind(this, this.handle_dropdown), false );
  }

  this.pickers = document.querySelectorAll("[role=picker]");
  for (var l = 0, lLen = this.pickers.length; lLen > l; ++l) {
    var each_picker = this.pickers[l];
    each_picker.addEventListener("click", bind(this, this.handle_picker), false );
  }

  this.inputs = document.querySelectorAll("input[type=number]");
  for (var i = 0, iLen = this.inputs.length; iLen > i; ++i) {
    var eachInput = this.inputs[i];
    eachInput.addEventListener("click", bind(this, this.handle_inputs), false );
  }

  this.file_input_button.addEventListener("change", bind(this, this.upload_file), false);
  this.file_save_button.addEventListener("click", bind(this, this.save_file), false);

  this.panes = document.querySelectorAll("[role=region]");
  this.pane_switch = document.querySelector("#pane_switch");
  this.pane_switch_buttons = this.pane_switch.querySelectorAll("[role=radio]");
  for (var p = 0, p_len = this.pane_switch_buttons.length; p_len > p; ++p) {
    var each_pane_switch_button = this.pane_switch_buttons[p];
    each_pane_switch_button.addEventListener("click", bind(this, this.handle_pane_switch), false );
  }
  // console.log( JSON.stringify(this.styles).replace(/"/g, "").replace(/,/g, "; ").replace(/[{}]/g, "") )

    // this.active_el.setAttribute("style", this.get_style() );
    // this.selected_el.classList.add("selected");
    // this.selected_el.classList.remove("selected");
    
}


/*
// upload file
*/
fizz.prototype.upload_file = function (event) {
  this.file = event.target.files[0]; // FileList object

  this.file_reader = new FileReader();

  if (this.file) {
    console.info(this.file)
    if ("image/svg+xml" == this.file.type) {
      this.file_reader.readAsText(this.file);
      this.file_reader.addEventListener("load", bind(this, this.insert_svg), false);
    } else {
      this.file_reader.readAsDataURL( this.file );
      this.file_reader.addEventListener("load", bind(this, this.insert_raster), false);
    }
  }
}

fizz.prototype.insert_raster = function () {
  console.info("insert_raster", this.file_reader)
  // console.info("insert_raster", this.file.name)

  var dataURL = this.file_reader.result
  this.active_el = document.createElementNS(this.svgns, "image");
  this.active_el.setAttributeNS(this.xlinkns, "href", dataURL);

  var id = this.file.name.split(".")[0];

  this.add_element( this.active_el, id );


  // this.canvas.appendChild( image_el );
}

fizz.prototype.insert_svg = function () {
  console.info("insert_svg", this.file_reader)
  
  var file_content = this.file_reader.result;

  // strip off XML prolog 
  var svg_start = file_content.indexOf("<svg");
  var prolog = file_content.substring(0, (svg_start - 1));
  file_content = file_content.substring( svg_start );

  // insert SVG file into HTML page
  this.canvas.innerHTML = file_content;

  
//     this.lang = "en-US";
//     var langAttr = this.svgroot.getAttribute("lang");
//     if (langAttr) {
//       this.lang = langAttr;
//     }

}


fizz.prototype.save_file = function () {
  var content = new XMLSerializer().serializeToString( this.canvas );

  var filename_input = document.querySelector("#filename_input");
  var filetype_input = document.querySelector("#filetype_input");
  var filetype_option = filetype_input.options[ filetype_input.selectedIndex ];
  var filetype = filetype_option.value;
  var file_extension = filetype_option.text;

  var filename = filename_input.value + file_extension;
  var file_save_section = document.querySelector("#file_save");


  var DOMURL = self.URL || self.webkitURL || self;
  var blob = new Blob([content], {type : "image/svg+xml;charset=utf-8"});
  var url = DOMURL.createObjectURL(blob);

  var a_el = document.createElement("a");
  a_el.style = "display: none";
  file_save_section.appendChild(a_el);
  a_el.download = filename;

  if ( "image/svg+xml" == filetype ) {
    a_el.href = url;
  } else if ( "image/png" == filetype ) {

  } else {

  }

  a_el.click();

  DOMURL.revokeObjectURL(url);
  a_el.remove();
}



/*
// draw
*/
fizz.prototype.draw = function (event) {
  // console.log(event.button)
  // if ( 0 == event.button ) {
  // }
  if ( this.backdrop == event.target 
    || this.canvas == event.target.parentNode 
    || this.scaffolds == event.target.parentNode ) {
    // adjust coords
    this.coords = local_coords(event, this.backdrop, this.root);
    //console.log(event.detail)

    if (2 == event.detail) {
      if ( "draw-polyline" == this.mode
        || "draw-polygon" == this.mode 
        || "draw-path" == this.mode 
        || "draw-connector" == this.mode ) {
        this.end_draw( event );
      } 

      // this.reset();
    } else {
      switch (this.mode) {
        case "draw-dot":
          this.draw_dot();
          break;

        case "draw-polyline":
          this.draw_poly("polyline" );
          break;

        case "draw-polygon":
          this.draw_poly("polygon");
          break;

        case "draw-rect":
          this.draw_rect();
          break;

        case "draw-circle":
          this.draw_circle();
          break;

        case "draw-path":
          this.draw_path();
          break;

        case "draw-freehand":
          this.draw_freehand();
          break;

        case "draw-use":
          this.draw_use();            
          break;

        case "draw-text":
          this.draw_text();            
          break;

        case "draw-connector":
          this.draw_connector();
          break;
      }
    }
  }
}

fizz.prototype.draw_dot = function () {
  this.active_el = document.createElementNS(this.svgns, "circle");
  this.add_element( this.active_el );
  this.active_el.setAttribute("cx", this.coords.x);
  this.active_el.setAttribute("cy", this.coords.y);
  this.active_el.setAttribute("r", "2");
  this.active_el.setAttribute("style", this.get_style());

  this.update_element( this.active_el );
}

fizz.prototype.draw_circle = function () {
  if (!this.active_el ) {
    this.active_el = document.createElementNS(this.svgns, "circle");
    this.add_element( this.active_el );
    this.active_el.setAttribute("style", this.get_style());

    if (!this.points) {
      this.points = [];
    }

    // we're using the points array, but in a different way for rect than for polys  
    this.points.push( this.coords.x );
    this.points.push( this.coords.y );

    this.active_el.setAttribute("cx", this.points[0] );
    this.active_el.setAttribute("cy", this.points[1] );
    this.active_el.setAttribute("r", 0 );

    this.update_element( this.active_el );
  }      
}

fizz.prototype.draw_rect = function () {
  if (!this.active_el ) {
    this.active_el = document.createElementNS(this.svgns, "rect");
    this.add_element( this.active_el );
    this.active_el.setAttribute("style", this.get_style());

    if (!this.points) {
      this.points = [];
    }

    // we're using the points array, but in a different way for rect than for polys  
    this.points.push( this.coords.x );
    this.points.push( this.coords.y );

    this.active_el.setAttribute("x", this.points[0] );
    this.active_el.setAttribute("y", this.points[1] );
    this.active_el.setAttribute("width", 0 );
    this.active_el.setAttribute("height", 0 );

    this.update_element( this.active_el );
  }      
}

fizz.prototype.draw_poly = function (shape) {
  // console.log("draw_poly")
  if (!this.active_el 
      || shape != this.active_el.localName ) {
    this.active_el = document.createElementNS(this.svgns, shape);
    this.add_element( this.active_el );
    this.active_el.setAttribute("style", this.get_style());
  } else {
    var points = this.active_el.getAttribute("points");
    // this.points = points.split(" ");
  }

  if (!this.points) {
    this.points = [];
  }

  this.points.push( this.coords.x + "," + this.coords.y );
  this.active_el.setAttribute("points", this.points.join(" "));
  this.update_element( this.active_el );
}

fizz.prototype.draw_path = function ( attribute_obj ) {
  // console.log("draw_path")
  if (!this.active_el ) {
    this.active_el = document.createElementNS(this.svgns, "path");
    this.add_element( this.active_el );
    this.active_el.setAttribute("style", this.get_style() );
  }

  if ( attribute_obj ) {
    for (var key in attribute_obj) {
      if (attribute_obj.hasOwnProperty(key)) {
        var val = attribute_obj[key];
        this.active_el.setAttribute(key, val );
      }
    }    
  }

  // NOTE: we're now storing the points array for a path  
  if (!this.points) {
    this.points = [];
  }
  this.points.push( this.coords.x + "," + this.coords.y );

  var d = "M";
  var point_count = this.points.length;
  if ( 3 == point_count ) {
    d += this.points[0] + " Q" + this.points[1] + " " + this.points[2];
  } else if ( 4 == point_count ) {
    d += this.points[0] + " C" + this.points[1] + " " + this.points[2] + " " + this.points[3];
  } else {
    d += this.points.join(" ");
  }

  // var point_index = 0;
  // var point_count = this.points.length;
  // if ( 3 == point_count ) {
  //   d += this.points[0] + " Q" + this.points[1] + " " + this.points[2];
  // } else if ( 4 == point_count ) {
  //   d += this.points[0] + " C" + this.points[1] + " " + this.points[2] + " " + this.points[3];
  // } else {
  //   d += this.path_segment_type + this.points.join(" ");
  // }

  // this.path_segment_type


  this.active_el.setAttribute("d", d);
  this.update_element( this.active_el );

  this.draw_scaffold();
}


fizz.prototype.draw_freehand = function () {
  if (!this.active_el ) {
    this.active_el = document.createElementNS(this.svgns, "path");
    this.add_element( this.active_el );
    // this.active_el.setAttribute("style", this.get_style());
  }

  var d = this.active_el.getAttribute("d");
  if (!d) {
    d = "M";
  }
  d += " " + this.coords.x + "," + this.coords.y + " ";
  this.active_el.setAttribute("d", d);
  this.active_el.setAttribute("style", this.get_style());

  this.update_element( this.active_el );
}

fizz.prototype.draw_use = function () {
  this.active_el = document.createElementNS(this.svgns, "use");
  this.add_element( this.active_el );
  this.active_el.setAttribute("x", this.coords.x );
  this.active_el.setAttribute("y", this.coords.y );
  this.active_el.setAttributeNS(this.xlinkns, "href", "#" + this.values["symbol"]);
  this.active_el.setAttribute("style", this.get_style());

  this.update_element( this.active_el );
}

fizz.prototype.draw_connector = function () {
  // console.log("draw_connector")
  this.active_style = this.connector_style;
  this.draw_path( {"role": "connector"} );

  if ( !this.active_connector ) {
    this.active_connector = new connector( this.active_el );
    this.connectors.push( this.active_connector );
    if ( this.active_obj ) {
      this.active_obj.connector = this.active_connector;
      // console.log(this.elements)
    }
  }


  // connectorArray.push( c );
  // c.draw();

    if ( this.active_el ) {
    var node_1 = this.active_el.getAttribute("node1");
    var start_node = null;
    if ( !node_1 ) {
      this.originpoint = this.coords;
      start_node = this.attach_node( "start" );      
    }

    if ( !start_node ) {
      // no starting node to attach to
      console.info("no nodes to attach!")
      this.delete_element( this.active_el );
      this.reset();
    }
  }
  this.active_style = this.default_style;  
}

fizz.prototype.draw_text = function () {
  this.active_el = document.createElementNS(this.svgns, "text");
  this.add_element( this.active_el );
  this.active_el.setAttribute("x", this.coords.x );
  this.active_el.setAttribute("y", this.coords.y );
  this.active_el.setAttribute( "contenteditable",  "true" );
  this.active_el.setAttribute("style", this.get_style( this.active_text_style ));
  // this.active_el.addEventListener("input", bind(this, this.handle_text_input ), false );

  // // insert placeholder text to help visual feedback
  // this.placeholder_text = document.createElementNS(this.svgns, "tspan");
  // this.placeholder_text.textContent = "text";
  // this.placeholder_text.setAttribute("style", this.get_style( this.placeholder_text_style ));
  // this.active_el.appendChild( this.placeholder_text );
  this.active_el.textContent = "text";
  // var range = document.createRange();
  // range.selectNodeContents(this.active_el);
  // var sel = window.getSelection();
  // sel.removeAllRanges();
  // sel.addRange(range);

  // var selection = window.getSelection();
  // range = document.createRange();
  // range.selectNodeContents( this.active_el );
  // selection.removeAllRanges();
  // selection.addRange(range);

  /*
  // var el = document.getElementById("editable");
  var range = document.createRange();
  var sel = window.getSelection();
  range.setStart( this.active_el.childNodes[2], 5 );
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  */

  // this.active_el.focus();
  this.update_element( this.active_el );
}

/* 
// Scaffold
*/
fizz.prototype.draw_scaffold = function () {
  if (!this.active_scaffold ) {
    this.active_scaffold = document.createElementNS(this.svgns, "polyline");
    this.active_scaffold.setAttribute("style", this.get_style(this.scaffold_style) );
    this.scaffolds.appendChild( this.active_scaffold );
  }
  // this.active_el.setAttribute("points", this.points.join(" "));

  // create initial handle
  this.active_handle = document.createElementNS(this.svgns, "circle");
  this.active_handle.setAttribute("cx", this.coords.x);
  this.active_handle.setAttribute("cy", this.coords.y);
  this.active_handle.setAttribute("r", "6");
  this.active_handle.setAttribute("style", this.get_style(this.handle_style) );

  this.scaffolds.appendChild( this.active_handle );
}


/*
// drag-n-drop
*/
fizz.prototype.grab = function (event) {
  // TODO: create selective event structure for creating, updating, and ending elements, grabbing, 
  //       dragging, etc., and use that instead of binding directly to mouse events, to help 
  //       automation and UI-independence

  if ( 0 == event.button && ! event.ctrlKey ) {
    // left click
    if ( -1 != this.mode.indexOf("draw-") ) {
      this.draw( event );
    } else if ( "drag" == this.mode 
      || "copy" == this.mode 
      || "delete" == this.mode 
      || "select" == this.mode 
      || "animate" == this.mode ) {
      // stop native drag-n-drop
      event.preventDefault();
      event.stopPropagation();

      // only grab things in drawing area 
      var target = event.target;
      if ( this.canvas.contains( target ) ) {
        this.active_el = target;
        if ( "select" == this.mode ) {
          this.select();
        } else if ( "copy" == this.mode ) {
          this.copy_element( this.active_el );
        } else {
          this.coords = local_coords(event, this.backdrop, this.root);
          this.originpoint = this.coords;

          // adjust for existing transforms
          var transform = this.active_el.getAttribute("transform");
          if (transform) {
            var translate = transform.replace("translate(", "").replace(")", "").split(",");
            // var translate = transform.replace("translate(", "");
            // translate = translate.replace(")", "");
            // translate = translate.split(",");
            this.originpoint.x -= parseFloat( translate[0] ).toFixed(2);
            this.originpoint.y -= parseFloat( translate[1] ).toFixed(2);
          }

          if ( "drag" == this.mode ) {
            // TODO: refactor for multiple selections
            this.active_obj = this.elements.find( match_element, this.active_el );
            // console.log(this.active_obj)
          } 
        }
      } else if (this.backdrop === target) {
        if ( "select" == this.mode ) {
          this.draw_selection_marquee();
        } 
      }
    } else if ( -1 != this.mode.indexOf("layout-") ) {
      console.log("layout: " + this.mode)
      switch (this.mode) {
        case "layout-path":
          if (this.backdrop != target) {
            // this.active_el = target;
            this.layout_selections.push( target );
          } else {
            this.layout_selections = this.canvas.querySelectorAll("use");
          }

          var path = this.canvas.querySelector("path");
          // var shapes = this.canvas.querySelectorAll("use");
          this.position_shapes_on_path( path, this.layout_selections );
          break;

        case "layout-grid":
          break;

        case "layout-network":
          console.info("layout: " + this.mode)
          this.layout_network();
          break;

      }
    }  
  }
}

fizz.prototype.drag = function (event) {
  // stop native drag-n-drop
  event.preventDefault();
  event.stopPropagation();

  this.coords = local_coords(event, this.backdrop, this.root);

  if ( "drag" == this.mode ) {
    // TODO: refactor for multiple selections
    var drag_x = 0;
    var drag_y = 0;
    if ( this.active_el ) {
      drag_x = this.coords.x - this.originpoint.x.toFixed(2);
      drag_y = this.coords.y - this.originpoint.y.toFixed(2);

      this.active_el.setAttribute("transform", "translate(" + drag_x + "," + drag_y + ")");

      // this.active_obj = this.elements.find( match_element, this.active_el );
      //  console.log(this.active_obj)
      // TODO: find and update connectors attached to this element
      if ( this.active_obj ) {
        // console.log(this.active_obj)
        if ( this.active_obj.node ) {
          var connectors = this.active_obj.node.connectors;
          for (var c = 0, c_len = connectors.length; c_len > c; ++c) {
            var each_connector = connectors[c];
            this.active_obj.node.transform.x = drag_x;
            this.active_obj.node.transform.y = drag_y;
            each_connector.move_connector();
          }
        }
      }
    }

  } else if ( "select" == this.mode && this.selection_marquee ) {
    this.update_selection_marquee();
  } else if (this.active_el) {
    switch (this.mode) {
      case "draw-dot":
        break;

      case "draw-rect":
        this.update_rect();
        break;

      case "draw-circle":
        this.update_circle();
        break;

      case "draw-polyline":
      case "draw-polygon":
        this.update_poly();            
        break;

      case "draw-path":
        this.update_path();            
        break;

      case "draw-freehand":
        this.update_freehand();            
        break;

      case "draw-connector":
        this.update_connector();            
        break;
    }

    if ( this.active_el ) {
      // this.update_element( this.active_el.cloneNode(true) );
      this.update_element( this.active_el );
    }
  }
}


/*
// Update shapes
*/
fizz.prototype.update_poly = function () {
  // console.log("update_poly")
  var points = this.points.join(" ");
  points += " " + this.coords.x + "," + this.coords.y;
  this.active_el.setAttribute("points", points);
}


fizz.prototype.update_path = function () {
  // console.log("update_path")

  // this.points.push( this.coords.x );
  // this.points.push( this.coords.y );

  var point_count = this.points.length;

  var d = "M";
  if ( 2 == point_count ) {
    d += this.points[0] + " Q" + this.points[1];
  } else if ( 3 == point_count ) {
    d += this.points[0] + " C" + this.points[1] + " " + this.points[2];
  } else {
    d += this.points.join(" ");
  }
  d += " " + this.coords.x + "," + this.coords.y;

  this.active_el.setAttribute("d", d);

  this.update_scaffold();
}


fizz.prototype.update_freehand = function () {
  var d = this.active_el.getAttribute("d");
  if (!d) {
    d = "M";
  }
  d += this.coords.x + "," + this.coords.y + " ";
  this.active_el.setAttribute("d", d);
}

fizz.prototype.update_rect = function () {
  // we're using the points array, but in a different way for rect than for polys  
  this.points[2] = this.coords.x;
  this.points[3] = this.coords.y;

  var x = this.points[0];
  var width = this.points[2] - this.points[0];
  if ( 0 > width ) {
    //if the current cursor x is to the left of the origin, we have to reposition the x attribute
    x = this.points[2];
    width = this.points[0] - this.points[2];
  }

  var y = this.points[1];
  var height = this.points[3] - this.points[1];
  if ( 0 > height ) {
    //if the current cursor y is to the top of the origin, we have to reposition the y attribute
    y = this.points[3];
    height = this.points[1] - this.points[3];
  }

  this.active_el.setAttribute("x", x );
  this.active_el.setAttribute("y", y );
  this.active_el.setAttribute("width", width );
  this.active_el.setAttribute("height", height );
}

fizz.prototype.update_circle = function () {
  this.points[2] = this.coords.x;
  this.points[3] = this.coords.y;

  // geometry magic!
  var radius = Math.sqrt(Math.pow(Math.abs(this.points[2] - this.points[0]), 2) 
             + Math.pow(Math.abs(this.points[3] - this.points[1]), 2));
  this.active_el.setAttribute("r", +radius.toFixed(2) );
}

fizz.prototype.update_use = function () {
  this.points[2] = this.coords.x;
  this.points[3] = this.coords.y;

  // geometry magic!
  var radius = Math.sqrt(Math.pow(Math.abs(this.points[2] - this.points[0]), 2) 
             + Math.pow(Math.abs(this.points[3] - this.points[1]), 2));
  this.active_el.setAttribute("r", radius );
}

fizz.prototype.update_connector = function () {
  this.update_path();
}


fizz.prototype.update_scaffold = function () {
  if (this.active_scaffold) {
    var points = this.points.join(" ");
    points += " " + this.coords.x + "," + this.coords.y;
    this.active_scaffold.setAttribute("points", points);
  }
}


fizz.prototype.drop = function (event) {
  if ( "draw-polyline" == this.mode
    || "draw-polygon" == this.mode 
    || "draw-path" == this.mode ) {
    // this.end_draw( event );
  } else if ( "draw-connector" == this.mode ) {
    // this.originpoint = this.coords;
    // var end_node = this.attach_node( "end" );
  }  else if ( -1 != this.mode.indexOf("draw-") ) {
    this.end_draw( event );
  } else if ( "select" == this.mode ) {
    this.reset();
  } else if ( "drag" == this.mode ) {
    this.active_el = null;

    // TODO: convert transform into geometry attributes(optionally)

  } else if ( "delete" == this.mode ) {
    if ( this.active_el ) {
      this.delete_element( this.active_el );
    }
  } else if ( "animate" == this.mode ) {
    this.animate();
  }
}

fizz.prototype.end_draw = function (event) {
    // console.log("end_draw");
  // // this.mode = "";
  /*
  var title_el = document.createElementNS(this.svgns, "title");
  title_el.textContent = "add meaningful title";
  this.active_el.appendChild( title_el ); 
  */
  if ( this.active_el ) {
   if ( "draw-connector" == this.mode ) {
      this.originpoint = this.coords;
      var end_node = this.attach_node( "end" );
    }

    // this.update_element( this.active_el.cloneNode(true) );
    this.update_element( this.active_el );
  }

  this.reset();

  // this.select( this.active_el );
  // this.active_el = null;
  // this.points = null;
}

fizz.prototype.delete_element = function ( el ) {
  var target_obj = this.elements.find( match_element, el );
  if ( target_obj ) {
    var tree_item = target_obj.tree_item.element;
    tree_item.remove();

    var target_index = this.elements.indexOf( target_obj );
    if ( -1 < target_index ) {
      this.elements.splice( target_index, 1 );
    }
  }
  
  this.active_el.parentNode.removeChild( this.active_el );
  this.active_el = null;
}

fizz.prototype.copy_element = function ( el ) {
  this.active_el = el.cloneNode(true);
  // var t = this.active_el.transform;
  // var ctm = this.active_el.getCTM();
  // var c_x = ctm.e + 10;
  // var c_y = ctm.f + 10;
  // this.active_el.setAttribute("transform", "translate(" + c_x + ", " + c_y + ")")
  var transforms = this.active_el.getAttribute("transform");
  if ( transforms ) {
    if ( -1 != transforms.indexOf("translate(") ) {
      var transforms_list = transforms.split( "translate(" );
      var end_transform = transforms_list[1].split( ")" );
      var values = end_transform[0].split(",");
      var x = parseFloat(values[0]) + 10
      var y = parseFloat(values[1]) + 10
      transforms = transforms_list[0] 
                 + "translate(" +  x + ", " + y + ")"
                 + end_transform[1];
    } else {
      transforms += "translate(10, 10)";
    }
  } else {
    transforms = "translate(10, 10)";
  }

  this.active_el.setAttribute("transform", transforms );
  this.add_element( this.active_el );
}


fizz.prototype.handle_text_input = function ( event ) {
  console.log("handle_text_input");
  if ( this.placeholder_text ) {
    this.placeholder_text.remove();
  }
}



/* Element Manager */
fizz.prototype.add_element = function ( el, id ) {
    // console.log("add_element");
  if ( !el ) {
    el = this.active_el;
  } 

  if ( el ) { 
    if ( !this.active_el.id ) {
      if (!id) {
        id = generate_unique_id( el.localName );
      }
      this.active_el.setAttribute( "id", id );
    }

    // insert element into canvas
    this.canvas.appendChild( this.active_el );

    this.add_tree_entry( el );

    this.active_obj = {
      id: el.id, 
      type: el.localName, 
      element: el,
      parent: el.parentNode,
      tree_item: {
        element: this.active_tree_entry,
        details: this.active_tree_entry.querySelector("details")
      }
    };

    this.elements.push( this.active_obj );
    // console.log(this.active_obj);
    // console.log(this.elements);
  }
}



fizz.prototype.update_element = function ( el ) {
  // console.log("update_element");

  if ( el == this.active_el && this.active_tree_entry ) {
     // console.log("here")
    var details = this.active_tree_entry.querySelector("details");
    this.add_tree_attributes( el, details );
  } else if ( el ) {
    // for non-active_el, find element tree entry and update details
    var target_obj = this.elements.find( match_element, el );
    var details = target_obj.tree_item.details;
    this.add_tree_attributes( el, details );
     // console.log(this.elements)
  }
}


fizz.prototype.remove_element = function () {
    // console.log("remove_element");
  // delete treeview item
  // delete all child treeview items
  this.elements
}

fizz.prototype.get_element = function ( el, id ) {
    // console.log("get_element");
  // highlight element
  // bring element into view
  // highlight treeview item
  // expand/navigate treeview to item 

  this.elements

}

fizz.prototype.get_elements_by_type = function ( type ) {
    // console.log("get_element");
  // get list of elements by type
  // get list of elements by selector


  this.elements

}



fizz.prototype.select = function ( targetEl, multiple ) {
  if ( !targetEl ) {
    targetEl = this.active_el;
  }

  if ( this.selected_el_list && 
    0 != this.selected_el_list.length && 
    targetEl.classList.contains("selected") ) {
    // deselect current selected element
    targetEl.classList.remove("selected");
    var index = this.selected_el_list.indexOf( targetEl );
    if ( 0 <= index ) {
      this.selected_el_list.splice(index, 1);
    }
    var target_obj = this.elements.find( match_element, targetEl );
    target_obj.tree_item.element.classList.remove("selected");

    for (var s = 0, s_len = this.selected_el_list.length; s_len > s; ++s) {
      var each_el = this.selected_el_list[ s ];
      each_el.classList.add("selected");
    }

    // this.selected_title = null;
    // this.selected_desc = null;

    // // depopulate inputs
    // update_inputs( "title", "" );
    // update_inputs( "desc", "" );

  } else {
    // TODO: allow multiple selected elements
    if ( !multiple && this.selected_el_list ) {
      // deselect current selected elements
      while ( 0 != this.selected_el_list.length ) {
        var each_el = this.selected_el_list.pop();
        each_el.classList.remove("selected");       
        var each_obj = this.elements.find( match_element, each_el );
        each_obj.tree_item.element.classList.remove("selected");
      }
    }

    // select current active element
    this.selected_el_list.push( targetEl );
    targetEl.classList.add("selected");
    var target_obj = this.elements.find( match_element, targetEl );
    target_obj.tree_item.element.classList.add("selected");

    // if ( !multiple && this.selected_el ) {
    //   // deselect current selected element
    //   this.selected_el.classList.remove("selected");
    // }

    // // select current active element
    // this.selected_el = targetEl;
    // this.selected_el.classList.add("selected");


    ////////////////////
    // if ( this.selected_el && this.selected_el != this.active_el ) {
    //   this.selected_el.classList.remove("selected");
    // 
    //   this.selected_title = this.selected_el.querySelector("title");
    //   this.selected_desc = this.selected_el.querySelector("desc");            
    // }
    // 
    // this.selected_el = this.active_el;
    // if ( this.selected_el ) {
    //   this.selected_el.classList.add("selected");
    //   this.selected_title = this.selected_el.querySelector("title");
    //   this.selected_desc = this.selected_el.querySelector("desc");            
    // }
    //////////////////

    /*
    // // from EyeScribe
    // this.selected_title = this.selected_el.querySelector("title");
    // this.selected_desc = this.selected_el.querySelector("desc");  
    // 
    // // populate UI title and desc inputs
    // var title_text = "";
    // if ( this.selected_title ) {
    //   title_text = this.selected_title.textContent;
    // }
    // update_inputs( "title", title_text );
    // 
    // var desc_text = "";
    // if ( this.selected_desc ) {
    //   desc_text = this.selected_desc.textContent;
    // }
    // update_inputs( "desc", desc_text );
    // 
    // // populate UI link settings
    // var parent_el = this.selected_el.parentNode;
    // var url_value = "";
    // var link_target_value = "_blank";
    // if ( "a" == parent_el.localName ) {
    //   url_value = parent_el.getAttributeNS("http://www.w3.org/1999/xlink", "href" );
    //   link_target_value = parent_el.getAttribute( "target" );
    // }        
    // update_link_settings( url_value, link_target_value );
    // 
    // // convert all to hilites
    // initEyescribe(); 
    */    
  } 
}

fizz.prototype.draw_selection_marquee = function ( box ) {
  this.selection_marquee = document.createElementNS(this.svgns, "rect");
  this.selection_marquee.setAttribute("style", this.get_style(this.selection_marquee_style) );
  this.scaffolds.appendChild( this.selection_marquee );

  if (!this.points) {
    this.points = [];
  }

  // we're using the points array, but in a different way for rect than for polys  
  this.points.push( this.coords.x );
  this.points.push( this.coords.y );

  this.selection_marquee.setAttribute("x", this.points[0] );
  this.selection_marquee.setAttribute("y", this.points[1] );
  this.selection_marquee.setAttribute("width", 0 );
  this.selection_marquee.setAttribute("height", 0 );
}

fizz.prototype.update_selection_marquee = function () {
  // we're using the points array, but in a different way for rect than for polys  
  this.points[2] = this.coords.x;
  this.points[3] = this.coords.y;

  var x = this.points[0];
  var width = this.points[2] - this.points[0];
  if ( 0 > width ) {
    //if the current cursor x is to the left of the origin, we have to reposition the x attribute
    x = this.points[2];
    width = this.points[0] - this.points[2];
  }

  var y = this.points[1];
  var height = this.points[3] - this.points[1];
  if ( 0 > height ) {
    //if the current cursor y is to the top of the origin, we have to reposition the y attribute
    y = this.points[3];
    height = this.points[1] - this.points[3];
  }

  this.selection_marquee.setAttribute("x", x );
  this.selection_marquee.setAttribute("y", y );
  this.selection_marquee.setAttribute("width", width );
  this.selection_marquee.setAttribute("height", height );

  this.selected_el_list = this.get_enclosed_elements( { x: x,  y: y,  width: width,  height: height }, true );
  // console.info(this.selected_el_list)
  for (var s = 0, s_len = this.selected_el_list.length; s_len > s; ++s) {
    // TODO: factor out selection/deselection code into select / deselect functions
    var each_el = this.selected_el_list[ s ];
    each_el.classList.add("selected");
    var each_obj = this.elements.find( match_element, each_el );
    each_obj.tree_item.element.classList.add("selected");
  }
}


fizz.prototype.get_enclosed_elements = function ( box, deselect ) {
  var enclosed_els = [];
  var all_els = this.canvas.querySelectorAll("*");
  for (var a = 0, a_len = all_els.length; a_len > a; ++a) {
    var each_el = all_els[ a ]; 

    if ( each_el.getBBox ) {
      var each_bbox = each_el.getBBox();

      if ( box.x <= each_bbox.x &&
           box.y <= each_bbox.y &&
           (box.x + box.width) >= (each_bbox.x + each_bbox.width) &&
           (box.y + box.height) >= (each_bbox.y + each_bbox.height) ) {
        enclosed_els.push(each_el);
      } else if ( deselect ) {
        each_el.classList.remove("selected");
        var each_obj = this.elements.find( match_element, each_el );
        each_obj.tree_item.element.classList.remove("selected");
      }         
    }
  }

  return enclosed_els;
}

fizz.prototype.update_title = function ( title_text ) {
  // TODO: refactor for multiple selections

  // if ( this.selected_el ) {
  //   if ( !this.selected_title ) {
  //     this.selected_title = this.selected_el.querySelector("title");

  //     if ( !this.selected_title ) {
  //       this.selected_title = document.createElementNS(this.svgns, "title");
  //       this.selected_el.appendChild( this.selected_title ); 

  //       if (!title_text) {
  //         title_text = "add meaningful title";
  //       }           
  //     }
  //   }

  //   console.log("textContent 1");
  //   this.selected_title.textContent = title_text;
  // }
}

fizz.prototype.update_desc = function ( desc_text ) {
  // TODO: refactor for multiple selections

  // if ( this.selected_el ) {
  //   if ( !this.selected_desc ) {
  //     this.selected_desc = this.selected_el.querySelector("desc");

  //     if ( !this.selected_desc ) {
  //       this.selected_desc = document.createElementNS(this.svgns, "desc");
  //       this.selected_el.appendChild( this.selected_desc ); 

  //       if (!desc_text) {
  //         desc_text = "add meaningful description";
  //       }           
  //     }
  //   }

  //   console.log("textContent 2");
  //   this.selected_desc.textContent = desc_text;
  // }
}

fizz.prototype.add_link = function ( url, target ) {
  // TODO: refactor for multiple selections

  // var parent_el = this.selected_el.parentNode;
  // if ( "a" == parent_el.localName ) {
  //   parent_el.setAttributeNS("http:x//www.w3.org/1999/xlink", "href", url );
  //   parent_el.setAttribute( "target", target );
  // } else {
  //   var link_el = document.createElementNS(this.svgns, "a");
  //   link_el.setAttributeNS("http://www.w3.org/1999/xlink", "href", url );
  //   link_el.setAttribute( "target", target );

  //   parent_el.insertBefore( link_el, this.selected_el );
  //   link_el.appendChild( this.selected_el );
  // }
}


fizz.prototype.animate = function () {
  console.log("animate")
  if ( this.active_el && "path" == this.active_el.localName ) {
    console.log("animate path")
    this.pathLength = this.active_el.getTotalLength();
    this.pathOffset = this.pathLength;
    this.active_el.style.strokeDasharray = this.pathLength;
    this.active_el.style.strokeDashoffset = this.pathOffset;

    var t = this; 
    this.timer = setInterval( function () {
      if ( 0 < t.pathOffset ) {
        t.pathOffset -= 5;
        t.active_el.style.strokeDashoffset = t.pathOffset;
      } else {
        clearInterval( t.timer );
      }
    }, 10);
  }
}

/*
// UI controls
*/

fizz.prototype.handle_buttons = function (event) {
  this.reset();

  for (var b = 0, bLen = this.buttons.length; bLen > b; ++b) {
    var eachButton = this.buttons[b];
    eachButton.setAttribute("aria-pressed", "false" );
  }

  var target = event.target;
  target.setAttribute("aria-pressed", "true" );
  this.mode = target.getAttribute("data-mode");
  // console.log("mode: " + this.mode);

  this.deactivate_nodes();
}

fizz.prototype.handle_dropdown = function (event) {
  var target = event.target;
  var options = target.parentNode.querySelectorAll("[role=option]")
  for (var o = 0, oLen = options.length; oLen > o; ++o) {
    var eachOption = options[o];
    eachOption.setAttribute("aria-selected", "false" );
  }
  target.setAttribute("aria-selected", "true" );
  var prop = target.parentNode.getAttribute("data-property");
  if ( prop ) {
    this.active_style[prop] = target.textContent;
  } else {
    var datatype = target.parentNode.getAttribute("data-type");
    this.values[datatype] = target.textContent;
  }
  this.deactivate_nodes();
}

fizz.prototype.handle_picker = function (event) {
  var target = event.target;
  var value = target.textContent;
  var options = target.parentNode.querySelectorAll("[role=option]")
  for (var o = 0, oLen = options.length; oLen > o; ++o) {
    var eachOption = options[o];
    eachOption.setAttribute("aria-selected", "false" );
  }
  target.setAttribute("aria-selected", "true" );
  var prop = target.parentNode.getAttribute("data-property");
  if ( prop ) {
    this.active_style[prop] = value;

    if ( this.selected_el_list ){
      for (var s = 0, s_len = this.selected_el_list.length; s_len > s; ++s) {
        var each_el = this.selected_el_list[ s ];
        each_el.setAttribute("style", this.get_style(this.active_style) );
      }      
    }
  } else {
    var datatype = target.parentNode.getAttribute("data-type");
    this.values[datatype] = value;
  }
  this.deactivate_nodes();
}

fizz.prototype.handle_pane_switch = function (event) {
  this.reset();

  var target = event.target;
  this.mode = target.getAttribute("data-mode");
  var target_id = target.getAttribute("id");
  // console.log("mode: " + this.mode);

  for (var pb = 0, pb_len = this.pane_switch_buttons.length; pb_len > pb; ++pb) {
    var each_pane_switch_button = this.pane_switch_buttons[pb];

    if ( each_pane_switch_button === target ) {
      each_pane_switch_button.setAttribute("aria-checked", "true" );
    } else {
      each_pane_switch_button.setAttribute("aria-checked", "false" );
    }
  }

  for (var p = 0, p_len = this.panes.length; p_len > p; ++p) {
    var each_pane = this.panes[p];

    var label_id = each_pane.getAttribute("aria-labelledby");

    if ( label_id === target_id ) {
      each_pane.setAttribute("aria-current", "true" );
    } else {
      each_pane.setAttribute("aria-current", "false" );
    }
  }

   // role="region" aria-labelledby="button-create" aria-current="true"
  this.deactivate_nodes();
}

fizz.prototype.handle_keys = function (event) {
  var target = event.target;
  var key = event.key;
  console.info("handle_keys", key); 

  if ( "Enter" === key ) {
    event.preventDefault();
    target.blur();
    // console.info(target, target.parentNode);
  }

}

fizz.prototype.handle_ = function (event) {
}

fizz.prototype.handle_inputs = function (event) {
  var target = event.target;
  var prop = target.getAttribute("data-property");
  var unit = target.getAttribute("data-unit");
  var scope = target.getAttribute("data-scope");

  var val = target.value;
  if (unit) {
    val += unit;
  }

  if ( !scope || "shape" == scope ) {
    this.active_style[prop] = val;

    if ( this.selected_el_list ){
      for (var s = 0, s_len = this.selected_el_list.length; s_len > s; ++s) {
        var each_el = this.selected_el_list[ s ];
        each_el.setAttribute("style", this.get_style(this.active_style) );
      }
    }
  } else if ( "text" == scope ) {
    this.active_text_style[prop] = val;
  }
  this.deactivate_nodes();
}

fizz.prototype.get_style = function ( style_type ) {
  if (!style_type) {
    style_type = this.active_style;
  }

  var style = JSON.stringify(style_type)
                  .replace(/"/g, "")
                  .replace(/,/g, "; ")
                  .replace(/[{}]/g, "");

  return style;
}


/*
// Treeview
*/

fizz.prototype.add_tree_entry = function ( el ) {
    // console.log("add_tree_entry");
  if ( this.treeview ) {

    // var attrs = document.getElementById("myId").attributes;
    // Array.prototype.slice.call(document.getElementById("myId").attributes).forEach(function(item) {
    //   console.log(item.name + ': '+ item.value);
    // });

    // var tree_entry = null;

    // console.log();
    this.active_tree_entry = document.createElement("li");
    var details = document.createElement("details");
    details.setAttribute( "open",  "true" );
    this.active_tree_entry.appendChild( details );
    var summary = document.createElement("summary");
    summary.textContent = el.localName;
    details.appendChild( summary );

    this.add_tree_attributes( el, details );

    // var subtree = this.add_tree_attributes( el );
    // details.appendChild( subtree );
    
    this.treeview.appendChild( this.active_tree_entry );
    // this.active_tree_entry.scrollIntoView(true);
    this.active_tree_entry.scrollIntoView( {block: "end", behavior: "smooth"} );
  }
}


fizz.prototype.add_tree_attributes = function ( el, parent_node ) {
  if ( this.treeview && el && parent_node ) {
    var list = document.createElement("ul");

    var attributes_array = Array.prototype.slice.call(el.attributes);
    // attrs.forEach( function( item ) {
    // });
    for (var a = 0, a_len = attributes_array.length; a_len > a; ++a) {
      var item = attributes_array[ a ]; 
      if ( "style" != item.name 
        && "contenteditable" != item.name ) {
        if ( item.value && "" != item.value ) {
          var list_item = document.createElement("li");
          // list_item.textContent = item.name + ": " + item.value;

          var name_el = document.createElement("b");
          // TODO: put attribute name in span by itself
          name_el.setAttribute( "class", "attribute" );
          // name_el.textContent = item.name + ": ";
          name_el.textContent = item.name;
          list_item.appendChild( name_el );

          var value_el = document.createElement("span");
          value_el.setAttribute( "class", "value" );
          value_el.setAttribute( "contenteditable",  "true" );
          value_el.addEventListener("blur", bind(this, this.update_tree_entry), false );
          var value_string = item.value;
          if (0 == value_string.indexOf("data:image/")) {
            value_string = "(dataURL)";
          }
          value_el.textContent = value_string;
          // var value = document.createTextNode( item.value );
          list_item.appendChild( value_el );

          list.appendChild( list_item );
          // console.log(item.name + ": " + item.value);
        }
      }
    }

    var old_list = parent_node.querySelector("ul");
    if ( old_list ) {
      parent_node.replaceChild( list, old_list );
    } else {
      parent_node.appendChild( list );
    }

    parent_node.scrollIntoView(true);

    // return list;
  }
}


fizz.prototype.update_tree_entry = function ( event ) {
  // updates element when tree entry is modified
    // console.log("update_tree_entry");
  if ( this.treeview ) {
    var target = event.target;

    // update related element with new value
    var tree_item = this.treeview.firstElementChild;
    while ( false === tree_item.contains( target ) ) {
      tree_item = tree_item.nextElementSibling;
    }

    if ( tree_item ) {
      this.active_obj = this.elements.find( match_treeitem, tree_item );
      // console.info(this.active_obj);

      if (this.active_obj) {
        var attr = target.parentNode.querySelector("b.attribute").textContent;
        var attr_value = target.textContent;
        this.active_obj.element.setAttribute(attr, attr_value);
        // TODO: add animated transition flash around changing element
      }
    }

  }
}



/*
// Reset UI
*/

fizz.prototype.reset = function () {
  // clicking on any button should start a new active element and new mode
  this.active_el = null;
  this.points = null;
  this.active_obj = null;
  this.active_connector = null;

  this.active_scaffold = null;
  this.active_handle = null;
  this.selection_marquee = null;
  // this.selected_el_list = null;

  // NOTE: remove all old scaffolds
  while (this.scaffolds.firstChild) {
    this.scaffolds.removeChild(this.scaffolds.firstChild);
  }
}



fizz.prototype.convertToAbsolute = function (path) {
  console.log(path)
  function set(type) {
    var args = [].slice.call(arguments, 1);
    segs.replaceItem(path['createSVGPathSeg' + type].apply(path, args), i);
  }

  var x0, y0, x1, y1, x2, y2, segs = path.pathSegList;
  for (var x = 0, y = 0, i = 0, len = segs.numberOfItems; i < len; i++) {
    var seg = segs.getItem(i)
      , c   = seg.pathSegTypeAsLetter;
    if (/[MLHVCSQTA]/.test(c)) {
      if ('x' in seg) x = seg.x;
      if ('y' in seg) y = seg.y;
    }
    else {
      if ('x1' in seg) x1 = seg.x1 + x;
      if ('x2' in seg) x2 = seg.x2 + x;
      if ('y1' in seg) y1 = seg.y1 + y;
      if ('y2' in seg) y2 = seg.y2 + y;
      if ('x'  in seg) x += seg.x;
      if ('y'  in seg) y += seg.y;
      switch (c) {
        case 'm': set('MovetoAbs',x,y);                   break;
        case 'l': set('LinetoAbs',x,y);                   break;
        case 'h': set('LinetoHorizontalAbs',x);           break;
        case 'v': set('LinetoVerticalAbs',y);             break;
        case 'c': set('CurvetoCubicAbs',x,y,x1,y1,x2,y2); break;
        case 's': set('CurvetoCubicSmoothAbs',x,y,x2,y2); break;
        case 'q': set('CurvetoQuadraticAbs',x,y,x1,y1);   break;
        case 't': set('CurvetoQuadraticSmoothAbs',x,y);   break;
        case 'a': set('ArcAbs',x,y,seg.r1,seg.r2,seg.angle,
                      seg.largeArcFlag,seg.sweepFlag);    break;
        case 'z': case 'Z': x = x0; y = y0; break;
      }
    }
    // store the start of a subpath
    if (c == 'M' || c == 'm') {
      x0 = x;
      y0 = y;
    }
  }

  var seg2 = path.pathSegList;

  path.setAttribute('d', path.getAttribute('d').replace(/z/g, 'Z'));
}   

fizz.prototype.convertToRelative = function (path) {
  function set(type) {
    var args = [].slice.call(arguments, 1)
      , rcmd = 'createSVGPathSeg'+ type +'Rel'
      , rseg = path[rcmd].apply(path, args);
    segs.replaceItem(rseg, i);
  }

  var dx, dy, x0, y0, x1, y1, x2, y2, segs = path.pathSegList;
  for (var x = 0, y = 0, i = 0, len = segs.numberOfItems; i < len; i++) {
    var seg = segs.getItem(i)
      , c   = seg.pathSegTypeAsLetter;
    if (/[MLHVCSQTAZz]/.test(c)) {
      if ('x1' in seg) x1 = seg.x1 - x;
      if ('x2' in seg) x2 = seg.x2 - x;
      if ('y1' in seg) y1 = seg.y1 - y;
      if ('y2' in seg) y2 = seg.y2 - y;
      if ('x'  in seg) dx = -x + (x = seg.x);
      if ('y'  in seg) dy = -y + (y = seg.y);
      switch (c) {
        case 'M': set('Moveto',dx,dy);                   break;
        case 'L': set('Lineto',dx,dy);                   break;
        case 'H': set('LinetoHorizontal',dx);            break;
        case 'V': set('LinetoVertical',dy);              break;
        case 'C': set('CurvetoCubic',dx,dy,x1,y1,x2,y2); break;
        case 'S': set('CurvetoCubicSmooth',dx,dy,x2,y2); break;
        case 'Q': set('CurvetoQuadratic',dx,dy,x1,y1);   break;
        case 'T': set('CurvetoQuadraticSmooth',dx,dy);   break;
        case 'A': set('Arc',dx,dy,seg.r1,seg.r2,seg.angle,
                      seg.largeArcFlag,seg.sweepFlag);   break;
        case 'Z': case 'z': x = x0; y = y0; break;
      }
    }
    else {
      if ('x' in seg) x += seg.x;
      if ('y' in seg) y += seg.y;
    }
    // store the start of a subpath
    if (c == 'M' || c == 'm') {
      x0 = x;
      y0 = y;
    }
  }
  path.setAttribute('d', path.getAttribute('d').replace(/Z/g, 'z'));
}   


/*
// Layout
*/

fizz.prototype.position_shapes_on_path = function ( path, shapes ) {
      console.log("position_shapes_on_path")
      console.log(path)
      console.log(shapes)
  if ( path && shapes ) {
    var length = path.getTotalLength();
    // var shapes = document.querySelectorAll("circle.shape");
    var count = shapes.length;

    var distance = length / (count - 1);
    for (var s = 0; count > s; ++s) {
      var each_shape = shapes[s];
      var interval = distance * s;
      if (1 == count) {
        interval = length / 2;
      }
      var point = path.getPointAtLength( interval );
      // each_shape.setAttribute("transform", "translate(" + point.x + "," + point.y + ")");
      this.canvas.appendChild( each_shape );
      each_shape.setAttribute("x", point.x );
      each_shape.setAttribute("y", point.y );
    }
  }     
}

fizz.prototype.position_shapes_on_grid = function ( target_el, shapes ) {
  if ( target_el && shapes ) {
    var bbox = target_el.getBBox();
  }     
}


fizz.prototype.layout_network = function ( target_el, shapes ) {
      console.info("layout_network")
    var nodes = this.canvas.querySelectorAll("[role~=node]");
    for (var n = 0, n_len = nodes.length; n_len > n; ++n) {
      var each_node = nodes[n];
      console.info("node:", each_node)
    } 


      if ( target_el && shapes ) {
    // this.node_count = 0;
    // this.force_x = {};
    // this.force_y = {};
    // this.stepsize = 0.0005;
    // this.iteration = 0;
    // this.task = null;

    // // tunables to adjust the layout
    // this.repulsion = 200000; // repulsion constant, adjust for wider/narrower spacing
    // this.spring_length = 20; // base resting length of springs

   
  }     
}

/*
// Graph Connectors
*/

fizz.prototype.attach_node = function ( node_type ) {
  if ( "start" == node_type ) {
    this.deactivate_nodes();
  }

  var distance = null; 
  var each_distance = null; 
  var centerpoint = null;  
  var nearest_node = null;  
  var nearest_centerpoint = null;  
  var angle = null;  

  var shapes = this.canvas.querySelectorAll("*");
  for (var s = 0, s_len = shapes.length; s_len > s; ++s) {
    var each_shape = shapes[s];
    var role = each_shape.getAttribute("role");
    if ( !role || -1 == role.indexOf("connector") ) {
      var centerpoint = get_centerpoint( each_shape, this.root );
      each_distance = get_distance ( this.originpoint.x, this.originpoint.y, centerpoint.x, centerpoint.y );  
      if ( null == distance || each_distance <= distance ) {
        distance = each_distance;
        nearest_centerpoint = centerpoint;
        nearest_node = each_shape;
        // angle in degrees
        angle = Math.atan2(this.originpoint.y - nearest_centerpoint.y, this.originpoint.x - nearest_centerpoint.x) 
                * 180 / Math.PI;
      }
    }
  }


if ( nearest_node ) {
    // TODO: move this code to tree element manager? or to node object function?
    var role = nearest_node.getAttribute("role");
    if ( role && -1 == role.indexOf("node") ) {
      role += " node";
    } else {
      role = "node";
    }
    nearest_node.setAttribute("role", role);
    nearest_node.classList.add("active_node");
    this.update_element( nearest_node );


    // TODO: attach distance to node

    // TODO: only run check on start and end of connector, not each path segment // done?

    var target_obj = this.elements.find( match_element, nearest_node );
    if ( !target_obj.node ) {
      target_obj.node = new node( nearest_node, this.root );
      target_obj.node.x = nearest_centerpoint.x;
      target_obj.node.y = nearest_centerpoint.y;
      target_obj.node.prev_x = target_obj.node.x;
      target_obj.node.prev_y = target_obj.node.y;
    }
    
    if ( "start" == node_type ) {
      this.active_el.setAttribute("node1", "#" + nearest_node.id)

      this.active_connector.node1 = target_obj.node;
      this.active_connector.node1distance = distance;
      this.active_connector.node1.connectors.push( this.active_connector );
    } else if ( "end" == node_type ) {
      this.active_el.setAttribute("node2", "#" + nearest_node.id)

      this.active_connector.node2 = target_obj.node;
      this.active_connector.node2distance = distance;
      this.active_connector.node2.connectors.push( this.active_connector );
    }
        // console.log(this.elements)    
  }
  return nearest_node;
}


fizz.prototype.deactivate_nodes = function () {
  // remove highlights around all connector nodes
  var active_nodes = this.canvas.querySelectorAll(".active_node");
  for (var a = 0, a_len = active_nodes.length; a_len > a; ++a) {
    var each_active_node = active_nodes[ a ]; 
    each_active_node.classList.remove("active_node");
    this.update_element( each_active_node );
  }
}


/* connector object */

function connector( el ) {
  this.el           = el;
  this.id           = this.el.getAttribute("id");
  this.path         = el;
  this.title        = null;
  this.desc         = null;

  this.node1        = null;
  this.node2        = null;
  this.node1port    = null; 
  this.node2port    = null;
  this.directed     = "false";

  this.firstPoint   = null; // the first point in the connectors list ???
  this.lastPoint    = null; // the last point in the connectors list ???

  this.style        = "straight"; // straight, curved, etc.

  // this.init();
};

// connector.prototype.toString = function() { return 'Connector';};

connector.prototype.init = function() {
  // this.id = this.el.getAttribute("id");
  var node1id = this.el.getAttribute("node1").replace("#","");
  this.node1 = new node( node1id );
  this.node1.connectors.push( this );

  var node2id = this.el.getAttribute("node2").replace("#","");
  this.node2 = new node( node2id );
  this.node2.connectors.push( this );
  
  this.node1port = this.el.getAttribute("node1port");
  this.node2port = this.el.getAttribute("node2port"); 
  
  this.directed = this.el.getAttribute("directed");
  
  var t = this.el.getElementsByTagName("title")[0];
  if ( null != t ) {
    this.title = t.textContent;
  }
  
  var d = this.el.getElementsByTagName("desc")[0];
  if ( null != d ) {
    this.desc = d.textContent;
  }
}

connector.prototype.move_connector = function() {
  this.find_closest_points();
  
  var node1x = this.node1.x + this.node1.transform.x;
  var node1y = this.node1.y + this.node1.transform.y;


  var node2x = this.node2.x + this.node2.transform.x;
  var node2y = this.node2.y + this.node2.transform.y;

  // var d = "M" + node1x + "," + node1y + " "
  //       + "L" + node2x + "," + node2y;

  // TODO: if connector length is less than distances, decrease distances accordingly,
  //       or make path length 1 so it doesn't reverse the arrow 
  var n1_point = get_distance_from_point ( node1x, node1y, node2x, node2y, this.node1distance );
  var n2_point = get_distance_from_point ( node2x, node2y, node1x, node1y, this.node2distance );

  var d = "M" + n1_point.x + "," + n1_point.y + " "
        + "L" + n2_point.x + "," + n2_point.y;

  if ( !this.path ) {
    this.path = document.createElementNS(svgns, "path");
    this.path.setAttribute( "fill", "none" );

    // copy the stroke and marker attributes of the connector element to the path element
    for ( a in this.el.attributes ) {
      var attr = this.el.attributes[ a ].name;
      if ( attr && (-1 != attr.indexOf("stroke") || -1 != attr.indexOf("marker")) ) {
        var attrVal = this.el.attributes[ a ].value;
        // alert( "attr: " + attr + "\nattrVal: " + attrVal )
        this.path.setAttribute( attr, attrVal );
      }
    }
    
    if ( !this.el.parentNode.getAttribute("stroke") ) {
      this.path.setAttribute( "stroke", "#000000" );
    }

    this.el.parentNode.appendChild( this.path );
  
    // if ( "true" == this.directed ) {
    //   this.path.setAttribute( "marker-end", "url(#arrow)" );
    // }
  }
  this.path.setAttribute( "d", d );
}


// find which combination of ports and connector attractors are
//   closest to each other
connector.prototype.find_closest_points = function() {
  var node1x = this.node1.x + this.node1.transform.x;
  var node1y = this.node1.y + this.node1.transform.y;
  var node2x = this.node2.x + this.node2.transform.x;
  var node2y = this.node2.y + this.node2.transform.y;
  
  var node1ports = [];
  if ( null == this.node1port ) {
    node1ports = this.node1.ports;
  } else {
    // filter candidate ports based on @node1port
    for ( var p = 0, p_len = this.node1.ports.length; p_len > p; ++p ) {
      var port = this.node1.ports[ p ];
      if ( port.role && -1 != port.role.indexOf( this.node1port ) ) {
        node1ports.push( port );
      }
    }
  }
  
  var node2ports = [];
  if ( null == this.node2port ) {
    node2ports = this.node2.ports;
  } else {
    // filter candidate ports based on @node2port
    for ( var p = 0, p_len = this.node2.ports.length; p_len > p; ++p ) {
      var port = this.node2.ports[ p ];
      if ( port.role && -1 != port.role.indexOf( this.node2port ) ) {
        node2ports.push( port );
      }
    }
  }
  
  var targetx = node2x;
  var targety = node2y;
  var targetports = node2ports;
  // if there is an initial point in the connector, that point should be
  //   the relevant point for determining the node1 port
  // if ( this.firstPoint ) {
  //   targetports = [ this.firstPoint ];
  //   targetx = 0;
  //   targety = 0;
  // }
  
  // var ports = this.find_port( sourceports, sourcex, sourcey, targetports, targetx, targety );
  var ports = this.find_port( node1ports, node1x, node1y, targetports, targetx, targety );
  this.node1p = ports[ 0 ];
  this.node2p = ports[ 1 ];
  
  
  // if there is a point in the connector, then find the nearest target
  //   port to that point
  if ( this.lastPoint ) {
    var ports = this.find_port( [ this.lastPoint ], 0, 0, node2ports, node2x, node2y );
    this.node2p = ports[ 1 ];
  }
}


// loop through available ports and connector attractors to find closest match
connector.prototype.find_port = function( sourceports, sourcex, sourcey, targetports, targetx, targety ) {
  var distance = null;
  var d = 0;

  var ports = [];
  for ( var p = 0, pLen = sourceports.length; pLen > p; p++ ) {
    var sourcePort = sourceports[ p ];
    for ( var t = 0, tLen = targetports.length; tLen > t; t++ ) {
      var targetPort = targetports[ t ];
      d = get_distance( (sourcePort.x + sourcex), 
                        (sourcePort.y + sourcey), 
                        (targetPort.x + targetx), 
                        (targetPort.y + targety) );
      if ( null == distance || d <= distance ) {
        // alert( this.id + "\n" + distance + "\n" + d + "\n" + sourcePort.id + " " + targetPort.id )
        distance = d;
        ports[0] = sourcePort;
        ports[1] = targetPort;
      }
    }
  }
  
  return ports;
}


/* node object */

function node( el, root  ) {
  this.el           = el;
  this.id           = this.el.id;
  this.root         = root;
  this.role         = null;
  this.title        = null;
  this.desc         = null;
  this.ports        = [];
  this.distance     = null; // distance of connector end from centerpoint

  this.connectors   = [];
  this.x            = 0;
  this.y            = 0;
  this.prev_x       = 0;
  this.prev_y       = 0;
  this.transform    = this.root.createSVGPoint();
  console.info("fn node")
  // return this.init( id );
}

// node.prototype.toString = function() { return 'Node: ' + this.id ;};

node.prototype.init = function( id ) {
  var node = nodeArray[id];
  if ( !node ) {
    this.el = document.getElementById( id );
    var centerpoint = get_centerpoint(this.el);
    this.x = centerpoint.x;
    this.y = centerpoint.y;

    var ctm = this.el.getCTM();
    this.transform.x = parseInt( ctm.e );
    this.transform.y = parseInt( ctm.f );
    
    // alert( "this.transform.x: " + this.transform.x + "\nthis.transform.y: " + this.transform.y )

    // nodeArray[id] = this;
    // node = this;
    
    this.role = this.el.getAttribute("role");
    
    var title = this.el.getElementsByTagName("title")[0];
    if ( null != title ) {
      this.title = title.textContent;
    }

    var desc = this.el.getElementsByTagName("desc")[0];
    if ( null != desc ) {
      this.desc = desc.textContent;
    }
    
    /// issue: fix for 'use' case
    var points = this.el.getElementsByTagName("point");
    for ( var p = 0, pLen = points.length; pLen > p; p++ ) {
      var eachPoint = points[ p ];
      // alert(eachPoint)
      var port = new port( eachPoint );
      this.ports.push( port );
      // show_port( port, this.transform.x, this.transform.y );
      // show_port( port );
    }

    // this.el.addEventListener("focus", this.showNavOptions, false);
  }

  return node;
}

/* port object */
function port ( el ) {
  this.el           = el;
  this.id           = null;
  this.parent       = null;
  this.x            = 0;
  this.y            = 0;
  this.role         = null;
  this.status       = null; // real or virtual port
  this.distance     = null; // distance of connector end from centerpoint
  return this.init();
};

port.prototype.init = function() {
  if ( this.el ) {
    this.id = this.el.getAttribute("id");

    this.x += parseFloat( this.el.getAttribute("x") );
    this.y += parseFloat( this.el.getAttribute("y") );
    this.role = this.el.getAttribute("role");
    
    this.parent = this.el.parent;
    if ( "use" == this.el.localName ) {
      // do something about 'use' elements here?
    }    
  } else {
    // TODO: create virtual ports based on distance of connector end from centerpoint
  }
}


function get_distance ( x1, y1, x2, y2 ) {
  // use Pythagorean theorem to find distance between points 
  return Math.sqrt( Math.pow( (x2 - x1), 2) + Math.pow( (y2 - y1), 2) );
};

function get_distance_from_point ( x1, y1, x2, y2, distance ) {
  var x_distance = Math.abs( x1 - x2 );
  var y_distance = Math.abs( y1 - y2 );

  var line_distance = Math.sqrt( Math.pow( x_distance, 2 ) + Math.pow( y_distance, 2 ) );
  var angle = Math.atan2( ( y2 - y1 ), ( x2 - x1 ) );
  var delta_x1 = distance * Math.cos( angle );
  var delta_y1 = distance * Math.sin( angle );
  
  var x3 = x1 + delta_x1;
  var y3 = y1 + delta_y1;

  return { x: x3, y: y3 };
}

function get_centerpoint( el, root ) {
  var centerpoint = root.createSVGPoint();
  var bbox = el.getBBox();
  centerpoint.x = bbox.x + (bbox.width/2);
  centerpoint.y = bbox.y + (bbox.height/2);

  // Firefox only
  // if ("use" == el.nodeName) {
  //   var x = 0;
  //   var xVal = el.getAttribute("x");
  //   if ( xVal ) {
  //     x = parseFloat( xVal );
  //   }
    
  //   var y = 0;
  //   var yVal = el.getAttribute("y");
  //   if ( yVal ) {
  //     y = parseFloat( yVal );
  //   }
    
  //   centerpoint.x += x;
  //   centerpoint.y += y;
  // }

  // alert(el.id + "\nx: " + centerpoint.x + "\ny: " + centerpoint.y)

  return centerpoint;
}


/*
// Helpers
*/

// adjust coordinates for transforms
// note that this changed to add the SVG root element
function local_coords ( event, element, root ) {
  var p = root.createSVGPoint();
  // p.x = +event.clientX.toFixed(2);
  // p.y = +event.clientY.toFixed(2);
  p.x = +event.clientX;
  p.y = +event.clientY;
  p = p.matrixTransform(element.getScreenCTM().inverse());

  // since SVG only works at one pixel of accuracy, limit the floats to 2 points of precison
  p.x = +p.x.toFixed(2);
  p.y = +p.y.toFixed(2);
  return p;
}   

function bind (scope, fn) {
  return function () {
    return fn.apply( scope, arguments );
  }
}